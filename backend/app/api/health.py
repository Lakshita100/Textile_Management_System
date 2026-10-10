from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.database import check_db_connection, engine
from app.schemas.common import DBHealthResponse, HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", app=settings.APP_NAME, environment=settings.ENVIRONMENT)


@router.get("/health/db", response_model=DBHealthResponse)
def db_health() -> DBHealthResponse:
    ok = check_db_connection()
    detail = "postgresql" if ok else "unreachable"
    return DBHealthResponse(database=detail, connected=ok)
