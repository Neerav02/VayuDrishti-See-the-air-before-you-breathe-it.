# VayuDrishti — Presentation Slide Deck Outline

Use this outline to prepare your presentation slides or script.

---

### Slide 1: Title Slide
* **Title**: VayuDrishti
* **Subtitle**: Urban Air Quality Intelligence for Smart City Interventions
* **Tagline**: "See the air before you breathe it"
* **Event**: ET AI Hackathon 2026 · Problem Statement 5
* **Presenter**: Neerav

---

### Slide 2: The Urban Air Quality Crisis
* **The Problem**:
  * Air pollution in Indian cities is highly dynamic, seasonal, and localized.
  * Existing platforms are retrospective: they tell you what the air was yesterday, not what it will be tomorrow.
  * Existing generic consumer applications use the US EPA formula, which does not match the official Indian CPCB NAQI standard.
* **Our Solution**:
  * A zero-cost, end-to-end predictive intelligence system designed for municipal administrators and citizens.

---

### Slide 3: Decoupled Architecture
* **Frontend**: React 18, TailwindCSS, Vite. High-performance, lightweight, and responsive.
* **Backend**: FastAPI (Python), asynchronous routers, low-latency consolidation endpoints.
* **Integrations (Zero-Cost & Scale)**:
  * **Open-Meteo**: Captures atmospheric forecasts and wind vectors without API keys.
  * **OpenAQ**: Connects to real physical ground-truth sensors near target cities.
  * **Groq API (Llama 3.3)**: Generates localized, context-aware health advisories.

---

### Slide 4: CPCB NAQI Calculation Engine
* **Algorithm**:
  * Applies the official CPCB linear interpolation formula:
    $$I_p = \frac{I_{high} - I_{low}}{BP_{high} - BP_{low}} \times (C_p - BP_{low}) + I_{low}$$
  * Dynamically computes sub-indexes for $PM_{2.5}$, $PM_{10}$, $NO_2$, $SO_2$, $CO$, and $O_3$.
  * Identifies the **Dominant Pollutant** based on the highest sub-index.
  * Correctly categorizes the overall air index into the official CPCB bands (Good, Satisfactory, Moderate, Poor, Very Poor, Severe).

---

### Slide 5: Explainable Source Attribution
* **Why heuristics?**: Machine learning models can be black boxes. Administrators need traceable reasons before making policy decisions.
* **Attribution Matrix**:
  * **Vehicular**: High $NO_2/PM_{10}$ ratios during weekday morning/evening commutes.
  * **Industrial**: High $SO_2$ concentration combined with steady nighttime particulate accumulation.
  * **Construction Dust**: High ratio of coarse particulates ($PM_{10} / PM_{2.5} > 2.5$) during dry daytime working hours.
  * **Crop Burning**: Seasonal spikes in fine particulates ($PM_{2.5}$) during harvesting windows with northwesterly winds.
  * **Meteorological Trapping**: Boundary layer height compression ($<300\,\text{m}$) and wind stagnation.

---

### Slide 6: 72-Hour Forecasting & Alerts
* **Predictive Timeline**:
  * Computes the hourly AQI trajectory for the next 3 days.
  * Visualizes the trend line overlaid on CPCB color bands using custom SVG charting.
* **Threshold Crossing Warnings**:
  * Detects upcoming transition points where the air quality category degrades.
  * Flags warning times (e.g., "AQI > 200 expected tomorrow morning at 08:00 AM due to worsening inversion conditions").

---

### Slide 7: LLM-Driven Multilingual Advisories
* **Dynamic Content**:
  * Generates population-specific safety recommendations tailored to the active AQI category and dominant pollutant.
* **Multilingual Options**:
  * Supports English, Hindi, Bengali, Tamil, Telugu, and Kannada.
* **System Reliability**:
  * Includes deterministic fallbacks in the backend to ensure continuity if external LLM APIs are unavailable.

---

### Slide 8: Smart City Interventions & Impact
* **Preemptive Dust Control**: Dispense water-sprinkling tankers along construction corridors during dry periods.
* **Traffic Control Vectors**: Implement odd-even schemes or heavy commercial vehicle diversions before forecasted severe AQI events.
* **Industrial Adjustments**: Dampen production loads at power plants during forecasted thermal inversions.
* **Future Work**:
  * Integrate city traffic camera feeds for real-time vehicular density tracking.
  * Expand boundary layer sensors to refine localized microclimate predictions.
