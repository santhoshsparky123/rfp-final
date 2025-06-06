from models.schema import User, UserRole, Company, SubscriptionStatus, UserCreate, CompanyCreate, SubscriptionUpdate    
from methods.functions import get_db, require_role, get_password_hash
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["RFP"])
# Super Admin endpoints
@router.post("/setup/create-super-admin")
async def create_super_admin(
    username: str = "superadmin",
    password: str = "changeme123",
    email: str = "admin@rfpplatform.com",
    db: Session = Depends(get_db)
):
    # Check if super admin already exists
    existing_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Super admin already exists")
    
    hashed_password = get_password_hash(password)
    super_admin = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        role=UserRole.SUPER_ADMIN
    )
    db.add(super_admin)
    db.commit()
    
    return {"message": "Super admin created successfully"}

# @router.post("/super-admin/create-admin")
# async def create_admin(
#     admin_data: UserCreate,
#     company_data: CompanyCreate,
#     current_user: User = Depends(require_role([UserRole.SUPER_ADMIN])),
#     db: Session = Depends(get_db)
# ):
#     # Check if subdomain is available
#     existing_company = db.query(Company).filter(Company.subdomain == company_data.subdomain).first()
#     if existing_company:
#         raise HTTPException(status_code=400, detail="Subdomain already exists")
    
#     # Create company
#     company = Company(
#         name=company_data.name,
#         subdomain=company_data.subdomain,
#         subscription_status=SubscriptionStatus.SUSPENDED  # Initially suspended until payment
#     )
#     db.add(company)
#     db.commit()
#     db.refresh(company)
    
#     # Create admin user
#     hashed_password = get_password_hash(admin_data.password)
#     admin_user = User(
#         username=admin_data.username,
#         email=admin_data.email,
#         hashed_password=hashed_password,
#         role=UserRole.ADMIN,
#         company_id=company.id,
#         created_by=current_user.id
#     )
#     db.add(admin_user)
#     db.commit()
#     db.refresh(admin_user)
    
#     return {"message": "Admin created successfully", "company_id": company.id, "admin_id": admin_user.id}

# @router.post("/super-admin/activate-subscription/{company_id}") #month
# async def activate_subscription(
#     company_id: int,
#     subscription_data: SubscriptionUpdate,
#     current_user: User = Depends(require_role([UserRole.SUPER_ADMIN])),
#     db: Session = Depends(get_db)
# ):
#     company = db.query(Company).filter(Company.id == company_id).first()
#     if not company:
#         raise HTTPException(status_code=404, detail="Company not found")
    
#     # Set subscription period
#     start_date = datetime.utcnow()
#     end_date = start_date + timedelta(days=subscription_data.months * 30)
    
#     company.subscription_start = start_date
#     company.subscription_end = end_date
#     company.subscription_status = SubscriptionStatus.ACTIVE
    
#     db.commit()
    
#     return {"message": "Subscription activated", "expires_at": end_date}

@router.post("company/{company_id}")
async def get_company(
    company_id:int,
    # current_user: User = Depends(require_role([UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id==company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {"subdomain":company.subdomain}