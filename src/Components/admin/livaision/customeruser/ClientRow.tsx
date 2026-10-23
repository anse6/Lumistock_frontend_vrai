import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

interface user {
  id: string;
  initials: string;
  name: string;
  registeredBy: string;
  registeredByName: string;
  number: string;
  location: string;
  order: string;
  amount: string;
  date: string;
}

interface ClientRowProps {
  user: user;
  index: number;
}

const ClientRow: React.FC<ClientRowProps> = ({ user, index }) => {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getInitialColor = (initials: string) => {
    const colorMap: Record<string, string> = {
      'SA': 'bg-green-100 text-green-600',
      'KS': 'bg-red-100 text-red-600',
      'SD': 'bg-blue-100 text-blue-600',
      'JR': 'bg-gray-200 text-gray-600',
      'JP': 'bg-slate-100 text-[#0F172A]',
      'SP': 'bg-yellow-100 text-yellow-600',
      'BA': 'bg-blue-100 text-blue-600',
      'JS': 'bg-slate-100 text-[#0F172A]',
      'LM': 'bg-slate-100 text-[#0F172A]',
      'AC': 'bg-red-100 text-red-600',
    };
    return colorMap[initials] || 'bg-gray-200 text-gray-600';
  };

  const getRegisteredByColor = (code: string) => {
    const colorMap: Record<string, string> = {
      'FL': 'bg-teal-100 text-teal-600',
      'VS': 'bg-red-50 text-red-600',
    };
    return colorMap[code] || 'bg-gray-200 text-gray-600';
  };

  // Fermer le menu quand on clique en dehors
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
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-white'}>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`flex-shrink-0 h-8 w-8 rounded-full ${getInitialColor(user.initials)} flex items-center justify-center text-sm font-medium`}>
            {user.initials}
          </div>
          <div className="ml-4 text-sm font-medium text-gray-900">{user.name}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRegisteredByColor(user.registeredBy)}`}>
          {user.registeredBy}
        </span>
        <span className="ml-2 text-sm text-gray-500">{user.registeredByName}</span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.number}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.location}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.order}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.amount}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.date}</td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
        <button
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
          onClick={() => setActionMenuOpen(!actionMenuOpen)}
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {actionMenuOpen && (
          <div ref={menuRef} className="absolute right-0 z-20 mt-2">
            <ActionMenu 
              isOpen={actionMenuOpen} 
              onClose={() => setActionMenuOpen(false)} 
            />
          </div>
        )}
      </td>
    </tr>
  );
};

export default ClientRow;



