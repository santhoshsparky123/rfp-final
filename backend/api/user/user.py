import os
import httpx
import razorpay
from fastapi import APIRouter, Depends, File, Depends,HTTPException,UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from methods.functions import get_password_hash, get_db
from models.schema import User, UserRole, RFP, Company, CompanyCreate, SubscriptionStatus, OrderRequest
from methods.functions import require_role  # Make sure this import path is correct
from datetime import datetime, timedelta

router = APIRouter(prefix="/api", tags=["user"])

# ✅ Correctly define the request body using Pydantic
class Register(BaseModel):
    username: str
    password: str
    email: EmailStr  # Optional: stricter email validation

@router.post("/user/register")
async def user_register(user: Register, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(user.password)

    # ✅ Create the user ORM object
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=UserRole.USER,
    )

    # ✅ Add and commit to the database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # ✅ Refresh the correct object

    return {"message": "User created successfully", "user_id": new_user.id}

@router.post("/user/upload")
async def upload_file(
    userid: int = Form(...),
    companyid: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Fetch the company to get its subdomain
    company = db.query(Company).filter(Company.id == companyid).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    subdomain = company.subdomain + "_"
    if file.content_type not in ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF or Word files allowed.")

    file_data = await file.read()
    document = RFP(
        uploaded_by=userid,
        company_id=companyid,
        filename=subdomain + file.filename,
        content_type=file.content_type,
        file_data=file_data,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return {"message": "File uploaded successfully", "document_id": document.id}


class temp(BaseModel):
    username:str
    
@router.post("/user/test")
async def create_c(company_data: CompanyCreate,
    # current_user: User = Depends(require_role([UserRole.USER])),
    db: Session = Depends(get_db)):
    print("hello1")
    # Create Razorpay order
    # RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
    # RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

    order_payload = {
        "amount": company_data.amount,
        "currency": company_data.currency,
        "receipt": f"userid_{company_data.userid}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/create-order/",
            json=order_payload,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to create order")
        order_data = response.json()
    print("hello2")
    # Update user role
    if user := db.query(User).filter(User.id == company_data.userid).first():
        user.role = UserRole.ADMIN
        db.commit()
        db.refresh(user)
    print("hello3")
    now = datetime.now()
    new_company = Company(
        name=company_data.name,
        subdomain=company_data.subdomain,
        subscription_start=now,
        subscription_end=now+timedelta(30),
        subscription_status=SubscriptionStatus.ACTIVE,
        userid=company_data.userid
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)

    print("hello4")
    return {
        "message": "Company created successfully",
        "company_id": new_company.id,
        "order": order_data
    }
    
@router.post("/create-order/")
def create_order(order: OrderRequest):
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

    try:
        razorpay_order = razorpay_client.order.create({
            "amount": order.amount,
            "currency": order.currency,
            "receipt": order.receipt,
            "payment_capture": 1
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
    
  
    

