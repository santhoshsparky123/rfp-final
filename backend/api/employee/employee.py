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
