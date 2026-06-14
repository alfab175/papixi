import { Play, Plus, Check, Star } from 'lucide-react';
import { DBMovie, DBCartoon } from '../services/localDB';
import { PromoBadge } from './ui';

interface HeroProps {
  item: DBMovie | DBCartoon;
  isMovie: boolean;
  onPlay: () => void;
  onAddToList: () => void;
  isInList: boolean;
}

export default function Hero({ item, isMovie, onPlay, onAddToList, isInList }: HeroProps) {
  const poster = isMovie ? (item as DBMovie).posterUrl : (item as DBCartoon).coverUrl;
  const rating = item.rating;
  const typeLabel = isMovie
    ? ((item as DBMovie).type === 'movie' ? 'Film' : 'Dizi')
    : (item as DBCartoon).category;

  return (
    <div className="relative w-full min-h-[82vh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        {poster ? (
          <img src={poster} alt={item.title} className="w-full h-full object-cover object-center scale-[1.02]" style={{ filter: 'brightness(0.38) saturate(1.05)' }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000 6%, rgba(0,0,0,0.2) 38%, transparent 72%), linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.70) 28%, rgba(0,0,0,0.22) 58%, transparent 78%)' }} />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
      </div>

      <div className="relative z-10 px-6 md:px-16 pb-20 pt-28 max-w-3xl">
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-extrabold px-3 py-1.5 rounded-full border border-red-600/60 text-red-400 uppercase tracking-[0.25em] bg-black/30 backdrop-blur-sm">
            {typeLabel}
          </span>
          <PromoBadge />
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] mb-4 tracking-tight">
          {item.title}
        </h1>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {rating > 0 && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-4 h-4 fill-yellow-400" />
              <span className="text-sm font-bold">{rating}</span>
            </div>
          )}
          {isMovie && (item as DBMovie).year && (
            <span className="text-gray-400 text-sm">{(item as DBMovie).year}</span>
          )}
          {isMovie && (item as DBMovie).genre?.length > 0 && (
            <span className="text-gray-400 text-sm">{(item as DBMovie).genre.slice(0, 2).join(' · ')}</span>
          )}
          {!isMovie && (item as DBCartoon).pages?.length > 0 && (
            <span className="text-gray-400 text-sm">{(item as DBCartoon).pages.length} sayfa</span>
          )}
        </div>

        {item.description && (
          <p className="text-gray-200 text-sm md:text-lg leading-relaxed mb-8 line-clamp-3 max-w-2xl drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onPlay}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-white text-sm md:text-base transition-all hover:scale-105 active:scale-95 shadow-[0_12px_35px_rgba(229,9,20,0.35)]"
            style={{ background: 'linear-gradient(135deg, #ff0000, #c5000f)' }}>
            <Play className="w-5 h-5 fill-white" />
            {isMovie ? 'Oynat' : 'Oku'}
          </button>
          <button onClick={onAddToList}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm md:text-base transition-all border backdrop-blur-sm ${isInList ? 'border-red-600 bg-red-600/20 text-red-300' : 'border-gray-500 bg-white/10 text-white hover:border-gray-300 hover:bg-white/15'}`}>
            {isInList ? <><Check className="w-4 h-4" /> Listemde</> : <><Plus className="w-4 h-4" /> Listeme Ekle</>}
          </button>
        </div>
      </div>
    </div>
  );
}
