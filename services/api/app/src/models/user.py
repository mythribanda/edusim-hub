import enum
from sqlalchemy import Column, DateTime, String, UUID, Enum as SQLEnum
from sqlalchemy.sql import func
from app.src.config.database import Base

class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    PARENT = "parent"

class AgeTier(str, enum.Enum):
    PRIMARY = "primary"
    MIDDLE = "middle"
    HIGH_SCHOOL = "high_school"
    UNIVERSITY = "university"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(SQLEnum(UserRole, name="user_role", native_enum=True), nullable=False)
    age_tier = Column(SQLEnum(AgeTier, name="age_tier", native_enum=True), nullable=False)
    class_id = Column(UUID(as_uuid=True), nullable=True)
    institution_id = Column(UUID(as_uuid=True), nullable=True)
    board = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
