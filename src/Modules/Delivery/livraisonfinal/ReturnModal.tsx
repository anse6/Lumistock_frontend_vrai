import React, { useState } from 'react';
import { Order } from './types';
import { useTranslation } from 'react-i18next';

interface ReturnModalProps {
  order: Order;
  onConfirm: (
    livraison_id: string,
    livreur_id: string,
    motif: string,
    produits: { produit_id: string; quantite: number; is_conditionne: boolean; conditionnement_id?: string }[]
  ) => Promise<void>;
  onCancel: () => void;
  showSuccessMessage: (message: string) => void;
  showErrorMessage: (message: string) => void;
}

const ReturnModal: React.FC<ReturnModalProps> = ({
  order,
  onConfirm,
  onCancel,
  showSuccessMessage,
  showErrorMessage,
}) => {
  const { t } = useTranslation();
  const [motif, setMotif] = useState('');
  const [returnedProducts, setReturnedProducts] = useState(
    order.produits.map(p => ({
      produit_id: (p as any).produit_id || '',
      nom: (p as any).nom || `Produit ${p}`,
      quantite: 0,
      maxQuantite: (p as any).quantite || 0,
      is_conditionne: false,
      conditionnement_id: '',
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductQuantityChange = (index: number, value: number) => {
    const updated = [...returnedProducts];
    updated[index].quantite = Math.max(0, Math.min(updated[index].maxQuantite, value));
    setReturnedProducts(updated);
  };

  const handleConditionneChange = (index: number, is_conditionne: boolean) => {
    const updated = [...returnedProducts];
    updated[index].is_conditionne = is_conditionne;
    if (!is_conditionne) {
      updated[index].conditionnement_id = '';
    }
    setReturnedProducts(updated);
  };

  const handleConditionnementIdChange = (index: number, conditionnement_id: string) => {
    const updated = [...returnedProducts];
    updated[index].conditionnement_id = conditionnement_id;
    setReturnedProducts(updated);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);

    const produits = returnedProducts
      .filter(p => p.quantite > 0)
      .map(p => ({
        produit_id: p.produit_id,
        quantite: p.quantite,
        is_conditionne: p.is_conditionne,
        conditionnement_id: p.is_conditionne ? p.conditionnement_id : undefined,
      }));

    console.log('livreur_id dans ReturnModal:', order.livreur_id);

    const livreur_id = order.livreur_id || '000000000000000000000000';

    if (!motif.trim() || produits.length === 0) {
      showErrorMessage(t('delivery.returnModal.errorMissingReasonOrProduct'));
      setIsSubmitting(false);
      return;
    }

    if (!livreur_id || typeof livreur_id !== 'string' || livreur_id.length !== 24) {
      showErrorMessage(`${t('delivery.returnModal.errorInvalidDeliveryPersonId')} (actuel: "${order.livreur_id}").`);
      setIsSubmitting(false);
      return;
    }

    // Validate conditionnement_id for conditioned products
    const invalidConditionnement = produits.some(
      p => p.is_conditionne && (!p.conditionnement_id || p.conditionnement_id.length !== 24)
    );
    if (invalidConditionnement) {
      showErrorMessage(t('delivery.returnModal.errorInvalidConditioningId'));
      setIsSubmitting(false);
      return;
    }

    try {
      await onConfirm(order.id, livreur_id, motif.trim(), produits);
      showSuccessMessage(t('delivery.ordersTable.messages.returnSuccess'));
      onCancel();
    } catch (error) {
      console.error(error);
      showErrorMessage(t('delivery.ordersTable.messages.returnError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4 text-[#0F172A]">{t('delivery.returnModal.title')}</h3>

        <p className="text-sm text-gray-600 mb-1">{t('delivery.returnModal.orderLabel')}{order.id}</p>
        <p className="font-medium mb-4">{order.clientName}</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('delivery.returnModal.reasonLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={motif}
          onChange={e => setMotif(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-md focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
          disabled={isSubmitting}
        />

        <p className="text-sm font-medium text-gray-700 mb-2 mt-4">
          {t('delivery.returnModal.productsLabel')} <span className="text-red-500">*</span>
        </p>
        {returnedProducts.map((prod, idx) => (
          <div key={prod.produit_id} className="mb-4 border-b pb-2">
            <div className="flex items-center mb-2">
              <span className="text-sm flex-1">{prod.nom} ({t('delivery.returnModal.maxLabel')}: {prod.maxQuantite})</span>
              <input
                type="number"
                value={prod.quantite}
                onChange={e => handleProductQuantityChange(idx, Number(e.target.value))}
                className="w-20 px-2 py-1 border rounded-md"
                min={0}
                max={prod.maxQuantite}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center mb-2">
              <label className="text-sm mr-2">{t('delivery.returnModal.conditionedLabel')}</label>
              <input
                type="checkbox"
                checked={prod.is_conditionne}
                onChange={e => handleConditionneChange(idx, e.target.checked)}
                disabled={isSubmitting}
              />
            </div>
            {prod.is_conditionne && (
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('delivery.returnModal.conditioningIdLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={prod.conditionnement_id}
                  onChange={e => handleConditionnementIdChange(idx, e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-[#0F172A]/20"
                  placeholder={t('delivery.returnModal.conditioningIdPlaceholder')}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            disabled={isSubmitting}
          >
            {t('delivery.returnModal.cancelBtn')}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-md transition-all font-bold shadow-md active:scale-95 disabled:opacity-50"
            disabled={
              isSubmitting ||
              !motif.trim() ||
              returnedProducts.every(p => p.quantite === 0) ||
              returnedProducts.some(p => p.is_conditionne && !p.conditionnement_id)
            }
          >
            {isSubmitting ? t('delivery.returnModal.savingBtn') : t('delivery.returnModal.confirmBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;


