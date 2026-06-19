import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users, Heart, Globe, Instagram, Twitter, ShieldCheck, ChevronLeft, ExternalLink } from 'lucide-react';
import { api, resolveAssetUrl } from '../services/apiClient';
import { OrganizerAvatar } from '../components/ui/OrganizerAvatar';
import { useAuth } from '../context/AuthContext';
import { formatPrice, NO_EVENT_IMAGE } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const OrganizerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [organizer, setOrganizer] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!id || id === 'undefined') return;
    const fetch = async () => {
      try {
        const [orgData, evData, folData] = await Promise.all([
          api.getOrganizerById(id),
          api.getOrganizerEvents(id),
          api.getOrganizerFollowers(id),
        ]);
        setOrganizer(orgData);
        setEvents(Array.isArray(evData) ? evData : []);
        setFollowers(Array.isArray(folData) ? folData : []);
        setFollowing(orgData.is_following ?? false);
      } catch (err) {
        console.error('Error loading organizer profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const toggleFollow = async () => {
    if (!user) return;
    try {
      if (following) {
        await api.unfollowOrganizer(id!);
        setFollowing(false);
        setOrganizer(prev => ({ ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }));
      } else {
        await api.followOrganizer(id!);
        setFollowing(true);
        setOrganizer(prev => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-8 xl:px-12 max-w-[1400px] mx-auto py-20">
        <div className="space-y-8 animate-pulse">
          <div className="h-64 rounded-[3rem] bg-surface-container-low border border-outline-variant/30" />
          <div className="h-12 w-1/2 rounded-xl bg-surface-container-low" />
          <div className="h-8 w-1/3 rounded-xl bg-surface-container-low" />
        </div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="px-4 lg:px-8 xl:px-12 max-w-[1400px] mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-[2rem] bg-surface-container-low mx-auto flex items-center justify-center">
          <Users size={36} className="text-on-surface-variant/40" />
        </div>
        <h2 className="text-3xl font-black italic tracking-tight uppercase opacity-40">Organización no encontrada</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  const logoUrl = resolveAssetUrl(organizer.logo_url);
  const eventsCount = organizer.events_count ?? events.length;
  const followersCount = organizer.followers_count ?? followers.length;

  return (
    <div className="px-4 lg:px-8 xl:px-12 max-w-[1400px] mx-auto py-8 lg:py-12 space-y-10">
      <Link to="-1" className="inline-flex items-center gap-2 text-on-surface-variant font-bold text-xs uppercase tracking-widest hover:text-primary transition-all">
        <ChevronLeft size={16} /> Volver
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-[3rem] lg:rounded-[4rem] bg-white border border-outline-variant shadow-sm">
        <div className="absolute top-0 left-0 w-full h-32 lg:h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-center lg:items-start gap-8">
          <OrganizerAvatar 
            src={logoUrl} 
            alt={organizer.name} 
            className="w-28 h-28 lg:w-36 lg:h-36 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden bg-surface-container-high ring-4 ring-white shadow-xl shrink-0" 
            size={48}
          />
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <h1 className="text-3xl lg:text-5xl font-black italic tracking-tight uppercase leading-none">{organizer.name}</h1>
                {organizer.verified && (
                  <ShieldCheck size={24} className="text-primary shrink-0" fill="currentColor" />
                )}
              </div>
              <div className="flex items-center gap-4 justify-center lg:justify-start text-on-surface-variant font-bold text-xs uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {eventsCount} Eventos</span>
                <span className="flex items-center gap-1.5"><Heart size={14} /> {followersCount} Seguidores</span>
                {organizer.created_at && (
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> Creada el {format(new Date(organizer.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
                )}
              </div>
            </div>
            {organizer.description && (
              <p className="text-sm lg:text-base text-on-surface-variant leading-relaxed max-w-2xl">{organizer.description}</p>
            )}
            <div className="flex items-center gap-2 justify-center lg:justify-start pt-2 flex-wrap">
              {organizer.instagram && (
                <a href={`https://instagram.com/${organizer.instagram.replace('@', '')}`} target="_blank" className="h-9 px-3 rounded-xl bg-surface-container-low flex items-center gap-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all text-xs font-medium">
                  <Instagram size={14} />
                  <span>@{organizer.instagram.replace('@', '')}</span>
                </a>
              )}
              {organizer.tiktok && (
                <a href={`https://tiktok.com/@${organizer.tiktok.replace('@', '')}`} target="_blank" className="h-9 px-3 rounded-xl bg-surface-container-low flex items-center gap-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all text-xs font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
                  <span>@{organizer.tiktok.replace('@', '')}</span>
                </a>
              )}
              {organizer.twitter && (
                <a href={`https://twitter.com/${organizer.twitter.replace('@', '')}`} target="_blank" className="h-9 px-3 rounded-xl bg-surface-container-low flex items-center gap-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all text-xs font-medium">
                  <Twitter size={14} />
                  <span>@{organizer.twitter.replace('@', '')}</span>
                </a>
              )}
              {organizer.website && (
                <a href={organizer.website} target="_blank" className="h-9 px-3 rounded-xl bg-surface-container-low flex items-center gap-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all text-xs font-medium">
                  <Globe size={14} />
                  <span>{organizer.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                </a>
              )}
              <div className="flex-1" />
              {user && (
                <button
                  onClick={toggleFollow}
                  className={`h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    following
                      ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant hover:bg-red-50 hover:text-red-500'
                      : 'bg-primary text-white hover:bg-primary-container hover:text-primary'
                  }`}
                >
                  {following ? 'Siguiendo' : 'Seguir'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <section className="space-y-6">
        <h2 className="text-2xl lg:text-3xl font-black italic tracking-tight uppercase">Eventos</h2>
        {events.length === 0 ? (
          <div className="py-16 text-center space-y-4 glass rounded-[3rem]">
            <Calendar size={40} className="mx-auto text-on-surface-variant/30" />
            <p className="text-on-surface-variant font-medium">Esta organización aún no tiene eventos públicos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev, i) => (
              <motion.div
                key={ev.id_event}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white rounded-[2.5rem] border border-outline-variant hover:border-primary/50 transition-all overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5"
              >
                <Link to={`/events/${ev.id_event}`} className="block relative h-44 overflow-hidden">
                  <img
                    src={resolveAssetUrl(ev.thumbnail_url) || (ev.images?.[0] ? resolveAssetUrl(ev.images[0]) : undefined) || NO_EVENT_IMAGE}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </Link>
                <div className="p-6 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">EVENTO</span>
                    <Link to={`/events/${ev.id_event}`} className="block">
                      <h3 className="text-lg font-black italic tracking-tight group-hover:text-primary transition-colors leading-tight">{ev.title}</h3>
                    </Link>
                  </div>
                  <div className="space-y-1.5 text-[10px] font-bold text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-primary" />
                      {ev.date ? format(new Date(ev.date), "EEEE d 'de' MMMM", { locale: es }) : 'Fecha por confirmar'}
                    </div>
                    {ev.ubication && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-primary" />
                        {ev.ubication}
                      </div>
                    )}
                  </div>
                  <div className="pt-3 flex items-center justify-between border-t border-outline-variant/30">
                    <span className="text-[10px] font-black text-primary">{formatPrice(ev.price)}</span>
                    <Link to={`/events/${ev.id_event}`} className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                      <ExternalLink size={14} className="group-hover:text-white transition-colors" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>


    </div>
  );
};

export default OrganizerProfile;
