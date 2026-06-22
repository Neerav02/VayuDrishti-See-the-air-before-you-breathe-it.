"""
Official CPCB National Air Quality Index breakpoint tables.

Source: Central Pollution Control Board, India — "National Air Quality Index"
document (revised methodology).

Each pollutant maps to a list of (C_low, C_high, I_low, I_high) tuples where:
  - C_low, C_high = concentration breakpoints (µg/m³, except CO in mg/m³)
  - I_low, I_high = AQI sub-index breakpoints

Averaging periods:
  - PM2.5:  24-hour average
  - PM10:   24-hour average
  - NO2:    24-hour average
  - SO2:    24-hour average
  - CO:     8-hour average  (mg/m³, NOT µg/m³)
  - O3:     8-hour average
  - NH3:    24-hour average
"""

# fmt: off
CPCB_BREAKPOINTS: dict[str, list[tuple[float, float, int, int]]] = {
    # PM2.5 (µg/m³, 24-hr avg)
    "pm2_5": [
        (0,    30,    0,   50),   # Good
        (31,   60,    51,  100),  # Satisfactory
        (61,   90,    101, 200),  # Moderate
        (91,   120,   201, 300),  # Poor
        (121,  250,   301, 400),  # Very Poor
        (250,  380,   401, 500),  # Severe
    ],
    # PM10 (µg/m³, 24-hr avg)
    "pm10": [
        (0,    50,    0,   50),
        (51,   100,   51,  100),
        (101,  250,   101, 200),
        (251,  350,   201, 300),
        (351,  430,   301, 400),
        (430,  510,   401, 500),
    ],
    # NO2 (µg/m³, 24-hr avg)
    "no2": [
        (0,    40,    0,   50),
        (41,   80,    51,  100),
        (81,   180,   101, 200),
        (181,  280,   201, 300),
        (281,  400,   301, 400),
        (400,  520,   401, 500),
    ],
    # SO2 (µg/m³, 24-hr avg)
    "so2": [
        (0,    40,    0,   50),
        (41,   80,    51,  100),
        (81,   380,   101, 200),
        (381,  800,   201, 300),
        (801,  1600,  301, 400),
        (1600, 2100,  401, 500),
    ],
    # CO (mg/m³, 8-hr avg) — note: milligrams, not micrograms
    "co": [
        (0,    1.0,   0,   50),
        (1.1,  2.0,   51,  100),
        (2.1,  10.0,  101, 200),
        (10.1, 17.0,  201, 300),
        (17.1, 34.0,  301, 400),
        (34.0, 46.0,  401, 500),
    ],
    # O3 (µg/m³, 8-hr avg)
    "o3": [
        (0,    50,    0,   50),
        (51,   100,   51,  100),
        (101,  168,   101, 200),
        (169,  208,   201, 300),
        (209,  748,   301, 400),
        (748,  960,   401, 500),
    ],
    # NH3 (µg/m³, 24-hr avg)
    "nh3": [
        (0,    200,   0,   50),
        (201,  400,   51,  100),
        (401,  800,   101, 200),
        (801,  1200,  201, 300),
        (1201, 1800,  301, 400),
        (1800, 2400,  401, 500),
    ],
}
# fmt: on


# CPCB AQI categories with colors and health implications
CPCB_CATEGORIES: list[dict] = [
    {
        "range": (0, 50),
        "label": "Good",
        "color": "#009966",
        "hex_bg": "#e6f5ee",
        "health_impact": "Minimal impact on health.",
    },
    {
        "range": (51, 100),
        "label": "Satisfactory",
        "color": "#58b453",
        "hex_bg": "#eef7ed",
        "health_impact": "Minor breathing discomfort to sensitive people.",
    },
    {
        "range": (101, 200),
        "label": "Moderate",
        "color": "#FFDD44",
        "hex_bg": "#fffbe6",
        "health_impact": "Breathing discomfort to people with lung disease, asthma, and heart disease.",
    },
    {
        "range": (201, 300),
        "label": "Poor",
        "color": "#FF8800",
        "hex_bg": "#fff3e0",
        "health_impact": "Breathing discomfort on prolonged exposure. Avoid outdoor activities for sensitive groups.",
    },
    {
        "range": (301, 400),
        "label": "Very Poor",
        "color": "#CC0033",
        "hex_bg": "#fce4ec",
        "health_impact": "Respiratory illness on prolonged exposure. Limit outdoor exertion.",
    },
    {
        "range": (401, 500),
        "label": "Severe",
        "color": "#990000",
        "hex_bg": "#f3e0e0",
        "health_impact": "Affects healthy people and seriously impacts those with existing diseases. Avoid all outdoor activity.",
    },
]
