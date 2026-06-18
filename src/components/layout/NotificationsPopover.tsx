import React, { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, Zap, Calendar, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/apiClient';
import { UserAvatar } from '../ui/UserAvatar';

export const NotificationsPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const result: any = await apiRequest('/api/notifications?limit=20', { auth: true });
      setNotifications(result.data || []);
      setUnreadCount(result.meta?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT', auth: true });
      setNotifications(prev => prev.map(n => n.id_notification === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/mark-all-read', { method: 'PUT', auth: true });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={14} className="text-red-500" fill="currentColor" />;
      case 'comment': return <MessageSquare size={14} className="text-primary" />;
      case 'new_follower': return <UserPlus size={14} className="text-indigo-500" />;
      case 'event_update': return <Calendar size={14} className="text-amber-500" />;
      default: return <Bell size={14} className="text-on-surface-variant" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 hover:bg-surface-container-low rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all relative group"
      >
        <Bell size={20} className={cn(unreadCount > 0 && "animate-tada group-hover:animate-none")} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-3 w-80 lg:w-96 bg-white rounded-3xl shadow-2xl border border-outline-variant p-2 flex flex-col z-50 overflow-hidden"
          >
            <div className="p-5 flex items-center justify-between border-b border-outline-variant/30 mb-2">
               <h3 className="text-sm font-black uppercase tracking-widest italic">Notificaciones</h3>
               {unreadCount > 0 && (
                 <button 
                   onClick={markAllAsRead}
                   className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                 >
                   <Check size={10} />
                   Marcar todo
                 </button>
               )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto scrollbar-hide py-2">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <Link
                    key={n.id_notification}
                    to={n.data?.targetLink || '#'}
                    onClick={() => {
                       markAsRead(n.id_notification);
                       setIsOpen(false);
                    }}
                    className={cn(
                      "flex gap-4 p-4 rounded-2xl transition-all relative group/item",
                      n.is_read ? "hover:bg-surface-container-low opacity-60 hover:opacity-100" : "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    {!n.is_read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />}
                    
                    <div className="relative shrink-0">
                       <UserAvatar 
                         src={n.data?.fromPhoto} 
                         className="w-12 h-12 rounded-xl object-cover bg-surface-container-high" 
                         alt={n.data?.fromName || 'Sistema'} 
                         size={24}
                       />
                       <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white shadow-md flex items-center justify-center border border-outline-variant/30">
                          {getIcon(n.type)}
                       </div>
                    </div>

                    <div className="flex-1 space-y-1 overflow-hidden">
                       <p className="text-xs font-medium text-on-surface leading-snug">
                          <span className="font-black italic">{n.data?.fromName || 'Sistema'}</span> {n.message}
                       </p>
                       <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                          {format(new Date(n.created_at), "HH:mm '•' d MMM", { locale: es })}
                       </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-12 text-center space-y-4 opacity-30">
                   <Zap size={48} className="mx-auto" />
                   <p className="text-xs font-black uppercase tracking-widest">Todo al día, ciudadano</p>
                </div>
              )}
            </div>

            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="mt-2 p-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors border-t border-outline-variant/30"
            >
              Ver todo el historial 
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
