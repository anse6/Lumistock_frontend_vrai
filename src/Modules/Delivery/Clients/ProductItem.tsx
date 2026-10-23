import React, { useState } from 'react';
import defaultImage from './riz.png';
import { useDeliveryStore } from './composantclient/deliveryStore';
import { useProductStore } from '../../../Components/componentproduitselection/stores/useProductStore';
import { Button, Select, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { Conditioning } from './../NewDelivery';
import { useTranslation } from 'react-i18next';

interface ProductItemProps {
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

export const ProductItem: React.FC<ProductItemProps> = ({
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
  const [unitInputValue, setUnitInputValue] = useState((quantity ?? 0).toString());
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInputValue, setPriceInputValue] = useState((price || 0).toString());

  const deliveryProduct = getProductById(id);
  const maxIndividualStock = (deliveryProduct?.quantite_livreur_initiale ?? quantite_livreur_initiale) || 0;
  const totalUsedUnits = (conditionconfig ?? []).reduce(
    (sum, config) => sum + (Number(config.conditionedQuantity) || 0) * (config.selectedConditioning?.facteur || 1),
    0
  ) + (Number(quantity) || 0);

  const { updatePrice } = useProductStore();
  const { updateProductPrice } = useDeliveryStore();

  const handlePriceBlur = () => {
    const newValue = parseFloat(priceInputValue);
    if (!isNaN(newValue) && newValue >= 0) {
      updatePrice(id, newValue);
      updateProductPrice(id, newValue);
      setPriceInputValue(newValue.toString());
    } else {
      setPriceInputValue((price || 0).toString());
    }
    setIsEditingPrice(false);
  };

  const handlePriceKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePriceBlur();
    }
  };

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
    if (stockPercentage > 90) return 'bg-red-500';
    if (stockPercentage > 70) return 'bg-yellow-500';
    return 'bg-[#0F172A]'; 
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        
        {/* 1. Image & Basic Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
             <img
              src={image || defaultImage}
              alt={title}
              className="w-16 h-16 rounded-md object-cover border border-gray-200"
            />
             {maxIndividualStock < 10 && (
                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-white">
                    <span className="text-[10px] font-bold text-white">!</span>
                </div>
              )}
          </div>
         
          <div>
            <h4 className="font-semibold text-gray-900 text-base">{title}</h4>
            <div className="text-sm text-gray-500 flex items-center gap-2">
               <span>{t('delivery.deliveryConfig.productStock')} <span className="font-medium text-yellow-500">{maxIndividualStock}</span></span>
               <span className="text-gray-300">|</span>
               <div className="flex items-center gap-1">
                 <span >{t('delivery.deliveryConfig.productPrice')}</span>
                 {isEditingPrice ? (
                   <input
                     className="w-20 px-1 py-0 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#0F172A] outline-none text-red-500"
                     type="number"
                     value={priceInputValue}
                     onChange={(e) => setPriceInputValue(e.target.value)}
                     onBlur={handlePriceBlur}
                     onKeyDown={handlePriceKeyPress}
                     autoFocus
                   />
                 ) : (
                   <span  
                    onClick={() => {
                      setIsEditingPrice(true);
                      setPriceInputValue(price.toString());
                    }} 
                    className="font-medium text-[#0F172A] cursor-pointer hover:underline flex items-center gap-1 text-red-500"
                   >
                     {(price || 0).toLocaleString()} FCFA
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                     </svg>
                   </span>
                 )}
               </div>
            </div>
             {/* Progress Bar Mini */}
             <div className="w-24 h-1 bg-gray-100 rounded-full mt-2">
                <div 
                    className={`h-1 rounded-full ${getStockColor()}`} 
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                />
             </div>
          </div>
        </div>

        {/* 2. Unit Quantity Controls */}
        <div className="flex flex-col items-end sm:items-center gap-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('delivery.deliveryConfig.productUnits')}</span>
            <div className="flex items-center border border-gray-200 rounded-md bg-gray-50">
                <button 
                    onClick={handleDecrementUnit}
                    disabled={quantity <= 0}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#0F172A] disabled:opacity-30"
                >
                    <MinusOutlined className="text-xs" />
                </button>
                <div className="w-10 h-8 flex items-center justify-center bg-white border-x border-gray-200 font-semibold text-gray-700">
                     {isEditingUnit ? (
                        <input
                            type="number"
                            value={unitInputValue}
                            onChange={handleUnitInputChange}
                            onBlur={handleUnitBlur}
                            onKeyDown={handleUnitKeyPress}
                            autoFocus
                            className="w-full h-full text-center outline-none bg-transparent"
                        />
                     ) : (
                        <span onClick={() => setIsEditingUnit(true)} className="cursor-pointer select-none w-full text-center">
                            {quantity}
                        </span>
                     )}
                </div>
                 <button 
                    onClick={handleIncrementUnit}
                    disabled={totalUsedUnits >= maxIndividualStock}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#0F172A] disabled:opacity-30"
                >
                    <PlusOutlined className="text-xs" />
                </button>
            </div>
        </div>

        {/* 3. Total Price & Actions */}
        <div className="flex items-center gap-4 pl-4 border-l border-gray-100 min-w-[120px] justify-end">
            <div className="text-right">
                <div className="font-bold text-[#0F172A] text-lg">{(total || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-400">FCFA</div>
            </div>
            <Tooltip title={t('delivery.deliveryConfig.productRemove')}>
                 <button 
                    onClick={() => removeProduct(id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                >
                    <DeleteOutlined />
                </button>
            </Tooltip>
        </div>
      </div>

       {/* 4. Conditioning Section (Collapsible/Inline) */}
       {(conditionnements.length > 0 || conditionconfig.length > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-50">
            {/* List of active conditionings */}
            <div className="space-y-2 mb-3">
                {conditionconfig.map((config) => (
                    <div key={config.selectedConditioning._id['$oid']} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-md">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{config.selectedConditioning.nom}</span>
                            <span className="text-xs text-gray-400">({config.selectedConditioning.facteur} {t('delivery.deliveryConfig.productUnitShort')})</span>
                        </div>
                         <div className="flex items-center gap-3">
                             <div className="flex items-center bg-white rounded border border-gray-200 h-7">
                                  <button 
                                    onClick={() => handleDecrementConditioned(config.selectedConditioning._id['$oid'])}
                                    className="px-2 hover:bg-gray-100 text-gray-500"
                                >-</button>
                                  <span className="px-2 font-medium text-gray-700 min-w-[20px] text-center">{config.conditionedQuantity}</span>
                                   <button 
                                    onClick={() => handleIncrementConditioned(config.selectedConditioning._id['$oid'])}
                                    disabled={
                                        config.conditionedQuantity * config.selectedConditioning.facteur >=
                                        maxIndividualStock - totalUsedUnits + config.conditionedQuantity * config.selectedConditioning.facteur
                                      }
                                    className="px-2 hover:bg-gray-100 text-gray-500"
                                >+</button>
                             </div>
                             <button 
                                onClick={() => handleRemoveConditioning(config.selectedConditioning._id['$oid'])}
                                className="text-gray-400 hover:text-red-500"
                            >
                                <DeleteOutlined />
                             </button>
                         </div>
                    </div>
                ))}
            </div>

            {/* Add new conditioning */}
            <div className="flex gap-2 items-center">
                 <Select
                    value={selectedConditioningId}
                    onChange={(val) => {
                        setSelectedConditioningId(val);
                        setTempConditionedQuantity('1');
                    }}
                    placeholder={t('delivery.deliveryConfig.productAddConditioning')}
                    className="flex-1"
                    size="small"
                    options={conditionnements.map(c => ({ label: `${c.nom} (${c.facteur} u)`, value: c._id['$oid'] }))}
                 />
                 {selectedConditioningId && (
                    <>
                        <input 
                            type="number" 
                            value={tempConditionedQuantity}
                            onChange={(e) => setTempConditionedQuantity(e.target.value)}
                            className="w-16 h-6 text-sm border border-gray-300 rounded px-1"
                            min="1"
                        />
                        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddConditioning}>
                            {t('delivery.deliveryConfig.productAddBtn')}
                        </Button>
                    </>
                 )}
            </div>
             {totalUsedUnits > maxIndividualStock && (
               <p className="text-xs text-red-500 mt-1">
                 {t('delivery.deliveryConfig.productStockWarning')}
               </p>
             )}
        </div>
       )}
    </div>
  );
};
