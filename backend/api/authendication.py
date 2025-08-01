from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from models.schema import User, Token, Employee
from methods.functions import get_db, verify_password, create_access_token,ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

# Authentication endpoints
@router.post("/auth/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Hardcoded superadmin bypass
    if request.email == "superadmin@gmail.com" and request.password == "123456":
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": "superadmin@gmail.com"}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": 0,
            "role": "super_admin",
        }
    
    user = db.query(User).filter(User.email == request.email).first()
    print("hello hello")
    if not user or not verify_password(request.password, user.hashed_password):
        employee = db.query(Employee).filter(Employee.name == request.email).first()
        print("hi")
        if not employee or not verify_password(request.password, employee.hashed_password):
            print("hello")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": employee.name}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": employee.id,
            "role": employee.role,
        }
    else:
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "role": user.role,
        }