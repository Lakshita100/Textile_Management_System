"""FastAPI application factory."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.api.routers import alerts, imports, inventory, movements, purchases, suppliers
from app.config import settings
from app.database import Base, check_db_connection, engine
import app.models  # noqa: F401
from app.utils.errors import register_exception_handlers


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description=(
            "REST API for the Textile Management System: yarn inventory, stock "
            "movements, low-stock alerts, supplier management, purchase requests, "
            "machines, production, quality, and recommendations."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Ensure all tables (machines, production_jobs, quality_inspections, etc.) exist in Supabase
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning creating tables: {e}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        # Vite may move to 5174 (or another local port) when its default
        # port is occupied. Keep this relaxed only for local development;
        # production continues to use the explicit allowlist above.
        allow_origin_regex=(
            r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
            if settings.ENVIRONMENT.lower() == "development"
            else None
        ),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    @app.get("/health", tags=["system"])
    def health() -> dict:
        """Liveness + database connectivity check."""
        return {
            "status": "ok",
            "database": "up" if check_db_connection() else "down",
            "environment": settings.ENVIRONMENT,
        }

    # Core yarn inventory modules
    app.include_router(inventory.router, prefix=settings.API_PREFIX)
    app.include_router(suppliers.router, prefix=settings.API_PREFIX)
    app.include_router(movements.router, prefix=settings.API_PREFIX)
    app.include_router(alerts.router, prefix=settings.API_PREFIX)
    app.include_router(purchases.router, prefix=settings.API_PREFIX)
    app.include_router(imports.router, prefix=settings.API_PREFIX)

    # Production, quality, scheduling, and machines modules
    app.include_router(api_router, prefix=settings.API_PREFIX)

    return app


app = create_app()
