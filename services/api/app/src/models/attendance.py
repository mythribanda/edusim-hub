import uuid
from sqlalchemy import Column, DateTime, String, UUID, Date, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.src.config.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject = Column(String(200), nullable=True)
    faculty_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    date = Column(Date, nullable=False, index=True)
    # ENUM-like: 'present' | 'absent' | 'late'
    status = Column(String(20), nullable=False, default="absent")
    # UUID FK for auth / auditing
    marked_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Human-readable teacher name for display (denormalised for speed)
    marked_by_name = Column(String(200), nullable=True)
    class_id = Column(String(100), nullable=True, index=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('present', 'absent', 'late')",
            name="chk_attendance_status",
        ),
    )

    # Relationships for eager-loading names
    student = relationship("User", foreign_keys=[student_id], lazy="select")
    faculty = relationship("User", foreign_keys=[faculty_id], lazy="select")
