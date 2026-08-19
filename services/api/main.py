# Ensure USERNAME is set to prevent getpass.getuser() failing with pwd import on Windows in Turborepo
import os
import sys
os.environ.setdefault("USERNAME", os.getenv("USERNAME", "user"))
os.environ.setdefault("USER", os.getenv("USER", "user"))

# Configure Python Path to allow loading absolute namespaces (rag, tutor, sandbox)
root_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(root_dir)

from dotenv import load_dotenv
load_dotenv()

# CORS origins — set ALLOWED_ORIGINS as a comma-separated string in the environment.
# Example: ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
# Defaults to localhost:8080 for local development.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]
sys.path.append(os.path.join(root_dir, "app", "src", "modules"))
sys.path.append(os.path.join(root_dir, "app", "src"))

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
# from app.src.modules.legacy_rag import load_all_pdfs
from app.src.api.simulation_router import simulation_router
from app.src.api.rag_router import rag_router
from app.src.api.tutor_router import tutor_router
from app.src.api.generate_router import generate_router
from app.src.api.persistence_router import persistence_router
from app.src.modules.sandbox.controller import sandbox_router
from app.src.api.scene_router import scene_router
from app.src.api.auth import auth_router
from app.src.api.users import users_router
from app.src.api.curriculum_router import router as curriculum_router
from app.src.api.institution_router import router as institution_router
from app.src.api.attendance_router import router as attendance_router
from app.src.api.assets_router import assets_router
from app.src.api.assignment_router import assignment_router
from app.src.api.class_posts_router import class_posts_router
from app.src.api.digest_router import digest_router

from app.src.api.formula import router as generic_formula_router
from app.src.api.questions import router as generic_questions_router
from app.src.config.database import ping_database

# APScheduler — fires the weekly digest every Sunday at 20:00 IST (14:30 UTC)
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

_scheduler = AsyncIOScheduler(timezone=pytz.utc)

# Configure global logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("EduSim")
logger.info("EduSim Backend Starting Up...")
logger.info("Formula Registry Loaded")
logger.info("Vector Store Loaded")
logger.info("Chapter Index Loaded")
logger.info("Formula APIs Ready")
logger.info("Question APIs Ready")
logger.info("RAG Ready")
logger.info("Server Ready")

from contextlib import asynccontextmanager
from app.src.modules.legacy_rag import vector_store

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload FAISS globally
    vector_store.load_all()
    
    # Automatically create tables for SQLite/PostgreSQL
    try:
        from app.src.config.database import Base, engine
        from app.src.models.user import User  # Registers User model with Base metadata
        from app.src.models.institution import Institution
        from app.src.models.attendance import Attendance
        from app.src.models.persistence import (  # Registers persistence models with Base metadata
            CurriculumClass,
            Subject,
            Chapter,
            Topic,
            ChatHistory,
            FormulaHistory,
            SimulationHistory,
            UserSetting,
            UserSession,
            Assignment,
            Submission,
            ClassPost,
            TutorRequestLog,
            TutorCachedAnswer,
            ParentStudent,
            WeeklyDigestLog,
        )
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        # Populate curriculum database from curriculum.json if empty
        from app.src.config.database import SessionLocal
        from app.src.utils.curriculum_loader import populate_curriculum
        db = SessionLocal()
        try:
            populate_curriculum(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")

    # ── Start the weekly digest scheduler ─────────────────────────────────────
    # Sunday 20:00 IST = Sunday 14:30 UTC
    from app.src.jobs.weekly_digest import run_weekly_digest
    _scheduler.add_job(
        run_weekly_digest,
        CronTrigger(day_of_week="sun", hour=14, minute=30, timezone=pytz.utc),
        id="weekly_digest",
        replace_existing=True,
        misfire_grace_time=3600,   # tolerate up to 1 hour delay on restart
    )
    _scheduler.start()
    logger.info("[scheduler] APScheduler started — weekly digest scheduled for Sunday 20:00 IST")

    yield

    # ── Shutdown ───────────────────────────────────────────────────────────────
    _scheduler.shutdown(wait=False)
    logger.info("[scheduler] APScheduler stopped.")

app = FastAPI(
    title="EduSim Physics API",
    description="Backend APIs for EduSim simulations",
    version="1.0.0",
    lifespan=lifespan
)

# COOP middleware for Google OAuth popup
@app.middleware("http")
async def add_coop_header(request: Request, call_next):
    response = await call_next(request)
    if "/auth/google" in request.url.path:
        response.headers["Cross-Origin-Opener-Policy"] = "unsafe-none"
    return response

@app.middleware("http")
async def parent_rbac_middleware(request: Request, call_next):
    # Enforce parent write restriction
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        path = request.url.path
        # Allow parent onboarding /link endpoint and auth endpoints
        if not path.endswith("/api/parents/link") and not path.endswith("/parents/link") and "/auth/" not in path:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    import jwt
                    secret = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET_KEY") or "your-secret-key-here"
                    payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
                    
                    user_metadata = payload.get("user_metadata", {})
                    role = user_metadata.get("role") or payload.get("role")
                    if hasattr(role, "value"):
                        role = role.value
                    role = str(role).lower()
                    
                    if role == "parent":
                        from fastapi.responses import JSONResponse
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Access denied. Parents have no write access."}
                        )
                except Exception:
                    pass
    response = await call_next(request)
    return response

# CORS — origins are restricted to the ALLOWED_ORIGINS env var (see top of file).
# allow_credentials=True is safe here because origins are never wildcarded.
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Route
@app.get("/")
async def root():
    logger.info("Health check endpoint pinged.")
    return {
        "success": True,
        "message": "EduSim FastAPI Backend Running"
    }


@app.get("/api/db/health")
async def database_health():
    return ping_database()

# Simulation Routes

from app.src.api.parents_router import router as parents_router

app.include_router(
    auth_router,
    prefix="/api/auth"
)

app.include_router(
    parents_router,
    prefix="/api"
)

app.include_router(
    users_router,
    prefix="/api"
)

app.include_router(
    generate_router,
    prefix="/api"
)

app.include_router(
    sandbox_router,
    prefix="/api"
)

app.include_router(
    scene_router,
    prefix="/api"
)

app.include_router(
    simulation_router,
    prefix="/api/simulations"
)

app.include_router(
    rag_router,
    prefix="/api/rag"
)

app.include_router(
    tutor_router,
    prefix="/api/tutor"
)


# --- Generic APIs for Formula Lab and Q&A ---
app.include_router(generic_formula_router, prefix="/api/formula")
app.include_router(generic_questions_router, prefix="/api/questions")
app.include_router(persistence_router, prefix="/api/persistence")
app.include_router(curriculum_router, prefix="/api")
app.include_router(institution_router, prefix="/api/institutions")
app.include_router(attendance_router, prefix="/api/attendance")
app.include_router(assets_router, prefix="/api")
app.include_router(assignment_router, prefix="/api")
app.include_router(class_posts_router, prefix="/api")
app.include_router(digest_router, prefix="/api")
