from fastapi import APIRouter

from app.api import health, machines, production, recommendations

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(machines.router)
api_router.include_router(production.router)
api_router.include_router(recommendations.router)
