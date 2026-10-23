import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TableHeaderProps {
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: string) => void;
}

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

const TableHeader: React.FC<TableHeaderProps> = ({
  sortColumn,
  sortDirection,
  handleSort,
}) => {
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return (
        <div className="flex flex-col">
          <ChevronUp className="h-3 w-3 text-gray-300" />
          <ChevronDown className="h-3 w-3 text-gray-300 -mt-1" />
        </div>
      );
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-[#0F172A]" />
    ) : (
      <ChevronDown className="h-4 w-4 text-[#0F172A]" />
    );
  };

  const renderSortableTh = (
    label: string,
    column: string,
    stickyPosition?: number // ex: 0, 100, etc.
  ) => {
    const stickyStyle = stickyPosition !== undefined
      ? `sticky left-[${stickyPosition}px] bg-gray-50 z-30 shadow-sm`
      : '';

    const minWidth = label === 'Nom' ? 'min-w-[150px]' : 'min-w-[120px]';

    return (
      <th
        onClick={() => handleSort(column)}
        className={`px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm text-gray-600 cursor-pointer hover:bg-gray-100 select-none rounded-[10px] ${minWidth} ${stickyStyle}`}
      >
        <div className="flex items-center justify-between">
          <span>{capitalize(label)}</span>
          {getSortIcon(column)}
        </div>
      </th>
    );
  };

  return (
    <thead className="sticky top-0 z-20 bg-gray-50 border-t border-b border-gray-200 rounded-[10px]">
      <tr className="text-left text-gray-600">
        {renderSortableTh('ID client', 'client_id', 0)}
        {renderSortableTh('Nom', 'nom', 120)} {/* position sticky après ID */}
        {renderSortableTh('Téléphone', 'telephone')}
        {renderSortableTh('Adresse', 'quartier')}
        {renderSortableTh('Livraisons', 'nombre_livraisons')}
        {renderSortableTh('Montant', 'montant_total')}
        {renderSortableTh('Date', 'created_at')}
        <th className="px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm min-w-[120px] text-gray-600">
          {capitalize('actions')}
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;



