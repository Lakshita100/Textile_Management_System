from fastapi import APIRouter

from app.api import health, machines, production, quality, recommendations, scheduling

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(machines.router)
api_router.include_router(production.router)
api_router.include_router(quality.router)
api_router.include_router(recommendations.router)
api_router.include_router(scheduling.router)
