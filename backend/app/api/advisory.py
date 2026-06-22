"""
Advisory API endpoint.
GET /api/advisory?aqi=...&category=...&pollutant=...&city=...&lang=...
"""

from fastapi import APIRouter, Query
from app.engines.advisory_engine import generate_health_advisory
from app.models.schemas import AdvisoryResponse

router = APIRouter(prefix="/api", tags=["Advisory"])


@router.get("/advisory", response_model=AdvisoryResponse)
async def get_advisory(
    aqi: int = Query(..., description="Current AQI value"),
    category: str = Query(..., description="CPCB category"),
    pollutant: str = Query("pm2_5", description="Dominant pollutant"),
    city: str = Query("Unknown", description="City name"),
    lang: str = Query("English", description="Language for advisory"),
):
    """
    Generate a health advisory for the given AQI conditions.
    Uses Groq LLM for contextual, multilingual advisory generation.
    """
    advisory = await generate_health_advisory(
        aqi=aqi,
        category=category,
        dominant_pollutant=pollutant,
        attribution={},
        weather={},
        city_name=city,
        language=lang,
    )

    return AdvisoryResponse(**advisory)
