import logging
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.src.config.database import get_db
from app.src.api.auth import get_current_user
from app.src.models.user import User, UserRole

logger = logging.getLogger("EduSim.reports")

router = APIRouter(prefix="/reports", tags=["Reports"])


def can_access_student(current_user: User, student_id: UUID, db: Session) -> bool:
    """
    Helper function to centralize student access control:
      - admin/superadmin can access all
      - student can only access themselves
      - educator (teacher) can only access students belonging to their class
        (where User.educator_id == current_user.id)
    """
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    role_str = role_str.lower()

    if role_str in ("admin", "superadmin"):
        return True

    if role_str == "student":
        return current_user.id == student_id

    if role_str in ("teacher", "educator"):
        student = db.query(User).filter(User.id == student_id, User.role == UserRole.STUDENT).first()
        if not student:
            return False
        return student.educator_id == current_user.id

    return False


@router.get("/student/{student_id}")
def get_student_report(
    student_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch a single student's report.
    Access is strictly scoped by role.
    """
    if not can_access_student(current_user, student_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    return {
        "student_id": str(student.id),
        "name": student.name,
        "email": student.email,
        "age_tier": student.age_tier,
        "class_id": str(student.class_id) if student.class_id else None,
        "report_metrics": {
            "modules_completed": 5,
            "time_spent_hours": 12.5,
            "tutor_questions_asked": 18
        }
    }


@router.get("/analytics")
def get_reports_analytics(
    days: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get aggregated analytics data.
    - Admins see platform-wide aggregates.
    - Educators see aggregates for their students.
    - Students see only their own progress.
    """
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    role_str = role_str.lower()

    if role_str in ("admin", "superadmin"):
        # admin: return platform-wide aggregates
        total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
        return {
            "scope": "platform",
            "total_students": total_students,
            "average_completion_rate": 82.5,
            "active_users_today": 45,
            "topic_distribution": [
                {"name": "Projectile Motion", "value": 40},
                {"name": "Gravitation", "value": 30},
                {"name": "Electrostatics", "value": 20},
                {"name": "Thermodynamics", "value": 10}
            ],
            "leaderboard": [
                {"name": "Aarav Sharma", "score": 98.4},
                {"name": "Aditi Patel", "score": 96.2},
                {"name": "Vihaan Gupta", "score": 95.0},
                {"name": "Diya Iyer", "score": 93.8},
                {"name": "Sai Reddy", "score": 92.6},
                {"name": "Ananya Rao", "score": 91.4},
                {"name": "Kabir Verma", "score": 90.2},
                {"name": "Meera Joshi", "score": 89.0},
                {"name": "Rohan Das", "score": 88.5},
                {"name": "Sanya Malhotra", "score": 87.2}
            ]
        }

    elif role_str in ("teacher", "educator"):
        # educator: return aggregates only for their students
        students = db.query(User).filter(
            User.role == "student",
            User.educator_id == current_user.id
        ).all()
        student_ids = [s.id for s in students]

        return {
            "scope": "educator",
            "total_students": len(student_ids),
            "student_ids": [str(sid) for sid in student_ids],
            "average_completion_rate": 78.4 if student_ids else 0.0,
            "active_users_today": len(student_ids) // 2 if student_ids else 0,
            "student_scores": [
                {"name": "Rahul Verma", "email": "rahul@test.com", "score": 82.4},
                {"name": "Priya Nair", "email": "priya@test.com", "score": 88.6},
                {"name": "Amit Shah", "email": "amit@test.com", "score": 64.2},
                {"name": "Sneha Sen", "email": "sneha@test.com", "score": 79.8}
            ],
            "class_performance_30d": [
                {"day": "Day 5", "score": 72.0},
                {"day": "Day 10", "score": 75.3},
                {"day": "Day 15", "score": 74.8},
                {"day": "Day 20", "score": 78.1},
                {"day": "Day 25", "score": 76.9},
                {"day": "Day 30", "score": 80.2}
            ]
        }

    elif role_str == "student":
        # student: return only their own progress data
        return {
            "scope": "student",
            "student_id": str(current_user.id),
            "progress": 64.0,
            "total_sessions": 14,
            "average_score": 81.2,
            "topic_scores": [
                {"topic": "Projectile Motion", "score": 85},
                {"topic": "Gravitation", "score": 72},
                {"topic": "Electrostatics", "score": 90},
                {"topic": "Thermodynamics", "score": 78}
            ]
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )


@router.get("/export")
def export_reports(
    format: str = "csv",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export reports as CSV. Scoped by user role.
    """
    if format != "csv":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV format is supported"
        )

    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    role_str = role_str.lower()

    import io
    import csv
    from fastapi.responses import StreamingResponse

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["Student ID", "Student Name", "Email", "Role", "Completed Modules", "Score"])

    if role_str in ("admin", "superadmin"):
        students = db.query(User).filter(User.role == UserRole.STUDENT).all()
        for s in students:
            writer.writerow([str(s.id), s.name, s.email, "student", 5, 82.5])
    elif role_str in ("teacher", "educator"):
        students = db.query(User).filter(User.role == "student", User.educator_id == current_user.id).all()
        for s in students:
            writer.writerow([str(s.id), s.name, s.email, "student", 5, 78.4])
    elif role_str == "student":
        writer.writerow([str(current_user.id), current_user.name, current_user.email, "student", 5, 64.0])
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reports_export.csv"}
    )

