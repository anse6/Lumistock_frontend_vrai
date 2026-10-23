// src/stores/livraisonstore.tsx
import { create } from 'zustand';

export interface ProduitLivraison {
  id: string;
  nom: string;
  quantite: number;
  prix: number;
}

type StatutPaiement = 'none' | 'total';

interface LivraisonStore {
  produits: ProduitLivraison[];
  clientId: string;
  statutPaiement: StatutPaiement;
  ajouterProduit: (produit: Omit<ProduitLivraison, 'quantite'>) => void;
  supprimerProduit: (id: string) => void;
  modifierQuantite: (id: string, quantite: number) => void;
  viderProduits: () => void;
  definirClient: (clientId: string) => void;
  definirStatutPaiement: (statut: StatutPaiement) => void;
  montantTotal: number;
}

export const useLivraisonStore = create<LivraisonStore>((set) => ({
  produits: [],
  clientId: '',
  statutPaiement: 'none',
  montantTotal: 0,

  ajouterProduit: (produit) => set((state) => {
    const produitExistant = state.produits.find(p => p.id === produit.id);
    if (produitExistant) {
      const nouveauxProduits = state.produits.map(p =>
        p.id === produit.id
          ? { ...p, quantite: p.quantite + 1 }
          : p
      );
      return {
        produits: nouveauxProduits,
        montantTotal: state.montantTotal + produit.prix
      };
    } else {
      return {
        produits: [...state.produits, { ...produit, quantite: 1 }],
        montantTotal: state.montantTotal + produit.prix
      };
    }
  }),

  supprimerProduit: (id) => set((state) => {
    const produitASupprimer = state.produits.find(p => p.id === id);
    const montantRetirer = produitASupprimer ? produitASupprimer.quantite * produitASupprimer.prix : 0;
    return {
      produits: state.produits.filter(p => p.id !== id),
      montantTotal: Math.max(state.montantTotal - montantRetirer, 0)
    };
  }),

  modifierQuantite: (id, quantite) => set((state) => {
    const produit = state.produits.find(p => p.id === id);
    if (!produit || quantite <= 0) return state;

    const ancienneQuantite = produit.quantite;
    const nouveauxProduits = state.produits.map(p =>
      p.id === id ? { ...p, quantite } : p
    );
    const difference = (quantite - ancienneQuantite) * produit.prix;

    return {
      produits: nouveauxProduits,
      montantTotal: Math.max(state.montantTotal + difference, 0)
    };
  }),

  viderProduits: () => set(() => ({
    produits: [],
    clientId: '',
    statutPaiement: 'none',
    montantTotal: 0
  })),

  definirClient: (clientId) => set(() => ({
    clientId
  })),

  definirStatutPaiement: (statut) => set(() => ({
    statutPaiement: statut
  }))
}));



