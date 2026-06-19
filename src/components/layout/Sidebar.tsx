import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AdBanner } from '../ui/AdBanner';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth() as any;
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

      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 sidebar-gradient border-r border-primary/20 shadow-[10px_0_30px_rgba(0,0,0,0.3)] flex flex-col p-6 z-[70] transition-all duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between mb-10 shrink-0">
          <Link to="/" className="cursor-pointer">
            <h1 className="text-3xl font-display font-extrabold text-white leading-tight tracking-tighter">
              QueSale<span className="text-secondary">.</span>
            </h1>
            <p className="font-mono text-[10px] text-secondary font-bold uppercase tracking-[0.2em] opacity-80">Eventos & Cultura</p>
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-primary text-white font-bold shadow-lg shadow-primary/30" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <span className={cn(
                "material-symbols-outlined text-[24px]",
                "transition-transform group-hover:scale-110 duration-300"
              )}>{item.icon}</span>
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

      </aside>
    </>
  );
};
