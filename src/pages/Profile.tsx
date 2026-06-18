import React, { useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, MapPin, Calendar, Grid, Bookmark, Users, Heart, Pencil, X, Check, Instagram, Image, Smile, Loader2, Upload, Crown, Sparkles, Star, ShieldCheck, Zap } from 'lucide-react';
import { cn, NO_EVENT_IMAGE } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, MessageCircle, ThumbsUp, Share2, MoreHorizontal, Trash2, Gavel } from 'lucide-react';
import { createNotification } from '../services/notificationService';
import { api, resolveAssetUrl } from '../services/apiClient';
import { UserAvatar } from '../components/ui/UserAvatar';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { GifPicker } from '../components/post/GifPicker';
import PostFeed from '../components/wall/PostFeed';
import { PremiumModal } from '../components/ui/PremiumModal';

const safeDate = (val: any) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const Profile: React.FC<{ usernameFromUrl?: string }> = ({ usernameFromUrl }) => {
  const paramsUsername = useParams<{ username: string }>().username;
  const username = usernameFromUrl || paramsUsername;
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const premiumSuccess = searchParams.get('premium_success') === 'true';
  
  const { profile: loggedProfile, user: currentUser, refreshProfile } = useAuth();
  const [premiumModalOpen, setPremiumModalOpen] = React.useState(false);
  const [profileUser, setProfileUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [newPost, setNewPost] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('WALL');
  const [selectedPostForComment, setSelectedPostForComment] = React.useState<string | null>(null);
  const [savedEvents, setSavedEvents] = React.useState<any[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ username: '', description: '', instagram: '' });
  const [saving, setSaving] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showGifPicker, setShowGifPicker] = React.useState(false);
  const [selectedGif, setSelectedGif] = React.useState<string | null>(null);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const isOwnProfile = loggedProfile?.uid === profileUser?.id;

  React.useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        if (!username) return;
        const data: any = await api.getPublicProfileByUsername(username);
        setProfileUser({
          id: data.id,
          username: data.username,
          displayName: data.username,
          photoURL: resolveAssetUrl(data.photo_url),
          description: data.description,
          instagram: data.instagram,
          instagramVerified: data.instagramVerified,
          isPremium: !!data.is_premium,
          premiumUntil: data.premium_until,
          createdAt: data.createdAt,
          stats: data.stats || { events: 0, followers: 0, following: 0, vibeScore: 0 },
          recentEvents: data.recentEvents || [],
        });
        
        if (currentUser && data.id !== currentUser.uid) {
          try {
            const followStatus: any = await api.checkFollowing(data.id);
            setIsFollowing(!!followStatus.isFollowing);
          } catch (e) {
            console.error('Error checking follow status', e);
          }
        }
      } catch (err) {
        setProfileUser(null);
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchUser();
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profileUser) {
      document.dispatchEvent(new CustomEvent('show-login-prompt'));
      return;
    }
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowUser(profileUser.id);
        setIsFollowing(false);
        setProfileUser(prev => ({ ...prev, stats: { ...prev.stats, followers: Math.max(0, prev.stats.followers - 1) } }));
      } else {
        await api.followUser(profileUser.id);
        setIsFollowing(true);
        setProfileUser(prev => ({ ...prev, stats: { ...prev.stats, followers: prev.stats.followers + 1 } }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  React.useEffect(() => {
    if (!profileUser?.id) return;

    const fetchWall = async () => {
      try {
        const data: any = await api.getWallPosts('user_profile', profileUser.id, 1, 50);
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching wall:', err);
        setPosts([]);
      }
    };

    fetchWall();
  }, [profileUser?.id]);

  React.useEffect(() => {
    if (!isOwnProfile || activeTab !== 'FAVORITES') return;

    const fetchSaved = async () => {
      try {
        const result: any = await api.getSavedEvents(1, 50);
        setSavedEvents(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error('Error fetching saved events:', err);
        setSavedEvents([]);
      }
    };

    fetchSaved();
  }, [isOwnProfile, activeTab]);

  React.useEffect(() => {
    if (!editModalOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) handlePhotoSelect(file);
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [editModalOpen]);

  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    // Premium GIF check
    if (file.type === 'image/gif' && !loggedProfile?.is_premium && loggedProfile?.role !== 'admin') {
      alert('Solo los usuarios Premium pueden usar GIFs como foto de perfil.');
      return;
    }

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

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newPost.trim() && !selectedGif) || !currentUser || !profileUser) return;

    try {
      const content = selectedGif
        ? `${newPost.trim()}\n[GIF:${selectedGif}]`
        : newPost.trim();
      const created: any = await api.createWallPost_new('user_profile', profileUser.id, content);
      if (created) {
        setPosts(prev => [created, ...prev]);
      }
      setNewPost('');
      setSelectedGif(null);
      setShowEmojiPicker(false);
      setShowGifPicker(false);

      if (currentUser.uid !== profileUser.id) {
        await createNotification(profileUser.id, {
          type: 'mention',
          fromId: currentUser.uid,
          fromName: loggedProfile?.displayName || currentUser.displayName || 'Alguien',
          fromPhoto: loggedProfile?.photoURL || currentUser.photoURL || '',
          targetId: profileUser.id,
          targetType: 'user',
          message: 'escribió en tu muro.',
          targetLink: `/@${profileUser.username}`
        });
      }
    } catch (err) {
      console.error("Error posting to wall:", err);
    }
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNewPost(prev => prev + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = newPost.substring(0, start);
    const after = newPost.substring(end);
    setNewPost(before + text + after);
    setTimeout(() => {
      textarea.focus();
      const newPos = start + text.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    insertAtCursor(emojiData.emoji);
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowGifPicker(false);
  };

  const handleReact = async (postId: number, type: string) => {
    if (!currentUser) return;
    const prev = posts.find(p => p.id_post === postId);
    const prevReaction = prev?.user_reaction;
    setPosts(prev => prev.map(p =>
      p.id_post === postId ? { ...p, user_reaction: p.user_reaction === type ? null : type } : p
    ));
    try {
      const result: any = await api.toggleReaction(postId, type);
      setPosts(prev => prev.map(p =>
        p.id_post === postId ? { ...p, reactions: result.reactions } : p
      ));
    } catch (err) {
      setPosts(prev => prev.map(p =>
        p.id_post === postId ? { ...p, user_reaction: prevReaction } : p
      ));
      console.error("Error toggling reaction:", err);
    }
  };

  const handleComment = async (postId: number, content: string) => {
    if (!content.trim() || !currentUser || !profileUser) return;

    try {
      await api.createWallComment_new(postId, content);
      const data: any = await api.getWallPosts('user_profile', profileUser.id, 1, 50);
      setPosts(data || []);
    } catch (err) {
      console.error("Error commenting:", err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await api.deleteWallPost_new(postId);
      setPosts(prev => prev.filter(p => p.id_post !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Perfil de ${profileUser?.username}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
    }
  };

  const openEditModal = () => {
    setEditForm({
      username: profileUser?.username || '',
      description: profileUser?.description || '',
      instagram: profileUser?.instagram || '',
    });
    setPhotoFile(null);
    setPhotoPreview(profileUser?.photoURL || null);
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.username.trim()) return;
    setSaving(true);
    try {
      let newPhotoURL = profileUser?.photoURL;

      if (photoFile && currentUser) {
        setUploadingPhoto(true);
        newPhotoURL = await api.uploadProfilePhoto(photoFile);
        setUploadingPhoto(false);
      }

      await api.updateProfile({
        username: editForm.username,
        description: editForm.description,
        instagram: editForm.instagram,
        photo_url: newPhotoURL,
      });

      await refreshProfile();

      setProfileUser((prev: any) => ({
        ...prev,
        username: editForm.username,
        displayName: editForm.username,
        description: editForm.description,
        instagram: editForm.instagram,
        photoURL: newPhotoURL || prev.photoURL,
      }));
      setEditModalOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setUploadingPhoto(false);
    } finally {
      setSaving(false);
    }
  };

  const isModerator = loggedProfile?.role === 'admin' || loggedProfile?.role === 'moderator';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 space-y-4"
      >
        <h2 className="text-4xl font-black italic">Usuario no encontrado</h2>
        <p className="text-on-surface-variant">El perfil que buscas no existe o ha cambiado de nombre.</p>
        <Link to="/" className="btn-primary inline-flex items-center px-8">VOLVER AL INICIO</Link>
      </motion.div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 lg:space-y-12">
      <PremiumModal isOpen={premiumModalOpen} onClose={() => setPremiumModalOpen(false)} />
      
      {premiumSuccess && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-amber-100 border border-amber-200 p-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm mx-4 lg:mx-0"
        >
          <Crown size={20} className="text-amber-600" />
          <p className="text-xs font-black text-amber-800 uppercase tracking-widest">¡Felicidades! Ya eres usuario PREMIUM. Disfruta de tus beneficios.</p>
        </motion.div>
      )}

      {/* Profile Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative h-[400px] lg:h-64 rounded-[2rem] lg:rounded-[3rem] overflow-hidden"
      >
        <div className={cn("absolute inset-0 transition-colors duration-1000", profileUser?.isPremium ? "bg-linear-to-br from-amber-400/20 via-amber-200/20 to-amber-400/20" : "bg-linear-to-br from-primary/20 to-primary-container/20")} />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-full max-w-4xl px-6 lg:px-10 flex flex-col lg:flex-row lg:items-end justify-between translate-y-8 lg:translate-y-12 mt-8 lg:mt-0">
              <div className="flex flex-col lg:flex-row items-center lg:items-end gap-6 lg:gap-8">
                 <div className="relative group shrink-0">
                    <UserAvatar 
                      src={profileUser?.photoURL} 
                      alt="Profile" 
                      className={cn("w-32 h-32 lg:w-40 lg:h-40 shrink-0 rounded-[2rem] lg:rounded-[2.5rem] bg-white p-2 shadow-2xl shadow-black/10 transition-all duration-300 hover:scale-105 hover:shadow-primary/30 object-cover", profileUser?.isPremium && "ring-4 ring-amber-400 ring-offset-4 ring-offset-surface shadow-amber-500/20")}
                      size={60}
                    />
                    {profileUser?.isPremium && (
                      <div className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce-slow">
                        <Crown size={20} className="fill-white" />
                      </div>
                    )}
                 </div>
                  <div className="pb-0 lg:pb-4 space-y-2 text-center lg:text-left">
                     <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3">
                        <h1 className={cn("text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-2", profileUser?.isPremium && "text-amber-600")}>
                          {profileUser?.displayName || profileUser?.username}
                          {profileUser?.isPremium && <Sparkles size={24} className="text-amber-400 animate-pulse" />}
                        </h1>
                     </div>
                    <div className="flex items-center justify-center lg:justify-start gap-4 text-on-surface-variant font-medium text-xs lg:text-sm">
                       <span className="flex items-center gap-1.5"><AtSign size={14} /> {profileUser?.username}</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          Miembro desde {safeDate(profileUser?.createdAt) ? format(safeDate(profileUser?.createdAt)!, "MMM yyyy", { locale: es }) : 'Mayo 2026'}
                        </span>
                    </div>
                 </div>
              </div>

              <div className="pb-4 mt-6 lg:mt-0 flex justify-center lg:justify-end gap-3 lg:gap-4">
                 {isOwnProfile && !profileUser?.isPremium && (
                   <button
                     onClick={() => setPremiumModalOpen(true)}
                     className="bg-linear-to-r from-amber-400 to-amber-600 text-white h-12 lg:h-14 px-6 lg:px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] lg:text-xs shadow-xl shadow-amber-500/30 flex items-center gap-2 hover:scale-105 transition-all"
                   >
                     <Zap size={16} className="fill-white" /> UNIRME A PREMIUM
                   </button>
                 )}
                 {isOwnProfile ? (
                   <button
                     onClick={openEditModal}
                     className="btn-secondary h-12 lg:h-auto px-6 lg:px-8 text-xs lg:text-sm font-black uppercase tracking-widest"
                   >
                     EDITAR PERFIL
                   </button>
                 ) : (
                   <button 
                     onClick={handleFollow}
                     disabled={followLoading}
                     className={cn(
                       "h-12 lg:h-auto px-6 lg:px-8 text-xs lg:text-sm font-black uppercase tracking-widest transition-all",
                       isFollowing ? "btn-secondary" : "btn-primary"
                     )}
                   >
                     {followLoading ? <Loader2 size={16} className="animate-spin" /> : (isFollowing ? 'SIGUIENDO' : 'SEGUIR')}
                   </button>
                 )}
                 <button
                   onClick={handleShare}
                   className="btn-secondary w-12 h-12 p-0 flex items-center justify-center relative"
                 >
                   <AnimatePresence mode="wait">
                     {copied ? (
                       <motion.span
                         key="check"
                         initial={{ scale: 0 }}
                         animate={{ scale: 1 }}
                         exit={{ scale: 0 }}
                         className="text-green-500"
                       >
                         <Check size={18} />
                       </motion.span>
                     ) : (
                       <motion.span
                         key="share"
                         initial={{ scale: 0 }}
                         animate={{ scale: 1 }}
                         exit={{ scale: 0 }}
                       >
                         <Share2 size={18} />
                       </motion.span>
                     )}
                   </AnimatePresence>
                 </button>
              </div>
           </div>
        </div>
      </motion.section>

      {/* Bio Section - below header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-4 lg:px-0"
      >
        <div className="bg-surface-container-low rounded-[1.5rem] p-6 border border-outline-variant hover:border-primary/20 hover:shadow-md transition-all duration-300">
          <div className="flex-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Sobre</h3>
            <p className="text-sm text-on-surface leading-relaxed font-medium">
              {profileUser?.description || "Este usuario aún no ha escrito su biografía. ¡Parece que prefiere dejar que sus eventos hablen por él!"}
            </p>
            {profileUser?.instagram && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-on-surface-variant">
                <Instagram size={14} />
                <span className="font-medium">{profileUser.instagramVerified ? (
                  <span className="text-primary font-semibold">@{profileUser.instagram} ✓</span>
                ) : (
                  `@${profileUser.instagram}`
                )}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12 pt-4 lg:pt-8">
         <div className="space-y-12">
            {/* Nav Tabs */}
            <div className="flex gap-6 lg:gap-10 border-b border-outline-variant px-4 lg:px-0 overflow-x-auto no-scrollbar pb-6">
               {[
                 { id: 'WALL', label: 'MURO' },
                 { id: 'ACTIVITY', label: 'ACTIVIDAD' },
                 { id: 'FAVORITES', label: 'FAVORITOS' }
               ].map(tab => (
                 <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "text-[10px] lg:text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-200 relative whitespace-nowrap cursor-pointer pb-1",
                    activeTab === tab.id ? "text-primary" : "text-on-surface-variant hover:text-on-surface hover:scale-105"
                  )}
                 >
                   {tab.label}
                   {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute -bottom-6 left-0 right-0 h-1 bg-primary rounded-full" />}
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'WALL' && (
                <motion.div
                  key="wall"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8 px-4 lg:px-0"
                >
                  {/* Create Post */}
                  {currentUser && (
                    <motion.form
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handlePost}
                      className="p-6 lg:p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant space-y-4 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
                    >
                      <div className="flex gap-4">
                        <UserAvatar 
                          src={loggedProfile?.photoURL || currentUser.photoURL} 
                          className="w-12 h-12 rounded-xl shrink-0 object-cover bg-primary/10 transition-transform hover:scale-105" 
                          alt="Me"
                          size={28}
                        />
                        <div className="flex-1">
                          <textarea
                            ref={textareaRef}
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder={isOwnProfile ? "¿Qué estás pensando?" : `Escríbele algo a @${profileUser.username}...`}
                            className="w-full bg-transparent border-none outline-none text-base lg:text-lg font-medium placeholder:text-on-surface-variant/40 resize-none min-h-[80px] pt-1"
                          />
                          {/* GIF preview */}
                          {selectedGif && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-3 relative rounded-xl overflow-hidden max-h-64 bg-black/5"
                            >
                              <img src={selectedGif} alt="Selected GIF" className="max-h-64 object-cover mx-auto" />
                              <button
                                type="button"
                                onClick={() => setSelectedGif(null)}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                        <div className="flex items-center gap-1 relative">
                          {/* Emoji Picker */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                              className="p-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
                            >
                              <Smile size={18} />
                            </button>
                            <AnimatePresence>
                              {showEmojiPicker && (
                                <motion.div
                                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                  className="absolute bottom-full left-0 mb-2 z-50"
                                >
                                  <EmojiPicker
                                    onEmojiClick={handleEmojiSelect}
                                    lazyLoadEmojis
                                    searchDisabled={false}
                                    skinTonesDisabled
                                    width={320}
                                    height={350}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* GIF Picker */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                              className="p-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-primary font-black text-xs tracking-wider"
                            >
                              GIF
                            </button>
                            <AnimatePresence>
                              {showGifPicker && (
                                <GifPicker
                                  onSelect={handleGifSelect}
                                  onClose={() => setShowGifPicker(false)}
                                />
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Image button (placeholder) */}
                          <button
                            type="button"
                            className="p-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
                            title="Adjuntar imagen (próximamente)"
                          >
                            <Image size={18} />
                          </button>
                        </div>
                        <button
                          type="submit"
                          disabled={!newPost.trim() && !selectedGif}
                          className="btn-primary px-6 h-10 rounded-full text-[10px] font-black tracking-widest uppercase"
                        >
                          PUBLICAR
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <PostFeed
                    posts={posts}
                    onReact={handleReact}
                    onDelete={handleDeletePost}
                    onComment={handleComment}
                    onShare={(content) => {
                      if (navigator.share) {
                        navigator.share({ title: 'QueSale', text: content, url: window.location.href }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(`${content} — ${window.location.href}`);
                      }
                    }}
                    onDeleteComment={async (commentId: number) => {
                      if (!window.confirm('¿Eliminar este comentario?')) return;
                      try {
                        await api.deleteWallComment_new(commentId);
                        const data: any = await api.getWallPosts('user_profile', profileUser.id, 1, 50);
                        setPosts(data || []);
                      } catch (err) {
                        console.error('Error deleting comment:', err);
                      }
                    }}
                    showDelete={(post) => isOwnProfile || isModerator || post.id_user === currentUser?.uid}
                    canDeleteComment={(comment) => isOwnProfile || isModerator || comment.id_user === currentUser?.uid || posts.find(p => p.comments?.some((c: any) => c.id_comment === comment.id_comment))?.id_user === currentUser?.uid}
                  />
                </motion.div>
              )}

              {activeTab === 'ACTIVITY' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 lg:space-y-8 px-4 lg:px-0"
                >
                   {profileUser?.recentEvents && profileUser.recentEvents.length > 0 ? (
                     profileUser.recentEvents.map((event: any, i: number) => (
                       <motion.div
                         key={event.id_event || i}
                         initial={{ opacity: 0, y: 15 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: i * 0.06 }}
                         whileHover={{ scale: 1.01, y: -2 }}
                         className="flex flex-col sm:flex-row gap-4 lg:gap-6 p-4 lg:p-6 bg-surface-container-low rounded-[1.5rem] lg:rounded-[2rem] border border-transparent hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                       >
                           <div className="w-full sm:w-24 h-40 sm:h-24 rounded-2xl overflow-hidden bg-white shrink-0">
                              <img src={event.images?.[0] || event.thumbnail_url || NO_EVENT_IMAGE} className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" />
                           </div>
                           <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-start">
                                 <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest leading-none">Asistió a Evento • {safeDate(event.date) ? format(safeDate(event.date)!, 'd MMM yyyy', { locale: es }) : ''}</p>
                                 <Heart size={16} className="text-on-surface-variant hover:text-red-500 hover:scale-125 transition-all duration-200 cursor-pointer" />
                              </div>
                              <h3 className="text-lg lg:text-xl font-bold font-sans">{event.title}</h3>
                             {event.ubication && <p className="text-xs text-on-surface-variant">{event.ubication}</p>}
                          </div>
                       </motion.div>
                     ))
                   ) : (
                     <motion.div
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="text-center py-20 border-2 border-dashed border-outline-variant rounded-[3rem]"
                     >
                       <motion.div
                         animate={{ y: [0, -5, 0] }}
                         transition={{ repeat: Infinity, duration: 2 }}
                         className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4"
                       >
                         <Calendar size={24} className="text-on-surface-variant opacity-40" />
                       </motion.div>
                       <p className="text-on-surface-variant font-medium">No hay actividad reciente.</p>
                     </motion.div>
                   )}
                </motion.div>
              )}

              {activeTab === 'FAVORITES' && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 px-4 lg:px-0"
                >
                  {savedEvents.length > 0 ? (
                    savedEvents.map((event: any, i: number) => (
                      <motion.div
                        key={event.id_event}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        className="flex flex-col sm:flex-row gap-4 lg:gap-6 p-4 lg:p-6 bg-surface-container-low rounded-[1.5rem] lg:rounded-[2rem] border border-transparent hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                      >
                          <div className="w-full sm:w-24 h-40 sm:h-24 rounded-2xl overflow-hidden bg-white shrink-0">
                             <img src={event.images?.[0] || event.thumbnail_url || NO_EVENT_IMAGE} className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" />
                          </div>
                         <div className="flex-1 space-y-2">
                            <h3 className="text-lg lg:text-xl font-bold font-sans">{event.title}</h3>
                            {event.ubication && <p className="text-xs text-on-surface-variant">{event.ubication}</p>}
                            {safeDate(event.date) && <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">{format(safeDate(event.date)!, 'd MMM yyyy', { locale: es })}</p>}
                         </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 border-2 border-dashed border-outline-variant rounded-[3rem]"
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4"
                      >
                        <Bookmark size={24} className="text-on-surface-variant opacity-40" />
                      </motion.div>
                      <p className="text-on-surface-variant font-medium">No hay eventos guardados aún.</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
         </div>

         <aside className="space-y-8 lg:space-y-10 px-4 lg:px-0">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -2 }}
              className="bg-surface-container-low rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 border border-outline-variant grid grid-cols-2 gap-y-6 shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-300"
            >
               {[
                 { label: 'Eventos', value: profileUser?.stats?.events || 0 },
                 { label: 'Seguidores', value: profileUser?.stats?.followers || 0 },
                 { label: 'Siguiendo', value: profileUser?.stats?.following || 0 },
                 { label: 'Vibe Score', value: profileUser?.stats?.vibeScore || 0 },
               ].map((stat, i) => (
                 <motion.div
                   key={stat.label}
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 0.15 + i * 0.05 }}
                   className="text-center cursor-default"
                 >
                    <p className="text-xl lg:text-2xl font-black">{stat.value}</p>
                    <p className="text-[9px] lg:text-[10px] text-on-surface-variant uppercase font-black tracking-widest">{stat.label}</p>
                 </motion.div>
               ))}
            </motion.div>

            <ConnectionsSection userId={profileUser.id} />
         </aside>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-outline-variant">
                <h2 className="text-xl font-black">Editar Perfil</h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Photo Upload */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Foto de perfil</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200",
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
                            className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(profileUser?.photoURL || null); }}
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <span className="text-xs text-on-surface-variant font-medium">Click o arrastra para cambiar</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload size={20} className="text-primary" />
                        </div>
                        <span className="text-xs text-on-surface-variant font-medium text-center">
                          Arrastra una imagen, haz click para seleccionar, o pega con Ctrl+V
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1.5 block">Username</label>
                  <input
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                    placeholder="tu-username"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1.5 block">Biografía</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium resize-none min-h-[100px]"
                    placeholder="Cuéntanos sobre ti..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1.5 block">Instagram</label>
                  <div className="relative">
                    <Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      value={editForm.instagram}
                      onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value }))}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                      placeholder="tu-instagram"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-outline-variant">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || uploadingPhoto || !editForm.username.trim()}
                  className="btn-primary flex-1"
                >
                  {(saving || uploadingPhoto) ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      {uploadingPhoto ? 'SUBIENDO...' : 'GUARDANDO...'}
                    </span>
                  ) : 'GUARDAR'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-surface-dark text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm font-medium"
          >
            <Check size={16} className="text-green-400" />
            ¡Link copiado al portapapeles!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AtSign = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
);

const ConnectionsSection: React.FC<{ userId: string }> = ({ userId }) => {
  const [followers, setFollowers] = React.useState<any[]>([]);
  const [following, setFollowing] = React.useState<any[]>([]);

  React.useEffect(() => {
    Promise.all([
      api.getUserFollowers(userId).catch(() => []),
      api.getUserFollowing(userId).catch(() => []),
    ]).then(([f, fw]) => {
      setFollowers(Array.isArray(f) ? f : []);
      setFollowing(Array.isArray(fw) ? fw : []);
    });
  }, [userId]);

  const allConnections = [...followers, ...following];
  const unique = allConnections.filter((c, i, a) => a.findIndex(x => x.id_user === c.id_user) === i).slice(0, 8);
  const remaining = Math.max(0, allConnections.length - 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <h3 className="text-label ml-4">Conexiones</h3>
      {unique.length > 0 ? (
        <div className="flex -space-x-4 pl-4 overflow-x-auto no-scrollbar py-2">
          {unique.map((conn: any) => (
            <Link key={conn.id_user} to={`/@${conn.username}`}>
              <UserAvatar 
                src={conn.photo_url ? resolveAssetUrl(conn.photo_url) : null} 
                alt={conn.username} 
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-4 border-white shrink-0 shadow-lg transition-all duration-200 hover:opacity-100 hover:scale-125 hover:z-10 hover:shadow-xl" 
                size={24}
              />
            </Link>
          ))}
          {remaining > 0 && (
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-4 border-white bg-surface-container-high flex items-center justify-center text-[10px] font-bold shrink-0 shadow-lg">
              +{remaining}
            </div>
          )}
        </div>
      ) : (
        <div className="flex -space-x-4 pl-4 py-2">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-50 ml-4">Sin conexiones aún</p>
        </div>
      )}
    </motion.div>
  );
};

const PostComments: React.FC<{ comments: any[]; isModerator: boolean; profileUserId: string }> = ({ comments, isModerator, profileUserId }) => {
  const { user: currentUser } = useAuth();

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <motion.div
          key={comment.id_comment || comment.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 items-start group/comment"
        >
          <Link
            to={`/@${comment.author_username}`}
            className="shrink-0 cursor-pointer"
          >
            <UserAvatar 
              src={comment.author_photo} 
              className="w-8 h-8 rounded-lg object-cover bg-primary/10 transition-transform hover:scale-110" 
              alt="Commenter"
              size={18}
            />
          </Link>
          <div className="bg-white/50 px-4 py-2 rounded-2xl flex-1 border border-outline-variant/10 relative">
            <div className="flex justify-between items-baseline mb-0.5">
              <Link
                to={`/@${comment.author_username}`}
                className="text-[11px] font-black italic hover:text-primary transition-colors cursor-pointer"
              >
                {comment.author_username || comment.authorName}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-on-surface-variant font-black uppercase tracking-wider">
                  {safeDate(comment.created_at) ? format(safeDate(comment.created_at)!, 'HH:mm', { locale: es }) : '...'}
                </span>
                {(isModerator || comment.id_author_user === currentUser?.uid || profileUserId === currentUser?.uid) && (
                  <button
                    className="text-red-500 opacity-0 group-hover/comment:opacity-100 transition-all hover:text-red-600 hover:scale-110 cursor-pointer"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-on-surface leading-tight">{comment.content}</p>
          </div>
        </motion.div>
      ))}
      {comments.length === 0 && (
        <div className="text-center py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">Sé el primero en comentar</div>
      )}
    </div>
  );
};

export default Profile;
