import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, CalendarDays, MapPin, Users, Heart, Share2, Send, MessageSquare, 
  ShieldCheck, Ticket as TicketIcon, ThumbsUp, Reply, 
  Instagram, Twitter, Globe, Info, Megaphone, Users2,
  X, Image as ImageIcon, Plus, CheckCircle2, Trash2, Gavel,
  ZoomIn, ZoomOut, Crosshair, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn, formatPrice, NO_EVENT_IMAGE } from '../lib/utils';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoginPromptModal } from '../components/ui/LoginPromptModal';
import { api, resolveAssetUrl } from '../services/apiClient';
import { io, Socket } from 'socket.io-client';
import PostFeed from '../components/wall/PostFeed';
import PostComposer from '../components/wall/PostComposer';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

interface Event {
  id: string;
  title: string;
  description: string;
  date: any;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  organizerId: string;
  price: number;
  capacity: number;
  attendeesCount: number;
  category: string;
  media: string[];
  image: string;
  status: string;
}

interface Organizer {
  id: string;
  name: string;
  description: string;
  logo: string;
  ownerId?: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  media?: string[];
}

interface Post {
  id: string;
  id_post?: number;
  userId: string;
  content: string;
  type: 'query' | 'comment' | 'poll' | 'feedback';
  likes: number;
  createdAt: any;
  poll?: {
    options: string[];
    votes: Record<string, number>;
  };
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  displayName: string;
  photoURL: string | null;
  timestamp: string;
  messageType: string;
}

const EventDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'announcements' | 'community'>('info');
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState<number | null>(null);
  const galleryImages = event?.media || [];
  const [isSaved, setIsSaved] = useState(false);
  const [organizerEvents, setOrganizerEvents] = useState<any[]>([]);
  const [isModerator, setIsModerator] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  const handleInteraction = (e?: React.MouseEvent) => {
    if (!user) {
      if (e) e.preventDefault();
      setShowLoginPrompt(true);
      return true; // was blocked
    }
    return false; // not blocked
  };

  useEffect(() => {
    const handleGlobalPrompt = () => setShowLoginPrompt(true);
    document.addEventListener('show-login-prompt', handleGlobalPrompt);
    return () => document.removeEventListener('show-login-prompt', handleGlobalPrompt);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const data: any = await api.getEventById(id);
        const galleryImages = data.images && Array.isArray(data.images)
          ? data.images.map((img: string) => resolveAssetUrl(img)).filter(Boolean) as string[]
          : [];
        const thumbnail = resolveAssetUrl(data.thumbnail_url);
        const media = [thumbnail, ...galleryImages].filter(Boolean) as string[];
        const category = data.interests?.[0]?.name || 'General';
        const mappedEvent: Event = {
          id: data.id_event,
          title: data.title,
          description: data.description || '',
          date: data.date,
          location: {
            address: data.ubication,
            lat: Number(data.latitude) || -34.6037,
            lng: Number(data.longitude) || -58.3816,
          },
          organizerId: data.id_organizer,
          price: Number(data.price) || 0,
          capacity: data.capacity || 0,
          attendeesCount: data.attendeesCount || 0,
          category,
          media,
          image: thumbnail || media[0] || '',
          status: data.status || 'active',
        };
        setEvent(mappedEvent);
        setIsSaved(!!data.isFavorited);

        if (data.id_organizer) {
          const organizerData: any = await api.getOrganizerById(data.id_organizer);
          setOrganizer({
            id: organizerData.id_organizer,
            name: organizerData.name,
            description: organizerData.description || '',
            logo: resolveAssetUrl(organizerData.logo_url) || `https://api.dicebear.com/7.x/initials/svg?seed=${organizerData.name}`,
            ownerId: organizerData.id_creator,
            socials: {},
          });

          try {
            const status: any = await api.getModeratorStatus(id!);
            setIsModerator(status?.isModerator || false);
            setIsOrganizer(status?.isOrganizer || false);
          } catch {
            setIsModerator(false);
            setIsOrganizer(false);
          }

          try {
            const orgEvents: any = await api.getOrganizerEvents(organizerData.id_organizer, 1, 50);
            const eventsList = orgEvents?.data || orgEvents || [];
            setOrganizerEvents(eventsList.filter((e: any) => e.id_event !== id));
          } catch {
            setOrganizerEvents([]);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching event:", err);
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (galleryIdx === null) return;
      if (e.key === 'Escape') setGalleryIdx(null);
      if (e.key === 'ArrowLeft') setGalleryIdx(i => i !== null ? Math.max(0, i - 1) : null);
      if (e.key === 'ArrowRight') setGalleryIdx(i => i !== null ? Math.min(galleryImages.length - 1, i + 1) : null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [galleryIdx, galleryImages.length]);

  const handleToggleSave = async () => {
    if (handleInteraction()) return;
    if (!id) return;

    try {
      if (isSaved) {
        await api.unsaveEvent(id);
        setIsSaved(false);
      } else {
        await api.saveEvent(id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Evento no encontrado</h2>
        <p className="text-on-surface-variant">El evento que buscas no existe o ha sido eliminado.</p>
      </div>
    );
  }

  const rawDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
  const eventDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;

  return (
    <div className="relative px-4 lg:px-8 xl:px-12 max-w-[1600px] mx-auto">
      <LoginPromptModal 
        isOpen={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)} 
                    title="Acceso Requerido"
        message="Registrate o inicia sesión para comprar entradas, participar en la comunidad y chatear en vivo."
      />
      
      {/* Image Gallery Modal */}
      <AnimatePresence>
        {galleryIdx !== null && galleryImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center select-none"
            onClick={() => setGalleryIdx(null)}
          >
            <button
              className="absolute top-6 right-6 lg:top-10 lg:right-10 w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-10"
              onClick={() => setGalleryIdx(null)}
            >
              <X size={28} className="lg:size-8" />
            </button>

            {galleryIdx > 0 && (
              <button
                className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-all z-10"
                onClick={(e) => { e.stopPropagation(); setGalleryIdx(i => i !== null ? Math.max(0, i - 1) : null); }}
              >
                <ChevronLeft size={28} className="lg:size-8" />
              </button>
            )}

            {galleryIdx < galleryImages.length - 1 && (
              <button
                className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-all z-10"
                onClick={(e) => { e.stopPropagation(); setGalleryIdx(i => i !== null ? Math.min(galleryImages.length - 1, i + 1) : null); }}
              >
                <ChevronRight size={28} className="lg:size-8" />
              </button>
            )}

            <motion.img
              key={galleryIdx}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={galleryImages[galleryIdx]}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl lg:rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs lg:text-sm font-bold tracking-widest bg-black/30 px-4 py-1.5 rounded-full">
              {galleryIdx + 1} / {galleryImages.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-6 lg:gap-16">
        {/* Left Column: Event Core & Community */}
        <div className="col-span-12 lg:col-span-8 space-y-8 lg:space-y-12 min-w-0">
          {/* Gallery Header */}
          <section className="relative h-[300px] lg:h-[500px] rounded-[1.5rem] lg:rounded-[3.5rem] overflow-hidden group">
            <div className="grid grid-cols-4 grid-rows-2 h-full gap-1 lg:gap-2 cursor-pointer">
              <div
                className="col-span-4 lg:col-span-3 row-span-2 relative overflow-hidden"
                onClick={() => setGalleryIdx(0)}
              >
                <img
                  src={event.media?.[0]}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </div>
              {event.media.length > 1 && (
              <div
                className="hidden lg:block col-span-1 row-span-1 overflow-hidden"
                onClick={() => setGalleryIdx(1)}
              >
                <img
                  src={event.media?.[1] || NO_EVENT_IMAGE}
                  alt="Gallery 1"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </div>
              )}
              {event.media.length > 2 && (
              <div
                className="hidden lg:block col-span-1 row-span-1 relative overflow-hidden"
                onClick={() => setGalleryIdx(event.media.length > 3 ? 3 : 2)}
              >
                <img
                  src={event.media?.[2] || NO_EVENT_IMAGE}
                  alt="Gallery 2"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                {event.media.length > 3 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors">
                  <span className="text-white font-bold text-sm">+{event.media.length - 3} fotos</span>
                </div>
                )}
              </div>
              )}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            
            <div className="absolute bottom-6 lg:bottom-10 left-6 lg:left-10 right-6 lg:right-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="space-y-2 lg:space-y-4">
                <div className="flex gap-2">
                   <div className="px-3 lg:px-4 py-1 lg:py-1.5 rounded-full bg-primary text-white text-[9px] lg:text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      EN VIVO
                   </div>
                   <span className="px-3 lg:px-4 py-1 lg:py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[9px] lg:text-[10px] font-bold text-white uppercase tracking-widest">
                     {event.category}
                   </span>
                </div>
                <h1 className="text-3xl lg:text-6xl font-black tracking-tighter text-white leading-tight lg:leading-none uppercase">{event.title}</h1>
              </div>
              <div className="flex gap-2 lg:gap-3 self-end sm:self-auto">
                <button 
                  onClick={handleToggleSave}
                  className={cn(
                    "w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all",
                    isSaved 
                      ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30" 
                      : "bg-white/20 border-white/20 text-white hover:bg-primary"
                  )}
                >
                  <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={() => handleInteraction()}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary transition-all"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </section>

          {/* Navigation Tabs */}
          <div className="flex gap-6 lg:gap-10 border-b border-outline-variant overflow-x-auto no-scrollbar">
            {[
              { id: 'info', name: 'Detalles', icon: Info },
              { id: 'announcements', name: 'Anuncios', icon: Megaphone },
              { id: 'community', name: 'Muro', icon: Users2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 pb-6 text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] transition-all relative border-b-2 whitespace-nowrap",
                  activeTab === tab.id 
                    ? "text-primary border-primary" 
                    : "text-on-surface-variant hover:text-on-surface border-transparent"
                )}
              >
                <tab.icon size={16} />
                {tab.name}
              </button>
            ))}
          </div>

          <section className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div 
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
                >
                  <div className="space-y-8 lg:space-y-10">
                    <div className="space-y-3 lg:space-y-4">
                      <h3 className="text-lg lg:text-xl font-bold uppercase tracking-widest opacity-60">Sobre el Evento</h3>
                      <p className="text-base lg:text-lg text-on-surface-variant leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Tags */}
                    {(event as any).tags?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg lg:text-xl font-bold uppercase tracking-widest opacity-60">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {(event as any).tags.map((tag: string) => (
                            <Link
                              key={tag}
                              to={`/events?tags=${encodeURIComponent(tag)}`}
                              className="px-3 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all border border-primary/10"
                            >
                              #{tag}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <EventMapControls event={event} GOOGLE_MAPS_KEY={GOOGLE_MAPS_KEY} />
                    </div>
                  </div>

                  <div className="space-y-8 lg:space-y-10">
                    <CalendarWidget eventDate={eventDate} />

                    {organizer && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Organizador</h3>
                        <div className="p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] bg-indigo-50/30 border border-indigo-100 flex flex-col gap-6">
                          <div className="flex items-center gap-4">
                            <img src={organizer.logo} alt={organizer.name} className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl object-cover" />
                            <div>
                               <h4 className="text-lg lg:text-xl font-black italic">{organizer.name}</h4>
                               <div className="flex gap-2 mt-1">
                                  {organizer.socials?.instagram && (
                                    <a href={organizer.socials.instagram} target="_blank" className="p-1 rounded-lg bg-surface hover:text-primary transition-all shadow-sm">
                                      <Instagram size={12} />
                                    </a>
                                  )}
                                  {organizer.socials?.twitter && (
                                    <a href={organizer.socials.twitter} target="_blank" className="p-1 rounded-lg bg-surface hover:text-primary transition-all shadow-sm">
                                      <Twitter size={12} />
                                    </a>
                                  )}
                                  {organizer.socials?.website && (
                                    <a href={organizer.socials.website} target="_blank" className="p-1 rounded-lg bg-surface hover:text-primary transition-all shadow-sm">
                                      <Globe size={12} />
                                    </a>
                                  )}
                               </div>
                            </div>
                          </div>
                          <p className="text-xs lg:text-sm text-on-surface-variant leading-relaxed">{organizer.description}</p>
                          <button onClick={() => navigate('/organizer/' + organizer.id_organizer)} className="w-full h-10 lg:h-12 rounded-xl lg:rounded-2xl bg-white border border-outline-variant font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all">Ver Perfil Completo</button>
                        </div>
                      </div>
                    )}

                    {organizerEvents.length > 0 && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Otros Eventos de {organizer?.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {organizerEvents.slice(0, 4).map(orgEvent => (
                            <Link
                              key={orgEvent.id_event}
                              to={`/events/${orgEvent.id_event}`}
                              className="group bg-white rounded-[2rem] border border-outline-variant overflow-hidden hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1"
                            >
                              <div className="relative aspect-[4/3] overflow-hidden">
                                <img
                                  src={orgEvent.images?.[0] || orgEvent.thumbnail_url || NO_EVENT_IMAGE}
                                  alt={orgEvent.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                <div className="absolute bottom-3 left-4 right-4">
                                  <p className="text-base font-black text-white leading-tight truncate drop-shadow-lg">{orgEvent.title}</p>
                                </div>
                                <div className="absolute top-3 left-3">
                                  <span className="px-2 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider border border-white/10">
                                    {orgEvent.interests?.[0]?.name || orgEvent.tags?.[0] || 'Evento'}
                                  </span>
                                </div>
                                {(!orgEvent.price || Number(orgEvent.price) === 0) && (
                                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-green-500 text-white text-[8px] font-black tracking-widest uppercase shadow-lg">
                                    Gratis
                                  </div>
                                )}
                              </div>
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-on-surface-variant font-bold flex items-center gap-1">
                                    <CalendarDays size={12} className="text-primary shrink-0" />
                                    {new Date(orgEvent.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                  </span>
                                  <span className="text-[10px] font-black text-primary">{formatPrice(orgEvent.price)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] text-on-surface-variant font-bold">
                                  <MapPin size={10} className="text-primary shrink-0" />
                                  <span className="truncate">{orgEvent.ubication || 'Consultar ubicación'}</span>
                                </div>
                                {orgEvent.tags && orgEvent.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap pt-1">
                                    {orgEvent.tags.slice(0, 2).map((t: string) => (
                                      <span key={t} className="px-1.5 py-0.5 rounded bg-primary/5 text-primary text-[7px] font-bold uppercase tracking-wider">#{t}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'announcements' && (
                <motion.div 
                  key="announcements"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <EventAnnouncements eventId={id!} organizerId={event.organizerId} isOrganizer={isOrganizer} />
                </motion.div>
              )}

              {activeTab === 'community' && (
                <motion.div 
                  key="community"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <EventWall eventId={id!} organizerOwnerId={organizer?.ownerId} eventTitle={event.title} isModerator={isModerator} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Right Column: Interaction & Tickets */}
        <div className="col-span-12 lg:col-span-4 space-y-6 lg:space-y-8 relative lg:sticky lg:top-28 self-start lg:pl-8">
           <section className="p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] bg-linear-to-br from-primary-container/20 to-surface border border-primary/20 shadow-2xl shadow-primary/10 space-y-8 lg:space-y-10">
              <div className="space-y-4">
                 <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-black">ENTRADAS DESDE</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-6xl font-black italic tracking-tighter text-on-surface">{formatPrice(event.price)}</span>
                    <span className="px-3 py-1 rounded bg-tertiary/10 text-tertiary text-[9px] lg:text-[10px] font-black tracking-widest uppercase whitespace-nowrap">
                      {Math.round((event.attendeesCount / event.capacity) * 100)}% Vendido
                    </span>
                 </div>
              </div>

              <div className="space-y-4">
                  <button
                    onClick={() => { if (handleInteraction()) return; window.open('https://mercadopago.com.ar', '_blank'); }}
                    className="w-full btn-primary h-14 lg:h-16 text-base lg:text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                  >
                    <TicketIcon size={22} className="lg:size-6" />
                    ADQUIRIR ACCESO
                  </button>
                 <p className="text-[9px] lg:text-[10px] text-center text-on-surface-variant font-bold uppercase tracking-widest">Pago directo al organizador</p>
              </div>

              <div className="space-y-4 lg:space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest opacity-60">Asistentes</span>
                  <span className="text-[10px] lg:text-xs font-bold text-primary">{event.attendeesCount} / {event.capacity}</span>
                </div>
                <div className="h-1.5 lg:h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${(event.attendeesCount / event.capacity) * 100}%` }}
                  />
                </div>

              </div>
           </section>

           <section className="p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] bg-orange-50 border border-orange-100 text-on-surface space-y-4 lg:space-y-6 relative overflow-hidden group">
              <div className="relative z-10 space-y-2">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-orange-600" />
                    <h3 className="text-base lg:text-lg font-black italic text-orange-900">Aviso Importante</h3>
                 </div>
                 <p className="text-[9px] lg:text-[11px] text-orange-800/80 leading-relaxed uppercase tracking-wider font-bold">
                   QueSale no actúa como intermediario en los cobros. Tu pago va directamente al organizador.
                 </p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform" />
           </section>
        </div>
      </div>

      {/* Floating Live Chat Toggle */}
      <div className="fixed bottom-10 right-10 z-50">
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={cn(
            "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500",
            isChatOpen ? "bg-surface text-on-surface rotate-90 scale-90" : "bg-primary text-white hover:scale-110 active:scale-95"
          )}
        >
          {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
          {!isChatOpen && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-surface flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          )}
        </button>

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="absolute bottom-20 right-0 w-[calc(100vw-40px)] sm:w-[400px] h-[70vh] sm:h-[600px] bg-surface rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl border border-outline-variant overflow-hidden flex flex-col"
            >
              <div className="p-8 bg-surface-container-high border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
                  <div>
                    <h3 className="text-sm font-black italic tracking-tight">CHAT EN VIVO</h3>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Canal Global de {event.title}</p>
                  </div>
                </div>
                {onlineCount > 0 && (
                  <div className="px-3 py-1 rounded bg-primary/10 text-primary text-[10px] font-black uppercase">{onlineCount} ONLINE</div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                <LiveChat eventId={event.id} isModerator={isModerator} organizerId={event.organizerId} onOnlineCountChange={setOnlineCount} />
              </div>

              <div className="p-8 border-t border-outline-variant bg-surface-container-low/50">
                <ChatMessageInput eventId={event.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const EventMapControls: React.FC<{ event: Event; GOOGLE_MAPS_KEY: string }> = ({ event, GOOGLE_MAPS_KEY }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Ubicacion</h3>
      <div className="h-64 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden border border-outline-variant bg-surface-container-low group relative">
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
          <Map
            defaultCenter={{ lat: event.location.lat, lng: event.location.lng }}
            defaultZoom={15}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId="9s8d7f6g5h4j3k2l1"
          >
            <Marker position={{ lat: event.location.lat, lng: event.location.lng }} />
            <MapZoomControls center={{ lat: event.location.lat, lng: event.location.lng }} />
          </Map>
        </APIProvider>
        <div className="p-3 lg:p-4 flex items-center gap-3 bg-surface-container-low border-t border-outline-variant">
          <MapPin size={18} className="text-primary" />
          <span className="text-xs lg:text-sm font-medium">{event.location.address}</span>
        </div>
      </div>
    </div>
  );
};

const MapZoomControls: React.FC<{ center: { lat: number; lng: number } }> = ({ center }) => {
  const map = useMap();
  const handleZoomIn = () => map?.setZoom((map.getZoom() || 15) + 1);
  const handleZoomOut = () => map?.setZoom((map.getZoom() || 15) - 1);
  const handleRecenter = () => map?.setCenter(center);

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
      <button onClick={handleZoomIn} className="w-10 h-10 rounded-xl bg-white shadow-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-primary hover:text-white hover:border-primary transition-all">
        <ZoomIn size={18} />
      </button>
      <button onClick={handleZoomOut} className="w-10 h-10 rounded-xl bg-white shadow-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-primary hover:text-white hover:border-primary transition-all">
        <ZoomOut size={18} />
      </button>
      <button onClick={handleRecenter} className="w-10 h-10 rounded-xl bg-white shadow-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-primary hover:text-white hover:border-primary transition-all">
        <Crosshair size={18} />
      </button>
    </div>
  );
};

const CalendarWidget: React.FC<{ eventDate: Date }> = ({ eventDate }) => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(() => new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Calendario</h3>
      <div className="p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] bg-surface-container-low border border-outline-variant space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="p-2 rounded-xl hover:bg-surface-container-high transition-all">
            <ChevronLeft size={18} />
          </button>
          <h4 className="text-base lg:text-lg font-black italic capitalize">{format(viewMonth, 'MMMM yyyy', { locale: es })}</h4>
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="p-2 rounded-xl hover:bg-surface-container-high transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map(d => (
            <span key={d} className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 py-2">{d}</span>
          ))}
          {days.map((day, i) => {
            const isEventDay = isSameDay(day, eventDate);
            const isTodayDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, viewMonth);
            return (
              <div
                key={i}
                className={cn(
                  "py-2 lg:py-3 text-xs lg:text-sm font-bold rounded-xl transition-all",
                  !isCurrentMonth && "text-on-surface-variant/20",
                  isTodayDay && !isEventDay && "bg-primary/10 text-primary",
                  isEventDay && "bg-primary text-white shadow-lg shadow-primary/30 scale-110",
                  !isEventDay && isCurrentMonth && "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-outline-variant/30 text-xs lg:text-sm font-medium text-on-surface-variant">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary shadow-sm" />
            <span>Evento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <span>Hoy</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-on-surface">
            <Calendar size={14} />
            <span>{format(eventDate, "HH:mm")} HS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventAnnouncements: React.FC<{ eventId: string; organizerId: string; isOrganizer: boolean }> = ({ eventId, organizerId, isOrganizer }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const data: any = await api.getWallPosts('event', eventId, 1, 50);
      const announced = (data || []).filter((p: any) => p.type === 'announcement');
      const mapped = announced.map((item: any) => ({
        id: String(item.id_post || item.id),
        title: 'Anuncio',
        content: item.content,
        createdAt: item.created_at,
        media: item.media || [],
      }));
      setAnnouncements(mapped);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [eventId]);

  const handleCreate = async (content: string, type?: string) => {
    if (!content.trim()) return;
    try {
      await api.createWallPost_new('event', eventId, content, 'announcement');
      setShowCreate(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Error creating announcement:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('¿Eliminar este anuncio?')) return;
    try {
      await api.deleteWallPost_new(parseInt(postId));
      setAnnouncements(prev => prev.filter(a => a.id !== postId));
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  if (loading) return <div className="py-10 text-center opacity-50">Cargando anuncios...</div>;

  return (
    <div className="space-y-6">
      {isOrganizer && (
        <div className="space-y-4">
          {showCreate ? (
            <PostComposer
              placeholder="Escribe un anuncio oficial..."
              onSubmit={handleCreate}
            />
          ) : (
            <button onClick={() => setShowCreate(true)} className="w-full p-4 rounded-[1.5rem] border-2 border-dashed border-outline-variant text-on-surface-variant font-bold text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3">
              <Plus size={16} /> Nuevo Anuncio
            </button>
          )}
          {showCreate && (
            <div className="flex justify-end -mt-4">
              <button onClick={() => setShowCreate(false)} className="px-6 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">Cancelar</button>
            </div>
          )}
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="py-20 text-center space-y-4 glass rounded-[3rem]">
          <Megaphone size={40} className="mx-auto text-on-surface-variant/30" />
          <p className="text-on-surface-variant font-medium">No hay anuncios oficiales todavía.</p>
        </div>
      ) : (
        announcements.map(ann => (
          <div key={ann.id} className="p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] bg-indigo-50/20 border border-indigo-100 space-y-6 relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
               <div className="space-y-1">
                  <span className="text-[9px] lg:text-[10px] font-black italic text-indigo-500 uppercase tracking-widest">COMUNICADO OFICIAL</span>
                  <h3 className="text-2xl lg:text-3xl font-black italic tracking-tight uppercase leading-none">{ann.title}</h3>
                  <p className="text-[9px] lg:text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                    {ann.createdAt ? format(new Date(ann.createdAt), 'PPP', { locale: es }) : 'N/A'}
                  </p>
               </div>
               <div className="flex items-center gap-2">
                 {isOrganizer && (
                   <button onClick={() => handleDelete(ann.id)} className="w-10 h-10 lg:w-12 lg:h-12 bg-red-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-red-500 border border-red-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shrink-0">
                     <Trash2 size={16} />
                   </button>
                 )}
                 <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl lg:rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                   <Megaphone size={20} />
                 </div>
               </div>
            </div>
            {(() => {
              const gifMatch = ann.content?.match(/\[GIF:(https?:\/\/[^\]]+)\]/);
              const textContent = ann.content?.replace(/\[GIF:https?:\/\/[^\]]+\]/g, '').trim();
              return (
                <>
                  {textContent && (
                    <p className="text-base lg:text-lg text-on-surface-variant leading-relaxed relative z-10">{textContent}</p>
                  )}
                  {gifMatch && (
                    <div className="rounded-xl overflow-hidden max-h-96 bg-black/5 relative z-10">
                      <img src={gifMatch[1]} alt="GIF" className="w-full h-full object-contain mx-auto" />
                    </div>
                  )}
                </>
              );
            })()}
            {ann.media && ann.media.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {ann.media.map((m, i) => (
                  <img key={i} src={m} className="w-full h-40 lg:h-48 object-cover rounded-2xl lg:rounded-3xl" alt="Ann photo" />
                ))}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full translate-x-20 translate-y-20 group-hover:scale-110 transition-transform" />
          </div>
        ))
      )}
    </div>
  );
};

const EventWall: React.FC<{ eventId: string; organizerOwnerId?: string; eventTitle: string; isModerator: boolean }> = ({ eventId, organizerOwnerId, eventTitle, isModerator: propIsModerator }) => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const modRoles = propIsModerator || profile?.role === 'admin' || profile?.role === 'moderator';
  const WALL_TYPE_FILTER = 'comment,query,feedback,poll';

  const fetchPosts = async () => {
    try {
      const data: any = await api.getWallPosts('event', eventId, 1, 50, WALL_TYPE_FILTER);
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [eventId]);

  const handleShare = async (content: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'QueSale', text: content, url: window.location.href });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${content} — ${window.location.href}`);
    }
  };

  const handlePost = async (content: string, type?: string, media?: string[]) => {
    if (!user) return;
    try {
      const created: any = await api.createWallPost_new('event', eventId, content, type, media);
      if (created) setPosts(prev => [created, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReact = async (postId: number, type: string) => {
    if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
    const prev = posts.find(p => p.id_post === postId);
    const prevReaction = prev?.user_reaction;
    setPosts(prev => prev.map(p => p.id_post === postId ? { ...p, user_reaction: p.user_reaction === type ? null : type } : p));
    try {
      const result: any = await api.toggleReaction(postId, type);
      setPosts(prev => prev.map(p => p.id_post === postId ? { ...p, reactions: result.reactions } : p));
    } catch (err) {
      setPosts(prev => prev.map(p => p.id_post === postId ? { ...p, user_reaction: prevReaction } : p));
      console.error('Error toggling reaction:', err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await api.deleteWallPost_new(postId);
      setPosts(prev => prev.filter(p => p.id_post !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleComment = async (postId: number, content: string) => {
    if (!user) return;
    try {
      await api.createWallComment_new(postId, content);
      const data: any = await api.getWallPosts('event', eventId, 1, 50, WALL_TYPE_FILTER);
      setPosts(data || []);
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await api.deleteWallComment_new(commentId);
      const data: any = await api.getWallPosts('event', eventId, 1, 50, WALL_TYPE_FILTER);
      setPosts(data || []);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div className="space-y-10">
      <PostComposer onSubmit={handlePost} />
      <PostFeed
        posts={posts}
        loading={loading}
        onReact={handleReact}
        onDelete={handleDeletePost}
        onComment={handleComment}
        onShare={handleShare}
        onDeleteComment={handleDeleteComment}
        showDelete={(post) => modRoles || post.id_user === user?.uid}
        canDeleteComment={(comment) => modRoles || comment.id_user === user?.uid || (posts.find(p => p.comments?.some((c: any) => c.id_comment === comment.id_comment))?.id_user === user?.uid)}
      />
    </div>
  );
};

const LiveChat: React.FC<{ eventId: string; isModerator: boolean; organizerId: string; onOnlineCountChange: (n: number) => void }> = ({ eventId, isModerator: propIsModerator, organizerId, onOnlineCountChange }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const { profile, getSocketToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modRoles = propIsModerator || profile?.role === 'admin' || profile?.role === 'moderator';

  useEffect(() => {
    const token = getSocketToken();
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join-event', eventId);
    });

    socket.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history);
      setHasMore(history.length >= 20);
      setLoadingHistory(false);
    });

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('older-messages', (older: ChatMessage[]) => {
      setMessages(prev => [...older, ...prev]);
      setHasMore(older.length >= 20);
      setLoadingHistory(false);
    });

    socket.on('user-joined', (data: { totalUsers: number }) => {
      onOnlineCountChange(data.totalUsers);
    });

    socket.on('user-left', (data: { totalUsers: number }) => {
      onOnlineCountChange(data.totalUsers);
    });

    socket.on('room-info', (data: { userCount: number }) => {
      onOnlineCountChange(data.userCount);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket.io connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave-event', eventId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId, getSocketToken, onOnlineCountChange]);

  const loadOlder = () => {
    if (loadingHistory || !hasMore || messages.length === 0) return;
    setLoadingHistory(true);
    const oldest = messages[0];
    socketRef.current?.emit('load-messages', {
      eventId,
      before: oldest.timestamp,
    });
  };

  // Enable pagination — user scrolls to top, emit load-messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop < 50 && hasMore && !loadingHistory) {
        loadOlder();
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasMore, loadingHistory, messages]);

  const handleBlock = async (targetUserId: string) => {
    try {
      await api.blockUserFromEvent(eventId, targetUserId, 'Bloqueado por moderador');
      setShowBlockMenu(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div ref={scrollRef} className="flex flex-col gap-6 overflow-y-auto max-h-[500px] pr-2">
      {loadingHistory && (
        <div className="text-center py-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 animate-pulse">Cargando mensajes anteriores...</span>
        </div>
      )}
      {!hasMore && messages.length > 0 && (
        <div className="text-center py-2">
          <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/30">— No hay más mensajes —</span>
        </div>
      )}
      {messages.map(msg => (
        <div key={msg.id} className="flex gap-4 group">
          <img
            src={resolveAssetUrl(msg.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`}
            className="w-10 h-10 rounded-xl bg-surface-container-high object-cover" alt="chat-user"
          />
          <div className="flex-1 space-y-1">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary">{msg.displayName || 'Usuario'}</span>
                   <span className="text-[8px] text-on-surface-variant font-bold">{msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {modRoles && (
                    <>
                      <button onClick={() => setShowBlockMenu(showBlockMenu === msg.userId ? null : msg.userId)} className="p-1 rounded bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all" title="Bloquear usuario">
                        <ShieldCheck size={10} />
                      </button>
                    </>
                  )}
                </div>
             </div>
             <div className="p-4 rounded-2xl bg-surface-container-low text-sm text-on-surface-variant leading-relaxed shadow-sm">
                {msg.message}
             </div>
             {showBlockMenu === msg.userId && modRoles && (
               <div className="mt-2 p-3 rounded-xl bg-white border border-red-200 shadow-lg space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Bloquear usuario</p>
                 <button onClick={() => handleBlock(msg.userId)} className="w-full py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-500 hover:text-white transition-all">Bloquear de este evento</button>
                 <button onClick={() => setShowBlockMenu(null)} className="w-full py-2 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-all">Cancelar</button>
               </div>
             )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ChatMessageInput: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { user, profile } = useAuth();
  const [msg, setMsg] = useState('');
  const { getSocketToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getSocketToken();
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join-event', eventId);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave-event', eventId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId, getSocketToken]);

  const send = () => {
    if (!msg.trim() || !user) return;
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-message', {
        eventId,
        message: msg.trim(),
        messageType: 'chat',
      });
    }
    setMsg('');
  };

  return (
    <div className="relative">
      <input 
        type="text" 
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onFocus={() => { if (!user) document.dispatchEvent(new CustomEvent('show-login-prompt')); }}
        onKeyDown={(e) => e.key === 'Enter' && send()}
        placeholder="Escribe algo..." 
        className="w-full h-14 bg-white rounded-2xl pl-6 pr-14 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-primary/40 shadow-sm transition-all" 
      />
      <button 
        onClick={send}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-container shadow-lg shadow-primary/20 transition-all active:scale-90"
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default EventDetail;

