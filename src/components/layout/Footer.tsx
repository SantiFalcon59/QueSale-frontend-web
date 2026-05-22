import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 bg-surface-dark text-on-surface-dark border-t border-primary/30 relative overflow-hidden">
      {/* Footer background effects */}
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
            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-secondary hover:bg-white/10 transition-all border border-white/5">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-secondary hover:bg-white/10 transition-all border border-white/5">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-secondary hover:bg-white/10 transition-all border border-white/5">
              <span className="material-symbols-outlined text-[20px]">terminal</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h5 className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-2">Explorar</h5>
          <Link to="/discovery" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Eventos</Link>
          <Link to="/map" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Mapa Local</Link>
          <Link to="/communities" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Comunidades</Link>
        </div>

        <div className="flex flex-col gap-4">
          <h5 className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-2">Protocolos</h5>
          <Link to="/tos" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Términos</Link>
          <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Privacidad</a>
          <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">Seguridad</a>
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
          © 2024 QUESALE GEEK • SISTEMA OPERATIVO v2.0
        </div>
      </div>
    </footer>
  );
};
