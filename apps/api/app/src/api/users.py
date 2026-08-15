import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.src.config.database import get_db
from app.src.models.user import User, UserRole
from app.src.api.auth import require_admin, require_student
from pydantic import BaseModel

logger = logging.getLogger("EduSim.users")
users_router = APIRouter(tags=["Users"])

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
