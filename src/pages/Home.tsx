import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Sparkles, TrendingUp, Calendar, ArrowRight, Zap, Ticket, Users } from 'lucide-react';
import { api, resolveAssetUrl } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const NO_EVENT_IMAGE = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000&auto=format&fit=crop';

const EventCard = ({ event }: { event: any }) => (
  <Link 
    to={`/events/${event.id_event}`}
    className="group flex-shrink-0 w-72 bg-white rounded-3xl border border-outline-variant overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:-translate-y-1"
  >
    <div className="relative aspect-[16/10] overflow-hidden">
      <img 
        src={resolveAssetUrl(event.thumbnail_url) || NO_EVENT_IMAGE} 
        alt={event.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute top-3 left-3">
        <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider border border-white/10">
          {event.interests?.[0]?.name || event.tags?.[0] || 'Evento'}
        </span>
      </div>
      {event.score && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-primary/90 text-white text-[8px] font-black tracking-widest uppercase shadow-lg flex items-center gap-1">
          <Sparkles size={10} /> {Math.round(event.score)}% Match
        </div>
      )}
    </div>
    <div className="p-5 space-y-3">
      <h4 className="text-sm font-black text-on-surface leading-tight truncate uppercase">{event.title}</h4>
      <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-bold">
        <span className="flex items-center gap-1">
          <Calendar size={12} className="text-primary" />
          {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </span>
        <span className="text-primary font-black">
          {event.price && Number(event.price) > 0 ? `$${event.price}` : 'GRATIS'}
        </span>
      </div>
    </div>
  </Link>
);

const Home: React.FC = () => {
  const heroImageRef = useRef<HTMLImageElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [trendingEvents, setTrendingEvents] = useState<any[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);
  const [quickEvents, setQuickEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [trending, recommended, upcoming]: any = await Promise.all([
          api.get('/api/recommendations/trending?limit=6'),
          api.get('/api/recommendations?limit=6', { auth: true }),
          api.getEvents(1, 6)
        ]);

        setTrendingEvents(Array.isArray(trending) ? trending : (trending?.data || []));
        setRecommendedEvents(Array.isArray(recommended) ? recommended : (recommended?.data || []));
        setQuickEvents(Array.isArray(upcoming) ? upcoming : (upcoming?.data || []));
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, [user]);

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
            to="/events"
            className="bg-primary text-on-primary font-display font-bold px-10 py-4 rounded-xl flex items-center gap-3 neon-glow transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-[0px]"
          >
            DESCUBRIR EVENTOS
            <ArrowRight size={20} />
          </Link>
          <Link 
            to="/map"
            className="bg-surface-container-high text-on-surface font-display font-bold px-10 py-4 rounded-xl hover:bg-surface-container-highest transition-colors border border-outline-variant"
          >
            VER MAPA
          </Link>
        </motion.div>
      </section>

      {/* Recommended for You (AI powered) */}
      {recommendedEvents.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-6 py-12 space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles size={20} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Para Ti</h3>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Basado en tus gustos con IA</p>
                 </div>
              </div>
              <Link to="/feed" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Ver Feed Completo</Link>
           </div>
           <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar">
              {recommendedEvents.map(event => <EventCard key={event.id_event} event={event} />)}
           </div>
        </section>
      )}

      {/* Trending Events */}
      <section className="w-full max-w-7xl mx-auto px-6 py-12 space-y-8">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <TrendingUp size={20} />
               </div>
               <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Tendencias</h3>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Lo más hablado de la semana</p>
               </div>
            </div>
         </div>
         <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar">
            {trendingEvents.map(event => <EventCard key={event.id_event} event={event} />)}
         </div>
      </section>

      {/* Features Bento Grid */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-12 gap-6 min-h-[600px]">
          {/* Feed Personalizado */}
          <div className="col-span-12 md:col-span-7 glass-card rounded-[2.5rem] p-10 lg:p-12 flex flex-col justify-end relative overflow-hidden group border border-outline-variant/30 min-h-[400px]">
            <img 
              className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:scale-105 transition-transform duration-700 -z-10" 
              src="https://images.unsplash.com/photo-1540575861501-7c0011e74504?q=80&w=1000&auto=format&fit=crop"
              alt="Background"
            />
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-primary">
              <Sparkles size={28} />
            </div>
            <h3 className="text-3xl font-display font-extrabold text-on-surface mb-4 uppercase italic">Feed con Inteligencia Artificial.</h3>
            <p className="text-base text-on-surface-variant max-w-md font-medium leading-relaxed">Nuestra red neuronal analiza tus interacciones para mostrarte solo lo que realmente te apasiona.</p>
          </div>

          {/* Entradas Digitales */}
          <div className="col-span-12 md:col-span-5 bg-primary rounded-[2.5rem] p-10 lg:p-12 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden min-h-[400px]">
            <div className="absolute top-4 right-4 opacity-10 text-white">
              <Ticket size={120} strokeWidth={1} />
            </div>
            <Zap size={64} className="text-on-primary mb-6" />
            <h3 className="text-3xl font-display font-extrabold text-on-primary mb-4 uppercase italic">Entradas Digitales.</h3>
            <p className="text-base text-on-primary/90 font-medium leading-relaxed">Gestiona tus entradas de forma segura y rápida. Sin complicaciones, directo en tu móvil.</p>
          </div>

          {/* Mapa de Eventos */}
          <div className="col-span-12 md:col-span-5 glass-card rounded-[2.5rem] p-10 lg:p-12 flex flex-col justify-between border border-outline-variant/30 min-h-[400px]">
            <div>
              <div className="bg-surface-container-highest w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-outline-variant text-primary">
                <MapPin size={28} />
              </div>
              <h3 className="text-3xl font-display font-extrabold text-on-surface mb-4 uppercase italic">Mapa de Eventos.</h3>
              <p className="text-base text-on-surface-variant font-medium leading-relaxed">Visualiza dónde están ocurriendo los mejores encuentros en tiempo real.</p>
            </div>
            <div className="w-full h-40 rounded-3xl bg-surface-container-low mt-8 overflow-hidden grayscale opacity-40 border border-outline-variant relative">
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 to-transparent">
                <MapPin size={48} className="text-primary animate-bounce" />
              </div>
            </div>
          </div>

          {/* Comunidad Segura */}
          <div className="col-span-12 md:col-span-7 glass-card rounded-[2.5rem] p-10 lg:p-12 flex items-center gap-12 border border-outline-variant/30 min-h-[400px]">
            <div className="flex-1">
              <div className="bg-surface-container-highest w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-primary">
                <Users size={28} />
              </div>
              <h3 className="text-3xl font-display font-extrabold text-on-surface mb-4 uppercase italic">Comunidad Segura.</h3>
              <p className="text-base text-on-surface-variant font-medium leading-relaxed">Conéctate con otros de forma segura. Privacidad total en tus interacciones y asistencia.</p>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4 flex-1">
              <div className="aspect-square bg-surface-container-highest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
                <img className="w-full h-full object-cover opacity-60" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop" alt="Community" />
              </div>
              <div className="aspect-square bg-surface-container-highest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm translate-y-6">
                <img className="w-full h-full object-cover opacity-60" src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=500&auto=format&fit=crop" alt="Community 2" />
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
          <h2 className="text-4xl lg:text-6xl font-display font-extrabold tracking-tight italic text-on-surface uppercase leading-tight">¿Listo para <br /> vivir tu ciudad?</h2>
          <Link 
            to="/register" 
            className="bg-primary text-on-primary font-display font-bold h-16 px-12 rounded-2xl text-lg flex items-center justify-center mx-auto hover:opacity-90 transition-all shadow-xl hover:translate-y-[-2px] tracking-widest uppercase"
          >
            CREAR MI CUENTA
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
