import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from app.src.models.persistence import CurriculumClass, Subject, Chapter, Topic

logger = logging.getLogger("curriculum_loader")


def populate_curriculum(db: Session) -> None:
    # Check if curriculum already populated
    if db.query(CurriculumClass).first() is not None and db.query(Subject).first() is not None:
        return

    curriculum_path = Path(__file__).resolve().parents[1] / "data" / "curriculum.json"
    if not curriculum_path.exists():
        logger.warning(f"[Curriculum Loader] File not found at {curriculum_path}")
        return

    try:
        with open(curriculum_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        logger.error(f"[Curriculum Loader] Failed to read curriculum.json: {e}")
        return

    logger.info("[Curriculum Loader] Populating database from curriculum.json...")
    classes = data.get("classes", [])

    for c_idx, class_item in enumerate(classes, 1):
        class_id = class_item.get("id", c_idx)
        class_name = class_item.get("name", f"Class {class_id}")
        class_desc = class_item.get("description", "")

        curriculum_class = db.query(CurriculumClass).filter(CurriculumClass.id == class_id).first()
        if not curriculum_class:
            curriculum_class = CurriculumClass(
                id=class_id,
                name=class_name,
                description=class_desc,
                display_order=class_id,
            )
            db.add(curriculum_class)
            db.flush()

        subjects = class_item.get("subjects", [])
        for s_idx, sub_item in enumerate(subjects, 1):
            code = sub_item.get("id") or sub_item.get("code") or f"subject_{s_idx}"
            sub_name = sub_item.get("name", code.capitalize())
            sub_desc = sub_item.get("description", "")
            sub_icon = sub_item.get("icon", "Book")

            subject = (
                db.query(Subject)
                .filter(Subject.class_id == class_id, Subject.code == code)
                .first()
            )
            if not subject:
                subject = Subject(
                    class_id=class_id,
                    code=code,
                    name=sub_name,
                    description=sub_desc,
                    icon=sub_icon,
                    display_order=s_idx,
                )
                db.add(subject)
                db.flush()

            chapters = sub_item.get("chapters", [])
            seen_chapter_names = set()

            if isinstance(chapters, list):
                for ch_idx, chap_item in enumerate(chapters, 1):
                    chap_name = chap_item.get("name", f"Chapter {ch_idx}").strip()
                    if not chap_name or chap_name.lower() in seen_chapter_names:
                        continue
                    seen_chapter_names.add(chap_name.lower())

                    chap_desc = chap_item.get("description", "")

                    chapter = (
                        db.query(Chapter)
                        .filter(Chapter.subject_id == subject.id, Chapter.name == chap_name)
                        .first()
                    )
                    if not chapter:
                        chapter = Chapter(
                            subject_id=subject.id,
                            name=chap_name,
                            description=chap_desc,
                            display_order=ch_idx,
                        )
                        db.add(chapter)
                        db.flush()

                    topics = chap_item.get("topics", [])
                    seen_topic_names = set()
                    for t_idx, top_item in enumerate(topics, 1):
                        top_name = top_item.get("name", f"Topic {t_idx}").strip()
                        if not top_name or top_name.lower() in seen_topic_names:
                            continue
                        seen_topic_names.add(top_name.lower())

                        top_desc = top_item.get("description", "")
                        has_sim = bool(top_item.get("hasSimulation", False))
                        sim_route = top_item.get("simulationRoute")

                        topic = (
                            db.query(Topic)
                            .filter(Topic.chapter_id == chapter.id, Topic.name == top_name)
                            .first()
                        )
                        if not topic:
                            topic = Topic(
                                chapter_id=chapter.id,
                                name=top_name,
                                description=top_desc,
                                has_simulation=has_sim,
                                simulation_route=sim_route,
                                display_order=t_idx,
                            )
                            db.add(topic)
            elif isinstance(chapters, (int, float)):
                # Chapter count without expanded list: generate numbered chapters
                for i in range(1, int(chapters) + 1):
                    chap_name = f"Chapter {i}"
                    chapter = (
                        db.query(Chapter)
                        .filter(Chapter.subject_id == subject.id, Chapter.name == chap_name)
                        .first()
                    )
                    if not chapter:
                        chapter = Chapter(
                            subject_id=subject.id,
                            name=chap_name,
                            description=f"Class {class_id} {sub_name} Chapter {i}",
                            display_order=i,
                        )
                        db.add(chapter)
                        db.flush()

                        topic = Topic(
                            chapter_id=chapter.id,
                            name="Introduction",
                            description=f"Overview of {chap_name}",
                            has_simulation=False,
                            simulation_route=None,
                            display_order=1,
                        )
                        db.add(topic)

    db.commit()
    logger.info("[Curriculum Loader] Database curriculum population complete.")
