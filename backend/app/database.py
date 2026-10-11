"""Database session and engine configuration for the configured database."""

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
    """Create and verify the configured database engine; never silently fork data."""
    connect_args: dict = {}
    extra_kwargs: dict = {}
    if url.startswith("sqlite"):
        connect_args = {"timeout": 30, "check_same_thread": False}
    else:
        # Supabase's transaction/session pooler caps clients at 15 in session
        # mode. Keep total connections (pool_size + max_overflow) well below
        # that ceiling so concurrent requests don't exhaust the pool.
        extra_kwargs = {
            "pool_size": 3,
            "max_overflow": 7,
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_timeout": 30,
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
        logger.exception("Could not connect to the configured database; refusing to use a separate local database.")
        raise RuntimeError(
            "Could not connect to DATABASE_URL. Check the Supabase connection string and network access. "
            "No local SQLite fallback was opened."
        ) from e


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
