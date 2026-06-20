import React, { useState, useEffect } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, Zap, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { api, apiRequest } from '../services/apiClient';
import { UserAvatar } from '../components/ui/UserAvatar';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const result: any = await apiRequest('/api/notifications', { auth: true });
      setNotifications(result || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT', auth: true });
      setNotifications(prev => prev.map(n => n.id_notification === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}`, { method: 'DELETE', auth: true });
      setNotifications(prev => prev.filter(n => n.id_notification !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/mark-all-read', { method: 'PUT', auth: true });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={20} className="text-red-500" fill="currentColor" />;
      case 'comment': return <MessageSquare size={20} className="text-primary" />;
      case 'new_follower': return <UserPlus size={20} className="text-indigo-500" />;
      case 'event_update': return <Calendar size={20} className="text-amber-500" />;
      default: return <Bell size={20} className="text-on-surface-variant" />;
    }
  };

  if (loading) {
    return <div className="p-20 text-center font-black uppercase tracking-[0.4em] opacity-40 animate-pulse">Sincronizando Radar...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="flex items-end justify-between gap-6 px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[2rem] bg-surface-container-low flex items-center justify-center text-primary shadow-xl shadow-black/5 border border-outline-variant">
               <Bell size={32} />
            </div>
            <div>
              <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">CENTRO DE <span className="text-primary">ALERTAS</span></h1>
              <p className="text-on-surface-variant font-medium text-lg italic mt-1">Tu pulso social en tiempo real</p>
            </div>
          </div>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="h-12 px-8 rounded-2xl bg-primary/10 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all whitespace-nowrap"
          >
            MARCAR TODO COMO LEÍDO
          </button>
        )}
      </header>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n, index) => (
            <motion.div
              key={n.id_notification}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-4 sm:p-6 rounded-[2.5rem] border transition-all flex flex-col md:flex-row md:items-center gap-6 group relative",
                n.is_read ? "bg-white border-outline-variant/50 opacity-70 hover:opacity-100" : "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5"
              )}
            >
               {!n.is_read && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-r-full" />
               )}

               <div className="flex items-center gap-4 shrink-0">
                  <div className="relative">
                    <UserAvatar 
                      src={n.data?.fromPhoto} 
                      className="w-16 h-16 rounded-[1.5rem] object-cover bg-surface-container-high border-2 border-white shadow-sm" 
                      alt={n.title || 'Sistema'} 
                      size={28}
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white shadow-lg flex items-center justify-center border border-outline-variant/30">
                       {getIcon(n.type)}
                    </div>
                  </div>
               </div>

               <div className="flex-1 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                     <p className="text-lg font-medium leading-tight">
                         <span className="font-black italic text-on-surface">{n.title || 'Sistema'}</span> {n.message}
                     </p>
                     <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant shrink-0">
                        {format(new Date(n.created_at), "HH:mm '•' d 'de' MMMM", { locale: es })}
                     </span>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2">
                     {n.data?.targetLink && (
                       <Link 
                         to={n.data.targetLink} 
                         onClick={() => markAsRead(n.id_notification)}
                         className="h-8 px-4 rounded-xl bg-on-surface text-surface text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md"
                       >
                         VER DETALLE
                       </Link>
                     )}
                     <button 
                       onClick={() => deleteNotification(n.id_notification)}
                       className="p-2.5 rounded-xl hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 size={18} />
                     </button>
                  </div>
               </div>
            </motion.div>
          ))
        ) : (
          <div className="py-32 text-center space-y-6">
             <Zap size={80} className="mx-auto text-on-surface-variant opacity-10" />
             <div className="space-y-2">
                <h2 className="text-2xl font-black italic tracking-tight opacity-40 uppercase">SILENCIO TOTAL</h2>
                <p className="text-on-surface-variant font-medium max-w-xs mx-auto">No hay nuevas alertas por ahora. ¡Andá a vivir aventuras!</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
