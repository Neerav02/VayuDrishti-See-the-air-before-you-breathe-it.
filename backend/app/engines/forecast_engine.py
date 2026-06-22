"""
72-Hour Hyperlocal Forecasting Engine.

Takes Open-Meteo's hourly forecast data (which already runs atmospheric
dispersion models) and converts each hour's pollutant concentrations
through the CPCB AQI engine, producing a CPCB-correct hour-by-hour
AQI forecast curve.

Also detects threshold-crossing events (when AQI is forecast to move
into a worse category) for proactive alerting.
"""

from app.engines.aqi_engine import compute_aqi, get_category
from app.data.cpcb_breakpoints import CPCB_CATEGORIES


def generate_forecast(hourly_aq: dict, hourly_weather: dict) -> dict:
    """
    Generate a 72-hour AQI forecast from Open-Meteo hourly data.

    Args:
        hourly_aq: Dict with hourly pollutant arrays from Open-Meteo
            Keys: "time", "pm2_5", "pm10", "no2", "so2", "co", "o3", "nh3"
        hourly_weather: Dict with hourly weather arrays
            Keys: "time", "temperature", "humidity", "wind_speed",
                  "wind_direction", "boundary_layer_height"

    Returns:
        Dict with:
          - "hourly_forecast": list of hourly AQI data points
          - "threshold_crossings": list of upcoming category transitions
          - "summary": text summary of the forecast trend
    """
    times = hourly_aq.get("time", [])
    # Limit to 72 hours
    max_hours = min(len(times), 72)

    hourly_forecast = []
    prev_category = None
    threshold_crossings = []

    for i in range(max_hours):
        # Build pollutant vector for this hour
        concentrations = {}
        for pol in ["pm2_5", "pm10", "no2", "so2", "co", "o3", "nh3"]:
            values = hourly_aq.get(pol, [])
            if i < len(values) and values[i] is not None:
                concentrations[pol] = values[i]

        # Compute AQI for this hour
        aqi_result = compute_aqi(concentrations)

        # Get weather for this hour
        weather_point = {}
        for key in ["temperature", "humidity", "wind_speed", "wind_direction", "boundary_layer_height"]:
            values = hourly_weather.get(key, [])
            if i < len(values):
                weather_point[key] = values[i]

        forecast_point = {
            "time": times[i] if i < len(times) else None,
            "aqi": aqi_result["aqi"],
            "category": aqi_result["category"],
            "color": aqi_result["color"],
            "dominant_pollutant": aqi_result["dominant_pollutant"],
            "pm2_5": concentrations.get("pm2_5"),
            "pm10": concentrations.get("pm10"),
            "wind_speed": weather_point.get("wind_speed"),
            "humidity": weather_point.get("humidity"),
            "temperature": weather_point.get("temperature"),
        }
        hourly_forecast.append(forecast_point)

        # Detect threshold crossings
        current_category = aqi_result["category"]
        if prev_category and current_category != prev_category:
            # Determine if this is a worsening or improvement
            prev_idx = _category_index(prev_category)
            curr_idx = _category_index(current_category)

            threshold_crossings.append({
                "time": times[i] if i < len(times) else None,
                "hour_offset": i,
                "from_category": prev_category,
                "to_category": current_category,
                "direction": "worsening" if curr_idx > prev_idx else "improving",
                "aqi": aqi_result["aqi"],
            })

        prev_category = current_category

    # Generate summary
    summary = _generate_forecast_summary(hourly_forecast, threshold_crossings)

    return {
        "hourly_forecast": hourly_forecast,
        "threshold_crossings": threshold_crossings,
        "summary": summary,
        "total_hours": len(hourly_forecast),
    }


def _category_index(category: str) -> int:
    """Return the severity index (0=Good, 5=Severe) for a CPCB category."""
    labels = [c["label"] for c in CPCB_CATEGORIES]
    try:
        return labels.index(category)
    except ValueError:
        return -1


def _generate_forecast_summary(hourly: list, crossings: list) -> str:
    """Generate a human-readable summary of the forecast trend."""
    if not hourly:
        return "Insufficient data for forecast."

    aqi_values = [h["aqi"] for h in hourly if h["aqi"] > 0]
    if not aqi_values:
        return "No valid AQI data available for forecast."

    avg_aqi = sum(aqi_values) / len(aqi_values)
    max_aqi = max(aqi_values)
    min_aqi = min(aqi_values)

    max_hour = next(h for h in hourly if h["aqi"] == max_aqi)
    min_hour = next(h for h in hourly if h["aqi"] == min_aqi)

    # Trend detection
    first_12 = aqi_values[:12]
    last_12 = aqi_values[-12:]
    avg_first = sum(first_12) / len(first_12) if first_12 else 0
    avg_last = sum(last_12) / len(last_12) if last_12 else 0

    if avg_last > avg_first * 1.15:
        trend = "worsening"
    elif avg_last < avg_first * 0.85:
        trend = "improving"
    else:
        trend = "stable"

    worst_category = get_category(max_aqi)["label"]

    summary_parts = [
        f"72-hour forecast: AQI ranges from {min_aqi} to {max_aqi} (average {round(avg_aqi)}).",
        f"Worst expected: {worst_category} ({max_aqi}) around {max_hour.get('time', 'N/A')}.",
        f"Overall trend: {trend}.",
    ]

    worsenings = [c for c in crossings if c["direction"] == "worsening"]
    if worsenings:
        first_worsening = worsenings[0]
        summary_parts.append(
            f"⚠ AQI expected to worsen from {first_worsening['from_category']} to "
            f"{first_worsening['to_category']} around {first_worsening.get('time', 'N/A')}."
        )

    return " ".join(summary_parts)
