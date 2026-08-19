
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UUID,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.src.config.database import Base


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class CurriculumClass(Base, TimestampMixin):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True)  # Using Integer to match TS class ID
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0, nullable=False)


class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(100), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint("class_id", "code", name="uq_class_subject_code"),
    )


class Chapter(Base, TimestampMixin):
    __tablename__ = "chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint("subject_id", "name", name="uq_subject_chapter_name"),
    )


class Topic(Base, TimestampMixin):
    __tablename__ = "topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    has_simulation = Column(Boolean, default=False)
    simulation_route = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint("chapter_id", "name", name="uq_chapter_topic_name"),
    )


class ChatHistory(Base, TimestampMixin):
    __tablename__ = "chat_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    session_type = Column(String(50), nullable=False, index=True)  # 'tutor' or 'formula_lab'
    role = Column(String(30), nullable=False, index=True)  # 'user' or 'assistant'
    topic = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)


class FormulaHistory(Base, TimestampMixin):
    __tablename__ = "formula_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    formula_id = Column(String(200), nullable=False, index=True)
    input_json = Column(JSON, nullable=False)
    output_json = Column(JSON, nullable=True)
    calculation_steps_json = Column(JSON, nullable=True)
    graph_json = Column(JSON, nullable=True)


class SimulationHistory(Base, TimestampMixin):
    __tablename__ = "simulation_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    simulation_id = Column(String(120), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    dsl_json = Column(JSON, nullable=True)
    runtime_json = Column(JSON, nullable=True)
    snapshot_json = Column(JSON, nullable=True)
    ui_state_json = Column(JSON, nullable=True)
    score = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class UserSetting(Base, TimestampMixin):
    __tablename__ = "user_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    setting_key = Column(String(120), nullable=False, index=True)
    setting_value = Column(JSON, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "setting_key", name="uq_user_setting_key"),
    )


class UserSession(Base, TimestampMixin):
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_key = Column(String(500), nullable=False)
    device_info = Column(JSON, nullable=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_logout_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    metadata_json = Column(JSON, nullable=True)


class StudentProfile(Base, TimestampMixin):
    __tablename__ = "student_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    skill_level = Column(String(50), default="beginner", nullable=False)
    mastered_topics = Column(JSON, default=list, nullable=False)
    misconceptions = Column(JSON, default=list, nullable=False)
    metadata_json = Column(JSON, nullable=True)


class SessionEvent(Base):
    __tablename__ = "session_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(Text, nullable=False)
    payload = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Assignment(Base):
    """Maps to public.assignments — created by teachers, assigned to a class."""
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    instructions = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    submissions = relationship("Submission", back_populates="assignment", lazy="dynamic")


class Submission(Base):
    """Maps to public.submissions — one row per student per assignment."""
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    answers = Column(JSON, default=dict, nullable=False)
    score = Column(Float, nullable=True)
    comment = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    assignment = relationship("Assignment", back_populates="submissions")


class ClassPost(Base):
    """Maps to public.class_posts — stores announcements/prompts and replies."""
    __tablename__ = "class_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("class_posts.id", ondelete="CASCADE"), nullable=True, index=True)
    reactions = Column(JSON, nullable=False, server_default='{}')
    is_reflection = Column(Boolean, nullable=False, server_default='false', default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    author = relationship("User", lazy="joined")


class TutorRequestLog(Base):
    """Maps to public.tutor_request_logs — audits LLM request usage and costs."""
    __tablename__ = "tutor_request_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tier = Column(String(50), nullable=False)
    model_used = Column(String(255), nullable=False)
    token_count = Column(Integer, nullable=False, server_default='0', default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("User", lazy="joined")


class TutorCachedAnswer(Base):
    """Maps to public.tutor_cached_answers — stores pregenerated answers for common questions."""
    __tablename__ = "tutor_cached_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_hash = Column(String(64), unique=True, nullable=False, index=True)
    age_tier = Column(String(50), nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ParentStudent(Base):
    """Maps to public.parent_student — stores links between parents and students."""
    __tablename__ = "parent_student"

    parent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    parent = relationship("User", foreign_keys=[parent_id])
    student = relationship("User", foreign_keys=[student_id])


class WeeklyDigestLog(Base):
    """Tracks sent weekly digests for idempotency — one row per parent per ISO week."""
    __tablename__ = "weekly_digest_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # ISO week string: "2026-W34"  — prevents double-sending the same week
    week_key = Column(String(10), nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("parent_id", "week_key", name="uq_digest_parent_week"),
    )

