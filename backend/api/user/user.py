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
from models.schema import (
    User, UserRole, RFP, Company, CompanyCreate,
    SubscriptionStatus, OrderRequest
)

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

    if file.content_type not in [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        raise HTTPException(status_code=400, detail="Invalid file type.")

    file_data = await file.read()
    document = RFP(
        uploaded_by=userid,
        company_id=companyid,
        filename=f"{company.subdomain}_{file.filename}",
        content_type=file.content_type,
        file_data=file_data,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return {"message": "File uploaded successfully", "document_id": document.id}


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
        raise HTTPException(status_code=500, detail=f"Order creation failed: {e}")

@router.post("/payment/verify")
def verify_payment(payload: dict, db: Session = Depends(get_db)):
    try:
        # Step 1: Verify signature
        order_id = payload["razorpay_order_id"]
        payment_id = payload["razorpay_payment_id"]
        signature = payload["razorpay_signature"]

        expected_signature = hmac.new(
            bytes(os.getenv("RAZORPAY_KEY_SECRET"), 'utf-8'),
            bytes(f"{order_id}|{payment_id}", 'utf-8'),
            hashlib.sha256
        ).hexdigest()

        if expected_signature != signature:
            raise HTTPException(status_code=400, detail="Invalid Razorpay signature")

        # Step 2: Add to DB (only now)
        now = datetime.utcnow()
        subdomain = payload["subdomain"]
        company_name = payload["company_name"]
        userid = payload["userid"]

        existing = db.query(Company).filter(Company.subdomain == subdomain).first()
        if not existing:
            new_company = Company(
                name=company_name,
                subdomain=subdomain,
                subscription_start=now,
                subscription_end=now + timedelta(days=30),
                subscription_status=SubscriptionStatus.ACTIVE,
                userid=userid
            )
            db.add(new_company)

        user = db.query(User).filter(User.id == userid).first()
        if user and user.role != UserRole.ADMIN:
            user.role = UserRole.ADMIN

        db.commit()
        return {"message": "Payment verified. Company activated."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Payment verification or DB commit failed: {str(e)}")

@router.post("/user/test")
async def initiate_payment(order_data: dict, db: Session = Depends(get_db)):
    # Step 1: Create Razorpay Order
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/create-order/",
            json={
                "userid": order_data["userid"],
                "amount": order_data["amount"],
                "currency": order_data["currency"],
                "receipt": order_data["receipt"],
                "company_name": order_data["company_name"],
                "subdomain": order_data["subdomain"]
            }
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to create Razorpay order")
        razorpay_order = response.json()

    # Step 2: Only create company/user in DB if payment_id and signature are present (i.e., after payment)
    if order_data.get("razorpay_payment_id") and order_data.get("razorpay_signature") and order_data.get("razorpay_order_id"):
        # Step 3: Verify payment
        verify_payload = {
            "razorpay_order_id": order_data["razorpay_order_id"],
            "razorpay_payment_id": order_data["razorpay_payment_id"],
            "razorpay_signature": order_data["razorpay_signature"]
        }
        async with httpx.AsyncClient() as client:
            verify_response = await client.post("http://localhost:8000/api/payment/verify", json=verify_payload)
            if verify_response.status_code != 200:
                db.rollback()
                raise HTTPException(status_code=500, detail="Payment not verified. DB rolled back.")
        # Step 4: Add to DB
        today = datetime.utcnow().date()
        company = db.query(Company).filter(Company.subdomain == order_data["subdomain"]).first()
        if not company:
            new_company = Company(
                name=order_data["company_name"],
                subdomain=order_data["subdomain"],
                subscription_start=today,
                subscription_end=today + timedelta(days=30),
                subscription_status=SubscriptionStatus.ACTIVE,
                userid=order_data["userid"]
            )
            db.add(new_company)
        user = db.query(User).filter(User.id == order_data["userid"]).first()
        if user and user.role != UserRole.ADMIN:
            user.role = UserRole.ADMIN
        db.commit()
        return {"message": "Company added and payment verified.", "order_id": order_data["razorpay_order_id"]}
    else:
        # Only return order details for frontend to proceed with payment
        return {
            "message": "Order created. Complete payment to activate subscription.",
            "order": razorpay_order
        }
