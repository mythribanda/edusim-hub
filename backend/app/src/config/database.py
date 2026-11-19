import os
import time
import logging
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("EduSim.Database")

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    db_file = Path(__file__).resolve().parents[3] / "edusim.db"
    DATABASE_URL = f"sqlite:///{db_file}"
    logger.info(f"DATABASE_URL is not set. Using local SQLite database.")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency yielding a SQLAlchemy session.
    Guarantees session cleanup, rollback on unhandled exceptions, and prevents session leaks.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def ping_database() -> dict[str, object]:
    """
    Safe database health probe.
    Never exposes raw DATABASE_URL, passwords, or connection credentials.
    """
    start_time = time.time()
    try:
        with engine.connect() as connection:
            if "sqlite" in DATABASE_URL:
                version = connection.execute(text("SELECT sqlite_version();")).scalar_one()
                db_type = "SQLite"
            else:
                version = connection.execute(text("SELECT version();")).scalar_one()
                db_type = "PostgreSQL"
            latency_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "success": True,
            "status": "healthy",
            "message": f"Connected to {db_type}",
            "db_type": db_type,
            "latency_ms": latency_ms,
            "version": str(version),
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "success": False,
            "status": "unhealthy",
            "message": "Database connection failed",
        }
