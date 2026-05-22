import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Filter, X, Navigation, Calendar, Plus, Minus, Target, Gamepad2, ShoppingBag, Sparkles, Tv } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const MOCK_MAP_EVENTS = [
  { id: '1', title: 'Neo Tokyo Market', lat: -34.6037, lng: -58.3816, category: 'Feria', date: '24 Oct', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=300' },
  { id: '2', title: 'Gamer Core Arena', lat: -34.5800, lng: -58.4200, category: 'Videojuegos', date: '25 Oct', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=300' },
  { id: '3', title: 'Anime Expo Retiro', lat: -34.5900, lng: -58.4000, category: 'Anime', date: '26 Oct', image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?auto=format&fit=crop&q=80&w=300' },
  { id: '4', title: 'K-Pop Night Stage', lat: -34.6100, lng: -58.3700, category: 'K-Pop', date: '27 Oct', image: 'https://images.unsplash.com/photo-1621619856624-42f1b8a4ee85?auto=format&fit=crop&q=80&w=300' },
];

const MapControls = ({ onZoomIn, onZoomOut, onRecenter }: { onZoomIn: () => void, onZoomOut: () => void, onRecenter: () => void }) => {
  return (
    <div className="absolute right-4 lg:right-8 bottom-32 lg:bottom-40 z-10 flex flex-col gap-2 pointer-events-auto">
      <button 
        onClick={onZoomIn}
        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-surface-container-low transition-all border border-black/5"
      >
        <Plus size={20} />
      </button>
      <button 
        onClick={onZoomOut}
        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-surface-container-low transition-all border border-black/5"
      >
        <Minus size={20} />
      </button>
      <button 
        onClick={onRecenter}
        className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all mt-4"
      >
        <Target size={20} />
      </button>
    </div>
  );
};

const MapPage: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
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

  if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] text-center p-6 lg:p-10 space-y-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <MapPin size={32} className="text-primary" />
        </div>
        <div className="max-w-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">Google Maps API Key Required</h2>
            <p className="text-on-surface-variant text-sm lg:text-base">
              Para ver el mapa interactivo, sigue estos pasos para configurar tu API Key correctamente:
            </p>
          </div>
          
          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant text-left space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Paso 1: Obtener Key</p>
              <p className="text-xs text-on-surface-variant font-medium">
                Crea un proyecto en <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener" className="text-primary underline">Google Cloud Console</a> y habilita la <strong>"Maps JavaScript API"</strong>.
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Paso 2: Configurar Secreto</p>
              <p className="text-xs text-on-surface-variant font-medium">
                Ve a <strong>Settings (⚙️)</strong> → <strong>Secrets</strong>, añade <code>GOOGLE_MAPS_PLATFORM_KEY</code> y pega tu llave.
              </p>
            </div>

            <div className="pt-2 border-t border-outline-variant/30">
              <p className="text-[9px] text-red-500 font-bold flex gap-2">
                ⚠️ Si ves "ApiProjectMapError", asegúrate de que la "Maps JavaScript API" esté HABILITADA en tu proyecto de Google Cloud.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedEvent = MOCK_MAP_EVENTS.find(e => e.id === selectedEventId);

  return (
    <div className="h-[calc(100vh-160px)] -mx-10 -mb-10 relative overflow-hidden bg-surface-container-highest">
      <APIProvider apiKey={API_KEY} version="weekly">
        <MapWrapper 
          userLocation={userLocation} 
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
        />
      </APIProvider>

      {/* Floating UI Overlay */}
      <div className="absolute top-4 lg:top-8 left-4 lg:left-8 right-4 lg:right-8 z-10 pointer-events-none">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-start gap-4 lg:gap-10">
          <div className="flex-1 max-w-md pointer-events-auto">
             <div className="relative group">
                <Search className="absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                   type="text" 
                   placeholder="Buscar ubicación, eventos..."
                   className="w-full h-12 lg:h-14 bg-white/95 backdrop-blur-xl rounded-[1.5rem] lg:rounded-[2rem] pl-12 lg:pl-14 pr-6 text-xs lg:text-sm shadow-2xl shadow-black/10 outline-none focus:ring-2 ring-primary/20 transition-all font-medium border border-white"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             
             <div className="mt-3 lg:mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['Todos', 'Anime', 'K-Pop', 'Gamer', 'Feria'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-5 lg:px-6 py-1.5 lg:py-2 rounded-full text-[9px] lg:text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap shadow-lg border",
                      activeCategory === cat 
                        ? "bg-primary text-white border-primary shadow-primary/30" 
                        : "bg-white text-on-surface-variant hover:bg-surface-container-low border-black/5"
                    )}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          <div className="pointer-events-auto flex lg:flex-col gap-3 lg:gap-4 justify-end lg:justify-start">
             <button className="w-10 h-10 lg:w-14 lg:h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-surface-container-low transition-all border border-black/5">
                <Filter size={20} />
             </button>
          </div>
        </div>
      </div>

      {/* Selected Event Bottom Card */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="absolute bottom-4 lg:bottom-8 left-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-max max-w-[calc(100vw-32px)] z-10 p-2.5 lg:p-3 bg-white/95 backdrop-blur-md rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] flex flex-col sm:flex-row items-center gap-4 lg:gap-6 border border-white"
          >
             <div className="w-full sm:w-24 lg:w-32 h-24 lg:h-28 rounded-[1.2rem] lg:rounded-[1.8rem] overflow-hidden bg-surface-container-low shrink-0 relative group">
                <img src={selectedEvent.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={selectedEvent.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
             </div>
             <div className="flex-1 space-y-1 lg:space-y-2 text-center sm:text-left pr-2">
                <div className="space-y-0.5 lg:space-y-1">
                   <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">{selectedEvent.category}</span>
                   </div>
                   <h3 className="text-lg lg:text-2xl font-black tracking-tight italic uppercase text-on-surface leading-none">{selectedEvent.title}</h3>
                   <div className="flex justify-center sm:justify-start gap-3 lg:gap-4 text-[9px] lg:text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                         <Calendar size={12} className="text-primary" /> {selectedEvent.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <MapPin size={12} className="text-primary" /> CABA
                      </div>
                   </div>
                </div>
             </div>
             <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => navigate(`/events/${selectedEvent.id}`)} 
                  className="flex-1 sm:flex-none btn-primary h-11 lg:h-12 px-6 lg:px-8 text-[10px] lg:text-xs font-black tracking-widest"
                >
                   ENTRAR
                </button>
                <div className="flex gap-2 shrink-0">
                  <button className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center transition-all border border-black/5">
                    <Navigation size={18} />
                  </button>
                  <button 
                    onClick={() => setSelectedEventId(null)}
                    className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-surface-container-low hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all border border-black/5"
                  >
                    <X size={18} />
                  </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MapWrapper = ({ userLocation, selectedEventId, onSelectEvent }: any) => {
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

  return (
    <>
      <Map
        defaultCenter={{ lat: -34.6037, lng: -58.3816 }}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        className="w-full h-full"
        disableDefaultUI={true}
        gestureHandling={'greedy'}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      >
        {MOCK_MAP_EVENTS.map((event) => (
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
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg relative z-10" />
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

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: event.lat, lng: event.lng }}
      onClick={onSelect}
    >
      <motion.div 
        animate={{ 
          scale: isSelected ? 1.2 : 1,
          y: isSelected ? -10 : 0
        }}
        className="relative cursor-pointer group"
      >
        {/* Animated pulse for selected */}
        {isSelected && (
          <div className="absolute inset-[-8px] bg-primary/20 animate-pulse rounded-full" />
        )}
        
        {/* Marker Body */}
        <div className={cn(
          "w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 transform",
          "border-4",
          isSelected 
            ? "bg-primary border-white scale-110 -rotate-12 rounded-[1rem]" 
            : "bg-white border-primary/10 hover:border-primary/40 hover:scale-110 rounded-2xl"
        )}>
          {event.category === 'Anime' && <Tv className={cn(isSelected ? "text-white" : "text-pink-500")} size={20} />}
          {event.category === 'Videojuegos' && <Gamepad2 className={cn(isSelected ? "text-white" : "text-blue-500")} size={20} />}
          {event.category === 'K-Pop' && <Sparkles className={cn(isSelected ? "text-white" : "text-purple-500")} size={20} />}
          {event.category === 'Feria' && <ShoppingBag className={cn(isSelected ? "text-white" : "text-orange-500")} size={20} />}
          {!['Anime', 'Videojuegos', 'K-Pop', 'Feria'].includes(event.category) && <MapPin className={cn(isSelected ? "text-white" : "text-primary")} size={18} />}
        </div>

        {/* Category Label - Desktop only */}
        <div className={cn(
          "absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/80 text-white text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap",
          isSelected && "opacity-100"
        )}>
          {event.title}
        </div>

        {/* Stem */}
        <div className={cn(
          "w-1.5 h-1.5 absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45 border-r border-b",
          isSelected ? "bg-primary border-white" : "bg-white border-primary/10"
        )} />
      </motion.div>
    </AdvancedMarker>
  );
};

export default MapPage;
