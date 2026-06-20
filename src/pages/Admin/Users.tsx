import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, User, Search, ShieldAlert, Shield, Gavel } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../../services/apiClient';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { toastSuccess, toastError, confirmAction } from '../../lib/swal';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
            const data: any = await api.getUsers(1, 50);
            const mapped = (data || []).map((user: any) => ({
            id: user.id_user,
            uid: user.id_user,
            username: user.username,
            email: user.email,
            photoURL: user.photo_url,
            displayName: user.username,
            createdAt: user.created_at,
            role: user.global_role || 'user',
            }));
            setUsers(mapped);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    const confirmed = await confirmAction(`¿Cambiar rango?`, `¿Estás seguro de que quieres cambiar el rango de este usuario a ${newRole.toUpperCase()}?`);
    if (!confirmed) return;
    try {
      await api.put(`/api/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toastSuccess(`Rango cambiado a ${newRole.toUpperCase()}`);
    } catch (err) {
      toastError('Error al actualizar el rango');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.uid?.includes(search)
  );

  if (loading) return <div className="p-20 text-center font-bold italic tracking-widest uppercase opacity-40">Analizando base de ciudadanos...</div>;

  return (
    <div className="space-y-10 pb-20">
      <header className="space-y-2">
         <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" size={32} />
            <h1 className="text-5xl font-black italic tracking-tighter uppercase">CONTROL DE <span className="text-primary">USUARIOS</span></h1>
         </div>
         <p className="text-on-surface-variant font-medium ml-1">Vigilancia y Asignación de Rangos de Seguridad</p>
      </header>

      <div className="relative max-w-md">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
         <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, username o ID..."
            className="w-full bg-surface-container-low border border-outline-variant h-14 pl-14 pr-6 rounded-2xl outline-none focus:border-primary transition-all font-bold"
         />
      </div>

      <div className="bg-surface-container-low rounded-[2.5rem] border border-outline-variant overflow-hidden shadow-sm">
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="border-b border-outline-variant/30 text-left bg-surface/50">
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Usuario</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">ID / Username</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Registro</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Rango</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Asignar Rango</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-outline-variant/10 hover:bg-surface-container transition-colors group">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <UserAvatar src={user.photoURL} className="w-10 h-10 rounded-full bg-white object-cover shadow-sm" alt={user.displayName || 'Anon'} size={18} />
                             <span className="font-bold">{user.displayName || 'Anon'}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-xs text-on-surface-variant">
                          <p className="font-black text-on-surface">@{user.username || 'sin_nick'}</p>
                          <p className="text-[10px] opacity-60 mt-0.5">{user.uid}</p>
                       </td>
                       <td className="px-8 py-5 text-xs font-bold text-on-surface-variant">
                          {user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy", { locale: es }) : 'N/A'}
                       </td>
                       <td className="px-8 py-5">
                          <span className={cn(
                             "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                             user.role === 'admin' ? "bg-primary/10 border-primary text-primary" : 
                             user.role === 'moderator' ? "bg-purple-100 border-purple-300 text-purple-700" :
                             "bg-on-surface-variant/5 border-on-surface-variant/20 text-on-surface-variant"
                          )}>
                             {user.role || 'user'}
                          </span>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                             {/* User Button */}
                             <button 
                               onClick={() => updateRole(user.id, 'user')}
                               className={cn(
                                 "w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
                                 user.role === 'user' ? "bg-on-surface text-surface border-on-surface" : "bg-white border-outline-variant hover:border-on-surface text-on-surface-variant hover:text-on-surface"
                               )}
                               title="Usuario Estándar"
                             >
                                <User size={16} />
                             </button>
   
                             {/* Moderator Button */}
                             <button 
                               onClick={() => updateRole(user.id, 'moderator')}
                               className={cn(
                                 "w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
                                 user.role === 'moderator' ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/20" : "bg-white border-outline-variant hover:border-purple-500 text-on-surface-variant hover:text-purple-500"
                               )}
                               title="Moderador de Chat/Muro"
                             >
                                <Gavel size={16} />
                             </button>
   
                             {/* Admin Button */}
                             <button 
                               onClick={() => updateRole(user.id, 'admin')}
                               className={cn(
                                 "w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
                                 user.role === 'admin' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary"
                               )}
                               title="Administrador Total"
                             >
                                <Shield size={16} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AdminUsers;
