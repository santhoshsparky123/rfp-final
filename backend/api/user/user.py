from fastapi import APIRouter, Depends, File, Depends,HTTPException,UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from methods.functions import get_password_hash, get_db
from models.schema import User, UserRole, RFP, Company
from methods.functions import require_role  # Make sure this import path is correct

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

@router.post("/create-company")
async def create_company(
    company:Company,
    db: Session = Depends(get_db)
):
    
  
    

