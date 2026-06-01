import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Plus, Minus, Target, ChevronRight, X, Share2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';



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
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: number | string; name: string; color?: string }[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, catsRes]: any = await Promise.all([
          api.getEvents(1, 100),
          api.getCategories(),
        ]);
        const apiEvents = Array.isArray(eventsRes) ? eventsRes : (eventsRes?.data || []);
        const apiCats = Array.isArray(catsRes) ? catsRes : (catsRes?.data || []);
        setEvents(apiEvents);
        setCategories([{ id: 'Todos', name: 'Todos' }, ...apiCats]);
      } catch (err) {
        console.error('Error fetching map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedEvent = events.find(e => e.id_event === selectedEventId);

  return (
    <div className="h-[calc(100vh-64px)] -mt-16 relative overflow-hidden bg-[#0b0e14]">
      {/* Search Input Injected into Header (Visual Only) */}
      <style>{`
        .navbar-glass input {
          background: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="text-primary animate-spin" />
            <p className="text-white/60 text-sm font-bold tracking-widest uppercase">Cargando eventos...</p>
          </div>
        </div>
      ) : API_KEY && API_KEY !== 'YOUR_API_KEY' ? (
        <APIProvider apiKey={API_KEY} version="weekly">
          <MapWrapper 
            userLocation={userLocation}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            activeCategory={activeCategory}
            events={events}
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
            {categories.map(cat => {
              const isActive = cat.id === 'Todos' ? activeCategory === 'Todos' : activeCategory === cat.name;
              return (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id === 'Todos' ? 'Todos' : cat.name)}
                  className={cn(
                    "flex items-center justify-between w-full px-5 py-3 rounded-2xl transition-all group",
                    isActive
                      ? "text-white shadow-lg border border-white/20" 
                      : "hover:bg-surface-variant/50 border border-transparent"
                  )}
                  style={isActive ? { backgroundColor: cat.color || '#732ee4', boxShadow: `0 4px 14px ${cat.color || '#732ee4'}40` } : {}}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: cat.color || '#732ee4' }}
                    />
                    <span className={cn(
                      "text-xs font-bold",
                      isActive ? "text-white" : "text-on-surface-variant"
                    )}>{cat.name}</span>
                  </div>
                </button>
              );
            })}
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
              {/* Left: Image Section */}
              <div className="w-1/3 relative overflow-hidden group shrink-0">
                <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={selectedEvent.thumbnail_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'} alt={selectedEvent.title} />
                <div className="absolute top-3 left-3">
                  <span
                    className="text-white text-[8px] font-black px-3 py-1 rounded-md uppercase tracking-wider"
                    style={{ backgroundColor: categories.find((c: any) => c.name === (selectedEvent.interests?.[0]?.name))?.color || '#732ee4' }}
                  >
                    {selectedEvent.interests?.[0]?.name || 'EVENTO'}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Right: Details Section */}
              <div className="flex-1 flex flex-col p-5 lg:p-6 justify-between bg-white/20">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="text-lg lg:text-xl font-display font-black italic tracking-tighter text-on-surface leading-tight uppercase line-clamp-2">{selectedEvent.title}</h2>
                    {!isNaN(Number(selectedEvent.price)) && Number(selectedEvent.price) > 0 && (
                      <span className="text-primary font-black text-xl leading-none italic shrink-0">
                        ${Number(selectedEvent.price).toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-4 items-center mt-3">
                    {selectedEvent.date && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary shrink-0" />
                        <p className="text-[10px] font-bold text-on-surface">
                          {new Date(selectedEvent.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    )}
                    {selectedEvent.ubication && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-primary shrink-0" />
                        <p className="text-[10px] font-bold text-on-surface truncate max-w-[120px]">{selectedEvent.ubication}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <button 
                    onClick={() => navigate(`/events/${selectedEvent.id_event}`)}
                    className="bg-primary text-white font-black px-6 py-2.5 rounded-xl text-[9px] tracking-[0.15em] flex items-center gap-2 hover:bg-primary-container hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 group uppercase"
                  >
                    VER DETALLES
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex gap-2">
                    <button className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-primary/10">
                      <Share2 size={14} />
                    </button>
                    <button 
                      onClick={() => setSelectedEventId(null)}
                      className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-outline-variant hover:text-red-500 hover:bg-red-50 transition-all border border-outline-variant/30"
                    >
                      <X size={14} />
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

const MapWrapper = ({ userLocation, selectedEventId, onSelectEvent, activeCategory, events }: any) => {
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

  const filteredEvents = events.filter(e => {
    if (activeCategory === 'Todos') return true;
    const catName = e.interests?.[0]?.name;
    return catName === activeCategory;
  });

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
            key={event.id_event}
            event={event}
            isSelected={selectedEventId === event.id_event}
            onSelect={() => onSelectEvent(event.id_event)}
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
  const category = event.interests?.[0]?.name;
  const categoryColor = '#732ee4'; // fallback
  const match = event.interests?.[0]?.name || 'NUEVO';

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: Number(event.latitude), lng: Number(event.longitude) }}
      onClick={onSelect}
    >
      <motion.div 
        animate={{ 
          scale: isSelected ? 1.25 : 1,
          y: isSelected ? -12 : 0
        }}
        className="relative cursor-pointer group"
      >
        {isSelected && (
          <div className="absolute inset-[-12px] bg-primary/20 animate-pulse rounded-full" />
        )}
        
        <div className={cn(
          "relative flex items-center bg-white p-1 rounded-full shadow-2xl transition-all duration-500 border-[3px]",
          isSelected 
            ? "border-primary scale-110 z-50 ring-4 ring-primary/10" 
            : "border-outline-variant/40 hover:border-primary hover:scale-110"
        )}>
          <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30">
            <img src={event.thumbnail_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'} className="w-full h-full object-cover" alt={event.title} />
          </div>
          
          <div className={cn(
            "absolute -top-3 -right-3 px-2 py-1 rounded-lg border-2 border-white shadow-lg text-[9px] font-black tracking-tighter transition-colors",
            isSelected ? "bg-primary text-white" : "bg-primary text-white"
          )}>
            {match}
          </div>

          <AnimatePresence>
            {isSelected && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="ml-3 pr-4 whitespace-nowrap"
              >
                <p className="text-[8px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1">
                  {category?.toUpperCase() || 'EVENTO'}
                </p>
                <p className="text-[11px] font-black text-on-surface leading-none uppercase tracking-tighter">
                  {event.title}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={cn(
          "w-1 h-5 mx-auto mt-1 rounded-full shadow-lg transition-colors",
          isSelected ? "bg-primary" : "bg-outline-variant/40"
        )} />
      </motion.div>
    </AdvancedMarker>
  );
};

export default MapPage;
