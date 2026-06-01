import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2 } from 'lucide-react';

const GIPHY_API_KEY = 'CjwvLtlYWtN0HUGwpJ9DfsKB9Pm1ZKHB';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ onSelect, onClose }) => {
  const [gifs, setGifs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const fetchGifs = async (query: string) => {
    setLoading(true);
    setSearching(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=pg-13`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=pg-13`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchGifs('');
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGifs(value);
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant overflow-hidden z-50"
    >
      <div className="flex items-center justify-between p-3 border-b border-outline-variant">
        <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">GIFs</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <div className="p-2 border-b border-outline-variant">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar GIFs..."
            className="w-full bg-surface-container-low rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
      </div>

      <div className="h-72 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-primary/50" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-on-surface-variant font-medium">
            No se encontraron GIFs
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <motion.button
                key={gif.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className="rounded-xl overflow-hidden cursor-pointer bg-surface-container-low aspect-square"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title || 'GIF'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-outline-variant text-center">
        <span className="text-[9px] text-on-surface-variant/50 font-medium">Powered by GIPHY</span>
      </div>
    </motion.div>
  );
};
