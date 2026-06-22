# VayuDrishti — Architecture & Data Flow

This document details the architectural layout, core calculation engines, and third-party data flows of the **VayuDrishti** platform.

---

## 1. High-Level Architecture

VayuDrishti operates on a modern, decoupled client-server architecture built for low latency and zero-cost scaling:

```
┌────────────────────────────────────────────────────────┐
│                        Frontend                        │
│                 React 18 + Vite + Recharts             │
│            Leaflet.js Mapping (OSM Dark Tiles)         │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON over HTTP)
                            ▼
┌────────────────────────────────────────────────────────┐
│                        Backend                         │
│                  FastAPI Async Router                  │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
   ┌────────────────┐┌──────────────┐┌──────────────┐
   │   Open-Meteo   ││    OpenAQ    ││   Groq LLM   │
   │ Air & Forecast ││ Ground Stns  ││  Advisories  │
   └────────────────┘└──────────────┘└──────────────┘
```

---

## 2. Core Service Components

### 2.1 Backend Router (`backend/app/api`)
Exposes five main endpoints:
- `/api/health`: Basic diagnostic ping verifying third-party connectivity.
- `/api/resolve-location`: Translates fuzzy location strings (e.g., "Indiranagar") to exact coordinates.
- `/api/current-aqi`: Computes current sub-indices, CPCB index, and dominant pollutant.
- `/api/forecast`: Compiles 72-hour future AQI outlook with worsening alerts.
- `/api/source-attribution`: Dissects current pollution levels to attribute to likely contributors.
- `/api/dashboard`: Consolidates all four engines plus OpenAQ ground-truth stations into a single async-gathered payload to minimize mobile-client round trips.

### 2.2 Engines (`backend/app/engines`)
1. **CPCB AQI Engine**:
   Applies official Indian CPCB linear interpolation:
   $$I_p = \frac{I_{high} - I_{low}}{BP_{high} - BP_{low}} \times (C_p - BP_{low}) + I_{low}$$
   Caps AQI at 500. Determines category severity and dominant pollutant (worst sub-index).

2. **Forecast Engine**:
   Projects 72-hour air quality trends by running future dispersion concentrations through the CPCB formula. Analyzes crossings between index thresholds to alert users of worsening air categories.

3. **Attribution Engine**:
   Implements a transparent, rule-weighted heuristic matrix using meteorology, weekday schedules, time-of-day traffic, and pollutant ratios (e.g., $PM_{2.5}/PM_{10}$) to output traceably explainable pollution source breakdowns (Vehicular, Industrial, Construction Dust, Crop Burning, Meteorological Trapping).

4. **Advisory Engine**:
   Integrates Groq API (`llama-3.3-70b-versatile`) to generate population-specific health advice. Falls back automatically on template-based rules if API keys are absent or rate limits are reached.

---

## 3. Data Integration Strategy (Free Tier Only)

To guarantee the hackathon remains fully operational on a zero-cost architecture:
- **Open-Meteo Air Quality**: Captures 3-day PM2.5, PM10, SO2, NO2, CO, and O3 predictions using atmospheric modeling. No API key needed.
- **OpenAQ v3**: Checks ground-truth monitors nearby (within 25 km) to validate model readings against live sensor arrays. Requires a free API key.
- **Groq API**: Generates rapid, multilingual text advisories. Requires a free developer API key.
