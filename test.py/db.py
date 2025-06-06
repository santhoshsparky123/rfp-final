# Multi-Tenant RFP Platform Backend System
# FastAPI + JWT Authentication + PostgreSQL

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from enum import Enum
import os
from pathlib import Path

# Configuration
DATABASE_URL = "postgresql://username:password@localhost/rfp_platform"
SECRET_KEY = "your-secret-key-here"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Security
security = HTTPBearer()

# FastAPI app
app = FastAPI(title="Multi-Tenant RFP Platform API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    EMPLOYEE = "employee"
    USER = "user"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"

# Database Models
class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    subdomain = Column(String, unique=True, index=True)
    subscription_start = Column(DateTime)
    subscription_end = Column(DateTime)
    subscription_status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    admin = relationship("User", back_populates="company", foreign_keys="User.company_id")
    employees = relationship("User", back_populates="company", foreign_keys="User.company_id")
    rfps = relationship("RFP", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SQLEnum(UserRole))
    is_active = Column(Boolean, default=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="admin", foreign_keys=[company_id])
    created_users = relationship("User", remote_side=[id])

class RFP(Base):
    __tablename__ = "rfps"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    file_path = Column(String)
    status = Column(String, default="pending")
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    response_content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="rfps")
    uploader = relationship("User")

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole

class CompanyCreate(BaseModel):
    name: str
    subdomain: str

class SubscriptionUpdate(BaseModel):
    months: int

class RFPCreate(BaseModel):
    title: str
    description: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    company_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    company_id: Optional[int] = None
    created_at: datetime

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    # Check if user's company subscription is active (for non-super-admin users)
    if user.role != UserRole.SUPER_ADMIN and user.company_id:
        company = db.query(Company).filter(Company.id == user.company_id).first()
        if not company or company.subscription_status != SubscriptionStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Company subscription expired or inactive"
            )
    
    return user

def require_role(required_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

def get_company_from_subdomain(subdomain: str, db: Session):
    company = db.query(Company).filter(Company.subdomain == subdomain).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    if company.subscription_status != SubscriptionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company subscription expired"
        )
    return company

# Authentication endpoints
@app.post("/auth/login", response_model=Token)
async def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "company_id": user.company_id
    }

# Super Admin endpoints
@app.post("/super-admin/create-admin")
async def create_admin(
    admin_data: UserCreate,
    company_data: CompanyCreate,
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    # Check if subdomain is available
    existing_company = db.query(Company).filter(Company.subdomain == company_data.subdomain).first()
    if existing_company:
        raise HTTPException(status_code=400, detail="Subdomain already exists")
    
    # Create company
    company = Company(
        name=company_data.name,
        subdomain=company_data.subdomain,
        subscription_status=SubscriptionStatus.SUSPENDED  # Initially suspended until payment
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    
    # Create admin user
    hashed_password = get_password_hash(admin_data.password)
    admin_user = User(
        username=admin_data.username,
        email=admin_data.email,
        hashed_password=hashed_password,
        role=UserRole.ADMIN,
        company_id=company.id,
        created_by=current_user.id
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    return {"message": "Admin created successfully", "company_id": company.id, "admin_id": admin_user.id}

@app.post("/super-admin/activate-subscription/{company_id}")
async def activate_subscription(
    company_id: int,
    subscription_data: SubscriptionUpdate,
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Set subscription period
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=subscription_data.months * 30)
    
    company.subscription_start = start_date
    company.subscription_end = end_date
    company.subscription_status = SubscriptionStatus.ACTIVE
    
    db.commit()
    
    return {"message": "Subscription activated", "expires_at": end_date}

# Admin endpoints
@app.post("/admin/create-employee")
async def create_employee(
    employee_data: UserCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    hashed_password = get_password_hash(employee_data.password)
    employee = User(
        username=employee_data.username,
        email=employee_data.email,
        hashed_password=hashed_password,
        role=UserRole.EMPLOYEE,
        company_id=current_user.company_id,
        created_by=current_user.id
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    
    return {"message": "Employee created successfully", "employee_id": employee.id}

# @app.post("/admin/create-user")
# async def create_user(
#     user_data: UserCreate,
#     current_user: User = Depends(require_role([UserRole.ADMIN])),
#     db: Session = Depends(get_db)
# ):
#     hashed_password = get_password_hash(user_data.password)
#     user = User(
#         username=user_data.username,
#         email=user_data.email,
#         hashed_password=hashed_password,
#         role=UserRole.USER,
#         company_id=current_user.company_id,
#         created_by=current_user.id
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)
    
#     return {"message": "User created successfully", "user_id": user.id}

@app.delete("/admin/remove-employee/{employee_id}")
async def remove_employee(
    employee_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    employee = db.query(User).filter(
        User.id == employee_id,
        User.company_id == current_user.company_id,
        User.role == UserRole.EMPLOYEE
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee.is_active = False
    db.commit()
    
    return {"message": "Employee removed successfully"}

@app.get("/admin/employees", response_model=List[UserResponse])
async def get_employees(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    employees = db.query(User).filter(
        User.company_id == current_user.company_id,
        User.role == UserRole.EMPLOYEE,
        User.is_active == True
    ).all()
    
    return employees

# Multi-tenant RFP endpoints
@app.post("/{subdomain}/rfp/upload")
async def upload_rfp(
    subdomain: str,
    rfp_data: RFPCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify company exists and is active
    company = get_company_from_subdomain(subdomain, db)
    
    # Check if user belongs to this company or is a general user
    if current_user.role == UserRole.USER and current_user.company_id != company.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    rfp = RFP(
        title=rfp_data.title,
        description=rfp_data.description,
        uploaded_by=current_user.id,
        company_id=company.id
    )
    db.add(rfp)
    db.commit()
    db.refresh(rfp)
    
    return {"message": "RFP uploaded successfully", "rfp_id": rfp.id}

@app.get("/{subdomain}/rfps")
async def get_company_rfps(
    subdomain: str,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.EMPLOYEE])),
    db: Session = Depends(get_db)
):
    company = get_company_from_subdomain(subdomain, db)
    
    # Check if user belongs to this company
    if current_user.company_id != company.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    rfps = db.query(RFP).filter(RFP.company_id == company.id).all()
    return rfps

@app.post("/{subdomain}/rfp/{rfp_id}/respond")
async def respond_to_rfp(
    subdomain: str,
    rfp_id: int,
    response: str,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.EMPLOYEE])),
    db: Session = Depends(get_db)
):
    company = get_company_from_subdomain(subdomain, db)
    
    if current_user.company_id != company.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    rfp = db.query(RFP).filter(RFP.id == rfp_id, RFP.company_id == company.id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    
    rfp.response_content = response
    rfp.status = "responded"
    db.commit()
    
    return {"message": "Response saved successfully"}

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)