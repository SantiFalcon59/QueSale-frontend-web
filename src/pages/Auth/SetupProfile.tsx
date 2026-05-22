import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AtSign, Check, Loader2, User } from 'lucide-react';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { api } from '../../services/apiClient';

const SetupProfile: React.FC = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    if (profile?.username) navigate('/');
    if (user?.displayName && !displayName) setDisplayName(user.displayName);
  }, [user, profile, navigate]);

  const checkUsername = async (val: string) => {
    if (val.length < 3) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    try {
      await api.getPublicProfileByUsername(val.toLowerCase());
      setAvailable(false);
    } catch (err) {
      if (err?.status === 404) {
        setAvailable(true);
      } else {
        console.error(err);
        setAvailable(null);
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) checkUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!available || !user) return;
    setLoading(true);
    setError('');

    const lowerUsername = username.toLowerCase();

    try {
      await updateFirebaseProfile(user, {
        displayName: displayName || user.displayName || 'Miembro VIP',
      });

      await api.updateProfile({
        username: lowerUsername,
        email: user.email || undefined,
      });

      await refreshProfile();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error en la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-6 sm:p-10 bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/5"
      >
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Último Paso</h1>
          <p className="text-on-surface-variant text-xs sm:text-sm">Elige tu identidad en el circuito.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleComplete} className="space-y-8">
          <div className="space-y-2">
            <label className="text-label ml-4">Nombre de Usuario Único</label>
            <div className="relative">
              <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="vibe_master"
                className="w-full h-14 bg-surface-container-low rounded-2xl pl-14 pr-6 text-sm outline-none focus:ring-1 ring-primary/30 transition-all font-bold"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                {checking ? <Loader2 size={18} className="animate-spin text-primary" /> : 
                 available === true ? <Check size={18} className="text-green-500" /> : 
                 available === false ? <span className="text-[10px] text-red-500 font-bold">Ocupado</span> : null}
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant ml-4 uppercase font-bold tracking-widest">Solo alfanuméricos y guiones bajos</p>
          </div>

          <div className="space-y-2">
            <label className="text-label ml-4">Nombre para Mostrar</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input 
                type="text" 
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Rivers"
                className="w-full h-14 bg-surface-container-low rounded-2xl pl-14 pr-6 text-sm outline-none focus:ring-1 ring-primary/30 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !available}
            className="w-full btn-primary h-14 disabled:opacity-50"
          >
            {loading ? 'Configurando...' : 'COMPLETAR PERFIL'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SetupProfile;
