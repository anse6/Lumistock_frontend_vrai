// État des ventes et compte client (dette d'ouverture, règlements, abandon du reste).
import axios from "axios";
import { getUrlServer } from "../configServer";

// ---------------------------------------------------------------- état d'une vente
// Cycle de vie du document, indépendant du paiement (comme dans Odoo) : les
// marchandises sortent du stock à la validation, il n'y a pas d'étape
// « en cours de livraison ».
export type EtatVente = "validee" | "retour_partiel" | "retournee" | "annulee";

export const ETATS_VENTE: Record<EtatVente, { libelle: string; couleur: string }> = {
  validee: { libelle: "Validée", couleur: "blue" },
  retour_partiel: { libelle: "Retour partiel", couleur: "orange" },
  retournee: { libelle: "Retournée", couleur: "purple" },
  annulee: { libelle: "Annulée", couleur: "red" },
};

export const etatVente = (etat?: string) =>
  ETATS_VENTE[(etat as EtatVente) in ETATS_VENTE ? (etat as EtatVente) : "validee"];

// ---------------------------------------------------------------- moyens de paiement
export const MODES_REGLEMENT = [
  { value: "cash", label: "Espèces" },
  { value: "om", label: "Orange Money" },
  { value: "momo", label: "MTN MoMo" },
  { value: "bancaire", label: "Banque" },
];

export const formatMontant = (montant: number | undefined | null) =>
  `${(Number(montant) || 0).toLocaleString("fr-FR")} CFA`;

// ---------------------------------------------------------------- compte client
export interface DetteOuverture {
  id: string;
  montant: number;
  montant_paye: number;
  reste: number;
  date_origine: string | null;
  note: string;
  created_at: string | null;
  paiements: { methode: string; montant: number; date: string }[];
}

export interface VenteImpayee {
  livraison_id: string;
  facture: string;
  date: string | null;
  montant_total: number;
  montant_paye: number;
  reste: number;
}

export interface CompteClient {
  client_id: string;
  nom: string;
  dette_ouverture: DetteOuverture | null;
  ventes_impayees: VenteImpayee[];
  total_ventes_impayees: number;
  total_du: number;
  avance: number;
}

export interface Affectation {
  type: "dette_ouverture" | "vente" | "avance";
  libelle: string;
  montant: number;
  reste?: number;
  livraison_id?: string;
}

const entetes = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token") || localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

// Message lisible d'une erreur d'API (le backend répond { error } ou { message }).
export const messageErreur = (erreur: unknown, defaut = "Une erreur est survenue.") => {
  const data = (erreur as { response?: { data?: { error?: unknown; message?: unknown } } })?.response?.data;
  const texte = data?.error ?? data?.message;
  return typeof texte === "string" ? texte : defaut;
};

export const lireCompteClient = async (clientId: string): Promise<CompteClient> =>
  (await axios.get(`${getUrlServer()}/clients/${clientId}/compte`, entetes())).data;

export const definirDetteOuverture = async (
  clientId: string,
  donnees: { montant: number; date_origine?: string | null; note?: string },
): Promise<{ message: string; compte: CompteClient }> =>
  (await axios.put(`${getUrlServer()}/clients/${clientId}/dette-ouverture`, donnees, entetes())).data;

export const reglerClient = async (
  clientId: string,
  montant: number,
  methode: string,
): Promise<{ message: string; affectations: Affectation[]; avance_creditee: number; compte: CompteClient }> =>
  (await axios.post(`${getUrlServer()}/clients/${clientId}/reglements`, { montant, methode }, entetes())).data;

// Répartition prévue d'un règlement, calculée comme le fait le serveur :
// dette d'ouverture, puis ventes de la plus ancienne à la plus récente, le
// surplus sur le compte du client.
export const repartirReglement = (compte: CompteClient, montant: number): Affectation[] => {
  const lignes: Affectation[] = [];
  let reste = Math.max(Number(montant) || 0, 0);
  const prendre = (du: number) => Math.round(Math.min(reste, du) * 100) / 100;
  if (compte.dette_ouverture && compte.dette_ouverture.reste > 0 && reste > 0) {
    const part = prendre(compte.dette_ouverture.reste);
    lignes.push({ type: "dette_ouverture", libelle: "Dette d'avant Lumistock", montant: part,
                  reste: compte.dette_ouverture.reste - part });
    reste -= part;
  }
  for (const vente of compte.ventes_impayees) {
    if (reste <= 0) break;
    const part = prendre(vente.reste);
    lignes.push({ type: "vente", libelle: vente.facture, montant: part, reste: vente.reste - part,
                  livraison_id: vente.livraison_id });
    reste -= part;
  }
  if (reste > 0.004) {
    lignes.push({ type: "avance", libelle: "Avance sur le compte du client", montant: Math.round(reste * 100) / 100 });
  }
  return lignes;
};

// ---------------------------------------------------------------- abandon du reste
export interface AbandonReste {
  statut: "en_attente" | "valide" | "refuse";
  montant: number;
  motif?: string;
  demande_par_nom?: string;
  demande_le?: string;
  valide_par_nom?: string;
  valide_le?: string;
  refuse_par_nom?: string;
  refuse_le?: string;
}

export const abandonnerReste = async (livraisonId: string, motif: string) =>
  (await axios.post(`${getUrlServer()}/livraisons/${livraisonId}/abandonner-reste`, { motif }, entetes())).data;

export const demanderAbandon = async (livraisonId: string, motif: string) =>
  (await axios.post(`${getUrlServer()}/livraisons/${livraisonId}/demander-abandon`, { motif }, entetes())).data;

export const validerAbandon = async (livraisonId: string) =>
  (await axios.post(`${getUrlServer()}/livraisons/valider-ristourne/${livraisonId}`, {}, entetes())).data;

export const refuserAbandon = async (livraisonId: string) =>
  (await axios.post(`${getUrlServer()}/livraisons/rejeter-ristourne/${livraisonId}`, {}, entetes())).data;
