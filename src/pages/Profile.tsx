import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, MapPin, Calendar, Grid, Bookmark, Users, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, MessageCircle, ThumbsUp, Share2, MoreHorizontal, Trash2, Gavel } from 'lucide-react';
import { createNotification } from '../services/notificationService';
import { api } from '../services/apiClient';

const Profile: React.FC = () => {
  const { username } = useParams();
  const { profile: loggedProfile, user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [newPost, setNewPost] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('WALL');
  const [selectedPostForComment, setSelectedPostForComment] = React.useState<string | null>(null);

  // Fetch profile by username
  React.useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        if (!username) return;
        const data: any = await api.getPublicProfileByUsername(username);
        setProfileUser({
          id: data.id,
          username: data.username,
          photoURL: data.photo_url,
          description: data.description,
          instagram: data.instagram,
          instagramVerified: data.instagramVerified,
          createdAt: data.createdAt,
        });
      } catch (err) {
        setProfileUser(null);
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchUser();
  }, [username]);

  // Subscribe to wall posts
  React.useEffect(() => {
    if (!profileUser?.id) return;

    const fetchWall = async () => {
      try {
        const data: any = await api.getUserWall(profileUser.id, 1, 50);
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching wall:', err);
        setPosts([]);
      }
    };

    fetchWall();
  }, [profileUser?.id]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !currentUser || !profileUser) return;

    try {
      const created: any = await api.createWallPost(profileUser.id, newPost);
      if (created) {
        setPosts(prev => [created, ...prev]);
      }
      setNewPost('');

      // Notify the profile owner if someone else posts on their wall
      if (currentUser.uid !== profileUser.id) {
        await createNotification(profileUser.id, {
          type: 'mention',
          fromId: currentUser.uid,
          fromName: loggedProfile?.displayName || currentUser.displayName || 'Alguien',
          fromPhoto: loggedProfile?.photoURL || currentUser.photoURL || '',
          targetId: profileUser.id,
          targetType: 'user',
          message: 'escribió en tu muro.',
          targetLink: `/u/${profileUser.username}`
        });
      }
    } catch (err) {
      console.error("Error posting to wall:", err);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
    try {
      const result: any = await api.toggleWallPostLike(postId);
      setPosts(prev => prev.map(p => p.id_post === postId ? { ...p, likes_count: result.likes_count } : p));
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!content.trim() || !currentUser || !profileUser) return;

    try {
      const comment: any = await api.createWallComment(postId, content);
      setPosts(prev =>
        prev.map(post => {
          if (post.id_post === postId || post.id === postId) {
            const existing = post.comments || [];
            return { ...post, comments: [...existing, comment] };
          }
          return post;
        })
      );

      if (currentUser.uid !== profileUser.id) {
        // Notification logic...
      }
    } catch (err) {
      console.error("Error commenting:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await api.deleteWallPost(postId);
      setPosts(prev => prev.filter(p => p.id_post !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const isModerator = loggedProfile?.role === 'admin' || loggedProfile?.role === 'moderator';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-4xl font-black italic">Usuario no encontrado</h2>
        <p className="text-on-surface-variant">El perfil que buscas no existe o ha cambiado de nombre.</p>
        <Link to="/" className="btn-primary inline-flex items-center px-8">VOLVER AL INICIO</Link>
      </div>
    );
  }

  const isOwnProfile = loggedProfile?.uid === profileUser.id;

  return (
    <div className="max-w-5xl mx-auto space-y-8 lg:space-y-12">
      {/* Profile Header */}
      <section className="relative h-[400px] lg:h-64 rounded-[2rem] lg:rounded-[3rem] overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary-container/20" />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-full max-w-4xl px-6 lg:px-10 flex flex-col lg:flex-row lg:items-end justify-between translate-y-8 lg:translate-y-12 mt-8 lg:mt-0">
              <div className="flex flex-col lg:flex-row items-center lg:items-end gap-6 lg:gap-8">
                 <div className="relative group shrink-0">
                    <img 
                      src={profileUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser?.username}`} 
                      alt="Profile" 
                      className="w-32 h-32 lg:w-40 lg:h-40 shrink-0 rounded-[2rem] lg:rounded-[2.5rem] bg-white p-2 shadow-2xl shadow-black/10 transition-transform hover:scale-105 object-cover"
                    />
                    {isOwnProfile && (
                      <button className="absolute bottom-2 right-2 lg:bottom-4 lg:right-4 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <Settings size={16} />
                      </button>
                    )}
                 </div>
                 <div className="pb-0 lg:pb-4 space-y-2 text-center lg:text-left">
                    <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3">
                       <h1 className="text-3xl lg:text-4xl font-black tracking-tight">{profileUser?.displayName || profileUser?.username}</h1>
                       <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase">Miembro Élite</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start gap-4 text-on-surface-variant font-medium text-xs lg:text-sm">
                       <span className="flex items-center gap-1.5"><AtSign size={14} /> {profileUser?.username}</span>
                       <span className="flex items-center gap-1.5">
                         <Calendar size={14} /> 
                         Miembro desde {profileUser?.createdAt ? format(new Date(profileUser.createdAt), "MMM yyyy", { locale: es }) : 'Mayo 2026'}
                       </span>
                    </div>
                 </div>
              </div>

              <div className="pb-4 mt-6 lg:mt-0 flex justify-center lg:justify-end gap-3 lg:gap-4">
                 {isOwnProfile ? (
                   <button className="btn-secondary h-12 lg:h-auto px-6 lg:px-8 text-xs lg:text-sm font-black uppercase tracking-widest">EDITAR PERFIL</button>
                 ) : (
                   <button className="btn-primary h-12 lg:h-auto px-6 lg:px-8 text-xs lg:text-sm font-black uppercase tracking-widest">SEGUIR</button>
                 )}
                 <button className="btn-secondary w-12 h-12 p-0 flex items-center justify-center"><Share2 size={18} /></button>
              </div>
           </div>
        </div>
      </section>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12 pt-8 lg:pt-12">
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
                    "text-[10px] lg:text-[11px] font-black tracking-[0.2em] uppercase transition-all relative whitespace-nowrap",
                    activeTab === tab.id ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                  )}
                 >
                   {tab.label}
                   {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute -bottom-6 left-0 right-0 h-1 bg-primary rounded-full" />}
                 </button>
               ))}
            </div>

            {activeTab === 'WALL' && (
              <div className="space-y-8 px-4 lg:px-0">
                {/* Create Post */}
                {currentUser && (
                  <form onSubmit={handlePost} className="p-6 lg:p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant space-y-4">
                    <div className="flex gap-4">
                      <img 
                        src={loggedProfile?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} 
                        className="w-12 h-12 rounded-xl shrink-0 object-cover bg-primary/10" 
                        alt="Me"
                      />
                      <textarea 
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder={isOwnProfile ? "¿Qué estás pensando?" : `Escríbele algo a @${profileUser.username}...`}
                        className="flex-1 bg-transparent border-none outline-none text-base lg:text-lg font-medium placeholder:text-on-surface-variant/40 resize-none min-h-[80px] pt-1"
                      />
                    </div>
                    <div className="flex justify-end pt-2 border-t border-outline-variant/30">
                      <button 
                        type="submit" 
                        disabled={!newPost.trim()}
                        className="btn-primary px-6 h-10 rounded-full text-[10px] font-black tracking-widest uppercase disabled:opacity-50"
                      >
                        PUBLICAR
                      </button>
                    </div>
                  </form>
                )}

                {/* Wall Posts */}
                <div className="space-y-6">
                  {posts.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-outline-variant rounded-[3rem]">
                      <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle size={24} className="text-on-surface-variant opacity-40" />
                      </div>
                      <p className="text-on-surface-variant font-medium">No hay publicaciones aún.</p>
                      <p className="text-[10px] text-on-surface-variant/60 uppercase font-black tracking-widest mt-1">¡Sé el primero en decir hola!</p>
                    </div>
                  ) : (
                    posts.map(post => (
                      <motion.div 
                        key={post.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 lg:p-8 rounded-[2.5rem] bg-white border border-outline-variant hover:border-primary/20 transition-all space-y-4 shadow-sm group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                             <img 
                              src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} 
                              className="w-12 h-12 shrink-0 rounded-xl bg-surface-container-low object-cover" 
                              alt="Author" 
                             />
                             <div className="space-y-0.5">
                                <h4 className="text-base font-black italic tracking-tight">{post.authorName}</h4>
                                <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.1em]">
                                  {post.created_at ? format(new Date(post.created_at), 'HH:mm • d MMM', { locale: es }) : 'Reciente'}
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             {(isOwnProfile || isModerator || post.id_author_user === currentUser?.uid) && (
                               <button 
                                 onClick={() => handleDeletePost(post.id_post)}
                                 className="p-2 rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                               >
                                 <Trash2 size={16} />
                               </button>
                             )}
                             <button className="text-on-surface-variant hover:text-on-surface"><MoreHorizontal size={20} /></button>
                          </div>
                        </div>
                        <p className="text-lg lg:text-xl font-medium text-on-surface leading-tight tracking-tight">
                          {post.content}
                        </p>

                        <div className="flex gap-6 pt-4 border-t border-outline-variant/30">
                          <button 
                            onClick={() => handleLike(post.id_post)}
                            className={cn(
                              "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                              "text-on-surface-variant hover:text-primary"
                            )}
                          >
                            <ThumbsUp size={16} /> 
                            {post.likes_count > 0 ? post.likes_count : 'Me gusta'}
                          </button>
                          <button 
                            onClick={() => setSelectedPostForComment(selectedPostForComment === post.id_post ? null : post.id_post)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all"
                          >
                            <MessageCircle size={16} /> 
                            {post.comments?.length > 0 ? post.comments.length : 'Comentar'}
                          </button>
                        </div>

                        {/* Comments Section */}
                        <AnimatePresence>
                          {selectedPostForComment === post.id_post && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden bg-surface-container-low/50 rounded-2xl"
                            >
                              <div className="p-4 space-y-4">
                                <PostComments comments={post.comments || []} isModerator={isModerator} profileUserId={profileUser.id} />
                                {currentUser && (
                                  <form 
                                    className="flex gap-2"
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const input = (e.target as any).comment;
                                      handleComment(post.id_post, input.value);
                                      input.value = '';
                                    }}
                                  >
                                    <input 
                                      name="comment"
                                      placeholder="Escribe un comentario..."
                                      className="flex-1 bg-white border border-outline-variant rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/30 transition-all font-medium"
                                    />
                                    <button className="btn-primary w-10 h-10 p-0 flex items-center justify-center shrink-0">
                                      <Send size={16} />
                                    </button>
                                  </form>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ACTIVITY' && (
              <div className="space-y-6 lg:space-y-8 px-4 lg:px-0">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex flex-col sm:flex-row gap-4 lg:gap-6 p-4 lg:p-6 bg-surface-container-low rounded-[1.5rem] lg:rounded-[2rem] border border-transparent hover:border-primary/10 transition-all cursor-pointer">
                      <div className="w-full sm:w-24 h-40 sm:h-24 rounded-2xl overflow-hidden bg-white shrink-0">
                         <img src={`https://images.unsplash.com/photo-${1500000000000+i}?auto=format&fit=crop&q=80&w=400`} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                         <div className="flex justify-between items-start">
                            <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest leading-none">Asistió a Evento • hace 2d</p>
                            <Heart size={16} className="text-on-surface-variant hover:text-red-500 transition-colors" />
                         </div>
                         <h3 className="text-lg lg:text-xl font-bold font-sans">Geek Meetup #0{i} Buenos Aires</h3>
                         <p className="text-xs text-on-surface-variant line-clamp-2 lg:line-clamp-1">"La atmósfera fue absolutamente eléctrica. ¡La mejor noche del mes!"</p>
                      </div>
                   </div>
                 ))}
              </div>
            )}

            {activeTab === 'FAVORITES' && (
              <div className="text-center py-20 px-4">
                <Bookmark size={40} className="mx-auto mb-4 text-on-surface-variant opacity-20" />
                <p className="text-on-surface-variant font-medium">No hay eventos guardados aún.</p>
              </div>
            )}
         </div>

         <aside className="space-y-8 lg:space-y-10 px-4 lg:px-0">
            {/* Stats */}
            <div className="bg-surface-container-low rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 border border-outline-variant grid grid-cols-2 gap-y-6 shadow-xs">
               <div className="text-center">
                  <p className="text-xl lg:text-2xl font-black">{profileUser?.stats?.events || 0}</p>
                  <p className="text-[9px] lg:text-[10px] text-on-surface-variant uppercase font-black tracking-widest">Eventos</p>
               </div>
               <div className="text-center">
                  <p className="text-xl lg:text-2xl font-black">{profileUser?.stats?.followers || 0}</p>
                  <p className="text-[9px] lg:text-[10px] text-on-surface-variant uppercase font-black tracking-widest">Seguidores</p>
               </div>
               <div className="text-center">
                  <p className="text-xl lg:text-2xl font-black">{profileUser?.stats?.following || 0}</p>
                  <p className="text-[9px] lg:text-[10px] text-on-surface-variant uppercase font-black tracking-widest">Siguiendo</p>
               </div>
               <div className="text-center">
                  <p className="text-xl lg:text-2xl font-black">{profileUser?.stats?.vibeScore || 0}</p>
                  <p className="text-[9px] lg:text-[10px] text-on-surface-variant uppercase font-black tracking-widest">Vibe Score</p>
               </div>
            </div>

            {/* Bio */}
            <div className="space-y-4">
               <h3 className="text-label ml-4">Sobre Identidad</h3>
               <div className="bg-surface-container-low rounded-[1.5rem] p-6 border border-outline-variant">
                  <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                     {profileUser?.description || "Este usuario aún no ha escrito su biografía. ¡Parece que prefiere dejar que sus eventos hablen por él!"}
                  </p>
               </div>
            </div>

            {/* Social connections */}
            <div className="space-y-4">
               <h3 className="text-label ml-4">Conexiones</h3>
               <div className="flex -space-x-4 pl-4 overflow-x-auto no-scrollbar py-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-4 border-white overflow-hidden bg-surface-container-low shrink-0 shadow-lg">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}prof`} alt="Friend" />
                    </div>
                  ))}
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-4 border-white bg-surface-container-high flex items-center justify-center text-[10px] font-bold shrink-0 shadow-lg">
                    +12
                  </div>
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
};

const AtSign = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
);

const PostComments: React.FC<{ comments: any[]; isModerator: boolean; profileUserId: string }> = ({ comments, isModerator, profileUserId }) => {
  const { user: currentUser } = useAuth();

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <div key={comment.id_comment || comment.id} className="flex gap-3 items-start group/comment">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.id_author_user || comment.authorId}`} 
            className="w-8 h-8 rounded-lg shrink-0 object-cover bg-primary/10" 
            alt="Commenter"
          />
          <div className="bg-white/50 px-4 py-2 rounded-2xl flex-1 border border-outline-variant/10 relative">
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="text-[11px] font-black italic">{comment.author_username || comment.authorName}</span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-on-surface-variant font-black uppercase tracking-wider">
                  {comment.created_at ? format(new Date(comment.created_at), 'HH:mm', { locale: es }) : '...'}
                </span>
                {(isModerator || comment.id_author_user === currentUser?.uid || profileUserId === currentUser?.uid) && (
                  <button 
                    disabled
                    className="text-red-500 opacity-0 group-hover/comment:opacity-100 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-on-surface leading-tight">{comment.content}</p>
          </div>
        </div>
      ))}
      {comments.length === 0 && (
        <div className="text-center py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">Sé el primero en comentar</div>
      )}
    </div>
  );
};

export default Profile;
