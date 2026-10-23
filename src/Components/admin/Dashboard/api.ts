// Données du tableau de bord de l'admin / du manager (GET /managers/stats/vue-ensemble).
// axios passe par l'intercepteur de session (renouvellement automatique du token).
import axios from "axios";
import { getUrlServer } from "../../../configServer";

export type Jours = 7 | 30 | 90 | 365;

interface Kpi {
  valeur: number;
  precedent: number;
  variation: number | null;
}

export interface ProduitAlerte {
  id: string;
  nom: string;
  quantite: number;
  seuil: number | null;
  image?: string | null;
}

export interface VueMagasin {
  periode: { jours: Jours; debut: string; fin: string; granularite: "jour" | "semaine" | "mois" };
  magasin: { id: string; denomination: string; devise: string };
  kpis: {
    chiffre_affaires: Kpi;
    encaisse: Kpi;
    ventes: Kpi & { articles: number; panier_moyen: number };
    marge: Kpi & { taux: number | null };
    resultat: Kpi & { charges: number };
    creances: { valeur: number; clients: number; en_retard: number };
    retours: { montant: number; nombre: number };
    tva_collectee: number;
  };
  serie: { debut: string; ca: number; encaisse: number; ventes: number }[];
  paiements: {
    statuts: { statut: "payé" | "partiellement payé" | "non payé"; nombre: number }[];
    methodes: { methode: string; montant: number }[];
  };
  top_produits: { id: string; nom: string; quantite: number; montant: number }[];
  top_clients: { id: string; nom: string; ca: number; ventes: number; par_defaut: boolean }[];
  debiteurs: { id: string; nom: string; telephone?: string | null; reste: number; ventes: number; jours: number | null }[];
  vendeurs: { id: string; nom: string; role?: string | null; ventes: number; ca: number; articles: number }[];
  stock: {
    produits: number;
    valeur: number;
    ruptures: number;
    stock_bas: number;
    perimes: number;
    bientot_perimes: number;
    a_reapprovisionner: ProduitAlerte[];
  };
  ventes_recentes: {
    id: string;
    client: string;
    date: string | null;
    montant: number;
    reste: number;
    statut_paiement?: string;
    statut_livraison?: string;
  }[];
}

const entetes = () => {
  const token = localStorage.getItem("access_token");
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

export const fetchVueMagasin = async (jours: Jours): Promise<VueMagasin> =>
  (await axios.get(`${getUrlServer()}/managers/stats/vue-ensemble`, { ...entetes(), params: { jours } })).data;

export interface ConseilsIA {
  insights: string;
  genere_le: string;
  depuis_cache: boolean;
}

/** Analyse de l'IA. `forcer` : refaire l'analyse au lieu de reprendre celle du cache (15 min). */
export const fetchConseilsIA = async (forcer = false): Promise<ConseilsIA> =>
  (await axios.get(`${getUrlServer()}/ai/insights`, { ...entetes(), params: forcer ? { forcer: 1 } : {} })).data;

/** Message d'erreur lisible renvoyé par le serveur (sinon le message par défaut). */
export const messageErreurServeur = (erreur: unknown, defaut: string): string =>
  (axios.isAxiosError(erreur) && typeof erreur.response?.data?.error === "string" && erreur.response.data.error) || defaut;
