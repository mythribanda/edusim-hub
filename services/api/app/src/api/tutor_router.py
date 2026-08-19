import logging
logger = logging.getLogger("EduSim.api.tutor_router")

from fastapi import APIRouter, Query, Depends, Header, BackgroundTasks
from typing import Optional
from sqlalchemy.orm import Session
import uuid
import hashlib
import asyncio
import re
from datetime import datetime, timezone, timedelta
from redis.asyncio import Redis

from app.src.config.database import get_db
from app.src.services.persistence_service import record_activity, record_search_history, resolve_user_from_authorization
from app.src.modules.tutor.controller import analyze_tutor_controller, TutorQueryRequest
from app.src.modules.tutor import service as tutor_service
from app.src.models.persistence import ChatHistory
from app.src.modules.legacy_rag.generator import generate_openrouter_text_async
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
from openai import AsyncOpenAI
from app.src.api.auth import get_current_user
from app.src.models.user import User
from app.src.config.models import get_primary_model

tutor_router = APIRouter()


async def generate_learning_summary(explanation: str) -> str:
    prompt = f"""
    Please generate a concise educational learning summary from the following physics explanation.
    The summary must:
    1. Be 2-3 sentences maximum.
    2. Capture the main concept taught.
    3. Include important formulas if present.
    4. Capture key learning outcomes.
    5. Be suitable for revision later.
    6. Respond with ONLY the summary text itself, with no introductory or trailing text.

    Explanation:
    {explanation}
    """
    try:
        # Request a short response (150 tokens) to keep usage minimal
        summary = await generate_openrouter_text_async(
            prompt, 
            temperature=0.3, 
            max_output_tokens=150,
            system_prompt="You are a helpful physics summarizer. Create a 2-3 sentence educational summary of the explanation."
        )
        return summary.strip() if summary else "Summary unavailable."
    except Exception as e:
        logger.error(f"[Summary Generator Error] Failed to generate LLM summary: {e}")
        # Graceful fallback: return a truncated explanation structure
        return explanation[:250].strip() + "..."


@tutor_router.post("/analyze-stream")
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


@tutor_router.post("/analyze")
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
        logger.warning("[WARN] No user resolved from auth header — chat will NOT be saved to DB!")
        logger.info(f"  Authorization header present: {bool(authorization)}")
        if authorization and authorization.startswith("Bearer "):
            token_preview = authorization.split(" ", 1)[1][:20] + "..."
            logger.info(f"  Token preview: {token_preview}")
            # Check specifically WHY token failed
            from app.src.utils.auth import decode_token as _decode
            raw_token = authorization.split(" ", 1)[1].strip()
            try:
                import jwt as _jwt
                payload = _jwt.decode(raw_token, options={"verify_exp": False, "verify_signature": False})
                exp = payload.get("exp")
                if exp:
                    from datetime import datetime, timezone
                    exp_dt = datetime.fromtimestamp(exp, tz=timezone.utc)
                    now_dt = datetime.now(timezone.utc)
                    logger.info(f"  Token expired at: {exp_dt} (now: {now_dt}, delta: {now_dt - exp_dt})")
            except Exception:
                logger.info("  Could not decode token for diagnostics")
        
    response = await analyze_tutor_controller(request, student_profile)
    logger.info("--- DEBUG AUTH ---")
    logger.info(f"Authorization Header: {'present' if authorization else 'MISSING'}")
    logger.info(f"Resolved User: {user.id if user else 'NONE (NOT SAVING)'}")
    logger.info("------------------")
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
            logger.error("[DB SAVE SKIPPED] Tutor generation failed")
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
            
            logger.info("--- PERSISTENCE LOG ---")
            logger.info(f"user_id: {user.id}")
            logger.info(f"session_id: {session_id}")
            logger.info(f"topic: {topic}")
            logger.info(f"summary length: {len(summary) if summary else 0}")
            
            logger.info("Before db.add()")
            db.add(user_record)
            db.add(assistant_record)
            logger.info("After db.add()")
            
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

            logger.info("Before db.commit()")
            db.commit()
            logger.info("After db.commit()")
            
            logger.info("Before db.refresh()")
            db.refresh(user_record)
            db.refresh(assistant_record)
            logger.info("After db.refresh()")
            
            logger.info(f"INSERTED RECORD ID: {user_record.id}")
            logger.info("-----------------------")
            
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
            logger.error(f"Exception during save: {repr(e)}")
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save learning summary."})
    
    logger.info("Tutor request:", request.query)
    if explanation:
        try:
            logger.info("LLM response:", explanation[:200])
        except Exception:
            logger.info("LLM response contains non-ascii characters")
    try:
        logger.info("Tutor API response success:", response.get("success") if isinstance(response, dict) else True)
    except Exception:
        pass
    
    return response


@tutor_router.post("/guide")
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
                logger.error(f"Exception during save guide activity: {repr(e)}")
                
        return {
            "success": True,
            "data": response
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Tutor Guide Generation Error: {str(e)}"
        )


@tutor_router.post("/explain-sim")
async def explain_sim(
    request: TutorQueryRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Direct, fast, and RAG-free dynamic LLM explanation for simulation physics events.
    """
    from app.src.modules.tutor.service import explain_simulation_query
    from fastapi import HTTPException
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
            logger.info("[Database] User setting saved in the database: updated")
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
            logger.info("[Database] User setting saved in the database: updated")
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
            logger.info("[Database] Activity logs saved in the database: updated")
            if isinstance(content, dict):
                content["message"] = "Settings saved successfully."
        except Exception as e:
            db.rollback()
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save settings."})
    return content


TUTOR_PROMPTS = {
    "primary": (
        "You are a friendly, encouraging, and patient AI Tutor for primary school children (grades 1-5). "
        "Your task is to help the student learn the topic '{topic}' in the subject '{subject}' "
        "adhering to the '{board}' board curriculum. "
        "Use simple, story-like language, cute real-world analogies (like toys, animals, playground games, or sweets), "
        "and keep descriptions short. End each turn with a gentle, simple, and interactive question to check understanding."
    ),
    "middle": (
        "You are an engaging, curious, and interactive AI Tutor for middle school students (grades 6-8). "
        "Teach the student the topic '{topic}' in the subject '{subject}' following the '{board}' board curriculum. "
        "Explain core ideas in a step-by-step format, introducing basic formulas, definitions, and everyday examples "
        "(like bicycles, kitchen items, or gravity). Ask simple Socratic questions prompting the student to explain "
        "the concepts in their own words."
    ),
    "high_school": (
        "You are a structured, Socratic, and clear AI Tutor for high school students (grades 9-12). "
        "Explain the topic '{topic}' in the subject '{subject}' following the '{board}' board curriculum. "
        "Focus on scientific definitions, formula structures, application equations, and step-by-step reasoning. "
        "Always withhold the direct answer. Instead, ask leading questions and provide hints to guide the student "
        "to work it out themselves. Highlight common exam pitfalls or misconceptions."
    ),
    "university": (
        "You are an advanced, rigorous, and academic AI Tutor for university-level students. "
        "Instruct the student on the topic '{topic}' in the subject '{subject}' following the '{board}' board curriculum. "
        "Provide thorough scientific insights, reference real theoretical frameworks (such as General Relativity, Quantum Mechanics, "
        "Spacetime Curvature, or Field Theories where applicable), rigorous mathematical formulations, equation derivations, "
        "boundary conditions, and advanced engineering/research use cases. Encourage high-level analytical reasoning."
    ),
}

class TutorChatMessage(BaseModel):
    role: str
    content: str

class TutorChatRequest(BaseModel):
    message: str
    topic: str
    subject: str
    board: Optional[str] = "CBSE"
    history: Optional[list[TutorChatMessage]] = None
    session_id: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Redis Semantic Cache Configuration & Helpers
# ─────────────────────────────────────────────────────────────────────────────

redis_client: Optional[Redis] = None

def get_redis_client() -> Optional[Redis]:
    global redis_client
    if not os.getenv("CACHE_ENABLED", "false").lower() == "true":
        return None
    if redis_client is None:
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        redis_db = int(os.getenv("REDIS_DB", 0))
        redis_password = os.getenv("REDIS_PASSWORD", None)
        try:
            redis_client = Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True,
                socket_timeout=2.0,  # quick connection failure for resilience
            )
            logger.info(f"[Redis Cache] Async client initialized targeting {redis_host}:{redis_port}")
        except Exception as e:
            logger.error(f"[Redis Cache Error] Failed to initialize Redis client: {e}")
            redis_client = None
    return redis_client

def normalize_text(text: str) -> str:
    """Normalize text: lowercase, strip punctuation, collapse whitespaces and trim."""
    lowered = text.lower().strip()
    cleaned = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?"\']', '', lowered)
    return " ".join(cleaned.split())

def generate_cache_hash(age_tier: str, topic: str, user_message: str) -> str:
    """Generates a stable sha256 hash of normalized inputs."""
    norm_msg = normalize_text(user_message)
    raw_str = f"{age_tier}|{topic}|{norm_msg}"
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

def generate_cache_key(age_tier: str, topic: str, user_message: str) -> str:
    """Generates a stable cache key based on hashed prompt metadata."""
    h = generate_cache_hash(age_tier, topic, user_message)
    return f"tutor:cache:{h}"

async def check_cache(age_tier: str, topic: str, user_message: str) -> Optional[str]:
    client = get_redis_client()
    if not client:
        return None
    key = generate_cache_key(age_tier, topic, user_message)
    try:
        value = await client.get(key)
        if value:
            logger.info(f"[Redis Cache Hit] Key: {key}")
            return value
    except Exception as e:
        logger.warning(f"[Redis Cache Warning] Failed to fetch key {key}: {e}")
    return None

async def write_cache(age_tier: str, topic: str, user_message: str, response_text: str):
    client = get_redis_client()
    if not client:
        return
    key = generate_cache_key(age_tier, topic, user_message)
    try:
        # Save response in Redis with a 24-hour TTL (86400 seconds)
        await client.set(key, response_text, ex=86400)
        logger.info(f"[Redis Cache Write] Stored key: {key} (24h TTL)")
    except Exception as e:
        logger.error(f"[Redis Cache Error] Failed to save key {key}: {e}")

async def stream_cached_response(text: str):
    """Simulates streaming by returning 15-character chunks with a 20ms delay."""
    chunk_size = 15
    for i in range(0, len(text), chunk_size):
        yield text[i:i+chunk_size]
        await asyncio.sleep(0.02)


# ─────────────────────────────────────────────────────────────────────────────
# Redis-Based Daily Rate Limiting Helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_seconds_until_utc_end_of_day() -> int:
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    seconds = int((tomorrow - now).total_seconds())
    return max(1, seconds)

def get_utc_start_of_tomorrow_iso() -> str:
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return tomorrow.isoformat()

def generate_rate_limit_key(user_id: uuid.UUID) -> str:
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"rate_limit:{user_id}:{today_str}"

rate_redis_client: Optional[Redis] = None

def get_rate_redis_client() -> Optional[Redis]:
    global rate_redis_client
    if rate_redis_client is None:
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        redis_db = int(os.getenv("REDIS_DB", 0))
        redis_password = os.getenv("REDIS_PASSWORD", None)
        try:
            rate_redis_client = Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True,
                socket_timeout=2.0,
            )
            logger.info(f"[Rate Limit] Redis client initialized targeting {redis_host}:{redis_port}")
        except Exception as e:
            logger.error(f"[Rate Limit Error] Failed to initialize Redis client: {e}")
            rate_redis_client = None
    return rate_redis_client

async def is_rate_limited(user_id: uuid.UUID, tier: str) -> Optional[str]:
    """
    Increments and checks daily rate limits for the user.
    Returns resets_at ISO timestamp if limited, else None.
    """
    client = get_rate_redis_client()
    if not client:
        return None  # Fail-open if Redis is down
        
    key = generate_rate_limit_key(user_id)
    limits = {
        "primary": 10,
        "middle": 25,
        "high_school": 50,
        "university": 100,
    }
    limit = limits.get(tier, 50)
    
    try:
        pipe = client.pipeline()
        pipe.incr(key)
        pipe.ttl(key)
        results = await pipe.execute()
        
        current_count = results[0]
        current_ttl = results[1]
        
        # If first request or TTL not set, set TTL to UTC end of day
        if current_count == 1 or current_ttl == -1:
            ttl_seconds = get_seconds_until_utc_end_of_day()
            await client.expire(key, ttl_seconds)
            
        if current_count > limit:
            logger.warning(f"[Rate Limited] User {user_id} ({tier}) exceeded daily limit: {current_count}/{limit}")
            return get_utc_start_of_tomorrow_iso()
            
    except Exception as e:
        logger.error(f"[Rate Limit Error] Failed to verify rate limit for user {user_id}: {e}")
        
    return None



# Model Fallback Configuration (Canonical OpenRouter model IDs per Tier)
TIER_MODELS = {
    "primary":     "meta-llama/llama-3.1-8b-instruct:free",  # Groq free tier
    "middle":      "qwen/qwen-2.5-32b-instruct",
    "high_school": "qwen/qwen-2.5-72b-instruct",
    "university":  "google/gemini-flash-1.5",
}

TIER_FALLBACKS = {
    "primary": [
        "google/gemma-2-9b-it:free",
        "mistralai/mistral-7b-instruct:free",
    ],
    "middle": [
        "qwen/qwen-2.5-72b-instruct",
        "meta-llama/llama-3.3-70b-instruct",
    ],
    "high_school": [
        "meta-llama/llama-3.3-70b-instruct",
        "qwen/qwen-2.5-32b-instruct",
    ],
    "university": [
        "qwen/qwen-2.5-72b-instruct",
        "meta-llama/llama-3.3-70b-instruct",
    ],
}

def estimate_tokens(text: str) -> int:
    """Standard character-count token estimation (1 token ~= 4 characters)."""
    if not text:
        return 0
    return max(1, len(text) // 4)

def log_tutor_request(db_session_factory, student_id: uuid.UUID, tier: str, model_used: str, token_count: int):
    """Saves a request log entry to the database."""
    from app.src.models.persistence import TutorRequestLog
    db = db_session_factory()
    try:
        log_entry = TutorRequestLog(
            student_id=student_id,
            tier=tier,
            model_used=model_used,
            token_count=token_count
        )
        db.add(log_entry)
        db.commit()
        logger.info(f"[Tutor Logs] Logged LLM request for student {student_id}: model={model_used}, tokens={token_count}")
    except Exception as e:
        db.rollback()
        logger.error(f"[Tutor Logs Error] Failed to log LLM request: {e}")
    finally:
        db.close()


async def call_with_fallback(messages: list, student_id: uuid.UUID, tier: str, db_session_factory, topic: str, user_message: str, max_tokens: Optional[int] = None):
    """
    Attempts to serve completions starting from the tier's primary model,
    falling back to standard options for the tier. Logs usage and caches output upon completion.
    """
    primary_model = TIER_MODELS.get(tier, TIER_MODELS["high_school"])
    fallback_models = TIER_FALLBACKS.get(tier, TIER_FALLBACKS["high_school"])
    models_to_try = [primary_model] + fallback_models
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    openai_client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key or "placeholder-key",
    )
    
    # Calculate input tokens
    input_text = " ".join([m["content"] for m in messages])
    input_tokens = estimate_tokens(input_text)
    
    full_response_parts = []
    success_model = None
    
    try:
        for model in models_to_try:
            try:
                logger.info(f"[Tutor Chat] Attempting connection to model: {model} for tier {tier}")
                response = await openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    stream=True,
                    temperature=0.7,
                    timeout=15.0,
                    max_tokens=max_tokens,
                )
                async for chunk in response:
                    if chunk.choices and len(chunk.choices) > 0:
                        content = chunk.choices[0].delta.content
                        if content:
                            success_model = model
                            full_response_parts.append(content)
                            yield content
                            break
                            
                if success_model:
                    async for chunk in response:
                        if chunk.choices and len(chunk.choices) > 0:
                            content = chunk.choices[0].delta.content
                            if content:
                                full_response_parts.append(content)
                                yield content
                    return  # Stream fully served, exit fallback loop
                    
            except Exception as e:
                logger.warning(f"[Tutor Chat Warning] Model {model} failed with error: {repr(e)}. Trying next fallback...")
                continue
                
        # All models failed
        logger.error("[Tutor Chat Error] All fallback models failed to respond.")
        yield "Error: All tutoring models in the fallback chain failed. Please try again later."
    finally:
        if success_model:
            full_response = "".join(full_response_parts)
            output_tokens = estimate_tokens(full_response)
            total_tokens = input_tokens + output_tokens
            log_tutor_request(db_session_factory, student_id, tier, success_model, total_tokens)
            
            # Cache the response asynchronously
            await write_cache(tier, topic, user_message, full_response)


async def generate_history_summary(history_to_summarize: list) -> str:
    """Generates a one-sentence summary of the earlier conversation topics."""
    history_text = "\n".join([f"{msg.role}: {msg.content}" for msg in history_to_summarize])
    prompt = f"""
    Summarize the main topics discussed in this conversation in one short sentence starting with "Earlier in this conversation we discussed: ".
    Keep it very concise.
    
    Conversation:
    {history_text}
    """
    try:
        summary = await generate_openrouter_text_async(
            prompt,
            temperature=0.3,
            max_output_tokens=100,
            system_prompt="You are a helpful physics summarizer. Output only the requested one-sentence summary."
        )
        summary_text = summary.strip()
        if not summary_text.startswith("Earlier in this conversation we discussed:"):
            summary_text = f"Earlier in this conversation we discussed: {summary_text}"
        return summary_text
    except Exception as e:
        logger.error(f"[History Summary Error] Failed: {e}")
        return "Earlier in this conversation we discussed physics concepts."


@tutor_router.post("/chat")
async def tutor_chat(
    request: TutorChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Age-tier aware, board-aligned streaming chatbot endpoint with Redis caching, 
    rate limiting, message window pruning, system prompt caching, and transparent model fallback.
    """
    age_tier_str = current_user.age_tier.value if hasattr(current_user.age_tier, "value") else str(current_user.age_tier)
    
    # 1. Rate Limiting Check
    resets_at = await is_rate_limited(current_user.id, age_tier_str)
    if resets_at:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=429,
            content={
                "error": "daily_limit_reached",
                "resets_at": resets_at
            }
        )
    
    # Calculate exact hash for pregenerated answers
    q_hash = generate_cache_hash(age_tier_str, request.topic, request.message)
    
    # 2. Check tutor_cached_answers database table first (static pregenerated cache)
    from app.src.models.persistence import TutorCachedAnswer
    from app.src.config.database import SessionLocal
    db = SessionLocal()
    try:
        pregen_answer = db.query(TutorCachedAnswer).filter(TutorCachedAnswer.question_hash == q_hash).first()
        if pregen_answer:
            logger.info(f"[Database Pregen Cache Hit] Hash: {q_hash}")
            # Log cache hit in tutor_request_logs (cost = 0, model_used = "db_pregen_cache")
            input_text = request.message
            input_tokens = estimate_tokens(input_text)
            output_tokens = estimate_tokens(pregen_answer.answer)
            total_tokens = input_tokens + output_tokens
            
            log_tutor_request(SessionLocal, current_user.id, age_tier_str, "db_pregen_cache", total_tokens)
            
            return StreamingResponse(
                stream_cached_response(pregen_answer.answer),
                media_type="text/plain"
            )
    except Exception as e:
        logger.error(f"[Database Pregen Cache Error] Failed to query: {e}")
    finally:
        db.close()
        
    # 3. Check Redis semantic cache if caching is enabled
    if os.getenv("CACHE_ENABLED", "false").lower() == "true":
        cached_text = await check_cache(age_tier_str, request.topic, request.message)
        if cached_text:
            # Log cache hit in tutor_request_logs (cost = 0, model_used = "cache")
            input_text = request.message
            input_tokens = estimate_tokens(input_text)
            output_tokens = estimate_tokens(cached_text)
            total_tokens = input_tokens + output_tokens
            
            log_tutor_request(SessionLocal, current_user.id, age_tier_str, "cache", total_tokens)
            
            return StreamingResponse(
                stream_cached_response(cached_text),
                media_type="text/plain"
            )

    # 4. Resolve session_id
    session_id = request.session_id or f"tutor_session:{current_user.id}:{request.topic[:20]}"

    # 5. Load or generate system prompt from database (loaded once per session, stored in user_settings)
    from app.src.repositories.persistence_repository import PersistenceRepository
    db = SessionLocal()
    repo = PersistenceRepository(db)
    prompt_key = f"tutor_prompt:{session_id}"
    system_prompt = repo._get_setting(current_user.id, prompt_key)
    if not system_prompt:
        system_template = TUTOR_PROMPTS.get(age_tier_str, TUTOR_PROMPTS["high_school"])
        board = request.board or current_user.board or "CBSE"
        system_prompt = system_template.format(
            topic=request.topic,
            subject=request.subject,
            board=board
        )
        repo._set_setting(current_user.id, prompt_key, system_prompt)
        db.commit()
    db.close()

    # 6. Apply windowed memory and summary if history exceeds 4 turns
    history = request.history or []
    if len(history) <= 4:
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
    else:
        # Keep only the last 4 messages (2 user + 2 assistant turns)
        history_window = history[-4:]
        older_history = history[:-4]
        
        summary_redis_key = f"tutor:summary:{session_id}"
        summary_text = None
        
        # Check Redis summary cache using rate_redis_client (always active)
        client = get_rate_redis_client()
        if client:
            try:
                summary_text = await client.get(summary_redis_key)
            except Exception as e:
                logger.warning(f"[Summary Cache Get Error] {e}")
                
        if not summary_text:
            summary_text = await generate_history_summary(older_history)
            if client:
                try:
                    await client.set(summary_redis_key, summary_text, ex=86400)
                except Exception as e:
                    logger.warning(f"[Summary Cache Set Error] {e}")
                    
        # Construct message payload
        messages = [{"role": "system", "content": system_prompt}]
        for i, msg in enumerate(history_window):
            content = msg.content
            if i == 0:
                content = f"{summary_text}\n\n{content}"
            messages.append({
                "role": msg.role,
                "content": content
            })

    # Append current user message
    messages.append({
        "role": "user",
        "content": request.message
    })

    # Get max_tokens by tier
    max_tokens_by_tier = {
        "primary": 300,
        "middle": 500,
        "high_school": 700,
        "university": 1000,
    }
    max_tokens = max_tokens_by_tier.get(age_tier_str, 700)

    return StreamingResponse(
        call_with_fallback(messages, current_user.id, age_tier_str, SessionLocal, request.topic, request.message, max_tokens),
        media_type="text/plain"
    )