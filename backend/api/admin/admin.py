import os
from models.schema import User, UserRole, UserCreate, UserResponse, RFP , Employee , EmployeeCreate, Company
from methods.functions import get_db, require_role, get_password_hash
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends, UploadFile, File
from fastapi import APIRouter
from typing import List
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, List
from sqlalchemy.exc import SQLAlchemyError
from methods.functions import extract_text_from_docx,extract_text_from_excel,extract_text_from_pdf

from fastapi import FastAPI, UploadFile, File, Form
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores.pgvector import PGVector
from langchain_core.documents import Document


router = APIRouter(prefix="/api",tags=["Admin"])

# Admin endpoints
@router.post("/admin/create-employee")
async def create_employee(
    employee_data: EmployeeCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    hashed_password = get_password_hash(employee_data.password)
    employee = Employee(
        username=employee_data.username,
        email=employee_data.email,
        hashed_password=hashed_password,
        role=UserRole.EMPLOYEE,
        company_id=employee_data.company_id,
        created_by=current_user.id
    )
    db.add(employee_entry)
    db.commit()
    db.refresh(employee_entry)
    return {"message": "Employee created successfully", "employee_db_id": employee_entry.id}

@router.delete("/admin/remove-employee/{employee_id}")
async def remove_employee(
    employee_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
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
    employees = db.query(Employee).filter(Employee.company_id==company_id)
    return {"employees": [
        {
            "id": r.id,
            "name":r.name,
            "rfps_assigned": r.rfps_assigned
        } for r in employees
    ]}
        
@router.get("/getcompanyid/{userid}")
async def getcompanyid(
    userid: int,
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.userid == userid).first()
    return {
        "company_id":company.id
    }
    
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

@router.get("/rfp-status/{company_id}")
async def rfpStatus(
    company_id: int,
    db: Session = Depends(get_db)
):
    rfpfile = db.query(RFP).filter(RFP.company_id==company_id and RFP.status=="pending").all()
    return {"rfps": [
        {
            "id": r.id,
            "filename": r.filename,
            "content_type": r.content_type,
            "uploaded_by": r.uploaded_by
        } for r in rfpfile
    ]}

# Sample Pydantic model
class Assigned(BaseModel):
    __root__: Dict[int, List[int]]  # key = employee ID, value = list of RFP IDs

@router.post("/rfp-assigned/{company_id}")
async def rfp_status(
    temp: Assigned,
    db: Session = Depends(get_db)
):
    try:
        for emp_id, rfps in temp.__root__.items():
            employee = db.query(Employee).filter(Employee.id == emp_id).first()
            if not employee:
                continue  # or handle error

            # If rfps_assigned is None or empty, initialize it
            if not employee.rfps_assigned:
                employee.rfps_assigned = []

            # Add new RFP IDs to the existing list, avoiding duplicates
            for rfpid in rfps:
                if rfpid not in employee.rfps_assigned:
                    employee.rfps_assigned.append(rfpid)

        db.commit()

        return {
            "rfp2-employees": temp.__root__,
            "status": "Assigned"
        }
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": str(e)}



embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

raw_url = os.getenv("DATABASE_URL")
PGVECTOR_CONNECTION_STRING = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)

vectorstore = PGVector(
    collection_name="company_docs",
    connection_string=PGVECTOR_CONNECTION_STRING,
    embedding_function=embedding_model,
)


@router.post("/add-document/")
async def add_document(company_id: int = Form(...), file: UploadFile = File(...)):
    file_bytes = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(file_bytes)
    elif filename.endswith(".xlsx"):
        text = extract_text_from_excel(file_bytes)
    else:
        return {"error": "Unsupported file type. Use .pdf, .docx or .xlsx"}

    if not text.strip():
        return {"error": "No extractable text found in the document."}

    doc = Document(page_content=text, metadata={"company_id": company_id})
    vectorstore.add_documents([doc])

    return {
        "message": f"{filename} embedded for company {company_id}",
        "characters": len(text)
    }



    
    
    