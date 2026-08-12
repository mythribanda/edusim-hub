from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.src.config.database import get_db
from app.src.models.attendance import Attendance
from pydantic import BaseModel
from uuid import UUID
from datetime import date as DateType

router = APIRouter()

class AttendanceCreate(BaseModel):
    student_id: UUID
    date: DateType
    status: str  # present, absent, late, excused
    marked_by: UUID | None = None
    class_id: str | None = None

class AttendanceResponse(BaseModel):
    id: UUID
    student_id: UUID
    date: DateType
    status: str
    marked_by: UUID | None
    class_id: str | None

    class Config:
        from_attributes = True

@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(attendance_data: AttendanceCreate, db: Session = Depends(get_db)):
    # Check if attendance record already exists for the student and date
    attendance = db.query(Attendance).filter(
        Attendance.student_id == attendance_data.student_id,
        Attendance.date == attendance_data.date
    ).first()

    if attendance:
        # Update existing
        attendance.status = attendance_data.status
        attendance.marked_by = attendance_data.marked_by
        attendance.class_id = attendance_data.class_id
    else:
        # Create new
        attendance = Attendance(
            student_id=attendance_data.student_id,
            date=attendance_data.date,
            status=attendance_data.status,
            marked_by=attendance_data.marked_by,
            class_id=attendance_data.class_id
        )
        db.add(attendance)
    
    db.commit()
    db.refresh(attendance)
    return attendance

@router.get("/student/{student_id}", response_model=list[AttendanceResponse])
def get_student_attendance(student_id: UUID, db: Session = Depends(get_db)):
    return db.query(Attendance).filter(Attendance.student_id == student_id).all()

@router.get("/class/{class_id}", response_model=list[AttendanceResponse])
def get_class_attendance(class_id: str, db: Session = Depends(get_db)):
    return db.query(Attendance).filter(Attendance.class_id == class_id).all()
