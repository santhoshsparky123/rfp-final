import os
from models.schema import User, UserRole, UserCreate, UserResponse, RFP , Employee , EmployeeCreate, Company
from methods.functions import get_db, require_role, get_password_hash
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends, UploadFile, File
from fastapi import APIRouter
from typing import List
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, RootModel
from typing import Dict, List
from sqlalchemy.exc import SQLAlchemyError
from methods.functions import extract_text_from_docx,extract_text_from_excel,extract_text_from_pdf_bytes
import datetime 
import json
from dotenv import load_dotenv
router = APIRouter(prefix="/api",tags=["Admin"])
load_dotenv()
@router.post("admin/change-password")
def edit_profile(admin_id:int,
            db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.role == admin).all()
    return 