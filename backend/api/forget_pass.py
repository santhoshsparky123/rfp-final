from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from methods.functions import get_db  # adjust import path if different
from models.schema import User  # your SQLAlchemy User model

router = APIRouter(prefix="/api")

class DirectPasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str
    confirm_password: str

@router.post("/password/direct-reset")
async def direct_reset_password(
    reset: DirectPasswordResetRequest,
    db: Session = Depends(get_db)
):
    print("passcheck")
    if reset.new_password != reset.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    user = db.query(User).filter(User.email == reset.email).first()
    if not user:
        print("emailkadeikala")
        # Optionally: to avoid enumeration, you could return success regardless.
        raise HTTPException(status_code=404, detail="User with that email not found")

    # Update password (assuming your model uses `hashed_password`)
    user.hashed_password = bcrypt.hash(reset.new_password)
    print(user.hashed_password)
    db.add(user)
    db.commit()

    return {"message": "Password updated successfully"}
