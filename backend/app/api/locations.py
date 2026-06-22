"""
Location resolution API.
GET /api/resolve-location?q=<city name>
"""

from fastapi import APIRouter, Query, HTTPException
from app.services.geocoding_client import search_location
from app.models.schemas import LocationSearchResponse

router = APIRouter(prefix="/api", tags=["Location"])


@router.get("/resolve-location", response_model=LocationSearchResponse)
async def resolve_location(q: str = Query(..., description="City or locality name to search")):
    """
    Resolve a city/locality name to coordinates using Open-Meteo Geocoding.
    Returns up to 5 matching locations with latitude, longitude, and metadata.
    """
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    try:
        results = await search_location(q.strip())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Geocoding service error: {str(e)}")

    return LocationSearchResponse(query=q, results=results)
