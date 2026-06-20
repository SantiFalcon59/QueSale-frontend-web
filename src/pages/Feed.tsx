import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn, NO_EVENT_IMAGE } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPromptModal } from '../components/ui/LoginPromptModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { api, resolveAssetUrl } from '../services/apiClient';
import { Calendar, MapPin, Share2, Bookmark } from 'lucide-react';
import { AdBanner } from '../components/ui/AdBanner';

const CYCLE_MS = 4000;

const Feed: React.FC = () => {
  const { user, profile } = useAuth() as any;
  const isPremium = profile?.is_premium || profile?.role === 'admin';
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedEvents, setSavedEvents] = useState<Record<string, boolean>>({});
  const [imageIndex, setImageIndex] = useState(0);
  const [fadingMap, setFadingMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
    const hasMulitpleImages = events.some(e => e.images?.length > 1);
    if (!hasMulitpleImages) return;
    const interval = setInterval(() => {
      setImageIndex(prev => {
        const next: Record<string, string> = {};
        for (const event of events) {
          const imgs = event.images;
          if (!imgs?.length || imgs.length < 2) continue;
          next[event.id_event] = imgs[prev % imgs.length];
        }
        setFadingMap(next);
        return prev + 1;
      });
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, [events]);

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

  useEffect(() => {
    if (!user) return;
    api.getSavedEvents(1, 100).then((result: any) => {
      const saved = Array.isArray(result) ? result : [];
      const map: Record<string, boolean> = {};
      saved.forEach((e: any) => { map[e.id_event] = true; });
      setSavedEvents(map);
    }).catch(() => {});
  }, [user]);

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
      <div className="flex items-center justify-center h-[calc(100vh-128px)] lg:h-[calc(100vh-64px)]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-128px)] lg:h-[calc(100vh-64px)]">
        <div className="text-center space-y-4">
          <Calendar size={48} className="mx-auto text-on-surface-variant opacity-30" />
          <h2 className="text-2xl font-black">No hay eventos disponibles</h2>
          <p className="text-on-surface-variant text-sm">Volvé más tarde para descubrir nuevos eventos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-128px)] lg:h-[calc(100vh-64px)] overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar">
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      {events.map((event, index) => {
        const images = event.images?.length ? event.images : [];
        const imgIdx = images.length > 1 ? imageIndex % images.length : 0;
        const currentSrc = images.length > 0 ? resolveAssetUrl(images[imgIdx]) : resolveAssetUrl(event.thumbnail_url || NO_EVENT_IMAGE);
        
        return (
          <React.Fragment key={event.id_event}>
            <div className="w-full h-full snap-start snap-always p-4 lg:p-8">
              <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-black shadow-2xl flex flex-col justify-end border border-white/5 group">
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <div className="w-full h-full transition-transform duration-1000 group-hover:scale-105">
                    <img src={currentSrc} className="absolute inset-0 w-full h-full object-cover opacity-70" alt={event.title} />
                    {fadingMap[event.id_event] && (
                      <motion.img
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        onAnimationComplete={() => setFadingMap(prev => {
                          const next = { ...prev };
                          delete next[event.id_event];
                          return next;
                        })}
                        src={resolveAssetUrl(fadingMap[event.id_event])}
                        className="absolute inset-0 w-full h-full object-cover z-10"
                      />
                    )}
                  </div>
                </div>

                <div className="relative z-20 p-8 lg:p-12 space-y-6 max-w-4xl">
                  <div className="flex gap-3">
                     <span className="px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary/30 shadow-sm shadow-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                       {event.organizer?.name || event.interests?.[0]?.name || event.tags?.[0] || 'Evento'}
                     </span>
                     <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
                       {format(new Date(event.date), 'EEEE dd', { locale: es })}
                     </span>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-4xl lg:text-7xl font-black italic tracking-tighter text-white uppercase leading-[0.9]">{event.title}</h2>
                    <p className="text-base lg:text-lg text-white/70 font-medium leading-relaxed line-clamp-2 max-w-2xl">{event.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 lg:gap-10 pt-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white"><MapPin size={24} /></div>
                       <div>
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Ubicación</p>
                          <p className="text-sm lg:text-base text-white font-bold">{event.ubication}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white"><Calendar size={24} /></div>
                       <div>
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Horario</p>
                          <p className="text-sm lg:text-base text-white font-bold">{format(new Date(event.date), 'HH:mm')} HS</p>
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-8">
                     <Link to={`/events/${event.id_event}`} className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:scale-105 transition-all flex items-center justify-center">Ver Detalles</Link>
                     <button onClick={(e) => toggleSave(e, event.id_event)} className={cn("w-16 h-16 rounded-2xl border flex items-center justify-center transition-all", savedEvents[event.id_event] ? "bg-primary border-primary text-white" : "bg-white/10 border-white/10 text-white hover:bg-white hover:text-black")}>
                        <Bookmark size={24} fill={savedEvents[event.id_event] ? "currentColor" : "none"} />
                     </button>
                     <button onClick={(e) => handleShare(e, event)} className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all">
                        <Share2 size={24} />
                     </button>
                  </div>
                </div>

                <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-black/20 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-black/40 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Show an Ad after every 4 events — hidden for premium users */}
            {(index + 1) % 4 === 0 && !isPremium && (
              <div className="w-full h-full snap-start snap-always p-4 lg:p-8 flex items-center justify-center">
                <div className="max-w-4xl w-full h-full glass-card rounded-[40px] p-12 border border-white/10 flex flex-col items-center justify-center gap-6">
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Publicidad Sugerida</p>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Contenido Patrocinado</h3>
                  </div>
                  <div className="w-full bg-white/5 rounded-3xl p-4 min-h-[250px] flex items-center justify-center overflow-hidden">
                    <AdBanner 
                      client="ca-pub-YOUR_ADSENSE_CLIENT_ID" 
                      slot="YOUR_FEED_AD_SLOT" 
                      format="fluid" 
                      className="w-full" 
                    />
                  </div>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Gracias por apoyar a QueSale</p>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Feed;
