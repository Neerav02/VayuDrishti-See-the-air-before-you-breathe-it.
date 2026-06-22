"""
Open-Meteo Air Quality & Weather Forecast client.

Fetches current + forecast pollutant concentrations and weather
covariates. No API key required.
"""

import httpx
import asyncio
from app.core.config import settings


async def _get_with_retry(url: str, params: dict, retries: int = 2) -> dict:
    """GET with simple retry for transient failures."""
    for attempt in range(retries + 1):
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                return resp.json()
        except (httpx.HTTPError, Exception) as e:
            if attempt < retries:
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            raise


async def fetch_air_quality(lat: float, lon: float) -> dict:
    """
    Fetch current + forecast air quality data from Open-Meteo.

    Returns dict with:
      - "current": dict of current pollutant concentrations
      - "hourly": dict of hourly forecast arrays (up to 5 days)
      - "hourly_time": list of ISO timestamps
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,ammonia,dust,uv_index",
        "hourly": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,ammonia,dust,uv_index",
        "forecast_days": 3,
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(settings.OPENMETEO_AQ_BASE, params=params)
        resp.raise_for_status()
        data = resp.json()

    # Normalize current values
    current_raw = data.get("current", {})
    current = {
        "pm2_5": current_raw.get("pm2_5"),
        "pm10": current_raw.get("pm10"),
        "no2": current_raw.get("nitrogen_dioxide"),
        "so2": current_raw.get("sulphur_dioxide"),
        "co": _ug_to_mg(current_raw.get("carbon_monoxide")),  # Convert µg/m³ → mg/m³ for CPCB
        "o3": current_raw.get("ozone"),
        "nh3": current_raw.get("ammonia"),
    }

    # Normalize hourly arrays
    hourly_raw = data.get("hourly", {})
    hourly = {
        "time": hourly_raw.get("time", []),
        "pm2_5": hourly_raw.get("pm2_5", []),
        "pm10": hourly_raw.get("pm10", []),
        "no2": hourly_raw.get("nitrogen_dioxide", []),
        "so2": hourly_raw.get("sulphur_dioxide", []),
        "co": [_ug_to_mg(v) for v in hourly_raw.get("carbon_monoxide", [])],
        "o3": hourly_raw.get("ozone", []),
        "nh3": hourly_raw.get("ammonia", []),
    }

    return {
        "current": current,
        "hourly": hourly,
        "current_time": current_raw.get("time"),
    }


async def fetch_weather(lat: float, lon: float) -> dict:
    """
    Fetch weather covariates needed for forecasting and source attribution.

    Returns dict with:
      - "current": current weather conditions
      - "hourly": hourly forecast arrays
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m",
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,boundary_layer_height",
        "forecast_days": 3,
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(settings.OPENMETEO_FORECAST_BASE, params=params)
        resp.raise_for_status()
        data = resp.json()

    current_raw = data.get("current", {})
    current = {
        "temperature": current_raw.get("temperature_2m"),
        "humidity": current_raw.get("relative_humidity_2m"),
        "wind_speed": current_raw.get("wind_speed_10m"),
        "wind_direction": current_raw.get("wind_direction_10m"),
    }

    hourly_raw = data.get("hourly", {})
    hourly = {
        "time": hourly_raw.get("time", []),
        "temperature": hourly_raw.get("temperature_2m", []),
        "humidity": hourly_raw.get("relative_humidity_2m", []),
        "wind_speed": hourly_raw.get("wind_speed_10m", []),
        "wind_direction": hourly_raw.get("wind_direction_10m", []),
        "boundary_layer_height": hourly_raw.get("boundary_layer_height", []),
    }

    return {
        "current": current,
        "hourly": hourly,
    }


def _ug_to_mg(value) -> float | None:
    """Convert µg/m³ to mg/m³ (divide by 1000). CPCB CO breakpoints use mg/m³."""
    if value is None:
        return None
    return round(value / 1000.0, 3)
