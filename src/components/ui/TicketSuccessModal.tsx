import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Calendar, MapPin, ArrowRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface TicketSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    title: string;
    date: any;
    location: { address: string };
  };
}

export const TicketSuccessModal: React.FC<TicketSuccessModalProps> = ({ isOpen, onClose, event }) => {
  const navigate = useNavigate();

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
            {/* Header / Success Indicator */}
            <div className="bg-primary/20 p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-[0_0_40px_rgba(115,46,228,0.5)]"
              >
                <CheckCircle2 size={40} className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase relative z-10">
                ¡Entrada <span className="text-primary-container">Lista!</span>
              </h2>
              <p className="text-white/60 text-sm font-medium mt-2 relative z-10">Tu acceso ha sido procesado correctamente.</p>
              
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors p-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Event Summary Card */}
            <div className="p-8 space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-xl font-bold text-white line-clamp-1">{event.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white/50 text-sm">
                    <Calendar size={16} className="text-primary" />
                    {format(new Date(event.date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                  </div>
                  <div className="flex items-center gap-3 text-white/50 text-sm">
                    <MapPin size={16} className="text-primary" />
                    <span className="truncate">{event.location.address}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid gap-3">
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
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 text-white/60 h-14 rounded-2xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Seguir explorando
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
