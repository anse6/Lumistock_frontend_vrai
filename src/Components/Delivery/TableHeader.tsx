
// Fichier: components/TableHeader.tsx
import React from 'react';
import { TableHeaderProps } from './types';

export const TableHeader: React.FC<TableHeaderProps> = ({ title, withSorting = true }) => (
  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    <div className="flex items-center">
      {title}
      {withSorting && (
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      )}
    </div>
  </th>
);



