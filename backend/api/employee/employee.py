# # employee.py
# from models.schema import User, UserRole, UserCreate, UserResponse, RFP, Employee, EmployeeCreate, Company
# from methods.functions import get_db, require_role, get_password_hash
# from sqlalchemy.orm import Session
# from fastapi import HTTPException, Depends
# from fastapi import APIRouter
# from typing import List
# from fastapi.responses import StreamingResponse
# from fastapi import status
# from datetime import datetime
# import json
# from pydantic import BaseModel
# from typing import Optional
# from fastapi import Request

# router = APIRouter(prefix="/api", tags=["Employee"])

# # In-memory dictionary to store current_rfp_id for each employee
# # {employee_id: rfp_id}
# current_rfp_ids_in_memory: dict[int, int] = {}

# class AssignedRFPResponse(BaseModel):
#     id: int
#     filename: str
#     created_at: str
#     updated_at: str = None
#     status: str
#     content_type: str

# @router.get("/employee/get_assigned_rfps/{employee_id}")
# async def get_assigned_rfps(employee_id: int, db: Session = Depends(get_db)):
#     employee = db.query(Employee).filter(Employee.id == employee_id).first()
#     if not employee:
#         return {"rfps": []}
#     assigned_ids = employee.rfps_assigned
#     if isinstance(assigned_ids, str):
#         try:
#             assigned_ids = json.loads(assigned_ids)
#         except Exception:
#             assigned_ids = []
#     if not isinstance(assigned_ids, list):
#         assigned_ids = []
#     arr = []
#     for i in assigned_ids:
#         try:
#             i = int(i)
#         except Exception:
#             continue
#         rfp_file = db.query(RFP).filter(RFP.id == i).first()
#         if rfp_file:
#             arr.append({
#                 "id": rfp_file.id,
#                 "filename": rfp_file.filename,
#                 "created_at": rfp_file.created_at.strftime("%Y-%m-%d %H:%M:%S") if rfp_file.created_at else None,
#                 "updated_at": rfp_file.updated_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(rfp_file, 'updated_at') and rfp_file.updated_at else "",
#                 "status": rfp_file.status,
#                 "content_type": rfp_file.content_type,
#                 "file_url": rfp_file.file_url if hasattr(rfp_file, 'file_url') else None
#             })
#     if not arr:
#         print(f"No RFPs found for employee {employee_id}. rfps_assigned: {assigned_ids}")
#     return {"rfps": arr}

# @router.get('/get_rfp_employee/{employee_id}')
# def get_rfp_employee(
#     employee_id: int,
#     db: Session = Depends(get_db)
# ):
#     employee = db.query(Employee).filter(Employee.id == employee_id).first()
#     if not employee:
#         return {"rfps": []}
#     rfps_assigned = employee.rfps_assigned
#     if isinstance(rfps_assigned, str):
#         try:
#             rfps_assigned = json.loads(rfps_assigned)
#         except Exception:
#             rfps_assigned = []
#     if not isinstance(rfps_assigned, list):
#         rfps_assigned = []
#     arr = []
#     for rfp_id in rfps_assigned:
#         try:
#             rfp_id = int(rfp_id)
#         except Exception:
#             continue
#         rfpfile = db.query(RFP).filter(RFP.id == rfp_id).first()
#         if rfpfile:
#             arr.append({
#                 "id": rfpfile.id,
#                 "filename": rfpfile.filename,
#                 "content_type": rfpfile.content_type,
#                 "status": rfpfile.status,
#                 "uploaded_by": rfpfile.uploaded_by,
#                 "created_at": rfpfile.created_at,
#                 "file_url": rfpfile.file_url
#             })
#     return {"rfps": arr}

# @router.post('/set_current_rfp/{employee_id}')
# def set_current_rfp(
#     employee_id: int,
#     rfp_id: int,
#     db: Session = Depends(get_db)
# ):
#     employee = db.query(Employee).filter(Employee.id == employee_id).first()
#     if not employee:
#         raise HTTPException(status_code=404, detail="Employee not found")

#     # Store in the in-memory variable
#     current_rfp_ids_in_memory[employee_id] = rfp_id
#     print(f"Stored in memory: Employee {employee_id} -> RFP {rfp_id}")
#     return {"message": "Current RFP ID set successfully (in-memory)", "current_rfp_id": rfp_id}

# @router.get('/get_rfp_filename_by_current/{employee_id}')
# def get_rfp_filename_by_current(
#     employee_id: int,
#     db: Session = Depends(get_db)
# ):
#     employee = db.query(Employee).filter(Employee.id == employee_id).first()
#     if not employee:
#         raise HTTPException(status_code=404, detail="Employee not found")

#     # Retrieve from the in-memory variable
#     rfp_id = current_rfp_ids_in_memory.get(employee_id)

#     if rfp_id is None:
#         raise HTTPException(status_code=404, detail="No current RFP ID set for employee in memory")
#     rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
#     if not rfp:
#         raise HTTPException(status_code=404, detail="RFP not found")
#     return {"company_id": employee.company_id, "rfp_id": rfp_id, "filename": rfp.filename, "file_url": rfp.file_url}

# employee.py
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


# @router.get('/get_rfp_filename_by_current/{employee_id}')
# def get_rfp_filename_by_current(
#     employee_id: int,
#     db: Session = Depends(get_db)
# ):
#     employee = db.query(Employee).filter(Employee.id == employee_id).first()
#     if not employee:
#         raise HTTPException(status_code=404, detail="Employee not found")

#     rfp_id = current_rfp_ids_in_memory.get(employee_id)
#     if not rfp_id:
#         raise HTTPException(status_code=404, detail="No current RFP set for this employee")

#     rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
#     if not rfp:
#         raise HTTPException(status_code=404, detail="RFP not found")
    
#     # Assuming company_id is available through the RFP or associated Company model
#     # For this example, let's assume RFP has a company_id or we fetch it from the employee's company
#     company_id = None
#     if employee.company_id:
#         company_id = employee.company_id # Assuming employee has a company_id

#     return {
#         "rfp_id": rfp.id,
#         "filename": rfp.filename,
#         "file_url": rfp.file_url,
#         "company_id": company_id # Include company_id
#     }

# @router.get('/get_upload_context_by_file')
# def get_upload_context_by_file(
#     employee_id: int,
#     filename: str,
#     file_url: str,
#     db: Session = Depends(get_db)
# ):
#     """
#     Retrieves the rfp_id and company_id based on filename and file_url for a given employee.
#     This is used when a 'View' or 'Process' button is clicked from the assigned RFPs list.
#     """
#     employee = db.query(Employee).filter(Employee.id == employee_id).first()
#     if not employee:
#         raise HTTPException(status_code=404, detail="Employee not found")

#     # Assuming 'file_url' is unique enough or can be combined with filename
#     # to find the specific RFP. Adjust query as needed based on your DB schema.
#     rfp = db.query(RFP).filter(RFP.filename == filename, RFP.file_url == file_url).first()

#     if not rfp:
#         raise HTTPException(status_code=404, detail="RFP not found with the given filename and file_url")
    
#     company_id = employee.company_id # Assuming employee has a company_id associated

#     return {
#         "rfp_id": rfp.id,
#         "company_id": company_id
#     }

# @router.put("/rfp/{rfp_id}/complete")
# async def mark_rfp_completed(
#     rfp_id: int,
#     db: Session = Depends(get_db)
# ):
#     """
#     Marks an RFP as 'completed'.
#     """
#     rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
#     if not rfp:
#         raise HTTPException(status_code=404, detail="RFP not found")

#     rfp.status = "completed"
#     rfp.updated_at = datetime.now()
#     db.commit()
#     db.refresh(rfp)
    
#     return {"message": f"RFP {rfp_id} marked as completed", "rfp_status": rfp.status}