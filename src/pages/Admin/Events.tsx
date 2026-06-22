import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Calendar, Search, Trash2, MapPin, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn, NO_EVENT_IMAGE } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { api, resolveAssetUrl } from '../../services/apiClient';
import { toastSuccess, toastError, confirmAction } from '../../lib/swal';
import { useAuth } from '../../context/AuthContext';

const AdminEvents: React.FC = () => {
  const { profile } = useAuth() as any;
  const isModerator = profile?.role === 'moderator';
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
            const data: any = await api.getEvents(1, 50);
            const mapped = (data || []).map((event: any) => ({
               id: event.id_event,
               title: event.title,
               date: event.date,
               location: event.ubication,
               category: event.interests?.[0]?.name || 'General',
               organizerId: event.id_organizer,
               image: resolveAssetUrl(event.thumbnail_url || event.images?.[0] || event.media?.[0]) || NO_EVENT_IMAGE,
            }));
            setEvents(mapped);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (eventId: string) => {
    const confirmed = await confirmAction('¿Eliminar evento?', 'Esta acción es irreversible.');
    if (!confirmed) return;
    
    try {
      await api.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toastSuccess('Evento eliminado');
    } catch (err) {
      toastError('Error al eliminar el evento');
    }
  };

  const filteredEvents = events.filter(e => 
    e.title?.toLowerCase().includes(search.toLowerCase()) || 
    e.category?.toLowerCase().includes(search.toLowerCase()) ||
    e.organizerId?.includes(search)
  );

  if (loading) return <div className="p-20 text-center font-bold">Escaneando eventos activos...</div>;

  return (
    <div className="space-y-10 pb-20">
      <header className="space-y-2">
         <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" size={32} />
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter uppercase">MODERACIÓN DE <span className="text-primary">EVENTOS</span></h1>
         </div>
         <p className="text-on-surface-variant font-medium ml-1">Supervisión y Limpieza del Feed</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
           <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, categoría o ID org..."
              className="w-full bg-surface-container-low border border-outline-variant h-14 pl-14 pr-6 rounded-2xl outline-none focus:border-primary transition-all font-bold"
           />
        </div>

        <Link 
          to="/organizer/new" 
          state={{ isExternal: true }}
          className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-lg shadow-primary/20 hover:scale-105 transition-all w-full md:w-auto text-center justify-center"
        >
          <Calendar size={18} />
          Nuevo Evento Externo
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {filteredEvents.map((event) => (
           <motion.div 
            key={event.id}
            layout
            className="p-5 sm:p-6 rounded-[2rem] bg-surface-container-low border border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-primary/30 transition-all group"
           >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0 w-full">
                 <img 
                   src={event.image} 
                   alt={event.title} 
                   className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-white shadow-sm flex-shrink-0" 
                   onError={(e) => { (e.target as HTMLImageElement).src = NO_EVENT_IMAGE; }}
                 />
                 <div className="space-y-2 min-w-0 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                       <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors">{event.title}</h3>
                       <span className="px-2 py-0.5 rounded-lg bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20 shrink-0">{event.category}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-bold text-on-surface-variant">
                       <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary shrink-0" /> {event.date ? format(new Date(event.date), "dd MMM, HH:mm", { locale: es }) : 'N/A'}</span>
                       <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary shrink-0" /> {event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                       <div className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest flex items-center gap-1">
                          ID Org: <span className="text-on-surface opacity-60 truncate max-w-[120px]">{event.organizerId}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-3 pr-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-outline-variant/20 pt-4 sm:pt-0">
                 <Link 
                  to={`/events/${event.id}`} 
                  target="_blank"
                  className="w-12 h-12 rounded-2xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all"
                 >
                    <ExternalLink size={20} />
                 </Link>
                 {!isModerator && (
                   <button 
                    onClick={() => handleDelete(event.id)}
                    className="w-12 h-12 rounded-2xl border border-red-100 bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer"
                   >
                      <Trash2 size={20} />
                   </button>
                 )}
              </div>
           </motion.div>
         ))}

         {filteredEvents.length === 0 && (
            <div className="py-20 text-center space-y-4">
               <AlertTriangle size={48} className="mx-auto text-on-surface-variant opacity-20" />
               <p className="text-on-surface-variant font-bold italic tracking-widest text-sm uppercase">Sin eventos sospechosos en esta vista</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default AdminEvents;
