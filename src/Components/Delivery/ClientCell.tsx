// Fichier: components/ClientCell.tsx
import React from 'react';
import { ClientCellProps } from './types';

export const ClientCell: React.FC<ClientCellProps> = ({ initials, name }) => (
  <div className="flex items-center">
    <div className="flex-shrink-0 h-8 w-8 rounded bg-green-100 flex items-center justify-center text-green-800">
      {initials}
    </div>
    <div className="ml-4">
      <div className="text-sm font-medium text-gray-900">{name}</div>
    </div>
  </div>
);


