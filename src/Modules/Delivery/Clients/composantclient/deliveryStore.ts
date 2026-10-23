import { create } from 'zustand'
import { Conditioning } from './../../NewDelivery'

interface Payment {
  methode: string
  montant: number
}

interface ProductDelivery {
  produit_id: string
  nom: string
  quantite: number
  quantite_livreur_initiale: number
  prix: number
  conditionnements?: Conditioning[]
  conditionconfig: { selectedConditioning: Conditioning, conditionedQuantity: number, quantity: number }[]
}

interface DeliveryState {
  clientId: string
  products: ProductDelivery[]
  statut_paiement: string
  methode_paiement: string // Nouveau champ
  montant_paye: number
  paiements: Payment[]
  relicat: number
  ristourne: number // Nouveau champ
  dette_ancienne: number
  is_dette_ancienne_active: boolean
  aCouche: boolean
  editDeliveryId: string | null
  setEditDeliveryId: (id: string | null) => void
  setClientId: (id: string) => void
  addProduct: (product: Omit<ProductDelivery, 'quantite' | 'conditionconfig'> & { conditionnements?: Conditioning[] }) => void
  updateProductQuantity: (productId: string, newQuantity: number) => void
  addProductConditioning: (productId: string, conditioningId: string, conditionedQuantity: number) => void
  updateProductConditionedQuantity: (productId: string, conditioningId: string, newConditionedQuantity: number) => void
  removeProductConditioning: (productId: string, conditioningId: string) => void
  updateProductPrice: (productId: string, newPrice: number) => void
  setPaymentStatus: (status: string) => void
  setMethodePaiement: (method: string) => void // Nouvelle action
  setPaiements: (paiements: Payment[]) => void
  clearDelivery: () => void
  setAdvanceAmount: (montant_paye: number) => void
  setRelicat: (montant: number) => void
  setRistourne: (amount: number) => void // Nouvelle action
  setDetteAncienne: (amount: number) => void
  setIsDetteAncienneActive: (isActive: boolean) => void
  setACouche: (aCouche: boolean) => void
  getProductById: (productId: string) => ProductDelivery | undefined
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  clientId: '',
  products: [],
  statut_paiement: 'non payé',
  methode_paiement: 'cash', // Valeur par défaut
  montant_paye: 0,
  paiements: [],
  relicat: 0,
  ristourne: 0,
  dette_ancienne: 0,
  is_dette_ancienne_active: false,
  aCouche: false,
  editDeliveryId: null,


  setEditDeliveryId: (id) => set({ editDeliveryId: id }),
  setClientId: (id) => set({ clientId: id }),

  addProduct: (product) =>
    set((state) => ({
      products: [
        ...state.products,
        {
          ...product,
          quantite: 0,
          conditionconfig: [],
        },
      ],
    })),

  updateProductQuantity: (productId, newQuantity) =>
    set((state) => ({
      products: state.products.map((p) => {
        if (p.produit_id === productId) {
          const totalUsedUnits = p.conditionconfig.reduce(
            (sum, config) => sum + config.conditionedQuantity * (config.selectedConditioning?.facteur || 1),
            0
          )
          const safeQty = Math.min(newQuantity, p.quantite_livreur_initiale - totalUsedUnits)
          return {
            ...p,
            quantite: safeQty,
          }
        }
        return p
      }),
    })),

  addProductConditioning: (productId, conditioningId, conditionedQuantity) =>
    set((state) => ({
      products: state.products.map((p) => {
        if (p.produit_id === productId) {
          const selectedCond = p.conditionnements?.find((c) => c._id['$oid'] === conditioningId)
          if (!selectedCond) return p

          const totalUsedUnits = p.conditionconfig.reduce(
            (sum, config) => sum + config.conditionedQuantity * (config.selectedConditioning?.facteur || 1),
            0
          ) + p.quantite
          const maxPossible = Math.floor((p.quantite_livreur_initiale - totalUsedUnits) / selectedCond.facteur)
          const safeQty = Math.min(Math.max(1, conditionedQuantity), maxPossible)

          if (safeQty <= 0) return p

          return {
            ...p,
            conditionconfig: [
              ...p.conditionconfig,
              {
                selectedConditioning: selectedCond,
                conditionedQuantity: safeQty,
                quantity: safeQty * selectedCond.facteur,
              },
            ],
          }
        }
        return p
      }),
    })),

  updateProductConditionedQuantity: (productId, conditioningId, newConditionedQuantity) =>
    set((state) => ({
      products: state.products.map((p) => {
        if (p.produit_id === productId) {
          const totalUsedUnits = p.conditionconfig.reduce(
            (sum, config) => sum + (config.selectedConditioning._id['$oid'] !== conditioningId ? config.conditionedQuantity * (config.selectedConditioning?.facteur || 1) : 0),
            0
          ) + p.quantite
          const selectedCond = p.conditionnements?.find((c) => c._id['$oid'] === conditioningId)
          if (!selectedCond) return p

          const maxPossible = Math.floor((p.quantite_livreur_initiale - totalUsedUnits) / selectedCond.facteur)
          const safeQty = Math.min(Math.max(0, newConditionedQuantity), maxPossible)

          return {
            ...p,
            conditionconfig: p.conditionconfig.map((config) =>
              config.selectedConditioning._id['$oid'] === conditioningId
                ? { ...config, conditionedQuantity: safeQty, quantity: safeQty * config.selectedConditioning.facteur }
                : config
            ),
          }
        }
        return p
      }),
    })),

  removeProductConditioning: (productId, conditioningId) =>
    set((state) => ({
      products: state.products.map((p) => {
        if (p.produit_id === productId) {
          return {
            ...p,
            conditionconfig: p.conditionconfig.filter((config) => config.selectedConditioning._id['$oid'] !== conditioningId),
          }
        }
        return p
      }),
    })),

  getProductById: (productId) => {
    return get().products.find((p) => p.produit_id === productId)
  },

  updateProductPrice: (productId, newPrice) =>
    set((state) => ({
      products: state.products.map((p) => {
        if (p.produit_id === productId) {
          return {
            ...p,
            prix: newPrice,
          }
        }
        return p
      }),
    })),

  setPaymentStatus: (status) => {
    console.log('>>> setPaymentStatus appelé avec :', status)
    set({ statut_paiement: status })
  },

  setMethodePaiement: (method) => {
    console.log('>>> setMethodePaiement appelé avec :', method)
    set({ methode_paiement: method })
  },

  setPaiements: (paiements) => {
    console.log('>>> setPaiements appelé avec :', paiements)
    set({ paiements })
  },

  setAdvanceAmount: (montant_paye) => {
    console.log(`Advance amount set to: ${montant_paye}`)
    set({ montant_paye })
  },

  setRelicat: (montant) => {
    console.log(`Relicat set to: ${montant}`)
    set({ relicat: montant })
  },

  setACouche: (aCouche) => {
    console.log(`A couché set to: ${aCouche}`)
    set({ aCouche })
  },

  setRistourne: (amount) => {
    console.log(`Ristourne set to: ${amount}`)
    set({ ristourne: amount })
  },

  setDetteAncienne: (amount) => {
    console.log(`Dette ancienne set to: ${amount}`)
    set({ dette_ancienne: amount })
  },

  setIsDetteAncienneActive: (isActive) => {
    console.log(`Is dette ancienne active set to: ${isActive}`)
    set({ is_dette_ancienne_active: isActive })
  },

  clearDelivery: () =>
    set({
      clientId: '',
      products: [],
      statut_paiement: 'non payé',
      methode_paiement: 'cash',
      montant_paye: 0,
      paiements: [],
      relicat: 0,
      ristourne: 0,
      dette_ancienne: 0,
      is_dette_ancienne_active: false,
      aCouche: false,
      editDeliveryId: null,
    }),
}))

export type { Conditioning }