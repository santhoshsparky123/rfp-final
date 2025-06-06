from models.schema import User, UserRole, Company  
from methods.functions import get_db, require_role
from sqlalchemy.orm import Session
from fastapi import  Depends

from fastapi import APIRouter

router = APIRouter(prefix="/api")
@router.get("/all-companies")
async def get_all_companies(
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.USER])),
    db: Session = Depends(get_db)
):
    #fetching all the companies from the db
    companies = db.query(Company).all()
    result = []
    for c in companies:
        # Find admin user for this company
        admin_user = db.query(User).filter(User.company_id == c.id, User.role == UserRole.ADMIN).first()
        admin_data = None
        if admin_user:
            admin_data = {
                "id": admin_user.id,
                "username": admin_user.username,
                "email": admin_user.email
            }
        result.append({
            "id": c.id,
            "name": c.name,
            "subdomain": c.subdomain,
            "subscription_status": c.subscription_status.name if hasattr(c.subscription_status, 'name') else c.subscription_status,
            "admin": admin_data
        })
    return {"companies": result}