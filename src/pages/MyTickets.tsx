import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket as TicketIcon, Calendar, MapPin, Download, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/apiClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const result: any = await api.apiRequest('/api/tickets/my-tickets', { auth: true });
        const data = result.data || [];
        setTickets(data);
        if (data.length > 0) setSelectedTicket(data[0]);
      } catch (err) {
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading) {
    return <div className="p-20 text-center font-black uppercase tracking-[0.4em] opacity-40 animate-pulse">Recuperando tus accesos...</div>;
  }

  if (tickets.length === 0) {
    return (
      <div className="py-20 text-center space-y-6">
         <TicketIcon size={80} className="mx-auto text-on-surface-variant opacity-10" />
         <div className="space-y-2">
           <h2 className="text-2xl font-black italic tracking-tight opacity-40 uppercase">No tienes entradas aún</h2>
           <p className="text-on-surface-variant font-medium max-w-xs mx-auto">Cuando compres una entrada para un evento, aparecerá aquí.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 lg:space-y-12 pb-20">
      <header className="px-4 lg:px-0">
        <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-bold mb-2">Acceso Autenticado</p>
        <h1 className="text-3xl lg:text-5xl font-bold italic font-sans italic tracking-tight">Mis Entradas</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 lg:px-0">
        {/* Tickets List */}
        <div className="lg:col-span-5 space-y-4">
           {tickets.map(ticket => (
             <div 
               key={ticket.id_ticket}
               onClick={() => setSelectedTicket(ticket)}
               className={cn(
                 "p-6 rounded-[2rem] cursor-pointer transition-all border group",
                 selectedTicket?.id_ticket === ticket.id_ticket 
                  ? "bg-surface-container-high border-primary/50 shadow-lg" 
                  : "bg-surface-container-low border-transparent hover:border-outline-variant"
               )}
             >
                <div className="flex justify-between items-start mb-4">
                   <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary">
                      <TicketIcon size={20} />
                   </div>
                   <span className={cn(
                     "text-[9px] font-bold uppercase tracking-widest px-2 py-1 glass rounded",
                     ticket.state === 1 ? "text-primary" : ticket.state === 2 ? "text-emerald-500" : "text-on-surface-variant"
                   )}>
                     {ticket.state === 1 ? 'Activo' : ticket.state === 2 ? 'Validado' : 'Cancelado'}
                   </span>
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{ticket.event?.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {ticket.event?.date ? format(new Date(ticket.event.date), "d MMM, yyyy • HH:mm", { locale: es }) : 'Próximamente'}
                </p>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/30">
                   <span className="text-[10px] font-mono text-on-surface-variant">{ticket.uuid}</span>
                   <ChevronRight size={16} className="text-on-surface-variant" />
                </div>
             </div>
           ))}
        </div>

        {/* Ticket Viewer */}
        <div className="lg:col-span-7">
           <AnimatePresence mode="wait">
             {selectedTicket && (
               <motion.div
                 key={selectedTicket.id_ticket}
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.02 }}
                 className="bg-surface-container-high rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden border border-outline-variant shadow-2xl relative"
               >
                  {/* Visual Accent */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-primary to-primary-container" />
                  
                  <div className="p-8 lg:p-12 space-y-8 lg:space-y-10">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                           <h2 className="text-2xl lg:text-3xl font-bold italic tracking-tight">{selectedTicket.event?.title}</h2>
                           <p className="text-on-surface-variant text-xs lg:text-sm flex items-center gap-2 font-medium tracking-tight uppercase">
                              <MapPin size={14} className="text-primary" /> {selectedTicket.event?.ubication}
                           </p>
                        </div>
                        <div className="sm:text-right">
                           <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-black">Ticket Tier</p>
                           <p className="text-sm font-black text-primary uppercase tracking-tight">Standard Entry</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10 p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] bg-surface/50 border border-outline-variant">
                        <div className="space-y-6 lg:space-y-8">
                           <div className="space-y-1">
                              <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Fecha y Hora</p>
                              <p className="text-sm font-bold">
                                {selectedTicket.event?.date ? format(new Date(selectedTicket.event.date), "EEEE d 'de' MMMM, HH:mm", { locale: es }) : '-'}
                              </p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">ID de Entrada</p>
                              <p className="text-sm font-mono font-bold tracking-tight">{selectedTicket.uuid}</p>
                           </div>
                           <div className="space-y-1 pt-2 lg:pt-4">
                              <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Estado</p>
                              <div className="flex items-center gap-2 text-on-surface font-bold text-xs uppercase tracking-tight">
                                 <ShieldCheck size={16} className="text-primary" /> 
                                 {selectedTicket.state === 1 ? 'Válida para Ingreso' : selectedTicket.state === 2 ? 'Ya Utilizada' : 'Cancelada'}
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-4">
                           <div className="w-40 h-40 lg:w-48 lg:h-48 bg-white p-4 rounded-3xl shadow-xl flex items-center justify-center">
                              {selectedTicket.state === 1 ? (
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedTicket.uuid}`} 
                                  alt="QR Code" 
                                  className="w-full h-full" 
                                />
                              ) : (
                                <div className="text-center p-4">
                                   <TicketIcon size={40} className="mx-auto text-on-surface-variant opacity-20 mb-2" />
                                   <p className="text-[8px] font-black uppercase text-on-surface-variant">QR No Disponible</p>
                                </div>
                              )}
                           </div>
                           <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Escanear al ingresar</p>
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-4">
                        <button className="flex-1 btn-primary py-4 px-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                           <Download size={16} /> GUARDAR EN WALLET
                        </button>
                        {selectedTicket.state === 1 && (
                          <button className="btn-secondary py-4 px-6 text-[10px] font-black uppercase tracking-widest">TRANSFERIR</button>
                        )}
                     </div>
                  </div>
                  
                  {/* Perforation Effect */}
                  <div className="hidden lg:block absolute top-1/2 left-0 -translate-x-1/2 w-8 h-8 rounded-full bg-surface border-r border-outline-variant" />
                  <div className="hidden lg:block absolute top-1/2 right-0 translate-x-1/2 w-8 h-8 rounded-full bg-surface border-l border-outline-variant" />
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
