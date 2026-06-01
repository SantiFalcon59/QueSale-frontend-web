import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, Grid as GridIcon, List, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/apiClient';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Discovery: React.FC = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [proximity, setProximity] = useState(25);
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [exactDate, setExactDate] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'ALL', name: 'Todos' },
    { id: 'ANIME', name: 'Anime' },
    { id: 'K-POP', name: 'K-Pop' },
    { id: 'GAMING', name: 'Gaming' },
    { id: 'COSPLAY', name: 'Cosplay' },
    { id: 'TCG', name: 'TCG' },
    { id: 'ROL', name: 'Rol' },
  ];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const result: any = await api.getEvents(1, 50);
      const apiEvents = result.data || [];
      setEvents(apiEvents.map((e: any) => ({
        id_event: e.id_event || e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        ubication: e.ubication || e.location,
        organizer: e.organizer,
        thumbnail_url: e.thumbnail_url || e.image,
        category: e.category,
        price: e.price,
        match: e.match || '90%',
        live: e.live || false
      })));
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (event.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = priceType === 'all' || 
                         (priceType === 'free' && (Number(event.price) === 0 || !event.price)) ||
                         (priceType === 'paid' && Number(event.price) > 0);

    const matchesCategory = selectedCategory === 'ALL' || event.category?.toUpperCase() === selectedCategory;

    return matchesSearch && matchesPrice && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <main className="max-w-[1600px] mx-auto pt-8 pb-20 px-6 lg:px-10 grid grid-cols-12 gap-8">
        
        {/* Filter Sidebar */}
        <aside className={cn(
          "col-span-12 lg:col-span-3 space-y-6 transition-all",
          !showFilters && "lg:hidden"
        )}>
          <div className="bg-white/70 backdrop-blur-xl border border-outline-variant/50 p-6 rounded-3xl shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-display font-black italic text-primary flex items-center gap-2 uppercase tracking-tighter">
                <span className="material-symbols-outlined">tune</span> Filtros
              </h3>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setProximity(25);
                  setPriceType('all');
                  setExactDate('');
                }}
                className="text-xs font-bold text-on-surface-variant hover:text-primary underline uppercase tracking-widest transition-colors"
              >
                Limpiar
              </button>
            </div>

            {/* Keyword Search */}
            <div className="mb-8 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Palabras Clave</label>
              <div className="bg-surface-container-low rounded-2xl p-1 border border-outline-variant focus-within:border-primary transition-all group">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
                  <input 
                    className="bg-transparent border-none w-full focus:ring-0 text-sm font-semibold p-3 pl-10 placeholder:text-on-surface-variant/50" 
                    placeholder="Ej: Torneo Smash" 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Proximity Slider */}
            <div className="mb-8 space-y-4">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Proximidad</label>
                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{proximity} km</span>
              </div>
              <div className="px-1">
                <input 
                  className="w-full h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary" 
                  max="100" 
                  min="1" 
                  type="range" 
                  value={proximity}
                  onChange={(e) => setProximity(parseInt(e.target.value))}
                />
                <div className="flex justify-between mt-2 text-[9px] text-on-surface-variant font-black uppercase tracking-widest">
                  <span>1km</span>
                  <span>100km</span>
                </div>
              </div>
            </div>

            {/* Categories Chips */}
            <div className="mb-8 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Categorías</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      selectedCategory === cat.id 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                        : "bg-surface-container-highest text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection (Simplified Calendar for now) */}
            <div className="mb-8 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Fecha del Evento</label>
              <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-primary uppercase tracking-widest">{format(new Date(), 'MMMM yyyy', { locale: es })}</span>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-white rounded-lg transition-colors"><ChevronLeft size={16} className="text-primary" /></button>
                    <button className="p-1 hover:bg-white rounded-lg transition-colors"><ChevronRight size={16} className="text-primary" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <span key={d} className="text-[9px] font-black text-on-surface-variant/40">{d}</span>
                  ))}
                  {Array.from({ length: 31 }, (_, i) => i + 1).slice(0, 14).map(day => (
                    <div 
                      key={day} 
                      className={cn(
                        "py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all",
                        day === new Date().getDate() ? "bg-primary text-white shadow-md shadow-primary/20" : "hover:bg-white text-on-surface"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Segmented Control */}
            <div className="mb-8 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Inversión</label>
              <div className="flex p-1 bg-surface-container-low rounded-2xl border border-outline-variant">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'free', label: 'Gratis' },
                  { id: 'paid', label: 'Pagos' }
                ].map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setPriceType(p.id as any)}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      priceType === p.id ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-primary"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tip of the Day */}
            <div className="p-5 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/10 relative overflow-hidden group">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-primary opacity-5 text-[100px] transition-transform group-hover:scale-110 group-hover:rotate-12 duration-700">lightbulb</span>
              <h4 className="text-[10px] font-black text-primary mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Tip de Usuario
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed relative z-10 font-medium italic">
                "Revisa el mapa para encontrar eventos cerca de tu ubicación actual."
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className={cn(
          "col-span-12 transition-all duration-500",
          showFilters ? "lg:col-span-9" : "lg:col-span-12"
        )}>
          {/* Section Header */}
          <div className="flex flex-col gap-6 mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(115,46,228,0.4)]" />
                  <h2 className="text-4xl lg:text-5xl font-display font-black italic tracking-tighter uppercase text-on-surface">
                    RESULTADOS <span className="text-primary">/ EXPLORAR</span>
                  </h2>
                </div>
                <p className="text-sm font-bold text-on-surface-variant ml-4 uppercase tracking-widest opacity-60">
                  {filteredEvents.length} eventos encontrados
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 h-12 px-6 rounded-2xl transition-all border text-[10px] font-black uppercase tracking-widest",
                    showFilters ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-on-surface-variant border-outline-variant hover:border-primary"
                  )}
                >
                  <SlidersHorizontal size={16} />
                  {showFilters ? 'Ocultar Filtros' : 'Filtros'}
                </button>
                <div className="h-12 bg-surface-container-low rounded-2xl p-1 flex gap-1 border border-outline-variant shadow-sm">
                  <button 
                    onClick={() => setView('grid')}
                    className={cn("w-10 h-10 flex items-center justify-center rounded-xl transition-all", view === 'grid' ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:bg-white/50")}
                  >
                    <GridIcon size={18} />
                  </button>
                  <button 
                    onClick={() => setView('list')}
                    className={cn("w-10 h-10 flex items-center justify-center rounded-xl transition-all", view === 'list' ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:bg-white/50")}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Filters Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {['Todo hoy', 'Mañana', 'Entrada Gratis', 'Más cercanos', 'Favoritos'].map(filter => (
                <button 
                  key={filter}
                  className="px-6 py-2.5 bg-white border border-outline-variant rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-surface-container-low animate-pulse border border-outline-variant/30" />
              ))}
            </div>
          ) : (
            <div className={cn(
              "grid gap-8 transition-all duration-500",
              view === 'grid' 
                ? (showFilters ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4") 
                : "grid-cols-1"
            )}>
              {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                <article 
                  key={event.id_event}
                  className={cn(
                    "group bg-white rounded-[2.5rem] overflow-hidden border border-outline-variant/50 flex flex-col transition-all duration-500 hover:translate-y-[-8px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]",
                    view === 'list' && "md:flex-row h-auto md:h-64"
                  )}
                >
                  <Link to={`/events/${event.id_event}`} className={cn(
                    "relative overflow-hidden",
                    view === 'grid' ? "aspect-[4/3]" : "aspect-[16/9] md:w-80 md:h-full shrink-0"
                  )}>
                    <img 
                      src={event.thumbnail_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'} 
                      alt={event.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-primary text-white text-[9px] font-black tracking-widest uppercase shadow-lg shadow-primary/20 backdrop-blur-md">
                        {event.match || '95%'} Match
                      </div>
                      {event.live && (
                        <div className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 animate-pulse shadow-lg shadow-red-500/20">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span> VIVO
                        </div>
                      )}
                    </div>

                    <button className="absolute bottom-4 right-4 w-11 h-11 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-primary shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hover:bg-primary hover:text-white">
                      <span className="material-symbols-outlined text-[24px]">calendar_add_on</span>
                    </button>
                  </Link>

                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">{event.category || 'EVENTO'}</span>
                      <span className="text-xs font-black text-on-surface-variant/60 uppercase tracking-widest">
                        {Number(event.price) === 0 || !event.price ? 'Gratis' : `$${Number(event.price).toLocaleString('es-AR')}`}
                      </span>
                    </div>
                    <Link to={`/events/${event.id_event}`}>
                      <h3 className="text-xl font-display font-extrabold text-on-surface leading-tight mb-6 group-hover:text-primary transition-colors line-clamp-2 uppercase italic tracking-tighter">
                        {event.title}
                      </h3>
                    </Link>
                    <div className="mt-auto pt-6 border-t border-outline-variant/30 space-y-3">
                      <div className="flex items-center gap-3 text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary text-[18px]">event</span>
                        <span className="text-xs font-bold tracking-wide uppercase opacity-80">
                          {format(new Date(event.date), "d MMM • HH:mm", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                        <span className="text-xs font-bold tracking-wide uppercase opacity-80 truncate">
                          {event.ubication || event.location || 'Consultar ubicación'}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="col-span-full py-32 text-center space-y-8 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-outline-variant/50">
                   <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center mx-auto transform -rotate-6 border border-outline-variant/30">
                     <X size={40} className="text-primary/40" />
                   </div>
                   <div className="space-y-3 px-6">
                     <h3 className="text-3xl font-display font-black italic tracking-tighter uppercase text-on-surface">Sin resultados</h3>
                     <p className="text-on-surface-variant max-w-sm mx-auto font-medium leading-relaxed opacity-70">No encontramos eventos que coincidan con tu búsqueda actual. ¡Intenta ajustar los filtros!</p>
                   </div>
                   <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setPriceType('all'); }} 
                    className="bg-primary text-white font-display font-black h-14 px-10 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                   >
                     Reiniciar Exploración
                   </button>
                </div>
              )}
            </div>
          )}

          {/* Expanding Horizons Section */}
          {!loading && filteredEvents.length > 0 && (
            <div className="mt-20 pt-20 border-t border-outline-variant/30">
              <div className="flex items-center gap-4 mb-10">
                <span className="material-symbols-outlined text-primary text-[40px] shadow-sm">hub</span>
                <h2 className="text-3xl font-display font-black italic tracking-tighter uppercase text-on-surface">Ampliando tu horizonte</h2>
              </div>
              <p className="text-base text-on-surface-variant mb-8 max-w-2xl font-medium leading-relaxed opacity-70">
                ¿Buscas algo diferente? Explora estas categorías populares en la comunidad:
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: 'book', label: 'Manga Seinen' },
                  { icon: 'joystick', label: 'Retro Gaming' },
                  { icon: 'casino', label: 'D&D Campañas' },
                  { icon: 'robot', label: 'Robótica DIY' },
                  { icon: 'palette', label: 'Fan Art Digital' }
                ].map(item => (
                  <button key={item.label} className="px-8 py-3 bg-white border border-outline-variant/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary hover:shadow-lg hover:translate-y-[-2px] transition-all flex items-center gap-2 group shadow-sm">
                    <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Discovery;
