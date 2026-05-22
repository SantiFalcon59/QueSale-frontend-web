import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Calendar, MapPin, Grid as GridIcon, List, X } from 'lucide-react';
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
    { id: 'ANIME', name: 'Anime & Manga' },
    { id: 'K-POP', name: 'K-Pop' },
    { id: 'GAMING', name: 'Gaming' },
    { id: 'COSPLAY', name: 'Cosplay' },
    { id: 'FERIA', name: 'Feria & Expo' },
  ];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const result: any = await api.getEvents(1, 50);
      setEvents(result.data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, priceType, exactDate]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (event.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-10 pb-20">
      {/* Search & Filters Sidebar */}
      <AnimatePresence>
        {showFilters && (
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full lg:w-80 shrink-0"
          >
            <div className="sticky top-24 space-y-6">
              <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant space-y-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">filter_list</span>
                    <h3 className="text-lg font-display font-extrabold tracking-tight italic">Filtros</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setProximity(25);
                      setPriceType('all');
                      setExactDate('');
                    }}
                    className="label-caps text-on-surface-variant hover:text-primary transition-colors !text-[10px]"
                  >
                    BORRAR
                  </button>
                </div>

                {/* Text Search */}
                <div className="space-y-3">
                  <label className="label-caps text-on-surface-variant ml-1 !text-[10px]">Palabras clave</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar eventos..." 
                      className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-2xl pl-12 pr-4 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Proximity */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="label-caps text-on-surface-variant !text-[10px]">Proximidad</label>
                    <span className="label-caps text-primary px-2 py-1 rounded-lg bg-primary/10 !text-[10px]">{proximity}km</span>
                  </div>
                  <div className="px-1">
                    <input 
                      type="range" 
                      min="1" 
                      max="100"
                      value={proximity}
                      onChange={(e) => setProximity(parseInt(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-outline-variant/30 rounded-full appearance-none cursor-pointer" 
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <label className="label-caps text-on-surface-variant ml-1 !text-[10px]">Categoría</label>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                          selectedCategory === cat.id ? "bg-primary/5 border-primary/20 text-primary shadow-sm" : "bg-surface-container-lowest border-outline-variant hover:border-primary/30"
                        )}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">{cat.name}</span>
                        {selectedCategory === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Picker */}
                <div className="space-y-3">
                  <label className="label-caps text-on-surface-variant ml-1 !text-[10px]">Fecha Exacta</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">calendar_today</span>
                    <input 
                      type="date" 
                      value={exactDate}
                      onChange={(e) => setExactDate(e.target.value)}
                      className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-2xl pl-12 pr-4 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Price Filter */}
                <div className="space-y-3">
                  <label className="label-caps text-on-surface-variant ml-1 !text-[10px]">Inversión / Precio</label>
                  <div className="flex bg-surface-container rounded-2xl p-1 border border-outline-variant">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'free', label: 'Gratis' },
                      { id: 'paid', label: 'Pagos' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setPriceType(p.id as any)}
                        className={cn(
                          "flex-1 h-10 rounded-xl label-caps transition-all !text-[9px]",
                          priceType === p.id ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Results Main Area */}
      <div className="flex-1 space-y-8 lg:space-y-10 min-w-0">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full" />
              <div>
                <p className="label-caps text-primary tracking-[0.3em] !text-[10px]">Explorador de Vibras</p>
                <h1 className="text-4xl lg:text-5xl font-display font-extrabold italic tracking-tight uppercase leading-none">Resultados</h1>
              </div>
            </div>
          </div>
          <div className="flex gap-4 self-end sm:self-auto items-center">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 h-12 px-5 rounded-2xl transition-all border label-caps !text-[10px]", 
                showFilters ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-primary"
              )}
            >
              <SlidersHorizontal size={16} />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            <div className="h-12 bg-surface-container-lowest rounded-2xl p-1 flex gap-1 border border-outline-variant shadow-sm">
              <button 
                onClick={() => setView('grid')}
                className={cn("w-10 h-10 flex items-center justify-center rounded-xl transition-all", view === 'grid' ? "bg-primary text-on-primary shadow-md shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-low")}
              >
                <GridIcon size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={cn("w-10 h-10 flex items-center justify-center rounded-xl transition-all", view === 'list' ? "bg-primary text-on-primary shadow-md shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-low")}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-[450px] rounded-[2.5rem] bg-surface-container-low animate-pulse border border-outline-variant/30" />
             ))}
          </div>
        ) : (
          <div className={cn(
            "grid gap-8 transition-all duration-500",
            view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredEvents.length > 0 ? filteredEvents.map((event) => (
              <Link
                to={`/events/${event.id_event}`}
                key={event.id_event}
                className={cn(
                  "group relative rounded-3xl overflow-hidden border border-outline-variant bg-surface-container-lowest transition-all cursor-pointer block hover:shadow-xl hover:translate-y-[-4px]",
                  view === 'grid' ? "h-[450px]" : "h-48 flex"
                )}
              >
                <div className={cn(
                  "relative overflow-hidden",
                  view === 'grid' ? "h-64" : "w-64 h-full shrink-0"
                )}>
                  <img 
                    src={event.thumbnail_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'} 
                    alt={event.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                  
                  <div className="absolute top-6 left-6 flex gap-2">
                     {event.featured_level > 0 && (
                       <div className="px-3 py-1 rounded-lg bg-primary text-on-primary text-[9px] font-bold tracking-widest uppercase shadow-lg shadow-primary/20">
                         DESTACADO
                       </div>
                     )}
                  </div>
                </div>

                <div className={cn(
                  "p-8 flex flex-col justify-between flex-1",
                  view === 'list' && "py-6"
                )}>
                   <div className="space-y-2">
                      <p className="label-caps text-primary !text-[10px]">EVENTO</p>
                      <h3 className={cn(
                        "font-display font-extrabold text-on-surface group-hover:text-primary transition-colors leading-tight",
                        view === 'grid' ? "text-2xl line-clamp-2" : "text-3xl"
                      )}>{event.title}</h3>
                   </div>
                   
                   <div className="flex items-center justify-between pt-6 border-t border-outline-variant/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                           <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
                           {format(new Date(event.date), "d MMM", { locale: es })}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant max-w-[100px] truncate">
                           <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                           {event.ubication}
                        </div>
                      </div>
                      <div className="label-caps text-primary !text-[11px]">
                         {Number(event.price) === 0 || !event.price ? 'GRATIS' : `$${Number(event.price).toLocaleString('es-AR')}`}
                      </div>
                   </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full py-32 text-center space-y-8 bg-surface-container-low rounded-[3rem] border border-dashed border-outline-variant">
                 <div className="w-24 h-24 rounded-3xl bg-surface-container-lowest shadow-xl flex items-center justify-center mx-auto transform -rotate-6">
                   <X size={40} className="text-primary opacity-40" />
                 </div>
                 <div className="space-y-3">
                   <h3 className="text-3xl font-display font-extrabold italic tracking-tight uppercase">Sin resultados</h3>
                   <p className="text-on-surface-variant max-w-sm mx-auto font-medium leading-relaxed">No encontramos eventos que coincidan con tu búsqueda actual. ¡Intenta ajustar los filtros!</p>
                 </div>
                 <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }} 
                  className="bg-primary text-on-primary font-display font-bold h-12 px-8 rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                 >
                   Reiniciar Exploración
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery;
