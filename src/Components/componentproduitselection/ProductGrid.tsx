import React, { useState } from 'react'; // Importe React et useState.
import { Check } from 'lucide-react'; // Importe une icône de coche.
import defaultImage from './images/riz.png'; // Image par défaut pour les produits.
import { useDeliveryStore } from '../../Modules/Delivery/Clients/composantclient/deliveryStore';// Store Zustand pour la gestion des livraisons.
import  { Conditioning } from  './../../Modules/Delivery/NewDelivery';
import { useTranslation } from 'react-i18next';

// Interfaces pour la structure des données Product et les props du ProductGrid.
interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  quantite_livreur: number; 
  selected: boolean;
  image?: string | null;
  conditionnements?: Conditioning[]; 
}

interface ProductGridProps {
  products: Product[]; 
  selectedProducts: string[]; 
  toggleProductSelection: (productId: string) => void; 
  currentPage: number; // Page actuelle de la pagination.
  setCurrentPage: (page: number) => void; // Fonction pour changer la page.
  itemsPerPage: number; // Nombre d'éléments par page.
}

// Définition du composant fonctionnel ProductGrid.
const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  selectedProducts,
  toggleProductSelection,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => {
  const { t } = useTranslation();
  const { addProduct } = useDeliveryStore(); // Action pour ajouter un produit à la livraison dans le store Zustand.
  const [message, setMessage] = useState<string | null>(null); // État pour les messages d'erreur/succès

  // Gère le clic sur un produit individuel.
  const handleProductClick = (product: Product) => {
    // Vérification si le produit est en rupture de stock
    if (product.quantite_livreur === 0) {
      setMessage(t('delivery.productSelection.outOfStockMsg1', { name: product.name }));
      return; // Sort de la fonction sans rien faire
    }

    toggleProductSelection(product.id); // Met à jour l'état de sélection local.
    // Si le produit n'était pas déjà sélectionné, l'ajoute au deliveryStore.
    if (!selectedProducts.includes(product.id)) {
      addProduct({
        produit_id: product.id,
        nom: product.name,
        prix: product.price,
        quantite_livreur_initiale: product.quantite_livreur, // Stock initial du magasin.
        conditionnements: product.conditionnements, // Passe les conditionnements
        // quantite est mis à 0 ici, puis initialisé à 1 dans le store Zustand `addProduct`.
      });//quantite_magasin_initiale
      setMessage(t('delivery.productSelection.addedToSelection', { name: product.name }));
    } else {
      setMessage(null); // Efface le message si on désélectionne
    }
  };

  // Logique de pagination
  const totalPages = Math.ceil(products.length / itemsPerPage); 
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage, // Indice de début pour la page actuelle.
    currentPage * itemsPerPage // Indice de fin pour la page actuelle.
  );

  // Rendu principal du composant.
  return (
    <div className="w-full">
      {/* Affichage des messages */}
      {message && (
        <div className="mb-4 px-4 py-2 bg-blue-100 border border-blue-300 text-blue-700 rounded text-center">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-screen-xl mx-auto px-4 py-4">
        {paginatedProducts.map((product) => {
          // Variable de contrôle pour les produits en rupture de stock
          const isOutOfStock = product.quantite_livreur === 0;
          const isSelected = selectedProducts.includes(product.id);

          return (
            <div
              key={product.id} // Clé unique pour chaque élément de la liste.
              className={`border ${
                isSelected // Applique des styles différents si le produit est sélectionné.
                  ? 'border-[#0F172A] bg-slate-50'
                  : 'border-slate-200'
              } rounded-lg p-3 sm:p-4 flex items-start sm:items-center relative ${
                isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } w-full transition duration-300 hover:shadow-md -ml-3`}
              onClick={() => !isOutOfStock && handleProductClick(product)} // Bloque le clic si en rupture
            >
              <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
                <div
                  className={`${
                    isSelected ? 'bg-[#0F172A]' : isOutOfStock ? 'bg-gray-400' : 'bg-gray-300'
                  } rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center`}
                >
                  <Check size={14} className="text-white" /> {/* Icône de coche. */}
                </div>
              </div>
              <div className="mr-3 sm:mr-4 flex-shrink-0">
                <div className="bg-pink-200 p-1 sm:p-2 rounded-lg w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <img
                    src={product.image || defaultImage} // Affiche l'image du produit ou une image par défaut.
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
              <div className="flex-grow min-w-0">
                <div className="text-xs sm:text-sm leading-tight">{product.name}</div>
                <div className="flex flex-col sm:flex-row justify-between items-baseline mt-1 sm:mt-2 gap-1">
                  <div className="text-[#0F172A] font-bold text-sm sm:text-base">
                    {t('delivery.productSelection.stock')} {product.quantite_livreur} {/* Affiche la quantité en stock. */}
                  </div>
                  <div className="font-bold text-sm sm:text-base">
                    {product.price.toLocaleString()} {t('delivery.productSelection.currency')} {/* Affiche le prix. */}
                  </div>
                </div>
                {/* Indicateur visuel pour les produits en rupture */}
                {isOutOfStock && (
                  <div className="text-xs text-red-500 text-center mt-2">
                    {t('delivery.productSelection.outOfStockMsg2')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Contrôles de pagination */}
      {totalPages > 1 && ( // Affiche les contrôles seulement s'il y a plus d'une page.
        <div className="flex justify-center mt-6 gap-4">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1} // Désactive si sur la première page.
            className="px-4 py-2 rounded bg-[#0F172A] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('delivery.productSelection.prev')}
          </button>
          <span className="px-2 py-2 font-medium">
            {t('delivery.productSelection.page')} {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages} // Désactive si sur la dernière page.
            className="px-4 py-2 rounded bg-[#0F172A] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('delivery.productSelection.next')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;


