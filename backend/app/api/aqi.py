"""
AQI, Forecast, and Source Attribution API endpoints.

GET /api/current-aqi?lat=...&lon=...&name=...
GET /api/forecast?lat=...&lon=...
GET /api/source-attribution?lat=...&lon=...
GET /api/dashboard?lat=...&lon=...&name=...&lang=...
"""

import asyncio
from fastapi import APIRouter, Query, HTTPException
from app.services.openmeteo_client import fetch_air_quality, fetch_weather
from app.services.openaq_client import fetch_nearest_stations
from app.engines.aqi_engine import compute_aqi, POLLUTANT_DISPLAY_NAMES
from app.engines.forecast_engine import generate_forecast
from app.engines.attribution_engine import compute_attribution
from app.engines.advisory_engine import generate_health_advisory
from app.models.schemas import (
    AQIResponse,
    ForecastResponse,
    AttributionResponse,
)

router = APIRouter(prefix="/api", tags=["Air Quality"])


@router.get("/current-aqi", response_model=AQIResponse)
async def get_current_aqi(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    name: str = Query("Unknown", description="Location name"),
):
    """
    Get the current CPCB AQI for a given location.
    Fetches live data from Open-Meteo and computes AQI using official CPCB formula.
    """
    try:
        aq_data = await fetch_air_quality(lat, lon)
        weather_data = await fetch_weather(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Data source error: {str(e)}")

    current = aq_data["current"]
    aqi_result = compute_aqi(current)

    return AQIResponse(
        aqi=aqi_result["aqi"],
        category=aqi_result["category"],
        color=aqi_result["color"],
        color_bg=aqi_result["color_bg"],
        health_impact=aqi_result["health_impact"],
        dominant_pollutant=aqi_result["dominant_pollutant"],
        sub_indices=aqi_result["sub_indices"],
        concentrations=current,
        weather=weather_data["current"],
        location={"name": name, "latitude": lat, "longitude": lon},
        timestamp=aq_data.get("current_time"),
        data_source="open-meteo",
    )


@router.get("/forecast", response_model=ForecastResponse)
async def get_forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    name: str = Query("Unknown", description="Location name"),
):
    """
    Get 72-hour CPCB AQI forecast for a given location.
    Uses Open-Meteo's atmospheric dispersion model data, converted through CPCB formula.
    """
    try:
        aq_data = await fetch_air_quality(lat, lon)
        weather_data = await fetch_weather(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Data source error: {str(e)}")

    forecast = generate_forecast(aq_data["hourly"], weather_data["hourly"])

    return ForecastResponse(
        hourly_forecast=forecast["hourly_forecast"],
        threshold_crossings=forecast["threshold_crossings"],
        summary=forecast["summary"],
        total_hours=forecast["total_hours"],
        location={"name": name, "latitude": lat, "longitude": lon},
    )


@router.get("/source-attribution", response_model=AttributionResponse)
async def get_source_attribution(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    name: str = Query("Unknown", description="Location name"),
):
    """
    Get explainable source attribution for current pollution.
    Uses transparent, rule-weighted heuristics — every score is traceable.
    """
    try:
        aq_data = await fetch_air_quality(lat, lon)
        weather_data = await fetch_weather(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Data source error: {str(e)}")

    attribution = compute_attribution(
        pollutant_concentrations=aq_data["current"],
        weather=weather_data["current"],
        timestamp=aq_data.get("current_time"),
    )

    return AttributionResponse(
        sources=attribution["sources"],
        explanations=attribution["explanations"],
        confidence=attribution["confidence"],
        inputs_used=attribution["inputs_used"],
        location={"name": name, "latitude": lat, "longitude": lon},
        timestamp=aq_data.get("current_time"),
    )


@router.get("/dashboard")
async def get_dashboard(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    name: str = Query("Unknown", description="Location name"),
    lang: str = Query("English", description="Advisory language"),
):
    """
    Consolidated dashboard endpoint — returns AQI, forecast, attribution,
    and advisory in a single response for minimal frontend round-trips.
    """
    try:
        aq_data, weather_data, openaq_stations = await asyncio.gather(
            fetch_air_quality(lat, lon),
            fetch_weather(lat, lon),
            fetch_nearest_stations(lat, lon)
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Data source error: {str(e)}")

    # 1. Current AQI
    current = aq_data["current"]
    aqi_result = compute_aqi(current)

    # 2. Forecast
    forecast = generate_forecast(aq_data["hourly"], weather_data["hourly"])

    # 3. Attribution
    attribution = compute_attribution(
        pollutant_concentrations=current,
        weather=weather_data["current"],
        timestamp=aq_data.get("current_time"),
    )

    # 4. Advisory (async — calls Groq)
    advisory = await generate_health_advisory(
        aqi=aqi_result["aqi"],
        category=aqi_result["category"],
        dominant_pollutant=aqi_result.get("dominant_pollutant", "pm2_5"),
        attribution=attribution["sources"],
        weather=weather_data["current"],
        city_name=name,
        language=lang,
    )

    return {
        "aqi": {
            "aqi": aqi_result["aqi"],
            "category": aqi_result["category"],
            "color": aqi_result["color"],
            "color_bg": aqi_result["color_bg"],
            "health_impact": aqi_result["health_impact"],
            "dominant_pollutant": aqi_result["dominant_pollutant"],
            "dominant_pollutant_name": POLLUTANT_DISPLAY_NAMES.get(
                aqi_result["dominant_pollutant"], ""
            ),
            "sub_indices": aqi_result["sub_indices"],
            "concentrations": current,
        },
        "weather": weather_data["current"],
        "forecast": {
            "hourly_forecast": forecast["hourly_forecast"],
            "threshold_crossings": forecast["threshold_crossings"],
            "summary": forecast["summary"],
            "total_hours": forecast["total_hours"],
        },
        "attribution": {
            "sources": attribution["sources"],
            "explanations": attribution["explanations"],
            "confidence": attribution["confidence"],
            "inputs_used": attribution["inputs_used"],
        },
        "advisory": advisory,
        "openaq_stations": openaq_stations,
        "location": {"name": name, "latitude": lat, "longitude": lon},
        "timestamp": aq_data.get("current_time"),
        "data_source": "open-meteo",
    }
