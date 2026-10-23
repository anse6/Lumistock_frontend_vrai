import React from 'react';
import { useProductStore } from '../../../Components/componentproduitselection/stores/useProductStore';
import { useTranslation } from 'react-i18next';

export const TotalSection: React.FC = () => {
  const { t } = useTranslation();
  const { totalAmount, selectedProducts } = useProductStore();

  const totalItems = selectedProducts.length;
  const totalQuantity = selectedProducts.reduce((sum, product) => {
    let q = Number(product.quantity) || 0;
    if (product.conditionconfig) {
      product.conditionconfig.forEach(cc => {
        q += (Number(cc.conditionedQuantity) || 0) * (cc.selectedConditioning?.facteur || 1);
      });
    }
    return sum + q;
  }, 0);
  
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex justify-between items-center text-gray-600">
        <span className="text-sm font-medium">{t('delivery.newDelivery.itemsSelected', { count: totalItems })}</span>
        <span className="font-semibold text-[#0F172A]">{totalItems}</span>
      </div>
      <div className="flex justify-between items-center text-gray-600">
        <span className="text-sm font-medium">{t('reports.print.totalQuantity')}:</span>
        <span className="font-semibold text-[#0F172A]">{totalQuantity}</span>
      </div>
      <div className="flex justify-between items-center mt-2 pt-3 border-t border-dashed border-gray-200">
        <div className="text-lg font-bold text-gray-800">{t('delivery.deliveryConfig.totalLabel')}:</div>
        <div className="text-xl font-extrabold text-[#0F172A]">
          {(totalAmount || 0).toLocaleString()} <span className="text-sm ml-1 font-bold">FCFA</span>
        </div>
      </div>
    </div>
  );
};

