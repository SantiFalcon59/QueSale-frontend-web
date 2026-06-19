import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Star, Zap, Image as ImageIcon, MessageSquare, ShieldCheck, Crown, Loader2 } from 'lucide-react';
import { api } from '../../services/apiClient';
import { cn } from '../../lib/utils';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res: any = await api.post('/api/subscriptions/premium', {});
      if (res.init_point) {
        window.location.href = res.init_point;
      }
    } catch (err) {
      alert('Error al iniciar la suscripción. Intentalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { name: 'Navegación sin publicidad', free: false, premium: true },
    { name: 'Insignia de Suscriptor', free: false, premium: true },
    { name: 'Color dorado exclusivo', free: false, premium: true },
    { name: 'Fotos de perfil con GIFs', free: false, premium: true },
    { name: 'Posts de hasta 5000 chars', free: '500', premium: '5000' },
    { name: 'Soporte prioritario', free: false, premium: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Header / Banner */}
            <div className="relative shrink-0 h-40 lg:h-48 bg-linear-to-br from-amber-400 via-amber-500 to-amber-600 flex flex-col items-center justify-center text-center p-6">
               <div className="absolute inset-0 overflow-hidden opacity-20">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
               </div>
               
               <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
                  <Crown size={36} className="text-white fill-white" />
               </div>
               
               <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase drop-shadow-lg">QueSale Premium</h2>
               <p className="text-amber-100 font-bold uppercase tracking-widest text-[10px] mt-1 drop-shadow-md">La experiencia definitiva para geeks</p>
               
               <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
                  <X size={24} />
               </button>
            </div>

            <div className="p-6 lg:p-8 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-12 gap-2 lg:gap-4">
                  <div className="col-span-6" />
                  <div className="col-span-3 text-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Gratis</p>
                  </div>
                  <div className="col-span-3 text-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Premium</p>
                  </div>
               </div>

               <div className="space-y-4">
                  {features.map((f, i) => (
                    <div key={i} className="grid grid-cols-12 items-center gap-4 py-2 border-b border-outline-variant/30 last:border-0">
                       <div className="col-span-6 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                             {i === 0 && <ShieldCheck size={16} />}
                             {i === 1 && <Star size={16} />}
                             {i === 2 && <Zap size={16} />}
                             {i === 3 && <ImageIcon size={16} />}
                             {i === 4 && <MessageSquare size={16} />}
                             {i === 5 && <Check size={16} />}
                          </div>
                          <span className="text-sm font-bold text-on-surface">{f.name}</span>
                       </div>
                       <div className="col-span-3 flex justify-center">
                          {typeof f.free === 'string' ? <span className="text-[10px] font-black text-on-surface-variant">{f.free}</span> : (f.free ? <Check size={18} className="text-green-500" /> : <X size={18} className="text-on-surface-variant/30" />)}
                       </div>
                       <div className="col-span-3 flex justify-center">
                          {typeof f.premium === 'string' ? <span className="text-[10px] font-black text-amber-600">{f.premium}</span> : (f.premium ? <Check size={18} className="text-amber-500" /> : <X size={18} className="text-on-surface-variant/30" />)}
                       </div>
                    </div>
                  ))}
               </div>

               <div className="pt-4 flex flex-col items-center gap-4">
                  <div className="text-center">
                     <p className="text-4xl font-black italic tracking-tighter text-on-surface">$4.999 <span className="text-sm font-bold tracking-normal opacity-40">/ mes</span></p>
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant mt-1">Cancela cuando quieras</p>
                  </div>
                  
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="fill-white" />}
                    SUSCRIBIRME AHORA
                  </button>
                  
                  <p className="text-[10px] text-on-surface-variant font-medium text-center max-w-sm">
                    Al suscribirte, apoyas directamente el desarrollo de QueSale y desbloqueas todas las funciones exclusivas.
                  </p>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
