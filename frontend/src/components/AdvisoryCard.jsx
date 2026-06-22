export default function AdvisoryCard({ advisory, viewMode }) {
  if (!advisory) {
    return <div className="p-8 text-center text-secondary glass-panel rounded-2xl">No health advisory available</div>;
  }

  const isDarkMode = viewMode === 'admin';

  // Extract general advice
  const generalAdvice = advisory.general || "Reduce prolonged or heavy exertion outdoors. Take more breaks.";

  // Combine children, elderly, and respiratory advice for "Sensitive Groups"
  const sensitiveAdviceParts = [
    advisory.children,
    advisory.elderly,
    advisory.respiratory_patients
  ].filter(Boolean);

  const sensitiveAdvice = sensitiveAdviceParts.length > 0 
    ? sensitiveAdviceParts.join(' ')
    : "Children, elderly, and those with respiratory issues should avoid strenuous outdoor activities.";

  // Outdoor workers advice
  const outdoorAdvice = advisory.outdoor_workers;

  return (
    <div className={`glass-panel rounded-2xl p-6 md:p-8 flex flex-col h-full ${
      isDarkMode ? 'dark border-white/10 text-white' : 'text-on-surface'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-black/5 dark:border-white/10 pb-4">
        <h2 className="font-title-md text-xl md:text-2xl font-extrabold flex items-center gap-3 drop-shadow-sm">
          <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary-fixed-dim/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary dark:text-[#4ae183]" style={{ fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
          </div>
          Health Advisory
        </h2>
        
        <span className="font-label-caps text-[10px] uppercase font-bold tracking-wider text-secondary">
          {advisory.generated_by === 'groq-llm' ? '🤖 AI' : '📋 Rule-Based'}
        </span>
      </div>

      {/* Advisory Segments */}
      <div className="flex-1 flex flex-col gap-5 justify-center">
        {/* General Public Card */}
        <div className={`glass-card rounded-xl p-4 flex gap-4 items-start cursor-default ${
          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/50 border-black/5'
        }`}>
          <div className="mt-0.5 p-2 bg-secondary/10 dark:bg-white/5 rounded-lg text-secondary">
            <span className="material-symbols-outlined">directions_run</span>
          </div>
          <div>
            <span className="font-label-caps text-xs text-secondary block mb-1 font-bold uppercase tracking-wider">
              General Public
            </span>
            <p className="font-body-sm text-body-sm text-on-surface font-semibold leading-relaxed">
              {generalAdvice}
            </p>
          </div>
        </div>

        {/* Sensitive Groups Card (Warning Highlighted) */}
        <div className="bg-error/5 backdrop-blur-md border border-error/20 rounded-xl p-4 flex gap-4 items-start hover:bg-error/10 transition-all duration-300 cursor-default shadow-sm">
          <div className="mt-0.5 p-2 bg-error/10 rounded-lg text-error">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
          </div>
          <div>
            <span className="font-label-caps text-xs text-error block mb-1 font-bold uppercase tracking-wider">
              Sensitive Groups
            </span>
            <p className="font-body-sm text-body-sm text-on-surface font-semibold leading-relaxed">
              {sensitiveAdvice}
            </p>
          </div>
        </div>

        {/* Outdoor Workers Card (Optional) */}
        {outdoorAdvice && (
          <div className={`glass-card rounded-xl p-4 flex gap-4 items-start cursor-default ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/50 border-black/5'
          }`}>
            <div className="mt-0.5 p-2 bg-primary/10 rounded-lg text-primary dark:text-[#4ae183]">
              <span className="material-symbols-outlined">engineering</span>
            </div>
            <div>
              <span className="font-label-caps text-xs text-secondary block mb-1 font-bold uppercase tracking-wider">
                Outdoor Workers
              </span>
              <p className="font-body-sm text-body-sm text-on-surface font-semibold leading-relaxed">
                {outdoorAdvice}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Share Button */}
      <button className={`mt-6 w-full py-3 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/80 dark:border-white/10 text-primary dark:text-[#4ae183] font-body-lg text-body-lg font-bold rounded-xl hover:bg-white/90 dark:hover:bg-white/10 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-sm`}>
        <span className="material-symbols-outlined text-[20px]">share</span> Share Advisory
      </button>
    </div>
  );
}
