from fastapi import FastAPI, HTTPException, Form
import uuid
import shutil
import os
from fastapi import UploadFile, File
from agents.extract_rfp_structure import extract_rfp_structure
from pydantic_models.datatypes import RFP_STORE
from fastapi import APIRouter
import tempfile
import requests
from pydantic import BaseModel
from methods.functions import Session,Depends,get_db,require_role1

from models.schema import RFP,User,UserRole,Employee

router = APIRouter(prefix="/api", tags=["RFP"])

class temp(BaseModel):
    file_name:str
    
@router.post("/upload-rfp/", response_model=dict)
async def upload_rfp(
    file_name: str = Form(...),
    current_user: Employee = Depends(require_role1([UserRole.EMPLOYEE])),
    db: Session = Depends(get_db)
):
    rfp = db.query(RFP).filter(RFP.filename==file_name).first()
    file_url = rfp.file_url
    rfp_id = rfp.id
    company_id = rfp.company_id
    
    try:
        if file_url:
            # Download from S3 or HTTP(S) URL
            response = requests.get(file_url, stream=True)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to download file from URL")
            file_extension = os.path.splitext(file_url)[1] or ".tmp"
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
            for chunk in response.iter_content(chunk_size=8192):
                temp_file.write(chunk)
            temp_file.close()
            file_path = temp_file.name
        # elif file:
        #     file_extension = os.path.splitext(file.filename)[1]
        #     temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
        #     shutil.copyfileobj(file.file, temp_file)
        #     temp_file.close()
        #     file_path = temp_file.name
        #     print("santhosh2")
        else:
            raise HTTPException(status_code=400, detail="No file or file_url provided")

        print("santhosh3")
        
        structured_data = extract_rfp_structure(file_path)
        
        
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        structured_data["company_id"] = company_id
        structured_data["employee_id"] = current_user.id
        structured_data["rfp_id"] = rfp_id
        print(structured_data)
        return {
            "message": "RFP uploaded and processed successfully",
            "structured_data": structured_data
        }
    except Exception as e:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing RFP: {str(e)}")
    finally:
        if temp_file:
            try:
                os.remove(temp_file.name)
            except Exception:
                pass