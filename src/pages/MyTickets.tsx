import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { resolveAssetUrl, api } from '../services/apiClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface Ticket {
  id_ticket: string;
  uuid: string;
  id_event: string;
  state: number;
  buy_date: string;
  title: string;
  date: string;
  ubication: string;
  thumbnail_url?: string;
}

const MyTickets: React.FC = () => {
  const { getSocketToken } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [validationSuccessData, setValidationSuccessData] = useState<{
    isOpen: boolean;
    eventTitle: string;
  }>({ isOpen: false, eventTitle: '' });

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const token = getSocketToken();
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('ticket-validated', (data: any) => {
      // 1. Show validation success overlay
      setValidationSuccessData({
        isOpen: true,
        eventTitle: data.eventTitle,
      });

      // 2. Close QR modal if open
      setSelectedTicket(null);

      // 3. Refresh tickets list to update status to "Usada"
      fetchTickets();
    });

    return () => {
      socket.disconnect();
    };
  }, [getSocketToken]);

  const fetchTickets = async () => {
    try {
      const response = await api.getUserTickets();
      setTickets(Array.isArray(response) ? response : (response as any).tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    try {
      const url = await QRCode.toDataURL(ticket.uuid, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-on-surface mb-2 tracking-tight">Mis Entradas</h1>
        <p className="text-on-surface-variant font-medium">Aquí puedes ver y gestionar las entradas de tus próximos eventos.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-outline-variant">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">confirmation_number</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">No tienes entradas aún</h3>
          <p className="text-on-surface-variant mb-8">¡Explora eventos y adquiere tu primera entrada!</p>
          <button 
            onClick={() => window.location.href = '/events'}
            className="btn-primary"
          >
            Explorar Eventos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <motion.div
              key={ticket.id_ticket}
              layoutId={ticket.id_ticket}
              onClick={() => ticket.state === 1 && handleSelectTicket(ticket)}
              className={cn(
                "bg-white border border-outline-variant rounded-[2rem] overflow-hidden transition-all group shadow-sm",
                ticket.state === 1 ? "hover:border-primary/50 cursor-pointer hover:shadow-xl" : "opacity-75"
              )}
              whileHover={ticket.state === 1 ? { y: -6 } : undefined}
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    ticket.state === 1 ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                    ticket.state === 2 ? 'bg-surface-container text-on-surface-variant border-outline-variant' : 'bg-red-500/10 text-red-600 border-red-500/20'
                  }`}>
                    {ticket.state === 1 ? 'Activa' : ticket.state === 2 ? 'Usada' : 'Cancelada'}
                  </div>
                  <span className="text-on-surface-variant/30 font-mono text-[10px] font-bold">#{ticket.uuid.slice(0, 8).toUpperCase()}</span>
                </div>
                
                <div className="flex gap-4 items-start mb-4">
                  {ticket.thumbnail_url && (
                    <img
                      src={resolveAssetUrl(ticket.thumbnail_url) || ticket.thumbnail_url}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover border border-outline-variant shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-on-surface group-hover:text-primary transition-colors line-clamp-2 uppercase italic tracking-tighter leading-tight">{ticket.title}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-on-surface-variant text-xs font-bold">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                       <span className="material-symbols-outlined text-lg">calendar_today</span>
                    </div>
                    {format(new Date(ticket.date), "EEEE d 'de' MMMM", { locale: es })}
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant text-xs font-bold">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                       <span className="material-symbols-outlined text-lg">location_on</span>
                    </div>
                    <span className="truncate">{ticket.ubication}</span>
                  </div>
                </div>
              </div>
              {ticket.state === 1 ? (
                <div className="bg-surface-container-low p-5 border-t border-outline-variant flex justify-between items-center">
                  <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Ver entrada digital</span>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                </div>
              ) : (
                <div className="bg-surface-container-low/50 p-5 border-t border-outline-variant/30 flex justify-between items-center">
                  <span className="text-[10px] text-on-surface-variant/60 font-black uppercase tracking-widest">
                    {ticket.state === 2 ? 'Entrada Utilizada' : 'Entrada Cancelada'}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-md"
            />
            <motion.div
              layoutId={selectedTicket.id_ticket}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-outline-variant rounded-[2rem] sm:rounded-[3rem] shadow-2xl scrollbar-none"
            >
              <div className="p-6 sm:p-10">
                <div className="text-center mb-6 sm:mb-10">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-6">
                    Entrada Digital
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-on-surface mb-2 sm:mb-3 uppercase italic tracking-tighter leading-none">{selectedTicket.title}</h2>
                  <p className="text-on-surface-variant text-[11px] sm:text-xs font-medium">Muestra este código al ingresar al evento</p>
                </div>

                <div className="bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] mb-6 sm:mb-10 flex flex-col items-center border border-outline-variant shadow-sm">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-full max-w-[160px] sm:max-w-[220px] mb-4 sm:mb-6 mix-blend-multiply" />
                  ) : (
                    <div className="w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] bg-surface-container animate-pulse rounded-2xl mb-4 sm:mb-6" />
                  )}
                  <div className="w-full space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t border-outline-variant/30">
                    <div className="flex justify-between text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-on-surface-variant">
                      <span>ID de Entrada</span>
                    </div>
                    <div className="text-on-surface font-mono text-[10px] sm:text-xs break-all bg-surface-container-low p-2 sm:p-3 rounded-xl border border-outline-variant text-center font-bold">
                      {selectedTicket.uuid.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4 border-t border-outline-variant/30 pt-6 sm:pt-8">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-on-surface-variant">Fecha</span>
                    <span className="text-on-surface font-black">{format(new Date(selectedTicket.date), "d 'de' MMMM, HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4 text-xs sm:text-sm">
                    <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-on-surface-variant mt-1">Ubicación</span>
                    <span className="text-on-surface font-black text-right">{selectedTicket.ubication}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-4 sm:py-6 bg-surface-container-low hover:bg-surface-container text-on-surface font-black uppercase tracking-[0.2em] text-[10px] border-t border-outline-variant transition-colors sticky bottom-0"
              >
                Cerrar Entrada
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {validationSuccessData.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setValidationSuccessData(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white border border-outline-variant rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-500/5">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-on-surface uppercase italic tracking-tighter">¡Entrada Validada!</h3>
                <p className="text-on-surface-variant text-sm font-medium">
                  Tu entrada para <strong className="text-on-surface">{validationSuccessData.eventTitle}</strong> ha sido verificada correctamente en el ingreso.
                </p>
              </div>
              <button
                onClick={() => setValidationSuccessData(prev => ({ ...prev, isOpen: false }))}
                className="btn-primary w-full py-4 uppercase font-black text-[10px] tracking-widest rounded-xl"
              >
                Disfrutar del Evento
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyTickets;
