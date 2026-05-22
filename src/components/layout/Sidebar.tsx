import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Inicio', icon: 'home', path: '/' },
    { name: 'Feed', icon: 'dynamic_feed', path: '/feed' },
    { name: 'Explorar', icon: 'explore', path: '/discovery' },
    { name: 'Mapa', icon: 'map', path: '/map' },
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
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-white leading-tight tracking-tighter">
              QueSale<span className="text-secondary">.</span>
            </h1>
            <p className="font-mono text-[10px] text-secondary font-bold uppercase tracking-[0.2em] opacity-80">Eventos & Cultura</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-3 flex-1">
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
              
              <AnimatePresence>
                {/* Active indicator dot */}
                <NavLink
                  to={item.path}
                  className={({ isActive }) => cn(
                    "absolute right-4 w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_10px_#00dbe7]",
                    !isActive && "hidden"
                  )}
                />
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-2">Comunidad</p>
            <p className="text-[11px] text-white/70 leading-relaxed font-medium">
              Conecta con más de <span className="text-white font-bold">5,000</span> personas en tu zona.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
