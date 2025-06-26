# employee.py
from models.schema import User, UserRole, UserCreate, UserResponse, RFP, Employee, EmployeeCreate, Company
from methods.functions import get_db, require_role, get_password_hash
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from fastapi import APIRouter
from typing import List, Optional
from fastapi.responses import StreamingResponse
from fastapi import status, Request
from datetime import datetime
import json
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["Employee"])

# In-memory dictionary to store current_rfp_id for each employee
# {employee_id: rfp_id}
current_rfp_ids_in_memory: dict[int, int] = {}
current_rfp_context_in_memory: dict[int, dict] = {} # {employee_id: {rfp_id, company_id, filename, file_url}}


class AssignedRFPResponse(BaseModel):
    id: int
    filename: str
    created_at: str
    updated_at: Optional[str] = None
    status: str
    content_type: str
    file_url: str # Ensure file_url is part of the response model

@router.get("/employee/get_assigned_rfps/{employee_id}", response_model=dict)
async def get_assigned_rfps(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return {"rfps": []}
    
    assigned_ids = employee.rfps_assigned
    
    # Handle both JSON string and already parsed list
    if isinstance(assigned_ids, str):
        try:
            assigned_ids = json.loads(assigned_ids)
        except json.JSONDecodeError:
            assigned_ids = []
    elif assigned_ids is None:
        assigned_ids = []

    arr = []
    # Fetch RFP details for each assigned ID
    rfp_files = db.query(RFP).filter(RFP.id.in_(assigned_ids)).all()
    for rfpfile in rfp_files:
        arr.append({
            "id": rfpfile.id,
            "filename": rfpfile.filename,
            "content_type": rfpfile.content_type,
            "status": rfpfile.status,
            "created_at": rfpfile.created_at.isoformat() if rfpfile.created_at else None,
            "file_url": rfpfile.file_url # Include file_url
        })
    return {"rfps": arr}


@router.post('/set_current_rfp/{employee_id}')
def set_current_rfp(
    employee_id: int,
    rfp_id: int,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Store in the in-memory variable
    current_rfp_ids_in_memory[employee_id] = rfp_id
    print(f"Stored in memory: Employee {employee_id} -> RFP {rfp_id}")
    return {"message": "Current RFP ID set successfully (in-memory)", "current_rfp_id": rfp_id}


@router.get("/employee/completed_rfps/{employee_id}")
def get_completed_rfps_by_employee(employee_id: int, db: Session = Depends(get_db)):
    """
    Returns all RFPs completed by the employee (using rfps_finished column).
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        print(f"No employee found for id {employee_id}")
        return {"rfps": []}
    finished_ids = getattr(employee, 'rfps_finished', None)
    print(f"Raw rfps_finished for employee {employee_id}: {finished_ids}")
    if isinstance(finished_ids, str):
        try:
            finished_ids = json.loads(finished_ids)
        except Exception as e:
            print(f"Error parsing rfps_finished: {e}")
            finished_ids = []
    if not isinstance(finished_ids, list):
        finished_ids = []
    print(f"Parsed rfps_finished for employee {employee_id}: {finished_ids}")
    arr = []
    if finished_ids:
        rfp_files = db.query(RFP).filter(RFP.id.in_(finished_ids)).all()
        print(f"Found {len(rfp_files)} finished RFPs for employee {employee_id}")
        for rfpfile in rfp_files:
            arr.append({
                "filename": getattr(rfpfile, "filename", None)
            })
    print(f"Response for finished RFPs: {arr}")
    return {"rfps": arr}