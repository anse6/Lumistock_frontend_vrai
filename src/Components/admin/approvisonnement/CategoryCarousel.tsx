import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const APP_COLOR = '#3b1558';

interface Category {
  id: string;
  name: string;
  /** Nombre de produits de la catégorie. */
  count: number;
}

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

// Barre de catégories défilante. Elle s'adapte à la largeur réelle de son
// cadre (et non à celle de la fenêtre) : les flèches n'apparaissent que si
// toutes les catégories ne tiennent pas, et se désactivent aux extrémités.
const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    updateArrows();
    // Réagit aussi aux changements du cadre (menu latéral replié, etc.).
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateArrows, categories.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  const showArrows = canScrollLeft || canScrollRight;
  const arrowClass =
    'shrink-0 p-2 rounded-[10px] border border-purple-100 bg-white shadow-sm transition-colors hover:bg-purple-50 disabled:opacity-30 disabled:cursor-default disabled:hover:bg-white';

  return (
    <div className="flex items-center gap-2 mb-4 min-w-0">
      {showArrows && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canScrollLeft}
          className={arrowClass}
          aria-label="Catégories précédentes"
        >
          <ChevronLeft size={16} style={{ color: APP_COLOR }} />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex flex-1 min-w-0 gap-2 overflow-x-auto scrollbar-hide py-1"
        role="tablist"
        aria-label="Catégories"
      >
        {categories.map((category) => {
          const isSelected =
            (selectedCategory === null && category.id === 'all') ||
            selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              title={category.name}
              onClick={() => onSelectCategory(category.id === 'all' ? null : category.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-[10px] border px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
              style={isSelected ? { backgroundColor: APP_COLOR, borderColor: APP_COLOR } : undefined}
            >
              <span className="max-w-[180px] truncate">{category.name}</span>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-900'
                }`}
              >
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {showArrows && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canScrollRight}
          className={arrowClass}
          aria-label="Catégories suivantes"
        >
          <ChevronRight size={16} style={{ color: APP_COLOR }} />
        </button>
      )}
    </div>
  );
};

export default CategoryCarousel;
