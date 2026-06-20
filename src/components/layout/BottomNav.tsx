import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

const items = [
  { name: 'Inicio', icon: 'home', path: '/' },
  { name: 'Feed', icon: 'dynamic_feed', path: '/feed' },
  { name: 'Explorar', icon: 'explore', path: '/events' },
  { name: 'Mapa', icon: 'map', path: '/map' },
  { name: 'Social', icon: 'groups', path: '/community' },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-t border-outline-variant/30 z-50 flex items-center justify-around px-2 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[56px]",
              isActive
                ? "text-primary"
                : "text-on-surface-variant/60 hover:text-on-surface-variant"
            )}
          >
            <span className={cn(
              "material-symbols-outlined text-[22px] transition-transform",
              isActive ? "scale-110" : ""
            )}>
              {item.icon}
            </span>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest",
              isActive ? "opacity-100" : "opacity-60"
            )}>
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
