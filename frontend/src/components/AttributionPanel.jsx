const SOURCE_META = {
  vehicular: { label: "Vehicular Emissions", icon: "directions_car", color: "#E73A34" },
  construction_dust: { label: "Construction Dust", icon: "construction", color: "#F49D2B" },
  meteorological_trapping: { label: "Meteorological Stagnation", icon: "air", color: "#F8ED31" },
  crop_burning: { label: "Crop Burning", icon: "agriculture", color: "#50B056" },
  industrial: { label: "Industrial Emissions", icon: "factory", color: "#6366f1" },
};

export default function AttributionPanel({ attribution, viewMode }) {
  if (!attribution || !attribution.sources) {
    return <div className="p-8 text-center text-secondary glass-panel rounded-2xl">No attribution data available</div>;
  }

  const isDarkMode = viewMode === 'admin';
  const { sources, explanations, confidence, inputs_used } = attribution;

  // Format and sort sources
  const sortedSources = Object.entries(sources)
    .map(([key, value]) => {
      const meta = SOURCE_META[key] || { label: key.replace('_', ' '), icon: "bar_chart", color: "#9ca3af" };
      return {
        key,
        value: Math.round(value),
        ...meta
      };
    })
    .sort((a, b) => b.value - a.value);

  // Generate a unified explanation text if there are multiple explanations
  const explanationText = explanations && explanations.length > 0 
    ? explanations.join(' ') 
    : "High particulate ratios indicate active combustion sources, combined with local meteorological conditions preventing dispersion.";

  return (
    <div className={`glass-panel rounded-2xl p-6 md:p-8 flex flex-col h-full ${isDarkMode ? 'dark border-white/10 text-white' : 'text-on-surface'}`}>
      <div className="flex justify-between items-start mb-2">
        <h2 className="font-title-md text-title-md font-extrabold">Explainable Source Attribution</h2>
        <span className={`px-2.5 py-0.5 rounded-full font-label-caps text-[10px] uppercase font-bold tracking-wider ${
          confidence === 'high' 
            ? 'bg-primary-container/20 text-[#006d37]' 
            : confidence === 'moderate'
              ? 'bg-[#F49D2B]/15 text-[#9c5500]'
              : 'bg-white/10 text-secondary'
        }`}>
          {confidence} Confidence
        </span>
      </div>
      <p className="font-body-sm text-body-sm text-secondary mb-6">
        AI-driven analysis of current atmospheric chemistry and regional vectors.
      </p>

      {/* Progress Bars */}
      <div className="flex-1 flex flex-col gap-5 justify-center">
        {sortedSources.map((source) => (
          <div key={source.key}>
            <div className="flex justify-between font-label-caps text-xs mb-1.5 font-bold tracking-wide">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]" style={{ color: source.color }}>
                  {source.icon}
                </span>
                {source.label}
              </div>
              <span className="font-data-mono font-extrabold">{source.value}%</span>
            </div>
            
            <div className={`w-full h-2 rounded-full overflow-hidden shadow-inner ${
              isDarkMode ? 'bg-white/10' : 'bg-black/5'
            }`}>
              <div 
                className="h-full rounded-full transition-all duration-1000"
                style={{ 
                  width: `${source.value}%`, 
                  background: `linear-gradient(to right, ${source.color}60, ${source.color})`,
                  boxShadow: `0 0 10px ${source.color}80`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Attribution Explanation Card */}
      <div className={`mt-6 border p-4 rounded-xl text-sm backdrop-blur-sm ${
        isDarkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-primary/5 border-primary/10'
      }`}>
        <strong className="font-title-md block mb-1 text-xs font-bold uppercase tracking-wider">
          Why this breakdown?
        </strong>
        <p className="font-body-sm text-secondary leading-relaxed text-xs font-medium">
          {explanationText}
        </p>

        {inputs_used && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5 dark:border-white/5 font-label-caps text-[9px] text-secondary">
            {inputs_used.hour != null && <span>🕐 {inputs_used.hour}:00</span>}
            {inputs_used.weekday && <span>📅 {inputs_used.weekday}</span>}
            {inputs_used.wind_speed_kmh != null && <span>💨 {inputs_used.wind_speed_kmh} km/h</span>}
            {inputs_used.boundary_layer_height_m != null && <span>🌡️ BLH: {inputs_used.boundary_layer_height_m}m</span>}
          </div>
        )}
      </div>
    </div>
  );
}
