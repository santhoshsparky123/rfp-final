from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.responses import FileResponse
import os
from pydantic_models.datatypes import RFP_STORE

router = APIRouter(prefix="/api", tags=["RFP"])

@router.get("/download-document/{rfp_id}/{doc_type}")
async def download_document(rfp_id: str, doc_type: str):
    """Download generated documents"""
    
    filepath = os.path.join("outputs", f"{rfp_id}_proposal.{doc_type}")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Document file not found")

    # Set the appropriate content type
    media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if doc_type == "docx" else "application/pdf"

    return FileResponse(path=filepath, media_type=media_type, filename=os.path.basename(filepath))