import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const heroImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const heroContainer = heroImageRef.current?.parentElement;
    if (!heroContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = heroContainer.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      
      if (heroImageRef.current) {
        heroImageRef.current.style.transform = `scale(1.05) translate(${x * 20}px, ${y * 20}px)`;
      }
    };

    const handleMouseLeave = () => {
      if (heroImageRef.current) {
        heroImageRef.current.style.transform = `scale(1) translate(0, 0)`;
      }
    };

    heroContainer.addEventListener('mousemove', handleMouseMove as any);
    heroContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      heroContainer.removeEventListener('mousemove', handleMouseMove as any);
      heroContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-16 lg:py-24 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] -z-10 rounded-full"></div>
        
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="label-caps bg-primary/10 text-primary px-6 py-2 rounded-full border border-primary/20 mb-8 uppercase tracking-[0.2em]"
        >
          Encuentra tu próximo evento
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold mb-8 leading-[1.1] max-w-4xl text-on-surface tracking-tight"
        >
          VIVE TU PASIÓN <span className="text-primary italic">AHORA</span>.
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg lg:text-xl text-on-surface-variant max-w-2xl mb-12 font-sans font-medium leading-relaxed"
        >
          QueSale te conecta con las mejores experiencias de tu ciudad. Encuentra convenciones, festivales, torneos y encuentros culturales hoy mismo.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <Link 
            to="/discovery"
            className="bg-primary text-on-primary font-display font-bold px-10 py-4 rounded-xl flex items-center gap-3 neon-glow transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-[0px]"
          >
            DESCUBRIR EVENTOS
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
          <Link 
            to="/map"
            className="bg-surface-container-high text-on-surface font-display font-bold px-10 py-4 rounded-xl hover:bg-surface-container-highest transition-colors border border-outline-variant"
          >
            VER MAPA
          </Link>
        </motion.div>

        {/* Hero Image Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 w-full max-w-5xl aspect-video rounded-3xl overflow-hidden glass-card p-2 border border-outline-variant/30 shadow-xl"
        >
          <img 
            ref={heroImageRef}
            alt="Gaming tournament event" 
            className="w-full h-full object-cover rounded-2xl transition-transform duration-200 ease-out" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuABhI57qMNzpRBy9-w9qf1rGaLcbd5Mu3Wp8emWBtBxxlLky-igQYYJc-hZDLRsI18R7YSJMfNR8zCp0LNyJUNMx4AB2dOeJSa4auoeKMfUVHCiNHla_jHmVcnamimytNWGQXMsqsg-MDLGBE86yuDuJ5pNVZVU7pbmmyF93RpPK8eb6zvIvwy6A2zwhAsyOYM9RvrkSWLwAm-jJs86Jin8zdJmMQ-98_nCBnZ5lLIEaEx6tJFBipy0O7GcTt5u1OKIc6ec44gaPt4A"
          />
        </motion.div>
      </section>

      {/* Features Bento Grid */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24">
        <div className="bento-grid min-h-[600px]">
          {/* Feed Personalizado */}
          <div className="col-span-12 md:col-span-7 glass-card rounded-3xl p-10 lg:p-12 flex flex-col justify-end relative overflow-hidden group border-outline-variant/50 min-h-[400px]">
            <img 
              className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:scale-105 transition-transform duration-700 -z-10" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5nYX-1zFmnV8u20b6cL7RuGEvAeNDFQKIX_W37vOgh7pV3vusXRCG8OqtJoZ3-gNULbgM1FwrpJqf1B_B3oC6CFMtCkYqjCvFlZLaAOPe7ZziuY480LmEkVyYeO4KV6Ug-iPKHshNWgR2fdGF0_lW6gw8QpjgqDRgEpfgmFfLko7RKHkTsUE7UwgGyWtItSaVofg2p3op7hE_7qV6Mq0m8MUo9OgnHsZYr5jsjUgdv8Ohrn4xaDOtIk15RZyS0PozHDp6udPDHpgJ"
              alt="Background"
            />
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-[28px]">trending_up</span>
            </div>
            <h3 className="text-3xl font-display font-extrabold text-on-surface mb-4">Feed Personalizado.</h3>
            <p className="text-base text-on-surface-variant max-w-md font-medium leading-relaxed">Encuentra eventos de tus nichos favoritos. Desde festivales urbanos hasta proyecciones exclusivas.</p>
          </div>

          {/* Entradas Digitales */}
          <div className="col-span-12 md:col-span-5 bg-primary rounded-3xl p-10 lg:p-12 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden min-h-[400px]">
            <div className="absolute top-4 right-4 opacity-10">
              <span className="material-symbols-outlined text-white text-[120px] font-thin" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
            </div>
            <span className="material-symbols-outlined text-on-primary text-6xl mb-6">auto_awesome</span>
            <h3 className="text-3xl font-display font-extrabold text-on-primary mb-4">Entradas Digitales.</h3>
            <p className="text-base text-on-primary/90 font-medium leading-relaxed">Gestiona tus entradas de forma segura y rápida. Sin complicaciones, directo en tu móvil.</p>
          </div>

          {/* Mapa de Eventos */}
          <div className="col-span-12 md:col-span-5 glass-card rounded-3xl p-10 lg:p-12 flex flex-col justify-between border-primary/10 min-h-[400px]">
            <div>
              <div className="bg-surface-container-highest w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-outline-variant">
                <span className="material-symbols-outlined text-primary text-[28px]">map</span>
              </div>
              <h3 className="text-3xl font-display font-extrabold text-on-surface mb-4">Mapa de Eventos.</h3>
              <p className="text-base text-on-surface-variant font-medium leading-relaxed">Visualiza dónde están ocurriendo los mejores encuentros en tiempo real.</p>
            </div>
            <div className="w-full h-40 rounded-2xl bg-surface-container-low mt-8 overflow-hidden grayscale opacity-40 border border-outline-variant relative">
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 to-transparent">
                <span className="material-symbols-outlined text-primary animate-bounce text-4xl">location_on</span>
              </div>
            </div>
          </div>

          {/* Comunidad Segura */}
          <div className="col-span-12 md:col-span-7 glass-card rounded-3xl p-10 lg:p-12 flex items-center gap-12 border-outline-variant/50 min-h-[400px]">
            <div className="flex-1">
              <div className="bg-surface-container-highest w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-[28px]">verified_user</span>
              </div>
              <h3 className="text-3xl font-display font-extrabold text-on-surface mb-4">Comunidad Segura.</h3>
              <p className="text-base text-on-surface-variant font-medium leading-relaxed">Conéctate con otros de forma segura. Privacidad total en tus interacciones y asistencia.</p>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4 flex-1">
              <div className="aspect-square bg-surface-container-highest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
                <img className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqR4g3ftzQq3C0LbGC1vCrBjyF-Ddm03q4Xnirog06T7Nax-PZLLSyrDbRY1K82xDBiSdt10nPBObefT6ex8M0QlB5RhaDpvnIsA2MbhorkGGt3-jJJ3vmxh0TQkYEeuwfP4MGC14tJakbjw3c60pe9fUwgIcbXBRkoj30KeCCvSZmfSUJX3f8CPb34QzxCmlq8_WoCcaPN9jUv9llukZUiB72_n5GQcO8kmscBWry_DBUExGUQ604CCR7UiUL-IzCWbgpHeGaKAP3" alt="Community" />
              </div>
              <div className="aspect-square bg-surface-container-highest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm translate-y-6">
                <img className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuFdv-Ot5Tr9VrkPLq72dim2fWCldPzD-a0avXN6ZczCTyvZiD2kzdeR-JkXTuDGS9JzuDTvxMcz_PPdNoT5rJpxoOdwj_7SUvizqCJNRHMzJ1PZ7vncXb3Obry57b8wRqSYtfnGGNXifjZPC-g0iQMFspOJvnboS-KVELSuSFzKrCtiKwKVdgzt-7q3mWX4aiOR-OlgJgOpBUxmNxt3QVkXAJ4O0r_7u8-iWNoYSv9K1NNAV3j8agAhItuNLM4EGkJXC58sZihRwA" alt="Community 2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-24 mb-12">
        <motion.div 
          whileInView={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.95 }}
          className="bg-surface-container-highest rounded-[3rem] p-12 lg:p-20 text-center space-y-10 border border-outline-variant shadow-lg overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-primary/5 -z-10 blur-3xl rounded-full"></div>
          <h2 className="text-4xl lg:text-6xl font-display font-extrabold tracking-tight italic text-on-surface">¿Listo para salir?</h2>
          <Link 
            to="/register" 
            className="bg-primary text-on-primary font-display font-bold h-16 px-12 rounded-2xl text-lg flex items-center justify-center mx-auto hover:opacity-90 transition-all shadow-xl hover:translate-y-[-2px]"
          >
            CREAR MI CUENTA
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
