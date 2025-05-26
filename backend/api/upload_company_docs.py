from fastapi import HTTPException, UploadFile, File, APIRouter
import os
import shutil
from typing import List
from agents.vector import vector_the_documents
from pydantic_models.datatypes import RFP_STORE

router = APIRouter(prefix="/api", tags=["RFP"])

@router.post("/upload-company-docs", response_model=dict)
async def upload_company_docs(files: List[UploadFile] = File(...)):
    """Upload company documents for RAG"""
    
    saved_files = []
    try:
        for file in files:
            # Save the uploaded file
            file_extension = os.path.splitext(file.filename)[1]
            file_path = f"company_docs/{file.filename}"
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            saved_files.append(file_path)
        
        # Process and index the documents
        company_tool = vector_the_documents()
        vector_store_id = company_tool.ingest_documents(saved_files)
        
        return {
            "message": f"{len(saved_files)} company documents uploaded and processed",
            "vector_store_id": vector_store_id
        }
        
    except Exception as e:
        # Clean up on error
        for file_path in saved_files:
            if os.path.exists(file_path):
                os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing company documents: {str(e)}")