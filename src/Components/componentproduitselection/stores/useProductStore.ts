import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getUrlServer } from './../../../configServer'
import { Conditioning } from './../../../Modules/Delivery/NewDelivery'
import { useQueryClient } from '@tanstack/react-query'

const API_URL = getUrlServer()

export interface SelectedProduct {
  id: string
  name: string
  price: number
  quantity: number
  total: number
  image?: string | null
  size: string
  quantite_livreur_initiale: number
  conditionnements?: Conditioning[]
  conditionconfig: { selectedConditioning: Conditioning, conditionedQuantity: number, quantity: number }[]
}

interface UpdateStockFunction {
  (productId: string, newQuantity: number): Promise<void>
}

interface ProductStore {
  selectedProducts: SelectedProduct[]
  addProduct: (product: Omit<SelectedProduct, 'quantity' | 'total' | 'conditionconfig'> & { quantite_livreur_initiale: number; conditionnements?: Conditioning[] }) => void
  removeProduct: (id: string) => void
  updateUnitQuantity: (id: string, newQuantity: number, updateStock?: UpdateStockFunction) => void
  addConditioning: (productId: string, conditioningId: string, conditionedQuantity: number) => void
  updateConditionedQuantity: (productId: string, conditioningId: string, newConditionedAmount: number) => void
  removeConditioning: (productId: string, conditioningId: string) => void
  clearProducts: () => void
  totalAmount: number
  updateProductStock?: UpdateStockFunction
  updatePrice: (id: string, newPrice: number) => void
  setUpdateStockFn: (fn: UpdateStockFunction) => void
  refreshProductsFromServer: () => Promise<void>
  _hasHydrated: boolean
  setHasHydrated: (value: boolean) => void
}

const calculateProductTotals = (product: SelectedProduct) => {
  const quantity = Number(product.quantity) || 0
  const price = Number(product.price) || 0
  let newQuantity = quantity
  let newTotal = quantity * price

  if (product.conditionconfig && product.conditionconfig.length > 0) {
    product.conditionconfig.forEach((config) => {
      const condQty = Number(config.conditionedQuantity) || 0
      const facteur = Number(config.selectedConditioning?.facteur) || 1
      const condPrice = Number(config.selectedConditioning?.prix_conditionnement) || 0

      const tempQuantity = condQty * facteur
      const tempTotal = condQty * condPrice
      newQuantity += tempQuantity
      newTotal += tempTotal
    })
  }

  return { newQuantity, newTotal, stockInitiale: Number(product.quantite_livreur_initiale) || 0 }
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      selectedProducts: [],
      totalAmount: 0,
      updateProductStock: undefined,
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setUpdateStockFn: (fn) => set({ updateProductStock: fn }),

      addProduct: (product) => {
        const state = get()
        const existingProduct = state.selectedProducts.find(p => p.id === product.id)
        if (existingProduct) return

        const initialProduct: SelectedProduct = {
          ...product,
          quantity: 0,
          total: 0,
          conditionconfig: [],
        }

        set({
          selectedProducts: [...state.selectedProducts, initialProduct],
          totalAmount: state.totalAmount,
        })
      },

      removeProduct: (id) => {
        const state = get()
        const toRemove = state.selectedProducts.find(p => p.id === id)
        set({
          selectedProducts: state.selectedProducts.filter(p => p.id !== id),
          totalAmount: state.totalAmount - (toRemove ? toRemove.total : 0),
        })
      },

      updateUnitQuantity: (id, newQuantity, updateStock) => {
        const state = get()
        const product = state.selectedProducts.find(p => p.id === id)
        if (!product) return

        const totalUsedUnits = product.conditionconfig.reduce(
          (sum, config) => sum + (Number(config.conditionedQuantity) || 0) * (config.selectedConditioning?.facteur || 1),
          0
        )
        const stockInitiale = Number(product.quantite_livreur_initiale) || 0
        const safeQty = Math.min(newQuantity, stockInitiale - totalUsedUnits)
        if (updateStock) updateStock(id, safeQty).catch(console.error)

        const updatedProduct = {
          ...product,
          quantity: safeQty,
        }

        const { newTotal } = calculateProductTotals(updatedProduct)
        updatedProduct.total = newTotal

        set({
          selectedProducts: state.selectedProducts.map(p => p.id === id ? updatedProduct : p),
          totalAmount: state.selectedProducts.reduce((sum, p) => sum + (p.id === id ? newTotal : p.total), 0),
        })
      },

      updatePrice: (id, newPrice) => {
        const state = get()
        const product = state.selectedProducts.find(p => p.id === id)
        if (!product) return

        const updatedProduct = {
          ...product,
          price: newPrice,
        }

        const { newTotal } = calculateProductTotals(updatedProduct)
        updatedProduct.total = newTotal

        set({
          selectedProducts: state.selectedProducts.map(p => p.id === id ? updatedProduct : p),
          totalAmount: state.selectedProducts.reduce((sum, p) => sum + (p.id === id ? newTotal : p.total), 0),
        })
      },

      addConditioning: (productId, conditioningId, conditionedQuantity) => {
        const state = get()
        const product = state.selectedProducts.find(p => p.id === productId)
        if (!product || !product.conditionnements) return

        const selectedCond = product.conditionnements.find(c => c._id['$oid'] === conditioningId)
        if (!selectedCond) return

        const totalUsedUnits = product.conditionconfig.reduce(
          (sum, config) => sum + config.conditionedQuantity * (config.selectedConditioning?.facteur || 1),
          0
        ) + product.quantity
        const maxPossible = Math.floor((product.quantite_livreur_initiale - totalUsedUnits) / selectedCond.facteur)
        const safeQty = Math.min(Math.max(1, conditionedQuantity), maxPossible)

        if (safeQty <= 0) return

        const newConfig = {
          selectedConditioning: selectedCond,
          conditionedQuantity: safeQty,
          quantity: safeQty * selectedCond.facteur,
        }

        const updatedProduct = {
          ...product,
          conditionconfig: [...product.conditionconfig, newConfig],
        }

        const { newTotal } = calculateProductTotals(updatedProduct)
        updatedProduct.total = newTotal

        set({
          selectedProducts: state.selectedProducts.map(p => p.id === productId ? updatedProduct : p),
          totalAmount: state.selectedProducts.reduce((sum, p) => sum + (p.id === productId ? newTotal : p.total), 0),
        })
      },

      updateConditionedQuantity: (productId, conditioningId, newConditionedAmount) => {
        const state = get()
        const product = state.selectedProducts.find(p => p.id === productId)
        if (!product) return

        const totalUsedUnits = product.conditionconfig.reduce(
          (sum, config) => sum + (config.selectedConditioning._id['$oid'] !== conditioningId ? config.conditionedQuantity * (config.selectedConditioning?.facteur || 1) : 0),
          0
        ) + product.quantity
        const selectedCond = product.conditionnements?.find(c => c._id['$oid'] === conditioningId)
        if (!selectedCond) return

        const maxPossible = Math.floor((product.quantite_livreur_initiale - totalUsedUnits) / selectedCond.facteur)
        const safeQty = Math.min(Math.max(0, newConditionedAmount), maxPossible)

        const updatedProduct = {
          ...product,
          conditionconfig: product.conditionconfig.map(config =>
            config.selectedConditioning._id['$oid'] === conditioningId
              ? { ...config, conditionedQuantity: safeQty, quantity: safeQty * config.selectedConditioning.facteur }
              : config
          ),
        }

        const { newTotal } = calculateProductTotals(updatedProduct)
        updatedProduct.total = newTotal

        set({
          selectedProducts: state.selectedProducts.map(p => p.id === productId ? updatedProduct : p),
          totalAmount: state.selectedProducts.reduce((sum, p) => sum + (p.id === productId ? newTotal : p.total), 0),
        })
      },

      removeConditioning: (productId, conditioningId) => {
        const state = get()
        const product = state.selectedProducts.find(p => p.id === productId)
        if (!product) return

        const updatedProduct = {
          ...product,
          conditionconfig: product.conditionconfig.filter(config => config.selectedConditioning._id['$oid'] !== conditioningId),
        }

        const { newTotal } = calculateProductTotals(updatedProduct)
        updatedProduct.total = newTotal

        set({
          selectedProducts: state.selectedProducts.map(p => p.id === productId ? updatedProduct : p),
          totalAmount: state.selectedProducts.reduce((sum, p) => sum + (p.id === productId ? newTotal : p.total), 0),
        })
      },

      clearProducts: () => set({ selectedProducts: [], totalAmount: 0 }),

      refreshProductsFromServer: async () => {
        try {
          const res = await fetch(`${API_URL}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          })
          const data = await res.json()
          console.log('🟢 Produits mis à jour depuis le serveur :', data)
        } catch (err) {
          console.error('Erreur lors du rechargement des produits :', err)
        }
      },
    }),
    {
      name: 'product-store',
      partialize: (state) => ({
        selectedProducts: state.selectedProducts,
        totalAmount: state.totalAmount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

export const useProductSelection = () => {
  const queryClient = useQueryClient()
  const store = useProductStore()

  const addSelectedProductsFromIds = (selectedIds: string[]) => {
    const categoriesData = queryClient.getQueryData<{ produits: any[] }[]>(['categories'])
    if (!categoriesData) return

    selectedIds.forEach(id => {
      const alreadyAdded = store.selectedProducts.some(p => p.id === id)
      if (alreadyAdded) return

      for (const category of categoriesData) {
        const foundProduct = category.produits.find(p => p._id === id)
        if (foundProduct) {
          store.addProduct({
            id: foundProduct._id,
            name: foundProduct.nom,
            price: foundProduct.prix || 0,
            image: foundProduct.image || null,
            size: foundProduct.unite,
            quantite_livreur_initiale: foundProduct.quantite_livreur ?? foundProduct.quantite_magasin ?? 0,
            conditionnements: foundProduct.conditionnements || [],
          })
          break
        }
      }
    })
  }

  return {
    ...store,
    addSelectedProductsFromIds,
  }
}

export type { Conditioning }