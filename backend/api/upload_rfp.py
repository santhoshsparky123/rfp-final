# from fastapi import FastAPI, HTTPException
# import uuid
# import shutil
# import os
# from fastapi import UploadFile, File
# from agents.extract_rfp_structure import extract_rfp_structure
# from pydantic_models.datatypes import RFP_STORE
# from fastapi import APIRouter

# router = APIRouter(prefix="/api", tags=["RFP"])
# # API Endpoints
# @router.post("/upload-rfp/", response_model=dict)
# async def upload_rfp(file: UploadFile = File(...)):
#     """Upload and process an RFP document"""
#     print("hello1")
#     # Generate unique ID for this RFP
#     rfp_id = str(uuid.uuid4())
    
#     # Save the uploaded file
#     file_extension = os.path.splitext(file.filename)[1]
#     file_path = f"uploads/rfp_{rfp_id}{file_extension}"
    
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
    
#     try:
#         # Extract structured data from RFP
#         structured_data = extract_rfp_structure(file_path)
        

#         return {
#             "rfp_id": rfp_id,
#             "message": "RFP uploaded and processed successfully",
#             "structured_data": structured_data
#         }
#     except Exception as e:
#         # Clean up on error
#         if os.path.exists(file_path):
#             os.remove(file_path)
#         raise HTTPException(status_code=500, detail=f"Error processing RFP: {str(e)}")