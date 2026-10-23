import React from 'react';
import { useTranslation } from 'react-i18next';

export const DeliveryPersonSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <label className="block text-gray-700 font-medium">{t('delivery.deliveryConfig.deliveryPersonLabel')} <span className="text-red-500">*</span></label>
      </div>
      <p className="text-sm text-gray-500 mb-2">{t('delivery.deliveryConfig.deliveryPersonSubtitle')}</p>
      <input 
        type="text" 
        placeholder={t('delivery.deliveryConfig.deliveryPersonPlaceholder')}
        className="w-full px-4 py-2 border rounded-md text-gray-700"
      />
    </div>
  );
};



