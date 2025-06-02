from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional
from datetime import datetime

RFP_STORE = []
# Pydantic models
class RFPData(BaseModel):
    success: bool
    rfp_data: Dict[str, Any]

class ToolOutput(BaseModel):
    content: str
    source: str

class AgentResponse(BaseModel):
    rfp_id: str
    section_responses: Dict[str, str]
    full_proposal: str
    download_urls: Dict[str, str]

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # "superadmin", "admin", "employee", "user"
    access_start: Optional[datetime] = None
    access_end: Optional[datetime] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
