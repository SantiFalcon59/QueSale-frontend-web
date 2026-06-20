import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AdBanner } from '../ui/AdBanner';
import { UserAvatar } from '../ui/UserAvatar';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, profile, logout } = useAuth() as any;
  const navigate = useNavigate();
  const isPremium = profile?.is_premium || profile?.role === 'admin';

  const navItems = [
    { name: 'Inicio', icon: 'home', path: '/' },
    { name: 'Feed', icon: 'dynamic_feed', path: '/feed' },
    { name: 'Explorar', icon: 'explore', path: '/events' },
    { name: 'Mapa', icon: 'map', path: '/map' },
    { name: 'Comunidad', icon: 'groups', path: '/community' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80 || info.velocity.x < -200) {
            onClose();
          }
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className={cn(
          "fixed left-0 top-0 h-full w-64 sidebar-gradient border-r border-primary/20 shadow-[10px_0_30px_rgba(0,0,0,0.3)] flex flex-col p-6 z-[70] transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between mb-10 shrink-0">
          <Link to="/" className="cursor-pointer" onClick={onClose}>
            <h1 className="text-3xl font-display font-extrabold text-white leading-tight tracking-tighter">
              QueSale<span className="text-secondary">.</span>
            </h1>
            <p className="font-mono text-[10px] text-secondary font-bold uppercase tracking-[0.2em] opacity-80">Eventos & Cultura</p>
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all text-white">
            <X size={20} />
          </button>
        </div>

        {/* DESKTOP SIDEBAR VIEW */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0 justify-between">
          <nav className="flex flex-col gap-3 overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden",
                  isActive 
                    ? "bg-primary text-white font-bold shadow-lg shadow-primary/30" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="material-symbols-outlined text-[24px] transition-transform group-hover:scale-110 duration-300">{item.icon}</span>
                <span className="font-display text-sm uppercase tracking-wider">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Ad Slot — hidden for premium users */}
          {!isPremium && (
            <div className="mt-auto pt-6 border-t border-white/10">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 text-center mb-2">Publicidad</p>
              <div className="rounded-xl overflow-hidden bg-black/20 border border-white/5 min-h-[150px] flex items-center justify-center">
                <AdBanner 
                  client="ca-pub-YOUR_ADSENSE_CLIENT_ID" 
                  slot="YOUR_SIDEBAR_AD_SLOT" 
                  format="rectangle"
                  style={{ display: 'block' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* MOBILE SIDEBAR VIEW (Twitter-like Profile Drawer) */}
        <div className="flex lg:hidden flex-col flex-1 min-h-0 justify-between">
          <div className="space-y-6">
            {/* User Profile Info Section */}
            {user ? (
              <div className="pb-6 border-b border-white/10 flex flex-col gap-3">
                <Link to={profile?.username ? `/@${profile.username}` : '#'} onClick={onClose}>
                  <UserAvatar 
                    src={profile?.photoURL} 
                    alt={profile?.displayName || ''} 
                    className="w-16 h-16 rounded-2xl border-2 border-white/15 shadow-xl object-cover bg-white/5" 
                    size={28}
                  />
                </Link>
                <div>
                  <h4 className="text-lg font-black text-white leading-tight truncate">{profile?.displayName || profile?.username}</h4>
                  <p className="text-xs text-white/50 truncate">@{profile?.username}</p>
                </div>
              </div>
            ) : (
              <div className="pb-6 border-b border-white/10 flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-3xl">account_circle</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-white leading-tight">Invitado</h4>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Iniciá sesión para una mejor experiencia</p>
                </div>
                <Link 
                  to="/login" 
                  onClick={onClose} 
                  className="btn-primary h-12 w-full flex items-center justify-center text-xs font-black tracking-widest uppercase rounded-xl text-center"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}

            {/* Menu Links */}
            <nav className="flex flex-col gap-2">
              {user && (
                <>
                  <NavLink
                    to={profile?.username ? `/@${profile.username}` : '#'}
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[24px]">person</span>
                    <span className="font-display text-xs uppercase tracking-wider font-black">Mi Perfil</span>
                  </NavLink>

                  <NavLink
                    to="/favorites"
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[24px]">bookmark</span>
                    <span className="font-display text-xs uppercase tracking-wider font-black">Guardados</span>
                  </NavLink>

                  <NavLink
                    to="/organizer"
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[24px]">groups</span>
                    <span className="font-display text-xs uppercase tracking-wider font-black">Mi Organización</span>
                  </NavLink>

                  <NavLink
                    to="/my-tickets"
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
                    <span className="font-display text-xs uppercase tracking-wider font-black">Mis Entradas</span>
                  </NavLink>
                  
                  {(profile?.role === 'admin' || profile?.role === 'moderator') && (
                    <NavLink
                      to="/admin"
                      onClick={onClose}
                      className="flex items-center gap-4 px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                      <span className="font-display text-xs uppercase tracking-wider font-black text-secondary">Admin Dashboard</span>
                    </NavLink>
                  )}
                </>
              )}
            </nav>
          </div>

          {/* Logout Button at bottom if user is logged in */}
          {user && (
            <div className="pt-6 border-t border-white/10">
              <button
                onClick={async () => {
                  onClose();
                  await logout();
                  navigate('/');
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">logout</span>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

      </motion.aside>
    </>
  );
};
