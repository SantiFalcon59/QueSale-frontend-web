import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { NotificationsPopover } from './NotificationsPopover';
import { motion, AnimatePresence } from 'motion/react';
import { api, resolveAssetUrl } from '../../services/apiClient';
import { UserAvatar } from '../ui/UserAvatar';
import { OrganizerAvatar } from '../ui/OrganizerAvatar';

export const Navbar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ events: any[]; users: any[]; organizers: any[] }>({ events: [], users: [], organizers: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults({ events: [], users: [], organizers: [] });
      setShowSearchResults(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [eventsRes, communityRes] = await Promise.all([
          api.getEventsWithFilters(`search=${encodeURIComponent(trimmed)}&limit=3`),
          api.communitySearch(trimmed),
        ]);
        setSearchResults({
          events: Array.isArray(eventsRes) ? eventsRes : (eventsRes?.events || []),
          users: communityRes.users || [],
          organizers: communityRes.organizers || [],
        });
        setShowSearchResults(true);
      } catch {
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-16 z-50 navbar-glass flex justify-between items-center px-8 transition-all duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all text-white"
        >
          <Menu size={24} />
        </button>
        
        <div className="relative w-full max-w-md group hidden sm:block" ref={searchRef}>
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-secondary transition-colors">search</span>
          <input
            type="text"
            placeholder="Buscar eventos, usuarios, organizaciones..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); }}
            onFocus={() => { if (searchResults.events.length || searchResults.users.length || searchResults.organizers.length) setShowSearchResults(true); }}
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/40 transition-all text-white placeholder:text-white/30 outline-none"
          />
          {searchLoading && (
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/40 animate-spin text-lg">progress_activity</span>
          )}
          <AnimatePresence>
            {showSearchResults && (searchResults.events.length > 0 || searchResults.users.length > 0 || searchResults.organizers.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-full mt-2 left-0 w-full rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
              >
                {searchResults.events.length > 0 && (
                  <div className="p-3 border-b border-white/10">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Eventos</p>
                    {searchResults.events.map(ev => (
                      <button
                        key={ev.id_event}
                        onClick={() => { setShowSearchResults(false); setSearchQuery(''); navigate(`/events/${ev.id_event}`); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors text-left cursor-pointer"
                      >
                        {ev.photo_url ? (
                          <img src={resolveAssetUrl(ev.photo_url)} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-secondary text-lg">event</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{ev.title}</p>
                          <p className="text-xs text-white/50 truncate">{ev.ubication || ev.location}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.users.length > 0 && (
                  <div className="p-3 border-b border-white/10">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Usuarios</p>
                    {searchResults.users.map(u => (
                      <button
                        key={u.id_user}
                        onClick={() => { setShowSearchResults(false); setSearchQuery(''); navigate(`/@${u.username}`); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors text-left cursor-pointer"
                      >
                        <UserAvatar 
                          src={u.photo_url} 
                          alt={u.username} 
                          className="w-10 h-10 rounded-full flex-shrink-0" 
                          size={18}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{u.display_name || u.username}</p>
                          <p className="text-xs text-white/50">@{u.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.organizers.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Organizaciones</p>
                    {searchResults.organizers.map(o => (
                      <button
                        key={o.id_organizer}
                        onClick={() => { setShowSearchResults(false); setSearchQuery(''); navigate(`/organizer/${o.id_organizer}`); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors text-left cursor-pointer"
                      >
                        <OrganizerAvatar 
                          src={o.logo_url} 
                          alt={o.name} 
                          className="w-10 h-10 rounded-xl flex-shrink-0" 
                          size={18}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{o.name}</p>
                          <p className="text-xs text-white/50">{o.category || 'Organización'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="p-2 border-t border-white/10">
                  <button
                    onClick={() => { setShowSearchResults(false); setSearchQuery(''); navigate(`/discovery?search=${encodeURIComponent(searchQuery)}`); }}
                    className="w-full text-center text-xs text-secondary font-semibold py-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                  >
                    Ver todos los resultados
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {user && <NotificationsPopover />}
        </div>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 pl-6 border-l border-white/10"
            >
              <UserAvatar 
                src={profile?.photoURL} 
                alt={profile?.displayName || ''} 
                className="w-9 h-9 rounded-xl shadow-[0_0_15px_rgba(115,46,228,0.3)]" 
                size={22}
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-white leading-none">{profile?.displayName || profile?.username || 'Mi Perfil'}</span>
              </div>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        src={profile?.photoURL} 
                        alt={profile?.displayName || ''} 
                        className="w-10 h-10 rounded-xl" 
                        size={20}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{profile?.displayName || profile?.username}</span>
                        <span className="text-xs text-white/50">@{profile?.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => { setDropdownOpen(false); navigate(profile?.username ? `/@${profile.username}` : '/'); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-white flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px] text-white/60">person</span>
                      Mi Perfil
                    </motion.button>
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => { setDropdownOpen(false); navigate('/favorites'); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-white flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px] text-white/60">bookmark</span>
                      Guardados
                    </motion.button>
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => { setDropdownOpen(false); navigate('/organizer'); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-white flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px] text-white/60">groups</span>
                      Mi Organización
                    </motion.button>
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => { setDropdownOpen(false); navigate('/my-tickets'); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-white flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px] text-white/60">qr_code_2</span>
                      Mis Entradas
                    </motion.button>
                    {profile?.role === 'admin' && (
                      <motion.button
                        whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        onClick={() => { setDropdownOpen(false); navigate('/admin'); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-white flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px] text-white/60">admin_panel_settings</span>
                        Admin Dashboard
                      </motion.button>
                    )}
                  </div>

                  <div className="border-t border-white/10 py-2">
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">logout</span>
                      Cerrar Sesión
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link 
            to="/login"
            className="bg-primary text-white px-8 py-2.5 rounded-xl font-display text-[11px] font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 uppercase tracking-[0.2em] border border-primary-container"
          >
            INGRESAR
          </Link>
        )}
      </div>
    </header>
  );
};
