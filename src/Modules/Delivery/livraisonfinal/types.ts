import type { AbandonReste } from '../../../services/ventes';
// types.ts
export interface Produit {
  produit_id: string;
  quantite: number;
  prix: number;
  nom: string;
  categorie: string | null;
  unite: string;
  image: string | null;
  is_conditionne: boolean;
  conditionnement_id?: string;
  conditionnement_nom: string;
  facteur: number;
  description?: string;
}

export interface Order {
  livraison_id: string;
  client_id: string;
  nom_livreur: string;
  montant_total: number;
  notes?: string;
  id: string;
  clientInitials: string;
  clientName: string;
  quantity: number;
  paymentStatus: string;
  amount: number;
  date: string;
  montant_paye: number;
  montant_restant: number;
  ristourne: number;
  retour: number;
  relicat: number;
  status: string;
  produits: Produit[];
  email: string;
  telephone: string;
  isDeleted?: boolean;
  isDeleting?: boolean;
  livreur_id: string;
  raw_date?: Date | null;
  ville?: string; // Added for client address
  quartier?: string; // Added for client address
  statut_livraison?: string;
  /** État de la vente : validee, retour_partiel, retournee, annulee (indépendant du paiement). */
  etat?: string;
  /** Abandon du reste impayé : demande en attente, validé ou refusé. */
  abandon_reste?: AbandonReste | null;
  abandon_en_attente?: boolean;
  statut_paiement?: string;
  date_commande?: string;
  methode_paiement?: string;
  client?: {
    nom: string;
    email?: string;
    telephone?: string;
    quartier?: string;
    ville?: string;
  };
  retours?: Array<{
    id: string;
    created_at: string;
    motif: string;
    produits: Array<{
      produit_id: string;
      nom?: string;
      quantite: number;
      is_conditionne?: boolean;
      conditionnement_id?: string;
      conditionnement_nom?: string;
      quantite_par_conditionnement: number;
    }>;
  }>;
}

export const getPaymentStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'payé':
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'en attente':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'annulé':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};