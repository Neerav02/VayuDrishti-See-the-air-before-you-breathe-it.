"""
Application configuration — loaded from environment variables.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    """Central configuration. All values come from env vars with sensible defaults."""

    # --- API Keys ---
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAQ_API_KEY: str = os.getenv("OPENAQ_API_KEY", "")

    # --- Open-Meteo (no key required) ---
    OPENMETEO_AQ_BASE: str = "https://air-quality-api.open-meteo.com/v1/air-quality"
    OPENMETEO_FORECAST_BASE: str = "https://api.open-meteo.com/v1/forecast"
    OPENMETEO_GEOCODING_BASE: str = "https://geocoding-api.open-meteo.com/v1/search"

    # --- OpenAQ ---
    OPENAQ_BASE: str = "https://api.openaq.org/v3"

    # --- Groq ---
    GROQ_BASE: str = "https://api.groq.com/openai/v1"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # --- App ---
    APP_NAME: str = "VayuDrishti"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://localhost:4174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4173",
        "http://127.0.0.1:4174",
    ]

    # --- Database ---
    DB_PATH: str = str(Path(__file__).resolve().parent.parent / "data" / "vayudrishti.db")


settings = Settings()
