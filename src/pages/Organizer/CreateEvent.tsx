import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Calendar, MapPin, DollarSign, Users, Tag, Image as ImageIcon, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../services/apiClient';

const CATEGORIES = ['Anime', 'Videojuegos', 'K-Pop', 'Feria', 'Convención', 'Taller', 'Torneo'];

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    address: '',
    lat: -34.6037, // Default to Buenos Aires
    lng: -58.3816,
    price: '',
    capacity: '',
    category: 'Anime',
    image: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      if (!user) return;
      try {
        const data: any = await api.getMyOrganizers(1, 1);
        const org = data?.[0];

        if (org) {
          setOrganization({
            id: org.id_organizer,
            name: org.name,
            verificationLevel: org.verified ? 2 : 1,
          });
        } else {
          navigate('/organizer');
        }
      } catch (err) {
        console.error("Error fetching org:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organization) return;
    setError(null);

    const price = parseFloat(formData.price) || 0;
    const vLevel = organization.verificationLevel || 0;

    // Validation
    if (vLevel < 1) {
      setError("Tu organización aún no ha sido validada.");
      return;
    }

    if (price > 0 && vLevel < 2) {
      setError("Solo las organizaciones verificadas (Nivel 2) pueden crear eventos pagos. Tu cuenta está en Nivel 1 (Real).");
      return;
    }

    setLoading(true);

    try {
      const eventDate = new Date(`${formData.date}T${formData.time}`);

      await api.createEvent({
        title: formData.title,
        description: formData.description,
        date: eventDate.toISOString(),
        location: formData.address,
        organizerId: organization.id,
      });

      navigate('/organizer');
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Error al crear el evento. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <header className="space-y-6">
        <button 
          onClick={() => navigate('/organizer')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-black uppercase text-[10px] tracking-[0.2em]"
        >
          <ArrowLeft size={16} />
          Volver al Panel
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
             <p className="text-[10px] text-primary uppercase tracking-[0.4em] font-black italic">Gestión de Eventos</p>
             <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">CREAR <span className="text-primary">EVENTO</span></h1>
             <p className="text-on-surface-variant font-medium text-lg italic mt-1">Comparte una experiencia única con la comunidad</p>
          </div>
          {organization && (
            <div className={cn(
              "px-6 py-3 rounded-[1.5rem] flex items-center gap-3 border shadow-xl bg-white",
              organization.verificationLevel >= 2 ? "border-green-100 text-green-700" : "border-primary/20 text-primary"
            )}>
              <div className={cn("w-3 h-3 rounded-full animate-pulse", organization.verificationLevel >= 2 ? "bg-green-500" : "bg-primary")} />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                Org: {organization.name} ({organization.verificationLevel >= 2 ? 'Verificada' : 'Nivel 1'})
              </span>
            </div>
          )}
        </div>
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-[2rem] bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-red-500/5"
        >
          ALERTA: {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-12">
        {/* Basic Info */}
        <div className="col-span-12 lg:col-span-7 space-y-12">
           <section className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <Sparkles size={24} />
                 </div>
                 <h3 className="text-xl font-bold uppercase tracking-tight italic">Branding del Evento</h3>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Nombre de la Experiencia</label>
                    <input 
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ej: Obsidian Rhythm 2024"
                      className="w-full bg-white border border-outline-variant rounded-[2rem] h-16 px-8 focus:border-primary outline-none text-xl font-black italic tracking-tight shadow-sm"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Narrativa (Descripción)</label>
                    <textarea 
                      required
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Cuéntale a la comunidad de qué se trata..."
                      className="w-full bg-white border border-outline-variant rounded-[2rem] p-8 focus:border-primary outline-none min-h-[200px] font-medium leading-relaxed shadow-sm"
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Esencia (Categoría)</label>
                       <select 
                         value={formData.category}
                         onChange={e => setFormData({ ...formData, category: e.target.value })}
                         className="w-full bg-white border border-outline-variant rounded-[1.5rem] h-14 px-6 focus:border-primary outline-none font-bold appearance-none shadow-sm cursor-pointer"
                       >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Visual Banner (URL)</label>
                       <input 
                         required
                         value={formData.image}
                         onChange={e => setFormData({ ...formData, image: e.target.value })}
                         placeholder="https://..."
                         className="w-full bg-white border border-outline-variant rounded-[1.5rem] h-14 px-6 focus:border-primary outline-none font-bold shadow-sm"
                       />
                    </div>
                 </div>
              </div>
           </section>

           <section className="space-y-6 pt-6 border-t border-outline-variant/30">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shadow-sm">
                    <MapPin size={24} />
                 </div>
                 <h3 className="text-xl font-bold uppercase tracking-tight italic">Logística de Desembarco</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Día de la Cita</label>
                    <input 
                      required
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white border border-outline-variant rounded-[1.5rem] h-14 px-6 focus:border-primary outline-none font-bold shadow-sm"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Hora de Ignición</label>
                    <input 
                      required
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-white border border-outline-variant rounded-[1.5rem] h-14 px-6 focus:border-primary outline-none font-bold shadow-sm"
                    />
                 </div>
                 <div className="col-span-2 space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Coordenadas (Dirección)</label>
                    <input 
                      required
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Dirección completa del lugar"
                      className="w-full bg-white border border-outline-variant rounded-[1.5rem] h-14 px-6 focus:border-primary outline-none font-bold shadow-sm"
                    />
                 </div>
              </div>
           </section>
        </div>

        {/* Sidebar: Tickets & Discovery */}
        <div className="col-span-12 lg:col-span-5 space-y-12">
           <section className="p-10 rounded-[3rem] bg-surface-container-low border border-outline-variant space-y-8 shadow-xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary shadow-sm">
                    <TrendingUp size={24} />
                 </div>
                 <h3 className="text-xl font-bold uppercase tracking-tight italic">Descubrimiento</h3>
              </div>
              
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Atmósfera Sugerida (Tags)</label>
                    <div className="flex flex-wrap gap-2">
                      {['chill', 'intenso', 'competitivo', 'social', 'aesthetic', 'nostálgico'].map(tag => (
                        <button 
                          key={tag}
                          type="button"
                          className="px-4 py-2 rounded-xl border border-outline-variant bg-white text-[9px] font-black uppercase tracking-widest hover:border-tertiary hover:text-tertiary transition-all"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-outline-variant/30">
                    <div className="flex items-center gap-3 mb-2">
                       <Tag className="text-primary" size={20} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Configuración de Acceso</h4>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Precio sugerido (ARS)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                          <input 
                            required
                            type="number"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0.00"
                            className="w-full bg-white border border-outline-variant rounded-[1.5rem] h-14 pl-12 pr-6 focus:border-primary outline-none font-bold"
                          />
                       </div>
                       <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-1 px-4 italic">
                        {parseFloat(formData.price) > 0 ? '* Requiere Verificación Nivel 2' : '* Entrada Gratuita impulsa el descubrimiento'}
                       </p>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Cupo Limite (Capacidad)</label>
                       <div className="relative">
                          <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                          <input 
                            required
                            type="number"
                            value={formData.capacity}
                            onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                            placeholder="500"
                            className="w-full bg-white border border-outline-variant rounded-[1.5rem] h-14 pl-12 pr-6 focus:border-primary outline-none font-bold"
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </section>

           <div className="space-y-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-24 rounded-[2.5rem] bg-on-surface text-surface text-xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-black/20 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-primary/20 translate-x-[100%] group-hover:translate-x-0 transition-transform duration-500" />
                <span className="relative">{loading ? 'PUBLICANDO...' : 'Publicar Evento'}</span>
                {!loading && <Sparkles size={24} className="relative animate-pulse" />}
              </button>
              <p className="text-[9px] text-center text-on-surface-variant font-black uppercase tracking-[0.2em] px-10">
                Al lanzar, el evento será visible instantáneamente en el mapa de QueSale Geek.
              </p>
           </div>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
