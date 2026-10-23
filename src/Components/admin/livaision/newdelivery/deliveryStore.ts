import { create } from 'zustand';
import { Conditioning } from '../index/NewDeliveryadmin';
import { getConditioningId } from '../../approvisonnement/conditioning';
import type { Reduction } from '../selectionproduct/Clients/reductions';

interface Payment {
  methode: string
  montant: number
}

interface ProductDelivery {
  produit_id: string
  nom: string
  quantite: number
  quantite_magasin_initiale: number
  prix: number
  conditionnements?: Conditioning[]
  conditionconfig: { selectedConditioning: Conditioning, conditionedQuantity: number, quantity: number }[]
}

interface DeliveryState {
  clientId: string
  products: ProductDelivery[]
  statut_paiement: string
  methode_paiement: string
  montant_paye: number
  paiements: Payment[] // Nouveau champ pour les paiements multiples
  relicat: number
  ristourne: number
  reductions: Reduction[] // Rabais, remise, ristourne commerciale
  dette_ancienne: number
  is_dette_ancienne_active: boolean
  appliquer_tva: boolean
  /** Taux de la vente modifiée (une vente garde le taux de sa date) ; null = taux du magasin. */
  taux_tva_vente: number | null
  aCouche: boolean
  editDeliveryId: string | null
  setEditDeliveryId: (id: string | null) => void
  setClientId: (id: string) => void
  addProduct: (product: Omit<ProductDelivery, 'quantite' | 'conditionconfig'> & { conditionnements?: Conditioning[] }) => void
  updateProductQuantity: (productId: string, newQuantity: number) => void
  addProductConditioning: (productId: string, conditioningId: string, conditionedQuantity: number) => void
  updateProductConditionedQuantity: (productId: string, conditioningId: string, newConditionedQuantity: number) => void
  removeProductConditioning: (productId: string, conditioningId: string) => void
  setPaymentStatus: (status: string) => void
  setMethodePaiement: (method: string) => void
  setPaiements: (paiements: Payment[]) => void // Nouvelle action
  clearDelivery: () => void
  setAdvanceAmount: (montant_paye: number) => void
  setRelicat: (montant: number) => void
  setRistourne: (amount: number) => void
  setReductions: (reductions: Reduction[]) => void
  setDetteAncienne: (amount: number) => void
  setIsDetteAncienneActive: (isActive: boolean) => void
  setAppliquerTva: (appliquer: boolean) => void
  setTauxTvaVente: (taux: number | null) => void
  setACouche: (aCouche: boolean) => void
  updateProductPrice: (productId: string, newPrice: number) => void
  getProductById: (productId: string) => ProductDelivery | undefined
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  clientId: '',
  products: [],
  statut_paiement: 'non payé',
  methode_paiement: 'cash',
  montant_paye: 0,
  paiements: [], // Initialisation
  relicat: 0,
  ristourne: 0,
  reductions: [],
  dette_ancienne: 0,
  is_dette_ancienne_active: false,
  // TVA désactivée par défaut : elle s'active vente par vente.
  appliquer_tva: false,
  taux_tva_vente: null,
  aCouche: false,
  editDeliveryId: null,

  setAppliquerTva: (appliquer) => set({ appliquer_tva: appliquer }),
  setTauxTvaVente: (taux) => set({ taux_tva_vente: taux }),

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
          const safeQty = Math.min(newQuantity, p.quantite_magasin_initiale - totalUsedUnits)
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
          const selectedCond = p.conditionnements?.find((c) => getConditioningId(c._id) === conditioningId)
          if (!selectedCond) return p

          const totalUsedUnits = p.conditionconfig.reduce(
            (sum, config) => sum + config.conditionedQuantity * (config.selectedConditioning?.facteur || 1),
            0
          ) + p.quantite
          const maxPossible = Math.floor((p.quantite_magasin_initiale - totalUsedUnits) / selectedCond.facteur)
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
            (sum, config) => sum + (getConditioningId(config.selectedConditioning._id) !== conditioningId ? config.conditionedQuantity * (config.selectedConditioning?.facteur || 1) : 0),
            0
          ) + p.quantite
          const selectedCond = p.conditionnements?.find((c) => getConditioningId(c._id) === conditioningId)
          if (!selectedCond) return p

          const maxPossible = Math.floor((p.quantite_magasin_initiale - totalUsedUnits) / selectedCond.facteur)
          const safeQty = Math.min(Math.max(0, newConditionedQuantity), maxPossible)

          return {
            ...p,
            conditionconfig: p.conditionconfig.map((config) =>
              getConditioningId(config.selectedConditioning._id) === conditioningId
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
            conditionconfig: p.conditionconfig.filter((config) => getConditioningId(config.selectedConditioning._id) !== conditioningId),
          }
        }
        return p
      }),
    })),

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

  getProductById: (productId) => {
    return get().products.find((p) => p.produit_id === productId)
  },

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

  setReductions: (reductions) => set({ reductions }),

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
      reductions: [],
      dette_ancienne: 0,
      is_dette_ancienne_active: false,
      appliquer_tva: false,
      taux_tva_vente: null,
      aCouche: false,
      editDeliveryId: null,
    }),
}))

export type { Conditioning }