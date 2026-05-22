import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Plus, ThumbsUp, MessageSquare, ShieldCheck, Zap, Bell, Heart, Calendar, ArrowRight, UserPlus, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, getDocs, limit, orderBy, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Community {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  image: string;
  category: string;
  isVerified?: boolean;
}

interface Activity {
  id: string;
  type: 'event_update' | 'user_post' | 'announcement';
  title: string;
  content: string;
  author: {
    name: string;
    photo?: string;
    id: string;
  };
  timestamp: any;
  image?: string;
  targetLink: string;
}

const Communities: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activity' | 'explore'>('activity');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { profile, user: currentUser } = useAuth();

  useEffect(() => {
    // Mock data for communities
    const mockCommunities: Community[] = [
      {
        id: '1',
        name: 'Cosplay Argentina',
        description: 'La comunidad más grande de cosplayers del país. Compartimos tips, talleres y organización para eventos.',
        membersCount: 15400,
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000',
        category: 'Cosplay',
        isVerified: true
      },
      {
        id: '2',
        name: 'K-Pop BA',
        description: 'Punto de encuentro para fans del K-Pop en Buenos Aires. Random Dance, proyecciones y fanbases.',
        membersCount: 22100,
        image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1000',
        category: 'Música',
        isVerified: true
      },
      {
        id: '3',
        name: 'E-Sports League',
        description: 'Torneos amateur y profesionales de Valorant, LoL y CS2. ¡Encontrá tu equipo acá!',
        membersCount: 8900,
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000',
        category: 'Gaming'
      }
    ];

    // Mock activities (Updates from events, users, etc)
    const mockActivities: Activity[] = [
      {
        id: 'a1',
        type: 'event_update',
        title: 'Novedad en Anime Expo',
        content: '¡Se confirmaron los invitados internacionales para el bloque de la tarde!',
        author: { name: 'Otaku Soul Events', id: 'org1' },
        timestamp: new Date(),
        image: 'https://images.unsplash.com/photo-1578632738942-630897fbf86e?q=80&w=500',
        targetLink: '/events/1'
      },
      {
        id: 'a2',
        type: 'user_post',
        title: 'Santi subió una foto',
        content: 'Ya llegué al evento de K-Pop, ¡quedan pocas entradas!',
        author: { name: 'Santi Geek', id: 'user2' },
        timestamp: new Date(Date.now() - 3600000),
        targetLink: '/u/santipingui'
      },
      {
        id: 'a3',
        type: 'announcement',
        title: 'Nuevo Mapa del Evento',
        content: 'Descargá el mapa actualizado con los nuevos sectores de comida.',
        author: { name: 'K-Pop BA', id: 'org2' },
        timestamp: new Date(Date.now() - 7200000),
        targetLink: '/events/2'
      }
    ];

    setTimeout(() => {
      setCommunities(mockCommunities);
      setActivities(mockActivities);
      setLoading(false);
    }, 800);
  }, []);

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-500/5 border border-indigo-100">
               <Users size={32} />
            </div>
            <div>
              <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">COMUNIDADES</h1>
              <p className="text-on-surface-variant font-medium text-lg italic mt-1">Tu radar social y de novedades</p>
            </div>
          </div>
        </div>

        <div className="flex bg-surface-container-low p-1.5 rounded-[2rem] border border-outline-variant w-fit shrink-0">
           <button 
             onClick={() => setActiveTab('activity')}
             className={cn(
               "px-8 h-12 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'activity' ? "bg-on-surface text-surface shadow-lg" : "text-on-surface-variant hover:text-on-surface"
             )}
           >
             Mi Actividad
           </button>
           <button 
             onClick={() => setActiveTab('explore')}
             className={cn(
               "px-8 h-12 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'explore' ? "bg-on-surface text-surface shadow-lg" : "text-on-surface-variant hover:text-on-surface"
             )}
           >
             Explorar
           </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'activity' ? (
          <motion.div
            key="activity"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            {/* Left Column: Activity Feed */}
            <div className="lg:col-span-8 space-y-8">
               <div className="space-y-4">
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-on-surface-variant ml-2">Novedades Recientes</h2>
                  <div className="space-y-6">
                    {activities.map((activity) => (
                      <motion.div 
                        key={activity.id}
                        layout
                        className="bg-white rounded-[2.5rem] border border-outline-variant p-6 lg:p-10 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:border-primary/20 transition-all group"
                      >
                         <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                               <img 
                                 src={activity.author.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.author.id}`} 
                                 className="w-12 h-12 rounded-2xl bg-indigo-50 object-cover" 
                               />
                               <div>
                                  <p className="text-sm font-black italic">{activity.author.name}</p>
                                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                    {format(activity.timestamp, "HH:mm '•' d MMM", { locale: es })}
                                  </p>
                               </div>
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                              activity.type === 'event_update' ? "bg-primary/5 text-primary border-primary/20" :
                              activity.type === 'user_post' ? "bg-amber-50 text-amber-600 border-amber-200" :
                              "bg-indigo-50 text-indigo-600 border-indigo-200"
                            )}>
                               {activity.type.replace('_', ' ')}
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="space-y-2">
                               <h3 className="text-2xl font-black italic tracking-tight group-hover:text-primary transition-colors">{activity.title}</h3>
                               <p className="text-on-surface-variant font-medium text-lg leading-relaxed">{activity.content}</p>
                            </div>

                            {activity.image && (
                               <div className="rounded-[2.5rem] overflow-hidden border border-outline-variant/30 aspect-video">
                                  <img src={activity.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="post" />
                               </div>
                            )}

                            <Link to={activity.targetLink} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary group-hover:translate-x-2 transition-transform">
                               Ver detalle <ArrowRight size={16} />
                            </Link>
                         </div>
                      </motion.div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Right Column: Suggested & Following */}
            <div className="lg:col-span-4 space-y-10">
               {/* Following Summary */}
               <div className="bg-surface-container-low rounded-[2.5rem] border border-outline-variant p-8 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant italic">Tus Suscripciones</h3>
                  <div className="space-y-4">
                     {[
                       { name: 'Anime Expo 2026', type: 'Evento', active: true },
                       { name: 'K-Pop BA Official', type: 'Org', active: false },
                       { name: 'Buenos Aires Gaming', type: 'Grupo', active: true }
                     ].map(sub => (
                       <div key={sub.name} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-outline-variant/50 hover:border-primary/30 transition-all cursor-pointer group">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                                {sub.type === 'Evento' ? <Calendar size={18} /> : <Users size={18} />}
                             </div>
                             <div>
                                <p className="text-xs font-black italic">{sub.name}</p>
                                <p className="text-[9px] font-bold text-on-surface-variant opacity-60 uppercase">{sub.type}</p>
                             </div>
                          </div>
                          {sub.active && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                       </div>
                     ))}
                  </div>
                  <button onClick={() => setActiveTab('explore')} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                     Ver todas las suscripciones →
                  </button>
               </div>

               {/* Stats / Badges */}
               <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white space-y-4 shadow-xl shadow-indigo-500/20">
                  <ShieldCheck size={32} />
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Rango Actual</p>
                     <h4 className="text-3xl font-black italic tracking-tighter">ELITE GEEK</h4>
                  </div>
                  <p className="text-xs font-medium opacity-80 italic">Has asistido a 5 eventos este mes. ¡Seguí así para desbloquear beneficios exclusivos!</p>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="explore"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="relative w-full max-w-2xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o categoría de comunidad..."
                className="w-full bg-surface-container-low border border-outline-variant h-16 pl-14 pr-6 rounded-[2rem] outline-none focus:border-primary transition-all font-bold text-lg shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCommunities.map((community, index) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-[3rem] bg-surface-container-low border border-outline-variant hover:border-primary/50 transition-all shadow-sm"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img src={community.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={community.name} />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
                      <span className="px-4 py-1.5 rounded-full bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {community.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 space-y-4">
                    <div className="flex items-center gap-2">
                       <h3 className="text-2xl font-black italic tracking-tight">{community.name}</h3>
                       {community.isVerified && <ShieldCheck size={20} className="text-primary" />}
                    </div>
                    <p className="text-on-surface-variant font-medium leading-relaxed line-clamp-2">
                      {community.description}
                    </p>
                    
                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex -space-x-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-surface bg-on-surface-variant overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${community.id + i}`} alt="member" />
                          </div>
                        ))}
                      </div>
                      
                      <button className="h-12 px-8 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-600/20">
                        UNIRSE
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Communities;
