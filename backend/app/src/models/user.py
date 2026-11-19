import uuid

from sqlalchemy import Column, DateTime, String, Boolean, UUID, Text, Index
from sqlalchemy.sql import func

from app.src.config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String(20), default="student")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_active_at = Column(DateTime(timezone=True), nullable=True)
    avatar = Column(Text, nullable=True)
    
    # Advanced authentication & separate token fields
    mobile_number = Column(String(20), nullable=True)
    is_email_verified = Column(Boolean, default=False)
    is_mobile_verified = Column(Boolean, default=False)
    
    # Distinct verification token and expiry
    verification_token = Column(String(255), nullable=True)
    verification_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Distinct password reset token and expiry
    reset_password_token = Column(String(255), nullable=True)
    reset_password_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # OTP verification
    otp_code = Column(String(20), nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_role", "role"),
        Index("ix_users_last_active_at", "last_active_at"),
        Index("ix_users_verification_token", "verification_token"),
        Index("ix_users_reset_password_token", "reset_password_token"),
    )
