"""
CPCB National AQI Calculation Engine.

Implements the official Indian CPCB sub-index interpolation formula:
  Ip = ((I_HI - I_LO) / (BP_HI - BP_LO)) * (Cp - BP_LO) + I_LO

The overall AQI is the MAXIMUM of all individual sub-indices
(worst pollutant determines the index).
"""

from app.data.cpcb_breakpoints import CPCB_BREAKPOINTS, CPCB_CATEGORIES


def compute_sub_index(pollutant: str, concentration: float) -> int | None:
    """
    Compute the CPCB sub-index for a single pollutant at a given concentration.

    Args:
        pollutant: Key matching CPCB_BREAKPOINTS (e.g. "pm2_5", "pm10", "no2")
        concentration: Raw concentration value (µg/m³, or mg/m³ for CO)

    Returns:
        Integer sub-index value, or None if pollutant is unknown or
        concentration is out of range.
    """
    if pollutant not in CPCB_BREAKPOINTS:
        return None

    if concentration < 0:
        return None

    breakpoints = CPCB_BREAKPOINTS[pollutant]

    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= concentration <= c_high:
            # Linear interpolation
            if c_high == c_low:
                return i_low
            sub_index = ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
            return round(sub_index)

    # Concentration exceeds the highest breakpoint — cap at 500
    last_row = breakpoints[-1]
    if concentration > last_row[1]:
        return 500

    return None


def compute_aqi(pollutant_concentrations: dict[str, float | None]) -> dict:
    """
    Compute the overall CPCB AQI from a dictionary of pollutant concentrations.

    Args:
        pollutant_concentrations: Dict mapping pollutant key to concentration.
            Keys should match CPCB_BREAKPOINTS: "pm2_5", "pm10", "no2",
            "so2", "co", "o3", "nh3".
            Values can be None (sensor missing / data unavailable).

    Returns:
        Dict with:
          - "aqi": int — overall AQI value
          - "category": str — CPCB category label
          - "color": str — hex color for the category
          - "health_impact": str — health implication text
          - "dominant_pollutant": str — key of the pollutant with highest sub-index
          - "sub_indices": dict — individual sub-index for each available pollutant
    """
    sub_indices: dict[str, int] = {}

    for pollutant, concentration in pollutant_concentrations.items():
        if concentration is None or pollutant not in CPCB_BREAKPOINTS:
            continue
        si = compute_sub_index(pollutant, concentration)
        if si is not None:
            sub_indices[pollutant] = si

    if not sub_indices:
        return {
            "aqi": 0,
            "category": "Unknown",
            "color": "#999999",
            "color_bg": "#f5f5f5",
            "health_impact": "Insufficient data to compute AQI.",
            "dominant_pollutant": None,
            "sub_indices": {},
        }

    # Overall AQI = maximum sub-index
    dominant_pollutant = max(sub_indices, key=sub_indices.get)
    overall_aqi = sub_indices[dominant_pollutant]

    # Map to CPCB category
    category_info = get_category(overall_aqi)

    return {
        "aqi": overall_aqi,
        "category": category_info["label"],
        "color": category_info["color"],
        "color_bg": category_info["hex_bg"],
        "health_impact": category_info["health_impact"],
        "dominant_pollutant": dominant_pollutant,
        "sub_indices": sub_indices,
    }


def get_category(aqi_value: int) -> dict:
    """Return the CPCB category dict for a given AQI value."""
    for cat in CPCB_CATEGORIES:
        low, high = cat["range"]
        if low <= aqi_value <= high:
            return cat

    # Above 500 — treat as Severe
    if aqi_value > 500:
        return CPCB_CATEGORIES[-1]

    return {
        "range": (0, 0),
        "label": "Unknown",
        "color": "#999999",
        "hex_bg": "#f5f5f5",
        "health_impact": "Unable to determine air quality category.",
    }


# Human-readable pollutant names for display
POLLUTANT_DISPLAY_NAMES: dict[str, str] = {
    "pm2_5": "PM2.5",
    "pm10": "PM10",
    "no2": "NO₂",
    "so2": "SO₂",
    "co": "CO",
    "o3": "O₃",
    "nh3": "NH₃",
}
