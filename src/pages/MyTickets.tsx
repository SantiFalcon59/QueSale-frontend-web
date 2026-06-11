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
      setTickets(response.tickets || []);
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
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Mis Entradas</h1>
        <p className="text-white/50">Aquí puedes ver y gestionar las entradas de tus próximos eventos.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
          <span className="material-symbols-outlined text-6xl text-white/20 mb-4">confirmation_number</span>
          <h3 className="text-xl font-bold text-white mb-2">No tienes entradas aún</h3>
          <p className="text-white/50 mb-8">¡Explora eventos y adquiere tu primera entrada!</p>
          <button 
            onClick={() => window.location.href = '/discovery'}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all"
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
              className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer group"
              whileHover={{ y: -4 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ticket.state === 1 ? 'bg-green-500/20 text-green-400' : 
                    ticket.state === 2 ? 'bg-white/10 text-white/50' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {ticket.state === 1 ? 'Activa' : ticket.state === 2 ? 'Usada' : 'Cancelada'}
                  </div>
                  <span className="text-white/20 font-mono text-xs">#{ticket.uuid.slice(0, 8)}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors line-clamp-1">{ticket.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                    {format(new Date(ticket.date), "EEEE d 'de' MMMM", { locale: es })}
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <span className="material-symbols-outlined text-lg">location_on</span>
                    <span className="truncate">{ticket.ubication}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 p-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Ver entrada</span>
                <span className="material-symbols-outlined text-white/30 group-hover:text-secondary group-hover:translate-x-1 transition-all">arrow_forward</span>
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              layoutId={selectedTicket.id_ticket}
              className="relative w-full max-w-md bg-[#1a1a2e] border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-secondary text-xs font-bold uppercase tracking-widest mb-4">
                    Entrada Digital
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">{selectedTicket.title}</h2>
                  <p className="text-white/50 text-sm">Muestra este código al ingresar al evento</p>
                </div>

                <div className="bg-white p-6 rounded-2xl mb-8 flex flex-col items-center shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-full max-w-[200px] mb-4" />
                  ) : (
                    <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse rounded-lg mb-4" />
                  )}
                  <div className="w-full space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-gray-400">
                      <span>ID de Entrada</span>
                    </div>
                    <div className="text-black font-mono text-sm break-all bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                      {selectedTicket.uuid}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Fecha</span>
                    <span className="text-white font-bold">{format(new Date(selectedTicket.date), "d 'de' MMMM, HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Ubicación</span>
                    <span className="text-white font-bold text-right">{selectedTicket.ubication}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold border-t border-white/10 transition-colors"
              >
                Cerrar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyTickets;
