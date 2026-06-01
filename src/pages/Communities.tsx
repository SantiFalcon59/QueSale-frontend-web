import React from 'react';
import { motion } from 'motion/react';
import { Users, Search, Plus, Bell, Heart, Calendar, ArrowRight, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

const Communities: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'activity' | 'explore'>('activity');

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12">
      <header className="space-y-4">
        <h1 className="text-5xl font-black italic tracking-tighter">Comunidades</h1>
        <p className="text-on-surface-variant text-lg font-medium max-w-xl">
          Conectá con otros fans, compartí experiencias y descubrí grupos de tu interés.
        </p>
      </header>

      <div className="flex gap-8 border-b border-outline-variant">
        {[
          { id: 'activity', label: 'Actividad', icon: Bell },
          { id: 'explore', label: 'Explorar', icon: Search },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-on-surface-variant hover:text-on-surface opacity-60 hover:opacity-100"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'activity' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 space-y-6"
        >
          <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto">
            <Bell size={32} className="text-on-surface-variant opacity-40" />
          </div>
          <h3 className="text-2xl font-black">Sin actividad reciente</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            Explorá comunidades para empezar a ver actividad de grupos que te interesen.
          </p>
          <button
            onClick={() => setActiveTab('explore')}
            className="btn-primary inline-flex items-center gap-2"
          >
            Explorar comunidades <ArrowRight size={16} />
          </button>
        </motion.div>
      )}

      {activeTab === 'explore' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 space-y-6"
        >
          <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto">
            <Users size={32} className="text-on-surface-variant opacity-40" />
          </div>
          <h3 className="text-2xl font-black">Próximamente</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            Estamos construyendo la funcionalidad de comunidades. Pronto podrás crear y unirte a grupos de tu interés.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Communities;
