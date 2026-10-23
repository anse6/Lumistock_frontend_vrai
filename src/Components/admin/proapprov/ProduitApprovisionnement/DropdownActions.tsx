// DropdownActions.tsx
import React from 'react';
import { Eye, List, Plus, X } from 'lucide-react';

interface DropdownActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onView: () => void;
  onDetail: () => void;
  onApprovisionner: () => void;
  onCancel: () => void;
}

const DropdownActions: React.FC<DropdownActionsProps> = ({
  isOpen,
  onView,
  onDetail,
  onApprovisionner,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
      <div className="py-1">
        <button
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Voir plus
        </button>

        <button
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          onClick={(e) => {
            e.stopPropagation();
            onDetail();
          }}
        >
          <List className="mr-2 h-4 w-4" />
          Afficher détail
        </button>

        <button
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          onClick={(e) => {
            e.stopPropagation();
            onApprovisionner();
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Approvisionner
        </button>

        <button
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Annuler
        </button>
      </div>
    </div>
  );
};

export default DropdownActions;


