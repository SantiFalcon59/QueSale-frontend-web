import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, Trash2, CheckCircle2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatPrice } from '../../lib/utils';
import { resolveAssetUrl } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

interface PostCardProps {
  post: any;
  onLike?: (postId: number) => void;
  onDelete?: (postId: number) => void;
  onComment?: (postId: number, content: string) => void;
  onShare?: (content: string) => void;
  onDeleteComment?: (commentId: number) => void;
  showDelete?: boolean;
  canDeleteComment?: (comment: any) => boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onDelete, onComment, onShare, onDeleteComment, showDelete, canDeleteComment }) => {
  const { user } = useAuth();
  const [expandedComment, setExpandedComment] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onComment?.(post.id_post, commentText);
    setCommentText('');
    setExpandedComment(false);
  };

  return (
    <div className="p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[4rem] bg-white border border-outline-variant hover:border-primary/20 transition-all space-y-6 lg:space-y-8 group">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 lg:gap-5">
          <div className="relative">
            <img
              src={resolveAssetUrl(post.author_photo_url) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id_user}`}
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-surface-container-high object-cover"
              alt="Avatar"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-primary border-4 border-white flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          </div>
          <div>
            <h4 className="text-base lg:text-lg font-black italic tracking-tight">{post.author}</h4>
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
            "bg-surface-container-high text-on-surface-variant border-transparent"
          )}>
            {post.type}
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
              <div className="rounded-xl overflow-hidden max-h-96 bg-black/5">
                <img src={gifMatch[1]} alt="GIF" className="w-full h-full object-contain mx-auto" />
              </div>
            )}
            {mediaList.length > 0 && !gifMatch && (
              <div className={cn("grid gap-3", mediaList.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                {mediaList.map((url: string, i: number) => (
                  <div key={i} className="rounded-xl overflow-hidden max-h-96 bg-black/5">
                    <img src={resolveAssetUrl(url) || url} alt="" className="w-full h-full object-contain mx-auto" />
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}

      <div className="flex gap-4 lg:gap-8 pt-6 lg:pt-8 border-t border-outline-variant/30">
        <button
          onClick={() => {
            if (!user) return document.dispatchEvent(new CustomEvent('show-login-prompt'));
            onLike?.(post.id_post);
          }}
          className="flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all"
        >
          <ThumbsUp className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
          {post.likes_count > 0 ? post.likes_count : 'Me gusta'}
        </button>
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

      {post.comments?.length > 0 && (
        <div className="space-y-4 pt-4 ml-6 lg:ml-10 border-l-2 border-outline-variant/30 pl-6">
          {post.comments.map((comment: any) => (
            <div key={comment.id_comment} className="flex items-start gap-3 group/comment">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black italic">{comment.author}</span>
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
