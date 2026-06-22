/**
 * CPCB AQI color scale and formatting utilities.
 */

export const CPCB_COLORS = {
  Good: { color: '#009966', bg: '#e6f5ee', text: '#006644' },
  Satisfactory: { color: '#58b453', bg: '#eef7ed', text: '#3a7a37' },
  Moderate: { color: '#FFDD44', bg: '#fffbe6', text: '#9a8500' },
  Poor: { color: '#FF8800', bg: '#fff3e0', text: '#cc6d00' },
  'Very Poor': { color: '#CC0033', bg: '#fce4ec', text: '#990026' },
  Severe: { color: '#990000', bg: '#f3e0e0', text: '#660000' },
  Unknown: { color: '#999999', bg: '#f5f5f5', text: '#666666' },
};

export const POLLUTANT_NAMES = {
  pm2_5: 'PM2.5',
  pm10: 'PM10',
  no2: 'NO₂',
  so2: 'SO₂',
  co: 'CO',
  o3: 'O₃',
  nh3: 'NH₃',
};

export const POLLUTANT_UNITS = {
  pm2_5: 'µg/m³',
  pm10: 'µg/m³',
  no2: 'µg/m³',
  so2: 'µg/m³',
  co: 'mg/m³',
  o3: 'µg/m³',
  nh3: 'µg/m³',
};

export const SOURCE_NAMES = {
  vehicular: 'Vehicular Emissions',
  industrial: 'Industrial / Power Plants',
  construction_dust: 'Construction & Road Dust',
  crop_burning: 'Crop Residue Burning',
  meteorological_trapping: 'Meteorological Trapping',
};

export const SOURCE_ICONS = {
  vehicular: '🚗',
  industrial: '🏭',
  construction_dust: '🏗️',
  crop_burning: '🔥',
  meteorological_trapping: '🌫️',
};

export const SOURCE_COLORS = {
  vehicular: '#6366f1',
  industrial: '#f59e0b',
  construction_dust: '#d97706',
  crop_burning: '#ef4444',
  meteorological_trapping: '#8b5cf6',
};

export function getCategoryColors(category) {
  return CPCB_COLORS[category] || CPCB_COLORS.Unknown;
}

export function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिन्दी' },
  { code: 'Kannada', label: 'ಕನ್ನಡ' },
  { code: 'Tamil', label: 'தமிழ்' },
  { code: 'Telugu', label: 'తెలుగు' },
  { code: 'Marathi', label: 'मराठी' },
  { code: 'Bengali', label: 'বাংলা' },
];
