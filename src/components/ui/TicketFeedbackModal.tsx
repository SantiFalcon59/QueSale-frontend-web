import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Calendar, MapPin, ArrowRight, X, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export type TicketModalMode = 'success' | 'error' | 'info';

interface TicketFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: TicketModalMode;
  title?: string;
  message?: string;
  event?: {
    title: string;
    date: any;
    location: { address: string };
  };
}

export const TicketFeedbackModal: React.FC<TicketFeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  event, 
  mode = 'success',
  title,
  message
}) => {
  const navigate = useNavigate();

  const isSuccess = mode === 'success';
  const isError = mode === 'error';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#1a1a2e] border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Header / State Indicator */}
            <div className={cn(
              "p-10 text-center relative overflow-hidden",
              isSuccess ? "bg-green-500/20" : isError ? "bg-red-500/20" : "bg-primary/20"
            )}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-2xl",
                  isSuccess ? "bg-green-500" : isError ? "bg-red-500" : "bg-primary"
                )}
              >
                {isSuccess ? <CheckCircle2 size={40} className="text-white" /> : 
                 isError ? <AlertCircle size={40} className="text-white" /> : 
                 <Info size={40} className="text-white" />}
              </motion.div>
              
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase relative z-10">
                {title || (isSuccess ? "¡Entrada Lista!" : isError ? "Ups, algo salió mal" : "Aviso")}
              </h2>
              <p className="text-white/60 text-sm font-medium mt-2 relative z-10">
                {message || (isSuccess ? "Tu acceso ha sido procesado correctamente." : "No pudimos completar la solicitud.")}
              </p>
              
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors p-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Event Summary Card (Optional) */}
            <div className="p-8 space-y-8">
              {event && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xl font-bold text-white line-clamp-1">{event.title}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/50 text-sm">
                      <Calendar size={16} className={isSuccess ? "text-green-400" : "text-primary"} />
                      {format(new Date(event.date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                    </div>
                    <div className="flex items-center gap-3 text-white/50 text-sm">
                      <MapPin size={16} className={isSuccess ? "text-green-400" : "text-primary"} />
                      <span className="truncate">{event.location.address}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid gap-3">
                {isSuccess || (isError && message?.includes('ya tienes')) ? (
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/my-tickets');
                    }}
                    className="w-full bg-white text-black h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/90 transition-all active:scale-[0.98]"
                  >
                    Ver en Mis Entradas
                    <ArrowRight size={18} />
                  </button>
                ) : null}
                
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 text-white/60 h-14 rounded-2xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  {isSuccess ? "Seguir explorando" : "Entendido"}
                </button>
              </div>
            </div>

            {/* Ticket Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-between px-10">
               {[...Array(12)].map((_, i) => (
                 <div key={i} className="w-4 h-4 bg-[#1a1a2e] rounded-full -mb-2 border border-white/10" />
               ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
