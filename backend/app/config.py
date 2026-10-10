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
    DATABASE_URL: str = "sqlite:///./textile_dev.db"

    # JWT (placeholder - real deployment requires tested auth)
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # Application
    APP_NAME: str = "Textile Manufacturing Intelligence System"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    ECHO_SQL: bool = False

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Environment
    ENVIRONMENT: str = "development"

    # Feature 02 recommendation weights
    REC_WEIGHT_EFFICIENCY: float = 0.40
    REC_WEIGHT_WORKLOAD: float = 0.35
    REC_WEIGHT_QUALITY: float = 0.25
    REC_ALGORITHM_VERSION: str = "rule-based-v1"
    REC_NEUTRAL_SCORE: float = 50.0


settings = Settings()
