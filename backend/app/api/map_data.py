"""
City Map Data API endpoint.
GET /api/city-map-data?lat=...&lon=...&name=...
"""

from fastapi import APIRouter, Query
from app.services.openaq_client import fetch_nearest_stations
from app.services.openmeteo_client import fetch_air_quality
from app.engines.aqi_engine import compute_aqi
from app.models.schemas import CityMapResponse

router = APIRouter(prefix="/api", tags=["Map"])


@router.get("/city-map-data", response_model=CityMapResponse)
async def get_city_map_data(
    lat: float = Query(..., description="City center latitude"),
    lon: float = Query(..., description="City center longitude"),
    name: str = Query("Unknown", description="City name"),
):
    """
    Get monitoring station locations and AQI data for map rendering.
    Combines OpenAQ ground stations with Open-Meteo model data.
    """
    # Get OpenAQ stations
    stations = await fetch_nearest_stations(lat, lon, radius_km=50)

    # Get current AQI from Open-Meteo for the city center
    try:
        aq_data = await fetch_air_quality(lat, lon)
        aqi_result = compute_aqi(aq_data["current"])
    except Exception:
        aqi_result = {"aqi": 0, "category": "Unknown", "color": "#999999"}

    # For each OpenAQ station that has readings, compute AQI
    map_stations = []
    for station in stations:
        readings = station.get("readings", {})
        if readings:
            station_aqi = compute_aqi(readings)
        else:
            station_aqi = {"aqi": 0, "category": "Unknown", "color": "#999999", "dominant_pollutant": None}

        map_stations.append({
            "name": station["name"],
            "latitude": station["latitude"],
            "longitude": station["longitude"],
            "aqi": station_aqi.get("aqi", 0),
            "category": station_aqi.get("category", "Unknown"),
            "color": station_aqi.get("color", "#999999"),
            "dominant_pollutant": station_aqi.get("dominant_pollutant"),
            "distance_km": station.get("distance_km", 0),
            "provider": station.get("provider", "Unknown"),
        })

    return CityMapResponse(
        city=name,
        latitude=lat,
        longitude=lon,
        stations=map_stations,
        current_aqi=aqi_result.get("aqi"),
        current_category=aqi_result.get("category"),
        current_color=aqi_result.get("color"),
    )
