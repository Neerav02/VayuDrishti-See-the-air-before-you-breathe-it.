import { useState, useRef, useEffect } from 'react';
import { resolveLocation } from '../services/api';

export default function SearchBar({ onLocationSelect, selectedLocation, viewMode }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  
  const isDarkMode = viewMode === 'admin';

  // Sync with selected location
  useEffect(() => {
    if (selectedLocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(`${selectedLocation.name}${selectedLocation.state ? ', ' + selectedLocation.state : ''}`);
    } else {
      setQuery('');
    }
  }, [selectedLocation]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await resolveLocation(value);
        setResults(data.results || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
  };

  const handleSelect = (location) => {
    setQuery(`${location.name}${location.state ? ', ' + location.state : ''}`);
    setIsOpen(false);
    onLocationSelect(location);
  };

  return (
    <div className="relative w-full max-w-xl" ref={wrapperRef}>
      <div className="relative w-full">
        <input
          type="text"
          className={`w-full pl-12 pr-12 py-3 bg-white/60 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 font-body-lg text-body-lg shadow-sm transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#0a0f18]/30 border-white/10 text-white focus:ring-primary-fixed-dim/20 focus:border-[#4ae183] placeholder-white/40' 
              : 'bg-white/60 border-white/80 text-on-surface focus:ring-primary/20 focus:border-[#006d37] placeholder-on-surface-variant/60'
          }`}
          placeholder={isDarkMode ? "Search Operations Vector (City, State)..." : "Search locality or city..."}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        
        <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
          isDarkMode ? 'text-white/40' : 'text-on-surface-variant/60'
        }`}>
          search
        </span>

        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className={`w-5 h-5 border-2 rounded-full animate-spin ${
              isDarkMode ? 'border-white/20 border-t-primary-fixed-dim' : 'border-black/10 border-t-primary'
            }`} />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-md max-h-80 overflow-y-auto transition-all ${
          isDarkMode 
            ? 'bg-[#111827]/95 border-white/10 text-white' 
            : 'bg-white/95 border-black/5 text-on-surface'
        }`}>
          {results.map((loc, i) => (
            <li 
              key={loc.id || i} 
              className={`px-5 py-3.5 cursor-pointer flex justify-between items-center transition-colors ${
                isDarkMode ? 'hover:bg-white/5 border-b border-white/5' : 'hover:bg-black/5 border-b border-black/5'
              } last:border-none`} 
              onClick={() => handleSelect(loc)}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[18px] ${
                  isDarkMode ? 'text-primary-fixed-dim' : 'text-primary'
                }`}>
                  location_on
                </span>
                <span className="font-bold text-sm">{loc.name}</span>
              </div>
              
              <span className="text-xs opacity-75">
                {[loc.state, loc.country].filter(Boolean).join(', ')}
                {loc.population && ` · Pop: ${(loc.population / 1000).toFixed(0)}K`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
