import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Users, Heart, Share2, Send, MessageSquare, 
  ShieldCheck, Ticket as TicketIcon, ThumbsUp, Reply, 
  Instagram, Twitter, Globe, Info, Megaphone, Users2,
  X, Image as ImageIcon, Plus, CheckCircle2, Trash2, Gavel
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoginPromptModal } from '../components/ui/LoginPromptModal';
import { createNotification } from '../services/notificationService';
import { api } from '../services/apiClient';

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
  content: string;
  createdAt: any;
  userDisplayName?: string;
  userPhotoURL?: string;
}

const EventDetail: React.FC = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'announcements' | 'community'>('info');
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [organizerEvents, setOrganizerEvents] = useState<any[]>([]);

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
        const media = data.thumbnail_url ? [data.thumbnail_url] : [];
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
          image: data.thumbnail_url || media[0] || '',
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
            logo: organizerData.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${organizerData.name}`,
            ownerId: organizerData.id_creator,
            socials: {},
          });

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
        createNotification('like', 'Evento Guardado', `Has guardado "${event?.title}" en tus favoritos.`);
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
    <div className="relative">
      <LoginPromptModal 
        isOpen={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)} 
                    title="Acceso Requerido"
        message="Registrate o inicia sesión para comprar entradas, participar en la comunidad y chatear en vivo."
      />
      
      {/* Image Gallery Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-10"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-10 right-10 w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={selectedImage} 
              className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-6 lg:gap-10">
        {/* Left Column: Event Core & Community */}
        <div className="col-span-12 lg:col-span-8 space-y-8 lg:space-y-12 min-w-0">
          {/* Gallery Header */}
          <section className="relative h-[300px] lg:h-[500px] rounded-[1.5rem] lg:rounded-[3.5rem] overflow-hidden group">
            <div className="grid grid-cols-4 grid-rows-2 h-full gap-1 lg:gap-2 cursor-pointer">
              <div 
                className="col-span-4 lg:col-span-3 row-span-2 relative overflow-hidden"
                onClick={() => setSelectedImage(event.media?.[0])}
              >
                <img 
                  src={event.media?.[0]} 
                  alt={event.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </div>
              <div 
                className="hidden lg:block col-span-1 row-span-1 overflow-hidden"
                onClick={() => setSelectedImage(event.media?.[1] || "https://images.unsplash.com/photo-1514525253344-991422748105?auto=format&fit=crop&q=80")}
              >
                <img 
                  src={event.media?.[1] || "https://images.unsplash.com/photo-1514525253344-991422748105?auto=format&fit=crop&q=80"} 
                  alt="Gallery 1" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div 
                className="hidden lg:block col-span-1 row-span-1 relative overflow-hidden"
                onClick={() => setSelectedImage(event.media?.[2] || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80")}
              >
                <img 
                  src={event.media?.[2] || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80"} 
                  alt="Gallery 2" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">+{event.media?.length ? Math.max(0, event.media.length - 3) : 0} fotos</span>
                </div>
              </div>
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

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Ubicación</h3>
                      <div className="h-64 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden border border-outline-variant bg-surface-container-low group">
                        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
                          <Map
                            defaultCenter={{ lat: event.location.lat, lng: event.location.lng }}
                            defaultZoom={15}
                            gestureHandling={'greedy'}
                            disableDefaultUI={true}
                            mapId="9s8d7f6g5h4j3k2l1" // Fake Map ID for internalUsageAttributionIds compliance
                          >
                             <Marker position={{ lat: event.location.lat, lng: event.location.lng }} />
                          </Map>
                        </APIProvider>
                        <div className="p-3 lg:p-4 flex items-center gap-3 bg-surface-container-low">
                          <MapPin size={18} className="text-primary" />
                          <span className="text-xs lg:text-sm font-medium">{event.location.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 lg:space-y-10">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Calendario</h3>
                      <div className="p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] bg-surface-container-low border border-outline-variant flex items-center gap-6 lg:gap-8">
                         <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary/10 rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center text-primary">
                            <span className="text-2xl lg:text-3xl font-black">{format(eventDate, 'dd')}</span>
                            <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">{format(eventDate, 'MMM', { locale: es })}</span>
                         </div>
                         <div>
                            <h4 className="text-xl lg:text-2xl font-black italic">{format(eventDate, 'EEEE', { locale: es })}</h4>
                            <p className="text-sm lg:text-on-surface-variant font-medium">{format(eventDate, 'HH:mm')} HS</p>
                         </div>
                      </div>
                    </div>

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
                          <button onClick={() => navigate('/organizer')} className="w-full h-10 lg:h-12 rounded-xl lg:rounded-2xl bg-white border border-outline-variant font-bold text-[10px] lg:text-xs uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all">Ver Perfil Completo</button>
                        </div>
                      </div>
                    )}

                    {organizerEvents.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold uppercase tracking-widest opacity-60">Otros Eventos de {organizer?.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {organizerEvents.slice(0, 4).map(orgEvent => {
                            const isPast = new Date(orgEvent.date) < new Date();
                            return (
                              <button
                                key={orgEvent.id_event}
                                onClick={() => window.location.href = `/events/${orgEvent.id_event}`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all text-left group"
                              >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                  <Calendar size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{orgEvent.title}</p>
                                  <p className="text-[10px] text-on-surface-variant">
                                    {new Date(orgEvent.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    {isPast ? ' · Pasado' : ' · Próximo'}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
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
                  <EventAnnouncements eventId={id!} organizerId={event.organizerId} />
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
                  <EventWall eventId={id!} organizerOwnerId={organizer?.ownerId} eventTitle={event.title} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Right Column: Interaction & Tickets */}
        <div className="col-span-12 lg:col-span-4 space-y-6 lg:space-y-8 relative lg:sticky lg:top-28 self-start">
           <section className="p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] bg-linear-to-br from-primary-container/20 to-surface border border-primary/20 shadow-2xl shadow-primary/10 space-y-8 lg:space-y-10">
              <div className="space-y-4">
                 <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-black">ENTRADAS DESDE</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-6xl font-black italic tracking-tighter text-on-surface">${event.price.toFixed(2)}</span>
                    <span className="px-3 py-1 rounded bg-tertiary/10 text-tertiary text-[9px] lg:text-[10px] font-black tracking-widest uppercase whitespace-nowrap">
                      {Math.round((event.attendeesCount / event.capacity) * 100)}% Vendido
                    </span>
                 </div>
              </div>

              <div className="space-y-4">
                 <button 
                  onClick={() => handleInteraction()}
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
                <div className="flex items-center gap-3 py-3 lg:py-4 px-4 lg:px-6 rounded-2xl lg:rounded-3xl bg-surface-container-low border border-outline-variant">
                   <div className="flex items-center -space-x-3">
                      {[1, 2, 3, 4].map(n => (
                        <img 
                          key={n} 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${n+12}`} 
                          className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-surface bg-surface-container-high" 
                          alt="Attendee"
                        />
                      ))}
                   </div>
                   <p className="text-[9px] lg:text-[11px] text-on-surface-variant font-bold uppercase tracking-wide">Y otros se han unido</p>
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
                <div className="px-3 py-1 rounded bg-primary/10 text-primary text-[10px] font-black uppercase">412 ONLINE</div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                <LiveChat eventId={event.id} />
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

const EventAnnouncements: React.FC<{ eventId: string; organizerId: string }> = ({ eventId, organizerId }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data: any = await api.getEventPosts(eventId, 'announcement', 1, 50);
        const mapped = (data || []).map((item: any) => ({
          id: String(item.id_post || item.id),
          title: 'Anuncio',
          content: item.content,
          createdAt: item.created_at,
          media: [],
        }));
        setAnnouncements(mapped);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [eventId]);

  if (loading) return <div className="py-10 text-center opacity-50">Cargando anuncios...</div>;

  if (announcements.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 glass rounded-[3rem]">
        <Megaphone size={40} className="mx-auto text-on-surface-variant/30" />
        <p className="text-on-surface-variant font-medium">No hay anuncios oficiales todavía.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {announcements.map(ann => (
        <div key={ann.id} className="p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] bg-indigo-50/20 border border-indigo-100 space-y-6 relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
             <div className="space-y-1">
                <span className="text-[9px] lg:text-[10px] font-black italic text-indigo-500 uppercase tracking-widest">COMUNICADO OFICIAL</span>
                <h3 className="text-2xl lg:text-3xl font-black italic tracking-tight uppercase leading-none">{ann.title}</h3>
                <p className="text-[9px] lg:text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                  {ann.createdAt ? format(new Date(ann.createdAt), 'PPP', { locale: es }) : 'N/A'}
                </p>
             </div>
             <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl lg:rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <Megaphone size={20} />
             </div>
          </div>
          <p className="text-base lg:text-lg text-on-surface-variant leading-relaxed relative z-10">{ann.content}</p>
          {ann.media && ann.media.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {ann.media.map((m, i) => (
                <img key={i} src={m} className="w-full h-40 lg:h-48 object-cover rounded-2xl lg:rounded-3xl" alt="Ann photo" />
              ))}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full translate-x-20 translate-y-20 group-hover:scale-110 transition-transform" />
        </div>
      ))}
    </div>
  );
};

const EventWall: React.FC<{ eventId: string; organizerOwnerId?: string; eventTitle: string }> = ({ eventId, organizerOwnerId, eventTitle }) => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<string>('comment');
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data: any = await api.getEventPosts(eventId, undefined, 1, 50);
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

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    try {
      const created: any = await api.createEventPost(eventId, { content: newPost, type: postType });
      if (created) {
        setPosts(prev => [created, ...prev]);
      }
      setNewPost('');

      if (organizerOwnerId && organizerOwnerId !== user.uid) {
        // Notification logic...
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
    try {
      const result: any = await api.toggleEventPostLike(postId);
      setPosts(prev => prev.map(p => p.id_post === postId ? { ...p, likes_count: result.likes_count } : p));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await api.deleteEventPost(postId);
      setPosts(prev => prev.filter(p => p.id_post !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const isModerator = profile?.role === 'admin' || profile?.role === 'moderator';

  return (
    <div className="space-y-10">
      {/* Create Post */}
      <div className="p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] bg-surface-container-low border border-outline-variant space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
          <div className="flex items-center gap-4 sm:block sm:gap-0">
             <img 
               src={profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`} 
               className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-surface-container-high ring-4 ring-white shadow-lg" 
               alt="Me"
             />
             <h4 className="sm:hidden font-bold">{profile?.displayName || 'Tú'}</h4>
          </div>
          <div className="flex-1 space-y-4">
             <textarea 
               value={newPost}
               onChange={(e) => setNewPost(e.target.value)}
               onFocus={() => { if (!user) document.dispatchEvent(new CustomEvent('show-login-prompt')); }}
               placeholder="¿Qué tienes en mente?"
               className="w-full bg-transparent border-none outline-none text-base lg:text-xl font-medium placeholder:text-on-surface-variant/40 resize-none min-h-[80px] lg:min-h-[100px] pt-1"
             />
             <div className="flex flex-wrap gap-2">
                {[
                  { id: 'comment', name: 'Comentario', icon: MessageSquare },
                  { id: 'query', name: 'Pregunta', icon: Info },
                  { id: 'poll', name: 'Encuesta', icon: GridIcon },
                  { id: 'feedback', name: 'Feedback', icon: ThumbsUp }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setPostType(t.id as any)}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border",
                      postType === t.id ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant hover:border-primary/30"
                    )}
                  >
                    <t.icon size={14} />
                    {t.name}
                  </button>
                ))}
             </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-outline-variant/30">
          <div className="flex gap-2">
             <button className="p-3 rounded-2xl bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all"><ImageIcon size={20} /></button>
          </div>
          <button 
            disabled={!newPost.trim()}
            onClick={handlePost}
            className="btn-primary h-14 px-10 text-[11px] font-black uppercase tracking-widest disabled:opacity-30"
          >
            PUBLICAR EXPERIENCIA
          </button>
        </div>
      </div>

      {/* Wall Stream */}
      <div className="space-y-6 lg:space-y-8">
        {posts.map(post => (
          <div key={post.id_post} className="p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[4rem] bg-white border border-outline-variant hover:border-primary/20 transition-all space-y-6 lg:space-y-8 group">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 lg:gap-5">
                <div className="relative">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id_user}`} className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-surface-container-high" alt="Avatar" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-primary border-4 border-white flex items-center justify-center">
                    <CheckCircle2 size={10} className="text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base lg:text-lg font-black italic tracking-tight">{post.author}</h4>
                  <p className="text-[9px] lg:text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em]">{post.created_at ? format(new Date(post.created_at), 'HH:mm • d MMM', { locale: es }) : 'Reciente'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(isModerator || post.id_user === user?.uid) && (
                  <button 
                    onClick={() => handleDeletePost(post.id_post)}
                    className="p-2 rounded-lg bg-red-50 text-red-500 border border-red-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  post.type === 'query' ? "bg-amber-50 text-amber-600 border-amber-200" :
                  post.type === 'feedback' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                  "bg-surface-container-high text-on-surface-variant border-transparent"
                )}>
                  {post.type}
                </div>
              </div>
            </div>

            <p className="text-xl lg:text-2xl font-medium text-on-surface leading-tight tracking-tight">
              {post.content}
            </p>

            <div className="flex gap-4 lg:gap-8 pt-6 lg:pt-8 border-t border-outline-variant/30">
              <button 
                onClick={() => handleToggleLike(post.id_post)}
                className="flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all"
              >
                <ThumbsUp className="w-4 h-4 lg:w-[18px] lg:h-[18px]" /> 
                {post.likes_count > 0 ? post.likes_count : 'Me gusta'}
              </button>
              <button className="flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all">
                <MessageSquare className="w-4 h-4 lg:w-[18px] lg:h-[18px]" /> 
                {post.comments?.length > 0 ? `${post.comments.length} Comentarios` : 'Comentar'}
              </button>
              <button className="hidden sm:flex items-center gap-3 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all ml-auto">
                <Share2 size={18} />
              </button>
            </div>

            {post.comments?.length > 0 && (
              <div className="space-y-4 pt-4 ml-6 lg:ml-10 border-l-2 border-outline-variant/30 pl-6">
                 {post.comments.map((comment: any) => (
                   <div key={comment.id_comment} className="space-y-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black italic">{comment.author}</span>
                         <span className="text-[8px] text-on-surface-variant font-bold uppercase">{format(new Date(comment.created_at), 'HH:mm • d MMM', { locale: es })}</span>
                      </div>
                      <p className="text-sm lg:text-base text-on-surface-variant">{comment.content}</p>
                   </div>
                 ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const LiveChat: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { profile } = useAuth();
  const isModerator = profile?.role === 'admin' || profile?.role === 'moderator';

  useEffect(() => {
    const q = query(collection(db, `events/${eventId}/chat`), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage)).reverse());
    });
  }, [eventId]);

  const handleDelete = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, `events/${eventId}/chat`, msgId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {messages.map(msg => (
        <div key={msg.id} className="flex gap-4 group">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`} className="w-10 h-10 rounded-xl bg-surface-container-high" alt="chat-user" />
          <div className="flex-1 space-y-1">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary">USER_{msg.userId.slice(0, 4)}</span>
                   <span className="text-[8px] text-on-surface-variant font-bold">{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : ''}</span>
                </div>
                {isModerator && (
                  <button 
                    onClick={() => handleDelete(msg.id)}
                    className="p-1 rounded bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
             </div>
             <div className="p-4 rounded-2xl bg-surface-container-low text-sm text-on-surface-variant leading-relaxed shadow-sm">
                {msg.content}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ChatMessageInput: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { user } = useAuth();
  const [msg, setMsg] = useState('');

  const send = async () => {
    if (!msg.trim() || !user) return;
    const content = msg;
    setMsg('');
    try {
      await addDoc(collection(db, `events/${eventId}/chat`), {
        userId: user.uid,
        content,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
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

// --- Helper Icon ---
const GridIcon = (props: any) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

export default EventDetail;

