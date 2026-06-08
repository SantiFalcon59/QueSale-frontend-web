import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Calendar, MapPin, GridIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import { Link } from 'react-router-dom';
import { formatPrice, NO_EVENT_IMAGE } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Favorites: React.FC = () => {
  const { profile } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.username) return;

    const fetchFavorites = async () => {
      try {
        const result: any = await api.getSavedEvents(1, 100);
        setFavorites(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [profile]);

  const handleUnsave = async (eventId: string) => {
    try {
      await api.unsaveEvent(eventId);
      setFavorites(prev => prev.filter(e => e.id_event !== eventId));
    } catch (err) {
      console.error("Error unsaving event:", err);
    }
  };

  return (
    <div className="space-y-12 pb-20 px-4 lg:px-8 xl:px-12">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-red-50 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/5 border border-red-100">
             <Heart size={32} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">MIS <span className="text-red-500">FAVORITOS</span></h1>
            <p className="text-on-surface-variant font-medium text-lg italic mt-1">Tu selección personal de eventos épicos</p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1,2,3].map(i => (
             <div key={i} className="h-80 rounded-[3rem] bg-surface-container-low animate-pulse border border-outline-variant/30" />
           ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {favorites.map((event, index) => (
            <motion.div
              key={event.id_event}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-[2.5rem] border border-outline-variant hover:border-primary/50 transition-all overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5"
            >
              <Link to={`/events/${event.id_event}`} className="block relative h-48 overflow-hidden">
                <img src={event.images?.[0] || event.thumbnail_url || NO_EVENT_IMAGE} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4">
                   <button 
                     onClick={(e) => {
                       e.preventDefault();
                       handleUnsave(event.id_event);
                     }}
                     className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-red-500 shadow-lg hover:scale-110 transition-transform"
                   >
                      <Heart size={20} fill="currentColor" />
                   </button>
                </div>
              </Link>
              
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                      {event.interests?.[0]?.name || event.tags?.[0] || 'EVENTO'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black italic tracking-tight group-hover:text-primary transition-colors leading-tight">
                    {event.title}
                  </h3>
                </div>

                <div className="space-y-2 text-xs font-bold text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {format(new Date(event.date), "EEEE d 'de' MMMM", { locale: es })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-primary" />
                    {event.ubication}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-outline-variant/30">
                  <div className="text-[10px] font-black text-primary">
                    {formatPrice(event.price)}
                  </div>
                  <Link to={`/events/${event.id_event}`} className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                    <GridIcon size={16} className="group-hover:text-white transition-colors" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-6">
           <Heart size={80} className="mx-auto text-on-surface-variant opacity-10" />
           <div className="space-y-2">
             <h2 className="text-2xl font-black italic tracking-tight opacity-40 uppercase">Aún no tienes favoritos</h2>
             <p className="text-on-surface-variant font-medium max-w-xs mx-auto">Explora eventos y haz click en el ❤️ para guardarlos aquí.</p>
           </div>
           <Link to="/discovery" className="inline-flex h-14 px-10 rounded-2xl bg-on-surface text-surface font-black uppercase text-[10px] tracking-widest items-center hover:scale-105 transition-all">
             DESCUBRIR EVENTOS
           </Link>
        </div>
      )}
    </div>
  );
};

export default Favorites;
