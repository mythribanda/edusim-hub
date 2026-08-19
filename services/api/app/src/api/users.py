import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.src.config.database import get_db
from app.src.models.user import User, UserRole
from app.src.api.auth import require_admin, require_student, require_educator
from pydantic import BaseModel

logger = logging.getLogger("EduSim.users")
users_router = APIRouter(tags=["Users"])

class StudentMeResponse(BaseModel):
    id: UUID
    email: str
    name: str | None
    age_tier: str | None
    class_id: UUID | None

    class Config:
        from_attributes = True

class UpdateUserRoleRequest(BaseModel):
    role: UserRole

class MeResponse(BaseModel):
    id: UUID
    email: str
    name: str | None
    role: UserRole

    class Config:
        from_attributes = True


@users_router.patch("/users/{user_id}/role", response_model=MeResponse)
def update_user_role(
    user_id: UUID,
    request: UpdateUserRoleRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Updates a user's role. Restricted to administrators."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = request.role.value
    db.commit()
    db.refresh(user)
    logger.info("Admin %s updated role of user %s to %s", admin_user.email, user.id, user.role)
    return user


@users_router.get("/admin/users", response_model=list[MeResponse])
def get_all_users(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Returns a list of all users. Restricted to administrators."""
    users = db.query(User).all()
    return users



@users_router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(require_student)):
    """Returns basic profile information for the authenticated user."""
    return current_user


@users_router.get("/class/students", response_model=list[StudentMeResponse])
def get_class_students(
    educator_user: User = Depends(require_educator),
    db: Session = Depends(get_db)
):
    """Returns a list of all students belonging to the educator's class."""
    if not educator_user.class_id:
        return []
    students = db.query(User).filter(
        User.class_id == educator_user.class_id,
        User.role == UserRole.STUDENT
    ).all()
    return students


@users_router.get("/class/students/{student_id}/events")
def get_student_class_events(
    student_id: UUID,
    page: int = 1,
    limit: int = 20,
    educator_user: User = Depends(require_educator),
    db: Session = Depends(get_db)
):
    """
    Returns a paginated list of session events for a specific student in the educator's class.
    """
    # 1. Fetch student user to verify they are in the educator's class
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    if student.class_id != educator_user.class_id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this student's activity log."
        )

    # 2. Query session events
    from app.src.models.persistence import SessionEvent
    offset = (page - 1) * limit
    
    total = db.query(SessionEvent).filter(SessionEvent.student_id == student_id).count()
    
    events = (
        db.query(SessionEvent)
        .filter(SessionEvent.student_id == student_id)
        .order_by(SessionEvent.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # 3. Retrieve module titles in bulk to resolve module titles
    module_ids = list({e.module_id for e in events})
    module_title_map = {}
    if module_ids:
        try:
            from sqlalchemy import text
            rows = db.execute(
                text("SELECT id, title FROM modules WHERE id = ANY(:ids)"),
                {"ids": [str(m) for m in module_ids]},
            ).fetchall()
            module_title_map = {row[0]: row[1] for row in rows}
        except Exception:
            pass

    serialized_events = []
    for e in events:
        serialized_events.append({
            "id": str(e.id),
            "student_id": str(e.student_id),
            "module_id": str(e.module_id),
            "module_title": module_title_map.get(str(e.module_id), "Interactive Physics Module"),
            "event_type": e.event_type,
            "payload": e.payload,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        })

    return {
        "events": serialized_events,
        "total": total,
        "page": page,
        "limit": limit
    }
