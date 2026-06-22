"""
VayuDrishti — FastAPI Application Entrypoint.

"See the air before you breathe it."

Real-time, hyperlocal air quality intelligence platform for Indian cities.
All data from free, public APIs. CPCB-correct AQI calculation.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import locations, aqi, advisory, map_data, health

# --- Application ---
app = FastAPI(
    title="VayuDrishti API",
    description=(
        "Real-time air quality intelligence for Indian cities. "
        "Live data from OpenAQ & Open-Meteo. "
        "CPCB-correct AQI with 72-hour forecasting, "
        "explainable source attribution, and multilingual advisories."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Routers ---
app.include_router(health.router)
app.include_router(locations.router)
app.include_router(aqi.router)
app.include_router(advisory.router)
app.include_router(map_data.router)


# --- Root ---
@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "VayuDrishti",
        "tagline": "See the air before you breathe it",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }
