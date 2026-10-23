import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
      <div className="py-1" role="menu" aria-orientation="vertical">
        <button
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          role="menuitem"
          onClick={() => {
            alert("Afficher détail");
            onClose();
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Afficher détail
        </button>
        <button
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          role="menuitem"
          onClick={() => {
            alert("Modifier");
            onClose();
          }}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </button>
        <button
          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
          role="menuitem"
          onClick={() => {
            alert("Supprimer");
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </button>
      </div>
    </div>
  );
};

export default ActionMenu;


