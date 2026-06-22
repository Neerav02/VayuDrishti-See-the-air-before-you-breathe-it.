import { POLLUTANT_UNITS } from '../utils/cpcbColors';

export default function PollutantGrid({ concentrations, subIndices }) {
  if (!concentrations) return null;

  const pollutantMeta = {
    pm2_5: { name: "PM2.5", desc: "Fine Particulate", limit: "60" },
    pm10: { name: "PM10", desc: "Coarse Particulate", limit: "100" },
    no2: { name: "NO2", desc: "Nitrogen Dioxide", limit: "80" },
    o3: { name: "O3", desc: "Ozone", limit: "100" },
    so2: { name: "SO2", desc: "Sulfur Dioxide", limit: "80" },
    co: { name: "CO", desc: "Carbon Monoxide", limit: "2.0" },
    nh3: { name: "NH3", desc: "Ammonia", limit: "400" },
  };

  const list = Object.entries(concentrations)
    .filter(([k, v]) => v != null && pollutantMeta[k])
    .map(([key, value]) => {
      const meta = pollutantMeta[key];
      const subIndex = subIndices?.[key] || 0;
      
      // Determine text color based on sub-index value
      let colorClass = "text-[#92C654]"; // Good/Satisfactory
      let shadowClass = "rgba(146,198,84,0.4)";
      
      if (subIndex > 300) {
        colorClass = "text-error";
        shadowClass = "rgba(186,26,26,0.4)";
      } else if (subIndex > 200) {
        colorClass = "text-[#E73A34]";
        shadowClass = "rgba(231,58,52,0.4)";
      } else if (subIndex > 100) {
        colorClass = "text-[#F49D2B]";
        shadowClass = "rgba(244,157,43,0.4)";
      } else if (subIndex > 50) {
        colorClass = "text-[#F8ED31]";
        shadowClass = "rgba(248,237,49,0.4)";
      }

      return {
        key,
        name: meta.name,
        desc: meta.desc,
        limit: meta.limit,
        unit: POLLUTANT_UNITS[key] || 'µg/m³',
        value: typeof value === 'number' ? value.toFixed(1) : value,
        subIndex,
        colorClass,
        shadowStyle: { filter: `drop-shadow(0 0 6px ${shadowClass})` }
      };
    });

  if (list.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-stack-lg h-full flex flex-col border border-white/10 text-white">
      <div className="flex justify-between items-center mb-stack-md border-b border-white/10 pb-2">
        <h2 className="font-title-md text-title-md font-bold">Pollutant Matrix</h2>
        <span className="font-label-caps text-label-caps text-secondary tracking-wider">REAL-TIME vs CPCB</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-1 space-y-1">
        {list.map((p, idx) => (
          <div 
            key={p.key} 
            className={`py-3 border-b border-white/5 last:border-0 flex justify-between items-center group hover:bg-white/5 transition-colors rounded px-3 -mx-1 ${idx % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
          >
            <div className="flex flex-col">
              <span className="font-title-md text-sm md:text-base font-bold text-white">{p.name}</span>
              <span className="font-body-sm text-xs text-secondary">{p.desc}</span>
            </div>
            
            <div className="text-right">
              <div 
                className={`font-data-mono text-data-mono text-lg font-extrabold ${p.colorClass}`}
                style={p.shadowStyle}
              >
                {p.value}
                <span className="text-xs text-secondary ml-1 font-normal">{p.unit}</span>
              </div>
              <div className="font-label-caps text-[10px] text-secondary mt-0.5">
                Limit: {p.limit}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
