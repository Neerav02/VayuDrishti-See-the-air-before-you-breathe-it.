import { POLLUTANT_NAMES } from '../utils/cpcbColors';

export default function AqiBadge({ aqi, category, dominantPollutant, concentrations, healthImpact }) {
  // Map category to styles
  const categoryLower = category ? category.toLowerCase().replace(' ', '-') : 'unknown';
  
  const gradientClass = `aqi-${categoryLower}-gradient`;
  const pulseClass = `pulse-${categoryLower}`;
  
  // Custom text color for the inner circle elements to maintain readability on gradients
  const textColors = {
    "good": "text-[#00210c]",
    "satisfactory": "text-[#161c27]",
    "moderate": "text-[#5c4300]",
    "poor": "text-[#390c00]",
    "very-poor": "text-[#772e14]",
    "severe": "text-[#ffffff]"
  };
  
  const innerTextColors = {
    "good": "text-[#004d26]",
    "satisfactory": "text-[#24331e]",
    "moderate": "text-[#b8860b]",
    "poor": "text-[#b35c00]",
    "very-poor": "text-[#990026]",
    "severe": "text-[#ff9999]"
  };

  const currentTextColor = textColors[categoryLower] || "text-on-surface";
  const currentInnerTextColor = innerTextColors[categoryLower] || "text-primary";

  // Find dominant pollutant details
  const displayPollutant = dominantPollutant ? (POLLUTANT_NAMES[dominantPollutant] || dominantPollutant.toUpperCase()) : 'N/A';
  const displayValue = (concentrations && dominantPollutant && concentrations[dominantPollutant] !== undefined)
    ? Math.round(concentrations[dominantPollutant])
    : '--';
  const displayUnit = dominantPollutant === 'co' ? 'mg/m³' : 'µg/m³';

  // Get secondary pollutants (max 4, excluding dominant pollutant)
  const secondaryKeys = ['pm10', 'o3', 'no2', 'so2', 'pm2_5', 'co', 'nh3']
    .filter(k => k !== dominantPollutant && concentrations && concentrations[k] !== undefined && concentrations[k] !== null)
    .slice(0, 4);

  return (
    <div className="glass-panel rounded-2xl flex flex-col overflow-hidden h-full">
      {/* AQI Banner */}
      <div className={`${gradientClass} p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden flex-1 justify-between`}>
        {/* Decorative subtle pattern overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        {/* Top bar: Current AQI header + Dominant Pollutant badge */}
        <div className="relative z-10 flex justify-between items-center w-full border-b border-black/10 dark:border-white/10 pb-3">
          <span className="font-label-caps text-xs tracking-widest text-[#00210c] dark:text-[#f7fafc] font-black uppercase">
            Current Air Quality Index
          </span>
          
          {dominantPollutant && (
            <span className="font-label-caps text-[10px] bg-white/40 dark:bg-black/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-on-surface">
              Dominant: {displayPollutant}
            </span>
          )}
        </div>

        {/* Middle: Circle & Dominant/Secondary metric detail */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8 my-auto py-2">
          {/* AQI Circular Display */}
          <div className={`relative flex flex-col items-center justify-center ${pulseClass} w-36 h-36 rounded-full bg-white/40 backdrop-blur-md border-4 border-white/60 shadow-lg flex-shrink-0 transition-transform hover:scale-105 duration-300`}>
            <span className={`font-display-lg text-5xl leading-none font-black tracking-tighter drop-shadow-sm ${currentTextColor}`}>
              {aqi}
            </span>
            <span className={`font-title-md text-xs font-extrabold uppercase tracking-widest mt-1 ${currentInnerTextColor}`}>
              {category}
            </span>
          </div>

          {/* Dominant Pollutant Card info or short summary */}
          {dominantPollutant && (
            <div className="bg-white/40 dark:bg-[#111827]/30 backdrop-blur-sm border border-white/50 dark:border-white/10 rounded-xl p-4 text-center min-w-[120px] shadow-sm">
              <span className="font-label-caps text-[9px] block mb-0.5 opacity-75 text-secondary tracking-wider uppercase">Concentration</span>
              <span className="font-data-mono text-base font-extrabold block text-primary dark:text-[#4ae183]">
                {displayValue} <span className="text-[10px] font-normal text-secondary">{displayUnit}</span>
              </span>
            </div>
          )}
        </div>

        {/* Bottom: Health Impact statement */}
        <div className="relative z-10 bg-white/20 dark:bg-black/10 rounded-xl p-4 border border-white/10">
          <p className={`font-body-sm text-sm font-semibold leading-relaxed text-center sm:text-left ${currentTextColor}`}>
            {healthImpact}
          </p>
        </div>
      </div>

      {/* Secondary Metrics Details */}
      {secondaryKeys.length > 0 && (
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/30 dark:bg-[#111827]/20 backdrop-blur-md border-t border-white/50 dark:border-white/10">
          {secondaryKeys.map(key => {
            const val = concentrations[key];
            const displayVal = val != null ? Math.round(val) : '--';
            const name = POLLUTANT_NAMES[key] || key.toUpperCase();
            const unit = key === 'co' ? 'mg/m³' : 'µg/m³';
            return (
              <div key={key} className="glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="font-label-caps text-label-caps text-secondary block mb-1 text-xs font-bold uppercase">{name}</span>
                <span className="font-data-mono text-[18px] text-on-surface font-extrabold block">
                  {displayVal} <span className="text-xs font-normal text-secondary">{unit}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
