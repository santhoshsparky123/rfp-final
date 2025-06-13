import os
import hmac
import hashlib
import uuid
from datetime import datetime, timedelta

from fastapi import (
    APIRouter, Depends, File, HTTPException,
    UploadFile, Form, Request
)
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import httpx
import razorpay

from methods.functions import get_password_hash, get_db
from models.schema import User, UserRole, RFP, Company, CompanyCreate, SubscriptionStatus, OrderRequest
from methods.functions import require_role  # Make sure this import path is correct
from datetime import datetime, timedelta
import boto3
import uuid

router = APIRouter(prefix="/api", tags=["user"])

# -----------------------------------
# Pydantic models
# -----------------------------------
class Register(BaseModel):
    username: str
    password: str
    email: EmailStr


# -----------------------------------
# User Registration
# -----------------------------------
@router.post("/user/register")
async def user_register(user: Register, db: Session = Depends(get_db)):
    try:
        hashed_password = get_password_hash(user.password)
        new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            role=UserRole.USER,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User created successfully", "user_id": new_user.id}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"User already exits")

# -----------------------------------
# File Upload
# -----------------------------------
@router.post("/user/upload")
async def upload_file(
    userid: int = Form(...),
    companyid: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == companyid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    subdomain = company.subdomain + "_"
    if file.content_type not in ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF or Word files allowed.")


    AWS_ACCESS_KEY_ID = os.getenv("ACCESS_KEY_AWS")
    AWS_SECRET_ACCESS_KEY = os.getenv("SECRET_KEY_AWS")
    BUCKET_NAME = "rfp-storage-bucket"
    REGION = "us-east-1"  # use your S3 bucket region

    s3 = boto3.client(
        "s3",
        region_name=REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

    unique_filename = f"{uuid.uuid4()}.{subdomain + file.filename}"
    
    # Upload to S3
    s3.upload_fileobj(
        file.file,
        BUCKET_NAME,
        unique_filename,
        ExtraArgs={
            "ContentType": file.content_type
        }
        # Removed ExtraArgs={"ACL": "public-read"} due to ACLs not supported
    )

    file_url = f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{unique_filename}"
    
    document = RFP(
        uploaded_by=userid,
        company_id=companyid,
        filename=unique_filename,
        content_type=file.content_type,
        file_url=file_url,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return {
        "user_id":userid,
        "company_id":companyid,
        "file_url": file_url
    }


# -----------------------------------
# Create Razorpay Order
# -----------------------------------
@router.post("/create-order/")
def create_order(order: OrderRequest):
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

    notes = {
        "userid": str(order.userid),
        "company_name": order.company_name,
        "subdomain": order.subdomain,
        "amount": str(order.amount),
        "currency": order.currency
    }

    try:
        razorpay_order = client.order.create({
            "amount": order.amount,
            "currency": order.currency,
            "receipt": order.receipt,
            "payment_capture": 1,
            "notes": notes
        })
        return {
            "order_id": razorpay_order["id"],
            "razorpay_key": RAZORPAY_KEY_ID,
            "amount": order.amount,
            "currency": order.currency
        }
    except Exception as e:
        print("hello")
        raise HTTPException(status_code=500, detail=f"Payment order creation failed: {e}")




