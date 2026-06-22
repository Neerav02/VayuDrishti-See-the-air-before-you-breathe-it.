import { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar from './components/SearchBar';
import AqiBadge from './components/AqiBadge';
import ForecastChart from './components/ForecastChart';
import AttributionPanel from './components/AttributionPanel';
import AdvisoryCard from './components/AdvisoryCard';
import MapView from './components/MapView';
import PollutantGrid from './components/PollutantGrid';
import WeatherBar from './components/WeatherBar';
import { getDashboard } from './services/api';
import './index.css';

const AUTO_REFRESH_MS = 15 * 60 * 1000; // 15 minutes

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिन्दी' },
  { code: 'Bengali', label: 'বাংলা' },
  { code: 'Tamil', label: 'தமிழ்' },
  { code: 'Telugu', label: 'తెలుగు' },
  { code: 'Kannada', label: 'ಕನ್ನಡ' }
];

const QUICK_CITIES = [
  { name: 'Delhi', latitude: 28.6139, longitude: 77.209, state: 'Delhi', country: 'India' },
  { name: 'Mumbai', latitude: 19.076, longitude: 72.8777, state: 'Maharashtra', country: 'India' },
  { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946, state: 'Karnataka', country: 'India' },
  { name: 'Chennai', latitude: 13.0827, longitude: 80.2707, state: 'Tamil Nadu', country: 'India' },
  { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, state: 'West Bengal', country: 'India' },
  { name: 'Hyderabad', latitude: 17.385, longitude: 78.4867, state: 'Telangana', country: 'India' },
];

export default function App() {
  const [location, setLocation] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('English');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('citizen'); // citizen | admin
  const [hasSelectedRole, setHasSelectedRole] = useState(false);
  const [currentTab, setCurrentTab] = useState('platform'); // platform | methodology
  const [langOpen, setLangOpen] = useState(false);
  const refreshRef = useRef(null);

  // Sync mode with HTML class
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (viewMode === 'admin') {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
    }
  }, [viewMode]);

  const fetchDashboard = useCallback(async (loc, lang) => {
    if (!loc) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboard(loc.latitude, loc.longitude, loc.name, lang);
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch dashboard data');
    }
    setLoading(false);
  }, []);

  // Initial fetch when location changes
  useEffect(() => {
    if (location) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboard(location, language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, fetchDashboard]);

  // Auto-refresh
  useEffect(() => {
    if (location) {
      refreshRef.current = setInterval(() => {
        fetchDashboard(location, language);
      }, AUTO_REFRESH_MS);
      return () => clearInterval(refreshRef.current);
    }
  }, [location, language, fetchDashboard]);

  const handleLocationSelect = (loc) => {
    setLocation(loc);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (location) {
      fetchDashboard(location, lang);
    }
  };

  const handleRefresh = () => {
    if (location) {
      fetchDashboard(location, language);
    }
  };

  const d = dashboardData;
  const isDarkMode = viewMode === 'admin';

  // Check if there is an operations warning threshold crossing
  const warningCrossing = d?.forecast?.threshold_crossings?.find(
    c => c.direction === 'worsening' && ['Poor', 'Very Poor', 'Severe'].includes(c.to_category)
  );

  if (currentTab === 'forecasting') {
    const hourlyForecast = d?.forecast?.hourly_forecast || [];
    const points = hourlyForecast.map((h, i) => {
      const x = (i / Math.max(hourlyForecast.length - 1, 1)) * 100;
      const y = 100 - (Math.min(h.aqi, 450) / 450) * 100;
      return { x, y, aqi: h.aqi, category: h.category, time: h.time };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const day1Forecasts = hourlyForecast.slice(24, 48);
    const day2Forecasts = hourlyForecast.slice(48, 72);
    const day3Forecasts = hourlyForecast.slice(72, 96);

    const getDailyStats = (hourlyPoints) => {
      if (!hourlyPoints || hourlyPoints.length === 0) return null;
      const temps = hourlyPoints.map(h => h.temperature).filter(t => t != null);
      const humidities = hourlyPoints.map(h => h.humidity).filter(h => h != null);
      const winds = hourlyPoints.map(h => h.wind_speed).filter(w => w != null);
      
      return {
        tempMin: temps.length ? Math.round(Math.min(...temps)) : 18,
        tempMax: temps.length ? Math.round(Math.max(...temps)) : 28,
        humidity: humidities.length ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length) : 60,
        windSpeed: winds.length ? Math.round(winds.reduce((a, b) => a + b, 0) / winds.length) : 10,
      };
    };

    const day1Stats = getDailyStats(day1Forecasts);
    const day2Stats = getDailyStats(day2Forecasts);
    const day3Stats = getDailyStats(day3Forecasts);

    const getDayName = (hourlyPoints, fallback) => {
      if (!hourlyPoints || hourlyPoints.length === 0 || !hourlyPoints[0].time) return fallback;
      const date = new Date(hourlyPoints[0].time);
      return date.toLocaleDateString(language === 'English' ? 'en-US' : 'en-IN', { weekday: 'long' });
    };

    const day1Name = getDayName(day1Forecasts, 'Tomorrow');
    const day2Name = getDayName(day2Forecasts, 'Wednesday');
    const day3Name = getDayName(day3Forecasts, 'Thursday');

    const worsenings = d?.forecast?.threshold_crossings?.filter(c => c.direction === 'worsening') || [];

    return (
      <div className="bg-[#121212] text-[#eef1f3] min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container">
        {/* TopNavBar */}
        <nav className="bg-[#1A1D1E]/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline/20">
          <div className="flex justify-between items-center px-6 md:px-10 py-4 max-w-[1280px] mx-auto w-full">
            <div 
              onClick={() => {
                setCurrentTab('platform');
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <img 
                alt="VayuDrishti Logo" 
                className="h-8 w-8 object-contain" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLsWkVJHb3kTMKy9LAmPtpvTcdbskFEKaq27mOfpMz0Y6REDtNrvwLhRqSPOdxAI-q0Lim3xbtxUYCdCJGBCdaIvDXj_k5_o4cK_auK8a7Lp4eA-qvL9m2YwBOEvHlseihXnwGh4yqtmL7soKRqCMOAIOrS3jNdaqOcGpysEdzyIo8PX5ptHhZvhHCLlzz-nx0LOC7XHKBzY8cjFcbOgadVTkdKYtjF8f89-cfSCKoIeS7hCxVTfHJz4bp0" 
              />
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary-fixed-dim tracking-tight">VayuDrishti</span>
            </div>
            
            <div className="hidden md:flex space-x-6 items-center font-semibold text-sm">
              <button 
                onClick={() => setCurrentTab('platform')}
                className="text-secondary-fixed-dim hover:text-primary-fixed-dim transition-colors"
              >
                Platform
              </button>
              <button 
                onClick={() => setCurrentTab('methodology')}
                className="text-secondary-fixed-dim hover:text-primary-fixed-dim transition-colors"
              >
                Data Sources
              </button>
              <button 
                className="text-primary-fixed-dim font-bold border-b-2 border-primary-fixed-dim pb-1"
              >
                Forecasting
              </button>
            </div>

            <div className="flex items-center gap-4">
              {d && (
                <div className="w-48 sm:w-64">
                  <SearchBar onLocationSelect={handleLocationSelect} selectedLocation={location} viewMode="admin" />
                </div>
              )}
              <button 
                onClick={() => {
                  setCurrentTab('platform');
                  if (!hasSelectedRole) {
                    setViewMode('citizen');
                    setHasSelectedRole(true);
                  }
                }}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg font-body-sm text-sm hover:opacity-90 transition-opacity font-bold"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {d ? (
          <main className="flex-grow pt-[88px] px-6 md:px-10 max-w-[1280px] mx-auto w-full pb-12 flex flex-col">
            {/* Header Section */}
            <header className="mb-8 mt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="font-display-lg text-4xl md:text-5xl text-white font-black tracking-tight mb-2">72-Hour Forecasting</h1>
                <p className="font-body-lg text-base md:text-lg text-secondary-fixed-dim font-semibold">
                  High-resolution predictive modeling for regional atmospheric quality in <span className="text-[#4ae183]">{d.location?.name}</span>.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 border border-outline/30 bg-[#1E2224] px-4 py-2 rounded-lg hover:bg-surface-variant/20 transition-colors font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Parameters</span>
                </button>
                <button className="flex items-center gap-2 border border-outline/30 bg-[#1E2224] px-4 py-2 rounded-lg hover:bg-surface-variant/20 transition-colors font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Export Data</span>
                </button>
              </div>
            </header>

            {/* Command Center Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Interactive Chart Area (Spans 8 cols) */}
              <section className="lg:col-span-8 bg-[#1E2224] border border-outline/20 rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-lg">
                <div className="flex justify-between items-center mb-6 z-10">
                  <h2 className="font-title-md text-lg text-white font-extrabold">AQI Trajectory (PM2.5 Primary)</h2>
                  <div className="flex gap-1">
                    <span className="px-2 py-1 bg-inverse-surface rounded text-[10px] font-bold border border-outline/30 uppercase tracking-widest text-[#dde2f3]">24H</span>
                    <span className="px-2 py-1 bg-primary/20 text-[#4ae183] rounded text-[10px] font-bold border border-[#4ae183]/30 uppercase tracking-widest">72H</span>
                    <span className="px-2 py-1 bg-inverse-surface rounded text-[10px] font-bold border border-outline/30 uppercase tracking-widest text-[#dde2f3]">7D</span>
                  </div>
                </div>

                {/* Chart Representation */}
                <div className="relative h-64 md:h-80 w-full mt-4 flex-grow">
                  {/* Y-Axis Labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-bold tracking-wider text-secondary-fixed-dim z-10">
                    <span>450 (Severe)</span>
                    <span>300 (V. Poor)</span>
                    <span>200 (Poor)</span>
                    <span>100 (Mod)</span>
                    <span>0 (Good)</span>
                  </div>

                  {/* Severity Bands (Background) */}
                  <div className="absolute left-16 right-0 top-0 h-[33.3%] bg-red-950/20 severity-band border-b border-red-950/10"></div>
                  <div className="absolute left-16 right-0 top-[33.3%] h-[22.2%] bg-purple-950/20 severity-band border-b border-purple-950/10"></div>
                  <div className="absolute left-16 right-0 top-[55.5%] h-[22.2%] bg-orange-950/20 severity-band border-b border-orange-950/10"></div>
                  <div className="absolute left-16 right-0 top-[77.7%] h-[11.1%] bg-yellow-950/20 severity-band border-b border-yellow-950/10"></div>
                  <div className="absolute left-16 right-0 top-[88.8%] h-[11.2%] bg-green-950/20 severity-band"></div>

                  {/* Chart Line */}
                  <div className="absolute left-16 right-0 top-0 bottom-0 z-20">
                    {points.length > 0 && (
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        {/* Grid lines */}
                        <line stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" x1="0" x2="100" y1="33.3" y2="33.3"></line>
                        <line stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" x1="0" x2="100" y1="55.5" y2="55.5"></line>
                        <line stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" x1="0" x2="100" y1="77.7" y2="77.7"></line>
                        <line stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" x1="0" x2="100" y1="88.8" y2="88.8"></line>

                        {/* Predictive Line */}
                        <path 
                          d={pathD} 
                          fill="none" 
                          stroke="#4ae183" 
                          strokeDasharray="2,2" 
                          strokeWidth="2"
                        />

                        {/* Data Points */}
                        {points.filter((_, idx) => idx % 6 === 0).map((p, idx) => (
                          <circle 
                            key={idx}
                            cx={p.x} 
                            cy={p.y} 
                            fill="#4ae183" 
                            r="2"
                            className="hover:r-3 transition-all cursor-pointer"
                          >
                            <title>{`Hour ${idx * 6}: AQI ${p.aqi}`}</title>
                          </circle>
                        ))}
                      </svg>
                    )}
                  </div>

                  {/* X-Axis Labels */}
                  <div className="absolute left-16 right-0 -bottom-6 flex justify-between text-[10px] font-bold tracking-wider text-secondary-fixed-dim z-10">
                    <span>Today</span>
                    <span>Tomorrow</span>
                    <span>Day 3</span>
                  </div>
                </div>
              </section>

              {/* Alerts & Context Pane (Spans 4 cols) */}
              <section className="lg:col-span-4 flex flex-col gap-6">
                {/* Threshold Alerts */}
                <div className="bg-[#1E2224] border border-red-900/50 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <h3 className="font-title-md text-base text-red-400 font-extrabold">Threshold Alerts</h3>
                  </div>
                  <div className="space-y-3">
                    {worsenings.length > 0 ? (
                      worsenings.slice(0, 3).map((c, idx) => {
                        const date = new Date(c.time);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={idx} className="p-3 bg-red-950/20 rounded-xl border border-red-900/30">
                            <p className="font-body-sm text-xs text-white leading-relaxed font-semibold">
                              <strong className="text-red-400">AQI &gt; {c.aqi} Expected</strong><br />
                              {dayName} at {timeStr} due to worsening conditions into the <span className="font-bold underline">{c.to_category}</span> band.
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 bg-green-950/20 rounded-xl border border-green-900/30">
                        <p className="font-body-sm text-xs text-green-400 leading-relaxed font-semibold">
                          <strong className="text-green-400">No Critical Threshold Crossings</strong><br />
                          Atmospheric trends remain stable with no category declines expected.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Model Metrics */}
                <div className="bg-[#1E2224] border border-outline/20 rounded-2xl p-6 flex-grow shadow-lg">
                  <h3 className="font-title-md text-base text-white font-extrabold mb-4">Model Parameters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-fixed-dim block mb-1">Confidence</span>
                      <span className="font-data-mono text-lg text-[#4ae183] font-bold">87.4%</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-fixed-dim block mb-1">Resolution</span>
                      <span className="font-data-mono text-lg text-white font-bold">1km x 1km</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-fixed-dim block mb-1">Last Run</span>
                      <span className="font-data-mono text-lg text-white font-bold">{new Date().toISOString().slice(11, 16)} UTC</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-fixed-dim block mb-1">Ensemble</span>
                      <span className="font-data-mono text-lg text-white font-bold">WRF-Chem</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* 3-Day Covariate Breakdown */}
            <section className="mt-8 bg-[#1E2224] border border-outline/20 rounded-2xl p-6 md:p-8 shadow-lg">
              <h2 className="font-title-md text-lg text-white font-extrabold mb-6 border-b border-outline/20 pb-3">Meteorological Covariates (Next 3 Days)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Day 1 */}
                <div className="border-r border-outline/10 pr-6 last:border-0 last:pr-0">
                  <h4 className="font-body-lg font-extrabold text-white mb-4 text-sm uppercase tracking-wider text-[#4ae183]">{day1Name}</h4>
                  {day1Stats ? (
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex justify-between items-center bg-[#1A1D1E] p-3 rounded-xl border border-white/5">
                        <span className="text-secondary-fixed-dim flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">air</span> Wind</span>
                        <span className="font-data-mono text-white">{day1Stats.windSpeed} km/h</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#1A1D1E] p-3 rounded-xl border border-white/5">
                        <span className="text-secondary-fixed-dim flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">humidity_percentage</span> Humidity</span>
                        <span className="font-data-mono text-white">{day1Stats.humidity}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#1A1D1E] p-3 rounded-xl border border-white/5">
                        <span className="text-secondary-fixed-dim flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">device_thermostat</span> Temp Range</span>
                        <span className="font-data-mono text-white">{day1Stats.tempMin}°C - {day1Stats.tempMax}°C</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-secondary-fixed-dim font-bold">No covariate forecast available</span>
                  )}
                </div>

                {/* Day 2 */}
                <div className="border-r border-outline/10 pr-6 last:border-0 last:pr-0">
                  <h4 className="font-body-lg font-extrabold text-white mb-4 text-sm uppercase tracking-wider text-[#4ae183]">{day2Name}</h4>
                  {day2Stats ? (
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex justify-between items-center bg-[#1A1D1E] p-3 rounded-xl border border-white/5">
                        <span className="text-secondary-fixed-dim flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">air</span> Wind</span>
                        <span className="font-data-mono text-white">{day2Stats.windSpeed} km/h</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#1A1D1E] p-3 rounded-xl border border-white/5">
                        <span className="text-secondary-fixed-dim flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">humidity_percentage</span> Humidity</span>
                        <span className="font-data-mono text-white">{day2Stats.humidity}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#1A1D1E] p-3 rounded-xl border border-white/5">
                        <span className="text-secondary-fixed-dim flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">device_thermostat</span> Temp Range</span>
                        <span className="font-data-mono text-white">{day2Stats.tempMin}°C - {day2Stats.tempMax}°C</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-secondary-fixed-dim font-bold">No covariate forecast available</span>
                  )}
                </div>

                {/* Day 3 */}
                <div className="border-r border-outline/10 pr-6 last:border-0 last:pr-0">
                  <h4 className="font-body-lg font-extrabold text-white mb-4 text-sm uppercase tracking-wider text-[#4ae183]">{day3Name}</h4>
                  {day3Stats ? (
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex justify-between items-center bg-[#1A1D1E] p-3 rounded-xl border border-white/5">
                        <span className="text-secondary-fixed-dim flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">air</span> Wind</span>
                        <span className="font-data-mono text-white">{day3Stats.windSpeed} km/h</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#1A1D1E] p-3 rounded-xl border border-white/5">
                        <span className="text-secondary-fixed-dim flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">humidity_percentage</span> Humidity</span>
                        <span className="font-data-mono text-white">{day3Stats.humidity}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#1A1D1E] p-3 rounded-xl border border-white/5">
                        <span className="text-secondary-fixed-dim flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">device_thermostat</span> Temp Range</span>
                        <span className="font-data-mono text-white">{day3Stats.tempMin}°C - {day3Stats.tempMax}°C</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-secondary-fixed-dim font-bold">No covariate forecast available</span>
                  )}
                </div>
              </div>
            </section>
          </main>
        ) : (
          /* Search Prompt Fallback */
          <main className="flex-grow pt-[88px] px-6 md:px-10 max-w-[1280px] mx-auto w-full flex flex-col items-center justify-center py-24">
            <div className="max-w-md w-full bg-[#1E2224] border border-outline/20 p-8 rounded-2xl text-center shadow-xl">
              <span className="material-symbols-outlined text-[#4ae183] text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>
                timeline
              </span>
              <h2 className="font-headline-lg text-2xl font-bold text-white mb-2">72-Hour AQI Forecasting</h2>
              <p className="font-body-sm text-sm text-secondary-fixed-dim mb-6 leading-relaxed">
                Enter a city or choose from the list to view real-time projections and meteorological covariate models.
              </p>
              <div className="w-full text-left">
                <SearchBar onLocationSelect={handleLocationSelect} selectedLocation={location} viewMode="admin" />
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-fixed-dim block mb-3">
                  Quick Select Region
                </span>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_CITIES.map(city => (
                    <button
                      key={city.name}
                      className="px-4 py-2 rounded-xl text-xs font-bold border bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                      onClick={() => handleLocationSelect(city)}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Footer */}
        <footer className="bg-surface-container-lowest dark:bg-inverse-surface text-on-surface dark:text-inverse-on-surface font-body-sm text-xs w-full mt-12 border-t border-outline-variant/50 dark:border-outline/30 mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-10 py-6 max-w-[1280px] mx-auto gap-4">
            <div className="flex flex-col items-center md:items-start">
              <span className="font-title-md text-base font-bold text-primary dark:text-primary-fixed-dim mb-1">VayuDrishti</span>
              <span className="text-center md:text-left text-xs text-on-secondary-container dark:text-secondary-fixed-dim">© 2026 VayuDrishti Environmental Intelligence. Data powered by CPCB, OpenAQ, and Open-Meteo.</span>
            </div>
            <div className="flex gap-6 mt-4 md:mt-0 font-semibold text-xs">
              <button onClick={() => setCurrentTab('platform')} className="text-on-secondary-container dark:text-secondary-fixed-dim hover:text-primary transition-opacity">Platform</button>
              <button onClick={() => setCurrentTab('methodology')} className="text-on-secondary-container dark:text-secondary-fixed-dim hover:text-primary transition-opacity">Data Sources</button>
              <button className="text-primary dark:text-primary-fixed-dim underline font-bold">Forecasting</button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (currentTab === 'methodology') {
    return (
      <div className="bg-background text-on-background antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
        {/* TopNavBar */}
        <nav className="bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant/30 dark:border-outline/20 shadow-sm dark:shadow-none">
          <div className="flex justify-between items-center px-6 md:px-10 py-4 max-w-[1280px] mx-auto w-full">
            <div 
              onClick={() => {
                setCurrentTab('platform');
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <img 
                alt="VayuDrishti Logo" 
                className="h-8 w-8 object-contain group-hover:scale-105 transition-transform" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLsWkVJHb3kTMKy9LAmPtpvTcdbskFEKaq27mOfpMz0Y6REDtNrvwLhRqSPOdxAI-q0Lim3xbtxUYCdCJGBCdaIvDXj_k5_o4cK_auK8a7Lp4eA-qvL9m2YwBOEvHlseihXnwGh4yqtmL7soKRqCMOAIOrS3jNdaqOcGpysEdzyIo8PX5ptHhZvhHCLlzz-nx0LOC7XHKBzY8cjFcbOgadVTkdKYtjF8f89-cfSCKoIeS7hCxVTfHJz4bp0" 
              />
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary dark:text-primary-fixed-dim tracking-tight">VayuDrishti</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => setCurrentTab('platform')}
                className="text-secondary dark:text-secondary-fixed-dim font-medium hover:text-primary dark:hover:text-primary-fixed-dim transition-colors text-sm font-semibold"
              >
                Platform
              </button>
              <button 
                className="text-primary dark:text-primary-fixed-dim font-bold border-b-2 border-primary dark:border-primary-fixed-dim pb-1 text-sm font-semibold"
              >
                Data Sources
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setCurrentTab('platform');
                  if (!hasSelectedRole) {
                    setViewMode('citizen');
                    setHasSelectedRole(true);
                  }
                }}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg font-body-sm text-sm hover:opacity-90 transition-opacity font-bold"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-24 pb-16 px-6 md:px-10 max-w-[1280px] mx-auto w-full flex-grow">
          {/* Header Section */}
          <header className="mb-8 text-center">
            <h1 className="font-display-lg text-4xl md:text-5xl text-on-surface mb-3 tracking-tight font-black">Data Sources &amp; Methodology</h1>
            <p className="font-body-lg text-base md:text-lg text-secondary max-w-3xl mx-auto leading-relaxed">
              A transparent overview of the scientific foundations, data integrations, and computational models driving VayuDrishti's environmental intelligence platform.
            </p>
          </header>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 1. Data Sources */}
            <section className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                  database
                </span>
                <h2 className="font-title-md text-xl text-on-surface font-extrabold">Data Integration</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-outline-variant/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                      sensors
                    </span>
                    <h3 className="font-body-lg text-base font-bold">OpenAQ (Ground Stations)</h3>
                  </div>
                  <p className="font-body-sm text-sm text-secondary leading-relaxed font-semibold">
                    We ingest real-time particulate matter (PM2.5, PM10) and trace gas (NO2, SO2, CO, O3) readings from OpenAQ's global network. This provides high-fidelity, localized ground truth data essential for accurate baseline assessments.
                  </p>
                </div>
                <div className="bg-surface border border-outline-variant/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                      air
                    </span>
                    <h3 className="font-body-lg text-base font-bold">Open-Meteo (Atmospheric Models)</h3>
                  </div>
                  <p className="font-body-sm text-sm text-secondary leading-relaxed font-semibold">
                    Atmospheric modeling and weather covariates (temperature, humidity, wind speed/direction, boundary layer height) are sourced via Open-Meteo. These variables are critical for understanding pollutant dispersion and accumulation.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. AQI Calculation */}
            <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                  calculate
                </span>
                <h2 className="font-title-md text-xl text-on-surface font-extrabold">AQI Calculation</h2>
              </div>
              <p className="font-body-sm text-sm text-secondary mb-4 leading-relaxed font-semibold">
                VayuDrishti strictly implements the Central Pollution Control Board (CPCB) National Air Quality Index formula.
              </p>
              <div className="bg-surface p-4 rounded-xl border border-outline-variant/20 overflow-x-auto">
                <code className="font-data-mono text-xs text-on-surface whitespace-pre-wrap leading-relaxed font-medium">
{`Ip = [(IHI - ILO) / (BPHI - BPLO)] 
     * (Cp - BPLO) + ILO

Where:
Ip = Index for pollutant p
Cp = Concentration of p
BPHI = Breakpoint high
BPLO = Breakpoint low
IHI = AQI value corresponding to BPHI
ILO = AQI value corresponding to BPLO`}
                </code>
              </div>
            </section>

            {/* 3. Forecasting Model */}
            <section className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                  timeline
                </span>
                <h2 className="font-title-md text-xl text-on-surface font-extrabold">Forecasting Engine</h2>
              </div>
              <p className="font-body-sm text-sm text-secondary mb-4 leading-relaxed font-semibold">
                Our forecasting engine utilizes advanced time-series analysis combined with weather covariates to predict future air quality states up to 72 hours in advance.
              </p>
              <ul className="list-disc list-inside font-body-sm text-sm text-secondary space-y-2 leading-relaxed font-semibold">
                <li><strong>Temporal Features:</strong> Historical pollution patterns, diurnal cycles, and seasonal trends.</li>
                <li><strong>Meteorological Drivers:</strong> Wind vectors, precipitation probability, and thermal inversions affecting dispersion.</li>
                <li><strong>Model Architecture:</strong> Ensemble methods combining ARIMA for baseline trends with gradient boosting for non-linear covariate interactions.</li>
              </ul>
            </section>

            {/* 4. Source Attribution */}
            <section className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                  pie_chart
                </span>
                <h2 className="font-title-md text-xl text-on-surface font-extrabold">Source Attribution Heuristics</h2>
              </div>
              <p className="font-body-sm text-sm text-secondary mb-4 leading-relaxed font-semibold">
                To provide actionable insights, we employ a heuristic engine to estimate the likely primary sources of current pollution levels when direct chemical speciation data is unavailable.
              </p>
              <div className="bg-surface rounded-xl border border-outline-variant/20 p-4">
                <h4 className="font-label-caps text-xs text-on-surface-variant mb-2 font-bold uppercase tracking-wider">Core Logic Pillars</h4>
                <ul className="font-body-sm text-sm text-secondary space-y-2 leading-relaxed font-semibold">
                  <li><span className="font-bold text-on-surface">Pollutant Ratios:</span> Analyzing PM2.5 to PM10 ratios (high ratios suggest combustion/vehicular, low ratios suggest dust).</li>
                  <li><span className="font-bold text-on-surface">Gas Proxies:</span> Elevated NO2 alongside PM2.5 often indicates local traffic emissions.</li>
                  <li><span className="font-bold text-on-surface">Temporal Signatures:</span> Spikes during typical commuting hours vs. late-night regional transport or biomass burning.</li>
                </ul>
              </div>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-lowest dark:bg-inverse-surface w-full mt-12 border-t border-outline-variant/50 dark:border-outline/30">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-10 py-6 max-w-[1280px] mx-auto gap-4">
            <div className="font-title-md text-base font-bold text-primary dark:text-primary-fixed-dim">
              VayuDrishti
            </div>
            <div className="font-body-sm text-xs text-on-surface dark:text-inverse-on-surface text-center md:text-left">
              © 2026 VayuDrishti Environmental Intelligence. Data powered by CPCB, OpenAQ, and Open-Meteo.
            </div>
            <div className="flex gap-4 font-body-sm text-xs">
              <button onClick={() => setCurrentTab('platform')} className="text-on-secondary-container dark:text-secondary-fixed-dim hover:text-primary transition-opacity font-semibold">Platform</button>
              <button className="text-primary dark:text-primary-fixed-dim underline font-bold">Methodology</button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (!hasSelectedRole) {
    return (
      <div className="bg-background text-on-surface font-body-lg min-h-screen flex flex-col antialiased ambient-gradient">
        {/* TopNavBar */}
        <header className="bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant">
          <div className="flex justify-between items-center h-16 px-6 md:px-10 max-w-[1280px] mx-auto">
            <div className="flex items-center gap-2">
              <img 
                alt="VayuDrishti Logo" 
                className="h-8 w-8 object-contain" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLsWkVJHb3kTMKy9LAmPtpvTcdbskFEKaq27mOfpMz0Y6REDtNrvwLhRqSPOdxAI-q0Lim3xbtxUYCdCJGBCdaIvDXj_k5_o4cK_auK8a7Lp4eA-qvL9m2YwBOEvHlseihXnwGh4yqtmL7soKRqCMOAIOrS3jNdaqOcGpysEdzyIo8PX5ptHhZvhHCLlzz-nx0LOC7XHKBzY8cjFcbOgadVTkdKYtjF8f89-cfSCKoIeS7hCxVTfHJz4bp0" 
              />
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary tracking-tight">VayuDrishti</span>
            </div>
            <nav className="hidden md:flex gap-6 items-center">
              <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-semibold" href="#features">Features</a>
              <button 
                onClick={() => setCurrentTab('methodology')}
                className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-semibold"
              >
                Data Solutions
              </button>
              <button 
                onClick={() => setCurrentTab('forecasting')}
                className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-sm font-semibold"
              >
                Forecasting
              </button>
              <button 
                onClick={() => {
                  setViewMode('citizen');
                  setHasSelectedRole(true);
                }}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg font-title-md text-title-md hover:bg-surface-tint transition-colors"
              >
                Get Started
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-grow pt-24 pb-12 px-4 md:px-10 max-w-[1280px] mx-auto w-full">
          {/* Hero Section */}
          <section className="flex flex-col items-center justify-center text-center py-16 md:py-24 relative">
            <h1 className="font-display-lg text-display-lg md:text-[64px] md:leading-[72px] text-primary mb-6 max-w-4xl tracking-tight">
              VayuDrishti: Intelligence for a Greener Tomorrow
            </h1>
            <p className="font-title-md text-title-md text-on-surface-variant max-w-2xl mb-8">
              The unified platform for real-time air quality monitoring, predictive forecasting, and actionable health intelligence.
            </p>
          </section>

          {/* Role Selection */}
          <section id="roles" className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            {/* Citizen Card */}
            <div 
              onClick={() => {
                setViewMode('citizen');
                setHasSelectedRole(true);
              }}
              className="glass-panel rounded-xl p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-6 group-hover:bg-primary-container/30 transition-colors">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                  health_and_safety
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-bold">Citizen Access</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 flex-grow leading-relaxed">
                Protect your health with real-time advisories and local neighborhood monitoring.
              </p>
              <button className="w-full bg-surface-container-high border border-outline-variant text-primary font-title-md text-title-md py-3 rounded-lg group-hover:bg-primary group-hover:text-on-primary transition-colors">
                Enter Citizen View
              </button>
            </div>

            {/* Municipal Command Card */}
            <div 
              onClick={() => {
                setViewMode('admin');
                setHasSelectedRole(true);
              }}
              className="glass-panel rounded-xl p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-6 group-hover:bg-primary-container/30 transition-colors">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                  admin_panel_settings
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-bold">Municipal Command</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 flex-grow leading-relaxed">
                Advanced tools for administrators: 72-hour forecasting, source attribution, and geospatial risk mapping.
              </p>
              <button className="w-full bg-surface-container-high border border-outline-variant text-primary font-title-md text-title-md py-3 rounded-lg group-hover:bg-primary group-hover:text-on-primary transition-colors">
                Enter Administrator Console
              </button>
            </div>
          </section>

          {/* Features Overview Grid */}
          <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-lg border border-outline-variant p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  my_location
                </span>
                <h3 className="font-title-md text-title-md text-on-surface">Hyperlocal Accuracy</h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Powered by CPCB ground stations and satellite cross-validation.
              </p>
            </div>
            <div className="bg-surface rounded-lg border border-outline-variant p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  timeline
                </span>
                <h3 className="font-title-md text-title-md text-on-surface">72-Hour Foresight</h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                AI-driven time-series models for proactive urban planning.
              </p>
            </div>
            <div className="bg-surface rounded-lg border border-outline-variant p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  factory
                </span>
                <h3 className="font-title-md text-title-md text-on-surface">Explainable Attribution</h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Transparent logic to identify pollution sources at the source.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container w-full mt-12 border-t border-outline-variant py-6 px-6">
          <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <span className="font-title-md text-title-md font-bold text-primary">VayuDrishti</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                © 2026 VayuDrishti Environmental Intelligence. Powered by CPCB Real-time Data.
              </span>
            </div>
            <nav className="flex gap-4 font-body-sm text-body-sm">
              <a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
              <a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#">Terms of Service</a>
              <button 
                onClick={() => setCurrentTab('methodology')}
                className="text-on-surface-variant hover:text-on-surface transition-colors text-left"
              >
                Methodology
              </button>
            </nav>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0a0f18] tech-grid text-white' : 'bg-atmosphere text-on-background'
    }`}>
      
      {/* Header / Navbar */}
      <header className="glass-nav sticky top-0 z-50 px-4 md:px-10 py-4 flex justify-between items-center transition-all duration-300">
        <div 
          onClick={() => {
            setHasSelectedRole(false);
            setLocation(null);
            setDashboardData(null);
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
            V
          </div>
          <span className={`font-title-md text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-primary'}`}>
            VayuDrishti
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-6 mx-6 font-semibold text-xs uppercase tracking-wider">
          <button 
            onClick={() => setCurrentTab('platform')}
            className={`transition-colors py-1 ${currentTab === 'platform' ? (isDarkMode ? 'text-[#4ae183] border-b-2 border-[#4ae183]' : 'text-[#006d37] border-b-2 border-[#006d37]') : (isDarkMode ? 'text-secondary-fixed-dim hover:text-white' : 'text-secondary hover:text-[#006d37]')}`}
          >
            Platform
          </button>
          <button 
            onClick={() => setCurrentTab('methodology')}
            className={`transition-colors py-1 ${currentTab === 'methodology' ? (isDarkMode ? 'text-[#4ae183] border-b-2 border-[#4ae183]' : 'text-[#006d37] border-b-2 border-[#006d37]') : (isDarkMode ? 'text-secondary-fixed-dim hover:text-white' : 'text-secondary hover:text-[#006d37]')}`}
          >
            Data Sources
          </button>
          <button 
            onClick={() => setCurrentTab('forecasting')}
            className={`transition-colors py-1 ${currentTab === 'forecasting' ? (isDarkMode ? 'text-[#4ae183] border-b-2 border-[#4ae183]' : 'text-[#006d37] border-b-2 border-[#006d37]') : (isDarkMode ? 'text-secondary-fixed-dim hover:text-white' : 'text-secondary hover:text-[#006d37]')}`}
          >
            Forecasting
          </button>
        </div>

        {/* Header Search Bar on Desktop (only displayed if dashboard loaded) */}
        {d && (
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <SearchBar onLocationSelect={handleLocationSelect} selectedLocation={location} viewMode={viewMode} />
          </div>
        )}

        {/* Right Nav Options */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* View Toggle */}
          <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-secondary-container/50 border-black/5'}`}>
            <button
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs uppercase transition-all ${
                !isDarkMode 
                  ? 'bg-surface-container-lowest text-[#00210c] shadow-sm' 
                  : 'text-secondary hover:text-white'
              }`}
              onClick={() => setViewMode('citizen')}
            >
              Citizen
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs uppercase transition-all ${
                isDarkMode 
                  ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => setViewMode('admin')}
            >
              Operations
            </button>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button 
              className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all ${
                isDarkMode 
                  ? 'border-white/10 hover:bg-white/5 text-white' 
                  : 'border-outline/20 hover:bg-black/5 text-[#00210c]'
              }`}
              onClick={() => setLangOpen(!langOpen)}
            >
              <span className="material-symbols-outlined text-[16px]">language</span>
              <span className="hidden sm:inline">{language}</span>
            </button>

            {langOpen && (
              <div className={`absolute right-0 top-full mt-2 w-36 border rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-md ${
                isDarkMode ? 'bg-[#111827]/95 border-white/10 text-white' : 'bg-white/95 border-black/5 text-on-surface'
              }`}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`w-full text-left px-4 py-2.5 text-xs font-extrabold hover:bg-black/5 transition-colors ${
                      language === lang.code ? 'text-primary dark:text-[#4ae183]' : ''
                    }`}
                    onClick={() => {
                      handleLanguageChange(lang.code);
                      setLangOpen(false);
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exit Portal Button */}
          <button 
            onClick={() => {
              setHasSelectedRole(false);
              setLocation(null);
              setDashboardData(null);
            }}
            className={`flex items-center justify-center p-2 border rounded-xl font-bold transition-all ${
              isDarkMode 
                ? 'border-white/10 hover:bg-white/5 text-white' 
                : 'border-outline/20 hover:bg-black/5 text-[#00210c]'
            }`}
            title="Return to Main Portal"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </header>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-[#0a0f18]/40 backdrop-blur-md z-[9999] flex flex-col items-center justify-center gap-4 transition-all duration-300">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#006d37]/20 border-t-[#006d37] dark:border-[#4ae183]/20 dark:border-t-[#4ae183] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-primary dark:text-[#4ae183]">
              V
            </div>
          </div>
          <span className="font-label-caps text-xs tracking-widest font-bold uppercase text-[#585e6c] dark:text-[#9ca3af] animate-pulse">
            Analyzing Atmospheric Data...
          </span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="max-w-xl w-full mx-auto mt-6 px-6 py-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 font-semibold text-sm shadow-sm relative z-50">
          <span className="material-symbols-outlined text-error">error</span>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs font-bold underline hover:opacity-80">Dismiss</button>
        </div>
      )}

      {/* Main Content Area */}
      {d ? (
        <main className={`max-w-[1280px] w-full mx-auto px-4 md:px-10 py-8 flex flex-col gap-6 md:gap-8 flex-1 transition-opacity ${
          loading ? 'opacity-70' : 'opacity-100'
        }`}>
          
          {/* Header Region */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {isDarkMode ? (
                <>
                  <h1 className="font-display-lg text-3xl md:text-5xl font-black text-white tracking-tight leading-none uppercase">
                    Operations Control
                  </h1>
                  <p className="font-body-sm text-xs md:text-sm text-secondary mt-2 font-medium">
                    VayuDrishti Regional Administration & Forecast Dispatch Center
                  </p>
                </>
              ) : (
                <h1 className="font-display-lg text-3xl md:text-5xl font-black text-primary tracking-tight leading-none">
                  See the air before<br className="hidden sm:inline" />you breathe it.
                </h1>
              )}

              <div className="flex items-center gap-3 mt-4">
                <span className="font-title-md text-xl md:text-2xl font-extrabold">
                  {d.location?.name || 'Unknown Location'}
                </span>
                
                <span className={`inline-flex items-center gap-1.5 font-label-caps text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                  isDarkMode 
                    ? 'bg-white/5 border border-white/10 text-white' 
                    : 'bg-primary-container/20 text-[#006d37]'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-red-500' : 'bg-[#006d37]'}`} />
                  {isDarkMode ? 'Real-Time Stream' : 'Live'}
                </span>
              </div>
            </div>

            <div className="text-left md:text-right font-label-caps text-[10px] md:text-xs text-secondary font-bold tracking-wider flex items-center md:justify-end gap-2">
              <span>
                {isDarkMode ? 'DISPATCH TIME: ' : 'Last updated: '}
                {lastUpdated ? lastUpdated.toLocaleString('en-IN') : new Date(d.timestamp).toLocaleString('en-IN')}
              </span>
              <button 
                onClick={handleRefresh}
                className={`p-1.5 rounded-lg flex items-center justify-center border transition-all ${
                  isDarkMode 
                    ? 'border-white/10 hover:bg-white/5 text-white' 
                    : 'border-primary/10 hover:bg-primary/5 text-primary'
                }`}
                title="Refresh Data"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Operations Warning Banner (Only in Admin view) */}
          {isDarkMode && (
            <div className="glass-panel border-l-4 border-[#F49D2B] bg-[#F49D2B]/5 p-5 rounded-r-2xl flex items-start gap-4 shadow-sm">
              <div className="mt-0.5 p-2 bg-[#F49D2B]/10 rounded-xl text-[#F49D2B]">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
              </div>
              <div>
                <span className="font-label-caps text-xs text-[#F49D2B] block mb-1 font-bold uppercase tracking-wider">
                  Operations Warning
                </span>
                <p className="font-body-sm text-sm text-white font-semibold leading-relaxed">
                  {warningCrossing ? (
                    <>
                      Threshold crossing alert: AQI is forecast to cross into the <strong>'{warningCrossing.to_category}'</strong> category in approximately {warningCrossing.hour_offset} hours. Dispatch preemptive municipal health advisories.
                    </>
                  ) : (
                    <>
                      Atmospheric dispersion indices are currently normal. No critical AQI threshold crossings are predicted within the 72-hour horizon.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Bento Grid */}
          {isDarkMode ? (
            /* Admin Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
              {/* Pollutant Matrix: spans 4 */}
              <div className="lg:col-span-4">
                <PollutantGrid concentrations={d.aqi.concentrations} subIndices={d.aqi.sub_indices} />
              </div>

              {/* Trajectory: spans 8 */}
              <div className="lg:col-span-8">
                <ForecastChart forecast={d.forecast.hourly_forecast} summary={d.forecast.summary} viewMode={viewMode} />
              </div>

              {/* Source Attribution: spans 5 */}
              <div className="lg:col-span-5">
                <AttributionPanel attribution={d.attribution} viewMode={viewMode} />
              </div>

              {/* Map: spans 7 */}
              <div className="lg:col-span-7">
                <MapView
                  location={d.location}
                  stations={d.openaq_stations}
                  currentAqi={d.aqi.aqi}
                  currentCategory={d.aqi.category}
                  currentColor={d.aqi.color}
                  viewMode={viewMode}
                />
              </div>
            </div>
          ) : (
            /* Citizen Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
              {/* Main AQI Banner + secondary metrics: spans 6 */}
              <div className="lg:col-span-6">
                <AqiBadge
                  aqi={d.aqi.aqi}
                  category={d.aqi.category}
                  dominantPollutant={d.aqi.dominant_pollutant}
                  concentrations={d.aqi.concentrations}
                  healthImpact={d.aqi.health_impact}
                />
              </div>

              {/* Advisory Card: spans 6 */}
              <div className="lg:col-span-6">
                <AdvisoryCard advisory={d.advisory} viewMode={viewMode} />
              </div>

              {/* Trajectory: spans 7 */}
              <div className="lg:col-span-7">
                <ForecastChart forecast={d.forecast.hourly_forecast} summary={d.forecast.summary} viewMode={viewMode} />
              </div>

              {/* Source Attribution: spans 5 */}
              <div className="lg:col-span-5">
                <AttributionPanel attribution={d.attribution} viewMode={viewMode} />
              </div>

              {/* Map: spans 12 */}
              <div className="lg:col-span-12">
                <MapView
                  location={d.location}
                  stations={d.openaq_stations}
                  currentAqi={d.aqi.aqi}
                  currentCategory={d.aqi.category}
                  currentColor={d.aqi.color}
                  viewMode={viewMode}
                />
              </div>
            </div>
          )}

          {/* Weather Details shown under Bento Grid for additional insight */}
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="font-label-caps text-xs font-bold text-secondary uppercase tracking-wider mb-2">Local Meteorological Conditions</h4>
            <WeatherBar weather={d.weather} viewMode={viewMode} />
          </div>

          {/* Data transparency footer */}
          <section className="glass-panel p-6 md:p-8 rounded-2xl flex flex-col gap-4 border border-black/5 dark:border-white/10">
            <h4 className="font-title-md text-sm md:text-base font-extrabold uppercase tracking-wider">Data Transparency</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <span className="font-label-caps text-[10px] font-bold px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-[#4ae183] border border-green-500/20 rounded-full w-fit uppercase">
                  Atmospheric model
                </span>
                <p className="text-xs text-secondary leading-relaxed font-semibold">
                  Pollutant concentrations derived directly from Open-Meteo atmospheric model, refreshed hourly with real time vectors.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-label-caps text-[10px] font-bold px-2.5 py-1 bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20 rounded-full w-fit uppercase">
                  72h Forecast
                </span>
                <p className="text-xs text-secondary leading-relaxed font-semibold">
                  Predictions calculated by the dispersion engine, factoring boundary layer heights, wind speeds, and chemical transformations.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-label-caps text-[10px] font-bold px-2.5 py-1 bg-[#F49D2B]/10 text-[#F49D2B] border border-[#F49D2B]/20 rounded-full w-fit uppercase">
                  Source Attribution
                </span>
                <p className="text-xs text-secondary leading-relaxed font-semibold">
                  Heuristic chemical fingerprint modeling based on source-specific ratio breakpoints (NO2/PM2.5, SO2, O3 offsets).
                </p>
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* Hero / Landing when no location selected */
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className={`w-full max-w-2xl glass-panel p-8 md:p-12 rounded-3xl text-center flex flex-col items-center shadow-xl ${
            isDarkMode ? 'border-white/10' : 'border-white/80'
          }`}>
            <span className={`inline-flex items-center gap-1.5 font-label-caps text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border mb-6 ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 text-primary-fixed-dim' 
                : 'bg-primary/5 border-primary/10 text-primary'
            }`}>
              🌍 AI-Powered Urban Air Quality Intelligence
            </span>
            
            <h2 className="font-display-lg text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Real-time air quality for <span className={isDarkMode ? 'text-primary-fixed-dim' : 'text-primary'}>every Indian city</span>
            </h2>
            
            <p className="font-body-sm text-sm md:text-base text-secondary leading-relaxed mb-8 max-w-lg font-semibold">
              {isDarkMode ? (
                "Access operations control vectors, detailed pollutant matrices, predictive threshold alerts, and dispersion forecasts for any municipality."
              ) : (
                "VayuDrishti combines live monitoring stations and atmospheric models to forecast AQI 72 hours ahead, attribute pollution sources, and deliver health advice."
              )}
            </p>

            {/* Centered Search Bar */}
            <div className="w-full flex justify-center mb-8 relative z-50">
              <SearchBar onLocationSelect={handleLocationSelect} selectedLocation={location} viewMode={viewMode} />
            </div>

            {/* Quick selectors */}
            <div className="w-full">
              <span className="font-label-caps text-[10px] font-bold text-secondary uppercase tracking-widest block mb-3">
                Quick Select Region
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_CITIES.map(city => (
                  <button
                    key={city.name}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5 ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20' 
                        : 'bg-white border-black/5 text-[#00210c] hover:bg-white/80 hover:shadow-md'
                    }`}
                    onClick={() => handleLocationSelect(city)}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`py-6 px-4 text-center text-[10px] md:text-xs font-bold tracking-wider font-label-caps border-t ${
        isDarkMode ? 'border-white/5 text-white/40' : 'border-black/5 text-secondary'
      }`}>
        <p>
          VAYUDRISHTI — ET AI HACKATHON 2026 · BUILT ON{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className={isDarkMode ? 'text-primary-fixed-dim' : 'text-primary'}>OPEN-METEO</a> &{' '}
          <a href="https://openaq.org" target="_blank" rel="noreferrer" className={isDarkMode ? 'text-primary-fixed-dim' : 'text-primary'}>OPENAQ</a> OPEN DATA · 
          AQI CALCULATED PER CPCB NAQI METHODOLOGY ·{' '}
          <button onClick={() => setCurrentTab('methodology')} className={`underline uppercase ${isDarkMode ? 'text-primary-fixed-dim' : 'text-primary'}`}>
            Methodology & Sources
          </button>
        </p>
      </footer>
    </div>
  );
}
