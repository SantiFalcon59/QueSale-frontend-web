import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPromptModal } from '../components/ui/LoginPromptModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../services/apiClient';
import { Calendar, MapPin, Share2, Bookmark, Loader2 } from 'lucide-react';

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedEvents, setSavedEvents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const result: any = await api.getEvents(1, 20);
        const apiEvents = Array.isArray(result) ? result : (result?.data || []);
        setEvents(apiEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleInteraction = (e: React.MouseEvent, action?: string) => {
    if (!user) {
      e.preventDefault();
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const toggleSave = async (e: React.MouseEvent, eventId: string) => {
    if (!handleInteraction(e)) return;
    try {
      if (savedEvents[eventId]) {
        await api.unsaveEvent(eventId);
      } else {
        await api.saveEvent(eventId);
      }
      setSavedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleShare = async (e: React.MouseEvent, event: any) => {
    if (!handleInteraction(e)) return;
    try {
      const url = window.location.origin + `/events/${event.id_event}`;
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.description, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center space-y-4">
          <Calendar size={48} className="mx-auto text-on-surface-variant opacity-30" />
          <h2 className="text-2xl font-black">No hay eventos disponibles</h2>
          <p className="text-on-surface-variant text-sm">Volvé más tarde para descubrir nuevos eventos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto snap-y snap-mandatory scroll-smooth hide-scrollbar">
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      {events.map((event, index) => (
        <div key={event.id_event} className="w-full h-full snap-start p-4 lg:p-8">
          <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-black shadow-2xl flex flex-col justify-end border border-white/5">
            <div className="absolute inset-0 z-0">
              <img
                alt={event.title}
                className="w-full h-full object-cover opacity-70 transition-transform duration-1000 hover:scale-105"
                src={event.thumbnail_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            <div className="absolute right-6 bottom-8 lg:right-10 lg:bottom-12 flex flex-col gap-8 items-center z-10">
              <div
                className="flex flex-col items-center group cursor-pointer"
                onClick={(e) => toggleSave(e, event.id_event)}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "w-14 h-14 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-lg",
                    savedEvents[event.id_event] ? "bg-primary border-primary shadow-primary/40" : "bg-white/10 group-hover:bg-primary-container"
                  )}
                >
                  <Bookmark size={24} fill={savedEvents[event.id_event] ? 'currentColor' : 'none'} />
                </motion.div>
                <span className="text-[10px] font-bold text-white mt-1.5 uppercase tracking-widest text-shadow-sm">
                  {savedEvents[event.id_event] ? 'Guardado' : 'Guardar'}
                </span>
              </div>

              <div
                className="flex flex-col items-center group cursor-pointer"
                onClick={(e) => handleShare(e, event)}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full backdrop-blur-md border border-white/20 bg-white/10 flex items-center justify-center text-white group-hover:bg-primary-container transition-all shadow-lg"
                >
                  <Share2 size={24} />
                </motion.div>
                <span className="text-[10px] font-bold text-white mt-1.5 uppercase tracking-widest text-shadow-sm">Share</span>
              </div>

              <div className="flex flex-col items-center group cursor-pointer">
                <Link to={`/events/${event.id_event}`} className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 rounded-2xl bg-primary-container text-white flex items-center justify-center shadow-xl shadow-primary/40"
                  >
                    <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                  </motion.div>
                  <div className="absolute inset-0 rounded-2xl bg-primary-container animate-ping opacity-20 -z-10" />
                </Link>
                <span className="text-[10px] font-extrabold text-primary-container mt-2 uppercase tracking-[0.2em] bg-white px-2 py-0.5 rounded shadow-sm">Tickets</span>
              </div>
            </div>

            <div className="relative z-10 p-8 lg:p-14 w-full max-w-4xl pointer-events-none">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#732ee4]" />
                <span className="text-primary font-black text-xs lg:text-sm tracking-[0.2em] uppercase bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-primary/20">
                  {event.organizer?.name || 'Evento'}
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-display text-4xl lg:text-7xl text-white mb-6 leading-[1.1] uppercase font-black tracking-tighter"
                style={{ textShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(115, 46, 228, 0.3)' }}
              >
                {event.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-white/90 text-sm lg:text-lg mb-8 max-w-2xl line-clamp-2 lg:line-clamp-none font-medium leading-relaxed pointer-events-auto"
              >
                {event.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-4 items-center pointer-events-auto"
              >
                {event.date && (
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg group hover:bg-white/20 transition-all">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-white font-bold text-xs lg:text-sm tracking-wide">
                      {format(new Date(event.date), "d MMM • HH:mm", { locale: es }).toUpperCase()}
                    </span>
                  </div>
                )}
                {event.ubication && (
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg group hover:bg-white/20 transition-all">
                    <MapPin size={16} className="text-primary" />
                    <span className="text-white font-bold text-xs lg:text-sm tracking-wide">{event.ubication}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {index < events.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce"
              >
                <span className="material-symbols-outlined text-white text-[32px]">keyboard_double_arrow_down</span>
              </motion.div>
            )}
          </div>
        </div>
      ))}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .text-shadow-sm { text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
};

export default Feed;
