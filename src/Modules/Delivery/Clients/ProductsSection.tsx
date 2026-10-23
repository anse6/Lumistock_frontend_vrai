import React from 'react'
import { ProductItem } from './ProductItem'
import { useProductStore } from '../../../Components/componentproduitselection/stores/useProductStore'
import { useTranslation } from 'react-i18next'

export const ProductsSection: React.FC = () => {
  const { t } = useTranslation();
  const selectedProducts = useProductStore(state => state.selectedProducts)
  const hasHydrated = useProductStore(state => state._hasHydrated)

  if (!hasHydrated) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F172A]"></div>
      </div>
    )
  }

  if (selectedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 group hover:border-blue-300 transition-colors duration-300">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
             <span className="text-2xl">📦</span>
          </div>
        </div>
        <p className="text-slate-600 font-bold text-lg mb-1">{t('delivery.deliveryConfig.productsNoTarget')}</p>
        <p className="text-slate-400 text-sm max-w-[250px] text-center font-medium leading-relaxed">
          {t('delivery.deliveryConfig.productsAddPrompt')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      {selectedProducts.map(product => (
        <ProductItem
          key={product.id}
          id={product.id}
          image={product.image ?? null}
          title={product.name}
          price={product.price}
          quantity={product.quantity}
          total={product.total}
          quantite_livreur_initiale={product.quantite_livreur_initiale}
          conditionnements={product.conditionnements}
          conditionconfig={product.conditionconfig}
        />
      ))}
    </div>
  )
}


