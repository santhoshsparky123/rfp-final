from models.schema import User, UserRole, UserCreate, UserResponse, RFP   
from methods.functions import get_db, require_role, get_password_hash
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from fastapi import APIRouter
from typing import List
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api",tags=["Admin"])

# Admin endpoints
@router.post("/admin/create-employee")
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

@router.delete("/admin/remove-employee/{employee_id}")
async def remove_employee(
    employee_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    employee = db.query(User).filter(
        User.id == employee_id,
        User.role == UserRole.EMPLOYEE
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee.is_active = False
    db.commit()
    
    return {"message": "Employee removed successfully"}

@router.get("/admin/employees", response_model=List[UserResponse])
async def get_employees(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    employees = db.query(User).filter(
        User.role == UserRole.EMPLOYEE,
    ).all()
    
    return employees

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
