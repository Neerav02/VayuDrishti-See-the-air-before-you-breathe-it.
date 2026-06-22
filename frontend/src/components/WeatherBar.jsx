export default function WeatherBar({ weather, viewMode }) {
  if (!weather) return null;
  const isDarkMode = viewMode === 'admin';

  return (
    <div className="flex flex-wrap gap-2 md:gap-3 mt-4 pt-4 border-t border-black/5 dark:border-white/10">
      {weather.temperature != null && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white/50 border-black/5 text-on-surface'
        }`}>
          <span className="material-symbols-outlined text-[16px] text-secondary">thermostat</span>
          <span>{Math.round(weather.temperature)}°C</span>
        </div>
      )}
      
      {weather.humidity != null && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white/50 border-black/5 text-on-surface'
        }`}>
          <span className="material-symbols-outlined text-[16px] text-secondary">water_drop</span>
          <span>{Math.round(weather.humidity)}% RH</span>
        </div>
      )}
      
      {weather.wind_speed != null && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white/50 border-black/5 text-on-surface'
        }`}>
          <span className="material-symbols-outlined text-[16px] text-secondary">air</span>
          <span>{Math.round(weather.wind_speed)} km/h</span>
        </div>
      )}
      
      {weather.wind_direction != null && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white/50 border-black/5 text-on-surface'
        }`}>
          <span className="material-symbols-outlined text-[16px] text-secondary" style={{ transform: `rotate(${weather.wind_direction}deg)` }}>
            navigation
          </span>
          <span>{weather.wind_direction}° Dir</span>
        </div>
      )}
    </div>
  );
}
