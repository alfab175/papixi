import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from './ContentCard';
import { DBMovie, DBCartoon } from '../services/localDB';

type ContentItem = DBMovie | DBCartoon;

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  type: 'movie' | 'cartoon';
  onItemClick: (item: ContentItem) => void;
  onToggleList: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  myList: string[];
  userRatings: Record<string, number>;
  grid?: boolean;
}

export default function ContentRow({ title, items, type, onItemClick, onToggleList, onRate, myList, userRatings, grid }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="py-6 px-4 md:px-8">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4">{title}</h2>

      {grid ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              type={type}
              onItemClick={onItemClick as (item: ContentItem) => void}
              onToggleList={onToggleList}
              onRate={onRate}
              isInList={myList.includes(item.id)}
              userRating={userRatings[item.id] || 0}
            />
          ))}
        </div>
      ) : (
        <div className="relative group/row">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 hover:bg-black border border-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity -translate-x-4 hover:-translate-x-5 duration-200"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Scroll Container */}
          <div
            ref={rowRef}
            className="flex gap-3 overflow-x-auto pb-8 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map(item => (
              <ContentCard
                key={item.id}
                item={item}
                type={type}
                onItemClick={onItemClick as (item: ContentItem) => void}
                onToggleList={onToggleList}
                onRate={onRate}
                isInList={myList.includes(item.id)}
                userRating={userRatings[item.id] || 0}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 hover:bg-black border border-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity translate-x-4 hover:translate-x-5 duration-200"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
