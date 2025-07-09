from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from models.schema import User,Company,RFP
from methods.functions import get_db

router = APIRouter(prefix="/api")

@router.get("/pdf/{rfp_id}")
def pdf_url(rfp_id: int, db: Session = Depends(get_db)):
    print("reaper")
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if rfp:
        print(rfp.pdf_url)
        return {"pdf_url": rfp.pdf_url}
    return {"error": "RFP not found"}