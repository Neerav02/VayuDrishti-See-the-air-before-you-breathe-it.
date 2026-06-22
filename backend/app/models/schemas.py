"""
Pydantic schemas for API request/response models.
"""

from pydantic import BaseModel, Field
from typing import Optional


# --- Location ---

class LocationResult(BaseModel):
    name: str
    latitude: float
    longitude: float
    country: str = ""
    state: str = ""
    population: Optional[int] = None
    timezone: str = ""
    id: Optional[int] = None


class LocationSearchResponse(BaseModel):
    query: str
    results: list[LocationResult]


# --- AQI ---

class PollutantConcentrations(BaseModel):
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    o3: Optional[float] = None
    nh3: Optional[float] = None


class AQIResponse(BaseModel):
    aqi: int
    category: str
    color: str
    color_bg: str
    health_impact: str
    dominant_pollutant: Optional[str] = None
    sub_indices: dict[str, int] = {}
    concentrations: dict[str, Optional[float]] = {}
    weather: dict = {}
    location: dict = {}
    timestamp: Optional[str] = None
    data_source: str = "open-meteo"


# --- Forecast ---

class ForecastPoint(BaseModel):
    time: Optional[str] = None
    aqi: int = 0
    category: str = "Unknown"
    color: str = "#999999"
    dominant_pollutant: Optional[str] = None
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    wind_speed: Optional[float] = None
    humidity: Optional[float] = None
    temperature: Optional[float] = None


class ThresholdCrossing(BaseModel):
    time: Optional[str] = None
    hour_offset: int = 0
    from_category: str = ""
    to_category: str = ""
    direction: str = ""
    aqi: int = 0


class ForecastResponse(BaseModel):
    hourly_forecast: list[ForecastPoint] = []
    threshold_crossings: list[ThresholdCrossing] = []
    summary: str = ""
    total_hours: int = 0
    location: dict = {}


# --- Attribution ---

class AttributionResponse(BaseModel):
    sources: dict[str, int] = {}
    explanations: list[str] = []
    confidence: str = "low"
    inputs_used: dict = {}
    location: dict = {}
    timestamp: Optional[str] = None


# --- Advisory ---

class AdvisoryResponse(BaseModel):
    general: str = ""
    children: str = ""
    elderly: str = ""
    outdoor_workers: str = ""
    respiratory_patients: str = ""
    summary: str = ""
    language: str = "English"
    generated_by: str = ""
    aqi: int = 0
    category: str = ""
    city: str = ""


# --- Map Data ---

class MapStation(BaseModel):
    name: str
    latitude: float
    longitude: float
    aqi: int = 0
    category: str = "Unknown"
    color: str = "#999999"
    dominant_pollutant: Optional[str] = None
    distance_km: float = 0
    provider: str = "Unknown"


class CityMapResponse(BaseModel):
    city: str
    latitude: float
    longitude: float
    stations: list[MapStation] = []
    current_aqi: Optional[int] = None
    current_category: Optional[str] = None
    current_color: Optional[str] = None


# --- Health Check ---

class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "VayuDrishti API"
    version: str = "1.0.0"
    data_sources: dict = {}
