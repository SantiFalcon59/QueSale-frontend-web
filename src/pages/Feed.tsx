import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPromptModal } from '../components/ui/LoginPromptModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { MOCK_EVENTS_DATA } from '../lib/mockData';

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [savedEvents, setSavedEvents] = useState<Record<string, boolean>>({});

  const handleInteraction = (e: React.MouseEvent, action?: string) => {
    if (!user) {
      e.preventDefault();
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const toggleSave = (e: React.MouseEvent, eventId: string) => {
    if (handleInteraction(e)) {
      setSavedEvents(prev => ({
        ...prev,
        [eventId]: !prev[eventId]
      }));
    }
  };

  const handleShare = async (e: React.MouseEvent, event: (typeof MOCK_EVENTS_DATA)[0]) => {
    if (handleInteraction(e)) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: event.title,
            text: event.description,
            url: window.location.origin + `/events/${event.id}`,
          });
        } else {
          await navigator.clipboard.writeText(window.location.origin + `/events/${event.id}`);
          alert('Enlace copiado al portapapeles');
        }
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto snap-y snap-mandatory scroll-smooth hide-scrollbar">
      <LoginPromptModal 
        isOpen={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)} 
      />
      
      {MOCK_EVENTS_DATA.map((event, index) => (
        <div 
          key={event.id}
          className="w-full h-full snap-start p-4 lg:p-8"
        >
          <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-black shadow-2xl flex flex-col justify-end border border-white/5">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                alt={event.title} 
                className="w-full h-full object-cover opacity-70 transition-transform duration-1000 hover:scale-105" 
                src={event.image} 
              />
              {/* Bottom Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Vertical Action Bar (Right) */}
            <div className="absolute right-6 bottom-8 lg:right-10 lg:bottom-12 flex flex-col gap-8 items-center z-10">
              <div 
                className="flex flex-col items-center group cursor-pointer"
                onClick={(e) => toggleSave(e, event.id)}
              >
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "w-14 h-14 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-lg",
                    savedEvents[event.id] ? "bg-primary border-primary shadow-primary/40" : "bg-white/10 group-hover:bg-primary-container"
                  )}
                >
                  <span 
                    className="material-symbols-outlined text-[28px]" 
                    style={{ fontVariationSettings: savedEvents[event.id] ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    bookmark
                  </span>
                </motion.div>
                <span className="text-[10px] font-bold text-white mt-1.5 uppercase tracking-widest text-shadow-sm">
                  {savedEvents[event.id] ? 'Guardado' : 'Guardar'}
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
                  <span className="material-symbols-outlined text-[28px]">share</span>
                </motion.div>
                <span className="text-[10px] font-bold text-white mt-1.5 uppercase tracking-widest text-shadow-sm">Share</span>
              </div>

              <div className="flex flex-col items-center group cursor-pointer">
                <Link 
                  to={`/events/${event.id}`}
                  className="relative"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 rounded-2xl bg-primary-container text-white flex items-center justify-center shadow-xl shadow-primary/40"
                  >
                    <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                  </motion.div>
                  {/* Visual pulse for tickets button */}
                  <div className="absolute inset-0 rounded-2xl bg-primary-container animate-ping opacity-20 -z-10" />
                </Link>
                <span className="text-[10px] font-extrabold text-primary-container mt-2 uppercase tracking-[0.2em] bg-white px-2 py-0.5 rounded shadow-sm">Tickets</span>
              </div>
            </div>

            {/* Event Info Overlay (Bottom Left) */}
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
                  {event.category}
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
                {event.title.split(':').map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {part}
                  </React.Fragment>
                ))}
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
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg group hover:bg-white/20 transition-all">
                  <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                  <span className="text-white font-bold text-xs lg:text-sm tracking-wide">
                    {format(new Date(event.date), "d MMM • HH:mm", { locale: es }).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg group hover:bg-white/20 transition-all">
                  <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                  <span className="text-white font-bold text-xs lg:text-sm tracking-wide">{event.location}</span>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg group hover:bg-white/20 transition-all">
                  <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#00dbe7]" />
                  <span className="text-white font-bold text-xs lg:text-sm tracking-wide">{event.organizer}</span>
                </div>
              </motion.div>
            </div>

            {/* Scroll Indicator */}
            {index < MOCK_EVENTS_DATA.length - 1 && (
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

      {/* CSS for hide-scrollbar and custom snap behavior */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .text-shadow-sm {
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};

export default Feed;
