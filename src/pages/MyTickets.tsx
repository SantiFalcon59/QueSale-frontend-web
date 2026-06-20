import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/apiClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import QRCode from 'qrcode';

interface Ticket {
  id_ticket: string;
  uuid: string;
  id_event: string;
  state: number;
  buy_date: string;
  title: string;
  date: string;
  ubication: string;
}

const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    fetchTickets();
  }, []);

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
              onClick={() => handleSelectTicket(ticket)}
              className="bg-white border border-outline-variant rounded-[2rem] overflow-hidden hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-xl"
              whileHover={{ y: -6 }}
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
                <h3 className="text-xl font-black text-on-surface mb-4 group-hover:text-primary transition-colors line-clamp-2 uppercase italic tracking-tighter leading-tight">{ticket.title}</h3>
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
              <div className="bg-surface-container-low p-5 border-t border-outline-variant flex justify-between items-center">
                <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Ver entrada digital</span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
              </div>
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
              className="relative w-full max-w-md bg-white border border-outline-variant rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10">
                <div className="text-center mb-10">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                    Entrada Digital
                  </div>
                  <h2 className="text-3xl font-black text-on-surface mb-3 uppercase italic tracking-tighter leading-none">{selectedTicket.title}</h2>
                  <p className="text-on-surface-variant text-xs font-medium">Muestra este código al ingresar al evento</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] mb-10 flex flex-col items-center border border-outline-variant shadow-sm">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-full max-w-[220px] mb-6 mix-blend-multiply" />
                  ) : (
                    <div className="w-[220px] h-[220px] bg-surface-container animate-pulse rounded-2xl mb-6" />
                  )}
                  <div className="w-full space-y-3 pt-6 border-t border-outline-variant/30">
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-on-surface-variant">
                      <span>ID de Entrada</span>
                    </div>
                    <div className="text-on-surface font-mono text-xs break-all bg-surface-container-low p-3 rounded-xl border border-outline-variant text-center font-bold">
                      {selectedTicket.uuid.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-outline-variant/30 pt-8">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant">Fecha</span>
                    <span className="text-sm text-on-surface font-black">{format(new Date(selectedTicket.date), "d 'de' MMMM, HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant mt-1">Ubicación</span>
                    <span className="text-sm text-on-surface font-black text-right">{selectedTicket.ubication}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-6 bg-surface-container-low hover:bg-surface-container text-on-surface font-black uppercase tracking-[0.2em] text-[10px] border-t border-outline-variant transition-colors"
              >
                Cerrar Entrada
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyTickets;
