from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.schema import RFP
from methods.functions import get_db

router = APIRouter(prefix="/api", tags=["RFP"])

@router.get("/rfps/{rfp_id}/messages")
def get_rfp_messages(rfp_id: int, db: Session = Depends(get_db)):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")
    # Return the message list as is
    return {"messages": rfp.message or []}
