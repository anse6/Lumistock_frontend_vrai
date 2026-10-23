// Appels au serveur pour la caisse (rôle caissier) et le suivi des caisses (admin / manager).
import axios from "axios";
import { getUrlServer } from "../../configServer";
import { formatMontant } from "../../Components/dashboard/theme";

const entetes = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}` } });
const url = (chemin: string) => `${getUrlServer()}/caisse${chemin}`;

/** Message d'erreur clair renvoyé par le serveur ({ error: "..." }). */
export const messageErreur = (e: unknown, defaut = "Une erreur est survenue. Réessayez.") => {
  const d = (e as { response?: { data?: { error?: unknown; message?: unknown } } })?.response?.data;
  const texte = d?.error ?? d?.message;
  return typeof texte === "string" && texte ? texte : defaut;
};

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type ModePaiement = "cash" | "om" | "momo" | "bancaire";
export const MODES: { cle: ModePaiement; libelle: string; court: string }[] = [
  { cle: "cash", libelle: "Espèces", court: "Espèces" },
  { cle: "om", libelle: "Orange Money", court: "OM" },
  { cle: "momo", libelle: "MTN MoMo", court: "MoMo" },
  { cle: "bancaire", libelle: "Banque / carte", court: "Banque" },
];

export interface Conditionnement { id: string; nom: string; facteur: number; prix: number }
export interface ProduitCaisse {
  id: string; nom: string; prix: number; stock: number; unite: string;
  code_barre: string | null; image: string | null; conditionnements: Conditionnement[];
}
export interface CategorieCaisse { id: string | null; nom: string; produits: ProduitCaisse[] }
export interface ClientCaisse { id: string; nom: string; telephone: string; credit: number }

export interface ModeResume { mode: ModePaiement; libelle: string; entrees: number; sorties: number; net: number }
export interface OperationCaisse {
  vente_id: string; facture: string; sens: "entree" | "sortie"; mode: ModePaiement;
  mode_libelle: string; montant: number; date: string | null; nature: string;
}
export interface ResumeSession {
  ventes: number; annulations: number; chiffre_affaires: number; articles: number; panier_moyen: number;
  credit_accorde: number; fond_initial: number; especes_attendues: number; modes: ModeResume[];
  total_entrees: number; total_sorties: number; especes_entrees: number; especes_sorties: number;
  operations: OperationCaisse[];
}
export interface SessionCaisse {
  id: string; caissier_id: string; caissier: string; statut: "ouverte" | "fermee";
  fond_initial: number; note_ouverture: string | null; ouverte_le: string; fermee_le: string | null;
  fermee_par: string | null; fermee_par_caissier: boolean; montant_compte: number | null;
  ecart: number | null; note_fermeture: string | null; resume: ResumeSession;
}

export interface ContexteCaisse {
  caissier: { id: string; nom: string; email: string; barcode_mode: boolean };
  magasin: {
    denomination: string; raison_sociale?: string | null; telephone?: string | null; email?: string | null;
    adresse?: string | null; niu?: string | null; rccm?: string | null; devise: string; logo: string | null;
    forme_juridique?: string | null; adresse_lignes?: string[];
  };
  parametres: { remises_autorisees: boolean; delai_annulation_minutes: number };
  tva: { taux: number | null; pays: string | null };
  client_de_passage_id: string;
  session: SessionCaisse | null;
}

export interface LigneVente {
  produit_id: string; nom: string; quantite: number; prix_unitaire: number; total: number;
  conditionnement?: string; facteur?: number; quantite_conditionnement?: number; prix_conditionnement?: number;
}
export interface Reduction { type: string; libelle: string; mode: string; valeur: number; montant: number; motif?: string }
export interface VenteCaisse {
  id: string; numero: string; date: string; client: { id: string; nom: string; telephone: string; passage: boolean };
  vendeur: string; lignes: LigneVente[]; articles: number; montant_brut: number; reductions: Reduction[];
  total_reductions: number; montant_ht: number; appliquer_tva: boolean; taux_tva: number; montant_tva: number;
  montant_total: number; montant_paye: number; credit_client_utilise: number; reste: number; statut_paiement: string;
  paiements: { mode: ModePaiement; libelle: string; montant: number; date: string | null }[];
  annulee: boolean; annulation?: { date?: string; motif?: string; par_nom?: string; montant_rendu?: number } | null;
  annulable_jusqua: string | null;
}

export interface Apercu {
  montant_brut: number; reductions: Reduction[]; total_reductions: number; appliquer_tva: boolean;
  taux_tva: number; montant_tva: number; montant_total: number; credit_client_utilise: number;
  a_encaisser: number; articles: number;
}

export type Periode = "jour" | "semaine" | "mois" | "personnalisee";
export interface Statistiques {
  periode: { type: Periode; debut: string; fin: string };
  kpis: {
    chiffre_affaires: number; ventes: number; articles: number; panier_moyen: number; encaisse: number;
    rendu: number; annulations: number;
    variations: { chiffre_affaires: number | null; ventes: number | null; panier_moyen: number | null };
  };
  modes: ModeResume[];
  serie: { granularite: "heure" | "jour"; points: { cle: string; libelle: string; chiffre_affaires: number; ventes: number }[] };
  top_produits: { produit_id: string; nom: string; quantite: number; chiffre_affaires: number }[];
  credits: { total: number; clients: { client_id: string; nom: string; reste: number }[] };
}

export interface LignePanier {
  cle: string; produit: ProduitCaisse; conditionnement: Conditionnement | null; quantite: number;
}

/** Lignes du panier au format attendu par le serveur. */
export const lignesPourServeur = (panier: LignePanier[]) =>
  panier.map((l) =>
    l.conditionnement
      ? { produit_id: l.produit.id, conditionnement_id: l.conditionnement.id, quantite_conditionnement: l.quantite }
      : { produit_id: l.produit.id, quantite: l.quantite },
  );

/* ------------------------------------------------------------------ */
/* Appels                                                               */
/* ------------------------------------------------------------------ */

export const api = {
  contexte: async (): Promise<ContexteCaisse> => (await axios.get(url("/contexte"), entetes())).data,
  catalogue: async (): Promise<CategorieCaisse[]> => (await axios.get(url("/catalogue"), entetes())).data,
  clients: async (q: string): Promise<{ client_de_passage_id: string; clients: ClientCaisse[] }> =>
    (await axios.get(url("/clients"), { ...entetes(), params: { q } })).data,
  creerClient: async (data: { nom: string; telephone?: string }): Promise<ClientCaisse> =>
    (await axios.post(url("/clients"), data, entetes())).data,
  apercu: async (data: object): Promise<Apercu> => (await axios.post(url("/apercu"), data, entetes())).data,
  vendre: async (data: object): Promise<VenteCaisse> => (await axios.post(url("/ventes"), data, entetes())).data,
  ventes: async (params: object): Promise<{
    periode: { type: Periode; debut: string; fin: string };
    totaux: { ventes: number; chiffre_affaires: number; encaisse: number; reste: number; annulees: number };
    ventes: VenteCaisse[];
  }> => (await axios.get(url("/ventes"), { ...entetes(), params })).data,
  vente: async (id: string): Promise<VenteCaisse> => (await axios.get(url(`/ventes/${id}`), entetes())).data,
  /** Admin / manager : ticket d'une vente du magasin (vente + en-tête du magasin). */
  ticket: async (id: string): Promise<{ vente: VenteCaisse; magasin: ContexteCaisse["magasin"] }> =>
    (await axios.get(url(`/tickets/${id}`), entetes())).data,
  encaisser: async (id: string, montant: number, methode: ModePaiement): Promise<VenteCaisse> =>
    (await axios.post(url(`/ventes/${id}/paiement`), { montant, methode }, entetes())).data,
  annuler: async (id: string, motif: string, mode: string) =>
    (await axios.post(url(`/ventes/${id}/annuler`), { motif, mode }, entetes())).data,
  statistiques: async (params: object): Promise<Statistiques> =>
    (await axios.get(url("/statistiques"), { ...entetes(), params })).data,
  session: async (): Promise<SessionCaisse | null> => (await axios.get(url("/session"), entetes())).data.session,
  ouvrir: async (fond_initial: number, note?: string): Promise<SessionCaisse> =>
    (await axios.post(url("/session/ouvrir"), { fond_initial, note }, entetes())).data.session,
  fermer: async (montant_compte: number, note?: string): Promise<SessionCaisse> =>
    (await axios.post(url("/session/fermer"), { montant_compte, note }, entetes())).data.session,
  sessions: async (params: object = {}): Promise<{
    sessions: SessionCaisse[];
    totaux: { sessions: number; ouvertes: number; chiffre_affaires: number; ecart_total: number; sessions_avec_ecart: number };
  }> => (await axios.get(url("/sessions"), { ...entetes(), params })).data,
  fermerPourCaissier: async (id: string, montant_compte: number, note: string): Promise<SessionCaisse> =>
    (await axios.post(url(`/sessions/${id}/fermer`), { montant_compte, note }, entetes())).data.session,
  parametres: async () => (await axios.get(url("/parametres"), entetes())).data as ContexteCaisse["parametres"],
  modifierParametres: async (remises_autorisees: boolean) =>
    (await axios.put(url("/parametres"), { remises_autorisees }, entetes())).data as ContexteCaisse["parametres"],
  caissiers: async (): Promise<{
    caissiers: { id: string; nom: string; email: string; actif: boolean; session: SessionCaisse | null;
      aujourdhui: { chiffre_affaires: number; ventes: number; articles: number; panier_moyen: number } }[];
    limite: number; utilises: number;
  }> => (await axios.get(url("/caissiers"), entetes())).data,
};

/* ------------------------------------------------------------------ */
/* Affichage                                                            */
/* ------------------------------------------------------------------ */

export const devise = () => (localStorage.getItem("devise_magasin") || "XAF").toUpperCase();
export const argent = (n: number | null | undefined, d = devise()) => formatMontant(Number(n) || 0, d);
export const heure = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
export const dateHeure = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
export const libelleMode = (m: string) => MODES.find((x) => x.cle === m)?.libelle ?? m;
export const symboleDevise = (d = devise()) => (["XAF", "XOF"].includes(d) ? "FCFA" : d);
