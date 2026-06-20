import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, AlertCircle, Building, Search, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../services/apiClient';
import { OrganizerAvatar } from '../../components/ui/OrganizerAvatar';
import { toastSuccess, toastError, confirmAction } from '../../lib/swal';

const AdminOrganizations: React.FC = () => {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
            const data: any = await api.getOrganizers(1, 50);
            const mapped = (data || []).map((org: any) => ({
               id: org.id_organizer,
               name: org.name,
               description: org.description,
               logo: org.logo_url,
               handle: org.name?.toLowerCase().replace(/\s+/g, '_') || 'organizer',
               ownerId: org.id_creator,
               verificationLevel: org.verified ? 2 : 1,
               status: org.verified ? 'verified' : 'pending_verification',
               instagram: org.instagram || '',
               tiktok: org.tiktok || '',
               verificationInfo: {
                 realName: org.real_name,
                 dni: org.dni,
                 address: org.address,
                 phone: org.phone_number
               },
            }));
            setOrgs(mapped);
      } catch (err) {
        console.error("Error fetching orgs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const handleVerify = async (orgId: string, level: number) => {
    const confirmed = await confirmAction(`¿Cambiar verificación?`, `¿Estás seguro de que quieres cambiar el estado de verificación de esta organización a Nivel ${level}?`);
    if (!confirmed) return;
    try {
      await api.put(`/api/organizers/${orgId}/verify`, { verified: level === 2 }, { auth: true });
      setOrgs(prev => prev.map(org => {
        if(org.id === orgId) {
          return {
            ...org,
            verificationLevel: level,
            status: level === 2 ? 'verified' : 'pending_verification'
          };
        }
        return org;
      }));
      toastSuccess(`Verificación cambiada a Nivel ${level}`);
    } catch (err) {
      toastError('Error al actualizar la verificación');
    }
  };

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.handle.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center font-bold">Cargando Bóveda de Organizaciones...</div>;

  return (
    <div className="space-y-10 pb-20">
      <header className="space-y-2">
         <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" size={32} />
            <h1 className="text-5xl font-black italic tracking-tighter">BÓVEDA DE <span className="text-primary">ADMIN</span></h1>
         </div>
         <p className="text-on-surface-variant font-medium ml-1">Gestión y Verificación de Entidades</p>
      </header>

      <div className="relative max-w-md">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
         <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar organización..."
            className="w-full bg-surface-container-low border border-outline-variant h-14 pl-14 pr-6 rounded-2xl outline-none focus:border-primary transition-all font-bold"
         />
      </div>

      <div className="grid gap-6">
         {filteredOrgs.map((org) => (
           <motion.div 
            key={org.id}
            layout
            className="p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-surface-container-low border border-outline-variant flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 items-start md:items-center"
           >
              <div className="col-span-12 md:col-span-1 md:border-r border-outline-variant/30 pr-0 md:pr-4 pb-2 md:pb-0 shrink-0">
                 <OrganizerAvatar src={org.logo} alt={org.name} className="w-16 h-16 rounded-2xl bg-white shadow-sm object-cover" size={28} />
              </div>

              <div className="col-span-12 md:col-span-4 space-y-1 w-full min-w-0">
                 <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold truncate">{org.name}</h3>
                    {org.verificationLevel >= 2 && <CheckCircle2 className="text-green-500 shrink-0" size={16} />}
                 </div>
                 <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">@{org.handle}</p>
                 <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-medium mt-2">
                    <Building size={12} className="shrink-0" />
                    <span className="truncate">Propiedad de: {org.ownerId}</span>
                 </div>
              </div>

              <div className="col-span-12 md:col-span-3 space-y-3 w-full min-w-0">
                 <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black tracking-widest text-on-surface-variant">Info Real</p>
                    <p className="text-xs font-bold">{org.verificationInfo?.realName || 'N/A'}</p>
                    <p className="text-[10px] text-on-surface-variant">DNI/CUIT: {org.verificationInfo?.dni || 'N/A'}</p>
                    <p className="text-[10px] text-on-surface-variant">Tel: {org.verificationInfo?.phone || 'N/A'}</p>
                    <p className="text-[10px] text-on-surface-variant truncate" title={org.verificationInfo?.address || ''}>Dir: {org.verificationInfo?.address || 'N/A'}</p>
                 </div>
                  <div className="space-y-1">
                     <p className="text-[9px] uppercase font-black tracking-widest text-on-surface-variant">Social</p>
                     <a href={`https://instagram.com/${org.instagram?.replace('@', '')}`} target="_blank" className="text-xs font-black text-primary flex items-center gap-1">
                        {org.instagram} <ExternalLink size={10} />
                     </a>
                  </div>
              </div>

              <div className="col-span-12 md:col-span-4 flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-3 w-full pt-4 md:pt-0 border-t md:border-t-0 border-outline-variant/30">
                 <div className="text-left md:text-right mr-0 md:mr-4 shrink-0">
                    <p className="text-[9px] uppercase font-black tracking-widest text-on-surface-variant">Nivel Actual</p>
                    <p className={cn(
                       "text-xs font-black mt-1",
                       org.verificationLevel >= 2 ? "text-green-600" : "text-primary"
                    )}>
                       {org.verificationLevel >= 2 ? 'VERIFICADA (PRO)' : 'CUENTA REAL (L1)'}
                    </p>
                 </div>

                 {org.verificationLevel < 2 && (
                    <button 
                      onClick={() => handleVerify(org.id, 2)}
                      className="btn-primary h-12 px-6 text-[10px] font-black tracking-widest uppercase flex-grow sm:flex-grow-0"
                    >
                      Verificar Nivel 2
                    </button>
                  )}
                  {org.verificationLevel >= 2 && (
                     <button 
                       onClick={() => handleVerify(org.id, 1)}
                       className="btn-secondary h-12 px-6 text-[10px] font-black tracking-widest uppercase flex-grow sm:flex-grow-0"
                     >
                       Degradar a L1
                     </button>
                  )}
              </div>
           </motion.div>
         ))}
      </div>
    </div>
  );
};

export default AdminOrganizations;
