import os
from models.schema import User, UserRole, UserCreate, UserResponse, RFP , Employee , EmployeeCreate, Company
from methods.functions import get_db, require_role, get_password_hash
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends, UploadFile, File
from fastapi import APIRouter
from typing import List
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, RootModel
from typing import Dict, List
from sqlalchemy.exc import SQLAlchemyError
from methods.functions import extract_text_from_docx,extract_text_from_excel,extract_text_from_pdf_bytes
import datetime 
import json

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
# from langchain.embeddings import HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.vectorstores.pgvector import PGVector
from langchain_core.documents import Document


load_dotenv()
router = APIRouter(prefix="/api",tags=["Admin"])

@router.post("/admin/create-employee")
async def create_employee(
    employee_data: EmployeeCreate,
    # current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    hashed_password = get_password_hash(employee_data.password)
    
    employee_entry = Employee(
        name=employee_data.username,
        email=employee_data.email,
        hashed_password=hashed_password,
        company_id=employee_data.company_id,  # Assuming current_user has company_id
        created_at=datetime.datetime.utcnow()
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
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Set all assigned RFPs to pending and remove from employee
    if employee.rfps_assigned:
        for rfp_id in list(employee.rfps_assigned):
            rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
            if rfp:
                rfp.status = "pending"
                db.add(rfp)
        employee.rfps_assigned = []
        db.add(employee)
        db.commit()
        db.refresh(employee)

    db.delete(employee)
    db.commit()
    return {"message": "Employee removed successfully and all assigned RFPs set to pending."}


@router.get("/all-employee/{company_id}")
async def allEmployee(
    company_id:int,
    db:Session = Depends(get_db)
):
    employees = db.query(Employee).filter(Employee.company_id==company_id).all()
    return {"employees": [
        {
            "id": r.id,
            "name": r.name,
            "email": r.email,
            "rfps_assigned": r.rfps_assigned if r.rfps_assigned else [],
            "created_at": r.created_at.isoformat() if r.created_at else None
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
            "created_at": r.created_at,
            "file_url":r.file_url
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

    # Ensure rfps_assigned is always a list
    current_assigned_rfps = employee.rfps_assigned if employee.rfps_assigned else []

    if rfp_id not in current_assigned_rfps:
        current_assigned_rfps.append(rfp_id)
        employee.rfps_assigned = current_assigned_rfps  # assign as list, not string
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

    current_assigned_rfps = employee.rfps_assigned if employee.rfps_assigned else []

    if rfp_id in current_assigned_rfps:
        current_assigned_rfps.remove(rfp_id)
        employee.rfps_assigned = current_assigned_rfps
        db.add(employee)
        db.commit()
        db.refresh(employee)

        rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
        if rfp:
            rfp.status = "pending"
            db.add(rfp)
            db.commit()
            db.refresh(rfp)
            db.refresh(employee)

        return {"message": f"RFP {rfp_id} unassigned from employee {employee_id} and set to pending."}
    else:
        raise HTTPException(status_code=404, detail=f"RFP {rfp_id} not assigned to employee {employee_id}.")


@router.delete("/admin/remove-rfp/{rfp_id}")
async def remove_rfp(
    rfp_id: int,
    db: Session = Depends(get_db)
):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    # Remove this RFP from all employees' rfps_assigned lists
    employees = db.query(Employee).all()
    for employee in employees:
        if employee.rfps_assigned and rfp_id in employee.rfps_assigned:
            employee.rfps_assigned = [rid for rid in employee.rfps_assigned if rid != rfp_id]
            db.add(employee)
    db.delete(rfp)
    db.commit()
    return {"message": f"RFP {rfp_id} deleted and unassigned from all employees."}

load_dotenv()
embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

raw_url = os.getenv("VECTOR_DATABASE_URL")
if not raw_url:
    raise RuntimeError("DATABASE_URL environment variable is not set. Please set it in your .env file or environment.")
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
        text = extract_text_from_pdf_bytes(file_bytes)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(file_bytes)
    elif filename.endswith(".xlsx"):
        text = extract_text_from_excel(file_bytes)
    else:
        return {"error": "Unsupported file type. Use .pdf, .docx or .xlsx"}

    if not text.strip():
        return {"error": "No extractable text found in the document."}

    print("vectorizing")
    doc = Document(page_content=text, metadata={"company_id": company_id})
    vectorstore.add_documents([doc])
    print(doc)
    return {
        "message": f"{filename} embedded for company {company_id}",
        "characters": len(text)
    }

@router.post("/admin/rfps/{rfp_id}/message")
async def add_rfp_message(
    rfp_id: int,
    payload: dict,
    db: Session = Depends(get_db)
):
    message = payload.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")
    # Ensure rfp.message is a list
    if not rfp.message:
        rfp.message = []
    rfp.message.append({
        "admin": message,
        
    })
    db.add(rfp)
    db.commit()
    db.refresh(rfp)
    return {"message": "Message added to RFP.", "messages": rfp.message}

