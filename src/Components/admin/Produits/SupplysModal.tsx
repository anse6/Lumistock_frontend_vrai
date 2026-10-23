// ./Produits/SupplyModal.tsx
import React from 'react';

interface SupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, amount: number) => void; // Modified to pass quantity and amount
  supplyName: string;
  setSupplyName: (name: string) => void;
  supplyQuantity: number; // New prop
  setSupplyQuantity: (quantity: number) => void; // New prop
  supplyAmount: number; // New prop (if you need it for the API call)
  setSupplyAmount: (amount: number) => void; // New prop
}

const SupplysModal: React.FC<SupplyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  supplyName,
  setSupplyName,
  supplyQuantity,
  setSupplyQuantity,
  supplyAmount,
  setSupplyAmount,
}) => {
  if (!isOpen) return null;

  const handleConfirmClick = () => {
    onConfirm(supplyQuantity, supplyAmount); // Pass quantity and amount
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Approvisionner le produit</h2>
        <p className="text-gray-600 mb-4">
          Voulez-vous vraiment approvisionner ce produit ? Veuillez entrer la quantité et le nom du livreur.
        </p>

        <div className="mb-4">
          <label htmlFor="supplyName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom du livreur
          </label>
          <input
            type="text"
            id="supplyName"
            value={supplyName}
            onChange={(e) => setSupplyName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
            placeholder="Ex: Jean Dupont"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="supplyQuantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantité à approvisionner
          </label>
          <input
            type="number"
            id="supplyQuantity"
            value={supplyQuantity === 0 ? '' : supplyQuantity} // Display empty if 0 for better UX
            onChange={(e) => setSupplyQuantity(parseInt(e.target.value) || 0)} // Parse to int, default to 0
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
            placeholder="Ex: 20"
            min="1"
          />
        </div>

        {/* You had 'montant' in your handleSupplyConfirm, so adding an input for it.
            If 'montant' is calculated on the backend or not needed in the modal,
            you can remove this block. */}
        <div className="mb-6">
          <label htmlFor="supplyAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Montant (facultatif)
          </label>
          <input
            type="number"
            id="supplyAmount"
            value={supplyAmount === 0 ? '' : supplyAmount} // Display empty if 0
            onChange={(e) => setSupplyAmount(parseFloat(e.target.value) || 0)} // Parse to float, default to 0
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
            placeholder="Ex: 50000"
            min="0"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirmClick}
            className="px-4 py-2 bg-[#0F172A] text-white rounded-md hover:bg-[#0F172A] transition-colors"
            disabled={supplyQuantity <= 0 || !supplyName.trim()} // Disable if quantity is 0 or less, or name is empty
          >
            Confirmer l'approvisionnement
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplysModal;


