import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Plus, Minus, Target, ChevronRight, X, Share2, Loader2, CalendarDays, Heart } from 'lucide-react';
import { cn, formatPrice, NO_EVENT_IMAGE } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
import { AdBanner } from '../components/ui/AdBanner';
import { useAuth } from '../context/AuthContext';

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

const QUICK_FILTERS = [
  { id: 'today', label: 'Hoy' },
  { id: 'tomorrow', label: 'Mañana' },
  { id: 'weekend', label: 'Fin de Semana' },
  { id: 'next-week', label: 'Próxima Semana' },
  { id: 'next-month', label: 'Próximo Mes' },
];

const getQuickDateRange = (id: string): { from: Date; to: Date } | null => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (id) {
    case 'today': return { from: start, to: new Date(start.getTime() + 86400000) };
    case 'tomorrow': return { from: new Date(start.getTime() + 86400000), to: new Date(start.getTime() + 2 * 86400000) };
    case 'weekend': {
      const day = start.getDay();
      const sat = new Date(start.getTime() + (day <= 6 ? (6 - day) : 6) * 86400000);
      return { from: sat, to: new Date(sat.getTime() + 2 * 86400000) };
    }
    case 'next-week': return { from: new Date(start.getTime() + 7 * 86400000), to: new Date(start.getTime() + 14 * 86400000) };
    case 'next-month': return { from: new Date(start.getTime() + 30 * 86400000), to: new Date(start.getTime() + 60 * 86400000) };
    default: return null;
  }
};

const MapPage: React.FC = () => {
  const { user, profile, savedEvents, toggleSaveEvent } = useAuth() as any;
  const isPremium = profile?.is_premium || profile?.role === 'admin';
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [proximity, setProximity] = useState(25);
  const [selectedDate, setSelectedDate] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFilters, setShowFilters] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [categories, setCategories] = useState<{ id: number | string; name: string; color?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

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
        
        const apiEvents = eventsRes?.events || eventsRes?.data || eventsRes || [];
        const apiCats = Array.isArray(catsRes) ? catsRes : (catsRes?.data || []);
        
        setEvents(apiEvents);
        setTotalMatches(eventsRes?.total || apiEvents.length);
        setTotalActive(eventsRes?.totalActive || eventsRes?.total || apiEvents.length);
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
    <div className="h-[calc(100vh-128px)] lg:h-screen lg:-mt-16 relative overflow-hidden bg-[#0b0e14]">
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
            proximity={proximity}
            selectedDate={selectedDate}
            activeQuickFilter={activeQuickFilter}
            selectedTags={selectedTags}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
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

      {/* Floating Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, x: -320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="absolute top-24 left-4 lg:left-8 w-72 flex flex-col gap-3 z-30 pointer-events-none"
          >
        {/* Stats Notice */}
        <div className="bg-black/80 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-1 pointer-events-auto">
           <div className="flex items-center justify-between gap-2">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] text-white font-black uppercase tracking-widest">{events.length} Eventos mostrados</span>
             </div>
             <button onClick={() => setShowFilters(false)} className="p-1 text-white/50 hover:text-white transition-colors">
               <X size={14} />
             </button>
           </div>
           <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.1em]">De un total de {totalActive} activos</p>
        </div>

        <div className="bg-white/90 backdrop-blur-2xl p-5 lg:p-6 rounded-[2rem] shadow-2xl border border-white/50 ring-1 ring-primary/10 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black text-on-surface uppercase tracking-[0.15em] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">tune</span>
              Filtros
            </h3>
            {activeCategory !== 'Todos' || selectedDate || activeQuickFilter || selectedTags.length > 0 || proximity < 100 ? (
              <button onClick={() => { setActiveCategory('Todos'); setSelectedDate(''); setActiveQuickFilter(null); setSelectedTags([]); setProximity(25); }}
                className="text-[9px] font-bold text-primary/60 hover:text-primary uppercase tracking-widest transition-colors">
                Limpiar
              </button>
            ) : null}
          </div>
          
          {/* Categories — chip-style */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.slice(0, 6).map(cat => {
              const isActive = cat.id === 'Todos' ? activeCategory === 'Todos' : activeCategory === cat.name;
              return (
                <button key={cat.id}
                  onClick={() => setActiveCategory(cat.id === 'Todos' ? 'Todos' : cat.name)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    isActive
                      ? "text-white border-transparent shadow-md"
                      : "bg-white/60 text-on-surface-variant border-outline-variant/30 hover:border-primary/40 hover:text-primary"
                  )}
                  style={isActive ? { backgroundColor: cat.color || '#732ee4' } : {}}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Quick Date Filters */}
          <div className="space-y-2 mb-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
              <CalendarDays size={12} /> Fecha rápida
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FILTERS.map(qf => (
                <button
                  key={qf.id}
                  onClick={() => { setActiveQuickFilter(activeQuickFilter === qf.id ? null : qf.id); setSelectedDate(''); }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                    activeQuickFilter === qf.id
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  {qf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {events.length > 0 && (
            <div className="space-y-2 mb-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1"># Tags</label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {[...new Set(events.flatMap((e: any) => e.tags || []))].slice(0, 15).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all",
                      selectedTags.includes(tag)
                        ? "bg-primary text-white"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ad Slot in Map Filters — hidden for premium users */}
          {!isPremium && (
            <div className="pt-4 mt-4 border-t border-outline-variant/20">
              <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/40 text-center mb-2">Publicidad</p>
              <div className="rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/10 min-h-[100px] flex items-center justify-center">
                <AdBanner 
                  client="ca-pub-YOUR_ADSENSE_CLIENT_ID" 
                  slot="YOUR_MAP_AD_SLOT" 
                  format="fluid" 
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Advanced Filters Toggle */}
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl hover:bg-surface-variant/30 transition-colors text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm transition-transform" style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
            Avanzados
          </button>

          {/* Collapsible Advanced Section */}
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="space-y-5 pt-4 border-t border-outline-variant/20 overflow-hidden">
              {/* Proximity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-outline uppercase tracking-widest">Proximidad</span>
                  <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{proximity}km</span>
                </div>
                <input className="w-full h-2 bg-surface-variant/50 rounded-full appearance-none cursor-pointer accent-primary"
                  max="100" min="1" type="range" value={proximity}
                  onChange={(e) => setProximity(parseInt(e.target.value))} />
              </div>
              {/* Date */}
              <div>
                <span className="text-[10px] font-black text-outline uppercase tracking-widest mb-2 block">Fecha</span>
                <input type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-surface-variant/20 rounded-xl px-4 py-2.5 border border-outline-variant/20 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </motion.div>
          )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* FAB to show filters when hidden */}
      {!showFilters && (
        <button
          onClick={() => setShowFilters(true)}
          className="absolute bottom-24 left-4 lg:bottom-10 lg:left-8 z-30 w-12 h-12 rounded-2xl bg-primary text-white shadow-xl hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center border border-white/20"
        >
          <span className="material-symbols-outlined text-[22px]">tune</span>
        </button>
      )}

      {/* Selected Event Bottom Card */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: 50, x: "-50%", scale: 0.95 }}
            className="absolute bottom-6 left-1/2 w-[90%] max-w-2xl z-50 pointer-events-auto"
          >
            <div className="bg-white/90 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 flex h-36 sm:h-40 ring-1 ring-primary/5">
              {/* Left: Image Section */}
              <div className="w-[100px] sm:w-1/3 relative overflow-hidden group shrink-0">
                <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={selectedEvent.images?.[0] || selectedEvent.thumbnail_url || NO_EVENT_IMAGE} alt={selectedEvent.title} />
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                  <span
                    className="text-white text-[7px] sm:text-[8px] font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-md uppercase tracking-wider"
                    style={{ backgroundColor: categories.find((c: any) => c.name === (selectedEvent.interests?.[0]?.name))?.color || '#732ee4' }}
                  >
                    {selectedEvent.interests?.[0]?.name || 'EVENTO'}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Right: Details Section */}
              <div className="flex-1 flex flex-col p-3.5 sm:p-5 lg:p-6 justify-between bg-white/20 min-w-0">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="text-sm sm:text-lg lg:text-xl font-display font-black italic tracking-tighter text-on-surface leading-tight uppercase line-clamp-2 truncate-2-lines">{selectedEvent.title}</h2>
                    {!isNaN(Number(selectedEvent.price)) && Number(selectedEvent.price) > 0 && (
                      <span className="text-primary font-black text-base sm:text-xl leading-none italic shrink-0">
                        {formatPrice(selectedEvent.price)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-3 sm:gap-4 items-center mt-2">
                    {selectedEvent.date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-primary shrink-0" />
                        <p className="text-[9px] sm:text-[10px] font-bold text-on-surface">
                          {new Date(selectedEvent.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    )}
                    {selectedEvent.ubication && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin size={12} className="text-primary shrink-0" />
                        <p className="text-[9px] sm:text-[10px] font-bold text-on-surface truncate">{selectedEvent.ubication}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto gap-2">
                  <button 
                    onClick={() => navigate(`/events/${selectedEvent.id_event}`)}
                    className="bg-primary text-white font-black px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-[8px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.15em] flex items-center gap-1.5 sm:gap-2 hover:bg-primary-container hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 group uppercase shrink-0"
                  >
                    VER DETALLES
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex gap-1.5">
                    {user && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSaveEvent(selectedEvent.id_event);
                        }}
                        className={cn(
                          "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all border shrink-0 cursor-pointer",
                          savedEvents[selectedEvent.id_event] 
                            ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" 
                            : "bg-surface-container-low text-primary border-primary/10 hover:bg-primary hover:text-white"
                        )}
                      >
                        <Heart size={12} fill={savedEvents[selectedEvent.id_event] ? "currentColor" : "none"} />
                      </button>
                    )}
                    <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-primary/10 shrink-0">
                      <Share2 size={12} />
                    </button>
                    <button 
                      onClick={() => setSelectedEventId(null)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-outline-variant hover:text-red-500 hover:bg-red-50 transition-all border border-outline-variant/30 shrink-0"
                    >
                      <X size={12} />
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

const MapWrapper = ({ userLocation, selectedEventId, onSelectEvent, activeCategory, events, proximity, selectedDate, activeQuickFilter, selectedTags, showFilters, setShowFilters }: any) => {
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

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredEvents = events.filter(e => {
    if (activeCategory !== 'Todos') {
      const catName = e.interests?.[0]?.name;
      if (catName !== activeCategory) return false;
    }

    if (activeQuickFilter) {
      const range = getQuickDateRange(activeQuickFilter);
      if (range) {
        const eventDate = new Date(e.date);
        if (eventDate < range.from || eventDate >= range.to) return false;
      }
    } else if (selectedDate) {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      if (eventDate < filterDate) return false;
    }

    if (selectedTags.length > 0) {
      const eventTags = (e.tags || []).map((t: string) => t.toLowerCase());
      if (!selectedTags.some(t => eventTags.includes(t.toLowerCase()))) return false;
    }

    if (userLocation && proximity < 100) {
      const dist = haversine(userLocation.lat, userLocation.lng, Number(e.latitude), Number(e.longitude));
      if (dist > proximity) return false;
    }
    return true;
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
          "relative flex items-center bg-white p-1 rounded-full shadow-2xl transition-colors duration-200 border-[3px]",
          isSelected 
            ? "border-primary scale-110 z-50 ring-4 ring-primary/10" 
            : "border-outline-variant/40 hover:border-primary hover:scale-110"
        )}>
          <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/30">
            <img src={event.images?.[0] || event.thumbnail_url || NO_EVENT_IMAGE} className="w-full h-full object-cover" alt={event.title} />
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
                className="ml-3 pr-4 whitespace-nowrap hidden md:block"
              >
                <p className="text-[8px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1">
                  {category?.toUpperCase() || event.tags?.[0]?.toUpperCase() || 'EVENTO'}
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
