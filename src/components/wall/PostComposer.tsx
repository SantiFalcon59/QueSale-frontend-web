import React, { useState, useRef } from 'react';
import { MessageSquare, Info, ThumbsUp, ImageIcon, X, Loader2, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { resolveAssetUrl, api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { GifPicker } from '../post/GifPicker';
import { motion, AnimatePresence } from 'motion/react';

const GridIcon = (props: any) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

interface PostComposerProps {
  placeholder?: string;
  onSubmit: (content: string, type?: string, media?: string[], pollOptions?: string[]) => void;
}

const PostComposer: React.FC<PostComposerProps> = ({ placeholder = '¿Qué tienes en mente?', onSubmit }) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<string>('comment');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    setContent(before + text + after);
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadPostMedia(file);
      if (url) setUploadedImages(prev => [...prev, url]);
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if ((!content.trim() && !selectedGif && uploadedImages.length === 0) || !user) return;
    const media = [...uploadedImages];
    if (selectedGif) media.push(selectedGif);
    const finalContent = selectedGif
      ? `${content.trim()}\n[GIF:${selectedGif}]`
      : content.trim();
    onSubmit(finalContent, postType, media.length > 0 ? media : undefined, postType === 'poll' ? pollOptions.filter(o => o.trim()) : undefined);
    setContent('');
    setPostType('comment');
    setSelectedGif(null);
    setUploadedImages([]);
    setPollOptions(['', '']);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const url = await api.uploadPostMedia(file);
      if (url) setUploadedImages(prev => [...prev, url]);
    } catch (err) {
      console.error('Error uploading dropped image:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] bg-surface-container-low border border-outline-variant space-y-6"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {uploading && (
        <div className="flex items-center justify-center gap-3 py-3 text-primary">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Subiendo imagen...</span>
        </div>
      )}
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
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => { if (!user) document.dispatchEvent(new CustomEvent('show-login-prompt')); }}
            placeholder={placeholder}
            className="w-full bg-transparent border-none outline-none text-base lg:text-xl font-medium placeholder:text-on-surface-variant/40 resize-none min-h-[80px] lg:min-h-[100px] pt-1"
          />
          {selectedGif && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 relative rounded-xl overflow-hidden max-h-48 bg-black/5"
            >
              <img src={selectedGif} alt="Selected GIF" className="max-h-48 object-cover mx-auto" />
              <button
                type="button"
                onClick={() => setSelectedGif(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {uploadedImages.map((url, idx) => (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-high"
                >
                  <img src={resolveAssetUrl(url) || url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
          {postType === 'poll' && (
            <div className="space-y-2 pl-2 border-l-2 border-purple-300/50">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 w-6">{idx + 1}.</span>
                  <input
                    value={opt}
                    onChange={e => {
                      const next = [...pollOptions];
                      next[idx] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Opción ${idx + 1}`}
                    className="flex-1 h-10 px-4 rounded-xl bg-surface-container-low text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-purple-400/40 transition-all"
                  />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 10 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="text-xs text-purple-500 font-bold hover:text-purple-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Agregar opción
                </button>
              )}
            </div>
          )}
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
        <div className="flex items-center gap-1 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
              className="p-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
            >
              😊
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant hover:text-primary"
            title="Adjuntar imagen"
          >
            <ImageIcon size={18} />
          </button>
        </div>
        <button
          disabled={!content.trim() && !selectedGif && uploadedImages.length === 0}
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
