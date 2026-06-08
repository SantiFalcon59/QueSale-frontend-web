import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Calendar, MapPin, DollarSign, Users, Tag, Image as ImageIcon, Sparkles, Upload, X, Plus, Check, Loader2, Camera, Link, DoorOpen, Gift } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, resolveAssetUrl } from '../../services/apiClient';
import { APIProvider, Map, Marker, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

const POPULAR_TAGS = ['Anime', 'Manga', 'K-Pop', 'Gaming', 'Cosplay', 'Torneo', 'Feria', 'Convención', 'Taller', 'Karaoke', 'RPG', 'Indie', 'Art', 'Música', 'Tech'];

const STEPS = [
  { id: 'basic', label: 'Básico' },
  { id: 'media', label: 'Multimedia' },
  { id: 'location', label: 'Ubicación' },
  { id: 'tickets', label: 'Entradas' },
  { id: 'tags', label: 'Tags' },
];

const MapPicker: React.FC<{ lat: number; lng: number; onLocationChange: (lat: number, lng: number, address: string) => void }> = ({ lat, lng, onLocationChange }) => {
  const map = useMap();
  const [markerPos, setMarkerPos] = useState({ lat, lng });
  const places = useMapsLibrary('places');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const autocomplete = new places.Autocomplete(inputRef.current, { types: ['geocode'] });
    autocompleteRef.current = autocomplete;
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        setMarkerPos({ lat: newLat, lng: newLng });
        map?.panTo({ lat: newLat, lng: newLng });
        map?.setZoom(16);
        onLocationChange(newLat, newLng, place.formatted_address || '');
      }
    });
  }, [places, map]);

  useEffect(() => {
    if (map) {
      map.setCenter({ lat, lng });
      map.setZoom(14);
    }
  }, [map, lat, lng]);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="text"
        placeholder="Buscar dirección..."
        className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all font-medium"
      />
      <div className="h-64 rounded-2xl overflow-hidden border border-outline-variant relative">
        <Map
          defaultCenter={{ lat: markerPos.lat, lng: markerPos.lng }}
          defaultZoom={14}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          mapId="event-location-picker"
          onClick={(e) => {
            if (e.detail?.latLng) {
              const newLat = e.detail.latLng.lat();
              const newLng = e.detail.latLng.lng();
              setMarkerPos({ lat: newLat, lng: newLng });
              onLocationChange(newLat, newLng, `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
            }
          }}
        >
          <Marker position={{ lat: markerPos.lat, lng: markerPos.lng }} />
        </Map>
      </div>
      <p className="text-[10px] text-on-surface-variant font-medium">Haz click en el mapa para colocar el pin o busca una dirección</p>
    </div>
  );
};

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    address: '',
    lat: -34.6037,
    lng: -58.3816,
    price: 0,
    capacity: '',
    ticketType: 'free' as 'free' | 'external' | 'door',
    ticketUrl: '',
    tags: [] as string[],
    customTag: '',
  });

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      if (!user) return;
      try {
        const data: any = await api.getMyOrganizers(1, 1);
        const org = data?.[0];
        if (org) {
          setOrganization({ id: org.id_organizer, name: org.name, verified: org.verified });
        } else {
          navigate('/organizer');
        }

        const catsData: any = await api.getCategories();
        const cats = catsData?.data || catsData || [];
        setCategories(cats);
        if (cats.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: cats[0].name }));
        }
      } catch (err) {
        console.error("Error fetching org:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, [user, navigate]);

  const handleMediaSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));
    const newFiles = [...mediaFiles, ...imageFiles].slice(0, 5);
    setMediaFiles(newFiles);

    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setMediaPreviews(newPreviews);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) handleMediaSelect(e.dataTransfer.files);
  }, []);

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const addTag = (tag: string) => {
    const normalized = tag.trim();
    if (normalized && !formData.tags.includes(normalized)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, normalized] }));
    }
    setFormData(prev => ({ ...prev, customTag: '' }));
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async () => {
    if (!user || !organization) return;
    setError(null);
    setSubmitting(true);

    try {
      const eventDate = new Date(`${formData.date}T${formData.time}`);

      const created: any = await api.createEvent({
        title: formData.title,
        description: formData.description,
        date: eventDate.toISOString(),
        location: formData.address,
        organizerId: organization.id,
        interestIds: [],
        latitude: formData.lat,
        longitude: formData.lng,
        price: formData.price,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        ticket_type: formData.ticketType,
        ticket_url: formData.ticketType === 'external' ? formData.ticketUrl : undefined,
        tags: formData.tags,
      });

      if (mediaFiles.length > 0 && created?.id_event) {
        for (const file of mediaFiles) {
          try {
            await api.uploadEventMedia(file, created.id_event);
          } catch (err) {
            console.error('Error uploading media:', err);
          }
        }
      }

      navigate('/organizer');
    } catch (err: any) {
      setError(err.message || "Error al crear el evento.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.title.trim() && formData.description.trim() && formData.date && formData.time;
      case 1: return mediaFiles.length > 0;
      case 2: return formData.address.trim();
      case 3: return formData.ticketType !== 'external' || formData.ticketUrl.trim();
      case 4: return true;
      default: return false;
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
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
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
            <p className="text-[10px] text-primary uppercase tracking-[0.4em] font-black italic">Nuevo Evento</p>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">CREAR <span className="text-primary">EVENTO</span></h1>
          </div>
          {organization && (
            <div className="px-5 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-primary flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">{organization.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => { if (i < currentStep) setCurrentStep(i); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                i === currentStep ? "bg-primary text-white" :
                i < currentStep ? "bg-primary/10 text-primary" :
                "bg-surface-container-low text-on-surface-variant opacity-50"
              )}
            >
              {i < currentStep ? <Check size={12} /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
              {step.label}
            </button>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-outline-variant/30" />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold text-center"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Basic Info */}
        {currentStep === 0 && (
          <motion.div
            key="step-basic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight">Información del Evento</h3>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Nombre</label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Expo Anime 2025"
                  className="w-full bg-white border border-outline-variant rounded-xl h-14 px-5 focus:border-primary outline-none font-bold text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="¿De qué se trata el evento?"
                  className="w-full bg-white border border-outline-variant rounded-xl p-5 focus:border-primary outline-none min-h-[150px] font-medium leading-relaxed resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Categoría</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white border border-outline-variant rounded-xl h-14 px-5 focus:border-primary outline-none font-bold appearance-none cursor-pointer"
                >
                  {categories.length > 0 ? categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>) : <option value="">Cargando...</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white border border-outline-variant rounded-xl h-14 px-5 focus:border-primary outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Hora</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-white border border-outline-variant rounded-xl h-14 px-5 focus:border-primary outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Media */}
        {currentStep === 1 && (
          <motion.div
            key="step-media"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight">Imágenes del Evento</h3>
              <p className="text-sm text-on-surface-variant">Subí una imagen principal para tu evento. Podés subir hasta 5 imágenes.</p>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer",
                  isDragOver ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/40"
                )}
              >
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleMediaSelect(e.target.files); }} />
                <Camera size={32} className="text-on-surface-variant mb-3" />
                <p className="text-sm font-bold text-on-surface-variant">Arrastrá imágenes o hacé click para subir</p>
                <p className="text-[10px] text-on-surface-variant/60 mt-1">PNG, JPG hasta 10MB</p>
              </div>

              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaPreviews.map((preview, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-surface-container-high">
                      <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-primary text-white text-[8px] font-black uppercase tracking-widest">Principal</div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeMedia(i); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {mediaFiles.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl aspect-video text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all"
                    >
                      <Plus size={24} />
                      <span className="text-[10px] font-bold mt-1">Agregar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Location */}
        {currentStep === 2 && (
          <motion.div
            key="step-location"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><MapPin size={20} className="text-primary" /> Ubicación</h3>

              <APIProvider apiKey={GOOGLE_MAPS_KEY}>
                <MapPicker
                  lat={formData.lat}
                  lng={formData.lng}
                  onLocationChange={(lat, lng, address) => {
                    setFormData(prev => ({ ...prev, lat, lng, address: address || prev.address }));
                  }}
                />
              </APIProvider>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Dirección</label>
                <input
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa del lugar"
                  className="w-full bg-white border border-outline-variant rounded-xl h-14 px-5 focus:border-primary outline-none font-bold"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Tickets */}
        {currentStep === 3 && (
          <motion.div
            key="step-tickets"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><TicketIcon size={20} className="text-primary" /> Entradas</h3>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Tipo de entrada</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, ticketType: 'free', price: 0 }))}
                    className={cn(
                      "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                      formData.ticketType === 'free' ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/30"
                    )}
                  >
                    <Gift size={20} className={cn(formData.ticketType === 'free' ? "text-primary" : "text-on-surface-variant")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Gratuita</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, ticketType: 'external' }))}
                    className={cn(
                      "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                      formData.ticketType === 'external' ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/30"
                    )}
                  >
                    <Link size={20} className={cn(formData.ticketType === 'external' ? "text-primary" : "text-on-surface-variant")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Link externo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, ticketType: 'door' }))}
                    className={cn(
                      "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                      formData.ticketType === 'door' ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/30"
                    )}
                  >
                    <DoorOpen size={20} className={cn(formData.ticketType === 'door' ? "text-primary" : "text-on-surface-variant")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">En puerta</span>
                  </button>
                </div>
              </div>

              {formData.ticketType === 'external' && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">URL de compra</label>
                  <input
                    value={formData.ticketUrl}
                    onChange={e => setFormData({ ...formData, ticketUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-white border border-outline-variant rounded-xl h-14 px-5 focus:border-primary outline-none font-bold"
                  />
                </div>
              )}

              {(formData.ticketType === 'external' || formData.ticketType === 'door') && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Precio</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full bg-white border border-outline-variant rounded-xl h-14 pl-12 pr-5 focus:border-primary outline-none font-bold"
                    />
                  </div>
                </div>
              )}

              <details className="group">
                <summary className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant cursor-pointer hover:text-primary transition-colors flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-outline-variant flex items-center justify-center text-[8px] group-open:rotate-90 transition-transform">▶</span>
                  Capacidad (opcional)
                </summary>
                <div className="mt-3 space-y-2 pl-6">
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Ej: 500"
                    className="w-full bg-white border border-outline-variant rounded-xl h-12 px-4 focus:border-primary outline-none font-bold text-sm"
                  />
                  <p className="text-[9px] text-on-surface-variant/60">Dejar vacío si no hay límite de capacidad</p>
                </div>
              </details>
            </div>
          </motion.div>
        )}

        {/* Step 5: Tags */}
        {currentStep === 4 && (
          <motion.div
            key="step-tags"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Tag size={20} className="text-primary" /> Tags</h3>
              <p className="text-sm text-on-surface-variant">Agregá tags para que tu evento sea más fácil de encontrar.</p>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={formData.customTag}
                  onChange={e => setFormData({ ...formData, customTag: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter' && formData.customTag.trim()) { e.preventDefault(); addTag(formData.customTag); } }}
                  placeholder="Agregar tag personalizado..."
                  className="flex-1 bg-white border border-outline-variant rounded-xl h-12 px-4 focus:border-primary outline-none font-bold text-sm"
                />
                <button
                  type="button"
                  onClick={() => formData.customTag.trim() && addTag(formData.customTag)}
                  className="btn-primary px-4 text-[10px] font-black uppercase tracking-widest"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant ml-2">Tags populares</label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TAGS.filter(t => !formData.tags.includes(t)).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-3 py-1.5 rounded-full border border-outline-variant bg-white text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:border-primary hover:text-primary transition-all"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-outline-variant/30">
        <button
          onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
          className={cn(
            "h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all",
            currentStep === 0 ? "opacity-0 pointer-events-none" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
          )}
        >
          Anterior
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={() => canProceed() && setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
            className="btn-primary h-14 px-10 text-sm font-black uppercase tracking-widest disabled:opacity-30"
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !canProceed()}
            className="btn-primary h-14 px-10 text-sm font-black uppercase tracking-widest disabled:opacity-30 flex items-center gap-2"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {submitting ? 'Publicando...' : 'Publicar Evento'}
          </button>
        )}
      </div>
    </div>
  );
};

const TicketIcon = (props: any) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
  </svg>
);

export default CreateEvent;
