/**
 * VayuDrishti API client.
 * Handles all communication with the FastAPI backend.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Search for locations by name.
 */
export async function resolveLocation(query) {
  const { data } = await api.get('/api/resolve-location', {
    params: { q: query },
  });
  return data;
}

/**
 * Get current CPCB AQI for a location.
 */
export async function getCurrentAQI(lat, lon, name = 'Unknown') {
  const { data } = await api.get('/api/current-aqi', {
    params: { lat, lon, name },
  });
  return data;
}

/**
 * Get 72-hour AQI forecast.
 */
export async function getForecast(lat, lon, name = 'Unknown') {
  const { data } = await api.get('/api/forecast', {
    params: { lat, lon, name },
  });
  return data;
}

/**
 * Get source attribution breakdown.
 */
export async function getAttribution(lat, lon, name = 'Unknown') {
  const { data } = await api.get('/api/source-attribution', {
    params: { lat, lon, name },
  });
  return data;
}

/**
 * Get health advisory.
 */
export async function getAdvisory(aqi, category, pollutant, city, lang = 'English') {
  const { data } = await api.get('/api/advisory', {
    params: { aqi, category, pollutant, city, lang },
  });
  return data;
}

/**
 * Get full dashboard data in one request.
 */
export async function getDashboard(lat, lon, name = 'Unknown', lang = 'English') {
  const { data } = await api.get('/api/dashboard', {
    params: { lat, lon, name, lang },
  });
  return data;
}

/**
 * Get map data for a city.
 */
export async function getCityMapData(lat, lon, name = 'Unknown') {
  const { data } = await api.get('/api/city-map-data', {
    params: { lat, lon, name },
  });
  return data;
}

/**
 * Health check.
 */
export async function healthCheck() {
  const { data } = await api.get('/api/health');
  return data;
}
