import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Filter, X, Navigation, Calendar, Plus, Minus, Target, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const MOCK_MAP_EVENTS = [
  { id: '1', title: 'Anime Expo Baires', lat: -34.6037, lng: -58.3816, category: 'Anime', date: '24 Oct, 2024', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBv2ngcnCNOI_nkiE_cO3acduvaCc27Ifu6NCzO4PzJebFZAy5yCNScL4eIlTDJFKh9KOH8vlKfLFXqZyG-FNKIj-_7i1YYhLe5m9DL0gvQSuGIBV9VTr31kzZIqqMWiSFWDFTY8MdDC3Ji0SKeB6ekH7nwRON9MYy187ZAqHfhcMOHCWSp5hUgrvezaLBR947OfYGPiqqA8udolPddZxDazcEt9EUzcmUDqVmRu9-TmHwrjZpKaEOfdpFziYYdjEiuCl6k9h1LeMda', match: '94%', live: true },
  { id: '2', title: 'Torneo Gamer Central', lat: -34.5800, lng: -58.4200, category: 'Gamer', date: '25 Oct, 2024', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApMXv3w2T2EQdRuxZYnvWcKpGKOfVboaP8qkiKzOmNNOALBXl4SkIPbFbNtUbCIZM6w4VZj3YUdAPetUht29WiTpuHpEL5Xnd3ZCp1_ku7BQHsJpn2cOIszhzlJb8I4Xhu9Asj7Z_PYwRA79BnK2ENFsTnOK17MO3HWWXm4ho-slh-eyXwzmxZGrF2wHXJfBO34WUGxBnNN3PASkX2QdVCtEVYiKzj7txJ58tTiTFtVSrR39CCFSnCnyI_gyhsc8JQVjIuMUnc104V', match: '88%', live: false },
  { id: '3', title: 'K-Pop Night Stage', lat: -34.6100, lng: -58.3700, category: 'K-Pop', date: '27 Oct, 2024', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwfiSai0PDW9rXMvCCYBAzLtXTnH1kUcTJcDW-oe4P1NojB3BgleQveo2VrqaupGmQujTGjywBQrtP2UMKNKTBMNvGg7hozqcKYS4FFfsSTYvfq2ZCI7gtCrZ7C4mN22Cdt6J6a0T5MyUfFeoHH34TtHemwIG4hRreHyO3JPoxSS5LOFtCpz0ERgzfzBHU1omgtwBvOcn9NrMWB6-NVkZ2fswbcJOp06YadtjqygXQx6to6xZrgZ14FKX-AvmL-Zt3VgsU2v6nOB3s', match: '98%', live: true },
  { id: '4', title: 'Workshop TCG Masters', lat: -34.5900, lng: -58.4000, category: 'TCG', date: '26 Oct, 2024', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD55fF0ZgM2x5X8sKbzTCLuXzKfVcqbAhNQVVf9GaYvKmTy9kQxPyjseBu4N2SoD1C573Z_3AS1Qby6RJMKlaYeaezMBeLnYVQWrrt8GoJ7_0zCRkHdhH2BttajNH0gKqthjL_fUdr3nGabF4HDWdjUGdm2YldhZPBa3KS-1k0leP_FlM93kYQWyVRVCz39LJsUfplmY120Nm-uxlrsG14hHbAu-vNRJcln8dFU4lx3Au5C__YP-QFAHg7DR4_U5xCst2yOWNXmw0RK', match: '82%', live: false },
];

const CATEGORIES = [
  { id: 'Todos', name: 'Todos', icon: 'dashboard', color: 'primary' },
  { id: 'Anime', name: 'Anime', icon: 'auto_awesome', color: 'tertiary' },
  { id: 'Gamer', name: 'Gamer', icon: 'sports_esports', color: 'primary' },
  { id: 'K-Pop', name: 'K-Pop', icon: 'star', color: 'secondary' },
  { id: 'Feria', name: 'Feria', icon: 'festival', color: 'secondary-fixed-variant' },
];

const MapControls = ({ onZoomIn, onZoomOut, onRecenter }: { onZoomIn: () => void, onZoomOut: () => void, onRecenter: () => void }) => {
  return (
    <div className="absolute right-6 bottom-[280px] z-20 flex flex-col gap-4 pointer-events-auto">
      <div className="bg-white/85 backdrop-blur-xl flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/40">
        <button 
          onClick={onZoomIn}
          className="w-12 h-12 flex items-center justify-center text-on-surface hover:bg-white transition-all active:scale-90"
        >
          <Plus size={20} />
        </button>
        <div className="h-[1px] bg-outline-variant mx-2 opacity-30"></div>
        <button 
          onClick={onZoomOut}
          className="w-12 h-12 flex items-center justify-center text-on-surface hover:bg-white transition-all active:scale-90"
        >
          <Minus size={20} />
        </button>
      </div>
      <button 
        onClick={onRecenter}
        className="bg-primary text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-xl hover:shadow-primary/40 transition-all active:scale-95 border border-white/20"
      >
        <Target size={20} />
      </button>
    </div>
  );
};

const MapPage: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [proximity, setProximity] = useState(25);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error obtaining location:", error);
        }
      );
    }
  }, []);

  const selectedEvent = MOCK_MAP_EVENTS.find(e => e.id === selectedEventId);

  return (
    <div className="h-[calc(100vh-64px)] -mt-16 relative overflow-hidden bg-[#0b0e14]">
      {/* Search Input Injected into Header (Visual Only) */}
      <style>{`
        .navbar-glass input {
          background: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>

      {API_KEY && API_KEY !== 'YOUR_API_KEY' ? (
        <APIProvider apiKey={API_KEY} version="weekly">
          <MapWrapper 
            userLocation={userLocation} 
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            activeCategory={activeCategory}
          />
        </APIProvider>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white z-0">
          <img 
            className="w-full h-full object-cover opacity-30 grayscale" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuBsrzl9KIGrTKIIBQd9ZlkGpuUrGE36o1OXKVgaXiXmAhO6w5OgUDvQX_GD-pKl7-ObkIMOPnu8KTElQXSesaCWmIVgl7Joadn1kTCaG86Jhg8SMoGsL7r620D12LXgsruq01rfKK-N5jfneXNZXFWsUA9QDrm5rfTqJWv1baSghipl43pbinazRVIbB8bwdB71Kow4plyZPkscRr198PxhIyCwhNpjTJJyBqlsXGFWYkhEIM5rZkhxeK820C698Y8_uATB3tIGY8" 
            alt="Fallback Map"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 text-center max-w-lg">
              <MapPin size={48} className="text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-display font-black tracking-tight mb-4 uppercase italic">Configuración Requerida</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                El mapa interactivo requiere una API Key de Google Maps. Configura <code>VITE_GOOGLE_MAPS_PLATFORM_KEY</code> en tu entorno.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Side Filters */}
      <div className="absolute top-24 left-8 w-64 flex flex-col gap-4 z-30 pointer-events-none">
        <div className="bg-white/85 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl border border-white/40 ring-1 ring-primary/10 pointer-events-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Filtros Avanzados</h3>
            <span className="material-symbols-outlined text-primary text-sm">tune</span>
          </div>
          
          <div className="flex flex-col gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center justify-between w-full px-5 py-3 rounded-2xl transition-all group",
                  activeCategory === cat.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/30 border border-primary-container" 
                    : "hover:bg-surface-variant/50 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "material-symbols-outlined text-[20px] transition-transform group-hover:scale-110",
                    activeCategory === cat.id ? "text-white" : `text-${cat.color}`
                  )} style={{ fontVariationSettings: activeCategory === cat.id ? "'FILL' 1" : "'FILL' 0" }}>
                    {cat.icon}
                  </span>
                  <span className={cn(
                    "text-xs font-bold",
                    activeCategory === cat.id ? "text-white" : "text-on-surface-variant"
                  )}>{cat.name}</span>
                </div>
                {MOCK_MAP_EVENTS.some(e => e.category === cat.id && e.live) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-6 border-t border-outline-variant/30 pt-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-outline uppercase tracking-widest">Proximidad</span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{proximity}km</span>
              </div>
              <input 
                className="w-full h-1.5 bg-surface-variant/50 rounded-lg appearance-none cursor-pointer accent-primary" 
                max="100" min="1" type="range" 
                value={proximity}
                onChange={(e) => setProximity(parseInt(e.target.value))}
              />
            </div>
            <div>
              <span className="text-[9px] font-black text-outline uppercase tracking-widest mb-3 block">Fecha Seleccionada</span>
              <div className="flex items-center gap-2 bg-surface-variant/20 rounded-xl px-4 py-2.5 border border-outline-variant/20">
                <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
                <span className="text-[11px] font-bold text-on-surface truncate">Hoy, 27 Octubre</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Event Bottom Card */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: 50, x: "-50%", scale: 0.95 }}
            className="absolute bottom-6 left-1/2 w-[90%] max-w-2xl z-50 pointer-events-auto"
          >
            <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 flex h-40 ring-1 ring-primary/5">
              {/* Left: Image Section - More Compact */}
              <div className="w-1/3 relative overflow-hidden group shrink-0">
                <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={selectedEvent.image} alt={selectedEvent.title} />
                <div className="absolute top-3 left-3">
                  <span className="bg-primary/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedEvent.category}
                  </span>
                </div>
                {selectedEvent.live && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                    <span className="text-white text-[8px] font-black tracking-widest uppercase">VIVO</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Right: Details Section - Optimized Space */}
              <div className="flex-1 flex flex-col p-5 lg:p-6 justify-between bg-white/20">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="text-lg lg:text-xl font-display font-black italic tracking-tighter text-on-surface leading-tight uppercase line-clamp-2">{selectedEvent.title}</h2>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-primary font-black text-xl leading-none italic">{selectedEvent.match}</span>
                      <span className="text-[7px] font-black text-outline uppercase tracking-widest opacity-60">Match</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-center mt-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
                      <p className="text-[10px] font-bold text-on-surface">{selectedEvent.date.split(',')[0]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
                      <p className="text-[10px] font-bold text-on-surface">CABA</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <button 
                    onClick={() => navigate(`/events/${selectedEvent.id}`)}
                    className="bg-primary text-white font-black px-6 py-2.5 rounded-xl text-[9px] tracking-[0.15em] flex items-center gap-2 hover:bg-primary-container hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 group uppercase"
                  >
                    VER DETALLES
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                  <div className="flex gap-2">
                    <button className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-primary/10">
                      <span className="material-symbols-outlined text-[18px]">share</span>
                    </button>
                    <button 
                      onClick={() => setSelectedEventId(null)}
                      className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-outline-variant hover:text-red-500 hover:bg-red-50 transition-all border border-outline-variant/30"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MapWrapper = ({ userLocation, selectedEventId, onSelectEvent, activeCategory }: any) => {
  const map = useMap();
  
  const handleZoomIn = useCallback(() => {
    if (map) map.setZoom((map.getZoom() || 13) + 1);
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) map.setZoom((map.getZoom() || 13) - 1);
  }, [map]);

  const handleRecenter = useCallback(() => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
    } else if (map) {
      map.panTo({ lat: -34.6037, lng: -58.3816 });
      map.setZoom(13);
    }
  }, [map, userLocation]);

  const filteredEvents = MOCK_MAP_EVENTS.filter(e => 
    activeCategory === 'Todos' || e.category === activeCategory
  );

  return (
    <>
      <Map
        defaultCenter={{ lat: -34.6037, lng: -58.3816 }}
        defaultZoom={13}
        mapId="68d9f1c7e97491b4" // Custom map ID for stylizing
        className="w-full h-full"
        disableDefaultUI={true}
        gestureHandling={'greedy'}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      >
        {filteredEvents.map((event) => (
          <CustomMarker 
            key={event.id}
            event={event}
            isSelected={selectedEventId === event.id}
            onSelect={() => onSelectEvent(event.id)}
          />
        ))}

        {userLocation && (
          <AdvancedMarker position={userLocation}>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 animate-ping rounded-full" />
              <div className="w-5 h-5 bg-blue-600 rounded-full border-[3px] border-white shadow-2xl relative z-10" />
            </div>
          </AdvancedMarker>
        )}
      </Map>

      <MapControls 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        onRecenter={handleRecenter} 
      />
    </>
  );
};

const CustomMarker = ({ event, isSelected, onSelect }: any) => {
  const [markerRef] = useAdvancedMarkerRef();
  const categoryColor = CATEGORIES.find(c => c.id === event.category)?.color || 'primary';

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: event.lat, lng: event.lng }}
      onClick={onSelect}
    >
      <motion.div 
        animate={{ 
          scale: isSelected ? 1.25 : 1,
          y: isSelected ? -12 : 0
        }}
        className="relative cursor-pointer group"
      >
        {/* Animated pulse for selected */}
        {isSelected && (
          <div className="absolute inset-[-12px] bg-primary/20 animate-pulse rounded-full" />
        )}
        
        {/* Marker Body */}
        <div className={cn(
          "relative flex items-center bg-white p-1 rounded-full shadow-2xl transition-all duration-500",
          "border-[3px]",
          isSelected 
            ? "border-primary scale-110 z-50 ring-4 ring-primary/10" 
            : `border-${categoryColor}/40 hover:border-primary hover:scale-110`
        )}>
          <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30">
            <img src={event.image} className={cn("w-full h-full object-cover", event.live && "animate-pulse")} alt={event.title} />
          </div>
          
          <div className={cn(
            "absolute -top-3 -right-3 px-2 py-1 rounded-lg border-2 border-white shadow-lg text-[9px] font-black tracking-tighter transition-colors",
            isSelected ? "bg-primary text-white" : `bg-${categoryColor} text-white`
          )}>
            {event.match}
          </div>

          <AnimatePresence>
            {isSelected && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="ml-3 pr-4 whitespace-nowrap"
              >
                <p className="text-[8px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1">
                  {event.live ? 'VIVO AHORA' : event.category.toUpperCase()}
                </p>
                <p className="text-[11px] font-black text-on-surface leading-none uppercase tracking-tighter">
                  {event.title}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stem */}
        <div className={cn(
          "w-1 h-5 mx-auto mt-1 rounded-full shadow-lg transition-colors",
          isSelected ? "bg-primary" : `bg-${categoryColor}/40`
        )} />
      </motion.div>
    </AdvancedMarker>
  );
};

export default MapPage;
