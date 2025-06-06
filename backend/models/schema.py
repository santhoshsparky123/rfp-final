from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from enum import Enum

Base = declarative_base()

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
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="employees")

class RFP(Base):
    __tablename__ = "rfps"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    # description = Column(Text)
    # file_path = Column(String)
    content_type = Column(String)
    status = Column(String, default="pending")
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    # response_content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    file_data = Column(LargeBinary)
    # Relationships
    company = relationship("Company", back_populates="rfps")
    uploader = relationship("User")


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