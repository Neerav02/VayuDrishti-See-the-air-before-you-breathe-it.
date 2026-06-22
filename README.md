# VayuDrishti — "See the air before you breathe it"

**ET AI Hackathon 2026 · Problem Statement 5**
AI-Powered Urban Air Quality Intelligence for Smart City Intervention

---

## What is VayuDrishti?

A real-time, hyperlocal air quality intelligence platform for Indian cities that:

- Pulls **live data** from free public APIs (no mock data, no paid keys)
- Computes the official **CPCB National AQI** (not the US EPA formula)
- Forecasts AQI **72 hours ahead** with threshold-crossing alerts
- Provides **explainable source attribution** (vehicular, industrial, construction, crop burning, meteorological)
- Delivers **multilingual health advisories** powered by Groq LLM
- Shows everything on an **interactive map** with real monitoring stations

## Live Data Sources (All Free)

| Source | What it provides | Auth |
|---|---|---|
| [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) | Forecast-grade pollutant concentrations | None |
| [Open-Meteo Forecast API](https://open-meteo.com/en/docs/) | Wind, humidity, temperature, boundary layer | None |
| [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) | City name → coordinates | None |
| [OpenAQ](https://openaq.org) | Real ground-station readings | Free key |
| [Groq](https://groq.com) | LLM for contextual advisories | Free key |

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env       # Add your GROQ_API_KEY
uvicorn app.main:app --reload
```
→ Backend at `http://localhost:8000` · Swagger at `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
→ Frontend at `http://localhost:5173`

## Architecture

```
User → React Dashboard → FastAPI Backend → Open-Meteo / OpenAQ / Groq
                                ↓
                    ┌───────────┼───────────┐
                    ↓           ↓           ↓
              CPCB AQI    Forecast    Attribution
              Engine      Engine      Engine
                    ↓           ↓           ↓
                    └───────────┼───────────┘
                                ↓
                        Advisory Engine (Groq LLM)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11 + FastAPI |
| Frontend | React 18 + Vite |
| Maps | Leaflet.js + OpenStreetMap (CartoDB dark tiles) |
| Charts | Recharts |
| LLM | Groq API (Llama 3.3 70B) |
| Data | Open-Meteo + OpenAQ |

## Key Differentiators

1. **CPCB-correct AQI** — Official Indian breakpoint tables, not US EPA
2. **72-hour forecast** — Not just current monitoring
3. **Explainable attribution** — Transparent heuristics, not a black box
4. **Zero cost** — Every component is free and open

## License

MIT
