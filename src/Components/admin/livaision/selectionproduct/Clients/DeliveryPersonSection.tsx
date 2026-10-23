import React from 'react';

export const DeliveryPersonSection: React.FC = () => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <label className="block text-gray-700 font-medium">Livreur <span className="text-red-500">*</span></label>
      </div>
      <p className="text-sm text-gray-500 mb-2">Sélectionnez le livreur</p>
      <input 
        type="text" 
        placeholder="Commencez à écrire le nom du livreur" 
        className="w-full px-4 py-2 border rounded-md text-gray-700"
      />
    </div>
  );
};



