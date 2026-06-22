import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getCategoryColors } from '../utils/cpcbColors';

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 11, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function MapView({ location, stations, currentAqi, currentCategory, currentColor, viewMode }) {
  const center = location ? [location.latitude, location.longitude] : [20.5937, 78.9629];
  const zoom = location ? 11 : 5;
  const isDarkMode = viewMode === 'admin';

  return (
    <div className={`glass-panel rounded-2xl p-stack-md md:p-stack-lg h-full flex flex-col ${isDarkMode ? 'dark text-white border-white/10' : 'text-on-surface'}`}>
      <div className="flex justify-between items-center mb-stack-md">
        <h2 className="font-title-md text-title-md font-extrabold">Geospatial Distribution</h2>
        <span className="font-label-caps text-label-caps text-secondary tracking-wider flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">fullscreen</span> FULL MAP
        </span>
      </div>

      <div className={`flex-1 min-h-[350px] w-full relative rounded-lg overflow-hidden border ${isDarkMode ? 'border-white/10 map-scan bg-[#0a0f18]' : 'border-black/5 bg-white/20'} transition-all`}>
        <MapContainer
          center={center}
          zoom={zoom}
          className="leaflet-map h-full w-full"
          scrollWheelZoom={true}
          style={{ height: '350px', width: '100%' }}
        >
          <MapUpdater center={location ? [location.latitude, location.longitude] : null} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={isDarkMode 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
          />

          {/* City center marker */}
          {location && (
            <CircleMarker
              center={[location.latitude, location.longitude]}
              radius={16}
              pathOptions={{
                color: currentColor || '#006d37',
                fillColor: currentColor || '#006d37',
                fillOpacity: 0.4,
                weight: 3,
              }}
            >
              <Popup>
                <div className={`map-popup font-body-sm p-1 ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>
                  <strong className="block text-sm font-bold">{location.name}</strong>
                  <div className="mt-1">
                    CPCB AQI: <span className="font-extrabold" style={{ color: currentColor }}>{currentAqi}</span>
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">Category: {currentCategory}</div>
                  <div className="text-[10px] text-secondary mt-1">Source: Open-Meteo model</div>
                </div>
              </Popup>
            </CircleMarker>
          )}

          {/* OpenAQ station markers */}
          {stations?.map((station, i) => {
            const colors = getCategoryColors(station.category);
            return (
              <CircleMarker
                key={i}
                center={[station.latitude, station.longitude]}
                radius={10}
                pathOptions={{
                  color: station.color || colors?.color || '#006d37',
                  fillColor: station.color || colors?.color || '#006d37',
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className={`map-popup font-body-sm p-1 ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>
                    <strong className="block text-sm font-bold">{station.name}</strong>
                    <div className="mt-1">
                      Station AQI: <span className="font-extrabold" style={{ color: station.color }}>{station.aqi}</span>
                    </div>
                    <div className="text-xs opacity-90 mt-0.5">Category: {station.category}</div>
                    <div className="text-[10px] text-secondary mt-1">{station.distance_km} km away</div>
                    <div className="text-[10px] text-secondary">Source: {station.provider}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
