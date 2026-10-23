// Onglets détaillés du tableau de bord admin (GET /managers/tableau-de-bord/<onglet>).
import axios from "axios";
import { getUrlServer } from "../../../../configServer";
import type { Jours } from "../api";

interface Base {
  periode: { jours: Jours; debut: string; fin: string; granularite: "jour" | "semaine" | "mois" };
  devise: string;
}

type Flux = { unites: number; valeur: number };
export type FamilleFlux = "approvisionnements" | "retours" | "ventes" | "pertes" | "ajustements";

export interface OngletStock extends Base {
  kpis: {
    valeur_totale: number; valeur_debut: number; variation: number | null;
    valeur_magasin: number; valeur_gerants: number; unites: number;
    produits: number; en_stock: number; ruptures: number; sous_seuil: number; avec_seuil: number;
    dormants: number; valeur_dormante: number; cout_ventes: number;
    rotation: number | null; jours_de_stock: number | null;
  };
  evolution: { date: string; magasin: number; gerants: number }[];
  flux: ({ debut: string } & Record<FamilleFlux, Flux>)[];
  totaux_flux: Record<FamilleFlux, Flux>;
  categories: { nom: string; valeur: number; unites: number; produits: number }[];
  couverture: { id: string; nom: string; stock: number; vendus: number; par_jour: number; jours: number }[];
  dormants: { id: string; nom: string; stock: number; valeur: number; jours: number; jamais_vendu: boolean }[];
  gerants: { id: string; nom: string; unites: number; valeur: number }[];
}

export interface OngletVentes extends Base {
  kpis: {
    ventes: number; ca: number; panier_moyen: number; articles_par_vente: number;
    remises: number; taux_remise: number; retours: number; montant_retours: number; taux_retour: number;
    meilleur_creneau: { jour: number; heure: number; ventes: number } | null;
  };
  chaleur: { ventes: number; ca: number }[][];
  evolution: { debut: string; ventes: number; ca: number; panier_moyen: number | null }[];
  categories: { nom: string; quantite: number; ca: number; marge: number; taux_marge: number | null }[];
  produits: { id: string; nom: string; quantite: number; ca: number; marge: number; taux_marge: number | null }[];
  retours_produits: { id: string; nom: string; quantite: number }[];
}

export interface OngletClients extends Base {
  kpis: {
    clients: number; nouveaux: number; acheteurs: number; fideles: number; taux_fidelite: number | null;
    part_passage: number; a_relancer: number; creances: number;
  };
  evolution: { debut: string; nouveaux: number; fideles: number }[];
  creances: { tranche: string; montant: number; ventes: number }[];
  a_relancer: { id: string; nom: string; telephone?: string | null; jours: number }[];
  villes: { ville: string; clients: number }[];
  meilleurs: { id: string; nom: string; ventes: number; ca: number; derniere: string }[];
}

export interface OngletFinances extends Base {
  kpis: {
    ca: number; ca_variation: number | null; marge: number; taux_marge: number | null;
    resultat: number; resultat_variation: number | null; charges: number; seuil_rentabilite: number | null;
    tva_collectee: number; tva_deductible: number; tva_a_payer: number; dettes_fournisseurs: number;
  };
  cascade: { cle: string; libelle: string; montant: number; type: "total" | "delta" }[];
  mois: { mois: string; ca: number; marge: number; charges: number; resultat: number }[];
  charges: { categorie: string; libelle: string; montant: number }[];
  tresorerie: { entrees: number; sorties: { cle: string; montant: number }[]; total_sorties: number; net: number };
}

export interface MembreEquipe {
  id: string; nom: string; role: string; actif: boolean;
  ventes: number; ca: number; articles: number; encaisse: number; reste: number;
  variation: number | null; panier_moyen: number; part: number;
  stock_unites: number; stock_valeur: number;
  connexions: number; derniere_connexion: string | null;
  serie: { debut: string; ca: number }[];
}

export interface OngletEquipe extends Base {
  membres: MembreEquipe[];
  ca_total: number;
}

export interface Onglets {
  stock: OngletStock;
  ventes: OngletVentes;
  clients: OngletClients;
  finances: OngletFinances;
  equipe: OngletEquipe;
}

export const fetchOnglet = async <K extends keyof Onglets>(onglet: K, jours: Jours): Promise<Onglets[K]> =>
  (
    await axios.get(`${getUrlServer()}/managers/tableau-de-bord/${onglet}`, {
      params: { jours },
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    })
  ).data;
