"""
Advisory Engine — orchestrates Groq LLM advisory generation.
Wraps the Groq client with caching and fallback logic.
"""

from app.services.groq_client import generate_advisory as groq_generate


async def generate_health_advisory(
    aqi: int,
    category: str,
    dominant_pollutant: str,
    attribution: dict,
    weather: dict,
    city_name: str,
    language: str = "English",
) -> dict:
    """
    Generate a health advisory — delegates to Groq LLM with fallback.

    Returns a dict with advisory text for each population segment,
    plus metadata about how it was generated.
    """
    advisory = await groq_generate(
        aqi=aqi,
        category=category,
        dominant_pollutant=dominant_pollutant,
        attribution=attribution,
        weather=weather,
        city_name=city_name,
        language=language,
    )

    # Enrich with metadata
    advisory["aqi"] = aqi
    advisory["category"] = category
    advisory["city"] = city_name

    return advisory
