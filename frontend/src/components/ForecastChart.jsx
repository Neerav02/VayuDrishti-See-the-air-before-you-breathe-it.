import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { formatTime, getCategoryColors } from '../utils/cpcbColors';

const SEVERITY_BANDS = [
  { y1: 0, y2: 50, label: 'Good', color: '#009966', opacity: 0.05 },
  { y1: 51, y2: 100, label: 'Satisfactory', color: '#58b453', opacity: 0.05 },
  { y1: 101, y2: 200, label: 'Moderate', color: '#FFDD44', opacity: 0.05 },
  { y1: 201, y2: 300, label: 'Poor', color: '#FF8800', opacity: 0.05 },
  { y1: 301, y2: 400, label: 'Very Poor', color: '#CC0033', opacity: 0.05 },
  { y1: 401, y2: 500, label: 'Severe', color: '#990000', opacity: 0.05 },
];

function CustomTooltip({ active, payload, isDarkMode }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const colors = getCategoryColors(d.category);

  return (
    <div className={`p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all ${
      isDarkMode 
        ? 'bg-[#111827]/95 border-white/10 text-white' 
        : 'bg-white/95 border-black/5 text-on-surface'
    }`}>
      <div className="text-xs text-secondary mb-1">Hour offset: +{d.index}h ({formatTime(d.time)})</div>
      <div className="font-bold text-base" style={{ color: colors?.color || '#006d37' }}>
        AQI: {d.aqi} — {d.category}
      </div>
      <div className="text-xs text-secondary mt-1">PM2.5: {d.pm2_5?.toFixed(1)} µg/m³</div>
      <div className="text-xs text-secondary">PM10: {d.pm10?.toFixed(1)} µg/m³</div>
      <div className="text-xs text-secondary">Temp: {d.temperature}°C | Wind: {d.wind_speed} km/h</div>
    </div>
  );
}

export default function ForecastChart({ forecast, summary, viewMode }) {
  if (!forecast || forecast.length === 0) {
    return <div className="p-8 text-center text-secondary glass-panel rounded-2xl">No forecast data available</div>;
  }

  const isDarkMode = viewMode === 'admin';

  // Format data for display matching the +12h, +24h mockup X axis labels
  const chartData = forecast.map((point, i) => {
    let displayLabel = '';
    if (i === 0) displayLabel = 'Now';
    else if (i % 12 === 0) displayLabel = `+${i}h`;
    
    return {
      ...point,
      index: i,
      displayTime: displayLabel,
      dateLabel: new Date(point.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });

  const maxAqi = Math.max(...forecast.map(f => f.aqi), 100);
  const yMax = Math.min(Math.ceil(maxAqi / 50) * 50 + 50, 500);

  // Line stroke gradient colors
  const strokeColor = isDarkMode ? '#4ae183' : '#006d37';
  const fillGradientId = isDarkMode ? 'adminAqiGradient' : 'citizenAqiGradient';

  return (
    <div className={`glass-panel rounded-2xl p-6 md:p-8 flex flex-col h-full ${isDarkMode ? 'dark border-white/10' : ''}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h2 className={`font-title-md text-title-md font-extrabold ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>
            72-Hour AQI Trajectory
          </h2>
          <p className="font-body-sm text-body-sm text-secondary mt-1">
            Predictive modeling based on current meteorological dispersion vectors.
          </p>
        </div>
        
        <div className="flex gap-2">
          <span className={`inline-flex items-center gap-1.5 font-label-caps text-label-caps border px-3 py-1.5 rounded-full ${
            isDarkMode 
              ? 'bg-white/5 border-white/10 text-white' 
              : 'bg-primary/5 border-primary/10 text-primary'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-md ${isDarkMode ? 'bg-primary-fixed-dim' : 'bg-primary'}`}></span> 
            Forecast Model
          </span>
        </div>
      </div>

      {/* Recharts Wrapper: using width 99% and numeric height on ResponsiveContainer to guarantee parent measurement works */}
      <div className={`w-full relative rounded-xl border p-2 overflow-hidden min-h-[280px] ${
        isDarkMode ? 'bg-[#0a0f18]/50 border-white/10' : 'bg-white/30 border-black/5'
      }`}>
        <ResponsiveContainer width="99%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="adminAqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ae183" stopOpacity={0.25} />
                <stop offset="100%" stopColor="rgba(74,225,131,0)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="citizenAqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#006d37" stopOpacity={0.2} />
                <stop offset="100%" stopColor="rgba(0,109,55,0)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* CPCB background bands */}
            {SEVERITY_BANDS.filter(b => b.y1 < yMax).map(band => (
              <ReferenceArea
                key={band.label}
                y1={band.y1}
                y2={Math.min(band.y2, yMax)}
                fill={band.color}
                fillOpacity={isDarkMode ? 0.08 : 0.06}
              />
            ))}

            <CartesianGrid 
              strokeDasharray="4 4" 
              stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} 
              vertical={false} 
            />
            
            <XAxis
              dataKey="displayTime"
              tick={{ fill: isDarkMode ? '#9ca3af' : '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              interval={0}
            />
            
            <YAxis
              domain={[0, yMax]}
              tick={{ fill: isDarkMode ? '#9ca3af' : '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            />
            
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />

            <Area
              type="monotone"
              dataKey="aqi"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill={`url(#${fillGradientId})`}
              dot={false}
              activeDot={{ r: 6, fill: strokeColor, stroke: isDarkMode ? '#0a0f18' : '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {summary && (
        <p className={`font-body-sm leading-relaxed p-4 rounded-xl mt-4 border ${
          isDarkMode ? 'bg-white/5 border-white/10 text-secondary' : 'bg-primary/5 border-primary/10 text-[#00391b] font-medium'
        }`}>
          {summary}
        </p>
      )}
    </div>
  );
}
