import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface PaginationProps {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({ totalItems }) => {
  const totalPages = Math.ceil(totalItems / 10); // 10 items par page

  return (
    <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between border-t border-gray-200">
      <div className="text-sm text-gray-500  mb-2 md:mb-0">
        Résultat de 1 à {Math.min(10, totalItems)} sur {totalItems} éléments
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="p-1 rounded flex items-center text-gray-600 bg-purple">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs mr-1">Précédent</span>
        </button>
        {/* <button className="w-8 h-8 flex items-center justify-center rounded border border-[#0F172A] text-black">
          1
        </button> */}
        {/* <button className="w-8 h-8 flex items-center justify-center rounded border text-gray-600">
          2
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded border text-gray-600">
          3
        </button> */}
        <span className="text-gray-500">...</span>
        <button className="w-8 h-8 flex items-center justify-center rounded border text-gray-600">
          {totalPages}
        </button>
        <button className="p-1 rounded flex items-center text-gray-600">
          <span className="text-xs ml-1">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;


