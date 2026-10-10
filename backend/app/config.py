"""Application configuration using Pydantic Settings."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    # Local development/demo default: SQLite (zero configuration, ACID, ships
    # with Python). Set DATABASE_URL to a PostgreSQL URL for production — the
    # schema, constraints and migrations are written to work on both engines.
    DATABASE_URL: str = "sqlite:///./textile_dev.db"

    # JWT (placeholder - real deployment requires tested auth)
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # Application
    APP_NAME: str = "Textile Manufacturing Intelligence System"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    # SQL statement echo — keep off by default (the 10k-row import is noisy).
    ECHO_SQL: bool = False

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Environment
    ENVIRONMENT: str = "development"


settings = Settings()
