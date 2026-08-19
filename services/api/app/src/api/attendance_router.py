"""
attendance_router.py
────────────────────
Endpoints:
  POST /attendance/mark            — teacher marks attendance (validations below)
  GET  /attendance/for-date        — fetch saved records for a class+date (edit prefill)
  GET  /attendance/student/:id     — student's own history  (RBAC: student | parent)
  GET  /attendance/class/:id       — class attendance for a date (RBAC: teacher | admin)
  GET  /attendance/analytics/:class_id — monthly % per student (RBAC: teacher | admin)

Validations on /mark:
  1. Cannot mark attendance for a future date.
  2. Teacher must own the class (class_id matches teacher's profile).
  3. Editing an existing record requires the original mark to be within 2 hours.
     Admins bypass rule 2 and 3.
"""

import logging
from calendar import monthrange
from collections import defaultdict
from datetime import date as DateType, datetime, timezone, timedelta
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.src.api.auth import get_current_user
from app.src.config.database import get_db
from app.src.models.attendance import Attendance
from app.src.models.user import User

logger = logging.getLogger("EduSim.attendance")

router = APIRouter(tags=["Attendance"])

# ── helpers ────────────────────────────────────────────────────────────────────

AttendanceStatus = Literal["present", "absent", "late"]

TEACHER_ROLES = {"teacher", "admin", "superadmin"}
STUDENT_ROLES = {"student"}
PARENT_ROLES  = {"parent"}


def _role(user: User) -> str:
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def _require_teacher(user: User) -> None:
    if _role(user) not in TEACHER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can perform this action.",
        )


def _serialize(rec: Attendance) -> dict:
    return {
        "id": str(rec.id),
        "student_id": str(rec.student_id),
        "subject": rec.subject,
        "faculty_id": str(rec.faculty_id) if rec.faculty_id else None,
        "date": rec.date.isoformat(),
        "status": rec.status,
        "marked_by": str(rec.marked_by) if rec.marked_by else None,
        "marked_by_name": rec.marked_by_name,
        "class_id": rec.class_id,
        "created_at": rec.created_at.isoformat(),
    }


# ── request models ─────────────────────────────────────────────────────────────

class AttendanceEntry(BaseModel):
    """One student's status inside a bulk request."""
    student_id: UUID
    status: AttendanceStatus

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("present", "absent", "late"):
            raise ValueError("status must be present, absent, or late")
        return v


class MarkAttendanceRequest(BaseModel):
    class_id: str
    date: DateType
    subject: Optional[str] = None
    faculty_id: Optional[UUID] = None
    entries: list[AttendanceEntry]


# ── POST /attendance/mark ──────────────────────────────────────────────────────

@router.post("/mark", status_code=status.HTTP_200_OK)
def mark_attendance(
    body: MarkAttendanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark or update attendance for multiple students in a class on a given date.
    Uses upsert semantics so calling twice is safe.
    Teacher / admin only.

    Validations:
      1. Cannot mark attendance for a future date.
      2. Teachers must own the class (class_id must match their profile).
      3. Editing an already-saved record requires the original mark to be < 2 h ago.
         Admins bypass rules 2 and 3.
    """
    _require_teacher(current_user)
    role = _role(current_user)

    # ── 1. No future dates ──────────────────────────────────────────────────
    today = datetime.now(timezone.utc).date()
    if body.date > today:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot mark attendance for a future date.",
        )

    # ── 2. Class ownership (teachers only) ──────────────────────────────────
    if role == "teacher":
        teacher_class = str(current_user.class_id) if current_user.class_id else None
        if teacher_class != body.class_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only mark attendance for your own class.",
            )

    now_utc = datetime.now(timezone.utc)
    two_hours_ago = now_utc - timedelta(hours=2)
    teacher_name = current_user.name
    upserted: list[dict] = []

    for entry in body.entries:
        existing = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == entry.student_id,
                Attendance.date == body.date,
                Attendance.class_id == body.class_id,
                Attendance.subject == body.subject,
            )
            .first()
        )
        if existing:
            # ── 3. 2-hour edit window (teachers only) ──────────────────────
            if role == "teacher":
                marked_at = existing.created_at
                if marked_at.tzinfo is None:
                    marked_at = marked_at.replace(tzinfo=timezone.utc)
                if marked_at < two_hours_ago:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            f"Attendance for {body.date} was marked more than 2 hours ago "
                            "and can no longer be edited. Contact an admin to make changes."
                        ),
                    )
            existing.status = entry.status
            existing.marked_by = current_user.id
            existing.marked_by_name = teacher_name
            existing.faculty_id = body.faculty_id
            upserted.append(_serialize(existing))
        else:
            rec = Attendance(
                student_id=entry.student_id,
                class_id=body.class_id,
                subject=body.subject,
                faculty_id=body.faculty_id,
                date=body.date,
                status=entry.status,
                marked_by=current_user.id,
                marked_by_name=teacher_name,
            )
            db.add(rec)
            db.flush()
            upserted.append(_serialize(rec))

    db.commit()
    logger.info(
        "[attendance] %s marked %d records for class=%s date=%s",
        current_user.email, len(upserted), body.class_id, body.date,
    )
    return {"success": True, "count": len(upserted), "records": upserted}


# ── GET /attendance/for-date ──────────────────────────────────────────────────

@router.get("/for-date")
def get_attendance_for_date(
    class_id: str = Query(...),
    date: DateType = Query(...),
    subject: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch already-saved attendance for a specific class+date combination.
    Used by the teacher portal to prefill the edit form.
    Returns:
      - records[]   — full list
      - by_student  — keyed by student_id for O(1) lookup
      - can_edit    — whether the 2-hour window is still open (teachers)
    Teacher / admin only.
    """
    _require_teacher(current_user)

    query = db.query(Attendance).filter(
        Attendance.class_id == class_id,
        Attendance.date == date,
    )
    if subject:
        query = query.filter(Attendance.subject == subject)

    records = query.all()
    serialized = [_serialize(r) for r in records]

    can_edit = True
    if records and _role(current_user) == "teacher":
        earliest = min((r.created_at for r in records), default=None)
        if earliest:
            if earliest.tzinfo is None:
                earliest = earliest.replace(tzinfo=timezone.utc)
            can_edit = earliest >= datetime.now(timezone.utc) - timedelta(hours=2)

    return {
        "success": True,
        "records": serialized,
        "by_student": {r["student_id"]: r for r in serialized},
        "can_edit": can_edit,
    }


# ── GET /attendance/student/:id ────────────────────────────────────────────────

@router.get("/student/{student_id}")
def get_student_attendance(
    student_id: UUID,
    subject: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return attendance records for a specific student.
    RBAC:
      • Student — can only see own records
      • Parent  — can see linked children
      • Teacher/Admin — can see anyone
    Optional query params: subject, status
    """
    role = _role(current_user)

    if role in STUDENT_ROLES:
        if current_user.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only view their own attendance.",
            )
    elif role in PARENT_ROLES:
        from app.src.models.persistence import ParentStudent
        link = (
            db.query(ParentStudent)
            .filter(
                ParentStudent.parent_id == current_user.id,
                ParentStudent.student_id == student_id,
            )
            .first()
        )
        if not link:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This student is not linked to your parent account.",
            )

    query = db.query(Attendance).filter(Attendance.student_id == student_id)
    if subject:
        query = query.filter(Attendance.subject == subject)
    if status_filter:
        query = query.filter(Attendance.status == status_filter)

    records = query.order_by(Attendance.date.desc()).all()
    return [_serialize(r) for r in records]


# ── GET /attendance/class/:id ──────────────────────────────────────────────────

@router.get("/class/{class_id}")
def get_class_attendance(
    class_id: str,
    date: Optional[DateType] = Query(None, description="Filter to a specific date (YYYY-MM-DD)"),
    subject: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return attendance records for an entire class, optionally filtered to a
    specific date and/or subject.
    RBAC: teacher / admin only.
    """
    _require_teacher(current_user)

    query = db.query(Attendance).filter(Attendance.class_id == class_id)
    if date:
        query = query.filter(Attendance.date == date)
    if subject:
        query = query.filter(Attendance.subject == subject)

    records = query.order_by(Attendance.date.desc(), Attendance.student_id).all()
    return {"success": True, "count": len(records), "records": [_serialize(r) for r in records]}


# ── GET /attendance/analytics/:class_id ───────────────────────────────────────

@router.get("/analytics/{class_id}")
def get_class_analytics(
    class_id: str,
    month: int = Query(..., ge=1, le=12, description="Month number (1-12)"),
    year: int = Query(..., ge=2020, le=2100, description="4-digit year"),
    subject: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Monthly attendance analytics for a class: percentage per student, per subject.
    Returns a sorted list so the teacher can spot students at risk (< 75 %).
    RBAC: teacher / admin only.
    """
    _require_teacher(current_user)

    _, days_in_month = monthrange(year, month)
    from datetime import date as dt_date
    month_start = dt_date(year, month, 1)
    month_end   = dt_date(year, month, days_in_month)

    query = (
        db.query(Attendance)
        .filter(
            Attendance.class_id == class_id,
            Attendance.date >= month_start,
            Attendance.date <= month_end,
        )
    )
    if subject:
        query = query.filter(Attendance.subject == subject)

    records = query.all()

    stats: dict[str, dict[str, dict]] = defaultdict(
        lambda: defaultdict(lambda: {"present": 0, "absent": 0, "late": 0, "total": 0})
    )
    student_names: dict[str, str] = {}

    for rec in records:
        sid  = str(rec.student_id)
        subj = rec.subject or "—"
        stats[sid][subj][rec.status] += 1
        stats[sid][subj]["total"] += 1
        if rec.student and rec.student.name:
            student_names[sid] = rec.student.name

    result = []
    for sid, subjects in stats.items():
        summary: dict = {
            "student_id": sid,
            "student_name": student_names.get(sid, "Unknown"),
            "subjects": [],
            "overall_percentage": 0.0,
        }
        total_present = 0
        total_classes = 0
        for subj, counts in subjects.items():
            subj_total   = counts["total"]
            subj_present = counts["present"] + counts["late"]
            pct = round((subj_present / subj_total) * 100, 1) if subj_total else 0.0
            summary["subjects"].append({
                "subject":    subj,
                "present":    counts["present"],
                "late":       counts["late"],
                "absent":     counts["absent"],
                "total":      subj_total,
                "percentage": pct,
                "at_risk":    pct < 75,
            })
            total_present += subj_present
            total_classes += subj_total

        summary["overall_percentage"] = (
            round((total_present / total_classes) * 100, 1) if total_classes else 0.0
        )
        summary["at_risk"] = summary["overall_percentage"] < 75
        result.append(summary)

    result.sort(key=lambda x: (not x["at_risk"], x["overall_percentage"]))

    return {
        "success": True,
        "class_id": class_id,
        "month": month,
        "year": year,
        "subject_filter": subject,
        "students": result,
    }
