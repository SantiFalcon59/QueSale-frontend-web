import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Ticket, DollarSign, Calendar, Plus, Edit, Trash, BarChart3, TrendingUp, Users as UsersIcon, Sparkles, Building, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';

const data = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

const OrganizerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'insights' | 'events' | 'staff'>('insights');
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [organization, setOrganization] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ 
    name: '', 
    handle: '',
    description: '', 
    logo: '', 
    instagram: '',
    realName: '',
    dni: ''
  });
  const [error, setError] = useState<string | null>(null);
  
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [isLinkingIg, setIsLinkingIg] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([
    { name: 'Santi Falcon', role: 'Owner', id: 'owner-id' },
    { name: 'Nacho Editor', role: 'Moderator', id: 'staff1' },
    { name: 'Damián G.', role: 'Editor', id: 'staff2' }
  ]);

  const handleLinkInstagram = () => {
    setIsLinkingIg(true);
    // Simulate Instagram OAuth flow
    setTimeout(() => {
      setIsLinkingIg(false);
      setShowInstagramModal(false);
      setOrganization((prev: any) => ({ ...prev, instagramVerified: true, verificationLevel: 2 }));
    }, 2000);
  };

  const removeStaff = (id: string) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
  };
  
  const VerificationBadge = ({ level }: { level: number }) => {
    if (level >= 2) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shadow-sm animate-pulse">
          <Sparkles size={12} className="fill-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.1em]">Verificada Dorada</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 shadow-sm">
        <Sparkles size={12} className="fill-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.1em]">Verificación Simple</span>
      </div>
    );
  };

  useEffect(() => {
    const fetchOrg = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data: any = await api.getMyOrganizers(1, 1);
        const org = data?.[0];
        if (org) {
          const mapped = {
            id: org.id_organizer,
            name: org.name,
            description: org.description,
            logo: org.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${org.name}`,
            handle: org.name?.toLowerCase().replace(/\s+/g, '_') || 'organizer',
            ownerId: org.id_creator,
            verificationLevel: org.verified ? 2 : 1,
            instagram: '',
          };
          setOrganization(mapped);

          const eventsData: any = await api.getOrganizerEvents(org.id_organizer, 1, 50);
          const eventList = (eventsData || []).map((event: any) => ({
            id: event.id_event,
            title: event.title,
            description: event.description,
            date: event.date,
            status: event.status || 'active',
            capacity: event.capacity || 0,
            attendeesCount: event.attendeesCount || 0,
            views: 0,
            saves: 0,
          }));
          setEvents(eventList);
        }
      } catch (err) {
        console.error("Error fetching org and events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, [user]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const created: any = await api.createOrganizer({
        name: newOrgData.name,
        description: newOrgData.description,
      });

      setOrganization({
        id: created.id_organizer,
        name: created.name,
        description: created.description,
        handle: newOrgData.handle.toLowerCase(),
        logo: newOrgData.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${newOrgData.name}`,
        instagram: newOrgData.instagram,
        ownerId: created.id_creator,
        verificationLevel: created.verified ? 2 : 1,
      });
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("Error creating org:", err);
      setError(err.message || "Error al crear la organización.");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Alcance (Vistas)', value: events.reduce((acc, ev) => acc + (ev.views || 0), 0) || '0', delta: '+22.5%', icon: BarChart3, color: 'text-primary' },
    { label: 'Interés (Guardados)', value: events.reduce((acc, ev) => acc + (ev.saves || 0), 0) || '0', delta: '+15.2%', icon: Sparkles, color: 'text-secondary' },
    { label: 'Asistencia Real', value: events.length > 0 ? `${Math.round(events.reduce((acc, ev) => acc + (ev.attendeesCount || 0), 0) / events.reduce((acc, ev) => acc + (ev.capacity || 100), 0) * 100)}%` : '0%', delta: '+2.1%', icon: UsersIcon, color: 'text-tertiary' },
    { label: 'Eventos Activos', value: events.filter(e => e.status === 'active').length.toString(), delta: '0%', icon: Calendar, color: 'text-on-surface' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!organization && !showCreateForm) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-10">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 transform -rotate-12">
            <Sparkles size={48} className="text-primary" />
          </div>
          <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter decoration-primary decoration-8 underline-offset-8">
            CONVIÉRTETE EN <span className="text-primary">ORGANIZADOR</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-xl mx-auto font-medium leading-relaxed">
            Lleva tus eventos al siguiente nivel con nuestras herramientas de gestión, 
            mapeo de locación y sistema de ticketing profesional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
          <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant space-y-2">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-2">
              <BarChart3 size={20} />
            </div>
            <h4 className="font-bold">Análisis Pro</h4>
            <p className="text-xs text-on-surface-variant font-medium">Métricas en tiempo real de ventas y asistencia.</p>
          </div>
          <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant space-y-2">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-2">
              <UsersIcon size={20} />
            </div>
            <h4 className="font-bold">Comunidad</h4>
            <p className="text-xs text-on-surface-variant font-medium">Conecta directamente con más de 10k geeks.</p>
          </div>
          <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Ticket size={20} />
            </div>
            <h4 className="font-bold">Smart Ticket</h4>
            <p className="text-xs text-on-surface-variant font-medium">Validación QR segura para un ingreso fluido.</p>
          </div>
        </div>

        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn-primary h-20 px-12 text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 group"
        >
          CREAR MI ORGANIZACIÓN
          <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        <header className="space-y-4">
          <button 
            onClick={() => setShowCreateForm(false)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <Edit size={14} /> VOLVER
          </button>
          <h1 className="text-4xl font-black">Crea tu Identidad</h1>
          <p className="text-on-surface-variant font-medium">Define cómo te verá la comunidad geek.</p>
        </header>

        <form onSubmit={handleCreateOrg} className="p-8 rounded-[3rem] bg-surface-container-low border border-outline-variant space-y-6 shadow-xl">
           {error && (
             <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest text-center">
               {error}
             </div>
           )}

           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Nombre Público</label>
                   <input 
                     required
                     value={newOrgData.name}
                     onChange={e => setNewOrgData({ ...newOrgData, name: e.target.value })}
                     placeholder="Ej: Klink Studios"
                     className="w-full bg-white border border-outline-variant rounded-2xl h-14 px-6 focus:border-primary outline-none font-bold"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Username (@)</label>
                   <input 
                     required
                     value={newOrgData.handle}
                     onChange={e => setNewOrgData({ ...newOrgData, handle: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                     placeholder="klinkstudios"
                     className="w-full bg-white border border-outline-variant rounded-2xl h-14 px-6 focus:border-primary outline-none font-bold"
                   />
                </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Descripción / Bio</label>
                 <textarea 
                   required
                   value={newOrgData.description}
                   onChange={e => setNewOrgData({ ...newOrgData, description: e.target.value })}
                   placeholder="¿Cuál es tu misión? ¿Qué tipo de eventos organizas?"
                   className="w-full bg-white border border-outline-variant rounded-2xl p-6 focus:border-primary outline-none min-h-[100px] font-medium leading-relaxed"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Instagram Account</label>
                   <input 
                     required
                     value={newOrgData.instagram}
                     onChange={e => setNewOrgData({ ...newOrgData, instagram: e.target.value })}
                     placeholder="@cuenta_ig"
                     className="w-full bg-white border border-outline-variant rounded-2xl h-14 px-6 focus:border-primary outline-none font-bold"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Logo URL (Opcional)</label>
                   <input 
                     value={newOrgData.logo}
                     onChange={e => setNewOrgData({ ...newOrgData, logo: e.target.value })}
                     placeholder="https://..."
                     className="w-full bg-white border border-outline-variant rounded-2xl h-14 px-6 focus:border-primary outline-none font-bold"
                   />
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                  <TrendingUp size={14} /> Verificación de Identidad (Nivel 1)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Nombre y Apellido Real</label>
                    <input 
                      required
                      value={newOrgData.realName}
                      onChange={e => setNewOrgData({ ...newOrgData, realName: e.target.value })}
                      placeholder="Según consta en DNI"
                      className="w-full bg-white border border-outline-variant rounded-2xl h-14 px-6 focus:border-primary outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">DNI / ID</label>
                    <input 
                      required
                      value={newOrgData.dni}
                      onChange={e => setNewOrgData({ ...newOrgData, dni: e.target.value })}
                      placeholder="Número de documento"
                      className="w-full bg-white border border-outline-variant rounded-2xl h-14 px-6 focus:border-primary outline-none font-bold"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mt-4 italic">
                  * La información de identidad es privada y solo se utiliza para validación legal.
                </p>
              </div>
           </div>

           <button 
             type="submit" 
             disabled={loading}
             className="w-full btn-primary h-16 text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
           >
             {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Building size={20} />}
             FUNDAR ORGANIZACIÓN
           </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10px] text-primary uppercase tracking-[0.4em] font-black italic">Panel de Organización</p>
            <VerificationBadge level={organization?.verificationLevel || 0} />
          </div>
          <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">{organization?.name}</h1>
          <div className="flex items-center gap-3 ml-1">
             <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest italic">
                @{organization?.handle}
             </p>
             <div className="w-[1px] h-4 bg-outline-variant" />
             <button 
               className="flex items-center gap-2 text-primary hover:underline"
               onClick={() => window.open(`https://instagram.com/${organization?.instagram?.replace('@', '')}`, '_blank')}
             >
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Instagram: {organization?.instagram}</span>
             </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
           {organization?.verificationLevel < 2 && (
             <button 
               onClick={() => setShowInstagramModal(true)}
               className="h-12 px-6 rounded-2xl bg-indigo-600 text-white flex items-center gap-3 shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest group overflow-hidden relative"
             >
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <Building size={16} />
                Vincular Instagram Profesional
             </button>
           )}
           <button className="h-12 px-6 rounded-2xl border border-outline-variant hover:bg-surface-container-low transition-all text-[10px] font-black uppercase tracking-widest">
              Gestionar Org
           </button>
           <button 
            onClick={() => navigate('/organizer/new')}
            className="h-12 px-8 rounded-2xl bg-primary text-white flex items-center gap-2 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
           >
              <Plus size={16} /> Crear Evento
           </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-outline-variant">
         {[
           { id: 'insights', label: 'Dashboard Hub', icon: BarChart3 },
           { id: 'events', label: 'Mis Eventos', icon: Calendar },
           { id: 'staff', label: 'Gestión de Staff', icon: UsersIcon },
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={cn(
               "pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
               activeTab === tab.id 
                 ? "text-primary border-b-2 border-primary" 
                 : "text-on-surface-variant hover:text-on-surface opacity-60 hover:opacity-100"
             )}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      {/* Verification Level Info */}
      {organization?.verificationLevel < 2 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-[2rem] bg-linear-to-r from-primary/10 to-surface border border-primary/20 flex items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                <Sparkles size={24} />
             </div>
             <div>
                <h4 className="text-sm font-black uppercase tracking-widest italic">Mejora tu estatus de Organización</h4>
                <p className="text-xs text-on-surface-variant font-medium">Actualmente eres <span className="font-bold text-on-surface">Cuenta Real (Nivel 1)</span>. Para cobrar entradas, un admin debe verificar tu cuenta de Instagram.</p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Nivel 2 permite:</p>
                <p className="text-xs font-black text-green-600">VENTA DE ENTRADAS PAGAS</p>
             </div>
          </div>
        </motion.div>
      )}

      {/* Content Sections */}
      {activeTab === 'insights' && (
        <div className="space-y-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant hover:border-primary/20 transition-all group"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className={cn("p-3 rounded-2xl bg-surface-container-high transition-colors group-hover:bg-primary/20", stat.color)}>
                       <stat.icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{stat.delta}</span>
                 </div>
                 <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                 <h3 className="text-3xl font-bold">{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-12">
             {/* Main Chart */}
             <div className="col-span-12 lg:col-span-8 p-10 rounded-[3rem] bg-surface-container-low border border-outline-variant space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-bold">Pulso de Descubrimiento (Vistas)</h3>
                   <div className="flex gap-2">
                      {['7D', '1M', '3M', 'TODO'].map(t => (
                        <button key={t} className="px-3 py-1 rounded-lg text-[10px] font-bold border border-outline-variant hover:border-primary transition-all uppercase tracking-widest text-on-surface-variant">
                           {t}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data}>
                        <defs>
                          <linearGradient id="colorDiscovery" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                        <XAxis dataKey="name" stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="sales" name="Vistas" stroke="#6366f1" fillOpacity={1} fill="url(#colorDiscovery)" strokeWidth={3} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Side panels */}
             <div className="col-span-12 lg:col-span-4 space-y-8">
                <section className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant space-y-6">
                   <h3 className="text-xl font-bold">Interés Reciente</h3>
                   <div className="space-y-4">
                      {[
                        { title: 'Obsidian Rhythm', action: 'Guardado por 12 personas', type: 'save' },
                        { title: 'Neon Vernissage', action: '8 nuevas vistas hoy', type: 'view' }
                      ].map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-surface/50 border border-transparent hover:border-primary/20 transition-all flex items-center gap-4 group">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              {item.type === 'save' ? <Sparkles size={18} /> : <BarChart3 size={18} />}
                           </div>
                           <div className="space-y-0.5">
                              <h4 className="text-sm font-bold">{item.title}</h4>
                              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{item.action}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
                
                <section className="p-8 rounded-[2.5rem] bg-indigo-600 text-white space-y-4 shadow-xl shadow-indigo-500/20">
                   <UsersIcon size={32} />
                   <div>
                      <h4 className="text-sm font-black uppercase tracking-widest italic">Ciudadanos Leales</h4>
                      <p className="text-xs font-medium opacity-80 mt-1">El 65% de tu audiencia ha asistido a más de uno de tus eventos últimamente.</p>
                   </div>
                   <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Ver comunidad activa</button>
                </section>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {events.length > 0 ? (
             events.map(event => (
               <div key={event.id} className="group bg-white rounded-[2.5rem] border border-outline-variant hover:border-primary/50 transition-all overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5 p-8 space-y-6">
                  <div className="flex justify-between items-start">
                     <img 
                       src={event.image} 
                       className="w-16 h-16 rounded-2xl object-cover bg-surface-container-high border border-outline-variant" 
                       alt={event.title} 
                     />
                     <div className={cn(
                       "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                       event.status === 'active' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                     )}>
                        {event.status === 'active' ? 'Publicado' : 'Finalizado'}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-xl font-black italic tracking-tight truncate">{event.title}</h3>
                     <div className="flex items-center gap-2 opacity-60">
                        <Calendar size={12} />
                        <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">
                           {event.date?.toDate ? new Date(event.date.toDate()).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Próximamente'}
                        </p>
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-primary pt-2">
                        {event.attendeesCount || 0} de {event.capacity} asistentes
                     </p>
                  </div>
                  <div className="pt-4 flex gap-2 border-t border-outline-variant/30">
                     <button 
                       onClick={() => navigate(`/events/${event.id}`)}
                       className="flex-1 h-10 rounded-xl bg-surface-container-high text-[9px] font-black uppercase tracking-widest hover:bg-on-surface hover:text-white transition-all"
                     >
                       Ver
                     </button>
                     <button className="flex-1 h-10 rounded-xl bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Staff</button>
                  </div>
               </div>
             ))
           ) : (
             <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                <Calendar size={64} className="mx-auto" />
                <p className="text-xl font-black italic uppercase tracking-tighter">No hay eventos activos</p>
             </div>
           )}
           <button 
             onClick={() => navigate('/organizer/new')}
             className="border-2 border-dashed border-outline-variant rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 text-on-surface-variant hover:text-primary hover:border-primary transition-all group min-h-[300px]"
           >
              <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Plus size={32} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Crear Nuevo Evento</span>
           </button>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="max-w-4xl space-y-10">
           <section className="bg-white rounded-[3rem] border border-outline-variant p-10 space-y-8 shadow-sm">
              <header className="flex justify-between items-center">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black italic tracking-tight">Staff de la Organización</h3>
                    <p className="text-on-surface-variant text-sm font-medium">Gestiona quién tiene acceso a la administración y moderación.</p>
                 </div>
                 <button className="h-12 px-8 rounded-2xl bg-on-surface text-surface text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                    <Plus size={16} /> Agregar Staff
                 </button>
              </header>

              <div className="divide-y divide-outline-variant/30">
                 {staffList.map(member => (
                   <div key={member.id} className="py-6 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id === 'owner-id' ? organization?.ownerId : member.id}`} className="w-12 h-12 rounded-xl bg-surface-container-high" alt={member.name} />
                         <div>
                            <p className="text-sm font-black italic">{member.id === 'owner-id' ? (profile?.displayName || member.name) : member.name}</p>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{member.role}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2.5 rounded-xl hover:bg-surface-container-low text-on-surface-variant transition-all hover:text-primary"><Edit size={18} /></button>
                         {member.role !== 'Owner' && (
                           <button 
                             onClick={() => removeStaff(member.id)}
                             className="p-2.5 rounded-xl hover:bg-red-50 text-on-surface-variant transition-all hover:text-red-500"
                           >
                             <Trash size={18} />
                           </button>
                         )}
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           <section className="p-10 rounded-[3rem] bg-amber-50 border border-amber-200 space-y-4">
              <div className="flex items-center gap-3">
                 <Sparkles className="text-amber-600" size={24} />
                 <h4 className="text-sm font-black uppercase tracking-widest italic text-amber-900">Sobre los Roles</h4>
              </div>
              <p className="text-sm text-amber-800/80 font-medium leading-relaxed">
                 Los <span className="font-bold">Editores</span> pueden crear y modificar eventos. 
                 Los <span className="font-bold">Moderadores</span> pueden gestionar los muros de los eventos y banear usuarios del live chat.
              </p>
           </section>
        </div>
      )}
      {/* Instagram Linking Modal */}
      {showInstagramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] p-10 space-y-8 shadow-2xl"
          >
             <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-linear-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl transform rotate-6 hover:rotate-0 transition-transform">
                   <Building size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tight">Vincular con Instagram</h3>
                <p className="text-sm text-on-surface-variant font-medium">Al vincular tu cuenta profesional, obtendrás el distintivo de <span className="font-bold text-amber-600">Verificación Dorada</span> y podrás vender entradas.</p>
             </div>

             <div className="space-y-4">
                <button 
                  onClick={handleLinkInstagram}
                  disabled={isLinkingIg}
                  className="w-full h-16 rounded-2xl bg-linear-to-r from-purple-600 to-red-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                   {isLinkingIg ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                     <>
                        <Sparkles size={18} />
                        Autorizar mediante API
                     </>
                   )}
                </button>
                <button 
                  onClick={() => setShowInstagramModal(false)}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                >
                   Cancelar
                </button>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
