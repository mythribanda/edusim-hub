import re
import logging
logger = logging.getLogger("EduSim.TutorRouter")
from fastapi import APIRouter, Query, Depends, Header, BackgroundTasks
from fastapi import HTTPException, status
from app.src.models.user import User
from app.src.api.auth import get_current_user
from app.src.utils.rate_limiter import rate_limit_ai
from typing import Optional
from sqlalchemy.orm import Session
import uuid

from app.src.config.database import get_db
from app.src.services.persistence_service import record_activity, record_search_history, resolve_user_from_authorization
from app.src.modules.tutor.controller import analyze_tutor_controller, TutorQueryRequest
from app.src.modules.tutor import service as tutor_service
from app.src.models.persistence import ChatHistory
from app.src.modules.legacy_rag.generator import generate_openrouter_text_async
from fastapi.responses import StreamingResponse

tutor_router = APIRouter()


def extract_learning_summary(explanation: str) -> str:
    """Extracts a concise educational summary deterministically without making an LLM API call."""
    if not explanation or "Error:" in explanation:
        return "Summary unavailable."
    
    # 1. Look for explicit Summary or Conclusion sections in markdown
    summary_match = re.search(r'#+\s*(?:Summary|Conclusion|Key Takeaways?)\s*\n+(.*?)(?=\n#+|$)', explanation, re.IGNORECASE | re.DOTALL)
    if summary_match:
        section_text = summary_match.group(1).strip()
        lines = [line.strip().lstrip("*-• ") for line in section_text.split("\n") if line.strip() and not line.strip().startswith("#")]
        if lines:
            return " ".join(lines[:3])[:350]

    # 2. Look for Definition or Key Points sections
    def_match = re.search(r'#+\s*(?:Definition|Key Points?|Overview)\s*\n+(.*?)(?=\n#+|$)', explanation, re.IGNORECASE | re.DOTALL)
    if def_match:
        section_text = def_match.group(1).strip()
        lines = [line.strip().lstrip("*-• ") for line in section_text.split("\n") if line.strip() and not line.strip().startswith("#")]
        if lines:
            return " ".join(lines[:3])[:350]

    # 3. Fallback: extract the first 2-3 substantive sentences from clean prose
    clean = re.sub(r'#+.*?\n', '', explanation)
    clean = re.sub(r'```.*?```', '', clean, flags=re.DOTALL)
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean) if len(s.strip()) > 20 and not s.strip().startswith(("#", "-", "*", "|"))]
    if sentences:
        return " ".join(sentences[:3])[:350]
        
    return explanation[:250].strip() + ("..." if len(explanation) > 250 else "")

async def generate_learning_summary(explanation: str) -> str:
    """Local extractor preserving async interface for backward compatibility."""
    return extract_learning_summary(explanation)


@tutor_router.post("/analyze-stream", dependencies=[Depends(rate_limit_ai)])
async def analyze_query_stream(
    request: TutorQueryRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Analyzes a physics query and streams the response back for ultra-fast first token.
    """
    from app.src.modules.tutor.service import analyze_tutor_query_stream
    from fastapi.responses import StreamingResponse
    from app.src.config.database import SessionLocal
    
    user = resolve_user_from_authorization(authorization, db)
    student_profile = None
    if user:
        from app.src.repositories.student_repository import StudentRepository
        profile_obj = StudentRepository.get_or_create_profile(db, user.id)
        student_profile = {
            "skill_level": profile_obj.skill_level,
            "mastered_topics": profile_obj.mastered_topics,
            "misconceptions": profile_obj.misconceptions
        }
        
    history_dicts = None
    if request.history:
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]
    return StreamingResponse(
        analyze_tutor_query_stream(
            request.query,
            history=history_dicts,
            subject=request.subject,
            chapter=request.chapter,
            topic=request.topic,
            student_profile=student_profile,
            user_id=user.id if user else None,
            db_session_factory=SessionLocal
        ),
        media_type="text/event-stream"
    )


@tutor_router.post("/analyze", dependencies=[Depends(rate_limit_ai)])
async def analyze_query(
    request: TutorQueryRequest,
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Analyzes a physics query to detect concepts, formulas, and provide AI/RAG explanations.
    """
    user = resolve_user_from_authorization(authorization, db)
    student_profile = None
    if user:
        from app.src.repositories.student_repository import StudentRepository
        profile_obj = StudentRepository.get_or_create_profile(db, user.id)
        student_profile = {
            "skill_level": profile_obj.skill_level,
            "mastered_topics": profile_obj.mastered_topics,
            "misconceptions": profile_obj.misconceptions
        }
    else:
        logger.debug("No authenticated user resolved from Authorization header. Session will run in guest mode.")
        
    response = await analyze_tutor_controller(request, student_profile)
    data = response.get("data", {}) if isinstance(response, dict) else {}
    explanation = data.get("explanation") or data.get("ai_explanation") or ""
    
    if user:
        from app.src.repositories.persistence_repository import PersistenceRepository
        repo = PersistenceRepository(db)
        sessions = repo.list_tutor_sessions(user.id)
        
        session_id = None
        if request.session_id:
            try:
                session_id = uuid.UUID(request.session_id)
            except Exception:
                pass
                
        if not session_id:
            session_id = uuid.uuid4()
        
        # 1. Extract the topic
        concepts = data.get("concepts") or []
        topic = concepts[0] if concepts else request.query
        if len(topic) > 100:
            topic = topic[:97] + "..."
            
        if "Error:" in explanation:
            print("[DB SAVE SKIPPED] Tutor generation failed")
            return response
            
        # 2. Generate a concise educational summary
        summary = await generate_learning_summary(explanation)
        
        # 3. Save the summary and explanation into chat_history
        try:
            user_record = ChatHistory(
                user_id=user.id,
                session_id=session_id,
                session_type="tutor",
                role="user",
                topic=topic,
                content=request.query,
                summary=summary,
                metadata_json={
                    "class_name": request.class_name,
                    "subject": request.subject,
                    "chapter": request.chapter,
                    "topic": request.topic
                }
            )
            
            assistant_record = ChatHistory(
                user_id=user.id,
                session_id=session_id,
                session_type="tutor",
                role="assistant",
                topic=topic,
                content=explanation,
                summary=None,
                metadata_json={
                    "class_name": request.class_name,
                    "subject": request.subject,
                    "chapter": request.chapter,
                    "topic": request.topic
                }
            )
            
            print("--- PERSISTENCE LOG ---")
            print(f"user_id: {user.id}")
            print(f"session_id: {session_id}")
            print(f"topic: {topic}")
            print(f"summary length: {len(summary) if summary else 0}")
            
            print("Before db.add()")
            db.add(user_record)
            db.add(assistant_record)
            print("After db.add()")
            
            record_activity(
                db,
                user=user,
                domain="tutor",
                action="analyze",
                entity_type="query",
                entity_id=request.query[:120],
                source="/api/tutor/analyze",
                metadata={"topic": topic},
            )

            print("Before db.commit()")
            db.commit()
            print("After db.commit()")
            
            print("Before db.refresh()")
            db.refresh(user_record)
            db.refresh(assistant_record)
            print("After db.refresh()")
            
            print(f"INSERTED RECORD ID: {user_record.id}")
            print("-----------------------")
            
            if isinstance(response, dict):
                response["success"] = True
                response["message"] = "Learning summary saved successfully"
                response["session_id"] = str(session_id)
                
            # Queue profile update in background
            if explanation and "Error:" not in explanation:
                from app.src.config.database import SessionLocal
                from app.src.modules.tutor.service import analyze_and_update_profile_task
                background_tasks.add_task(
                    analyze_and_update_profile_task,
                    SessionLocal,
                    user.id,
                    request.query,
                    explanation
                )
        except Exception as e:
            db.rollback()
            print(f"Exception during save: {repr(e)}")
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save learning summary."})
    
    print("Tutor request:", request.query)
    if explanation:
        try:
            print("LLM response:", explanation[:200])
        except Exception:
            print("LLM response contains non-ascii characters")
    try:
        print("Tutor API response success:", response.get("success") if isinstance(response, dict) else True)
    except Exception:
        pass
    
    return response


@tutor_router.post("/guide", dependencies=[Depends(rate_limit_ai)])
async def get_tutor_guide(
    request: TutorQueryRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Analyzes a physics query to construct only the simulation guide/instructions (saving tokens).
    """
    from app.src.modules.tutor.service import generate_tutor_guide
    from fastapi import HTTPException
    
    try:
        response = await generate_tutor_guide(request.query)
        user = resolve_user_from_authorization(authorization, db)
        if user:
            concepts = request.topic or request.query
            if len(concepts) > 100:
                concepts = concepts[:97] + "..."
            
            record_activity(
                db,
                user=user,
                domain="tutor",
                action="guide",
                entity_type="query",
                entity_id=request.query[:120],
                source="/api/tutor/guide",
                metadata={"topic": concepts},
            )
            try:
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"Exception during save guide activity: {repr(e)}")
                
        return {
            "success": True,
            "data": response
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Tutor Guide Generation Error: {str(e)}"
        )


_LAST_EXPLAIN_REQUEST_TIME: float = 0.0
_EXPLAIN_COOLDOWN_WINDOW: float = 1.5  # seconds

@tutor_router.post("/explain-sim", dependencies=[Depends(rate_limit_ai)])
async def explain_sim(
    request: TutorQueryRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Direct, fast, and RAG-free dynamic LLM explanation for simulation physics events.
    Includes rate-limiting cooldown and server-side query deduplication cache.
    """
    global _LAST_EXPLAIN_REQUEST_TIME
    import time
    from app.src.modules.tutor.service import explain_simulation_query, _SIM_EXPLAIN_CACHE
    from fastapi import HTTPException

    cache_key = request.query.strip().lower()
    now = time.time()

    # If within cooldown, serve from cache if available or reject burst requests
    if now - _LAST_EXPLAIN_REQUEST_TIME < _EXPLAIN_COOLDOWN_WINDOW:
        if cache_key in _SIM_EXPLAIN_CACHE:
            return {
                "success": True,
                "data": _SIM_EXPLAIN_CACHE[cache_key],
                "cached": True
            }
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a moment between simulation explanation requests."
        )

    _LAST_EXPLAIN_REQUEST_TIME = now
    try:
        history_dicts = None
        if request.history:
            history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]
        data = await explain_simulation_query(request.query, history=history_dicts)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation Explanation Error: {str(e)}"
        )


@tutor_router.get("/search")
async def search_curriculum(
    q: str = Query(..., min_length=1),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Search the curriculum and return matching subjects/chapters/topics."""
    results = tutor_service.search_curriculum(q)
    user = resolve_user_from_authorization(authorization, db)
    if user:
        record_search_history(
            db,
            user=user,
            payload={
                "query": q,
                "scope": "curriculum",
                "result_count": len(results),
                "results_json": results,
            },
        )
        try:
            db.commit()
            print("[Database] User setting saved in the database: updated")
            return {"query": q, "results": results, "message": "Settings saved successfully."}
        except Exception as e:
            db.rollback()
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save settings."})
    return {"query": q, "results": results}


@tutor_router.get("/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=1),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Return autocomplete suggestions for curriculum topics/chapters."""
    suggestions = tutor_service.autocomplete_curriculum(q)
    user = resolve_user_from_authorization(authorization, db)
    if user:
        record_search_history(
            db,
            user=user,
            payload={
                "query": q,
                "scope": "autocomplete",
                "result_count": len(suggestions),
                "results_json": suggestions,
            },
        )
        try:
            db.commit()
            print("[Database] User setting saved in the database: updated")
            return {"query": q, "results": suggestions, "suggestions": suggestions, "message": "Settings saved successfully."}
        except Exception as e:
            db.rollback()
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save settings."})
    return {"query": q, "results": suggestions, "suggestions": suggestions}


@tutor_router.get("/topic")
async def get_topic(
    subject: str,
    class_name: str,
    chapter: str,
    topic: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Load stored curriculum content for the selected topic/chapter."""
    content = tutor_service.get_topic_content(subject, class_name, chapter, topic)
    user = resolve_user_from_authorization(authorization, db)
    if user:
        record_activity(
            db,
            user=user,
            domain="curriculum",
            action="open-topic",
            entity_type="topic",
            entity_id=f"{subject}:{class_name}:{chapter}:{topic or ''}",
            source="/api/tutor/topic",
            metadata={"subject": subject, "class_name": class_name, "chapter": chapter, "topic": topic},
        )
        try:
            db.commit()
            print("[Database] Activity logs saved in the database: updated")
            if isinstance(content, dict):
                content["message"] = "Settings saved successfully."
        except Exception as e:
            db.rollback()
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save settings."})
    return content


@tutor_router.get("/usage-stats")
async def get_usage_statistics():
    """Returns centralized OpenRouter API token and request usage statistics."""
    from app.src.utils.llm_tracker import llm_tracker
    return {
        "success": True,
        "metrics": llm_tracker.get_metrics(),
        "recent_calls": llm_tracker.get_recent_calls(20)
    }


@tutor_router.post("/usage-stats/reset")
async def reset_usage_statistics(
    current_user: User = Depends(get_current_user)
):
    """Resets the usage tracking counters. Restricted to admin and teacher roles."""
    if current_user.role not in ("teacher", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin or Teacher role required to reset usage statistics."
        )
    from app.src.utils.llm_tracker import llm_tracker
    llm_tracker.reset()
    return {"success": True, "message": "Usage metrics reset successfully"}
