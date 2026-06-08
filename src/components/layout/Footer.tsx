import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .56.04.84.1V8.77a6.2 6.2 0 0 0-.84-.06A6.34 6.34 0 0 0 3.1 15.05a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.24 8.24 0 0 0 4.73 1.49V6.69Z"/>
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 bg-surface-dark text-on-surface-dark border-t border-primary/30 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 px-10 py-20 relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(0,219,231,0.2)]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h4 className="font-display text-2xl italic font-black text-white tracking-tighter uppercase">
              QueSale<span className="text-secondary">.</span>
            </h4>
          </div>
          <p className="text-white/60 text-sm max-w-xs leading-relaxed font-medium">
            La plataforma definitiva para el descubrimiento de eventos, comunidades y cultura geek en Buenos Aires y más allá.
          </p>
          <div className="flex gap-4 mt-2">
            <a href="https://instagram.com/quesale" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-[#E4405F] hover:bg-white/10 transition-all border border-white/5">
              <Instagram size={18} />
            </a>
            <a href="https://tiktok.com/@quesale" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">
              <TikTokIcon />
            </a>
            <a href="https://facebook.com/quesale" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-[#1877F2] hover:bg-white/10 transition-all border border-white/5">
              <Facebook size={18} />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h5 className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-2">Explorar</h5>
          <Link to="/events" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Explorar</Link>
          <Link to="/map" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Mapa Local</Link>
          <Link to="/communities" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Comunidades</Link>
        </div>

        <div className="flex flex-col gap-4">
          <h5 className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-2">Legal</h5>
          <Link to="/tos" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Términos</Link>
        </div>

        <div className="flex flex-col gap-6">
          <h5 className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-2">Misión</h5>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-inner">
            <p className="text-[10px] font-black leading-loose tracking-[0.15em] text-white/80 uppercase italic">
              "Conectamos a los que se sienten raros en lo común y comunes en lo raro."
            </p>
          </div>
        </div>

        <div className="col-span-full pt-16 mt-8 border-t border-white/5 text-center opacity-30 text-[9px] font-black tracking-[0.5em] uppercase text-white">
          © 2026 QUESALE • SISTEMA OPERATIVO v2.0
        </div>
      </div>
    </footer>
  );
};
