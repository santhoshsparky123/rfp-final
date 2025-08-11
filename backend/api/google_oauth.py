from fastapi import APIRouter, Request, HTTPException, Depends
from starlette.responses import RedirectResponse, JSONResponse
from starlette.config import Config
from authlib.integrations.starlette_client import OAuth
from methods.functions import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_db
from datetime import timedelta
from sqlalchemy.orm import Session
from models.schema import User
from pydantic import BaseModel
from passlib.hash import bcrypt
from fastapi.security import OAuth2PasswordBearer
import os
import traceback
import jwt

config = Config(".env")

oauth = OAuth(config)

google = oauth.register(
    name='google',
    client_id=config('GOOGLE_CLIENT_ID', default=None),
    client_secret=config('GOOGLE_CLIENT_SECRET', default=None),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile'},
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.get("/api/login/google")
async def login_google(request: Request):
    redirect_uri = str(request.url_for("google_auth"))
    return await google.authorize_redirect(request, redirect_uri)

from urllib.parse import urlencode

@router.get("/api/auth", name="google_auth")
async def google_auth(request: Request, db: Session = Depends(get_db)):
    try:
        token_data = await google.authorize_access_token(request)
        user_info = (await google.get("userinfo", token=token_data)).json()

        if not user_info.get("verified_email"):
            raise HTTPException(status_code=400, detail="Email not verified by Google")

        # Look for user in your DB
        user = db.query(User).filter(User.email == user_info["email"]).first()

        if not user:
            # If user doesn't exist, redirect to frontend register
            return RedirectResponse(
                f"http://localhost:3000/login?email={user_info['email']}&name={user_info['name']}"
            )

        # ✅ User exists — create JWT token
        jwt_payload = {
            "sub": user.email,
            "name": user.username,
            "role": user.role,
        }

        jwt_token = create_access_token(jwt_payload, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

        # ✅ Send token and role to frontend
        query_params = urlencode({
            "token": jwt_token,
            "email": user.email,
            "name": user.username,
            "role": user.role,
        })

        return RedirectResponse(f"http://localhost:3000/login?{query_params}")

    except Exception as e:
        print("OAuth Error:", repr(e))
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="OAuth login failed")
    
# Pydantic model for registration input
class UserRegistrationRequest(BaseModel):
    email: str
    name: str
    password: str  # plain text

@router.post("/api/register")
async def register_user(user_data: UserRegistrationRequest, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=400, detail="User already exists")

        # Hash password before storing
        hashed_pw = bcrypt.hash(user_data.password)

        new_user = User(email=user_data.email, name=user_data.name, password=hashed_pw)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {"message": "User registered successfully"}

    except Exception as e:
        print("Registration error:", e)
        raise HTTPException(status_code=500, detail="Failed to register user")

@router.get("/api/user/me")
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=["HS256"])
        email = payload.get("sub")

        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.id,
            "email": user.email,
            "name": user.username,
            "role": user.role,
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
