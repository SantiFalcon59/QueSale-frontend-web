import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, Grid as GridIcon, List, X, Search, MapPin, CalendarDays, Sparkles, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatPrice, NO_EVENT_IMAGE } from '../lib/utils';
import { api, resolveAssetUrl } from '../services/apiClient';
import { Link } from 'react-router-dom';
import { AdBanner } from '../components/ui/AdBanner';
import { useAuth } from '../context/AuthContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const QUICK_FILTERS = [
  { id: 'today', label: 'Hoy' },
  { id: 'tomorrow', label: 'Mañana' },
  { id: 'weekend', label: 'Fin de Semana' },
  { id: 'next-week', label: 'Próxima Semana' },
  { id: 'next-month', label: 'Próximo Mes' },
];

const ITEMS_PER_PAGE = 50;

const CalendarPicker: React.FC<{ selectedDate: Date | null; onSelect: (date: Date | null) => void }> = ({ selectedDate, onSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="bg-surface-container-low rounded-2xl p-3 border border-outline-variant select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronLeft size={16} className="text-primary" />
        </button>
        <span className="text-xs font-black text-primary uppercase tracking-widest">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronRight size={16} className="text-primary" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {weekDays.map(d => (
          <span key={d} className="text-[9px] font-black text-on-surface-variant/40 py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (!inMonth) return;
                if (isSelected) {
                  onSelect(null);
                } else {
                  onSelect(day);
                }
              }}
              className={cn(
                "py-1.5 text-[10px] font-bold rounded-lg transition-all",
                !inMonth ? "text-transparent pointer-events-none" :
                isSelected ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" :
                isToday ? "bg-primary/10 text-primary" :
                "hover:bg-white text-on-surface"
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Discovery: React.FC = () => {
  const { profile } = useAuth() as any;
  const isPremium = profile?.is_premium || profile?.role === 'admin';
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(50000);
  const [priceFilterVersion, setPriceFilterVersion] = useState(0);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; color?: string; icon_url?: string; events_count?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', String(ITEMS_PER_PAGE));

    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
    if (priceType !== 'all') params.set('price', priceType);
    if (priceType === 'paid') {
      params.set('priceMin', String(priceMin));
      params.set('priceMax', String(priceMax));
    }
    if (activeQuickFilter) params.set('quickDate', activeQuickFilter);
    if (selectedDate) {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      params.set('dateFrom', start.toISOString());
      params.set('dateTo', end.toISOString());
    }
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));

    return params.toString();
  }, [searchQuery, selectedCategory, priceType, priceMin, priceMax, priceFilterVersion, activeQuickFilter, selectedDate, selectedTags]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result: any = await api.getEventsWithFilters(buildQueryString());
      const apiEvents = Array.isArray(result) ? result : (result?.data || []);
      setEvents(apiEvents.map((e: any) => ({
        id_event: e.id_event || e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        ubication: e.ubication || e.location,
        thumbnail_url: e.thumbnail_url || e.images?.[0] || e.image,
        category: e.interests?.[0]?.name || e.category,
        price: e.price,
        tags: e.tags || [],
        ticket_type: e.ticket_type || 'free',
      })));
      setTotal(Array.isArray(result) ? result.length : (result?.pagination?.total || 0));
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  const fetchCategories = async () => {
    try {
      const data: any = await api.getCategories();
      const cats = data?.data || data || [];
      setCategories(cats);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleQuickFilter = (id: string) => {
    setActiveQuickFilter(activeQuickFilter === id ? null : id);
    setSelectedDate(null);
  };

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    setActiveQuickFilter(null);
  };

  useEffect(() => {
    if (tagInput.trim().length < 1) { setTagSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.searchTags(tagInput.trim());
        setTagSuggestions(Array.isArray(res) ? res : []);
      } catch { setTagSuggestions([]); }
    }, 200);
    return () => clearTimeout(t);
  }, [tagInput]);

  const addTag = (tag: string) => {
    const t = tag.toLowerCase().replace(/[^a-z0-9áéíóúüñ\-_]/g, '');
    if (t && !selectedTags.includes(t)) setSelectedTags(prev => [...prev, t]);
    setTagInput('');
    setTagSuggestions([]);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setPriceType('all');
    setPriceMin(0);
    setPriceMax(50000);
    setPriceFilterVersion(v => v + 1);
    setActiveQuickFilter(null);
    setSelectedDate(null);
    setSelectedTags([]);
    setTagInput('');
    setTagSuggestions([]);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'ALL' || priceType !== 'all' || activeQuickFilter || selectedDate || selectedTags.length > 0 || priceMin > 0 || priceMax < 50000;

  const safeDate = (d: string) => { const parsed = new Date(d); return isNaN(parsed.getTime()) ? new Date() : parsed; };
  const isFree = (p: any) => Number(p) === 0 || !p;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <main className="max-w-[1600px] mx-auto pt-8 pb-20 px-6 lg:px-10 grid grid-cols-12 gap-8">

        {/* Filter Sidebar */}
        <aside className={cn(
          "col-span-12 lg:col-span-3 space-y-6 transition-all",
          showFilters ? "" : "hidden lg:block"
        )}>
          <div className="bg-white/70 backdrop-blur-xl border border-outline-variant/50 p-4 sm:p-6 rounded-3xl shadow-sm sticky top-24 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black italic text-primary flex items-center gap-2 uppercase tracking-tighter">
                <Sparkles size={18} /> Filtros
              </h3>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button onClick={handleReset} className="text-[10px] font-bold text-primary underline uppercase tracking-widest transition-colors flex items-center gap-1">
                    <RotateCcw size={12} /> Limpiar
                  </button>
                )}
                <button 
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden p-1.5 hover:bg-surface-container-high rounded-xl text-on-surface-variant hover:text-red-500 transition-all cursor-pointer"
                  title="Ocultar Filtros"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Keyword Search */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Buscar</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="w-full bg-surface-container-low border border-outline-variant rounded-2xl py-2 sm:py-3 pl-10 pr-4 text-sm font-semibold focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50"
                  placeholder="Ej: Torneo Smash"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Categorías</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={cn(
                    "px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                    selectedCategory === 'ALL'
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={cn(
                      "px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                      selectedCategory === cat.name
                        ? "text-white shadow-lg"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                    )}
                    style={selectedCategory === cat.name ? { backgroundColor: cat.color || '#732ee4', boxShadow: `0 4px 14px ${cat.color || '#732ee4'}40` } : {}}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: cat.color || '#732ee4' }}
                    />
                    {cat.name}
                    {cat.events_count != null && <span className="ml-0.5 opacity-60">({cat.events_count})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Date Filters */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1.5">
                <CalendarDays size={14} /> Fecha
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_FILTERS.map(qf => (
                  <button
                    key={qf.id}
                    onClick={() => handleQuickFilter(qf.id)}
                    className={cn(
                      "px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
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

            {/* Calendar */}
            <div className="space-y-2 border-t border-outline-variant/20 pt-4">
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Calendario</span>
                <span className="text-xs">{showCalendar ? '▼' : '▶'}</span>
              </button>
              {showCalendar && (
                <div className="space-y-2 pt-2">
                  <CalendarPicker selectedDate={selectedDate} onSelect={handleDateSelect} />
                  {selectedDate && (
                    <p className="text-[10px] text-primary font-bold text-center">
                      {format(selectedDate, "d 'de' MMMM", { locale: es })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2 border-t border-outline-variant/20 pt-4">
              <button
                type="button"
                onClick={() => setShowTags(!showTags)}
                className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5"># Tags</span>
                <span className="text-xs">{showTags ? '▼' : '▶'}</span>
              </button>
              {showTags && (
                <div className="space-y-2 pt-2">
                  <div className="relative">
                     <input
                       value={tagInput}
                       onChange={e => setTagInput(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                       placeholder="Escribí un tag y presioná Enter..."
                       className="w-full h-10 px-4 rounded-xl bg-surface-container-low text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-primary/40 transition-all"
                     />
                     {tagSuggestions.length > 0 && (
                       <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white border border-outline-variant shadow-xl z-20 max-h-48 overflow-y-auto">
                         {tagSuggestions.map(tag => (
                           <button
                             key={tag}
                             onClick={() => addTag(tag)}
                             className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer"
                           >
                             <span className="text-primary font-bold">#</span>{tag}
                           </button>
                         ))}
                       </div>
                     )}
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedTags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20"
                        >
                          #{tag}
                          <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-white/70 transition-colors cursor-pointer">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2 border-t border-outline-variant/20 pt-4">
              <button
                type="button"
                onClick={() => setShowPrice(!showPrice)}
                className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">Precio</span>
                <span className="text-xs">{showPrice ? '▼' : '▶'}</span>
              </button>
              {showPrice && (
                <div className="space-y-4 pt-2">
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

                  {/* Price Range Sliders (only when paid) */}
                  {priceType === 'paid' && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Rango</label>
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                          ${priceMin.toLocaleString('es-AR')} - ${priceMax.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Mínimo</label>
                          <input
                            type="range"
                            min="0"
                            max="50000"
                            step="500"
                            value={priceMin}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val <= priceMax) setPriceMin(val);
                            }}
                            onMouseUp={() => setPriceFilterVersion(v => v + 1)}
                            onTouchEnd={() => setPriceFilterVersion(v => v + 1)}
                            className="w-full h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Máximo</label>
                          <input
                            type="range"
                            min="0"
                            max="50000"
                            step="500"
                            value={priceMax}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val >= priceMin) setPriceMax(val);
                            }}
                            onMouseUp={() => setPriceFilterVersion(v => v + 1)}
                            onTouchEnd={() => setPriceFilterVersion(v => v + 1)}
                            className="w-full h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-[9px] text-on-surface-variant font-black uppercase tracking-widest">
                        <span>$0</span>
                        <span>$50k</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ad Slot in Discovery Sidebar — hidden for premium users */}
            {!isPremium && (
              <div className="pt-6 mt-6 border-t border-outline-variant/30">
                <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/40 text-center mb-2">Publicidad</p>
                <div className="rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/10 min-h-[250px] flex items-center justify-center">
                  <AdBanner 
                    client="ca-pub-YOUR_ADSENSE_CLIENT_ID" 
                    slot="YOUR_DISCOVERY_SIDEBAR_AD_SLOT" 
                    format="rectangle" 
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <section className={cn(
          "col-span-12 transition-all duration-500",
          showFilters ? "lg:col-span-9" : "lg:col-span-12"
        )}>
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(115,46,228,0.4)]" />
                <h2 className="text-4xl font-black italic tracking-tighter uppercase text-on-surface">
                  RESULTADOS <span className="text-primary">/ EXPLORAR</span>
                </h2>
              </div>
              {hasActiveFilters && (
                <p className="text-sm font-bold text-on-surface-variant ml-4 uppercase tracking-widest opacity-60">
                  {total} eventos encontrados
                </p>
              )}
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
              {events.length > 0 ? events.map((event) => (
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
                       src={resolveAssetUrl(event.thumbnail_url) || NO_EVENT_IMAGE}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      onError={(e) => { (e.target as HTMLImageElement).src = NO_EVENT_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {isFree(event.price) && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-green-500 text-white text-[9px] font-black tracking-widest uppercase shadow-lg shadow-green-500/20">
                        Gratis
                      </div>
                    )}
                  </Link>

                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      {(() => {
                        const catName = event.interests?.[0]?.name || event.tags?.[0] || event.category;
                        const catColor = categories.find(c => c.name === catName)?.color;
                        return (
                          <span
                            className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider text-white"
                            style={{ backgroundColor: catColor || '#732ee4' }}
                          >
                            {catName || 'EVENTO'}
                          </span>
                        );
                      })()}
                      {!isFree(event.price) && (
                        <span className="text-xs font-black text-on-surface-variant/60 uppercase tracking-widest">
                          {formatPrice(event.price)}
                        </span>
                      )}
                    </div>
                    <Link to={`/events/${event.id_event}`}>
                      <h3 className="text-xl font-black text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2 uppercase italic tracking-tighter">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-xs text-on-surface-variant font-medium line-clamp-2 mb-4">
                          {event.description}
                        </p>
                      )}
                    </Link>
                    <div className="mt-auto pt-6 border-t border-outline-variant/30 space-y-3">
                      <div className="flex items-center gap-3 text-on-surface-variant">
                        <CalendarDays size={16} className="text-primary shrink-0" />
                        <span className="text-xs font-bold tracking-wide uppercase">
                          {format(safeDate(event.date), "d MMM • HH:mm", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-on-surface-variant">
                        <MapPin size={16} className="text-primary shrink-0" />
                        <span className="text-xs font-bold tracking-wide uppercase truncate">
                          {event.ubication || 'Consultar ubicación'}
                        </span>
                      </div>
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap pt-1">
                          {event.tags.slice(0, 3).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-primary/5 text-primary text-[8px] font-bold uppercase tracking-wider">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )) : (
                <div className="col-span-full py-32 text-center space-y-8 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-outline-variant/50">
                  <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center mx-auto transform -rotate-6 border border-outline-variant/30">
                    <X size={40} className="text-primary/40" />
                  </div>
                  <div className="space-y-3 px-6">
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase text-on-surface">Sin resultados</h3>
                    <p className="text-on-surface-variant max-w-sm mx-auto font-medium leading-relaxed opacity-70">No encontramos eventos que coincidan con tu búsqueda actual. ¡Intenta ajustar los filtros!</p>
                  </div>
                  <button onClick={handleReset} className="bg-primary text-white font-black h-14 px-10 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                    Reiniciar Exploración
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default Discovery;
