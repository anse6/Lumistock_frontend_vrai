import React, { useState } from 'react';
import defaultImage from './../images/riz.png';
import { useProductStore, Conditioning } from '../../../Components/componentproduitselection/stores/useProductStore';
import { useDeliveryStore } from '../Clients/composantclient/deliveryStore';
import { Select, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  id: string;
  image: string | null;
  title: string;
  price: number;
  quantity: number;
  quantite_livreur_initiale: number;
  total: number;
  conditionnements?: Conditioning[];
  conditionconfig: { selectedConditioning: Conditioning, conditionedQuantity: number, quantity: number }[];
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  image,
  title,
  price,
  quantity,
  quantite_livreur_initiale,
  total,
  conditionnements = [],
  conditionconfig,
}) => {
  const { t } = useTranslation();
  const { updateUnitQuantity, removeProduct, addConditioning, updateConditionedQuantity, removeConditioning } = useProductStore();
  const { getProductById, updateProductQuantity, addProductConditioning, updateProductConditionedQuantity, removeProductConditioning } = useDeliveryStore();

  const [selectedConditioningId, setSelectedConditioningId] = useState<string | null>(null);
  const [tempConditionedQuantity, setTempConditionedQuantity] = useState<string>('1');
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  const [unitInputValue, setUnitInputValue] = useState(quantity.toString());

  const deliveryProduct = getProductById(id);
  const maxIndividualStock = deliveryProduct?.quantite_livreur_initiale ?? quantite_livreur_initiale;
  const totalUsedUnits = (conditionconfig ?? []).reduce(
    (sum, config) => sum + config.conditionedQuantity * (config.selectedConditioning?.facteur || 1),
    0
  ) + quantity;

  const handleIncrementUnit = () => {
    const newUnitQty = quantity + 1;
    if (totalUsedUnits + 1 <= maxIndividualStock) {
      updateUnitQuantity(id, newUnitQty);
      updateProductQuantity(id, newUnitQty);
      setUnitInputValue(newUnitQty.toString());
    }
  };

  const handleDecrementUnit = () => {
    if (quantity > 0) {
      const newUnitQty = quantity - 1;
      updateUnitQuantity(id, newUnitQty);
      updateProductQuantity(id, newUnitQty);
      setUnitInputValue(newUnitQty.toString());
    }
  };

  const handleUnitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnitInputValue(e.target.value);
  };

  const handleUnitBlur = () => {
    const newValue = parseInt(unitInputValue);
    if (!isNaN(newValue)) {
      const safeQty = Math.min(newValue, maxIndividualStock - totalUsedUnits + quantity);
      updateUnitQuantity(id, safeQty);
      updateProductQuantity(id, safeQty);
      setUnitInputValue(safeQty.toString());
    } else {
      setUnitInputValue(quantity.toString());
    }
    setIsEditingUnit(false);
  };

  const handleUnitKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUnitBlur();
    }
  };

  const handleUnitQuantityClick = () => {
    setIsEditingUnit(true);
  };

  const handleConditioningChange = (value: string) => {
    setSelectedConditioningId(value);
    setTempConditionedQuantity('1');
  };

  const handleAddConditioning = () => {
    if (!selectedConditioningId) return;

    const selectedCond = conditionnements.find(c => c._id['$oid'] === selectedConditioningId);
    if (!selectedCond) return;

    const qty = parseInt(tempConditionedQuantity) || 1;
    addConditioning(id, selectedConditioningId, qty);
    addProductConditioning(id, selectedConditioningId, qty);
    setSelectedConditioningId(null);
    setTempConditionedQuantity('1');
  };

  const handleIncrementConditioned = (conditioningId: string) => {
    const config = conditionconfig.find(c => c.selectedConditioning._id['$oid'] === conditioningId);
    if (!config) return;

    const totalOtherUnits = conditionconfig.reduce(
      (sum, c) => sum + (c.selectedConditioning._id['$oid'] !== conditioningId ? c.conditionedQuantity * c.selectedConditioning.facteur : 0),
      0
    ) + quantity;
    const maxPossible = Math.floor((maxIndividualStock - totalOtherUnits) / config.selectedConditioning.facteur);
    if (config.conditionedQuantity < maxPossible) {
      const newQty = config.conditionedQuantity + 1;
      updateConditionedQuantity(id, conditioningId, newQty);
      updateProductConditionedQuantity(id, conditioningId, newQty);
    }
  };

  const handleDecrementConditioned = (conditioningId: string) => {
    const config = conditionconfig.find(c => c.selectedConditioning._id['$oid'] === conditioningId);
    if (!config || config.conditionedQuantity <= 0) return;

    const newQty = config.conditionedQuantity - 1;
    updateConditionedQuantity(id, conditioningId, newQty);
    updateProductConditionedQuantity(id, conditioningId, newQty);
  };

  const handleRemoveConditioning = (conditioningId: string) => {
    removeConditioning(id, conditioningId);
    removeProductConditioning(id, conditioningId);
  };

  const stockPercentage = maxIndividualStock > 0 ? (totalUsedUnits / maxIndividualStock) * 100 : 0;

  const getStockColor = () => {
    if (stockPercentage > 70) return 'bg-red-500';
    if (stockPercentage > 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
      {/* Desktop Layout */}
      <div className="hidden sm:block">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={image || defaultImage}
                alt={title}
                className="w-20 h-20 rounded-xl object-cover shadow-md ring-2 ring-gray-100"
              />
              {maxIndividualStock < 10 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  {t('delivery.deliveryConfig.productLowStock')}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-xl text-gray-900 truncate pr-2">{title}</h3>
                <button
                  onClick={() => removeProduct(id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                  title={t('delivery.deliveryConfig.productDeleteTitle')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">{t('delivery.deliveryConfig.productUnitPrice')}</p>
                  <p className="text-lg font-bold text-gray-900">{(price || 0).toLocaleString()} CFA</p>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-3 text-white shadow-md">
                  <p className="text-sm opacity-90 mb-1">{t('delivery.deliveryConfig.productTotal')}</p>
                  <p className="text-2xl font-bold">{(total || 0).toLocaleString()} CFA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="flex justify-between items-center p-4">
          <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{title}</h3>
          <button
            onClick={() => removeProduct(id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title={t('delivery.deliveryConfig.productDeleteTitle')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center px-4 pb-4">
          <div className="relative">
            <img
              src={image || defaultImage}
              alt={title}
              className="w-24 h-24 rounded-xl object-cover shadow-md ring-2 ring-gray-100"
            />
            {maxIndividualStock < 10 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                !
              </div>
            )}
          </div>
        </div>
        <div className="px-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600">{t('delivery.deliveryConfig.productUnitPrice')}</p>
              <p className="text-base font-bold text-blue-700">{(price || 0).toLocaleString()} CFA</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600">{t('delivery.deliveryConfig.productAvailableStock')}</p>
              <p className="text-base font-bold text-green-700">{maxIndividualStock} {t('delivery.deliveryConfig.productUnitShort')}</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-#0F172A to-pink-500 rounded-lg p-3 text-white">
            <p className="text-sm opacity-90">{t('delivery.deliveryConfig.productTotal')}</p>
            <p className="text-xl font-bold">{(total || 0).toLocaleString()} CFA</p>
          </div>
        </div>
      </div>

      {/* Stock Bar */}
      <div className="px-4 sm:px-6 py-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{t('delivery.deliveryConfig.productDelivererStock')}</span>
            <span className="text-sm font-bold text-gray-900">{maxIndividualStock} {t('delivery.deliveryConfig.productUnitShort')}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStockColor()} transition-all duration-300`}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Conditioning Section */}
      {conditionnements.length > 0 && (
        <div className="px-4 sm:px-6 py-3">
          <label htmlFor={`conditioning-${id}`} className="block text-sm font-semibold text-gray-700 mb-2">
            {t('delivery.deliveryConfig.productConditioning')}
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Select
              id={`conditioning-${id}`}
              value={selectedConditioningId}
              onChange={handleConditioningChange}
              className="w-full text-sm border border-[#0F172A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 bg-white shadow-sm font-bold"
              options={conditionnements.map((elt) => ({
                label: `${elt.nom} (${elt.facteur} ${t('delivery.deliveryConfig.productUnitShort')})`,
                value: elt._id['$oid'],
              }))}
              placeholder={t('delivery.deliveryConfig.productSelectConditioning')}
            />
            <input
              type="number"
              value={tempConditionedQuantity}
              onChange={(e) => setTempConditionedQuantity(e.target.value)}
              className="w-20 px-2 py-2.5 border-2 border-[#0F172A] rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 text-sm"
              min="1"
            />
            <Button
              type="primary"
              onClick={handleAddConditioning}
              disabled={!selectedConditioningId}
              className="w-full sm:w-auto h-10 px-4 text-sm bg-[#0F172A] hover:bg-slate-700 focus:bg-slate-700 border-none shadow-md"
            >
              {t('delivery.deliveryConfig.productAddBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* Quantity and Selected Conditionings */}
      <div className="px-4 sm:px-6 py-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-[#0F172A]">{t('delivery.deliveryConfig.productUnitQuantity')}</label>
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleDecrementUnit}
                  disabled={quantity <= 0}
                  className="w-10 h-10 bg-white border-2 border-[#0F172A] text-[#0F172A] rounded-lg hover:bg-slate-50 hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </button>
                {isEditingUnit ? (
                  <input
                    type="number"
                    value={unitInputValue}
                    onChange={handleUnitInputChange}
                    onBlur={handleUnitBlur}
                    onKeyPress={handleUnitKeyPress}
                    autoFocus
                    className="w-16 h-10 text-center bg-white border-2 border-[#0F172A] rounded-lg text-[#0F172A] font-bold focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                    min="0"
                    max={maxIndividualStock - totalUsedUnits + quantity}
                  />
                ) : (
                  <div
                    className="flex-1 text-center py-2.5 bg-white rounded-lg border-2 border-[#0F172A] cursor-pointer hover:border-slate-700 transition-colors duration-200"
                    onClick={handleUnitQuantityClick}
                  >
                    <span className="font-bold text-gray-900">{quantity}</span>
                    <span className="text-xs text-gray-600 ml-1">{t('delivery.deliveryConfig.productUnitShort')}</span>
                  </div>
                )}
                <button
                  onClick={handleIncrementUnit}
                  disabled={totalUsedUnits >= maxIndividualStock}
                  className="w-10 h-10 bg-white border-2 border-slate-300 text-[#0F172A] rounded-lg hover:bg-slate-50 hover:border-[#0F172A]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            {conditionconfig?.length > 0 && (
              <div className="flex flex-col space-y-3">
                <label className="text-sm font-medium text-[#1E293B]">{t('delivery.deliveryConfig.productSelectedConditionings')}</label>
                {conditionconfig.map((config) => (
                  <div key={config.selectedConditioning._id['$oid']} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 rounded-lg p-3">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-sm font-semibold text-[#1E293B]">{config.selectedConditioning.nom}</p>
                      <p className="text-xs text-[#0F172A]">{t('delivery.deliveryConfig.productFactor')} {config.selectedConditioning.facteur} {t('delivery.deliveryConfig.productUnitShort')}</p>
                      <p className="text-xs text-[#0F172A]">{t('delivery.deliveryConfig.productPrice')} {(config.selectedConditioning.prix_conditionnement || 0).toLocaleString()} CFA</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrementConditioned(config.selectedConditioning._id['$oid'])}
                        disabled={config.conditionedQuantity <= 0}
                        className="w-10 h-10 bg-white border-2 border-slate-300 text-[#0F172A] rounded-lg hover:bg-slate-50 hover:border-[#0F172A]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="font-bold text-slate-900">{config.conditionedQuantity}</span>
                      <button
                        onClick={() => handleIncrementConditioned(config.selectedConditioning._id['$oid'])}
                        disabled={
                          config.conditionedQuantity * config.selectedConditioning.facteur >=
                          maxIndividualStock - totalUsedUnits + config.conditionedQuantity * config.selectedConditioning.facteur
                        }
                        className="w-10 h-10 bg-white border-2 border-slate-300 text-[#0F172A] rounded-lg hover:bg-slate-50 hover:border-[#0F172A]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveConditioning(config.selectedConditioning._id['$oid'])}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title={t('delivery.deliveryConfig.productDeleteConditioning')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalUsedUnits > maxIndividualStock && (
              <p className="text-xs text-red-600 mt-2">
                {t('delivery.deliveryConfig.productOrderExceedsStock')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


