import uuid
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.src.api.auth import get_current_user
from app.src.config.database import get_db
from app.src.models.persistence import CurriculumClass, Subject, Chapter, Topic
from app.src.models.user import User

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])


@router.get("/classes")
def get_classes(db: Session = Depends(get_db)):
    classes = db.query(CurriculumClass).order_by(CurriculumClass.display_order.asc()).all()
    return classes


@router.get("/classes/{class_id}/subjects")
def get_subjects(class_id: int, db: Session = Depends(get_db)):
    subjects = (
        db.query(Subject)
        .filter(Subject.class_id == class_id)
        .order_by(Subject.display_order.asc())
        .all()
    )
    if not subjects:
        cls = db.query(CurriculumClass).filter(CurriculumClass.id == class_id).first()
        if not cls:
            raise HTTPException(status_code=404, detail="Class not found")
    return subjects


@router.get("/subjects/{subject_id}/chapters")
def get_chapters(
    subject_id: str,
    class_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    # Check if subject_id is a valid UUID
    try:
        sub_uuid = uuid.UUID(subject_id)
        chapters = (
            db.query(Chapter)
            .filter(Chapter.subject_id == sub_uuid)
            .order_by(Chapter.display_order.asc())
            .all()
        )
        if chapters:
            return chapters
        # Check if subject exists
        sub = db.query(Subject).filter(Subject.id == sub_uuid).first()
        if not sub:
            raise HTTPException(status_code=404, detail="Subject not found")
        return []
    except ValueError:
        pass

    # Lookup by subject code or name
    query = db.query(Subject).filter(
        (Subject.code.ilike(subject_id)) | (Subject.name.ilike(subject_id))
    )
    if class_id is not None:
        query = query.filter(Subject.class_id == class_id)

    subjects = query.all()
    if not subjects:
        raise HTTPException(status_code=404, detail=f"Subject '{subject_id}' not found")

    sub_ids = [s.id for s in subjects]
    chapters = (
        db.query(Chapter)
        .filter(Chapter.subject_id.in_(sub_ids))
        .order_by(Chapter.display_order.asc())
        .all()
    )
    return chapters


@router.get("/chapters/{chapter_id}/topics")
def get_topics(chapter_id: str, db: Session = Depends(get_db)):
    # Check if chapter_id is a valid UUID
    try:
        chap_uuid = uuid.UUID(chapter_id)
        topics = (
            db.query(Topic)
            .filter(Topic.chapter_id == chap_uuid)
            .order_by(Topic.display_order.asc())
            .all()
        )
        if topics:
            return topics
        chap = db.query(Chapter).filter(Chapter.id == chap_uuid).first()
        if not chap:
            raise HTTPException(status_code=404, detail="Chapter not found")
        return []
    except ValueError:
        pass

    # Lookup by chapter name
    chap = db.query(Chapter).filter(Chapter.name.ilike(chapter_id)).first()
    if not chap:
        raise HTTPException(status_code=404, detail=f"Chapter '{chapter_id}' not found")

    topics = (
        db.query(Topic)
        .filter(Topic.chapter_id == chap.id)
        .order_by(Topic.display_order.asc())
        .all()
    )
    return topics


@router.get("/search")
def search_curriculum(q: str, db: Session = Depends(get_db)):
    q_lower = f"%{q.lower()}%"
    matches = []

    # Search chapters
    chapters = db.query(Chapter).filter(Chapter.name.ilike(q_lower)).all()
    for ch in chapters:
        s = db.query(Subject).filter(Subject.id == ch.subject_id).first()
        matches.append({
            "title": f"{ch.name} - {s.name if s else ''}",
            "type": "Chapter PDF",
            "url": "#",
        })

    # Search topics
    topics = db.query(Topic).filter(Topic.name.ilike(q_lower)).all()
    for t in topics:
        ch = db.query(Chapter).filter(Chapter.id == t.chapter_id).first()
        ch_name = ch.name if ch else ""
        matches.append({"title": f"{t.name} — {ch_name}", "type": "Notes", "url": "#"})
        matches.append({"title": f"{t.name} — Practice Questions", "type": "Practice", "url": "#"})
        matches.append({
            "title": f"{t.name} — Intro Video",
            "type": "Video",
            "url": f"https://www.youtube.com/results?search_query={t.name}",
        })

    # Dedupe based on title+type
    seen = set()
    uniq = []
    for m in matches:
        key = m["title"] + m["type"]
        if key not in seen:
            seen.add(key)
            uniq.append(m)

    return uniq[:12]


class TopicPayload(BaseModel):
    name: str
    hasSimulation: Optional[bool] = False
    simulationRoute: Optional[str] = None


class ChapterPayload(BaseModel):
    name: str
    topics: List[TopicPayload] = []


class SubjectPayload(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    description: str = ""
    chapters: Union[int, List[ChapterPayload]] = []


class ClassPayload(BaseModel):
    id: int
    name: str
    description: str = ""
    subjects: List[SubjectPayload] = []


@router.post("/seed")
def seed_curriculum(
    payload: List[ClassPayload],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("teacher", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin or Teacher role required to seed curriculum.",
        )

    for c_order, c in enumerate(payload):
        curriculum_class = db.query(CurriculumClass).filter(CurriculumClass.id == c.id).first()
        if not curriculum_class:
            curriculum_class = CurriculumClass(
                id=c.id, name=c.name, description=c.description, display_order=c_order
            )
            db.add(curriculum_class)
        else:
            curriculum_class.name = c.name
            curriculum_class.description = c.description
            curriculum_class.display_order = c_order
        db.flush()

        for s_order, s in enumerate(c.subjects):
            subject = (
                db.query(Subject)
                .filter(Subject.class_id == c.id, Subject.code == s.id)
                .first()
            )
            if not subject:
                subject = Subject(
                    class_id=c.id,
                    code=s.id,
                    name=s.name,
                    description=s.description,
                    icon=s.icon,
                    display_order=s_order,
                )
                db.add(subject)
            else:
                subject.name = s.name
                subject.description = s.description
                subject.icon = s.icon
                subject.display_order = s_order
            db.flush()

            if isinstance(s.chapters, list):
                seen_chaps = set()
                for ch_order, ch in enumerate(s.chapters):
                    chap_name = ch.name.strip()
                    if not chap_name or chap_name.lower() in seen_chaps:
                        continue
                    seen_chaps.add(chap_name.lower())

                    chapter = (
                        db.query(Chapter)
                        .filter(Chapter.subject_id == subject.id, Chapter.name == chap_name)
                        .first()
                    )
                    if not chapter:
                        chapter = Chapter(
                            subject_id=subject.id,
                            name=chap_name,
                            description="",
                            display_order=ch_order,
                        )
                        db.add(chapter)
                    else:
                        chapter.display_order = ch_order
                    db.flush()

                    seen_topics = set()
                    for t_order, t in enumerate(ch.topics):
                        top_name = t.name.strip()
                        if not top_name or top_name.lower() in seen_topics:
                            continue
                        seen_topics.add(top_name.lower())

                        topic = (
                            db.query(Topic)
                            .filter(Topic.chapter_id == chapter.id, Topic.name == top_name)
                            .first()
                        )
                        if not topic:
                            topic = Topic(
                                chapter_id=chapter.id,
                                name=top_name,
                                has_simulation=bool(t.hasSimulation),
                                simulation_route=t.simulationRoute,
                                display_order=t_order,
                            )
                            db.add(topic)
                        else:
                            topic.has_simulation = bool(t.hasSimulation)
                            topic.simulation_route = t.simulationRoute
                            topic.display_order = t_order

    db.commit()
    return {"status": "success", "message": "Curriculum seeded successfully."}
