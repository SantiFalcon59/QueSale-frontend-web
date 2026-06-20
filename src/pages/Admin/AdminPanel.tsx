import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Building, Users, Calendar, Activity } from 'lucide-react';
import AdminOrganizations from './AdminOrganizations';
import AdminUsers from './Users';
import AdminEvents from './Events';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';

type TabId = 'dashboard' | 'orgs' | 'users' | 'events';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin';
  const isModerator = profile?.role === 'moderator';

  if (!isAdmin && !isModerator) {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, adminOnly: false },
    { id: 'orgs', label: 'Organizaciones', icon: Building, adminOnly: true },
    { id: 'users', label: 'Usuarios', icon: Users, adminOnly: true },
    { id: 'events', label: 'Eventos', icon: Calendar, adminOnly: false },
  ].filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        <aside className="w-full lg:w-72 lg:shrink-0">
          <div className="sticky top-24 space-y-8">
            <div className="bg-surface-container-low rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-outline-variant space-y-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tighter leading-none">
                    {isAdmin ? 'ADMIN' : 'MODERADOR'}
                  </h2>
                  <p className="text-[10px] uppercase font-black tracking-widest text-primary">Master Console</p>
                </div>
              </div>

              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em]",
                      activeTab === tab.id 
                        ? "bg-on-surface text-surface shadow-xl shadow-black/10 scale-105" 
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    )}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="pt-8 border-t border-outline-variant/30">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-primary">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">Estatus de Sistema</p>
                  <p className="text-xs font-bold italic tracking-tight flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Operativo Online
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {activeTab === 'dashboard' && <AdminOverview onSwitchTab={(tab) => setActiveTab(tab)} isAdmin={isAdmin} />}
              {activeTab === 'orgs' && isAdmin && <AdminOrganizations />}
              {activeTab === 'users' && isAdmin && <AdminUsers />}
              {activeTab === 'events' && <AdminEvents />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const AdminOverview: React.FC<{ onSwitchTab: (tab: TabId) => void; isAdmin: boolean }> = ({ onSwitchTab, isAdmin }) => {
  const [stats, setStats] = useState({ users: 0, events: 0, pendingOrgs: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const eventsSnap = await getDocs(query(collection(db, 'events'), limit(1)));
        const pendingSnap = isAdmin 
          ? await getDocs(query(collection(db, 'organizers'), where('verificationLevel', '<', 2)))
          : { size: 0 } as any;
        
        setStats({
          users: 0,
          events: 0,
          pendingOrgs: pendingSnap.size
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      }
    };
    fetchStats();
  }, [isAdmin]);

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase leading-tight">VISTA GENERAL DE <br /> <span className="text-primary">OPERACIONES</span></h1>
        <p className="text-on-surface-variant font-medium text-lg italic">Panel de control de alto nivel para QueSale Geek</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {isAdmin && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => onSwitchTab('orgs')}
            className="col-span-12 lg:col-span-8 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-linear-to-br from-primary to-primary-container text-on-primary shadow-2xl shadow-primary/20 cursor-pointer flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center group overflow-hidden relative"
          >
            <div className="relative z-10 space-y-4">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Verificaciones Pendientes</p>
                  <h2 className="text-5xl font-black italic tracking-tighter">
                    {stats.pendingOrgs} EN ESPERA
                  </h2>
               </div>
               <p className="text-sm font-bold opacity-90 max-w-sm italic">Hay organizaciones esperando validación de Nivel 2 para empezar a vender entradas.</p>
               <button className="h-12 px-8 rounded-2xl bg-white text-primary font-black uppercase text-[10px] tracking-widest group-hover:scale-110 transition-all">Gestionar Bóveda</button>
            </div>
            <Building size={200} className="absolute -right-10 -bottom-10 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
          </motion.div>
        )}

        <div className={cn("col-span-12 space-y-8", isAdmin ? "lg:col-span-4" : "lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 space-y-0")}>
           {isAdmin && (
             <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant shadow-sm space-y-4 h-fit">
                <div className="w-12 h-12 rounded-2xl bg-on-surface text-surface flex items-center justify-center">
                   <Users size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Usuarios Totales</p>
                   <h3 className="text-4xl font-black italic tracking-tighter uppercase">Ver Base</h3>
                </div>
                <button 
                  onClick={() => onSwitchTab('users')}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Ver base de datos →
                </button>
             </div>
           )}

           <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant shadow-sm space-y-4 h-fit">
              <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center">
                 <Calendar size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Eventos Activos</p>
                 <h3 className="text-4xl font-black italic tracking-tighter uppercase">Vigilados</h3>
              </div>
              <button 
                onClick={() => onSwitchTab('events')}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                Moderar feed →
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
