import { useRef, useEffect, useState } from 'react';
import { Plus, Check, Star, Play, BookOpen, Film } from 'lucide-react';
import { DBMovie, DBCartoon } from '../services/localDB';
import type { ContentItem } from '../types';

interface ContentCardProps {
  item: ContentItem;
  type: 'movie' | 'cartoon';
  onItemClick: (item: ContentItem) => void;
  onToggleList: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  isInList: boolean;
  userRating: number;
}

export default function ContentCard({ item, onItemClick, onToggleList, onRate, isInList, userRating }: ContentCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const isMovieItem = 'videoUrl' in item;
  const poster = isMovieItem ? (item as DBMovie).posterUrl : (item as DBCartoon).coverUrl;
  const label = isMovieItem ? ((item as DBMovie).type === 'movie' ? 'Film' : 'Dizi') : (item as DBCartoon).category;
  const meta = isMovieItem ? `${(item as DBMovie).year} · ${(item as DBMovie).duration}dk` : `${(item as DBCartoon).pages?.length || 0} sayfa`;

  return (
    <div
      ref={ref}
      className="relative flex-shrink-0 w-40 md:w-44 cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setHoverRating(0); }}
    >
      {/* Card */}
      <div
        className={`transition-all duration-300 rounded-xl overflow-hidden ${hovered ? 'scale-110 shadow-2xl shadow-black/60 z-20 relative' : 'scale-100'}`}
        onClick={() => onItemClick(item)}
      >
        {/* Poster */}
        <div className="w-full h-60 md:h-64 bg-gray-900 relative overflow-hidden">
          {visible && poster ? (
            <img
              src={poster}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              {isMovieItem
                ? <Film className="w-10 h-10 text-gray-600" />
                : <BookOpen className="w-10 h-10 text-gray-600" />}
            </div>
          )}

          {/* Overlay on hover */}
          {hovered && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                {isMovieItem ? <Play className="w-5 h-5 text-white fill-white ml-0.5" /> : <BookOpen className="w-5 h-5 text-white" />}
              </div>
            </div>
          )}

          {/* Rating badge */}
          {item.rating > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-xs font-bold">{item.rating}</span>
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
            <span className="text-xs text-gray-300">{label}</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-900 px-3 py-2">
          <h3 className="text-white text-xs font-semibold truncate">{item.title}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{meta}</p>
        </div>
      </div>

      {/* Hover actions - shown below card */}
      {hovered && (
        <div
          className="absolute left-0 right-0 bg-gray-900 border border-gray-700 rounded-b-xl px-3 py-2.5 z-20 shadow-2xl"
          style={{ top: '100%' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleList(item.id); }}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition ${isInList ? 'border-red-600 text-red-500 bg-red-950/30' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'}`}
            >
              {isInList ? <><Check className="w-3 h-3" /> Listede</> : <><Plus className="w-3 h-3" /> Ekle</>}
            </button>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => onRate(item.id, i)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-3.5 h-3.5 transition-colors ${i <= (hoverRating || userRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
