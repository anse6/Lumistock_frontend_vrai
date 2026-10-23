import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, setCurrentPage }) => {
  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-b-white sm:px-6">
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Résultat de 0 à 0 sur 0 éléments
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </button>
            
            {[0, 0, 0].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 border ${
                  currentPage === page
                    ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                } text-sm font-medium cursor-pointer whitespace-nowrap`}
              >
                {page}
              </button>
            ))}
            
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              ...
            </span>
            
            <button
              onClick={() => setCurrentPage(8)}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              0
            </button>
            
            <button
              onClick={() => setCurrentPage(Math.min(8, currentPage + 1))}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;


