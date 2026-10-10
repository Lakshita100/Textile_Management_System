"""Application configuration using Pydantic Settings."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/textile_manufacturing"

    # Application
    APP_NAME: str = "Textile Manufacturing Intelligence System"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    SQL_ECHO: bool = False

    # CORS (local frontend dev server)
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Environment
    ENVIRONMENT: str = "development"

    # Feature 02 recommendation weights (initial business-rule weights; NOT validated factory parameters)
    REC_WEIGHT_EFFICIENCY: float = 0.40
    REC_WEIGHT_WORKLOAD: float = 0.35
    REC_WEIGHT_QUALITY: float = 0.25
    REC_ALGORITHM_VERSION: str = "rule-based-v1"
    REC_NEUTRAL_SCORE: float = 50.0  # documented fallback for unknown metrics (never 100)
    REC_MIN_QUALITY_SAMPLES: int = 3  # persisted inspections needed before quality enters scoring

    # Scheduling engine (Phase D) — documented assumptions
    REC_PLANNING_HORIZON_DAYS: int = 14
    REC_SETUP_DEFAULT_MINUTES: float = 15.0  # machine model has no setup column yet


settings = Settings()
