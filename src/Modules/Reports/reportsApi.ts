// Appels et types des rapports (/rapports/...). Tous les montants sont dans
// la devise du magasin ; les dates sont au format ISO.
import { getUrlServer } from "../../configServer";

export type StatutVente = "paye" | "partiel" | "non_paye";
export type Famille = "approvisionnements" | "ventes" | "retours" | "pertes" | "livreurs" | "ajustements";
export type EtatStock = "en_stock" | "critique" | "rupture";

export interface Option {
  id: string;
  nom: string;
}

export interface LigneVente {
  produit_id: string;
  nom: string;
  quantite: number;
  prix: number;
  total: number;
  marge: number;
}

export interface Vente {
  id: string;
  facture: string;
  date: string;
  client: { id: string | null; nom: string; telephone: string };
  vendeur: { id: string | null; nom: string };
  articles: number;
  lignes: LigneVente[];
  montant_brut: number;
  reductions: number;
  montant_ht: number;
  taux_tva: number;
  montant_tva: number;
  montant_ttc: number;
  dette_ancienne: number;
  montant_total: number;
  montant_paye: number;
  reste: number;
  montant_retourne: number;
  montant_rembourse: number;
  cout_achat: number;
  marge: number;
  statut: StatutVente;
  methode_paiement: string;
}

export interface RapportVentes {
  periode: { debut: string; fin: string };
  totaux: {
    ventes: number;
    articles: number;
    montant_brut: number;
    reductions: number;
    montant_ht: number;
    montant_tva: number;
    montant_ttc: number;
    montant_total: number;
    montant_paye: number;
    reste: number;
    montant_retourne: number;
    montant_rembourse: number;
    cout_achat: number;
    marge: number;
    panier_moyen: number;
    taux_marge: number;
  };
  par_statut: Record<StatutVente, { nombre: number; montant: number }>;
  par_jour: { date: string; montant: number }[];
  top_produits: { nom: string; quantite: number; montant: number; marge: number }[];
  ventes: Vente[];
  options: { clients: Option[]; vendeurs: Option[]; produits: Option[] };
}

export interface Operation {
  vente_id: string;
  facture: string;
  client: string;
  date: string;
  sens: "entree" | "sortie";
  mode: string;
  mode_libelle: string;
  montant: number;
  nature: string;
  detail: string;
  par: string | null;
}

export interface RapportEncaissements {
  periode: { debut: string; fin: string };
  totaux: { entrees: number; sorties: number; credits_clients: number; net: number; operations: number };
  par_mode: { mode: string; libelle: string; entrees: number; sorties: number; net: number; operations: number }[];
  operations: Operation[];
}

export interface Mouvement {
  date: string;
  produit_id: string;
  produit: string;
  unite: string;
  produit_supprime: boolean;
  type: string;
  famille: Famille;
  libelle: string;
  quantite: number;
  valeur: number;
  par: string | null;
  detail: string;
}

export interface RapportMouvements {
  periode: { debut: string; fin: string };
  totaux: { operations: number; entrees: number; sorties: number; solde: number; produits: number };
  par_famille: { famille: Famille; libelle: string; entrees: number; sorties: number; operations: number }[];
  mouvements: Mouvement[];
}

export interface LigneStockAnnuel {
  produit_id: string;
  produit: string;
  categorie: string;
  unite: string;
  supprime: boolean;
  stock_initial: number;
  creation: number;
  approvisionnements: number;
  retours: number;
  ventes: number;
  pertes: number;
  livreurs: number;
  ajustements: number;
  entrees: number;
  sorties: number;
  stock_final: number;
  prix_achat: number;
  valeur_initiale: number;
  valeur_finale: number;
  valeur_ventes_cout: number;
  mouvements: number;
}

export interface RapportStockAnnuel {
  annee: number;
  annees: number[];
  categories: Option[];
  totaux: Omit<LigneStockAnnuel, "produit_id" | "produit" | "categorie" | "unite" | "supprime" | "prix_achat"> & {
    produits: number;
    produits_mouvementes: number;
    rotation: number;
  };
  mois: { mois: number; entrees: number; sorties: number; ventes: number; approvisionnements: number }[];
  produits: LigneStockAnnuel[];
  anomalies: { produit: string; message: string }[];
}

export interface LigneInventaire {
  produit_id: string;
  produit: string;
  reference: string;
  categorie: string;
  unite: string;
  quantite: number;
  seuil_alerte: number | null;
  prix_achat: number;
  prix_vente: number;
  valeur_achat: number;
  valeur_vente: number;
  marge_potentielle: number;
  etat: EtatStock;
  date_peremption: string | null;
  /** Un autre produit porte le même nom. */
  doublon: boolean;
}

export interface RapportInventaire {
  date: string;
  categories: Option[];
  totaux: {
    produits: number;
    quantite: number;
    valeur_achat: number;
    valeur_vente: number;
    marge_potentielle: number;
    en_stock: number;
    critique: number;
    rupture: number;
    doublons: number;
  };
  doublons: string[];
  produits: LigneInventaire[];
}

/** GET /rapports/<chemin> ; les paramètres vides ne sont pas envoyés. */
export async function lireRapport<T>(
  chemin: string,
  params: Record<string, string | number | boolean | null | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([cle, valeur]) => {
    if (valeur !== undefined && valeur !== null && valeur !== "" && valeur !== false) query.set(cle, String(valeur));
  });
  const token = localStorage.getItem("access_token");
  const reponse = await fetch(`${getUrlServer()}/rapports/${chemin}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const data = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(data.error || data.message || data.msg || `Erreur ${reponse.status}`);
  return data as T;
}

export const LIBELLES_STATUT: Record<StatutVente, string> = {
  paye: "Payée",
  partiel: "Partielle",
  non_paye: "Non payée",
};

export const LIBELLES_FAMILLE: Record<Famille, string> = {
  approvisionnements: "Approvisionnements",
  ventes: "Ventes",
  retours: "Retours clients",
  pertes: "Avaries et pertes",
  livreurs: "Stock des livreurs",
  ajustements: "Ajustements",
};

export const LIBELLES_ETAT: Record<EtatStock, string> = {
  en_stock: "En stock",
  critique: "Stock critique",
  rupture: "Rupture",
};

export const MODES_PAIEMENT: { value: string; label: string }[] = [
  { value: "cash", label: "Espèces" },
  { value: "om", label: "Orange Money" },
  { value: "momo", label: "MTN MoMo" },
  { value: "bancaire", label: "Virement / carte" },
  { value: "credit_client", label: "Crédit sur le compte client" },
];

export const MOIS_COURTS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
