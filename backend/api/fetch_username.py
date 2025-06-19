from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from models.schema import User,Company
from methods.functions import get_db

router = APIRouter(prefix="/api")

@router.get("/fetch-username/{user_id}")
def fetch_username(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return {"username": user.username}
    return {"error": "User not found"}