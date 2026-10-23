import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import StatCard from './StatsCard';
import type { StatCardProps } from './StatsCard';

type StatsCarouselProps = {
  stats: StatCardProps[];
};

const StatsCarousel: React.FC<StatsCarouselProps> = ({ stats }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const goToSlide = (index: number) => {
    if (index < 0) {
      setCurrentSlide(stats.length - 1);
    } else if (index >= stats.length) {
      setCurrentSlide(0);
    } else {
      setCurrentSlide(index);
    }
  };

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: currentSlide * carouselRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  }, [currentSlide]);

  return (
    <div className="relative">
      <div
        ref={carouselRef}
        className="flex overflow-hidden snap-x snap-mandatory scroll-smooth space-x-2 xs:space-x-3 sm:space-x-4"
      >
        {stats.map((stat, index) => (
          <div key={index} className="w-full flex-shrink-0 snap-center px-0.5 xs:px-1">
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Boutons de navigation ultra-compacts */}
      <button
        onClick={() => goToSlide(currentSlide - 1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 xs:-translate-x-2 bg-white rounded-full p-0.5 xs:p-1 shadow-md hover:shadow-lg transition-shadow"
        aria-label="Précédent"
      >
        <ChevronLeft size={14} className="xs:w-5 xs:h-5" />
      </button>

      <button
        onClick={() => goToSlide(currentSlide + 1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 xs:translate-x-2 bg-white rounded-full p-0.5 xs:p-1 shadow-md hover:shadow-lg transition-shadow"
        aria-label="Suivant"
      >
        <ChevronRight size={14} className="xs:w-5 xs:h-5" />
      </button>

      {/* Indicateurs de pagination ultra-compacts */}
      <div className="flex justify-center mt-2 xs:mt-3 sm:mt-4 space-x-1 xs:space-x-1.5 sm:space-x-2">
        {stats.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full transition-colors ${
              currentSlide === index ? 'bg-blue-500' : 'bg-gray-300'
            } hover:bg-blue-400`}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default StatsCarousel;


