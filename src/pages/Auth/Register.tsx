import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }
    setError('');
    setLoading(true);
    try {
      await registerWithEmail(email, password);
      navigate('/setup-profile');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/setup-profile');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Crear Cuenta</h1>
          <p className="text-on-surface-variant text-xs sm:text-sm">Únete a la comunidad de fans más activa.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-label ml-4">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full h-14 bg-surface-container-low rounded-2xl pl-14 pr-6 text-sm outline-none focus:ring-1 ring-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-label ml-4">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 bg-surface-container-low rounded-2xl pl-14 pr-6 text-sm outline-none focus:ring-1 ring-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-label ml-4">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 bg-surface-container-low rounded-2xl pl-14 pr-6 text-sm outline-none focus:ring-1 ring-primary/30 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary h-14"
          >
            {loading ? 'Creando...' : <><UserPlus size={18} className="mr-2" /> UNIRSE AHORA</>}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-outline-variant" />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">O REGÍSTRATE CON</span>
          <div className="flex-1 h-[1px] bg-outline-variant" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full h-14 bg-white border border-outline-variant rounded-2xl flex items-center justify-center gap-3 font-bold text-sm hover:bg-surface-container-low transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.63l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          GOOGLE
        </button>

        <p className="mt-8 text-center text-xs text-on-surface-variant">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Inicia Sesión
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
