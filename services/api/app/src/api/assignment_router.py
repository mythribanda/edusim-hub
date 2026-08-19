"""
assignment_router.py — Assignment & Submission API endpoints.

Routes:
  POST   /assignments          Create an assignment (teacher/admin only)
  GET    /assignments/pending  List assignments for the logged-in student's class
                               that have no submission yet from this student
  GET    /assignments/all      List all assignments created by the logged-in teacher
  POST   /submissions          Record a student's module completion as a submission

Auth: all routes require a valid JWT bearer token (require_user dependency).
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.src.config.database import get_db
from app.src.models.persistence import Assignment, Submission
from app.src.services.persistence_service import require_user

logger = logging.getLogger(__name__)

assignment_router = APIRouter(tags=["Assignments"])

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic request / response schemas
# ─────────────────────────────────────────────────────────────────────────────

class CreateAssignmentRequest(BaseModel):
    module_id: str
    class_id: str
    due_date: Optional[str] = None         # ISO-8601 datetime string, e.g. "2026-09-01T23:59:00Z"
    instructions: Optional[str] = None


class CreateSubmissionRequest(BaseModel):
    assignment_id: str
    answers: dict = {}                     # free-form JSON blob from the simulation
    score: Optional[float] = None
    completed_at: Optional[str] = None     # ISO-8601 datetime string


class GradeSubmissionRequest(BaseModel):
    score: float
    comment: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _parse_uuid(value: str, field: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid UUID for '{field}': {value!r}",
        )


def _parse_dt(value: Optional[str], field: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        # Accept both trailing Z and +00:00
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid datetime for '{field}': {value!r}. Use ISO-8601 format.",
        )


# ─────────────────────────────────────────────────────────────────────────────
# POST /assignments — Teacher creates an assignment
# ─────────────────────────────────────────────────────────────────────────────

@assignment_router.post("/assignments", status_code=status.HTTP_201_CREATED)
def create_assignment(
    body: CreateAssignmentRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Create a new assignment linking a module to a class.
    Only teachers, admins, and superadmins may call this.
    """
    user = require_user(authorization, db)

    allowed_roles = {"teacher", "admin", "superadmin"}
    if getattr(user, "role", None) not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can create assignments.",
        )

    module_uuid = _parse_uuid(body.module_id, "module_id")
    class_uuid = _parse_uuid(body.class_id, "class_id")
    due_dt = _parse_dt(body.due_date, "due_date")

    assignment = Assignment(
        module_id=module_uuid,
        class_id=class_uuid,
        due_date=due_dt,
        instructions=body.instructions,
        created_by=user.id,
    )
    db.add(assignment)
    try:
        db.commit()
        db.refresh(assignment)
        logger.info(
            "[assignments] Created assignment %s by teacher=%s for class=%s module=%s",
            assignment.id, user.id, class_uuid, module_uuid,
        )
        return {
            "success": True,
            "assignment_id": str(assignment.id),
            "module_id": str(assignment.module_id),
            "class_id": str(assignment.class_id),
            "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
            "instructions": assignment.instructions,
            "created_at": assignment.created_at.isoformat() if assignment.created_at else datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        db.rollback()
        logger.warning("[assignments] Failed to create assignment: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create assignment.")


# ─────────────────────────────────────────────────────────────────────────────
# GET /assignments/pending — Student fetches their pending assignments
# ─────────────────────────────────────────────────────────────────────────────

@assignment_router.get("/assignments/pending")
def get_pending_assignments(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Return all assignments for the student's class_id that the student has NOT
    yet submitted. Each row includes module title (from joined modules table) and
    due date so the dashboard can render the pending work list.
    """
    user = require_user(authorization, db)

    student_class_id = getattr(user, "class_id", None)
    if not student_class_id:
        # No class assigned — return empty list gracefully
        return {"assignments": []}

    # All assignments for this class
    all_for_class = (
        db.query(Assignment)
        .filter(Assignment.class_id == student_class_id)
        .all()
    )

    if not all_for_class:
        return {"assignments": []}

    assignment_ids = [a.id for a in all_for_class]

    # Submissions already made by this student
    submitted_ids = {
        row.assignment_id
        for row in db.query(Submission.assignment_id)
        .filter(
            Submission.assignment_id.in_(assignment_ids),
            Submission.student_id == user.id,
        )
        .all()
    }

    # Filter to only pending (no submission yet)
    pending = [a for a in all_for_class if a.id not in submitted_ids]

    # Fetch module titles in bulk for the pending assignments
    module_ids = list({a.module_id for a in pending})
    module_title_map: dict = {}
    if module_ids:
        try:
            from sqlalchemy import text
            rows = db.execute(
                text("SELECT id, title FROM modules WHERE id = ANY(:ids)"),
                {"ids": [str(m) for m in module_ids]},
            ).fetchall()
            module_title_map = {row[0]: row[1] for row in rows}
        except Exception:
            pass  # title lookup is best-effort

    result = []
    for a in pending:
        result.append({
            "assignment_id": str(a.id),
            "module_id": str(a.module_id),
            "module_title": module_title_map.get(str(a.module_id), "Module"),
            "class_id": str(a.class_id),
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "instructions": a.instructions,
            "created_at": a.created_at.isoformat() if a.created_at else datetime.now(timezone.utc).isoformat(),
        })

    logger.info(
        "[assignments] Fetched %d pending assignments for student=%s class=%s",
        len(result), user.id, student_class_id,
    )
    return {"assignments": result}


# ─────────────────────────────────────────────────────────────────────────────
# GET /assignments/all — Teacher fetches all their assignments
# ─────────────────────────────────────────────────────────────────────────────

@assignment_router.get("/assignments/all")
def get_all_assignments(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Return all assignments created by the logged-in teacher, newest first."""
    user = require_user(authorization, db)

    assignments = (
        db.query(Assignment)
        .filter(Assignment.created_by == user.id)
        .order_by(Assignment.created_at.desc())
        .all()
    )

    return {
        "assignments": [
            {
                "assignment_id": str(a.id),
                "module_id": str(a.module_id),
                "class_id": str(a.class_id),
                "due_date": a.due_date.isoformat() if a.due_date else None,
                "instructions": a.instructions,
                "created_at": a.created_at.isoformat() if a.created_at else datetime.now(timezone.utc).isoformat(),
            }
            for a in assignments
        ]
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /submissions — Student submits (completes) an assigned module
# ─────────────────────────────────────────────────────────────────────────────

@assignment_router.post("/submissions", status_code=status.HTTP_201_CREATED)
def create_submission(
    body: CreateSubmissionRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Record a student's completion of a module linked to an assignment.
    student_id is always taken from the JWT — the client never sends it.
    """
    user = require_user(authorization, db)

    assignment_uuid = _parse_uuid(body.assignment_id, "assignment_id")
    completed_dt = _parse_dt(body.completed_at, "completed_at") or datetime.now(timezone.utc)

    # Verify the assignment exists (raises 404 if not)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_uuid).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Idempotency: if student already submitted, return existing row
    existing = (
        db.query(Submission)
        .filter(
            Submission.assignment_id == assignment_uuid,
            Submission.student_id == user.id,
        )
        .first()
    )
    if existing:
        logger.info(
            "[submissions] Student %s already submitted for assignment %s — returning existing",
            user.id, assignment_uuid,
        )
        return {
            "success": True,
            "submission_id": str(existing.id),
            "already_submitted": True,
        }

    submission = Submission(
        assignment_id=assignment_uuid,
        student_id=user.id,
        answers=body.answers or {},
        score=body.score,
        completed_at=completed_dt,
    )
    db.add(submission)
    try:
        db.commit()
        db.refresh(submission)
        logger.info(
            "[submissions] Recorded submission %s for student=%s assignment=%s score=%s",
            submission.id, user.id, assignment_uuid, body.score,
        )
        return {
            "success": True,
            "submission_id": str(submission.id),
            "assignment_id": str(submission.assignment_id),
            "score": submission.score,
            "completed_at": submission.completed_at.isoformat() if submission.completed_at else None,
        }
    except Exception as exc:
        db.rollback()
        logger.warning("[submissions] Failed to create submission: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to record submission.")


# ─────────────────────────────────────────────────────────────────────────────
# GET /assignments/{assignment_id}/submissions — Teacher fetches submissions
# ─────────────────────────────────────────────────────────────────────────────

@assignment_router.get("/assignments/{assignment_id}/submissions")
def get_assignment_submissions(
    assignment_id: str,
    graded: Optional[bool] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Get all submissions for an assignment.
    Gated to the teacher who created the assignment (or admins).
    """
    user = require_user(authorization, db)
    assignment_uuid = _parse_uuid(assignment_id, "assignment_id")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_uuid).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Security check: creator only
    if assignment.created_by != user.id and getattr(user, "role", None) != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view submissions for this assignment.",
        )

    # Filter by graded status if specified
    from app.src.models.user import User
    query = db.query(Submission).filter(Submission.assignment_id == assignment_uuid)
    if graded is not None:
        if graded:
            query = query.filter(Submission.graded_at.isnot(None))
        else:
            query = query.filter(Submission.graded_at.is_(None))

    submissions = query.order_by(Submission.completed_at.desc()).all()

    # Join user names/emails in python mapping to avoid complicated joins in testing
    student_ids = [s.student_id for s in submissions]
    student_map = {}
    if student_ids:
        students = db.query(User).filter(User.id.in_(student_ids)).all()
        student_map = {st.id: st for st in students}

    # Fetch module title
    from sqlalchemy import text
    try:
        row = db.execute(
            text("SELECT title FROM modules WHERE id = :id"),
            {"id": str(assignment.module_id)}
        ).first()
        module_title = row[0] if row else "Interactive Physics Module"
    except Exception:
        module_title = "Interactive Physics Module"

    result = []
    for s in submissions:
        student = student_map.get(s.student_id)
        result.append({
            "submission_id": str(s.id),
            "assignment_id": str(s.assignment_id),
            "student_id": str(s.student_id),
            "student_name": student.name if student else "Unknown Student",
            "student_email": student.email if student else "",
            "answers": s.answers,
            "score": s.score,
            "comment": s.comment,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "graded_at": s.graded_at.isoformat() if s.graded_at else None,
        })

    return {
        "assignment_id": str(assignment.id),
        "module_id": str(assignment.module_id),
        "module_title": module_title,
        "submissions": result,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /submissions/{submission_id}/grade — Teacher reviews and grades a submission
# ─────────────────────────────────────────────────────────────────────────────

@assignment_router.post("/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: str,
    body: GradeSubmissionRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Assign a grade and review comment to a student submission.
    Gated to teachers and admins.
    """
    user = require_user(authorization, db)

    # Gated to teacher/admin
    allowed_roles = {"teacher", "admin", "superadmin"}
    if getattr(user, "role", None) not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Only teachers and admins can grade submissions.",
        )

    submission_uuid = _parse_uuid(submission_id, "submission_id")
    submission = db.query(Submission).filter(Submission.id == submission_uuid).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    # Verify that the teacher owns the assignment linked to this submission
    assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Linked assignment not found for this submission.")

    if assignment.created_by != user.id and getattr(user, "role", None) != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to grade submissions for this assignment.",
        )

    submission.score = body.score
    submission.comment = body.comment
    submission.graded_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(submission)
        logger.info(
            "[submissions] Graded submission %s by teacher=%s with score=%s",
            submission.id, user.id, body.score,
        )
        return {
            "success": True,
            "submission_id": str(submission.id),
            "score": submission.score,
            "comment": submission.comment,
            "graded_at": submission.graded_at.isoformat(),
        }
    except Exception as exc:
        db.rollback()
        logger.warning("[submissions] Failed to grade submission: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to save grade.")


# ─────────────────────────────────────────────────────────────────────────────
# GET /submissions/my — Student fetches their completed submissions
# ─────────────────────────────────────────────────────────────────────────────

@assignment_router.get("/submissions/my")
def get_my_submissions(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Return all submissions for the logged-in student, including assignment details,
    module title, score, comment, completed_at, and graded_at.
    """
    user = require_user(authorization, db)

    submissions = (
        db.query(Submission)
        .filter(Submission.student_id == user.id)
        .order_by(Submission.completed_at.desc())
        .all()
    )

    assignment_ids = [s.assignment_id for s in submissions]
    assignment_map = {}
    if assignment_ids:
        assignments = db.query(Assignment).filter(Assignment.id.in_(assignment_ids)).all()
        assignment_map = {a.id: a for a in assignments}

    module_ids = list({a.module_id for a in assignment_map.values()})
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

    result = []
    for s in submissions:
        a = assignment_map.get(s.assignment_id)
        if not a:
            continue
        result.append({
            "submission_id": str(s.id),
            "assignment_id": str(s.assignment_id),
            "module_id": str(a.module_id),
            "module_title": module_title_map.get(str(a.module_id), "Interactive Physics Module"),
            "score": s.score,
            "comment": s.comment,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "graded_at": s.graded_at.isoformat() if s.graded_at else None,
        })

    return {"submissions": result}


# ─────────────────────────────────────────────────────────────────────────────
# GET /modules — Retrieve all available curriculum modules
# ─────────────────────────────────────────────────────────────────────────────

@assignment_router.get("/modules")
def get_modules(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Get all available modules. If database modules table is empty,
    dynamically seeds the three starter simulations.
    """
    require_user(authorization, db)

    from sqlalchemy import text
    try:
        # Check if modules table has entries
        rows = db.execute(text("SELECT id, title, subject, type, tier_min FROM modules")).fetchall()
    except Exception:
        rows = []

    if not rows:
        # Seed default modules
        default_modules = [
            ("c8e00111-1111-1111-1111-111111111111", "Nearest Tree to Bird", "Physics", "simulation", "primary"),
            ("c8e00222-2222-2222-2222-222222222222", "Farthest Planet from Rocket", "Physics", "simulation", "primary"),
            ("c8e00333-3333-3333-3333-333333333333", "Heaviest Object on Scale", "Physics", "simulation", "primary"),
        ]
        try:
            for mid, title, subject, mtype, tier in default_modules:
                db.execute(
                    text(
                        "INSERT INTO modules (id, title, subject, type, tier_min, config) "
                        "VALUES (:id, :title, :subject, :type, :tier, '{}'::jsonb)"
                    ),
                    {"id": mid, "title": title, "subject": subject, "type": mtype, "tier": tier}
                )
            db.commit()
            rows = db.execute(text("SELECT id, title, subject, type, tier_min FROM modules")).fetchall()
        except Exception as e:
            logger.warning("[modules] Failed to seed default modules: %s", e)
            # Fallback to local returns if table insert fails
            return {
                "modules": [
                    {"id": "c8e00111-1111-1111-1111-111111111111", "title": "Nearest Tree to Bird", "subject": "Physics", "type": "simulation", "tier_min": "primary"},
                    {"id": "c8e00222-2222-2222-2222-222222222222", "title": "Farthest Planet from Rocket", "subject": "Physics", "type": "simulation", "tier_min": "primary"},
                    {"id": "c8e00333-3333-3333-3333-333333333333", "title": "Heaviest Object on Scale", "subject": "Physics", "type": "simulation", "tier_min": "primary"},
                ]
            }

    return {
        "modules": [
            {
                "id": str(r[0]),
                "title": r[1],
                "subject": r[2],
                "type": r[3],
                "tier_min": r[4],
            }
            for r in rows
        ]
    }


