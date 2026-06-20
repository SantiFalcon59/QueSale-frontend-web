import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Calendar, RefreshCw, XCircle, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toastSuccess, toastError, confirmAction } from '../../lib/swal';

interface SubscriptionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionManagerModal: React.FC<SubscriptionManagerModalProps> = ({ isOpen, onClose }) => {
  const { profile, refreshProfile } = useAuth() as any;
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const premiumUntil = profile?.premium_until ? new Date(profile.premium_until) : null;
  const now = new Date();
  const isExpired = premiumUntil ? premiumUntil <= now : true;
  const daysLeft = premiumUntil && !isExpired ? differenceInDays(premiumUntil, now) : 0;

  const handleRenew = async () => {
    setLoading(true);
    try {
      const res: any = await api.post('/api/subscriptions/premium', {}, { auth: true });
      if (res.init_point) {
        window.location.href = res.init_point;
      }
    } catch (err) {
      toastError('Error al iniciar la renovacion. Intentalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirmAction(
      'Cancelar suscripcion Premium?',
      'Tu acceso continuara hasta la fecha de vencimiento. No se realizaran mas cobros.'
    );
    if (!confirmed) return;

    setCancelLoading(true);
    try {
      await api.post('/api/subscriptions/cancel', {}, { auth: true });
      await refreshProfile();
      toastSuccess('Suscripcion cancelada. Tu acceso Premium continua hasta la fecha de vencimiento.');
      onClose();
    } catch (err: any) {
      toastError('No se pudo cancelar automaticamente. Contacta a soporte en info@quesale.com');
      console.error(err);
    } finally {
      setCancelLoading(false);
    }
  };

  const headerGradient = isExpired
    ? 'from-red-500 to-red-700'
    : daysLeft <= 5
    ? 'from-orange-400 to-orange-600'
    : 'from-emerald-400 to-emerald-600';

  const modalContent = (
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
            className="relative w-full max-w-md flex flex-col bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
          >
            <div className={`relative shrink-0 h-36 bg-gradient-to-br ${headerGradient} flex flex-col items-center justify-center text-center p-6`}>
              <div className="absolute inset-0 overflow-hidden opacity-20">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-3 shadow-xl border border-white/30">
                <Crown size={28} className="text-white fill-white" />
              </div>
              <h2 className="text-xl font-black italic tracking-tighter text-white uppercase drop-shadow-lg">
                Gestionar Suscripcion
              </h2>
              <button onClick={onClose} className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className={isExpired ? 'text-red-400' : 'text-emerald-400'} />
                  <span className={`text-sm font-black uppercase tracking-widest ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isExpired ? 'Suscripcion Vencida' : 'Premium Activo'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant text-sm">
                  <Calendar size={16} />
                  {premiumUntil ? (
                    <span>
                      {isExpired ? 'Vencio el ' : 'Vence el '}
                      <strong className="text-on-surface">
                        {format(premiumUntil, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                      </strong>
                    </span>
                  ) : (
                    <span>Sin fecha de vencimiento registrada</span>
                  )}
                </div>
                {!isExpired && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${daysLeft <= 5 ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    <span>{daysLeft === 0 ? 'Vence hoy' : `Quedan ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Tus beneficios</p>
                {[
                  'Sin publicidad en ninguna seccion',
                  'Insignia dorada de premium',
                  'Foto de perfil con GIFs animados',
                  'Posts de hasta 5.000 caracteres',
                  'Soporte prioritario',
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Crown size={12} className="text-amber-400 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <button
                  onClick={handleRenew}
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={16} />}
                  {isExpired ? 'Reactivar Premium' : 'Renovar Ahora (+30 dias)'}
                </button>
                {!isExpired && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="w-full h-12 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                  >
                    {cancelLoading ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                    Cancelar Suscripcion
                  </button>
                )}
              </div>

              <p className="text-[9px] text-on-surface-variant/60 font-medium text-center">
                Al renovar se agregan 30 dias desde hoy. Al cancelar se detienen futuros cobros
                pero tu acceso Premium continua hasta el vencimiento.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default SubscriptionManagerModal;
