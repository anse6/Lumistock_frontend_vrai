import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
  totalItems, 
  itemsPerPage, 
  currentPage, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxVisiblePages = 5;

  // Si pas d'éléments, ne pas afficher la pagination
  if (totalItems === 0) return null;

  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="bg-white px-4 py-4 border-t border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Informations sur les résultats */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">
            Résultat de {startItem} à {endItem} sur {totalItems} éléments
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {/* Bouton Précédent */}
          <button 
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-1 ${
              currentPage === 1 
                ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed' 
                : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>

          {/* Numéros de page */}
          <div className="hidden sm:flex items-center gap-1">
            {/* Première page si nécessaire */}
            {getPageNumbers()[0] > 1 && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  className="w-10 h-10 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  1
                </button>
                {getPageNumbers()[0] > 2 && (
                  <span className="text-gray-400 px-1">...</span>
                )}
              </>
            )}

            {/* Pages visibles */}
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 text-sm font-medium rounded-lg border transition-colors ${
                  page === currentPage 
                    ? 'bg-[#0F172A] border-[#0F172A] text-white' 
                    : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Dernière page si nécessaire */}
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
              <>
                {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                  <span className="text-gray-400 px-1">...</span>
                )}
                <button
                  onClick={() => onPageChange(totalPages)}
                  className={`w-10 h-10 text-sm font-medium rounded-lg border transition-colors ${
                    totalPages === currentPage 
                      ? 'bg-[#0F172A] border-[#0F172A] text-white' 
                      : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Version mobile - seulement page courante */}
          <div className="sm:hidden flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </span>
          </div>

          {/* Bouton Suivant */}
          <button 
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-1 ${
              currentPage === totalPages 
                ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed' 
                : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;


