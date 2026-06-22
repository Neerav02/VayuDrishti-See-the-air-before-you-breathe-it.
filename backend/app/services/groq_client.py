"""
Groq API client for LLM-powered advisory generation and translation.
Uses the free Groq API with Llama models.
"""

import httpx
import json
from app.core.config import settings


async def generate_advisory(
    aqi: int,
    category: str,
    dominant_pollutant: str,
    attribution: dict,
    weather: dict,
    city_name: str,
    language: str = "English",
) -> dict:
    """
    Generate a contextual, actionable health advisory using Groq LLM.

    Args:
        aqi: Current AQI value
        category: CPCB category (Good, Satisfactory, Moderate, Poor, Very Poor, Severe)
        dominant_pollutant: Key of dominant pollutant
        attribution: Source attribution dict with percentages
        weather: Current weather conditions
        city_name: Name of the city/locality
        language: Target language for the advisory

    Returns:
        Dict with advisory text for different population segments.
    """
    if not settings.GROQ_API_KEY:
        return _fallback_advisory(aqi, category, dominant_pollutant, language)

    pollutant_names = {
        "pm2_5": "PM2.5 (fine particulate matter)",
        "pm10": "PM10 (coarse particulate matter)",
        "no2": "Nitrogen Dioxide (NO₂)",
        "so2": "Sulfur Dioxide (SO₂)",
        "co": "Carbon Monoxide (CO)",
        "o3": "Ground-level Ozone (O₃)",
        "nh3": "Ammonia (NH₃)",
    }

    # Build source attribution summary
    attr_text = ", ".join(
        [f"{k}: {v}%" for k, v in attribution.items() if isinstance(v, (int, float))]
    ) if attribution else "Not available"

    prompt = f"""You are VayuDrishti, an AI air quality health advisory system for Indian cities.

Current conditions for {city_name}:
- AQI: {aqi} ({category})
- Dominant pollutant: {pollutant_names.get(dominant_pollutant, dominant_pollutant)}
- Likely sources: {attr_text}
- Temperature: {weather.get('temperature', 'N/A')}°C
- Humidity: {weather.get('humidity', 'N/A')}%
- Wind speed: {weather.get('wind_speed', 'N/A')} km/h

Generate a health advisory in {language} language. Return a JSON object with these exact keys:
{{
  "general": "Advisory for the general public (2-3 sentences)",
  "children": "Specific guidance for children and schools (1-2 sentences)",
  "elderly": "Specific guidance for elderly people (1-2 sentences)",
  "outdoor_workers": "Specific guidance for outdoor workers (1-2 sentences)",
  "respiratory_patients": "Specific guidance for people with asthma/respiratory/cardiac conditions (1-2 sentences)",
  "summary": "One-line summary of the air quality situation"
}}

Rules:
- Be specific and actionable, not vague
- Reference the actual AQI number and dominant pollutant
- If AQI is Good/Satisfactory, be reassuring but still mention precautions
- If AQI is Poor/Very Poor/Severe, be urgent and direct
- Use simple, clear language that a non-expert can understand
- Output ONLY the JSON object, no markdown formatting, no code blocks"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{settings.GROQ_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are VayuDrishti, an expert air quality health advisory system. Always respond with valid JSON only."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 800,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]
        advisory = json.loads(content)
        advisory["language"] = language
        advisory["generated_by"] = "groq-llm"
        return advisory

    except Exception as e:
        print(f"Groq API error: {e}")
        return _fallback_advisory(aqi, category, dominant_pollutant, language)


def _fallback_advisory(aqi: int, category: str, dominant_pollutant: str, language: str) -> dict:
    """Rule-based fallback if Groq API is unavailable."""
    pollutant_names = {
        "pm2_5": "PM2.5", "pm10": "PM10", "no2": "NO₂",
        "so2": "SO₂", "co": "CO", "o3": "O₃", "nh3": "NH₃",
    }
    dp = pollutant_names.get(dominant_pollutant, "particulate matter")

    templates = {
        "Good": {
            "general": f"Air quality is Good (AQI {aqi}). Enjoy outdoor activities freely.",
            "children": "Safe for outdoor play and school sports activities.",
            "elderly": "No restrictions. Enjoy fresh air and outdoor walks.",
            "outdoor_workers": "No precautions needed. Normal working conditions.",
            "respiratory_patients": "Air quality is within safe limits. Continue normal activities.",
            "summary": f"Air quality is Good in your area. AQI: {aqi}.",
        },
        "Satisfactory": {
            "general": f"Air quality is Satisfactory (AQI {aqi}). Minor breathing discomfort possible for very sensitive individuals.",
            "children": "Outdoor activities are generally safe. Monitor children with asthma.",
            "elderly": "Generally safe. Take short breaks during extended outdoor activity.",
            "outdoor_workers": "Normal working conditions. Stay hydrated.",
            "respiratory_patients": f"Minor discomfort possible due to {dp}. Keep rescue inhaler accessible.",
            "summary": f"Air quality is Satisfactory. AQI: {aqi}. Dominant pollutant: {dp}.",
        },
        "Moderate": {
            "general": f"Air quality is Moderate (AQI {aqi}). People with breathing problems should reduce prolonged outdoor exertion. Dominant pollutant: {dp}.",
            "children": "Limit prolonged outdoor sports. Indoor activities preferred for sensitive children.",
            "elderly": "Reduce outdoor time during peak pollution hours (morning/evening). Keep windows closed.",
            "outdoor_workers": f"Wear N95 masks if available. Take breaks in sheltered areas. {dp} levels are elevated.",
            "respiratory_patients": f"Reduce outdoor exposure. {dp} is elevated. Use prescribed medications proactively.",
            "summary": f"Moderate air quality. AQI: {aqi}. {dp} is the dominant pollutant.",
        },
        "Poor": {
            "general": f"Air quality is Poor (AQI {aqi}). Avoid prolonged outdoor exposure. Dominant pollutant: {dp}.",
            "children": "Keep children indoors. Cancel outdoor sports and activities.",
            "elderly": "Stay indoors. Use air purifiers if available. Avoid morning walks.",
            "outdoor_workers": f"Mandatory N95 masks. Reduce shift duration. {dp} at dangerous levels.",
            "respiratory_patients": f"URGENT: Stay indoors with windows closed. {dp} at harmful levels. Consult doctor if symptoms worsen.",
            "summary": f"Poor air quality alert! AQI: {aqi}. {dp} is dangerously elevated.",
        },
        "Very Poor": {
            "general": f"HEALTH ALERT: Air quality is Very Poor (AQI {aqi}). Avoid ALL unnecessary outdoor exposure. {dp} at hazardous levels.",
            "children": "KEEP ALL CHILDREN INDOORS. Schools should cancel outdoor activities entirely.",
            "elderly": "STAY INDOORS. Seek medical attention if experiencing breathlessness or chest tightness.",
            "outdoor_workers": f"HEALTH HAZARD: All outdoor work should be minimised. {dp} at dangerous levels. Mandatory respiratory protection.",
            "respiratory_patients": f"EMERGENCY PRECAUTION: Do not go outdoors. {dp} at very harmful levels. Keep emergency medications ready. Seek medical help if symptoms appear.",
            "summary": f"HEALTH ALERT: Very Poor air quality. AQI: {aqi}. Avoid outdoor exposure.",
        },
        "Severe": {
            "general": f"EMERGENCY: Air quality is Severe (AQI {aqi}). Affects even healthy people. AVOID ALL outdoor activity. {dp} at emergency levels.",
            "children": "EMERGENCY: All children must stay indoors. Close all windows and doors. Schools should consider closure.",
            "elderly": "MEDICAL EMERGENCY RISK: Stay indoors with air purification. Contact doctor immediately if feeling unwell.",
            "outdoor_workers": f"STOP ALL OUTDOOR WORK. {dp} at emergency levels. This is a health emergency.",
            "respiratory_patients": f"MEDICAL EMERGENCY: Do NOT go outdoors under any circumstances. {dp} at extreme levels. Have emergency contacts ready. Go to hospital if symptoms worsen.",
            "summary": f"EMERGENCY: Severe air quality crisis. AQI: {aqi}. Stay indoors.",
        },
    }

    advisory = templates.get(category, templates["Moderate"])
    advisory["language"] = language
    advisory["generated_by"] = "fallback-template"
    return advisory
