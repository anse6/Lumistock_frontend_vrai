import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TableHeaderProps {
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: string) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ sortColumn, sortDirection, handleSort }) => {
  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Nom du client' },
    { id: 'registeredBy', label: 'Qui l\'a enregistré' },
    { id: 'number', label: 'Numéro' },
    { id: 'location', label: 'Emplacement' },
    { id: 'order', label: 'Commande' },
    { id: 'amount', label: 'Montant dépensé' },
    { id: 'date', label: 'Date de création' },
    { id: 'action', label: 'Action' }
  ];

  return (
    <thead className="bg-gray-100 ">
      <tr>
        {columns.map((column) => (
          <th
            key={column.id}
            scope="col"
            className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => column.id !== 'action' && handleSort(column.id)}
          >
            <div className="flex items-center">
              {column.label}
              {sortColumn === column.id && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? (
                    <ChevronUp className="h-2 w-2" />
                  ) : (
                    <ChevronDown className="h-2 w-2" />
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;


