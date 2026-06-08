import React, { useState } from 'react';
import { MessageSquare, Info, ThumbsUp, ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { resolveAssetUrl } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

const GridIcon = (props: any) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

interface PostComposerProps {
  placeholder?: string;
  onSubmit: (content: string, type?: string) => void;
}

const PostComposer: React.FC<PostComposerProps> = ({ placeholder = '¿Qué tienes en mente?', onSubmit }) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<string>('comment');

  const handleSubmit = () => {
    if (!content.trim() || !user) return;
    onSubmit(content, postType);
    setContent('');
    setPostType('comment');
  };

  return (
    <div className="p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] bg-surface-container-low border border-outline-variant space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
        <div className="flex items-center gap-4 sm:block sm:gap-0">
          <img
            src={profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`}
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-surface-container-high ring-4 ring-white shadow-lg object-cover"
            alt="Me"
          />
          <h4 className="sm:hidden font-bold">{profile?.displayName || 'Tú'}</h4>
        </div>
        <div className="flex-1 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => { if (!user) document.dispatchEvent(new CustomEvent('show-login-prompt')); }}
            placeholder={placeholder}
            className="w-full bg-transparent border-none outline-none text-base lg:text-xl font-medium placeholder:text-on-surface-variant/40 resize-none min-h-[80px] lg:min-h-[100px] pt-1"
          />
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'comment', name: 'Comentario', icon: MessageSquare },
              { id: 'query', name: 'Pregunta', icon: Info },
              { id: 'poll', name: 'Encuesta', icon: GridIcon },
              { id: 'feedback', name: 'Feedback', icon: ThumbsUp }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setPostType(t.id as any)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border",
                  postType === t.id ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant hover:border-primary/30"
                )}
              >
                <t.icon size={14} />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-6 border-t border-outline-variant/30">
        <div className="flex gap-2">
          <button className="p-3 rounded-2xl bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all"><ImageIcon size={20} /></button>
        </div>
        <button
          disabled={!content.trim()}
          onClick={handleSubmit}
          className="btn-primary h-14 px-10 text-[11px] font-black uppercase tracking-widest disabled:opacity-30"
        >
          PUBLICAR
        </button>
      </div>
    </div>
  );
};

export default PostComposer;
