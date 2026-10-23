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
    <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between border-t border-gray-200">
      <div className="text-sm text-gray-500 mb-2 md:mb-0">
        Résultat de {startItem} à {endItem} sur {totalItems} éléments
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button 
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`p-1 rounded flex items-center ${currentPage === 1 ? 'text-gray-400' : 'text-gray-600'}`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs mr-1">Précédent</span>
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded border ${
              page === currentPage 
                ? 'border-[#0F172A] text-black' 
                : 'border-gray-300 text-gray-600'
            }`}
          >
            {page}
          </button>
        ))}

        {totalPages > maxVisiblePages && currentPage < totalPages - Math.floor(maxVisiblePages / 2) && (
          <span className="text-gray-500">...</span>
        )}

        {totalPages > maxVisiblePages && !getPageNumbers().includes(totalPages) && (
          <button
            onClick={() => onPageChange(totalPages)}
            className={`w-8 h-8 flex items-center justify-center rounded border ${
              totalPages === currentPage 
                ? 'border-[#0F172A] text-black' 
                : 'border-gray-300 text-gray-600'
            }`}
          >
            {totalPages}
          </button>
        )}

        <button 
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`p-1 rounded flex items-center ${currentPage === totalPages ? 'text-gray-400' : 'text-gray-600'}`}
        >
          <span className="text-xs ml-1">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;


