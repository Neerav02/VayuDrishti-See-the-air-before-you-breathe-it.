"""
Open-Meteo Geocoding client.

Resolves city/locality names to latitude/longitude using the
free Open-Meteo Geocoding API (no key required).
"""

import httpx
from app.core.config import settings


async def search_location(query: str, count: int = 5) -> list[dict]:
    """
    Search for locations matching the given query string.

    Args:
        query: City or locality name (e.g. "Whitefield, Bengaluru")
        count: Max results to return (default 5)

    Returns:
        List of location dicts with keys:
          - name, country, latitude, longitude, admin1 (state),
            population, timezone
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            settings.OPENMETEO_GEOCODING_BASE,
            params={
                "name": query,
                "count": count,
                "language": "en",
                "format": "json",
            },
        )
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])
    locations = []
    for r in results:
        locations.append({
            "name": r.get("name", ""),
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "country": r.get("country", ""),
            "state": r.get("admin1", ""),
            "population": r.get("population"),
            "timezone": r.get("timezone", ""),
            "id": r.get("id"),
        })
    return locations
