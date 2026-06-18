import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, NO_EVENT_IMAGE } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPromptModal } from '../components/ui/LoginPromptModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { api, resolveAssetUrl } from '../services/apiClient';
import { Calendar, MapPin, Share2, Bookmark, Loader2, ThumbsUp, MessageSquare } from 'lucide-react';
import { AdBanner } from '../components/ui/AdBanner';
import PostCard from '../components/wall/PostCard';

const CYCLE_MS = 4000;

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedEvents, setSavedEvents] = useState<Record<string, boolean>>({});
  const [imageIndex, setImageIndex] = useState(0);
  const [fadingMap, setFadingMap] = useState<Record<string, string>>({});

  useEffect(() => {
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

  const handleReact = async (postId: number, type: string) => {
    if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
    setEvents(prevEvents => prevEvents.map(ev => ev.id_event === postId ? ({
      ...ev,
      // Logic for updating reaction counts locally (optional, for immediate feedback)
    }) : ev));
    try {
      // Assuming event.id_event is the wallId for the post in the feed
      const result: any = await api.toggleReaction(postId, type);
      setEvents(prevEvents => prevEvents.map(ev => ev.id_event === postId ? { ...ev, reactions: result.reactions } : ev));
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await api.deleteWallPost_new(postId);
      setEvents(prevEvents => prevEvents.filter(ev => ev.id_event !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleComment = async (postId: number, content: string) => {
    if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
    try {
      await api.createWallComment_new(postId, content);
      // Re-fetch posts or update locally
      const result: any = await api.getEvents(1, 20); // This should ideally be a wall-specific fetch
      const apiEvents = Array.isArray(result) ? result : (result?.data || []);
      setEvents(apiEvents);
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleSharePost = async (content: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'QueSale', text: content, url: window.location.href });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${content} — ${window.location.href}`);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await api.deleteWallComment_new(commentId);
      // Re-fetch posts or update locally
      const result: any = await api.getEvents(1, 20); // This should ideally be a wall-specific fetch
      const apiEvents = Array.isArray(result) ? result : (result?.data || []);
      setEvents(apiEvents);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleVotePoll = async (postId: number, optionId: number) => {
    if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
    try {
      // Assuming event.id_event is the wallId for the post in the feed
      const result: any = await api.votePoll(postId, optionId, postId.toString()); // Assuming postId is also wallId
      if (result?.post) {
        setEvents(prevEvents => prevEvents.map(ev => ev.id_event === postId ? result.post : ev));
      }
    } catch (err) {
      console.error('Error voting on poll:', err);
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

      {events.map((event, index) => {
        // Assume posts in the feed are actually events for now, or re-evaluate API structure
        // For now, treating each event as a "post" in the feed to re-use PostCard
        return (
          <React.Fragment key={event.id_event}>
            <div className="w-full h-full snap-start p-4 lg:p-8">
              <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-black shadow-2xl flex flex-col justify-end border border-white/5 group">
                <PostCard
                  post={{
                    id_post: event.id_event, // Assuming event ID can be used as post ID for reactions
                    content: event.description,
                    media: event.images?.map(resolveAssetUrl),
                    author: event.creator?.username || event.organizer?.name,
                    author_photo_url: event.creator?.profile?.photo_url || event.organizer?.logo_url,
                    created_at: event.date,
                    user_reaction: event.user_reaction, // Needs to come from API
                    reactions: event.reactions, // Needs to come from API
                    comments: event.comments, // Needs to come from API
                    user: event.creator, // For premium checks etc.
                    type: 'event', // Indicate it's an event post
                  }}
                  onReact={handleReact}
                  onDelete={handleDeletePost}
                  onComment={handleComment}
                  onShare={handleSharePost}
                  onDeleteComment={handleDeleteComment}
                  onVotePoll={handleVotePoll}
                  showDelete={event.creator?.id_user === user?.uid || user?.global_role === 'admin'}
                  canDeleteComment={(comment) => comment.id_user === user?.uid || user?.global_role === 'admin'}
                />
              </div>
            </div>

            {/* Show an Ad after every 4 events */}
            {(index + 1) % 4 === 0 && (
              <div className="w-full h-full snap-start p-4 lg:p-8 flex items-center justify-center">
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
