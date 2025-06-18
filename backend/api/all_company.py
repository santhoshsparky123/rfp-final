from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from models.schema import Company,User
from methods.functions import get_db
# from fetch_username import fetch_username
router = APIRouter(prefix="/api")

def fetch_username(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user.username
    return {"error": "User not found"}

@router.get("/all-companies")
def get_all_companies(db: Session = Depends(get_db)):
    print("Fetching all companies from the database")
    
    # Query the database
    companies = db.query(Company).all()
    
    print("Fetched companies:", companies)
    
    # Format the response
    return {
        "companies": [
            {
                "id": company.id,
                "username": fetch_username(company.userid, db),
                "name": company.name,
                "subdomain": company.subdomain,
                "subscription_start": company.subscription_start,
                "subscription_end": company.subscription_end,
                "subscription_status": company.subscription_status.name if hasattr(company.subscription_status, 'name') else company.subscription_status,
                "created_at": company.created_at,
                "userid": company.userid
            }
            for company in companies
        ]
    }