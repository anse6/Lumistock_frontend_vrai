import { create } from 'zustand';

interface ProductDelivery {
  produit_id: string;
  nom: string;
  quantite: number;
  quantite_livreur_initiale: number; // Stock initial du livreur
  quantite_livreur_actuelle: number; // Stock actuel après modifications
  prix: number;
}

interface DeliveryState {
  clientId: string;
  products: ProductDelivery[];
  statut_paiement: string;
  ristourne: number;
  methode_paiement: string;
  setClientId: (id: string) => void;
  addProduct: (product: Omit<ProductDelivery, 'quantite_livreur_actuelle'>) => void;
  updateProductQuantity: (productId: string, newQuantity: number) => void;
  setPaymentStatus: (status: string) => void;
  clearDelivery: () => void;
  setAdvanceAmount: (amount: number) => void;
  setRistourne: (amount: number) => void;
  setMethodePaiement: (method: string) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  getProductById: (productId: string) => ProductDelivery | undefined;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  clientId: '',
  products: [],
  statut_paiement: 'non payé',
  ristourne: 0,
  methode_paiement: 'cash',

  setClientId: (id) => set({ clientId: id }),

  addProduct: (product) => set((state) => ({
    products: [...state.products, {
      ...product,
      quantite: 1,
      quantite_livreur_actuelle: product.quantite_livreur_initiale - 1
    }]
  })),

  updateProductQuantity: (productId, newQuantity) =>
    set((state) => ({
      products: state.products.map(p => {
        if (p.produit_id === productId) {
          const difference = newQuantity - p.quantite;
          return {
            ...p,
            quantite: newQuantity,
            quantite_livreur_actuelle: p.quantite_livreur_actuelle - difference
          };
        }
        return p;
      })
    })),

  updateProductPrice: (productId: string, newPrice: number) =>
    set((state) => ({
      products: state.products.map((p) => {
        if (p.produit_id === productId) {
          return {
            ...p,
            prix: newPrice,
          };
        }
        return p;
      }),
    })),

  getProductById: (productId) => {
    return get().products.find(p => p.produit_id === productId);
  },

  setPaymentStatus: (status) => set({ statut_paiement: status }),

  setRistourne: (amount) => set({ ristourne: amount }),

  setMethodePaiement: (method) => set({ methode_paiement: method }),

  clearDelivery: () => set({
    clientId: '',
    products: [],
    statut_paiement: 'non payé',
    ristourne: 0,
    methode_paiement: 'cash'
  }),

  setAdvanceAmount: (amount) => {
    console.log(`Advance amount set to: ${amount}`);
  }
}));