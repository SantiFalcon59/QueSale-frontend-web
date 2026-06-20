import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Bell, UserPlus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../components/ui/UserAvatar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function resolveImgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}

async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`);
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.error?.message || res.statusText);
  return payload?.data ?? payload;
}

const Communities: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'following'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<{ users: any[]; organizers: any[] }>({ users: [], organizers: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults({ users: [], organizers: [] });
      return;
    }
    setLoading(true);
    apiGet(`/api/community/search?q=${encodeURIComponent(debouncedQuery)}&type=all`)
      .then(data => setResults(data))
      .catch(() => setResults({ users: [], organizers: [] }))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 space-y-12">
      <header className="space-y-4">
        <h1 className="text-5xl font-black italic tracking-tighter">Comunidad</h1>
        <p className="text-on-surface-variant text-lg font-medium max-w-xl">
          Conectá con otros usuarios, descubrí organizaciones y seguí la actividad de la comunidad.
        </p>
      </header>

      <div className="flex gap-8 border-b border-outline-variant">
        {[
          { id: 'feed', label: 'Feed', icon: Bell },
          { id: 'explore', label: 'Explorar', icon: Search },
          { id: 'following', label: 'Siguiendo', icon: UserPlus },
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

      {activeTab === 'feed' && <FeedContent />}
      {activeTab === 'explore' && (
        <ExploreContent
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          results={results}
          loading={loading}
        />
      )}
      {activeTab === 'following' && <FollowingContent />}
    </div>
  );
};

function FeedContent() {
  const [recommendations, setRecommendations] = useState<{ users: any[]; organizers: any[] }>({ users: [], organizers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/community/recommendations')
      .then(data => setRecommendations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  const { users, organizers } = recommendations;

  if (users.length === 0 && organizers.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 space-y-6"
      >
        <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto">
          <Users size={32} className="text-on-surface-variant opacity-40" />
        </div>
        <h3 className="text-2xl font-black">Sin actividad reciente</h3>
        <p className="text-on-surface-variant max-w-md mx-auto">
          Explorá la comunidad para descubrir usuarios y organizaciones.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {users.length > 0 && (
        <section>
          <h3 className="text-lg font-black mb-4">Usuarios recomendados</h3>
          <div className="grid gap-3">
            {users.map((u: any) => <UserCard key={u.id_user} user={u} />)}
          </div>
        </section>
      )}
      {organizers.length > 0 && (
        <section>
          <h3 className="text-lg font-black mb-4">Organizaciones recomendadas</h3>
          <div className="grid gap-3">
            {organizers.map((o: any) => <OrganizerCard key={o.id_organizer} organizer={o} />)}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function ExploreContent({ searchQuery, onSearchChange, results, loading }: {
  searchQuery: string; onSearchChange: (v: string) => void; results: any; loading: boolean;
}) {
  const { users, organizers } = results;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="relative max-w-md mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          placeholder="Buscar usuarios y organizaciones..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full bg-surface-container-low border border-outline-variant rounded-full py-3 pl-12 pr-10 text-sm focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline outline-none"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X size={16} className="text-on-surface-variant" />
          </button>
        )}
      </div>

      {searchQuery.length < 2 ? (
        <div className="text-center py-20 space-y-4">
          <Search size={48} className="mx-auto text-on-surface-variant opacity-40" />
          <p className="text-on-surface-variant">Buscá usuarios y organizaciones por nombre</p>
        </div>
      ) : loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      ) : users.length === 0 && organizers.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Search size={48} className="mx-auto text-on-surface-variant opacity-40" />
          <h3 className="text-xl font-black">Sin resultados</h3>
          <p className="text-on-surface-variant">No encontramos nada para "{searchQuery}"</p>
        </div>
      ) : (
        <div className="space-y-8">
          {users.length > 0 && (
            <section>
              <h3 className="text-lg font-black mb-4">Usuarios</h3>
              <div className="grid gap-3">
                {users.map((u: any) => <UserCard key={u.id_user} user={u} />)}
              </div>
            </section>
          )}
          {organizers.length > 0 && (
            <section>
              <h3 className="text-lg font-black mb-4">Organizaciones</h3>
              <div className="grid gap-3">
                {organizers.map((o: any) => <OrganizerCard key={o.id_organizer} organizer={o} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </motion.div>
  );
}

function FollowingContent() {
  const { profile } = useAuth();
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!profile?.id_user) { setLoading(false); return; }
    api.get(`/api/community/users/${encodeURIComponent(profile.id_user)}/following`)
      .then((data: any) => setFollowing(Array.isArray(data) ? data : []))
      .catch(() => setFollowing([]))
      .finally(() => setLoading(false));
  }, [profile?.id_user]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 space-y-6"
      >
        <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto">
          <UserPlus size={32} className="text-on-surface-variant opacity-40" />
        </div>
        <h3 className="text-2xl font-black">No seguís a nadie</h3>
        <p className="text-on-surface-variant max-w-md mx-auto">
          Seguí usuarios y organizaciones para ver su actividad aquí.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3">
      {following.map((f: any) => <UserCard key={f.id_user} user={f} />)}
    </motion.div>
  );
}

function UserCard({ user }: { user: any }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4 bg-surface-container-low rounded-2xl p-4 border border-outline-variant/50 hover:border-primary/30 transition-all cursor-pointer"
      onClick={() => navigate(`/@${user.username}`)}
    >
      <UserAvatar
        src={resolveImgUrl(user.photo_url)}
        alt={user.username}
        className="w-12 h-12 rounded-full"
        size={22}
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-on-surface truncate">{user.username}</p>
        <div className="flex flex-col gap-0.5 mt-0.5">
          <p className="text-xs text-primary font-semibold">{user.followers_count || 0} seguidores</p>
          {user.description && (
            <p className="text-xs text-on-surface-variant line-clamp-1 break-words">
              {user.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function OrganizerCard({ organizer }: { organizer: any }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4 bg-surface-container-low rounded-2xl p-4 border border-outline-variant/50 hover:border-primary/30 transition-all cursor-pointer"
      onClick={() => navigate(`/organizer/${organizer.id_organizer}`)}
    >
      <img
        src={resolveImgUrl(organizer.logo_url) || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=96'}
        alt={organizer.name}
        className="w-12 h-12 rounded-full object-cover bg-surface-container-high"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-bold text-sm text-on-surface truncate">{organizer.name}</p>
          {organizer.verified && (
            <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
          )}
        </div>
        <p className="text-xs text-on-surface-variant line-clamp-2 break-words">
          {organizer.description || `${organizer.events_count || 0} eventos`}
        </p>
      </div>
    </div>
  );
}

export default Communities;
