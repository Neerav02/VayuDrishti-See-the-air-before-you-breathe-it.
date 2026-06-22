"""
Health check endpoint.
GET /api/health
"""

from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Simple health check — proves the backend is alive."""
    return HealthResponse(
        status="healthy",
        service="VayuDrishti API",
        version="1.0.0",
        data_sources={
            "open_meteo": "active (no key required)",
            "openaq": "configured" if settings.OPENAQ_API_KEY else "not configured (optional)",
            "groq": "configured" if settings.GROQ_API_KEY else "not configured (fallback templates active)",
        },
    )
