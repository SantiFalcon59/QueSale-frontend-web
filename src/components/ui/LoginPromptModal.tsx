import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Inicia Sesión", 
  message = "Para interactuar con el contenido y unirte a la comunidad, necesitas tener una cuenta." 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl border border-black/5"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-surface-container-low rounded-full transition-colors"
            >
              <X size={20} className="text-on-surface-variant" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                <LogIn size={32} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight">{title}</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Link 
                  to="/login" 
                  className="w-full btn-primary h-14 flex items-center justify-center gap-2"
                >
                  <LogIn size={18} /> INICIAR SESIÓN
                </Link>
                <Link 
                  to="/register" 
                  className="w-full btn-secondary h-14 flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} /> REGISTRARSE
                </Link>
              </div>

              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest pt-4">
                Únete a QueSale Geek hoy
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
