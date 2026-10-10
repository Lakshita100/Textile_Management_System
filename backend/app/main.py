"""FastAPI application factory."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.api.routers import alerts, imports, inventory, movements, purchases, suppliers
from app.config import settings
from app.database import check_db_connection
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

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
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
