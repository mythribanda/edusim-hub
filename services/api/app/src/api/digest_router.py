"""
digest_router.py
────────────────
Exposes two admin/debug endpoints:

  POST /api/digest/trigger   — manually fire the weekly digest right now
                               (useful for testing without waiting for Sunday)
  GET  /api/digest/status    — list the last 20 digest log entries
"""

import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.src.config.database import get_db
from app.src.api.auth import get_current_user
from app.src.models.user import User
from app.src.models.persistence import WeeklyDigestLog

logger = logging.getLogger("EduSim.digest_router")

digest_router = APIRouter(prefix="/digest", tags=["Digest"])


def _require_admin(current_user: User) -> None:
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can trigger the weekly digest.",
        )


@digest_router.post("/trigger")
async def trigger_digest(
    current_user: User = Depends(get_current_user),
):
    """
    Manually fire the weekly digest for all parents immediately.
    Admin-only. Useful for smoke-testing without waiting for Sunday.

    Note: idempotency still applies — if a digest was already sent this
    ISO week, only parents who haven't received it yet will get one.
    """
    _require_admin(current_user)
    from app.src.jobs.weekly_digest import run_weekly_digest
    # Run in the background so the HTTP response returns immediately
    asyncio.create_task(run_weekly_digest())
    return {"success": True, "message": "Weekly digest job started in background."}


@digest_router.get("/status")
def digest_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the last 20 digest log entries (most recent first).
    Admin-only.
    """
    _require_admin(current_user)
    rows = (
        db.query(WeeklyDigestLog)
        .order_by(desc(WeeklyDigestLog.sent_at))
        .limit(20)
        .all()
    )
    return {
        "success": True,
        "logs": [
            {
                "id": str(r.id),
                "parent_id": str(r.parent_id),
                "week_key": r.week_key,
                "sent_at": r.sent_at.isoformat(),
            }
            for r in rows
        ],
    }
