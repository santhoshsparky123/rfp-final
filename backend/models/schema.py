from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum, LargeBinary
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from enum import Enum
from sqlalchemy.dialects.postgresql import JSONB  # Only if you're using PostgreSQL
from pgvector.sqlalchemy import Vector
from sqlalchemy.ext.mutable import MutableList



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
    userid = Column(Integer, ForeignKey("users.id"))
    # # Relationships
    # admin = relationship("User", back_populates="company", foreign_keys="User.company_id")
    # employees = relationship("User", back_populates="company", foreign_keys="User.company_id")
    # rfps = relationship("RFP", back_populates="company")
    # userid = Column(Integer, ForeignKey("users.id"))
    # # Relationships
    # admin = relationship("User", back_populates="company", foreign_keys="User.company_id")
    # employees = relationship("User", back_populates="company", foreign_keys="User.company_id")
    # rfps = relationship("RFP", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    # company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # # Relationships
    # company = relationship("Company", back_populates="employees")
    # # Relationships
    # company = relationship("Company", back_populates="employees")

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
    created_at = Column(DateTime, default=datetime.now)
    file_url = Column(String)
    docx_url = Column(String)
    pdf_url = Column(String)
    message = Column(MutableList.as_mutable(JSON), default=list)  # Store messages as a list of dictionaries


class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)    
    company_id = Column(Integer, ForeignKey("companies.id"))
    rfps_assigned = Column(MutableList.as_mutable(JSON), default=list)
    rfps_finished = Column(MutableList.as_mutable(JSON), default=list)  # <-- add this line
    created_at = Column(DateTime, default=datetime.utcnow)
    role = Column(String ,default="employee")
    # Relationships
    # company = relationship("Company", back_populates="employees")

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole

class EmployeeCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    company_id: int

class CompanyCreate(BaseModel):
    name: str
    subdomain: str
    no_of_employee: int
    amount: int
    userid: int
    currency: str

from pydantic import BaseModel

class OrderRequest(BaseModel):
    amount: int
    currency: str
    receipt: str
    userid: int
    company_name: str
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

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    company_id: Optional[int] = None
    created_at: datetime
    
class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str
    company_id: Optional[int] = None
    created_at: datetime