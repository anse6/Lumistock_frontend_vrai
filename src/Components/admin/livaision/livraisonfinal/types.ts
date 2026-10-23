import { Produit } from "../../proapprov/types";
import type { AbandonReste } from "../../../../services/ventes";

export interface Order {
  livraison_id: string;
  montant_total: number;
  montant_produits: number;
  nom_livreur: string;
  notes: string;
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
  // Réductions commerciales : montant_brut − total_reductions = montant_produits
  montant_brut?: number;
  reductions?: Array<{
    type: "rabais" | "remise" | "ristourne";
    libelle: string;
    mode: "pourcentage" | "montant";
    valeur: number;
    motif?: string;
    base: number;
    montant: number;
  }>;
  total_reductions?: number;
  relicat: number;
  retour: number;
  status: string;
  produits: Produit[];
  email: string;
  telephone: string;
  isDeleted?: boolean;
  isDeleting?: boolean;
  livreur_id: string;
  /** Rôle du vendeur : caissier, gerant, manager, admin. */
  vendeur_role?: string;
  /** Caissier : fin du délai pendant lequel il peut annuler la vente. */
  annulable_jusqua?: string | null;
  raw_date?: Date | null;
  client: {
    nom: string;
    email?: string;
    telephone?: string;
    quartier?: string;
    ville?: string;
  };
  statut_livraison?: string;
  /** État de la vente : validee, retour_partiel, retournee, annulee (indépendant du paiement). */
  etat?: string;
  /** Abandon du reste impayé : demande en attente, validé ou refusé. */
  abandon_reste?: AbandonReste | null;
  abandon_en_attente?: boolean;
  statut_paiement?: string;
  date_commande?: string;
  methode_paiement?: string;
  paiements?: { methode: string; montant: number }[];
  dette_ancienne?: number;
  remboursements?: {
    date: string;
    montant: number;
    mode: string;
    mode_libelle?: string;
    reference?: string | null;
    telephone?: string | null;
    motif?: string;
    par_nom?: string | null;
  }[];
  have_retour?: boolean;
  /** TVA du pays du magasin, ajoutée au montant net (montant_produits = HT). */
  appliquer_tva?: boolean;
  taux_tva?: number;
  montant_tva?: number;
  /** Frais de retour déjà retenus sur cette vente (inclus dans le total). */
  frais_retour?: number;
  /** Part payée avec le crédit du compte client (restituée à l'annulation). */
  montant_deduit_caisse?: number;
  /** Cumul déjà rendu au client après retour. */
  montant_rembourse?: number;
  /** Valeur cumulée des marchandises retournées. */
  montant_retourne?: number;
  /** Vente annulée (corbeille). */
  deleted_at?: string | null;
  annulation?: {
    date: string;
    par_nom?: string | null;
    motif?: string;
    montant_rendu: number;
    mode?: string | null;
    mode_libelle?: string | null;
    reference?: string | null;
    telephone?: string | null;
    credit_restitue?: number;
  } | null;
  retours?: Array<{
    id: string;
    created_at: string;
    motif: string;
    /** Valeur nette des articles retournés. */
    montant_retour?: number | null;
    montant_a_rembourser?: number | null;
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