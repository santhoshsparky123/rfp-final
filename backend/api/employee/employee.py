from models.schema import User, UserRole, UserCreate, UserResponse, RFP, Employee, EmployeeCreate, Company
from methods.functions import get_db, require_role, get_password_hash
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from fastapi import APIRouter
from typing import List
from fastapi.responses import StreamingResponse
from fastapi import status
from datetime import datetime
import json # Import json to handle JSON strings
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api",tags=["Admin"])

class AssignedRFPResponse(BaseModel):
    id: int
    filename: str
    created_at: str
    updated_at: str = None
    status: str
    content_type: str
    # file_data: str = None

@router.get("/employee/get_assigned_rfps/{employee_id}", response_model=List[AssignedRFPResponse])
async def get_assigned_rfps(employee_id: int, db: Session = Depends(get_db)):
    # Fetch the assigned RFPs for the given employee ID
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    # Parse rfps_assigned as a list of ints (from JSON string)
    assigned_ids = []
    if employee.rfps_assigned:
        try:
            assigned_ids = json.loads(employee.rfps_assigned)
            if not isinstance(assigned_ids, list):
                assigned_ids = []
        except Exception:
            assigned_ids = []
    arr = []
    for i in assigned_ids:
        if not isinstance(i, int):
            try:
                i = int(i)
            except Exception:
                continue
        rfp_file = db.query(RFP).filter(RFP.id == i).first()
        if rfp_file:
            arr.append({
                "id": rfp_file.id,
                "filename": rfp_file.filename,
                "created_at": rfp_file.created_at.strftime("%Y-%m-%d %H:%M:%S") if rfp_file.created_at else None,
                "updated_at": rfp_file.updated_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(rfp_file, 'updated_at') and rfp_file.updated_at else "",
                "status": rfp_file.status,
                "content_type": rfp_file.content_type,
                # "file_data": rfp_file.file_data.decode('utf-8') if rfp_file.file_data else None,
            })
    return arr

from fastapi import APIRouter
from methods.functions import Session,Depends,get_db,require_role,UserRole
from models.schema import Employee,RFP
router = APIRouter(prefix="/api")

@router.get('/get_rfp_employee/{employee_id}')
def get_rfp_employee(
    employee_id:int,
    # current_user: Employee = Depends(require_role([UserRole.EMPLOYEE])),
    db: Session = Depends(get_db)   
):
    employee = db.query(Employee).filter(Employee.id==employee_id).first()
    arr= []
    for rfp in employee.rfps_assigned:
        rfpfile = db.query(RFP).filter(RFP.id==rfp).first()
        arr.append({
            "id": rfpfile.id,
            "filename": rfpfile.filename,
            "content_type": rfpfile.content_type,
            "status": rfpfile.status,
            "uploaded_by": rfpfile.uploaded_by,
            "created_at": rfpfile.created_at,
            "file_url": rfpfile.file_url
        })
    return{
        "rfps":arr
    }
