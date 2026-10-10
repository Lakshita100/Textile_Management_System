"""Database session and engine configuration with automatic SQLite fallback."""

from __future__ import annotations

import logging
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""

    pass


def _build_engine(url: str) -> Engine:
    """Create the engine with engine-specific connection options and DLL/driver fallback."""
    connect_args: dict = {}
    extra_kwargs: dict = {}
    if url.startswith("sqlite"):
        connect_args = {"timeout": 30, "check_same_thread": False}
    else:
        extra_kwargs = {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 300,
        }

    try:
        engine = create_engine(
            url,
            echo=settings.ECHO_SQL if hasattr(settings, "ECHO_SQL") else False,
            future=True,
            connect_args=connect_args,
            **extra_kwargs,
        )
        # Test connection DBAPI import
        with engine.connect() as conn:
            pass
        logger.info(f"Successfully initialized DB engine: {url.split('@')[-1] if '@' in url else url}")
        return engine
    except Exception as e:
        logger.warning(
            f"Database engine creation failed for primary URL ({e}). Falling back to local SQLite 'sqlite:///./textile_dev.db'"
        )
        sqlite_url = "sqlite:///./textile_dev.db"
        sqlite_engine = create_engine(
            sqlite_url,
            echo=False,
            future=True,
            connect_args={"timeout": 30, "check_same_thread": False},
        )
        return sqlite_engine


engine = _build_engine(settings.DATABASE_URL)

# Configure SQLite WAL PRAGMAs if engine is SQLite
if str(engine.url).startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _configure_sqlite(dbapi_connection, _connection_record):  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session,
)


def get_db():
    """Dependency for getting a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Verify database connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
