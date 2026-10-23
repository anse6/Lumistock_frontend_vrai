import React, { useState, useRef } from 'react';
import { Produit } from '../types';
import DropdownActions from './DropdownActions';
import { MoreVertical } from 'lucide-react';
import useOutsideClick from './hooks/useOutsideClick';

interface ProduitTableProps {
  produits: Produit[];
}

const ProduitTable: React.FC<ProduitTableProps> = ({ produits }) => {
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLTableDataCellElement>(null);

  useOutsideClick(dropdownRef, () => {
    setShowDropdown(null);
  });

  const toggleDropdown = (index: number) => {
    setShowDropdown(showDropdown === index ? null : index);
  };
  
  // Fonction pour formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price).replace('XOF', '') + 'FCFA';
  };

  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-200">
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restant</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix/Unite</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {produits.map((product, index) => (
          <tr key={product.id} className="hover:bg-gray-50">
            <td className="py-4 px-4 text-sm text-gray-700">{product.id.substring(0, 8)}...</td>
            <td className="py-4 px-4">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs">Aucune image</span>
                )}
              </div>
            </td>
            <td className="py-4 px-4 text-sm text-gray-700">{product.name}</td>
            <td className="py-4 px-4 text-sm text-gray-500 truncate max-w-xs">{product.description}</td>
            <td className="py-4 px-4">
              <span className="px-3 py-1 bg-red-50 text-red-800 text-xs rounded-full">
                {product.category}
              </span>
            </td>
            <td className="py-4 px-4 text-sm text-gray-700">
              {product.quantity} {product.unite}
            </td>
            <td className="py-4 px-4 text-sm text-gray-700">
              {product.remaining} {product.unite}
            </td>
            <td className="py-4 px-4 text-sm text-gray-700">
              {formatPrice(product.price)}/{product.unite}
            </td>
            <td className="py-4 px-4">
              <span className={`px-3 py-1 text-xs rounded-full ${
                product.status === 'En stock' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.status}
              </span>
            </td>
            <td className="py-4 px-4 relative" ref={dropdownRef}>
              <button
                className="text-gray-800 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown(index);
                }}
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              <DropdownActions
                isOpen={showDropdown === index}
                onClose={() => setShowDropdown(null)}
                onView={() => console.log('Voir', product.id)}
                onDetail={() => console.log('Détail', product.id)}
                onApprovisionner={() => console.log('Approvisionner', product.id)}
                onCancel={() => setShowDropdown(null)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProduitTable;


