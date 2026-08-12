from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.src.config.database import get_db
from app.src.models.institution import Institution
from pydantic import BaseModel
from uuid import UUID

router = APIRouter()

class InstitutionCreate(BaseModel):
    name: str
    type: str | None = None
    address: str | None = None
    contact_number: str | None = None
    email: str | None = None

class InstitutionResponse(BaseModel):
    id: UUID
    name: str
    type: str | None
    address: str | None
    contact_number: str | None
    email: str | None

    class Config:
        from_attributes = True

@router.post("/", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
def create_institution(institution_data: InstitutionCreate, db: Session = Depends(get_db)):
    institution = Institution(
        name=institution_data.name,
        type=institution_data.type,
        address=institution_data.address,
        contact_number=institution_data.contact_number,
        email=institution_data.email
    )
    db.add(institution)
    db.commit()
    db.refresh(institution)
    return institution

@router.get("/{institution_id}", response_model=InstitutionResponse)
def get_institution(institution_id: UUID, db: Session = Depends(get_db)):
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    return institution

@router.get("/", response_model=list[InstitutionResponse])
def list_institutions(db: Session = Depends(get_db)):
    return db.query(Institution).all()
