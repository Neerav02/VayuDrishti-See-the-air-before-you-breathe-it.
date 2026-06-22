import pytest
from app.engines.aqi_engine import compute_sub_index, compute_aqi

def test_compute_sub_index():
    # Test linear interpolation (Satisfactory range for PM2.5: 31-60 maps to 51-100)
    # Formula: ((I_HI - I_LO) / (BP_HI - BP_LO)) * (Cp - BP_LO) + I_LO
    # ((100 - 51) / (60 - 31)) * (45 - 31) + 51 = (49 / 29) * 14 + 51 = 23.655 + 51 = 74.655 -> rounds to 75
    assert compute_sub_index("pm2_5", 45.0) == 75
    assert compute_sub_index("pm2_5", 31.0) == 51
    assert compute_sub_index("pm2_5", 60.0) == 100

def test_compute_aqi_good():
    # All concentrations low (Good category)
    concentrations = {
        "pm2_5": 15.0,  # Good breakpoint 0-30 -> Sub-index 0-50
        "pm10": 25.0,   # Good breakpoint 0-50 -> Sub-index 0-50
        "no2": 20.0,    # Good breakpoint 0-40 -> Sub-index 0-50
        "so2": 10.0,    # Good breakpoint 0-40 -> Sub-index 0-50
        "co": 0.5,      # Good breakpoint 0-1 -> Sub-index 0-50
        "o3": 25.0      # Good breakpoint 0-50 -> Sub-index 0-50
    }
    result = compute_aqi(concentrations)
    assert result["aqi"] <= 50
    assert result["category"] == "Good"

def test_compute_aqi_severe():
    # PM10 extremely high (Severe category)
    concentrations = {
        "pm2_5": 20.0,
        "pm10": 550.0,  # Severe breakpoint 400+ -> Sub-index 500
        "no2": 10.0,
        "so2": 5.0,
        "co": 0.2,
        "o3": 15.0
    }
    result = compute_aqi(concentrations)
    assert result["aqi"] == 500
    assert result["category"] == "Severe"
    assert result["dominant_pollutant"] == "pm10"

def test_compute_aqi_missing_pollutants():
    # If no valid concentrations, returns category "Unknown"
    concentrations = {
        "pm2_5": None,
        "pm10": None,
        "no2": None,
        "so2": None,
        "co": None,
        "o3": None
    }
    result = compute_aqi(concentrations)
    assert result["aqi"] == 0
    assert result["category"] == "Unknown"
