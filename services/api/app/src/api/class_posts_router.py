import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

import re
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.src.config.database import get_db
from app.src.models.persistence import ClassPost
from app.src.models.user import User, UserRole, AgeTier
from app.src.services.persistence_service import require_user

logger = logging.getLogger(__name__)

class_posts_router = APIRouter(tags=["Class Feed"])

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic request / response schemas
# ─────────────────────────────────────────────────────────────────────────────

class CreatePostRequest(BaseModel):
    class_id: Optional[str] = None
    content: str
    is_reflection: bool = False

class CreateReplyRequest(BaseModel):
    content: str

class UserAuthorResponse(BaseModel):
    id: uuid.UUID
    name: Optional[str]
    email: str
    role: str
    age_tier: str

    class Config:
        from_attributes = True

class ReplyResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    content: str
    created_at: datetime
    author: UserAuthorResponse
    reactions: dict = {}

    class Config:
        from_attributes = True

class ClassPostResponse(BaseModel):
    id: uuid.UUID
    class_id: uuid.UUID
    content: str
    created_at: datetime
    author: UserAuthorResponse
    replies: list[ReplyResponse] = []
    reactions: dict = {}
    is_reflection: bool = False

    class Config:
        from_attributes = True

# ─────────────────────────────────────────────────────────────────────────────
# Helper for Age Tier comparison (meetsMinTier)
# ─────────────────────────────────────────────────────────────────────────────

TIER_RANKS = {
    "primary": 1,
    "middle": 2,
    "high_school": 3,
    "university": 4,
}

def meets_min_tier(user_tier: str | AgeTier, min_tier: str | AgeTier) -> bool:
    user_tier_str = user_tier.value if hasattr(user_tier, "value") else str(user_tier)
    min_tier_str = min_tier.value if hasattr(min_tier, "value") else str(min_tier)
    user_rank = TIER_RANKS.get(user_tier_str)
    min_rank = TIER_RANKS.get(min_tier_str)
    if user_rank is None or min_rank is None:
        return False
    return user_rank >= min_rank

def _parse_uuid(value: str, field: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid UUID for '{field}': {value!r}",
        )

# ─────────────────────────────────────────────────────────────────────────────
# GET /class-posts — Fetch chronological class feed
# ─────────────────────────────────────────────────────────────────────────────

@class_posts_router.get("/class-posts", response_model=list[ClassPostResponse])
def get_class_posts(
    class_id: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Fetch all announcements/prompts (where parent_id is NULL) for a class,
    along with their replies, sorted chronologically.
    Gated to students with age tier 'middle' or above, and teachers.
    """
    user = require_user(authorization, db)

    # Resolve class_id
    target_class_uuid = None
    if class_id:
        target_class_uuid = _parse_uuid(class_id, "class_id")
    elif getattr(user, "class_id", None):
        target_class_uuid = user.class_id
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No class_id provided and user is not enrolled in a class.",
        )

    # Gating checks
    if user.role == UserRole.STUDENT:
        # Check class membership
        if user.class_id != target_class_uuid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot view posts for a class you are not enrolled in.",
            )
        # Check tier
        if not meets_min_tier(user.age_tier, AgeTier.MIDDLE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Class feed is restricted to middle tier and above.",
            )
    elif user.role == UserRole.TEACHER:
        if user.class_id != target_class_uuid and user.role != UserRole.SUPERADMIN and user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view posts for your assigned class.",
            )

    # Fetch top-level posts (announcements/prompts) ordered newest first
    posts = (
        db.query(ClassPost)
        .filter(ClassPost.class_id == target_class_uuid, ClassPost.parent_id.is_(None))
        .order_by(ClassPost.created_at.desc())
        .all()
    )

    result = []
    for post in posts:
        # Fetch replies ordered oldest first
        replies = (
            db.query(ClassPost)
            .filter(ClassPost.parent_id == post.id)
            .order_by(ClassPost.created_at.asc())
            .all()
        )

        reply_responses = []
        for r in replies:
            reply_responses.append(
                ReplyResponse(
                    id=r.id,
                    parent_id=r.parent_id,
                    content=r.content,
                    created_at=r.created_at,
                    author=UserAuthorResponse(
                        id=r.author.id,
                        name=r.author.name,
                        email=r.author.email,
                        role=r.author.role.value if hasattr(r.author.role, "value") else str(r.author.role),
                        age_tier=r.author.age_tier.value if hasattr(r.author.age_tier, "value") else str(r.author.age_tier)
                    ),
                    reactions=r.reactions or {}
                )
            )

        result.append(
            ClassPostResponse(
                id=post.id,
                class_id=post.class_id,
                content=post.content,
                created_at=post.created_at,
                author=UserAuthorResponse(
                    id=post.author.id,
                    name=post.author.name,
                    email=post.author.email,
                    role=post.author.role.value if hasattr(post.author.role, "value") else str(post.author.role),
                    age_tier=post.author.age_tier.value if hasattr(post.author.age_tier, "value") else str(post.author.age_tier)
                ),
                replies=reply_responses,
                reactions=post.reactions or {},
                is_reflection=post.is_reflection
            )
        )

    return result

# ─────────────────────────────────────────────────────────────────────────────
# POST /class-posts — Teacher posts an announcement/prompt
# ─────────────────────────────────────────────────────────────────────────────

@class_posts_router.post("/class-posts", status_code=status.HTTP_201_CREATED)
def create_class_post(
    body: CreatePostRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Create a new announcement or prompt. Restricted to teachers and admins.
    """
    user = require_user(authorization, db)

    # Gated to teacher/admin
    allowed_roles = {UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN}
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and administrators can post announcements.",
        )

    # Resolve class_id
    if not body.class_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="class_id is required.",
        )
    class_uuid = _parse_uuid(body.class_id, "class_id")

    # Teachers must post to their own class
    if user.role == UserRole.TEACHER and user.class_id != class_uuid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only post announcements to your own class.",
        )

    new_post = ClassPost(
        class_id=class_uuid,
        author_id=user.id,
        content=body.content,
        parent_id=None,
        is_reflection=body.is_reflection,
    )
    db.add(new_post)
    try:
        db.commit()
        db.refresh(new_post)
        logger.info("[class-posts] Created post %s for class %s by educator %s", new_post.id, class_uuid, user.id)
        return {
            "success": True,
            "post_id": str(new_post.id),
            "content": new_post.content,
            "created_at": new_post.created_at.isoformat()
        }
    except Exception as exc:
        db.rollback()
        logger.error("[class-posts] Failed to create class post: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create announcement.")

# ─────────────────────────────────────────────────────────────────────────────
# POST /class-posts/{post_id}/reply — Post a reply to an announcement
# ─────────────────────────────────────────────────────────────────────────────

@class_posts_router.post("/class-posts/{post_id}/reply", status_code=status.HTTP_201_CREATED)
def reply_to_post(
    post_id: str,
    body: CreateReplyRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Post a reply to an existing announcement or prompt.
    Gated to students with age tier 'middle' or above, and teachers.
    """
    user = require_user(authorization, db)

    parent_uuid = _parse_uuid(post_id, "post_id")
    parent_post = db.query(ClassPost).filter(ClassPost.id == parent_uuid).first()
    if not parent_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent post not found."
        )

    # Gating checks
    if user.role == UserRole.STUDENT:
        # Check class membership
        if user.class_id != parent_post.class_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot reply to a post outside your class.",
            )
        # Check tier
        if not meets_min_tier(user.age_tier, AgeTier.MIDDLE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Replying is restricted to middle tier and above.",
            )
    elif user.role == UserRole.TEACHER:
        if user.class_id != parent_post.class_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only reply to posts within your own class.",
            )

    # Flatten nested replies: if parent is a reply, point parent_id to its parent (the root prompt)
    actual_parent_id = parent_post.id
    if parent_post.parent_id is not None:
        actual_parent_id = parent_post.parent_id

    # Filter profanity if user is student
    content_to_store = body.content
    if user.role == UserRole.STUDENT:
        content_to_store = filter_profanity(body.content)

    new_reply = ClassPost(
        class_id=parent_post.class_id,
        author_id=user.id,
        content=content_to_store,
        parent_id=actual_parent_id,
    )
    db.add(new_reply)
    try:
        db.commit()
        db.refresh(new_reply)
        logger.info("[class-posts] Created reply %s to post %s by user %s", new_reply.id, actual_parent_id, user.id)
        return {
            "success": True,
            "reply_id": str(new_reply.id),
            "content": new_reply.content,
            "created_at": new_reply.created_at.isoformat()
        }
    except Exception as exc:
        db.rollback()
        logger.error("[class-posts] Failed to create reply: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to post reply.")


# ─────────────────────────────────────────────────────────────────────────────
# Profanity Filter Utility
# ─────────────────────────────────────────────────────────────────────────────

PROFANITY_WORDS = {
    "abuse", "bitch", "crap", "bastard", "asshole", "fuck", "shit", "dick", "pussy"
}

def filter_profanity(text: str) -> str:
    cleaned = text
    for word in PROFANITY_WORDS:
        cleaned = re.sub(re.escape(word), "*" * len(word), cleaned, flags=re.IGNORECASE)
    return cleaned


# ─────────────────────────────────────────────────────────────────────────────
# POST /class-posts/{post_id}/react — Toggle emoji reaction
# ─────────────────────────────────────────────────────────────────────────────

class ReactRequest(BaseModel):
    emoji: str

@class_posts_router.post("/class-posts/{post_id}/react")
def react_to_post(
    post_id: str,
    body: ReactRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Toggle a reaction emoji on a class post/reply.
    """
    user = require_user(authorization, db)
    post_uuid = _parse_uuid(post_id, "post_id")
    post = db.query(ClassPost).filter(ClassPost.id == post_uuid).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found."
        )

    # Gating checks
    if user.role == UserRole.STUDENT:
        if user.class_id != post.class_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot react to posts outside your class.",
            )
        if not meets_min_tier(user.age_tier, AgeTier.MIDDLE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Reactions are restricted to middle tier and above.",
            )
    elif user.role == UserRole.TEACHER:
        if user.class_id != post.class_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only react to posts within your own class.",
            )

    reactions = dict(post.reactions) if post.reactions else {}
    emoji = body.emoji
    user_id_str = str(user.id)

    if emoji not in reactions:
        reactions[emoji] = []

    user_ids = reactions[emoji]
    if user_id_str in user_ids:
        user_ids.remove(user_id_str)
        if not user_ids:
            reactions.pop(emoji, None)
    else:
        user_ids.append(user_id_str)
        reactions[emoji] = user_ids

    post.reactions = reactions
    db.add(post)
    flag_modified(post, "reactions")

    try:
        db.commit()
        db.refresh(post)
        return {
            "success": True,
            "reactions": post.reactions
        }
    except Exception as exc:
        db.rollback()
        logger.error("[class-posts] Failed to update reactions: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to save reaction.")


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /class-posts/{post_id} — Delete post/reply
# ─────────────────────────────────────────────────────────────────────────────

@class_posts_router.delete("/class-posts/{post_id}")
def delete_class_post(
    post_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Delete an announcement/prompt or reply.
    Teachers can delete any post/reply in their class. Admins can delete anything.
    """
    user = require_user(authorization, db)
    post_uuid = _parse_uuid(post_id, "post_id")
    post = db.query(ClassPost).filter(ClassPost.id == post_uuid).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found."
        )

    # Authorization logic
    is_author = post.author_id == user.id
    is_class_teacher = user.role == UserRole.TEACHER and user.class_id == post.class_id
    is_admin = user.role in {UserRole.ADMIN, UserRole.SUPERADMIN}

    if not (is_author or is_class_teacher or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this post."
        )

    try:
        db.delete(post)
        db.commit()
        logger.info("[class-posts] Deleted class post/reply %s by user %s", post_uuid, user.id)
        return {
            "success": True,
            "message": "Post deleted successfully."
        }
    except Exception as exc:
        db.rollback()
        logger.error("[class-posts] Failed to delete post: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to delete post.")


# ─────────────────────────────────────────────────────────────────────────────
# GET /class-posts/active-reflection — Get the active reflection prompt for student
# ─────────────────────────────────────────────────────────────────────────────

class ActiveReflectionResponse(BaseModel):
    active: bool
    post: Optional[ClassPostResponse] = None
    has_replied: bool = False

@class_posts_router.get("/class-posts/active-reflection", response_model=ActiveReflectionResponse)
def get_active_reflection(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Get the most recent active reflection prompt for the student's class,
    and whether the student has already replied to it.
    """
    user = require_user(authorization, db)
    if not user.class_id:
        return ActiveReflectionResponse(active=False, has_replied=False)

    # Gating checks: restricted to middle tier and above for students
    if user.role == UserRole.STUDENT:
        if not meets_min_tier(user.age_tier, AgeTier.MIDDLE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Reflection prompts are restricted to middle tier and above.",
            )

    # Find the most recent reflection prompt for this class
    post = (
        db.query(ClassPost)
        .filter(
            ClassPost.class_id == user.class_id,
            ClassPost.parent_id.is_(None),
            ClassPost.is_reflection == True,
        )
        .order_by(ClassPost.created_at.desc())
        .first()
    )

    if not post:
        return ActiveReflectionResponse(active=False, has_replied=False)

    # Check if the student has already replied to it
    reply = (
        db.query(ClassPost)
        .filter(
            ClassPost.parent_id == post.id,
            ClassPost.author_id == user.id,
        )
        .first()
    )

    # Build ClassPostResponse mapping
    replies = (
        db.query(ClassPost)
        .filter(ClassPost.parent_id == post.id)
        .order_by(ClassPost.created_at.asc())
        .all()
    )
    reply_responses = []
    for r in replies:
        reply_responses.append(
            ReplyResponse(
                id=r.id,
                parent_id=r.parent_id,
                content=r.content,
                created_at=r.created_at,
                author=UserAuthorResponse(
                    id=r.author.id,
                    name=r.author.name,
                    email=r.author.email,
                    role=r.author.role.value if hasattr(r.author.role, "value") else str(r.author.role),
                    age_tier=r.author.age_tier.value if hasattr(r.author.age_tier, "value") else str(r.author.age_tier)
                ),
                reactions=r.reactions or {}
            )
        )

    post_resp = ClassPostResponse(
        id=post.id,
        class_id=post.class_id,
        content=post.content,
        created_at=post.created_at,
        author=UserAuthorResponse(
            id=post.author.id,
            name=post.author.name,
            email=post.author.email,
            role=post.author.role.value if hasattr(post.author.role, "value") else str(post.author.role),
            age_tier=post.author.age_tier.value if hasattr(post.author.age_tier, "value") else str(post.author.age_tier)
        ),
        replies=reply_responses,
        reactions=post.reactions or {},
        is_reflection=post.is_reflection
    )

    return ActiveReflectionResponse(
        active=True,
        post=post_resp,
        has_replied=reply is not None
    )


