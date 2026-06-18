import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Share2, Trash2, Send, Crown, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { resolveAssetUrl } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../ui/UserAvatar';

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Me gusta' },
  { type: 'love', emoji: '❤️', label: 'Me encanta' },
  { type: 'laugh', emoji: '😂', label: 'Me da risa' },
  { type: 'wow', emoji: '😮', label: 'Me sorprende' },
  { type: 'sad', emoji: '😢', label: 'Me entristece' },
  { type: 'angry', emoji: '😡', label: 'Me enoja' },
];

interface PostCardProps {
  post: any;
  onReact?: (postId: number, type: string) => void;
  onDelete?: (postId: number) => void;
  onComment?: (postId: number, content: string) => void;
  onShare?: (content: string) => void;
  onDeleteComment?: (commentId: number) => void;
  onVotePoll?: (postId: number, optionId: number) => void;
  showDelete?: boolean;
  canDeleteComment?: (comment: any) => boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onReact, onDelete, onComment, onShare, onDeleteComment, onVotePoll, showDelete, canDeleteComment }) => {
  const { user } = useAuth();
  const [expandedComment, setExpandedComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowReactionPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onComment?.(post.id_post, commentText);
    setCommentText('');
    setExpandedComment(false);
  };

  const handleReaction = (type: string) => {
    if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
    onReact?.(post.id_post, type);
    setShowReactionPicker(false);
  };

  const reactions = post.reactions || {};
  const userReaction = post.user_reaction;
  const totalReactions = Object.values(reactions).reduce((a: any, b: any) => a + b, 0);
  const topReaction = Object.entries(reactions).sort(([, a]: any, [, b]: any) => b - a)[0];

  const isAuthorPremium = post.user?.is_premium;

  return (
    <div className={cn(
      "p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[4rem] bg-white border transition-all space-y-6 lg:space-y-8 group",
      isAuthorPremium ? "border-amber-400/50 shadow-xl shadow-amber-500/5" : "border-outline-variant hover:border-primary/20"
    )}>
      <div className="flex justify-between items-start">
        <div className="flex gap-4 lg:gap-5">
          <div className="relative">
            <UserAvatar 
              src={resolveAssetUrl(post.author_photo_url || post.user?.profile?.photo_url)} 
              alt="Avatar" 
              className={cn(
                "w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-surface-container-high object-cover",
                isAuthorPremium && "ring-2 ring-amber-400 ring-offset-2 ring-offset-white"
              )}
              size={24}
            />
            {isAuthorPremium && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md border border-white">
                <Crown size={12} className="fill-white" />
              </div>
            )}
          </div>
          <div>
            <h4 className={cn("text-base lg:text-lg font-black italic tracking-tight flex items-center gap-2", isAuthorPremium && "text-amber-600")}>
              {post.author || post.user?.username}
              {isAuthorPremium && <Sparkles size={16} className="text-amber-400" />}
            </h4>
            <p className="text-[9px] lg:text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em]">
              {post.created_at ? format(new Date(post.created_at), 'HH:mm • d MMM', { locale: es }) : 'Reciente'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showDelete && (
            <button
              onClick={() => onDelete?.(post.id_post)}
              className="p-2 rounded-lg bg-red-50 text-red-500 border border-red-100 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          )}
          <div className={cn(
            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
            post.type === 'query' ? "bg-amber-50 text-amber-600 border-amber-200" :
            post.type === 'feedback' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
            post.type === 'poll' ? "bg-purple-50 text-purple-600 border-purple-200" :
            "bg-surface-container-high text-on-surface-variant border-transparent"
          )}>
            {({
              comment: 'Comentario',
              query: 'Pregunta',
              poll: 'Encuesta',
              feedback: 'Feedback',
            } as Record<string, string>)[post.type] || post.type}
          </div>
        </div>
      </div>

      {(() => {
        const gifMatch = post.content?.match(/\[GIF:(https?:\/\/[^\]]+)\]/);
        const textContent = post.content?.replace(/\[GIF:https?:\/\/[^\]]+\]/g, '').trim();
        const mediaList = Array.isArray(post.media) ? post.media : [];
        return (
          <>
            {textContent && (
              <p className="text-xl lg:text-2xl font-medium text-on-surface leading-tight tracking-tight whitespace-pre-wrap">
                {textContent}
              </p>
            )}
            {gifMatch && (
              <div className="rounded-xl overflow-hidden max-h-96 max-w-2xl mx-auto bg-black/5">
                <img src={gifMatch[1]} alt="GIF" className="w-full h-full object-contain mx-auto" />
              </div>
            )}
            {mediaList.length > 0 && !gifMatch && (
              <div className={cn("grid gap-3", mediaList.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                {mediaList.map((url: string, i: number) => (
                  <div key={i} className="rounded-xl overflow-hidden max-h-96 max-w-2xl mx-auto bg-black/5">
                    <img src={resolveAssetUrl(url) || url} alt="" className="w-full h-full object-contain mx-auto" />
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}

      {post.pollOptions && post.pollOptions.length > 0 && (
        <div className="space-y-2">
          {post.pollOptions.map((opt: any) => {
            const pct = post.totalPollVotes > 0 ? Math.round((opt.votes / post.totalPollVotes) * 100) : 0;
            const isSelected = post.userVote === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
                  onVotePoll?.(post.id_post, opt.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left cursor-pointer relative overflow-hidden"
                style={{
                  borderColor: isSelected ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                  background: isSelected ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-xl transition-all"
                  style={{
                    width: `${pct}%`,
                    background: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.05)',
                  }}
                />
                <span className="relative z-10 flex-1 text-sm font-medium text-on-surface">{opt.text}</span>
                <span className="relative z-10 text-xs font-bold text-on-surface-variant">{pct}%</span>
              </button>
            );
          })}
          <p className="text-[10px] text-on-surface-variant font-bold">{post.totalPollVotes} votos</p>
        </div>
      )}
      <div className="flex gap-4 lg:gap-8 pt-6 lg:pt-8 border-t border-outline-variant/30">
        {/* Reaction Button */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => {
              if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
              if (userReaction) {
                onReact?.(post.id_post, userReaction);
              } else {
                setShowReactionPicker(prev => !prev);
              }
            }}
            className={cn(
              "flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-xl cursor-pointer",
              userReaction ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:text-primary"
            )}
          >
            {userReaction ? (
              <span className="text-lg leading-none">{REACTIONS.find(r => r.type === userReaction)?.emoji}</span>
            ) : (
              <span className="text-lg leading-none">👍</span>
            )}
            {totalReactions > 0 ? totalReactions : 'Reaccionar'}
          </button>
          {showReactionPicker && (
            <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white rounded-2xl shadow-2xl border border-outline-variant p-2 z-50">
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl text-xl hover:scale-125 transition-all hover:bg-surface-container-low cursor-pointer",
                    userReaction === r.type && "bg-primary/10 ring-2 ring-primary/30"
                  )}
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
            setExpandedComment(!expandedComment);
          }}
          className="flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all"
        >
          <MessageSquare className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
          {post.comments?.length > 0 ? `${post.comments.length} Comentarios` : 'Comentar'}
        </button>
        <button
          onClick={() => onShare?.(post.content)}
          className="hidden sm:flex items-center gap-3 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all ml-auto"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Reaction summary */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-bold -mt-4 ml-1">
          {REACTIONS.filter(r => reactions[r.type]).slice(0, 5).map(r => (
            <span key={r.type} className="text-base leading-none">{r.emoji}</span>
          ))}
          <span className="ml-1">{totalReactions}</span>
        </div>
      )}

      {post.comments?.length > 0 && (
        <div className="space-y-4 pt-4 ml-6 lg:ml-10 border-l-2 border-outline-variant/30 pl-6">
          {post.comments.map((comment: any) => (
            <div key={comment.id_comment} className="flex items-start gap-3 group/comment">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Link to={`/@${comment.author}`} className="text-[10px] font-black italic hover:text-primary transition-colors">{comment.author}</Link>
                  <span className="text-[8px] text-on-surface-variant font-bold uppercase">
                    {format(new Date(comment.created_at), 'HH:mm • d MMM', { locale: es })}
                  </span>
                </div>
                <p className="text-sm lg:text-base text-on-surface-variant">{comment.content}</p>
              </div>
              {canDeleteComment?.(comment) && (
                <button
                  onClick={() => onDeleteComment?.(comment.id_comment)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover/comment:opacity-100 transition-all hover:bg-red-500 hover:text-white shrink-0 mt-0.5"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {expandedComment && (
        <div className="flex gap-3 pt-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            placeholder="Escribe un comentario..."
            className="flex-1 h-12 px-5 rounded-2xl bg-surface-container-low text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-primary/40 transition-all"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!commentText.trim()}
            className="px-6 h-12 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-primary-container transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PostCard;
