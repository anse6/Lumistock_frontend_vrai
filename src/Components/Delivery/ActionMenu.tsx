// Fichier: components/ActionMenu.tsx (horizontal)
import React from 'react';
import { ActionMenuProps } from './types';

export const ActionMenu: React.FC<ActionMenuProps> = ({ orderId, isOpen, onAction }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-6 mt-1 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
      <div className="flex flex-row gap-2 px-2 py-2" role="menu" aria-orientation="horizontal">
        <button
          onClick={() => onAction('afficher', orderId)}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border rounded"
          role="menuitem"
        >
          Afficher
        </button>
        <button
          onClick={() => onAction('modifier', orderId)}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border rounded"
          role="menuitem"
        >
          Modifier
        </button>
        <button
          onClick={() => onAction('annuler', orderId)}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border rounded"
          role="menuitem"
        >
          Annuler
        </button>
        <button
          onClick={() => onAction('supprimer', orderId)}
          className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border rounded"
          role="menuitem"
        >
          Supprimer
        </button>
     </div>
    </div>
  );
};



