import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  const { t } = useTranslation();
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCategories, setVisibleCategories] = useState(6); // Nombre de catégories visibles
  const [containerWidth, setContainerWidth] = useState(0);

  // Calcul de la largeur du conteneur
  useEffect(() => {
    const updateWidth = () => {
      if (categoriesContainerRef.current) {
        setContainerWidth(categoriesContainerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calcul du nombre de catégories visibles selon la largeur d'écran
  useEffect(() => {
    const categoryWidth = 168; // 160px + 8px de gap
    const maxVisible = Math.floor(containerWidth / categoryWidth);
    setVisibleCategories(Math.min(Math.max(maxVisible, 3), 6)); // Entre 3 et 6 catégories visibles
  }, [containerWidth]);

  const handleScroll = (scrollOffset: number) => {
    if (categoriesContainerRef.current) {
      categoriesContainerRef.current.scrollBy({
        left: scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  // Affiche les flèches si il y a plus de catégories que le nombre visible
  const showArrows = categories.length > visibleCategories;

  // Calcul de l'offset de défilement basé sur la largeur d'une catégorie
  const scrollOffset = 168 * 2; // Défile de 2 catégories à la fois

  return (
    <div className="flex items-center mb-6">
      {showArrows && (
        <button
          onClick={() => handleScroll(-scrollOffset)}
          className="mr-2 p-2 bg-white rounded-full cursor-pointer border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors"
          aria-label="Catégories précédentes"
        >
          <ChevronLeft className="text-gray-400" size={20} />
        </button>
      )}

      <div
        ref={categoriesContainerRef}
        className="flex overflow-x-auto scrollbar-hide pb-2 gap-2 flex-1"
        style={{
          // Force l'affichage de seulement le nombre de catégories voulu
          maxWidth: showArrows ? `${visibleCategories * 168}px` : 'none'
        }}
      >
        {categories.map((category, index) => (
          <div
            key={category.id}
            onClick={() => onSelectCategory(category.id === 'all' ? null : category.id)}
            className={`p-4 rounded-lg flex-shrink-0 w-40 min-h-[100px] cursor-pointer transition-all duration-200 ${
              (selectedCategory === null && category.id === 'all') ||
              selectedCategory === category.id
                ? 'bg-slate-200 border border-[#0F172A] transform scale-105'
                : 'bg-gray-100 hover:bg-slate-100 border border-gray-200 hover:transform hover:scale-102'
            }`}
            style={{
              // Animation d'apparition progressive
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="text-sm font-medium text-gray-700 mb-2 line-clamp-2">
              {category.name}
            </div>
            <div className="font-bold text-[#1E293B]">
              {category.count} {category.count > 1 ? t('delivery.productSelection.articlesPlural') : t('delivery.productSelection.articles')}
            </div>
          </div>
        ))}
      </div>

      {showArrows && (
        <button
          onClick={() => handleScroll(scrollOffset)}
          className="ml-2 p-2 bg-white rounded-full cursor-pointer border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors"
          aria-label="Catégories suivantes"
        >
          <ChevronRight className="text-gray-400" size={20} />
        </button>
      )}

      {/* Indicateur de position (optionnel) */}
      {showArrows && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-1 mt-2">
          {/* {Array.from({ length: Math.ceil(categories.length / visibleCategories) }).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-gray-300"
            />
          ))} */}
        </div>
      )}
    </div>
  );
};

export default CategoryCarousel;


