from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.src.config.database import get_db
from app.src.api.auth import get_current_user
from app.src.models.user import User
from app.src.models.persistence import ParentStudent
from pydantic import BaseModel
from uuid import UUID

router = APIRouter(prefix="/parents", tags=["Parents"])

class LinkStudentRequest(BaseModel):
    student_email: str

@router.post("/link")
async def link_student(
    req: LinkStudentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can link student accounts."
        )
    
    student = db.query(User).filter(User.email == req.student_email.strip().lower()).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student account not found."
        )
    
    student_role = student.role.value if hasattr(student.role, "value") else str(student.role)
    if student_role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided email does not belong to a student account."
        )
    
    # Check if already linked
    existing = db.query(ParentStudent).filter(
        ParentStudent.parent_id == current_user.id,
        ParentStudent.student_id == student.id
    ).first()
    
    if existing:
        return {"success": True, "message": "Student is already linked to your account."}
    
    link = ParentStudent(parent_id=current_user.id, student_id=student.id)
    db.add(link)
    db.commit()
    return {"success": True, "message": "Student successfully linked."}

@router.get("/children")
async def get_children(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parent accounts can list linked children."
        )
    
    links = db.query(ParentStudent).filter(ParentStudent.parent_id == current_user.id).all()
    children = []
    for link in links:
        children.append({
            "id": str(link.student.id),
            "name": link.student.name,
            "email": link.student.email,
            "age_tier": link.student.age_tier.value if hasattr(link.student.age_tier, "value") else str(link.student.age_tier)
        })
    return {"success": True, "children": children}


from datetime import datetime, timezone, timedelta

@router.get("/metrics")
async def get_parent_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_str != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parent accounts can access parent metrics."
        )
    
    links = db.query(ParentStudent).filter(ParentStudent.parent_id == current_user.id).all()
    
    now = datetime.now(timezone.utc)
    start_of_week = now - timedelta(days=7)
    
    children_metrics = []
    
    for link in links:
        child = link.student
        child_id = child.id
        
        # 1. Modules completed this week (count from session_events)
        completions_query = db.execute(
            text(
                "SELECT COUNT(DISTINCT module_id) "
                "FROM session_events "
                "WHERE student_id = :student_id "
                "AND event_type = 'completed' "
                "AND created_at >= :start_of_week"
            ),
            {"student_id": child_id, "start_of_week": start_of_week}
        ).scalar()
        modules_completed = completions_query or 0
        
        # 2. Time spent (sum of session duration, calculated from first 'started' to last event per module per day)
        events_rows = db.execute(
            text(
                "SELECT module_id, event_type, created_at "
                "FROM session_events "
                "WHERE student_id = :student_id "
                "AND created_at >= :start_of_week "
                "ORDER BY created_at ASC"
            ),
            {"student_id": child_id, "start_of_week": start_of_week}
        ).fetchall()
        
        daily_module_events = {}
        for row in events_rows:
            mod_id = row[0]
            ev_type = row[1]
            created_at = row[2]
            
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
                
            date_key = created_at.date()
            key = (date_key, mod_id)
            if key not in daily_module_events:
                daily_module_events[key] = []
            daily_module_events[key].append({"event_type": ev_type, "created_at": created_at})
            
        time_spent_seconds = 0
        for key, ev_list in daily_module_events.items():
            started_events = [e for e in ev_list if e["event_type"] == "started"]
            if started_events:
                t_start = min(e["created_at"] for e in started_events)
                t_end = max(e["created_at"] for e in ev_list)
                if t_end > t_start:
                    time_spent_seconds += int((t_end - t_start).total_seconds())
            else:
                if ev_list:
                    t_start = min(e["created_at"] for e in ev_list)
                    t_end = max(e["created_at"] for e in ev_list)
                    if t_end > t_start:
                        time_spent_seconds += int((t_end - t_start).total_seconds())
                        
        # 3. Current homework assignments + due dates + completion status
        homework_data = []
        if child.class_id:
            from app.src.models.persistence import Assignment, Submission
            assignments = db.query(Assignment).filter(Assignment.class_id == child.class_id).all()
            for assign in assignments:
                submission = db.query(Submission).filter(
                    Submission.assignment_id == assign.id,
                    Submission.student_id == child_id
                ).first()
                
                module_row = db.execute(
                    text("SELECT title FROM modules WHERE id = :id"),
                    {"id": assign.module_id}
                ).first()
                module_title = module_row[0] if module_row else "Physics Simulation Assignment"
                
                status_str = "completed" if submission else "pending"
                if status_str == "pending" and assign.due_date:
                    due_date_utc = assign.due_date
                    if due_date_utc.tzinfo is None:
                        due_date_utc = due_date_utc.replace(tzinfo=timezone.utc)
                    if due_date_utc < now:
                        status_str = "overdue"
                        
                homework_data.append({
                    "id": str(assign.id),
                    "module_title": module_title,
                    "due_date": assign.due_date.isoformat() if assign.due_date else None,
                    "status": status_str
                })
                
        # 4. AI tutor topics asked this week (list of unique topics from session_events where event_type = 'asked_tutor')
        tutor_events = db.execute(
            text(
                "SELECT payload "
                "FROM session_events "
                "WHERE student_id = :student_id "
                "AND event_type = 'asked_tutor' "
                "AND created_at >= :start_of_week"
            ),
            {"student_id": child_id, "start_of_week": start_of_week}
        ).fetchall()
        
        topics_set = set()
        for row in tutor_events:
            payload = row[0]
            import json
            if isinstance(payload, str):
                try:
                    payload = json.loads(payload)
                except Exception:
                    payload = {}
            if isinstance(payload, dict):
                topic = payload.get("topic")
                if topic:
                    topics_set.add(topic)
                    
        ai_tutor_topics = sorted(list(topics_set))
        
        # 5. Attendance if child is middle/high_school tier
        child_tier = child.age_tier.value if hasattr(child.age_tier, "value") else str(child.age_tier)
        attendance_data = []
        show_attendance = child_tier in ("middle", "high_school")
        
        if show_attendance:
            from app.src.models.attendance import Attendance
            records = db.query(Attendance).filter(Attendance.student_id == child_id).order_by(Attendance.date.desc()).limit(10).all()
            for rec in records:
                attendance_data.append({
                    "id": str(rec.id),
                    "date": rec.date.isoformat() if hasattr(rec.date, "isoformat") else str(rec.date),
                    "status": rec.status
                })
                
        children_metrics.append({
            "child_id": str(child_id),
            "name": child.name,
            "email": child.email,
            "age_tier": child_tier,
            "modules_completed_this_week": modules_completed,
            "time_spent_seconds": time_spent_seconds,
            "homework_assignments": homework_data,
            "ai_tutor_topics": ai_tutor_topics,
            "show_attendance": show_attendance,
            "attendance": attendance_data
        })
        
    return {"success": True, "metrics": children_metrics}
