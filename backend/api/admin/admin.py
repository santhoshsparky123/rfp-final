from models.schema import User, UserRole, UserCreate, UserResponse, RFP, Employee, EmployeeCreate, Company
from methods.functions import get_db, require_role, get_password_hash
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from fastapi import APIRouter
from typing import List
from fastapi.responses import StreamingResponse
from datetime import datetime
import json # Import json to handle JSON strings
from fastapi import status

router = APIRouter(prefix="/api",tags=["Admin"])

# Admin endpoints
@router.post("/admin/create-employee")
async def create_employee(
    employee_data: EmployeeCreate,
    # current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    hashed_password = get_password_hash(employee_data.password)
    # # Add to User table
    # employee = Employee(
    #     username=employee_data.username,
    #     email=employee_data.email,
    #     hashed_password=hashed_password,
    #     role=UserRole.EMPLOYEE,
    #     company_id=current_user.company_id,  # Uncomment if you add company_id to User
    #     # created_by=current_user.id           # Uncomment if you add created_by to User
    # )
    # db.add(employee)
    # db.commit()
    # db.refresh(employee)
    # Add to Employee table
    employee_entry = Employee(
        name=employee_data.username,
        email=employee_data.email,
        hashed_password=hashed_password,
        role=UserRole.EMPLOYEE,
        company_id=employee_data.company_id,  # Assuming current_user has company_id

        created_at=datetime.now()
    )
    db.add(employee_entry)
    db.commit()
    db.refresh(employee_entry)
    return {"message": "Employee created successfully", "employee_db_id": employee_entry.id}

@router.delete("/admin/remove-employee/{employee_id}")
async def remove_employee(
    employee_id: int,
    # current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()

    return {"message": "Employee removed successfully"}


@router.get("/all-employee/{company_id}")
async def allEmployee(
    company_id:int,
    db:Session = Depends(get_db)
):
    employees = db.query(Employee).filter(Employee.company_id==company_id).all() # Added .all() to fetch all results
    return {"employees": [
        {
            "id": r.id,
            "name": r.name,
            "email": r.email, # Added email for display
            "rfps_assigned": json.loads(r.rfps_assigned) if r.rfps_assigned else [], # Parse JSON string
            "created_at": r.created_at.isoformat() if r.created_at else None # Add created_at
        } for r in employees
    ]}

@router.get("/company_id/{user_id}")
async def get_company_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.userid == user_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"company_id": company.id}

@router.get("/get_rfps/{companyid}")
async def getrfps(
    companyid: int,
    # current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.EMPLOYEE])),
    db: Session = Depends(get_db)
):
    rfps = db.query(RFP).filter(RFP.company_id == companyid).all()
    return {"rfps": [
        {
            "id": r.id,
            "filename": r.filename,
            "content_type": r.content_type,
            "status": r.status,
            "uploaded_by": r.uploaded_by,
            "created_at": r.created_at
        } for r in rfps
    ]}

@router.get("/get_rfp/{rfpid}")
async def getrfp(
    rfpid: int,
    db: Session = Depends(get_db)
):
    rfpfile = db.query(RFP).filter(RFP.id == rfpid).first()
    if not rfpfile or not rfpfile.file_data:
        raise HTTPException(status_code=404, detail="RFP file not found")
    return StreamingResponse(
        iter([rfpfile.file_data]),
        media_type=rfpfile.content_type,
        headers={"Content-Disposition": f"attachment; filename={rfpfile.filename}"}
    )

@router.post("/admin/assign-rfp-to-employee/{employee_id}/{rfp_id}")
async def assign_rfp_to_employee(
    employee_id: int,
    rfp_id: int,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    # Assuming rfps_assigned is a JSON string of a list of RFP IDs
    current_assigned_rfps = json.loads(employee.rfps_assigned) if employee.rfps_assigned else []

    if rfp_id not in current_assigned_rfps:
        current_assigned_rfps.append(rfp_id)
        employee.rfps_assigned = json.dumps(current_assigned_rfps)
        # Set RFP status to 'assigned' when assigned
        rfp.status = "assigned"
        db.add(employee)
        db.add(rfp)
        db.commit()
        db.refresh(employee)
        db.refresh(rfp)
        return {"message": f"RFP {rfp_id} assigned to employee {employee_id} successfully."}
    else:
        raise HTTPException(status_code=409, detail=f"RFP {rfp_id} already assigned to employee {employee_id}.")

@router.post("/admin/unassign-rfp/{employee_id}/{rfp_id}")
async def unassign_rfp_from_employee(
    employee_id: int,
    rfp_id: int,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    current_assigned_rfps = json.loads(employee.rfps_assigned) if employee.rfps_assigned else []

    if rfp_id in current_assigned_rfps:
        current_assigned_rfps.remove(rfp_id)
        employee.rfps_assigned = json.dumps(current_assigned_rfps)
        db.add(employee)
        db.commit()
        db.refresh(employee)

        # Optionally, update the RFP status to "pending'
        rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
        if rfp:
            rfp.status = "pending"
            db.add(rfp)
            db.commit()
            db.refresh(rfp)

        return {"message": f"RFP {rfp_id} pending from employee {employee_id} successfully."}
    else:
        raise HTTPException(status_code=404, detail=f"RFP {rfp_id} not assigned to employee {employee_id}.")