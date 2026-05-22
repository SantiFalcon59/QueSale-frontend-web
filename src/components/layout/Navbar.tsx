import React from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { NotificationsPopover } from './NotificationsPopover';

export const Navbar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user } = useAuth();

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
          <button className="p-2 text-white/60 hover:text-secondary transition-colors hidden sm:block">
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
        </div>

        {user ? (
          <Link 
            to="/profile"
            className="flex items-center gap-3 pl-6 border-l border-white/10"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/40 shadow-[0_0_15px_rgba(115,46,228,0.3)]">
              <span className="material-symbols-outlined text-secondary text-[22px]">person</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-white leading-none">Mi Perfil</span>
              <span className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1">Nivel 5</span>
            </div>
          </Link>
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
