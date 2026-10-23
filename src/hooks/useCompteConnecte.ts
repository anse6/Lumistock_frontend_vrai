// Utilisateur connecté + son magasin, chargés une seule fois et partagés par
// tous les écrans (Paramètres, en-tête, tableaux de bord…).
//
//   const { utilisateur, magasin, estAdmin, peut } = useCompteConnecte();
//   if (peut("produits.creer")) …
//
// Le cache vit le temps de l'onglet ; `recharger()` le rafraîchit après une
// modification, et la déconnexion (changement de token) le vide.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getUrlServer } from "../configServer";

export type Role = "staff" | "admin" | "manager" | "gerant" | "livreur" | "caissier";

export interface UtilisateurConnecte {
  _id: string;
  name: string;
  first_name: string;
  email: string;
  role: Role;
  magasin_id?: string;
  is_active?: boolean;
  telephone?: string;
  sexe?: string;
  date_naissance?: string;
  fonction?: string;
  barcode_mode?: boolean;
  avatar?: string;
  created_at?: string | { $date?: string };
}

export interface MembreMagasin {
  _id: string;
  name: string;
  first_name: string;
  email: string;
  role: Role;
  is_active?: boolean;
  telephone?: string;
}

export interface MagasinConnecte {
  _id: string;
  denomination: string;
  raison_sociale?: string;
  forme_juridique?: string;
  activité?: string;
  email?: string;
  telephone?: string;
  site_web?: string;
  pays?: string;
  country_code?: string;
  region?: string;
  ville?: string;
  quartier?: string;
  adresse_ligne_1?: string;
  adresse_ligne_2?: string;
  code_postal?: string;
  numero_immatriculation?: string;
  numero_fiscal?: string;
  devise?: string;
  fuseau_horaire?: string;
  logo?: string | null;
  is_active?: boolean;
  created_at?: string | { $date?: string };
  licence?: { max_managers?: number; max_livreurs?: number; max_caissiers?: number };
  utilisateurs?: MembreMagasin[];
}

// Droits configurables par l'admin (Paramètres > Accès). La liste vient du
// serveur (/users/me/permissions), qui applique les mêmes règles : masquer un
// bouton ici évite seulement un clic qui finirait en 403.
export type Permission =
  | "produits.creer" | "produits.importer" | "produits.modifier" | "produits.supprimer"
  | "stock.approvisionner" | "stock.avaries" | "stock.soldes"
  | "clients.supprimer" | "clients.retirer_avance" | "clients.dette_ouverture"
  | "ventes.modifier" | "ventes.annuler" | "ventes.abandon_reste" | "ventes.remises_caisse"
  | "finances.comptabilite" | "finances.parametres"
  | "equipe.gerer" | "magasin.modifier" | "stock.methode" | "messagerie.parametres";

/** Événement envoyé quand l'admin change les droits, pour recharger les écrans ouverts. */
export const EVENEMENT_DROITS = "lumistock:droits";

export const LIBELLES_ROLE: Record<string, string> = {
  staff: "Staff Lumistock",
  admin: "Administrateur",
  manager: "Manager",
  gerant: "Gérant",
  livreur: "Gérant",
  caissier: "Caissier",
};

interface Etat {
  utilisateur: UtilisateurConnecte | null;
  magasin: MagasinConnecte | null;
  permissions: string[];
  chargement: boolean;
  erreur: string | null;
}

let etat: Etat = { utilisateur: null, magasin: null, permissions: [], chargement: false, erreur: null };
let tokenCharge: string | null = null;
let enCours: Promise<void> | null = null;
const abonnes = new Set<() => void>();

const publier = (partiel: Partial<Etat>) => {
  etat = { ...etat, ...partiel };
  abonnes.forEach((f) => f());
};

const lireJson = async (url: string, token: string) => {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.message || data?.error || "Erreur de chargement.");
  return data;
};

const charger = (force = false): Promise<void> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    tokenCharge = null;
    publier({ utilisateur: null, magasin: null, permissions: [], chargement: false, erreur: "Session non trouvée. Veuillez vous reconnecter." });
    return Promise.resolve();
  }
  if (!force && tokenCharge === token && (etat.utilisateur || enCours)) return enCours || Promise.resolve();

  tokenCharge = token;
  publier({ chargement: true, erreur: null });
  enCours = (async () => {
    try {
      const [utilisateur, droits] = await Promise.all([
        lireJson(`${getUrlServer()}/users/me`, token) as Promise<UtilisateurConnecte>,
        lireJson(`${getUrlServer()}/users/me/permissions`, token).catch(() => ({ permissions: [] })),
      ]);
      let magasin: MagasinConnecte | null = null;
      // Le caissier n'a accès qu'à sa caisse : pas de fiche magasin pour lui.
      if (utilisateur.role !== "staff" && utilisateur.role !== "caissier") {
        const data = await lireJson(`${getUrlServer()}/magasin/`, token);
        magasin = data?.magasin || null;
        if (magasin) {
          // Garde l'en-tête de l'application à jour (nom et logo du magasin).
          localStorage.setItem("denomination_magasin", magasin.denomination || "");
          localStorage.setItem("logo_magasin", magasin.logo || "");
        }
      }
      publier({ utilisateur, magasin, permissions: droits?.permissions || [], chargement: false, erreur: null });
    } catch (e) {
      publier({ chargement: false, erreur: e instanceof Error ? e.message : "Une erreur est survenue." });
    } finally {
      enCours = null;
    }
  })();
  return enCours;
};

const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

export const useCompteConnecte = () => {
  const courant = useSyncExternalStore(abonner, () => etat);

  useEffect(() => {
    charger();
    const recharger = () => charger(true);
    window.addEventListener(EVENEMENT_DROITS, recharger);
    return () => window.removeEventListener(EVENEMENT_DROITS, recharger);
  }, []);

  const recharger = useCallback(() => charger(true), []);
  const role = courant.utilisateur?.role;
  const permissions = courant.permissions;
  // L'admin a toujours tous les droits, même avant la fin du chargement.
  const peut = useCallback(
    (permission: Permission) => role === "admin" || role === "staff" || permissions.includes(permission),
    [role, permissions],
  );

  return {
    ...courant,
    role,
    libelleRole: role ? LIBELLES_ROLE[role] || role : "",
    nomComplet: `${courant.utilisateur?.first_name || ""} ${courant.utilisateur?.name || ""}`.trim(),
    estAdmin: role === "admin",
    estManager: role === "manager",
    peut,
    recharger,
  };
};

export default useCompteConnecte;
