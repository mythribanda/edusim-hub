import uuid
from sqlalchemy import Column, DateTime, String, UUID
from sqlalchemy.sql import func
from app.src.config.database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=True)  # e.g., school, college, university, government
    address = Column(String(500), nullable=True)
    contact_number = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
