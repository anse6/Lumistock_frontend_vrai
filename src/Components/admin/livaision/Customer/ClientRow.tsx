import React, { useState, useEffect, useRef } from 'react'; 
import { MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ActionMenu from './ActionMenu';

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

interface ClientRowProps {
  client: Client;
  index: number;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

const ClientRow: React.FC<ClientRowProps> = ({ client, index, onEdit, onDelete }) => {
  const { i18n } = useTranslation();
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getInitialColor = (initials: string) => {
    const colors = [
      'bg-green-100 text-green-600',
      'bg-red-100 text-red-600',
      'bg-purple-100 text-purple-600',
      'bg-gray-200 text-gray-600',
      'bg-slate-100 text-[#3b0764]',
      'bg-yellow-100 text-yellow-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-orange-100 text-orange-600',
      'bg-teal-100 text-teal-600',
    ];
    
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount).replace('XOF', 'CFA');
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('237')) {
      return `+237 ${phone.slice(3, 4)}${phone.slice(4, 6)} ${phone.slice(6, 8)} ${phone.slice(8, 10)} ${phone.slice(10)}`;
    }
    return `+237 ${phone}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(false);
      }
    };

    if (actionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenuOpen]);

  return (
    <tr
      className={`${
        index % 2 === 0 ? 'bg-white' : 'bg-white'
      } hover:bg-white transition-colors duration-150 rounded-[10px]`}
    >
      <td className="px-4 py-4 w-[120px] whitespace-nowrap text-sm font-medium text-gray-900 rounded-l-[10px]">
        {client.client_id}
      </td>
      <td className="px-4 py-4 w-[150px] whitespace-nowrap rounded-[10px]">
        <div className="flex items-center">
          <div
            className={`flex-shrink-0 h-10 w-10 rounded-full ${getInitialColor(getInitials(client.nom))} flex items-center justify-center text-sm font-medium`}
          >
            {getInitials(client.nom)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{client.nom}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 w-[150px] whitespace-nowrap text-sm text-gray-500 rounded-[10px]">
        {formatPhone(client.telephone)}
      </td>
      <td className="px-4 py-4 w-[180px] whitespace-nowrap text-sm text-gray-500 rounded-[10px]">
        <div>
          <div className="font-medium">{client.quartier}</div>
          <div className="text-gray-400">{client.ville}</div>
        </div>
      </td>
      <td className="px-4 py-4 w-[120px] whitespace-nowrap text-sm text-gray-500 rounded-[10px]">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {client.nombre_livraisons}
        </span>
      </td>
      <td className="px-4 py-4 w-[130px] whitespace-nowrap text-sm font-medium text-gray-900 rounded-[10px]">
        {formatCurrency(client.montant_total)}
      </td>
      <td className="px-4 py-4 w-[160px] whitespace-nowrap text-sm text-gray-500 rounded-[10px]">
        {formatDate(client.created_at.$date)}
      </td>
      <td className="px-6 py-4 w-[100px] whitespace-nowrap text-right text-sm font-medium relative rounded-r-[10px]">
        <button
          className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-full hover:bg-gray-200 transition-colors duration-150"
          onClick={() => setActionMenuOpen(!actionMenuOpen)}
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {actionMenuOpen && (
          <div ref={menuRef} className="absolute right-0 z-20 mt-2">
            <ActionMenu 
              isOpen={actionMenuOpen} 
              onClose={() => setActionMenuOpen(false)}
              client={client}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </td>
    </tr>
  );
};

export default ClientRow;


