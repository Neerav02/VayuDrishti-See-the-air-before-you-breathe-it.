"""
Explainable Source Attribution Engine.

Uses transparent, rule-weighted heuristics to estimate likely pollution
sources based on:
  - Pollutant ratios (NO2/PM10, PM10/PM2.5)
  - Time of day (rush hour patterns)
  - Day of week (weekday vs weekend)
  - Wind speed (stagnation detection)
  - Boundary layer height (inversion detection)
  - Season/calendar (crop burning windows)
  - Wind direction

Every score is accompanied by the specific inputs that drove it —
making this "explainable heuristic attribution," not a black box.
"""

from datetime import datetime
import math


def compute_attribution(
    pollutant_concentrations: dict,
    weather: dict,
    timestamp: str | None = None,
) -> dict:
    """
    Compute source attribution for the current pollution reading.

    Args:
        pollutant_concentrations: Dict with keys like "pm2_5", "pm10", "no2", etc.
        weather: Dict with "wind_speed", "wind_direction", "temperature",
                 "humidity", "boundary_layer_height"
        timestamp: ISO timestamp string of the reading (uses current time if None)

    Returns:
        Dict with:
          - "sources": dict of {source_name: percentage}
          - "explanations": list of human-readable reasoning strings
          - "confidence": overall confidence level
          - "inputs_used": dict of the key inputs that drove the scoring
    """
    # Parse timestamp
    if timestamp:
        try:
            dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            dt = datetime.now()
    else:
        dt = datetime.now()

    hour = dt.hour
    weekday = dt.weekday()  # 0=Monday, 6=Sunday
    month = dt.month

    # Extract values
    pm25 = pollutant_concentrations.get("pm2_5") or 0
    pm10 = pollutant_concentrations.get("pm10") or 0
    no2 = pollutant_concentrations.get("no2") or 0
    so2 = pollutant_concentrations.get("so2") or 0
    co = pollutant_concentrations.get("co") or 0
    o3 = pollutant_concentrations.get("o3") or 0

    wind_speed = weather.get("wind_speed") or 0
    wind_direction = weather.get("wind_direction") or 0
    blh = weather.get("boundary_layer_height") or 500
    temperature = weather.get("temperature") or 25

    # ------- Score each source category -------
    scores = {
        "vehicular": 0.0,
        "industrial": 0.0,
        "construction_dust": 0.0,
        "crop_burning": 0.0,
        "meteorological_trapping": 0.0,
    }
    explanations = []

    # --- 1. VEHICULAR ---
    # High NO2 relative to PM suggests vehicular combustion
    if pm10 > 0:
        no2_pm_ratio = no2 / pm10
        if no2_pm_ratio > 0.3:
            scores["vehicular"] += 25
            explanations.append(
                f"NO₂/PM10 ratio is {no2_pm_ratio:.2f} (>0.30) → consistent with vehicular emissions"
            )
        elif no2_pm_ratio > 0.15:
            scores["vehicular"] += 12
            explanations.append(
                f"NO₂/PM10 ratio is {no2_pm_ratio:.2f} (moderate) → partial vehicular signal"
            )

    # CO elevated suggests combustion (vehicles)
    if co > 1.5:  # mg/m³
        scores["vehicular"] += 15
        explanations.append(f"CO is {co:.1f} mg/m³ (elevated) → combustion source likely")

    # Rush hour pattern: 7-10 AM or 5-9 PM on weekdays
    is_rush = (7 <= hour <= 10 or 17 <= hour <= 21) and weekday < 5
    if is_rush:
        scores["vehicular"] += 20
        explanations.append(
            f"Time is {hour}:00 on a weekday → rush hour traffic pattern"
        )
    elif 7 <= hour <= 10 or 17 <= hour <= 21:
        scores["vehicular"] += 10
        explanations.append(f"Time is {hour}:00 → partial rush hour pattern (weekend)")

    # --- 2. INDUSTRIAL ---
    # High SO2 is a strong industrial marker
    if so2 > 40:
        scores["industrial"] += 30
        explanations.append(f"SO₂ is {so2:.0f} µg/m³ (high) → industrial/power plant emission likely")
    elif so2 > 20:
        scores["industrial"] += 15
        explanations.append(f"SO₂ is {so2:.0f} µg/m³ (moderate) → possible industrial contribution")

    # Nighttime elevated pollution (industrial runs 24/7 unlike traffic)
    if hour >= 23 or hour <= 4:
        if pm25 > 60:
            scores["industrial"] += 10
            explanations.append(
                f"Elevated PM2.5 ({pm25:.0f}) during nighttime hours → possible continuous industrial source"
            )

    # --- 3. CONSTRUCTION DUST ---
    # High PM10:PM2.5 ratio suggests coarse particles (dust, construction)
    if pm25 > 0:
        coarse_ratio = pm10 / pm25
        if coarse_ratio > 2.5:
            scores["construction_dust"] += 25
            explanations.append(
                f"PM10/PM2.5 ratio is {coarse_ratio:.1f} (>2.5) → coarse dust dominant (construction/road dust)"
            )
        elif coarse_ratio > 1.8:
            scores["construction_dust"] += 12
            explanations.append(
                f"PM10/PM2.5 ratio is {coarse_ratio:.1f} → moderate coarse particle contribution"
            )

    # Construction happens during daytime working hours
    if 8 <= hour <= 18 and weekday < 6:
        if pm10 > 100:
            scores["construction_dust"] += 15
            explanations.append(
                f"High PM10 ({pm10:.0f}) during working hours → consistent with construction activity"
            )

    # Low wind helps dust accumulate
    if wind_speed < 8:
        scores["construction_dust"] += 5
        explanations.append(f"Low wind speed ({wind_speed:.0f} km/h) → dust accumulation conditions")

    # --- 4. CROP BURNING (Seasonal) ---
    # Major crop burning windows in India:
    #   October-November (Kharif post-harvest, primarily Punjab/Haryana)
    #   April-May (wheat residue burning)
    is_burning_season = month in [10, 11, 4, 5]
    if is_burning_season:
        scores["crop_burning"] += 15
        explanations.append(
            f"Month {month} is within the crop residue burning season"
        )

        # Sharp PM2.5 spike during burning season is highly indicative
        if pm25 > 100:
            scores["crop_burning"] += 20
            explanations.append(
                f"Very high PM2.5 ({pm25:.0f}) during burning season → likely crop burning influence"
            )
        elif pm25 > 60:
            scores["crop_burning"] += 10
            explanations.append(
                f"Elevated PM2.5 ({pm25:.0f}) during burning season → possible crop burning"
            )

        # NW wind direction (Punjab/Haryana direction for Delhi/NCR)
        if 270 <= wind_direction <= 360 or 0 <= wind_direction <= 45:
            scores["crop_burning"] += 10
            explanations.append(
                f"Wind from NW direction ({wind_direction}°) → consistent with smoke transport from agricultural regions"
            )

    # --- 5. METEOROLOGICAL TRAPPING ---
    # Low boundary layer height traps pollutants near surface
    if blh < 300:
        scores["meteorological_trapping"] += 25
        explanations.append(
            f"Boundary layer height is {blh:.0f}m (<300m) → strong atmospheric trapping (temperature inversion likely)"
        )
    elif blh < 600:
        scores["meteorological_trapping"] += 12
        explanations.append(
            f"Boundary layer height is {blh:.0f}m (<600m) → moderate trapping conditions"
        )

    # Very low wind = stagnation
    if wind_speed < 5:
        scores["meteorological_trapping"] += 15
        explanations.append(
            f"Wind speed is {wind_speed:.0f} km/h (<5) → atmospheric stagnation conditions"
        )

    # Early morning + high pollution = inversion effect
    if (5 <= hour <= 8) and pm25 > 60:
        scores["meteorological_trapping"] += 10
        explanations.append(
            f"Early morning ({hour}:00) with elevated PM2.5 ({pm25:.0f}) → temperature inversion pattern"
        )

    # High humidity reduces dispersion
    humidity = weather.get("humidity") or 50
    if humidity > 80:
        scores["meteorological_trapping"] += 5
        explanations.append(
            f"High humidity ({humidity}%) → reduced pollutant dispersion"
        )

    # ------- Normalize to percentages -------
    total = sum(scores.values())
    if total == 0:
        # No strong signals — equal attribution
        percentages = {k: 20 for k in scores}
        explanations.append("No strong source signals detected — showing equal distribution")
    else:
        percentages = {k: round((v / total) * 100) for k, v in scores.items()}
        # Ensure they sum to 100
        diff = 100 - sum(percentages.values())
        if diff != 0:
            max_key = max(percentages, key=percentages.get)
            percentages[max_key] += diff

    # Confidence assessment
    if total > 60:
        confidence = "high"
    elif total > 30:
        confidence = "moderate"
    else:
        confidence = "low"

    # Key inputs for transparency
    inputs_used = {
        "hour": hour,
        "weekday": "weekday" if weekday < 5 else "weekend",
        "month": month,
        "wind_speed_kmh": round(wind_speed, 1),
        "wind_direction_deg": round(wind_direction),
        "boundary_layer_height_m": round(blh),
        "pm25_ugm3": round(pm25, 1) if pm25 else None,
        "pm10_ugm3": round(pm10, 1) if pm10 else None,
        "no2_ugm3": round(no2, 1) if no2 else None,
        "so2_ugm3": round(so2, 1) if so2 else None,
        "co_mgm3": round(co, 2) if co else None,
    }

    return {
        "sources": percentages,
        "explanations": explanations,
        "confidence": confidence,
        "inputs_used": inputs_used,
    }


# Human-readable source names
SOURCE_DISPLAY_NAMES = {
    "vehicular": "Vehicular Emissions",
    "industrial": "Industrial / Power Plants",
    "construction_dust": "Construction & Road Dust",
    "crop_burning": "Crop Residue Burning",
    "meteorological_trapping": "Meteorological Trapping",
}

SOURCE_ICONS = {
    "vehicular": "🚗",
    "industrial": "🏭",
    "construction_dust": "🏗️",
    "crop_burning": "🔥",
    "meteorological_trapping": "🌫️",
}
