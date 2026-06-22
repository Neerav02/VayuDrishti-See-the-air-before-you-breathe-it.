"""
OpenAQ API v3 client.

Fetches real ground-station pollutant readings for cross-validation
against Open-Meteo model data. Requires a free API key.
"""

import httpx
from app.core.config import settings


async def fetch_nearest_stations(lat: float, lon: float, radius_km: int = 50, limit: int = 10) -> list[dict]:
    """
    Find the nearest OpenAQ monitoring stations within a radius.

    Args:
        lat, lon: Coordinates
        radius_km: Search radius in kilometers
        limit: Max stations to return

    Returns:
        List of station dicts with location, distance, and latest readings.
    """
    if not settings.OPENAQ_API_KEY:
        return []  # Gracefully skip if no API key configured

    headers = {"X-API-Key": settings.OPENAQ_API_KEY}

    # OpenAQ API v3 limits the radius to a maximum of 25000 meters (25 km)
    clamped_radius_m = min(radius_km * 1000, 25000)

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Find nearby locations
            resp = await client.get(
                f"{settings.OPENAQ_BASE}/locations",
                params={
                    "coordinates": f"{lat},{lon}",
                    "radius": clamped_radius_m,
                    "limit": limit,
                    "order_by": "distance",
                },
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()

        stations = []
        for loc in data.get("results", []):
            coords = loc.get("coordinates", {})
            sensors = loc.get("sensors", [])

            # Build a readings dict from sensors
            readings = {}
            for sensor in sensors:
                param = sensor.get("parameter", {})
                param_name = param.get("name", "").lower()
                latest = sensor.get("latest", {})
                value = latest.get("value")

                # Map OpenAQ parameter names to our internal keys
                key_map = {
                    "pm25": "pm2_5",
                    "pm10": "pm10",
                    "no2": "no2",
                    "so2": "so2",
                    "co": "co",
                    "o3": "o3",
                }
                if param_name in key_map and value is not None:
                    readings[key_map[param_name]] = value

            stations.append({
                "id": loc.get("id"),
                "name": loc.get("name", "Unknown"),
                "latitude": coords.get("latitude"),
                "longitude": coords.get("longitude"),
                "distance_km": round((loc.get("distance") or 0) / 1000, 1),
                "readings": readings,
                "provider": loc.get("providers", [{}])[0].get("name", "Unknown") if loc.get("providers") else "Unknown",
            })

        return stations

    except (httpx.HTTPError, Exception):
        # OpenAQ is supplementary — don't fail the whole request if it's down
        return []
