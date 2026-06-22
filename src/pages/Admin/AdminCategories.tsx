import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Plus, Search, Palette, Sparkles } from 'lucide-react';
import { api } from '../../services/apiClient';
import { toastSuccess, toastError } from '../../lib/swal';
import { useAuth } from '../../context/AuthContext';

interface Category {
  id: number;
  name: string;
  icon_url: string | null;
  color: string | null;
  events_count?: number;
}

const AdminCategories: React.FC = () => {
  const { profile } = useAuth() as any;
  const isModerator = profile?.role === 'moderator';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [color, setColor] = useState('#732ee4'); // default purple primary
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data: any = await api.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      toastError("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError("El nombre es obligatorio");
      return;
    }

    try {
      const newCat: any = await api.createCategory({
        name: name.trim(),
        icon_url: iconUrl.trim() || undefined,
        color: color.trim() || undefined
      });
      
      // The API returns the created category. Let's append it
      setCategories(prev => [...prev, {
        id: newCat.id_interest || newCat.id,
        name: newCat.name,
        icon_url: newCat.icon_url,
        color: newCat.color,
        events_count: 0
      }]);
      
      toastSuccess(`Categoría "${name}" creada correctamente.`);
      
      // Reset form
      setName('');
      setIconUrl('');
      setColor('#732ee4');
      setShowAddForm(false);
    } catch (err: any) {
      console.error("Error creating category:", err);
      toastError(err.message || "Error al crear la categoría. Puede que ya exista.");
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-3">
              <Tag className="text-primary" size={32} />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter uppercase">CONTROL DE <span className="text-primary">CATEGORÍAS</span></h1>
           </div>
           <p className="text-on-surface-variant font-medium ml-1">Configuración de Categorías de Eventos e Intereses del Usuario</p>
        </div>
        {!isModerator && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary self-start sm:self-center h-12 px-6 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <Plus size={16} />
            {showAddForm ? 'Cancelar' : 'Nueva Categoría'}
          </button>
        )}
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
                <Sparkles size={18} className="text-primary" />
                Crear Nueva Categoría
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Nombre de Categoría *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Música, Tecnología, Gastronomía, Deportes..."
                    className="w-full bg-white border border-outline-variant rounded-xl h-12 px-4 focus:border-primary outline-none font-bold text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Ícono / Emoji (Opcional)</label>
                  <input
                    value={iconUrl}
                    onChange={e => setIconUrl(e.target.value)}
                    placeholder="Ej: 🎸, 💻, 🍕, 🏆 o nombre de ícono"
                    className="w-full bg-white border border-outline-variant rounded-xl h-12 px-4 focus:border-primary outline-none font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2 flex items-center gap-1.5">
                    <Palette size={12} /> Color de Badge (Opcional)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border border-outline-variant bg-transparent cursor-pointer"
                    />
                    <input
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      placeholder="#732ee4"
                      maxLength={7}
                      className="flex-1 bg-white border border-outline-variant rounded-xl h-12 px-4 focus:border-primary outline-none font-bold text-sm uppercase"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Crear Categoría
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
            placeholder="Buscar por nombre..."
            className="w-full bg-surface-container-low border border-outline-variant h-14 pl-14 pr-6 rounded-2xl outline-none focus:border-primary transition-all font-bold"
         />
      </div>

      {loading ? (
        <div className="p-20 text-center font-bold italic tracking-widest uppercase opacity-40">
          Cargando categorías...
        </div>
      ) : categories.length === 0 ? (
        <div className="p-20 text-center rounded-[2.5rem] border border-dashed border-outline-variant bg-surface-container-low">
          <Tag className="mx-auto text-on-surface-variant/40 mb-4" size={48} />
          <p className="font-bold italic text-on-surface-variant/80 uppercase">No hay categorías configuradas.</p>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-[2.5rem] border border-outline-variant overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="border-b border-outline-variant/30 text-left bg-surface/50">
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Vista Previa</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Nombre</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Código de Color</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Eventos Clasificados</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="border-b border-outline-variant/10 hover:bg-surface-container transition-colors group">
                       <td className="px-8 py-5">
                          <span 
                            className="px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 w-fit text-white"
                            style={{ backgroundColor: cat.color || '#732ee4' }}
                          >
                            <span>{cat.icon_url || '✨'}</span>
                            <span>{cat.name}</span>
                          </span>
                       </td>
                       <td className="px-8 py-5">
                          <span className="font-bold text-sm">{cat.name}</span>
                       </td>
                       <td className="px-8 py-5 font-mono text-on-surface-variant text-sm font-semibold uppercase">
                          {cat.color || '#732ee4'}
                       </td>
                       <td className="px-8 py-5 text-center text-sm font-bold">
                          {cat.events_count !== undefined ? cat.events_count : 0}
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

export default AdminCategories;
