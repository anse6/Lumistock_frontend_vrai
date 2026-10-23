import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

type DeliveryStatus = 'actif';

// Interface pour une livraison
interface Delivery {
  id: string;
  clientInitials: string;
  Magazin: string;
  clientInitial: string;
  NometPrenom: string;
  Adressemail: string;
  address: string;
  Role: string;
 Numero: number;
  Date: Date;
  status: DeliveryStatus;
}

const RecentUsers = () => {
  const [deliveries] = useState<Delivery[]>([
    {
      id: '175656',
      clientInitials: 'SA',
      Magazin: 'CIMENCAM',
      clientInitial: 'SA',
      NometPrenom: 'Steve Adam',
      Adressemail: 'yaounde',
      address: 'ansevernel@gmail.com',      
      Role: 'Livreur',
      Numero: 123456789,
      Date: new Date(),
      status: 'actif',
    },
    {
      id: '175657',
      clientInitials: 'JB',
      Magazin: 'CIMENCAM',
      clientInitial: 'JB',
      NometPrenom: 'Jean Bernard',
      Adressemail: 'douala',
      address: 'jeanb@gmail.com',      
      Role: 'Manager',
            Numero: 123456789,
      Date: new Date(),
      status: 'actif',
    },
    {
      id: '175658',
      clientInitials: 'MC',
      Magazin: 'CIMENCAM',
      clientInitial: 'MC',
      NometPrenom: 'Marie Claire',
      Adressemail: 'yaounde',
      address: 'mariec@gmail.com',      
      Role: 'Livreur',
      Numero: 123456789,
      Date: new Date(),
      status: 'actif',
    },
    {
      id: '175659',
      clientInitials: 'PD',
      Magazin: 'CIMENCAM',
      clientInitial: 'PD',
      NometPrenom: 'Paul Didier',
      Adressemail: 'bafoussam',
      address: 'pauld@gmail.com',      
      Role: 'Superviseur',
      Numero: 123456789,
      Date: new Date(),
      status: 'actif',
    },
  ]);

  const getDeliveryStatusClasses = (status: DeliveryStatus) => {
    switch (status) {
      case 'actif':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 bg-white rounded-[10px] font-['Laura']">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Utilisateurs récents</h2>
        <a href="#" className="text-[#0F172A] flex items-center text-sm hover:underline">
          Accéder à la page de livraison
          <ChevronRight className="ml-1 h-4 w-4" />
        </a>
      </div>

      {/* Table View with Horizontal Scroll */}
      <div className="border border-gray-200 rounded-[10px] overflow-x-auto">
        <table className="w-full min-w-[800px]">
          {/* Table Header */}
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 whitespace-nowrap">Commande ID</th>
              <th className="px-3 py-3 whitespace-nowrap">Magasin</th>
              <th className="px-3 py-3 whitespace-nowrap">Nom et Prénom</th>
              <th className="px-3 py-3 whitespace-nowrap">Adresse mail</th>
              <th className="px-3 py-3 whitespace-nowrap">Adresse</th>
              <th className="px-3 py-3 whitespace-nowrap">Rôle</th>
              <th className="px-3 py-3 whitespace-nowrap">Numéro</th>
              <th className="px-3 py-3 whitespace-nowrap">Crée le</th>
              <th className="px-3 py-3 whitespace-nowrap">Statut</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200 bg-white">
            {deliveries.map((delivery, index) => (
              <tr key={index}>
                <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {delivery.id}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {delivery.Magazin}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="bg-green-100 text-green-800 w-8 h-8 rounded-md flex items-center justify-center mr-2 font-bold text-sm">
                      {delivery.clientInitials}
                    </div>
                    <span className="text-sm text-gray-600">{delivery.NometPrenom}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {delivery.Adressemail}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {delivery.address}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {delivery.Role}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {/* Ajoutez le numéro ici si disponible */}
                     {delivery.Numero}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatDate(delivery.Date)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-md text-xs ${getDeliveryStatusClasses(delivery.status)}`}>
                    {delivery.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentUsers;


