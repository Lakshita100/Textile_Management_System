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

    # Ensure all tables exist
    try:
        Base.metadata.create_all(bind=engine)
        # Ensure default demo accounts exist for local dev/testing
        from app.database import SessionLocal
        from app.models.auth import User
        from app.services.auth import hash_password, seed_user
        db = SessionLocal()
        try:
            seed_user(db, email="buyer@voguegarments.com", password="Buyer12345678", full_name="Vikram Singhania", role="buyer", company="Vogue Garments Ltd")
            seed_user(db, email="worker@everestmills.com", password="Worker12345678", full_name="Ramesh Kumar", role="staff", company="Everest Textile Mills")
            seed_user(db, email="admin@everestmills.com", password="Admin12345678", full_name="Rajesh Mehta", role="admin", company="Everest Textile Mills")

            # Backfill IDs for staff/admin accounts created before login IDs were
            # added. Their existing password hashes and permissions are untouched.
            for account in db.query(User).filter(User.role.in_(["staff", "admin"])).all():
                if not account.login_id:
                    prefix = "ADM" if account.role == "admin" else "EMP"
                    account.login_id = f"{prefix}-{account.id:06d}"
            db.flush()

            # Employee Head Account
            head_user = db.query(User).filter(User.email == "head@gmail.com").first()
            if not head_user:
                head_user = seed_user(db, email="head@gmail.com", password="123456789123", full_name="Employee Head", role="admin", company="Everest Textile Mills")
            if head_user:
                head_user.password_hash = hash_password("123456789123")
                head_user.role = "admin"
                head_user.full_name = "Employee Head"
                if not head_user.login_id:
                    head_user.login_id = f"ADM-{head_user.id:06d}"
                db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"Warning creating tables / seeding: {e}")

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
