import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TableHeaderProps {
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: string) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  sortColumn,
  sortDirection,
  handleSort,
}) => {
  const { t } = useTranslation();

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
      <ChevronUp className="h-4 w-4 text-[#3b0764]" />
    ) : (
      <ChevronDown className="h-4 w-4 text-[#3b0764]" />
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

    const minWidth = column === 'nom' ? 'min-w-[150px]' : 'min-w-[120px]';

    return (
      <th
        onClick={() => handleSort(column)}
        className={`px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm text-gray-600 cursor-pointer hover:bg-gray-100 select-none rounded-[10px] ${minWidth} ${stickyStyle}`}
      >
        <div className="flex items-center justify-between">
          <span>{label}</span>
          {getSortIcon(column)}
        </div>
      </th>
    );
  };

  return (
    <thead className="sticky top-0 z-20 bg-gray-50 border-t border-b border-gray-200 rounded-[10px]">
      <tr className="text-left text-gray-600">
        {renderSortableTh(t('admin.customers.columns.id'), 'client_id', 0)}
        {renderSortableTh(t('admin.customers.columns.name'), 'nom', 120)}
        {renderSortableTh(t('admin.customers.columns.phone'), 'telephone')}
        {renderSortableTh(t('admin.customers.columns.address'), 'quartier')}
        {renderSortableTh(t('admin.customers.columns.deliveries'), 'nombre_livraisons')}
        {renderSortableTh(t('admin.customers.columns.amount'), 'montant_total')}
        {renderSortableTh(t('admin.customers.columns.date'), 'created_at')}
        <th className="px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm min-w-[120px] text-gray-600">
          <span className="capitalize">{t('admin.customers.columns.actions')}</span>
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;



