import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';
import { Mail, Lock, UserPlus, AtSign, Loader2, Check, Upload, X, Camera } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { translateAuthError } from '../../lib/authErrors';

const Register: React.FC = () => {
  const [step, setStep] = useState<'form' | 'photo'>('form');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { loginWithGoogle, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkUsername = async (val: string) => {
    if (val.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setChecking(true);
    try {
      await api.getPublicProfileByUsername(val.toLowerCase());
      setUsernameAvailable(false);
    } catch (err: any) {
      if (err?.status === 404) {
        setUsernameAvailable(true);
      } else {
        setUsernameAvailable(null);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }
    if (!usernameAvailable) {
      return setError('Elige un nombre de usuario disponible');
    }
    setError('');
    setLoading(true);
    try {
      await api.registerWithEmail(email, password, username.toLowerCase());
      await signInWithEmailAndPassword(auth, email, password);
      await refreshProfile();
      setStep('photo');
    } catch (err: any) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(translateAuthError(err));
    }
  };

  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePhotoSelect(file);
  }, []);

  const handleSkipPhoto = () => {
    navigate('/');
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return handleSkipPhoto();
    setUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const photoURL = await api.uploadProfilePhoto(photoFile);
      await api.updateProfile({ photo_url: photoURL });
      await refreshProfile();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
      <AnimatePresence mode="wait">
        {step === 'form' ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
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
                <label className="text-label ml-4">Nombre de Usuario</label>
                <div className="relative">
                  <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="tu_usuario"
                    className="w-full h-14 bg-surface-container-low rounded-2xl pl-14 pr-6 text-sm outline-none focus:ring-1 ring-primary/30 transition-all font-bold"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    {checking ? <Loader2 size={18} className="animate-spin text-primary" /> :
                     usernameAvailable === true ? <Check size={18} className="text-green-500" /> :
                     usernameAvailable === false ? <span className="text-[10px] text-red-500 font-bold">Ocupado</span> : null}
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant ml-4 uppercase font-bold tracking-widest">Solo alfanuméricos y guiones bajos</p>
              </div>

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
                disabled={loading || !usernameAvailable}
                className="w-full btn-primary h-14 disabled:opacity-50"
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
        ) : (
          <motion.div
            key="photo"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md p-6 sm:p-10 bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-black/5 border border-black/5"
          >
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera size={28} className="text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Tu foto de perfil</h1>
              <p className="text-on-surface-variant text-xs sm:text-sm">Sube una foto para que te reconozcan en la comunidad.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl">
                {error}
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 mb-6",
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-outline-variant hover:border-primary/40 hover:bg-surface-container-low/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoSelect(file);
                }}
              />
              {photoPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-28 h-28 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">Click o arrastra para cambiar</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload size={22} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-on-surface">Arrastra una imagen aquí</p>
                    <p className="text-xs text-on-surface-variant mt-1">o haz click para seleccionar</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkipPhoto}
                className="btn-secondary flex-1"
              >
                SALTAR
              </button>
              <button
                onClick={handleUploadPhoto}
                disabled={uploading}
                className="btn-primary flex-1"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    SUBIENDO...
                  </span>
                ) : 'CONTINUAR'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;
