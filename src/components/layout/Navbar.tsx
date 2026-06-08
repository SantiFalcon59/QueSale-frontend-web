import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { NotificationsPopover } from './NotificationsPopover';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

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
        
        <div className="relative w-full max-w-md group hidden sm:block">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-secondary transition-colors">search</span>
          <input 
            type="text"
            placeholder="Buscar eventos, lugares..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/40 transition-all text-white placeholder:text-white/30 outline-none"
          />
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
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/40 shadow-[0_0_15px_rgba(115,46,228,0.3)]">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-secondary text-[22px]">person</span>
                )}
              </div>
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
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/40">
                        {profile?.photoURL ? (
                          <img src={profile.photoURL} alt={profile.displayName || ''} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-secondary text-[20px]">person</span>
                        )}
                      </div>
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
                      Mis Organizaciones
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
