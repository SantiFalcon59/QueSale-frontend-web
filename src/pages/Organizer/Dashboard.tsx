import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Ticket, DollarSign, Calendar, Plus, Edit, Trash, BarChart3, TrendingUp, Users as UsersIcon, Sparkles, Building, ArrowRight, Upload, X, Camera, Loader2, Search, Shield, UserPlus, Check, Link, Copy, Star, ExternalLink, Eye, Heart, MessageCircle, Percent, ShieldCheck, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, resolveAssetUrl } from '../../services/apiClient';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { OrganizerAvatar } from '../../components/ui/OrganizerAvatar';
import { toastSuccess, toastError, confirmAction } from '../../lib/swal';

const OrganizerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'insights' | 'events' | 'staff'>('insights');
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [organization, setOrganization] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ name: '', description: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingOrg, setEditingOrg] = useState(false);
  const [editOrgData, setEditOrgData] = useState({ name: '', description: '', instagram: '', tiktok: '', twitter: '', website: '', real_name: '', dni: '', address: '', phone_number: '' });
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffSearchResults, setStaffSearchResults] = useState<any[]>([]);
  const [selectedStaffRole, setSelectedStaffRole] = useState('moderator');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Featured Events State
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [selectedEventToFeature, setSelectedEventToFeature] = useState<any>(null);
  const [featuredPricing, setFeaturedPricing] = useState<any>(null);
  const [isProcessingFeatured, setIsProcessingFeatured] = useState(false);

  const handleLogoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleLogoSelect(file);
  }, []);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const orgsData: any = await api.getMyOrganizers(1, 10);
      const orgs = orgsData?.data || orgsData || [];
      if (orgs.length > 0) {
        const org = orgs[0];
        setOrganization({
          id: org.id_organizer,
          name: org.name,
          description: org.description,
          logo_url: org.logo_url,
          verified: org.verified,
          id_creator: org.id_creator,
          mp_public_key: org.mp_public_key,
          mp_access_token: org.mp_access_token,
          instagram: org.instagram,
          tiktok: org.tiktok,
          twitter: org.twitter,
          website: org.website,
          real_name: org.real_name,
          dni: org.dni,
          address: org.address,
          phone_number: org.phone_number,
        });
        setEditOrgData({ 
          name: org.name, 
          description: org.description || '',
          instagram: org.instagram || '',
          tiktok: org.tiktok || '',
          twitter: org.twitter || '',
          website: org.website || '',
          real_name: org.real_name || '',
          dni: org.dni || '',
          address: org.address || '',
          phone_number: org.phone_number || ''
        });

        const eventsData: any = await api.getOrganizerEvents(org.id_organizer, 1, 50);
        const eventList = eventsData?.data || eventsData || [];
        setEvents(eventList);

        try {
          const staffData: any = await api.getOrganizerAdmins(org.id_organizer);
          const staff = staffData?.data || staffData || [];
          setStaffList(staff.map((s: any) => ({
            id: s.id_user,
            name: s.user?.username || 'Usuario',
            role: s.role,
            username: s.user?.username,
            photo_url: s.user?.profile?.photo_url,
          })));
        } catch {
          setStaffList([]);
        }

        try {
          const analytics: any = await api.getOrganizerDashboard(org.id_organizer);
          setDashboardData(analytics);
        } catch {
          setDashboardData(null);
        }

        // Fetch pricing
        try {
          const pricing = await api.getFeaturedPricing();
          setFeaturedPricing(pricing);
        } catch (err) {
          console.error("Error fetching featured pricing:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching org data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  useEffect(() => {
    api.getOrganizerRoles().then(setAvailableRoles).catch(() => setAvailableRoles(['admin', 'moderator']));
  }, []);

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

      if (logoFile && created.id_organizer) {
        try {
          await api.uploadOrganizerLogo(logoFile, created.id_organizer);
        } catch (err) {
          console.error('Error uploading logo:', err);
        }
      }

      await fetchAll();
      setShowCreateForm(false);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err: any) {
      setError(err.message || "Error al crear la organización.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrg = async () => {
    if (!organization) return;
    try {
      await api.updateOrganizer(organization.id, {
        name: editOrgData.name,
        description: editOrgData.description,
        instagram: editOrgData.instagram,
        tiktok: editOrgData.tiktok,
        twitter: editOrgData.twitter,
        website: editOrgData.website,
        real_name: editOrgData.real_name,
        dni: editOrgData.dni,
        address: editOrgData.address,
        phone_number: editOrgData.phone_number
      });
      if (logoFile) {
        await api.uploadOrganizerLogo(logoFile, organization.id);
      }
      setOrganization(prev => ({ 
        ...prev, 
        name: editOrgData.name, 
        description: editOrgData.description,
        instagram: editOrgData.instagram,
        tiktok: editOrgData.tiktok,
        twitter: editOrgData.twitter,
        website: editOrgData.website,
        real_name: editOrgData.real_name,
        dni: editOrgData.dni,
        address: editOrgData.address,
        phone_number: editOrgData.phone_number,
      }));
      setEditingOrg(false);
      await fetchAll();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const confirmed = await confirmAction('¿Eliminar este evento?', 'Esta acción no se puede deshacer.');
    if (!confirmed) return;
    try {
      await api.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id_event !== eventId));
      toastSuccess('Evento eliminado');
    } catch (err: any) {
      toastError(err.message || 'Error al eliminar');
    }
  };

  const handleOpenFollowers = async () => {
    if (!organization) return;
    setShowFollowersModal(true);
    try {
      const data: any = await api.getOrganizerFollowers(organization.id, 1, 50);
      const followersList = data?.data || data || [];
      setFollowers(followersList);
    } catch {
      setFollowers([]);
    }
  };

  const handleSearchUsers = async () => {
    if (!staffSearch.trim()) return;
    setSearchingUsers(true);
    setHasSearched(true);
    try {
      const result: any = await api.searchUsers(staffSearch.trim());
      const users = result?.users || [];
      setStaffSearchResults(users);
    } catch (err) {
      console.error("Error searching users:", err);
      setStaffSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddStaff = async (userId: string) => {
    if (!organization) return;
    try {
      await api.addOrganizerAdmin(organization.id, userId, selectedStaffRole);
      await fetchAll();
      toastSuccess('Staff agregado correctamente');
      setShowAddStaffModal(false);
      setStaffSearch('');
      setStaffSearchResults([]);
    } catch (err: any) {
      toastError(err.message || 'Error al agregar staff');
    }
  };

  const handleRemoveStaff = async (memberId: string) => {
    const confirmed = await confirmAction('¿Eliminar staff?', 'Este miembro perderá acceso al panel de administración.');
    if (!confirmed) return;
    try {
      await api.removeOrganizerAdmin(organization.id, memberId);
      setStaffList(prev => prev.filter(s => s.id !== memberId));
      toastSuccess('Staff eliminado correctamente');
    } catch (err: any) {
      toastError(err.message || 'Error al eliminar staff');
    }
  };

  const handleConfirmFeature = async (level: number) => {
    if (!selectedEventToFeature || !organization) return;
    setIsProcessingFeatured(true);
    try {
      const result: any = await api.createFeaturedEvent(
        selectedEventToFeature.id_event,
        level,
        organization.id
      );

      const paymentLink: any = await api.generateFeaturedPaymentLink(
        result.featured.id_featured_event,
        organization.name,
        profile?.email || user?.email || 'contact@quesale.com'
      );

      if (paymentLink.payment_url) {
        window.location.href = paymentLink.payment_url;
      }
    } catch (err: any) {
      toastError(err.message || 'Error al procesar el destacado');
    } finally {
      setIsProcessingFeatured(false);
    }
  };

  const isCreator = organization?.id_creator === user?.uid;
  const isStaff = staffList.some((s: any) => s.id === user?.uid) || isCreator;

  const d = dashboardData || {};
  const stats = [
    { label: 'Eventos', value: d.total_events || events.length || 0, icon: Calendar, color: 'text-primary' },
    { label: 'Tickets Vendidos', value: d.total_tickets || 0, icon: Ticket, color: 'text-secondary' },
    { label: 'Seguidores', value: d.followers || 0, icon: UsersIcon, color: 'text-tertiary' },
    { label: 'Rating Promedio', value: d.avg_rating ? `${d.avg_rating}/5` : 'Sin reviews', icon: Sparkles, color: 'text-on-surface' },
  ];

  const extraStats = [
    { label: 'Vistas Eventos', value: d.total_event_views || 0, icon: Eye, color: 'text-blue-600' },
    { label: 'Vistas Perfil', value: d.total_profile_views || 0, icon: Eye, color: 'text-purple-600' },
    { label: 'Ingresos', value: d.revenue ? `$${Number(d.revenue).toLocaleString('es-AR')}` : '$0', icon: DollarSign, color: 'text-green-600' },
    { label: 'Guardados', value: d.total_saves || 0, icon: Heart, color: 'text-red-500' },
    { label: 'Engagement', value: (d.total_posts || 0) + (d.total_comments || 0) + (d.total_reactions || 0), icon: MessageCircle, color: 'text-amber-500' },
    { label: 'Mensajes Chat', value: d.total_chat_messages || 0, icon: MessageSquare, color: 'text-cyan-600' },
    { label: 'Ocupación', value: d.capacity_utilization ? `${Math.round(d.capacity_utilization * 100)}%` : '0%', icon: Percent, color: 'text-indigo-500' },
    { label: 'Validación', value: d.validation_rate ? `${Math.round(d.validation_rate * 100)}%` : '0%', icon: ShieldCheck, color: 'text-teal-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (!organization && !showCreateForm) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center space-y-10">
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
            <h4 className="font-bold">Análisis en Tiempo Real</h4>
            <p className="text-xs text-on-surface-variant font-medium">Métricas de ventas, asistencia y engagement.</p>
          </div>
          <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant space-y-2">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-2">
              <UsersIcon size={20} />
            </div>
            <h4 className="font-bold">Gestión de Comunidad</h4>
            <p className="text-xs text-on-surface-variant font-medium">Conecta con tu audiencia y gestiona tu equipo.</p>
          </div>
          <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Ticket size={20} />
            </div>
            <h4 className="font-bold">Ticketing QR</h4>
            <p className="text-xs text-on-surface-variant font-medium">Validación segura para un ingreso fluido.</p>
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
          <p className="text-on-surface-variant font-medium">Define cómo te verá la comunidad.</p>
        </header>

        <form onSubmit={handleCreateOrg} className="p-8 rounded-[3rem] bg-surface-container-low border border-outline-variant space-y-6 shadow-xl">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Logo de la Organización</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all duration-200",
                isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-outline-variant hover:border-primary/40 hover:bg-surface-container-low/50"
              )}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoSelect(file); }} />
              {logoPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <img src={logoPreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border-4 border-primary/20 shadow-lg" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(null); }} className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <X size={12} />
                    </button>
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">Click o arrastra para cambiar</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload size={20} className="text-primary" />
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium text-center">Arrastra una imagen, haz click o pega con Ctrl+V</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Nombre</label>
            <input
              required
              value={newOrgData.name}
              onChange={e => setNewOrgData({ ...newOrgData, name: e.target.value })}
              placeholder="Ej: Klink Studios"
              className="w-full bg-white border border-outline-variant rounded-2xl h-14 px-6 focus:border-primary outline-none font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Descripción</label>
            <textarea
              required
              value={newOrgData.description}
              onChange={e => setNewOrgData({ ...newOrgData, description: e.target.value })}
              placeholder="¿Qué tipo de eventos organizas?"
              className="w-full bg-white border border-outline-variant rounded-2xl p-6 focus:border-primary outline-none min-h-[100px] font-medium leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary h-16 text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Building size={20} />}
            FUNDAR ORGANIZACIÓN
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="pl-4 lg:pl-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10px] text-primary uppercase tracking-[0.4em] font-black italic">Panel de Organización</p>
            {organization?.verified && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
                <Sparkles size={12} className="fill-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">Verificada</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <OrganizerAvatar 
              src={resolveAssetUrl(organization?.logo_url)} 
              alt={organization?.name} 
              className="w-16 h-16 rounded-2xl object-cover bg-surface-container-low border border-outline-variant" 
              size={28}
            />
            <div>
              <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">{organization?.name}</h1>
              <p className="text-xs text-on-surface-variant font-medium mt-1 max-w-md">{organization?.description}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/organizer/${organization.id}`)}
            className="h-12 px-6 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary"
          >
            <ExternalLink size={14} /> Ver Perfil Público
          </button>
          <button
            onClick={() => {
              setEditingOrg(true);
              if (organization) {
                setEditOrgData({
                  name: organization.name || '',
                  description: organization.description || '',
                  instagram: organization.instagram || '',
                  tiktok: organization.tiktok || '',
                  twitter: organization.twitter || '',
                  website: organization.website || '',
                  real_name: organization.real_name || '',
                  dni: organization.dni || '',
                  address: organization.address || '',
                  phone_number: organization.phone_number || ''
                });
              }
            }}
            className="h-12 px-6 rounded-2xl border border-outline-variant hover:bg-surface-container-low transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <Edit size={14} /> Editar Org
          </button>
          <button
            onClick={() => navigate('/organizer/new')}
            className="h-12 px-8 rounded-2xl bg-primary text-white flex items-center gap-2 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            <Plus size={16} /> Crear Evento
          </button>
        </div>
      </header>

      {/* Edit Org Modal */}
      <AnimatePresence>
        {editingOrg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditingOrg(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-outline-variant shrink-0">
                <h2 className="text-xl font-black">Editar Organización</h2>
                <button onClick={() => setEditingOrg(false)} className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto flex-1 no-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Logo</label>
                  <div className="flex items-center gap-4">
                    <OrganizerAvatar src={logoPreview || resolveAssetUrl(organization?.logo_url)} alt="Logo" className="w-16 h-16 rounded-2xl object-cover bg-surface-container-low border border-outline-variant" size={28} />
                    <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs">Cambiar Logo</button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoSelect(file); }} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Nombre</label>
                  <input value={editOrgData.name} onChange={e => setEditOrgData(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Descripción</label>
                  <textarea value={editOrgData.description} onChange={e => setEditOrgData(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium resize-none min-h-[80px]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Instagram</label>
                      <input value={editOrgData.instagram} onChange={e => setEditOrgData(prev => ({ ...prev, instagram: e.target.value }))} placeholder="@usuario" className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">TikTok</label>
                      <input value={editOrgData.tiktok} onChange={e => setEditOrgData(prev => ({ ...prev, tiktok: e.target.value }))} placeholder="@usuario" className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Twitter / X</label>
                      <input value={editOrgData.twitter} onChange={e => setEditOrgData(prev => ({ ...prev, twitter: e.target.value }))} placeholder="@usuario" className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Sitio Web</label>
                      <input value={editOrgData.website} onChange={e => setEditOrgData(prev => ({ ...prev, website: e.target.value }))} placeholder="https://..." className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                   </div>
                </div>

                <div className="pt-4 border-t border-outline-variant space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="text-secondary" size={16} />
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Datos para Verificación (Opcional)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Nombre Real</label>
                        <input value={editOrgData.real_name} onChange={e => setEditOrgData(prev => ({ ...prev, real_name: e.target.value }))} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">DNI / CUIT</label>
                        <input value={editOrgData.dni} onChange={e => setEditOrgData(prev => ({ ...prev, dni: e.target.value }))} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Teléfono</label>
                        <input value={editOrgData.phone_number} onChange={e => setEditOrgData(prev => ({ ...prev, phone_number: e.target.value }))} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Dirección Comercial</label>
                        <input value={editOrgData.address} onChange={e => setEditOrgData(prev => ({ ...prev, address: e.target.value }))} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                     </div>
                  </div>
                </div>

                {organization?.verified ? (
                  <div className="pt-4 border-t border-outline-variant space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                       <img src="https://www.mercadopago.com/instore/merchant/bundles/mptheme/images/logo-mercadopago.png" alt="MP" className="h-3" />
                       <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Configuración de Cobros</h4>
                    </div>
                    
                    {organization.mp_access_token ? (
                      <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                        <p className="text-xs text-green-800 font-bold flex items-center gap-2">
                          <Check size={16} /> Cuenta de Mercado Pago Conectada
                        </p>
                        <p className="text-[10px] text-green-700 mt-1">
                          Los pagos de tus eventos irán directamente a tu cuenta.
                        </p>
                        <button 
                          type="button"
                          onClick={async () => {
                              const confirmed = await confirmAction('¿Desconectar Mercado Pago?', 'Dejarás de recibir pagos de entradas a través de Mercado Pago.');
                              if (!confirmed) return;
                              try {
                                 await api.delete(`/api/organizers/${organization.id}/oauth/mercadopago`);
                                 await fetchAll();
                                 toastSuccess('Cuenta de Mercado Pago desconectada');
                              } catch (e) {
                                 toastError('Error al desconectar');
                              }
                           }}
                          className="mt-3 text-[10px] font-bold text-red-600 hover:underline"
                        >
                          Desconectar cuenta
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-on-surface-variant font-medium">
                          Conecta tu cuenta de Mercado Pago para recibir el dinero de las entradas directamente.
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                             try {
                               const res: any = await api.get(`/api/organizers/${organization.id}/oauth/mercadopago`);
                               if (res && res.url) {
                                 window.location.href = res.url;
                               }
                             } catch (e) {
                                toastError('Error al iniciar la conexión con Mercado Pago');
                             }
                          }}
                          className="w-full bg-[#009EE3] hover:bg-[#0089C5] text-white rounded-xl px-4 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <Link size={18} />
                          Conectar con Mercado Pago
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-outline-variant space-y-4">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-[10px] text-amber-800 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Shield size={14} /> Función de Pagos Bloqueada
                      </p>
                      <p className="text-xs text-amber-700 mt-2 font-medium">
                        La integración con Mercado Pago está disponible solo para organizaciones verificadas. Contáctate con soporte para verificar tu organización.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-outline-variant space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant flex items-center gap-2">
                     <Shield size={14} className="text-primary" /> Datos de Verificación (Nivel 2)
                  </h4>
                  <p className="text-[11px] text-on-surface-variant font-medium">
                     Completa estos datos legales para solicitar la verificación y habilitar el cobro de entradas.
                  </p>
                  <div className="space-y-3">
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Nombre Legal o Razón Social</label>
                        <input value={editOrgData.real_name} onChange={e => setEditOrgData(prev => ({ ...prev, real_name: e.target.value }))} placeholder="Ej: Productora S.A." className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                           <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">DNI / CUIT</label>
                           <input value={editOrgData.dni} onChange={e => setEditOrgData(prev => ({ ...prev, dni: e.target.value }))} placeholder="Sin guiones" className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Teléfono</label>
                           <input value={editOrgData.phone_number} onChange={e => setEditOrgData(prev => ({ ...prev, phone_number: e.target.value }))} placeholder="+54 9..." className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-4">Dirección Fiscal</label>
                        <input value={editOrgData.address} onChange={e => setEditOrgData(prev => ({ ...prev, address: e.target.value }))} placeholder="Calle 123, Ciudad, Provincia" className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium" />
                     </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-outline-variant shrink-0">
                <button onClick={() => setEditingOrg(false)} className="btn-secondary flex-1">CANCELAR</button>
                <button onClick={handleUpdateOrg} className="btn-primary flex-1">GUARDAR</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Modal */}
      <AnimatePresence>
        {showFeaturedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowFeaturedModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-outline-variant relative">
                <button onClick={() => setShowFeaturedModal(false)} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-surface-container-low transition-colors"><X size={20} /></button>
                <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mb-6 transform -rotate-6">
                  <Star size={32} className="fill-primary" />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Destacar Evento</h2>
                <p className="text-on-surface-variant font-medium mt-2">Aumenta la visibilidad de "{selectedEventToFeature?.title}" y llega a más personas.</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredPricing && Object.values(featuredPricing).map((tier: any) => (
                    <button
                      key={tier.level}
                      onClick={() => handleConfirmFeature(tier.level)}
                      disabled={isProcessingFeatured}
                      className="group p-6 rounded-[2rem] border border-outline-variant hover:border-primary/50 hover:bg-primary/5 transition-all text-left space-y-4 relative overflow-hidden"
                    >
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ArrowRight size={20} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black italic tracking-tight">{tier.name}</h4>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{tier.duration_days} días de visibilidad</p>
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{tier.description}</p>
                      <div className="pt-2">
                        <span className="text-2xl font-black">${tier.price}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase ml-2">ARS</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-800">Impulsado por IA</h5>
                    <p className="text-xs text-amber-700 font-medium mt-1">Los eventos destacados tienen prioridad en el feed de descubrimiento y en las recomendaciones personalizadas.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-surface-container-low border-t border-outline-variant flex items-center justify-center gap-2">
                <img src="https://www.mercadopago.com/instore/merchant/bundles/mptheme/images/logo-mercadopago.png" alt="Mercado Pago" className="h-4 opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-50">Pagos seguros y rápidos</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Followers Modal */}
      <AnimatePresence>
        {showFollowersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowFollowersModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-outline-variant">
                <h2 className="text-xl font-black flex items-center gap-2"><UsersIcon size={20} className="text-primary" /> Seguidores</h2>
                <button onClick={() => setShowFollowersModal(false)} className="p-2 rounded-xl hover:bg-surface-container-low transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {followers.length > 0 ? (
                  <div className="space-y-4">
                    {followers.map((follower: any, i: number) => {
                      const u = follower.user || follower;
                      return (
                        <div key={u?.id_user || i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors">
                          <UserAvatar src={resolveAssetUrl(u?.profile?.photo_url)} className="w-10 h-10 rounded-xl bg-surface-container-high" alt="" size={20} />
                          <div>
                            <p className="text-sm font-bold">@{u?.username || 'Usuario'}</p>
                            <p className="text-[10px] text-on-surface-variant">Te sigue desde {follower.created_at ? new Date(follower.created_at).toLocaleDateString('es-ES') : 'reciente'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-on-surface-variant">
                    <UsersIcon size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aún no tienes seguidores</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reports Modal */}
      <AnimatePresence>
        {showReportsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowReportsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-outline-variant">
                <h2 className="text-xl font-black flex items-center gap-2"><TrendingUp size={20} className="text-secondary" /> Reportes</h2>
                <button onClick={() => setShowReportsModal(false)} className="p-2 rounded-xl hover:bg-surface-container-low transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Total Tickets</p>
                    <p className="text-3xl font-black mt-1">{d.total_tickets || 0}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Eventos</p>
                    <p className="text-3xl font-black mt-1">{d.total_events || events.length || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-700">Ingresos</p>
                    <p className="text-3xl font-black mt-1 text-green-800">${Number(d.revenue || 0).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Vistas</p>
                    <p className="text-2xl font-black mt-1 text-blue-800">{d.total_event_views || 0} eventos · {d.total_profile_views || 0} perfil</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Eventos por Estado</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Activos</span>
                      <span className="text-sm font-black text-green-600">{events.filter(e => e.status === 'active').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Finalizados</span>
                      <span className="text-sm font-black text-gray-500">{events.filter(e => e.status !== 'active').length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Distribución de Ratings</p>
                  {d.avg_rating_count > 0 ? (
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = d.rating_distribution?.[String(star)] || 0;
                        const pct = d.avg_rating_count > 0 ? (count / d.avg_rating_count) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="text-xs font-black w-4">{star}</span>
                            <div className="flex-1 h-3 rounded-full bg-outline-variant/30 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-on-surface-variant w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                      <p className="text-[10px] text-on-surface-variant font-medium mt-2 text-center">
                        {d.avg_rating}/5 promedio · {d.avg_rating_count} reviews
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant font-medium text-center py-4">Sin reviews aún</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Seguidores</p>
                    <p className="text-2xl font-black">{d.followers || 0}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1 font-medium">
                      +{d.follower_growth_30d || 0} en 30 días
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Rendimiento</p>
                    <p className="text-sm font-black">Ocupación: {d.capacity_utilization ? `${Math.round(d.capacity_utilization * 100)}%` : '0%'}</p>
                    <p className="text-sm font-black">Validación: {d.validation_rate ? `${Math.round(d.validation_rate * 100)}%` : '0%'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddStaffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => { setShowAddStaffModal(false); setStaffSearchResults([]); setStaffSearch(''); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-outline-variant">
                <h2 className="text-xl font-black flex items-center gap-2"><UserPlus size={20} className="text-primary" /> Agregar Staff</h2>
                <button onClick={() => { setShowAddStaffModal(false); setStaffSearchResults([]); setStaffSearch(''); setHasSearched(false); }} className="p-2 rounded-xl hover:bg-surface-container-low transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                      placeholder="Buscar por username..."
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium"
                    />
                  </div>
                  <button onClick={handleSearchUsers} disabled={searchingUsers || !staffSearch.trim()} className="btn-primary px-4 text-xs font-black uppercase tracking-widest disabled:opacity-50">
                    {searchingUsers ? <Loader2 size={16} className="animate-spin" /> : 'Buscar'}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Rol</label>
                  <div className="flex gap-2">
                    {availableRoles.map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedStaffRole(role)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          selectedStaffRole === role ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant hover:border-primary/30"
                        )}
                      >
                        {role === 'admin' ? 'Administrador' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {staffSearchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {staffSearchResults.filter((u: any) => !staffList.some((s: any) => s.id === u.id_user)).map((u: any) => (
                      <div key={u.id_user} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={resolveAssetUrl(u.photo_url)} className="w-8 h-8 rounded-lg bg-surface-container-high" alt="" size={18} />
                          <span className="text-sm font-bold">@{u.username}</span>
                        </div>
                        <button onClick={() => handleAddStaff(u.id_user)} className="btn-primary px-3 py-1.5 text-[9px] font-black uppercase tracking-widest">Agregar</button>
                      </div>
                    ))}
                  </div>
                )}
                {staffSearchResults.length === 0 && hasSearched && !searchingUsers && (
                  <p className="text-center text-sm text-on-surface-variant py-4">No se encontraron usuarios o ya son staff</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-outline-variant">
        {[
          { id: 'insights', label: 'Dashboard', icon: BarChart3 },
          { id: 'events', label: 'Mis Eventos', icon: Calendar },
          { id: 'staff', label: 'Staff', icon: UsersIcon },
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

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-[2rem] bg-surface-container-low border border-outline-variant hover:border-primary/20 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-3 rounded-2xl bg-surface-container-high transition-colors group-hover:bg-primary/20", stat.color)}>
                    <stat.icon size={22} />
                  </div>
                </div>
                <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black">{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          {/* Extra Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {extraStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant hover:border-primary/20 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("p-2 rounded-xl bg-surface-container-high", stat.color)}>
                    <stat.icon size={16} />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                </div>
                <h3 className="text-xl font-black ml-1">{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          {/* Descubrimiento Section */}
          <section className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2"><BarChart3 size={20} className="text-secondary" /> Descubrimiento</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-white/50 border border-outline-variant/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Vistas Totales</p>
                <p className="text-2xl font-black">{d.total_event_views || 0}</p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">en todos los eventos</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/50 border border-outline-variant/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Guardados</p>
                <p className="text-2xl font-black">{d.total_saves || 0}</p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">eventos favoritos</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/50 border border-outline-variant/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Tasa de Conversión</p>
                <p className="text-2xl font-black">
                  {d.total_event_views > 0
                    ? `${Math.round(((d.total_saves || 0) / d.total_event_views) * 1000) / 10}%`
                    : '0%'}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">guardados / vistas</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/50 border border-outline-variant/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Top por Vistas</p>
                <p className="text-sm font-black truncate">{d.trending?.top_by_views || '—'}</p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">evento más visto</p>
              </div>
            </div>
          </section>

          {/* Recent Events */}
          <section className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Eventos Recientes</h3>
              <button onClick={() => setActiveTab('events')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </button>
            </div>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.slice(0, 6).map(event => {
                  const evMetrics = (d.per_event || []).find((p: any) => p.id_event === event.id_event);
                  return (
                    <div key={event.id_event} className="p-4 rounded-2xl bg-white/50 border border-transparent hover:border-primary/20 transition-all flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate">{event.title}</h4>
                        <p className="text-[10px] text-on-surface-variant font-medium">
                          {event.date ? new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin fecha'}
                        </p>
                        {evMetrics && (
                          <div className="flex gap-2 mt-1">
                            <span className="text-[8px] font-bold text-blue-600"><Eye size={8} className="inline mr-0.5" />{evMetrics.views}</span>
                            <span className="text-[8px] font-bold text-green-600"><Ticket size={8} className="inline mr-0.5" />{evMetrics.tickets_sold}</span>
                            <span className="text-[8px] font-bold text-amber-600"><Star size={8} className="inline mr-0.5" />{evMetrics.avg_rating > 0 ? evMetrics.avg_rating : '—'}</span>
                          </div>
                        )}
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                        event.status === 'active' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                      )}>
                        {event.status === 'active' ? 'Activo' : 'Finalizado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-8">No hay eventos aún. ¡Crea tu primer evento!</p>
            )}
          </section>

          {/* Quick Actions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-[2.5rem] bg-primary text-white space-y-4 shadow-xl shadow-primary/20">
              <UsersIcon size={32} />
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest italic">Seguidores</h4>
                <p className="text-xs font-medium opacity-80 mt-1">{d.followers || 0} personas siguen tu organización</p>
              </div>
              <button onClick={handleOpenFollowers} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Ver seguidores</button>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant space-y-4">
              <TrendingUp size={32} className="text-secondary" />
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest">Tickets</h4>
                <p className="text-xs text-on-surface-variant mt-1">{d.total_tickets || 0} tickets emitidos en total</p>
              </div>
              <button onClick={() => setShowReportsModal(true)} className="w-full py-3 bg-secondary/10 hover:bg-secondary/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-secondary transition-all">Ver reportes</button>
            </div>
          </section>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.length > 0 ? (
            events.map(event => (
              <div key={event.id_event} className="group bg-white rounded-[2.5rem] border border-outline-variant hover:border-primary/50 transition-all overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5 p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center">
                    <Calendar size={24} className="text-on-surface-variant" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={cn(
                      "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                      event.status === 'active' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {event.status === 'active' ? 'Publicado' : 'Finalizado'}
                    </div>
                    {event.featured_level > 0 && (
                      <div className="px-3 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Star size={10} className="fill-amber-500" /> Destacado
                      </div>
                    )}
                  </div>
                </div>
                {(() => {
                  const evMetrics = (d.per_event || []).find((p: any) => p.id_event === event.id_event);
                  return (
                    <div className="space-y-2">
                      <h3 className="text-xl font-black italic tracking-tight truncate">{event.title}</h3>
                      <div className="flex items-center gap-2 opacity-60">
                        <Calendar size={12} />
                        <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">
                          {event.date ? new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                        </p>
                      </div>
                      {event.ubication && <p className="text-[9px] text-on-surface-variant font-medium truncate">{event.ubication}</p>}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {evMetrics ? (
                          <>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-widest">
                              <Eye size={10} className="inline mr-0.5" />{evMetrics.views}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[8px] font-black uppercase tracking-widest">
                              <Ticket size={10} className="inline mr-0.5" />{evMetrics.tickets_sold}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-widest">
                              <Heart size={10} className="inline mr-0.5" />{evMetrics.saves}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[8px] font-black uppercase tracking-widest">
                              <Star size={10} className="inline mr-0.5" />{evMetrics.avg_rating > 0 ? `${evMetrics.avg_rating}` : '—'}
                            </span>
                            {evMetrics.fill_rate > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest">
                                {Math.round(evMetrics.fill_rate * 100)}% ocupado
                              </span>
                            )}
                          </>
                        ) : (
                          event.capacity && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                              {event.capacity} lugares
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })()}
                <div className="pt-4 flex flex-wrap gap-2 border-t border-outline-variant/30">
                  <button
                    onClick={() => navigate(`/events/${event.id_event}`)}
                    className="flex-1 h-10 rounded-xl bg-surface-container-high text-[9px] font-black uppercase tracking-widest hover:bg-on-surface hover:text-white transition-all min-w-[60px]"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEventToFeature(event);
                      setShowFeaturedModal(true);
                    }}
                    className={cn(
                      "h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border",
                      event.featured_level > 0 
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-surface text-primary border-outline-variant hover:bg-primary/10"
                    )}
                    disabled={event.featured_level > 0}
                  >
                    <Star size={14} className={event.featured_level > 0 ? "fill-amber-500" : ""} />
                    {event.featured_level > 0 ? 'Destacado' : 'Destacar'}
                  </button>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => navigate('/organizer/new', { state: { copyData: event } })}
                      className="h-10 w-10 rounded-xl bg-surface text-primary border border-outline-variant flex items-center justify-center hover:bg-primary/10 transition-all"
                      title="Copiar Evento"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => navigate(`/organizer/edit/${event.id_event}`)}
                      className="h-10 w-10 rounded-xl bg-surface text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center border border-outline-variant"
                      title="Editar Evento"
                    >
                      <Edit size={14} />
                    </button>
                    {isCreator && (
                      <button
                        onClick={() => handleDeleteEvent(event.id_event)}
                        className="h-10 w-10 rounded-xl bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                        title="Eliminar Evento"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
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

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="max-w-4xl space-y-10">
          <section className="bg-white rounded-[3rem] border border-outline-variant p-10 space-y-8 shadow-sm">
            <header className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-black italic tracking-tight">Staff de la Organización</h3>
                <p className="text-on-surface-variant text-sm font-medium">Gestiona quién tiene acceso a la administración.</p>
              </div>
              {isStaff && (
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="btn-primary h-10 px-5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <UserPlus size={14} /> Agregar
                </button>
              )}
            </header>

            {/* Creator row */}
            <div className="py-6 flex items-center justify-between border-b border-outline-variant/30">
              <div className="flex items-center gap-4">
                <UserAvatar src={resolveAssetUrl(profile?.photoURL)} className="w-12 h-12 rounded-xl bg-surface-container-high" alt="" size={24} />
                <div>
                  <p className="text-sm font-black italic">@{profile?.displayName || profile?.username || 'Creador'}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1"><Shield size={10} /> Creador</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-outline-variant/30">
              {staffList.length > 0 ? staffList.map(member => (
                <div key={member.id} className="py-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <UserAvatar src={resolveAssetUrl(member.photo_url)} className="w-12 h-12 rounded-xl bg-surface-container-high" alt={member.name} size={24} />
                    <div>
                      <p className="text-sm font-black italic">@{member.username || member.name}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{member.role}</p>
                    </div>
                  </div>
                  {isCreator && (
                    <button
                      onClick={() => handleRemoveStaff(member.id)}
                      className="p-2.5 rounded-xl hover:bg-red-50 text-on-surface-variant transition-all hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <Trash size={18} />
                    </button>
                  )}
                </div>
              )) : (
                <div className="py-12 text-center text-sm text-on-surface-variant">
                  <UsersIcon size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No hay staff adicional. Solo el creador tiene acceso.</p>
                </div>
              )}
            </div>
          </section>

          <section className="p-10 rounded-[3rem] bg-surface-container-low border border-outline-variant space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="text-primary" size={24} />
              <h4 className="text-sm font-black uppercase tracking-widest italic">Sobre los Roles</h4>
            </div>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
              Los <span className="font-bold">Administradores</span> tienen acceso completo a la organización y pueden gestionar el staff.
              Los <span className="font-bold">Moderadores</span> pueden crear y modificar eventos.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
