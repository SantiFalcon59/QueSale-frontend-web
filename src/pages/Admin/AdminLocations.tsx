import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Plus, Search, Trash2, Globe, Building, Navigation, ShieldCheck } from 'lucide-react';
import { api } from '../../services/apiClient';
import { toastSuccess, toastError, confirmAction } from '../../lib/swal';
import { cn } from '../../lib/utils';

interface Location {
  id: number;
  name: string;
  type: string;
  state: string | null;
  country: string;
  active: boolean;
}

const AdminLocations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('city');
  const [state, setState] = useState('Buenos Aires');
  const [country, setCountry] = useState('Argentina');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data: any = await api.getAllowedLocations(false); // get all, active & inactive
      setLocations(data || []);
    } catch (err) {
      console.error("Error fetching locations:", err);
      toastError("Error al cargar las localizaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (loc: Location) => {
    try {
      const newStatus = !loc.active;
      await api.updateAllowedLocation(loc.id, { active: newStatus });
      setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, active: newStatus } : l));
      toastSuccess(`Ubicación ${loc.name} ${newStatus ? 'activada' : 'desactivada'} correctamente.`);
    } catch (err) {
      console.error("Error toggling location active:", err);
      toastError("Error al actualizar la ubicación");
    }
  };

  const handleDelete = async (loc: Location) => {
    const confirmed = await confirmAction(
      "¿Eliminar localización?",
      `¿Estás seguro de que quieres eliminar ${loc.name}? Esto bloqueará eventos nuevos en esta área.`
    );
    if (!confirmed) return;

    try {
      await api.deleteAllowedLocation(loc.id);
      setLocations(prev => prev.filter(l => l.id !== loc.id));
      toastSuccess(`Ubicación ${loc.name} eliminada.`);
    } catch (err) {
      console.error("Error deleting location:", err);
      toastError("Error al eliminar la ubicación");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError("El nombre es obligatorio");
      return;
    }

    try {
      const newLoc: any = await api.createAllowedLocation({
        name: name.trim(),
        type,
        state: state.trim() || undefined,
        country: country.trim() || undefined
      });
      setLocations(prev => [newLoc, ...prev]);
      toastSuccess(`Localidad ${name} agregada correctamente.`);
      
      // Reset form
      setName('');
      setType('city');
      setState('Buenos Aires');
      setCountry('Argentina');
      setShowAddForm(false);
    } catch (err: any) {
      console.error("Error creating location:", err);
      toastError(err.message || "Error al agregar la ubicación. Puede que ya exista.");
    }
  };

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.state && l.state.toLowerCase().includes(search.toLowerCase())) ||
    l.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <MapPin className="text-primary" size={32} />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter uppercase">CONTROL DE <span className="text-primary">LOCALIZACIONES</span></h1>
           </div>
           <p className="text-on-surface-variant font-medium ml-1">Configuración de Ciudades, Provincias y Regiones Habilitadas (Rappi/Uber style)</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary self-start sm:self-center h-12 px-6 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
        >
          <Plus size={16} />
          {showAddForm ? 'Cancelar' : 'Habilitar Ubicación'}
        </button>
      </header>

      {/* Add Form Drawer/Collapse */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant space-y-6 max-w-2xl shadow-sm">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Navigation size={18} className="text-primary" />
                Habilitar Nueva Área
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Nombre *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Quilmes, La Plata, CABA..."
                    className="w-full bg-white border border-outline-variant rounded-xl h-12 px-4 focus:border-primary outline-none font-bold text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Tipo de Ubicación</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full bg-white border border-outline-variant rounded-xl h-12 px-4 focus:border-primary outline-none font-bold text-sm cursor-pointer"
                  >
                    <option value="city">Ciudad</option>
                    <option value="partido">Partido (Municipios)</option>
                    <option value="province">Provincia / Estado</option>
                    <option value="country">País Completo</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Provincia / Estado (Opcional)</label>
                  <input
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="Ej: Buenos Aires"
                    className="w-full bg-white border border-outline-variant rounded-xl h-12 px-4 focus:border-primary outline-none font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">País</label>
                  <input
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Ej: Argentina"
                    className="w-full bg-white border border-outline-variant rounded-xl h-12 px-4 focus:border-primary outline-none font-bold text-sm"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Habilitar Área
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative max-w-md">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
         <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, tipo, provincia..."
            className="w-full bg-surface-container-low border border-outline-variant h-14 pl-14 pr-6 rounded-2xl outline-none focus:border-primary transition-all font-bold"
         />
      </div>

      {loading ? (
        <div className="p-20 text-center font-bold italic tracking-widest uppercase opacity-40">
          Cargando localizaciones autorizadas...
        </div>
      ) : locations.length === 0 ? (
        <div className="p-20 text-center rounded-[2.5rem] border border-dashed border-outline-variant bg-surface-container-low">
          <Globe className="mx-auto text-on-surface-variant/40 mb-4" size={48} />
          <p className="font-bold italic text-on-surface-variant/80 uppercase">No hay ubicaciones configuradas.</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">El sistema permitirá eventos en cualquier lugar por defecto.</p>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-[2.5rem] border border-outline-variant overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="border-b border-outline-variant/30 text-left bg-surface/50">
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Nombre / Área</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Provincia / Estado</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">País</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Estado</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Acciones</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredLocations.map((loc) => (
                    <tr key={loc.id} className="border-b border-outline-variant/10 hover:bg-surface-container transition-colors group">
                       <td className="px-8 py-5">
                          <span className="font-bold text-sm">{loc.name}</span>
                       </td>
                       <td className="px-8 py-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                            {loc.type === 'city' && 'Ciudad'}
                            {loc.type === 'partido' && 'Partido'}
                            {loc.type === 'province' && 'Provincia'}
                            {loc.type === 'country' && 'País'}
                          </span>
                       </td>
                       <td className="px-8 py-5 text-on-surface-variant text-sm font-semibold">
                          {loc.state || 'N/A'}
                       </td>
                       <td className="px-8 py-5 text-on-surface-variant text-sm font-semibold">
                          {loc.country}
                       </td>
                       <td className="px-8 py-5">
                          <button
                            onClick={() => handleToggleActive(loc)}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              loc.active ? "bg-primary" : "bg-outline-variant"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                                loc.active ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => handleDelete(loc)}
                            className="p-2.5 rounded-xl hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-colors"
                            title="Eliminar Localidad"
                          >
                            <Trash2 size={16} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLocations;
