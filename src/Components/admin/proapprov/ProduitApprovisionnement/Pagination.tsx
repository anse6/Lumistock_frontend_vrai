import React from 'react';

const Pagination: React.FC = () => {
  return (
    <div className="flex items-center justify-between mt-6 py-4">
      <div className="text-sm text-gray-500">
        Résultat de 1 à 10 sur 32 éléments
      </div>
      <div className="flex items-center space-x-1">
        <button className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 cursor-pointer whitespace-nowrap !rounded-button">
          <i className="fas fa-chevron-left mr-1 text-xs"></i> Précédent
        </button>
        <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md text-sm bg-[#0F172A] text-white cursor-pointer !rounded-button">
          1
        </button>
        <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md text-sm text-gray-600 cursor-pointer !rounded-button">
          2
        </button>
        <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md text-sm text-gray-600 cursor-pointer !rounded-button">
          3
        </button>
        <span className="text-gray-500">...</span>
        <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md text-sm text-gray-600 cursor-pointer !rounded-button">
          8
        </button>
        <button className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 cursor-pointer whitespace-nowrap !rounded-button">
          Suivant <i className="fas fa-chevron-right ml-1 text-xs"></i>
        </button>
      </div>
    </div>
  );
};

export default Pagination;


