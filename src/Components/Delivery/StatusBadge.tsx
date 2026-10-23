// Fichier: components/StatusBadge.tsx
import React from 'react';
import { StatusBadgeProps } from './types';

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const getStatusClass = () => {
    if (type === 'payment') {
      switch (status) {
        case 'Payé':
          return 'bg-slate-50 text-[#1E293B] border border-slate-200';
        case 'Non payé':
          return 'bg-red-50 text-red-700 border border-red-200';
        case 'Pas totalement':
          return 'bg-blue-50 text-blue-700 border border-blue-200';
        default:
          return 'bg-gray-50 text-gray-700 border border-gray-200';
      }
    } else {
      return 'bg-blue-50 text-blue-700';
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusClass()}`}>
      {status}
    </div>
  );
};



