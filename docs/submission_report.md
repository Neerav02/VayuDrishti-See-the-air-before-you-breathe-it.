# VayuDrishti — Urban Air Quality Intelligence Platform

**ET AI Hackathon 2026 · Problem Statement 5 Submission Document**  
**Project Name**: VayuDrishti ("See the air before you breathe it")  
**Target Domain**: AI-Powered Urban Air Quality Intelligence for Smart City Intervention  
**Repository**: [https://github.com/Neerav02/VayuDrishti-See-the-air-before-you-breathe-it.](https://github.com/Neerav02/VayuDrishti-See-the-air-before-you-breathe-it.)

---

## 1. Executive Summary

Air pollution in Indian cities is a highly dynamic environmental and public health crisis. Traditional monitoring networks are descriptive; they record what has already passed without providing predictive insights or identifying actionable causes. 

**VayuDrishti** bridges this gap by delivering a zero-cost, end-to-end predictive intelligence system. The platform combines ground-truth monitoring (via OpenAQ) with hourly updated meteorological dispersion models (via Open-Meteo) to:
1. Calculate official CPCB NAQI scores for any Indian municipality.
2. Forecast air quality trajectory 72 hours in advance.
3. Attribute air pollution to vehicular, industrial, construction dust, agricultural burning, or meteorological trapping sources through a transparent heuristic fingerprinting engine.
4. Translate raw chemical readings into contextual, multilingual health advisories using Large Language Models (LLMs).

Administrators gain access to a **Municipal Command Center** to dispatch preemptive traffic and emission controls before threshold crossings occur, while citizens receive personalized warnings to protect their health.

---

## 2. Technical System Design & Decoupled Architecture

VayuDrishti is designed for high-throughput, low-latency, and zero operational costs. It operates on a decoupled client-server architecture:

```
                  ┌───────────────────────────────┐
                  │           Client UIs          │
                  │   (React 18 + Leaflet + SVG)  │
                  └───────────────┬───────────────┘
                                  │ (REST API / JSON)
                                  ▼
                  ┌───────────────────────────────┐
                  │        FastAPI Backend        │
                  │     (Async ASGI Middleware)   │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   OpenAQ API    │      │ Open-Meteo APIs │      │    Groq API     │
│  (Ground Truth  │      │ (Air Quality,   │      │   (Llama 3.3    │
│  Sensors v3)    │      │ Weather, Geo)   │      │ 70B Advisories) │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 2.1 Backend Router (`backend/app/api`)
The backend is built using FastAPI (Python 3.10+). It features consolidated JSON endpoints to minimize round-trips for mobile clients:
* `/api/dashboard`: Consolidates and executes all engine runs asynchronously to serve the frontend in a single payload.
* `/api/resolve-location`: Resolves fuzzy text locations into latitude/longitude coordinates via geocoding.
* `/api/current-aqi`: Evaluates current pollutant concentrations using the CPCB NAQI algorithm.
* `/api/forecast`: Compiles a 72-hour future AQI timeline and flags threshold crossing warnings.
* `/api/source-attribution`: Dissects the pollutant fingerprint to identify likely contributors.

### 2.2 Frontend Client (`frontend/src`)
The client interface is constructed using React 18, Vite, and TailwindCSS:
* **Interactive Map**: Utilizes Leaflet.js and OpenStreetMap (CartoDB Dark Matter tiles) to render spatial distributions of active monitoring stations.
* **Data Visualizations**: Uses custom SVG charts to display 72-hour forecast trends and meteorological covariates without external chart library bloating.
* **Responsive Layouts**: Features a light-themed Citizen Portal for public health, and a dark-themed Municipal Command Center for administrators.

---

## 3. Core Computational Engines

### 3.1 CPCB AQI Calculation Engine
Unlike the US EPA formula used by generic air apps, VayuDrishti strictly adheres to the Indian Central Pollution Control Board (CPCB) National Air Quality Index (NAQI) guidelines. It performs a sub-index conversion for six primary pollutants ($PM_{2.5}$, $PM_{10}$, $NO_2$, $SO_2$, $CO$, $O_3$) using linear interpolation across official breakpoint thresholds:

$$I_p = \frac{I_{high} - I_{low}}{BP_{high} - BP_{low}} \times (C_p - BP_{low}) + I_{low}$$

* The overall AQI is defined as the maximum of all calculated sub-indices: $\text{AQI} = \max(I_1, I_2, \dots, I_k)$.
* The pollutant responsible for this maximum is flagged as the **Dominant Pollutant**.
* The overall score is mapped to one of the six CPCB health categories: Good, Satisfactory, Moderate, Poor, Very Poor, or Severe.

### 3.2 Explainable Source Attribution Engine
To support municipal interventions without opaque machine learning black boxes, VayuDrishti uses a transparent, rule-weighted heuristic fingerprinting matrix:

1. **Vehicular Emissions**: Triggered by high $NO_2$ to $PM_{10}$ ratios ($>0.30$), elevated Carbon Monoxide ($CO$), and temporal peaks matching morning and evening rush hours on weekdays.
2. **Industrial/Power Plants**: Triggered by elevated Sulfur Dioxide ($SO_2 > 20\,\mu\text{g/m}^3$) and persistent nighttime particulate levels when traffic is minimal.
3. **Construction & Road Dust**: Triggered by a high ratio of coarse to fine particulates ($PM_{10} / PM_{2.5} > 2.5$), dry daytime hours, and wind speeds below $8\,\text{km/h}$.
4. **Crop Residue Burning**: Active during seasonal windows (October-November and April-May) when fine particulates ($PM_{2.5}$) spike dramatically, combined with northwesterly winds.
5. **Meteorological Trapping**: Active during atmospheric boundary layer compressions ($<300\,\text{m}$), wind stagnation ($<5\,\text{km/h}$), and high relative humidity ($>80\%$).

### 3.3 72-Hour Forecasting Engine
The forecasting engine parses atmospheric predictions, wind vectors, and relative humidity trends to:
* Compute the projected hourly AQI timeline for the next 72 hours.
* Detect transition points where the air quality category is predicted to worsen (e.g., transitioning from Moderate to Very Poor).
* Alert administrators of these upcoming crossings to support preventative interventions.

### 3.4 LLM-Powered Advisory Engine
The advisory engine uses the Groq API running `llama-3.3-70b-versatile` to convert raw chemical indexes into clear, actionable health advisories.
* **Context-Aware Prompts**: Prompts combine the active AQI category, dominant pollutant, and source attribution breakdown.
* **Multilingual Support**: Supports English, Hindi, Bengali, Tamil, Telugu, and Kannada.
* **Deterministic Fallbacks**: Automatically falls back to rule-based advisories if the API key is missing or rate limits are exceeded.

---

## 4. Municipal Intervention Use Cases

VayuDrishti transforms environmental data into municipal interventions:

* **Preemptive Traffic Diversions**: When the forecasting engine predicts a "Severe" AQI threshold crossing during upcoming morning rush hours due to meteorological trapping, administrators can trigger odd-even traffic schemes or divert commercial diesel trucks.
* **Targeted Industrial Dampening**: If the attribution engine identifies industrial emission shares exceeding $50\%$ alongside low boundary layer heights, command centers can request temporary production load dampening at local power plants.
* **Dust Suppression Deployment**: If coarse dust indexes dominate dry daytime periods, municipal tankers can be dispatched to spray water along active construction corridors.
* **Automated Citizen Broadcasts**: Health advisories are automatically generated in regional languages and can be integrated with SMS or public transit displays to warn vulnerable groups.

---

## 5. Deployment Information

* **Frontend Hosting (Vercel)**: Configured using Vite's optimized build pipeline. Environmental variables map `VITE_API_URL` to the active FastAPI endpoint.
* **Backend Hosting (Render)**: Set up with standard Python WSGI/ASGI configurations, loading async event loops under Uvicorn.
* **Zero-Cost Scaling**: Utilizes free API tiers with robust caching, geocoding fallback protocols, and local unit tests to ensure system stability.
