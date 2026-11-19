import sys
import os
# Configure Python Path to allow loading absolute namespaces (rag, tutor, sandbox)
root_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "app", "src", "modules"))
sys.path.append(os.path.join(root_dir, "app", "src"))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, inspect

from app.src.modules.legacy_rag import load_all_pdfs, vector_store
from app.src.api.simulation_router import simulation_router
from app.src.api.rag_router import rag_router
from app.src.api.tutor_router import tutor_router
from app.src.api.generate_router import generate_router
from app.src.api.persistence_router import persistence_router
from app.src.modules.sandbox.controller import sandbox_router
from app.src.api.scene_router import scene_router
from app.src.api.auth import auth_router
from app.src.api.curriculum_router import router as curriculum_router
from app.src.api.laws_of_motion_router import laws_of_motion_router

from app.src.api.formula import router as generic_formula_router
from app.src.api.questions import router as generic_questions_router
from app.src.config.database import ping_database

# Configure global logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("EduSim")
logger.info("EduSim Backend Starting Up...")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload FAISS globally
    try:
        vector_store.load_all()
    except Exception as e:
        logger.warning(f"Vector store preload warning: {e}")

    # Automatically create tables for SQLite/PostgreSQL and sync schema
    try:
        from app.src.config.database import Base, engine, SessionLocal
        from app.src.models.user import User
        from app.src.models.persistence import (
            CurriculumClass,
            Subject,
            Chapter,
            Topic,
            ChatHistory,
            FormulaHistory,
            SimulationHistory,
            UserSetting,
            UserSession,
        )
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")

        # Safe schema migration: add any missing columns in existing SQLite/Postgres tables
        with engine.connect() as conn:
            inspector = inspect(engine)
            if inspector.has_table("users"):
                user_cols = {col["name"] for col in inspector.get_columns("users")}
                is_sqlite = engine.dialect.name == "sqlite"
                ts_type = "DATETIME" if is_sqlite else "TIMESTAMP WITH TIME ZONE"
                new_columns = [
                    ("verification_token_expires_at", ts_type),
                    ("reset_password_token", "VARCHAR(255)"),
                    ("reset_password_token_expires_at", ts_type),
                    ("avatar", "TEXT"),
                    ("updated_at", ts_type),
                    ("last_login_at", ts_type),
                    ("last_active_at", ts_type),
                ]
                for col_name, col_type in new_columns:
                    if col_name not in user_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                            conn.commit()
                            logger.info(f"Schema sync: Added missing column '{col_name}' to users table.")
                        except Exception as col_err:
                            logger.warning(f"Schema sync note for '{col_name}': {col_err}")

        # Populate curriculum database from curriculum.json if empty
        from app.src.utils.curriculum_loader import populate_curriculum
        from app.src.utils.admin_provisioning import ensure_admin_provisioned

        db = SessionLocal()
        try:
            populate_curriculum(db)
            ensure_admin_provisioned(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed during startup initialization: {e}")

    yield


app = FastAPI(
    title="EduSim Physics API",
    description="Backend APIs for EduSim simulations",
    version="1.0.0",
    lifespan=lifespan
)

# --- Secure CORS Configuration ---
# Explicitly configured origins from environment, with secure local fallbacks
allowed_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if allowed_origins_env.strip():
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

# Security requirement: Never combine wildcard origins with allow_credentials=True
allow_creds = True
if "*" in allowed_origins:
    allow_creds = False
    logger.warning("CORS: Wildcard origin '*' detected; setting allow_credentials=False for security compliance.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_creds,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With", "X-Client-Version"],
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
    """Returns safe database health status without leaking DATABASE_URL or passwords."""
    return ping_database()


# Route Registrations
app.include_router(auth_router, prefix="/api/auth")
app.include_router(generate_router, prefix="/api")
app.include_router(sandbox_router, prefix="/api")
app.include_router(scene_router, prefix="/api")
app.include_router(simulation_router, prefix="/api/simulations")
app.include_router(rag_router, prefix="/api/rag")
app.include_router(tutor_router, prefix="/api/tutor")
app.include_router(generic_formula_router, prefix="/api/formula")
app.include_router(generic_questions_router, prefix="/api/questions")
app.include_router(persistence_router, prefix="/api/persistence")
app.include_router(curriculum_router, prefix="/api")
app.include_router(laws_of_motion_router, prefix="/api")
