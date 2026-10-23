// Données du tableau de bord super-admin (routes /staff/stats/...).
// axios passe par l'intercepteur de session : le token est renouvelé
// automatiquement en cas d'expiration.
import axios from "axios";
import { getUrlServer } from "../../../configServer";

export type Jours = 7 | 30 | 90 | 365;
export type Granularite = "jour" | "semaine" | "mois" | "annee";
export type Metrique = "connexions" | "livraisons" | "produits_livres";
export type StatutMagasin = "actif" | "desactive" | "archive";

export interface VueEnsemble {
  periode: { jours: Jours; debut: string; fin: string; debut_precedente: string };
  kpis: {
    magasins: { total: number; actifs: number; desactives: number; archives: number; nouveaux: number; nouveaux_prec: number };
    utilisateurs: { total: number; actifs: number; inactifs: number; nouveaux: number; nouveaux_prec: number };
    clients: { total: number; nouveaux: number; nouveaux_prec: number };
    produits: { total: number; en_rupture: number };
    ventes: { nombre: number; nombre_prec: number; articles: number; articles_prec: number };
    connexions: { nombre: number; nombre_prec: number; utilisateurs_actifs: number; utilisateurs_actifs_prec: number };
  };
  roles: { role: "admin" | "manager" | "gerant"; total: number; actifs: number }[];
  paiements: {
    statuts: { statut: "payé" | "partiellement payé" | "non payé"; nombre: number }[];
    methodes: { methode: string; nombre: number }[];
  };
  croissance: { mois: string; magasins: number; utilisateurs: number; clients: number; ventes: number }[];
  magasins: MagasinDetail[];
  devises: string[];
}

export interface MagasinDetail {
  id: string;
  denomination: string;
  ville: string;
  pays: string;
  devise: string;
  statut: StatutMagasin;
  cree_le: string | null;
  ventes: number;
  ventes_prec: number;
  chiffre_affaire: number;
  chiffre_affaire_prec: number;
  articles: number;
  clients: number;
  produits: number;
  produits_rupture: number;
  managers: number;
  gerants: number;
  max_managers: number | null;
  max_gerants: number | null;
  derniere_vente: string | null;
  derniere_activite: string | null;
  jours_sans_activite: number | null;
}

export interface PointSerie {
  date: string;
  count: number;
  debut: string;
  fin: string;
  incomplet: boolean;
}

export interface Utilisation {
  periode: Granularite;
  page: number;
  debut: string;
  fin: string;
  growth_rate: Record<Metrique, number | null>;
  series: Record<Metrique, PointSerie[]>;
  totaux: Record<Metrique, number> & { utilisateurs_actifs: number; magasins_actifs: number };
  totaux_precedents: Record<Metrique, number>;
}

const client = () => {
  const token = localStorage.getItem("access_token");
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

export const fetchVueEnsemble = async (jours: Jours): Promise<VueEnsemble> =>
  (await axios.get(`${getUrlServer()}/staff/stats/vue-ensemble`, { ...client(), params: { jours } })).data;

export const fetchUtilisation = async (granularite: Granularite, page: number): Promise<Utilisation> =>
  (await axios.get(`${getUrlServer()}/staff/stats/utilisation`, { ...client(), params: { granularite, page } })).data;
