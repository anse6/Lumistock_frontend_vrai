import React from 'react';
import { useTranslation } from 'react-i18next';
//import {  Edit, Trash2 } from 'lucide-react';

interface Client {
  client_id: string;
  nombre_livraisons: number;
  montant_total: number;
  nom: string;
  telephone: string;
  quartier: string;
  ville: string;
  photo_profil: string;
  created_at: {
    $date: string;
  };
}

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ 
  isOpen, 
  onClose, 
  client, 
  onEdit, 
  onDelete 
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-white ring-opacity-5 z-10">
      <div className="py-1" role="menu" aria-orientation="vertical">
        {/* <button
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          role="menuitem"
          onClick={() => {
            alert(`Afficher détail du client ${client.nom}`);
            onClose();
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Afficher détail
        </button> */}
        <button
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          role="menuitem"
          onClick={() => {
            onEdit(client);
            onClose();
          }}
        >
          
          {t('admin.customers.table.edit')}
        </button>
        <button
          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
          role="menuitem"
          onClick={() => {
            onDelete(client);
            onClose();
          }}
        >
         
          {t('admin.customers.table.delete')}
        </button>
      </div>
    </div>
  );
};

export default ActionMenu;


