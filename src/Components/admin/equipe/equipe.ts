// Équipe du magasin : types, rôles, appels au serveur et conversion formulaire ⇄ API.
import axios from "axios";
import type { CountryCode } from "libphonenumber-js";
import { getUrlServer } from "../../../configServer";
import {
  PAYS_PAR_DEFAUT, decouperNumero, numeroInternational, numeroValide,
} from "../livaision/livraisonfinal/TelephoneInternational";

export type Role = "admin" | "manager" | "gerant" | "livreur" | "caissier" | "staff";
export type RoleCreable = "manager" | "gerant" | "caissier";

export interface Membre {
  _id: string;
  /** Double authentification activée (indicateur seulement). */
  deux_facteurs?: boolean;
  name: string;
  first_name: string;
  email: string;
  role: Role;
  is_active?: boolean;
  telephone?: string;
  sexe?: string;
  date_naissance?: string;
  fonction?: string;
  pays?: string;
  ville?: string;
  quartier?: string;
  adresse?: string;
  piece_identite?: { type?: string; numero?: string };
  contact_urgence?: { nom?: string; lien?: string; telephone?: string };
  date_embauche?: string;
  notes?: string;
  poste_caisse?: string;
  nom_boutique?: string;
  boutique?: {
    nom?: string; type?: string; telephone?: string; pays?: string; ville?: string; quartier?: string;
    adresse?: string; horaires?: string; description?: string;
  };
  created_at?: string | { $date: string };
}

export const ROLES: Record<RoleCreable | "admin", {
  libelle: string; court: string; description: string; droits: string[]; badge: string; fond: string; texte: string;
  endpoint?: string; fonctions: string[];
}> = {
  admin: {
    libelle: "Administrateur", court: "Admin", description: "Propriétaire du compte du magasin.",
    droits: ["Accès complet, comptabilité comprise"], badge: "bg-purple-50 text-purple-950 ring-purple-200",
    fond: "bg-purple-100", texte: "text-purple-950", fonctions: [],
  },
  manager: {
    libelle: "Manager", court: "Manager",
    description: "Gère le magasin avec vous : ventes, stock, clients et équipe.",
    droits: ["Ventes, produits, approvisionnements", "Clients, rapports, caisses", "Pas d'accès à la comptabilité"],
    badge: "bg-sky-50 text-sky-800 ring-sky-200", fond: "bg-sky-100", texte: "text-sky-800",
    endpoint: "/users/create_manager",
    fonctions: ["Manager du magasin", "Responsable des ventes", "Responsable des stocks", "Adjoint du gérant"],
  },
  gerant: {
    libelle: "Gérant de boutique", court: "Gérant",
    description: "Tient une sous-boutique avec le stock que le magasin lui confie.",
    droits: ["Vend depuis le stock de sa boutique", "Gère ses clients et ses dettes", "Voit ses propres chiffres"],
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200", fond: "bg-emerald-100", texte: "text-emerald-800",
    endpoint: "/users/create_gerant",
    fonctions: ["Gérant de boutique", "Responsable de point de vente", "Commercial terrain", "Vendeur ambulant"],
  },
  caissier: {
    libelle: "Caissier", court: "Caissier",
    description: "Vend au comptoir depuis le stock du magasin et ne voit que ses propres ventes.",
    droits: ["Ouvre et ferme sa caisse", "Vend au prix du catalogue", "Annule une erreur dans les 15 minutes"],
    badge: "bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200", fond: "bg-fuchsia-100", texte: "text-fuchsia-800",
    endpoint: "/users/create_caissier",
    fonctions: ["Caissier", "Caissière", "Chef de caisse", "Vendeur au comptoir"],
  },
};

export const roleDe = (role?: string): RoleCreable | "admin" =>
  role === "livreur" ? "gerant" : role === "manager" || role === "gerant" || role === "caissier" ? role : "admin";

export const PIECES = ["CNI", "Passeport", "Carte de séjour", "Permis de conduire", "Carte consulaire", "Autre"];
export const TYPES_BOUTIQUE = ["Boutique", "Kiosque", "Supérette", "Supermarché", "Dépôt", "Entrepôt",
  "Point de vente mobile", "Stand de marché", "Pharmacie", "Autre"];
export const LIENS_URGENCE = ["Conjoint(e)", "Père", "Mère", "Frère", "Sœur", "Enfant", "Ami(e)", "Autre"];

export const nomComplet = (m: Pick<Membre, "name" | "first_name">) =>
  `${(m.first_name || "").trim()} ${(m.name || "").trim()}`.trim() || "Utilisateur";

export const dateCreation = (m: Membre) => {
  const brut = typeof m.created_at === "object" && m.created_at ? m.created_at.$date : m.created_at;
  const d = brut ? new Date(brut) : null;
  return d && !isNaN(d.getTime()) ? d : null;
};

/* ------------------------------------------------------------------ */
/* Formulaire                                                           */
/* ------------------------------------------------------------------ */

export interface Tel { pays: CountryCode; chiffres: string }
export interface FormMembre {
  name: string; first_name: string; email: string; telephone: Tel; sexe: string; date_naissance: string;
  piece_type: string; piece_numero: string; ville: string; quartier: string; adresse: string;
  fonction: string; date_embauche: string; poste_caisse: string;
  urgence_nom: string; urgence_lien: string; urgence_tel: Tel; notes: string;
  boutique: { nom: string; type: string; tel: Tel; ville: string; quartier: string; adresse: string; horaires: string; description: string };
}

const tel = (numero?: string, pays: CountryCode = PAYS_PAR_DEFAUT): Tel =>
  numero ? decouperNumero(numero, pays) : { pays, chiffres: "" };

export const formVide = (pays: CountryCode = PAYS_PAR_DEFAUT): FormMembre => ({
  name: "", first_name: "", email: "", telephone: tel(undefined, pays), sexe: "", date_naissance: "",
  piece_type: "", piece_numero: "", ville: "", quartier: "", adresse: "", fonction: "", date_embauche: "",
  poste_caisse: "", urgence_nom: "", urgence_lien: "", urgence_tel: tel(undefined, pays), notes: "",
  boutique: { nom: "", type: "Boutique", tel: tel(undefined, pays), ville: "", quartier: "", adresse: "", horaires: "", description: "" },
});

export const formDepuisMembre = (m: Membre): FormMembre => {
  const pays = ((m.pays as CountryCode) || PAYS_PAR_DEFAUT);
  const base = formVide(pays);
  return {
    ...base,
    name: m.name || "", first_name: m.first_name || "", email: m.email || "",
    telephone: tel(m.telephone, pays), sexe: m.sexe || "", date_naissance: m.date_naissance || "",
    piece_type: m.piece_identite?.type || "", piece_numero: m.piece_identite?.numero || "",
    ville: m.ville || "", quartier: m.quartier || "", adresse: m.adresse || "", fonction: m.fonction || "",
    date_embauche: m.date_embauche || "", poste_caisse: m.poste_caisse || "", notes: m.notes || "",
    urgence_nom: m.contact_urgence?.nom || "", urgence_lien: m.contact_urgence?.lien || "",
    urgence_tel: tel(m.contact_urgence?.telephone, pays),
    boutique: {
      nom: m.boutique?.nom || m.nom_boutique || "", type: m.boutique?.type || "Boutique",
      tel: tel(m.boutique?.telephone, (m.boutique?.pays as CountryCode) || pays),
      ville: m.boutique?.ville || "", quartier: m.boutique?.quartier || "", adresse: m.boutique?.adresse || "",
      horaires: m.boutique?.horaires || "", description: m.boutique?.description || "",
    },
  };
};

const numero = (t: Tel) => (t.chiffres ? numeroInternational(t.pays, t.chiffres) : "");

/** Erreur bloquante du formulaire, ou null. */
export const verifierForm = (f: FormMembre, role: RoleCreable | "admin"): string | null => {
  if (!f.first_name.trim() || !f.name.trim()) return "Le nom et le prénom sont obligatoires.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return "L'adresse email n'est pas valide.";
  if (!numeroValide(f.telephone.pays, f.telephone.chiffres)) return "Le numéro de téléphone n'est pas valide pour le pays choisi.";
  if (f.piece_numero.trim() && !f.piece_type) return "Choisissez le type de la pièce d'identité.";
  if (f.urgence_tel.chiffres && !numeroValide(f.urgence_tel.pays, f.urgence_tel.chiffres))
    return "Le téléphone du contact d'urgence n'est pas valide.";
  if ((f.urgence_nom.trim() || f.urgence_lien) && !f.urgence_tel.chiffres) return "Indiquez le téléphone du contact d'urgence.";
  if (role === "gerant") {
    if (!f.boutique.nom.trim()) return "Le nom de la boutique est obligatoire.";
    if (f.boutique.tel.chiffres && !numeroValide(f.boutique.tel.pays, f.boutique.tel.chiffres))
      return "Le téléphone de la boutique n'est pas valide.";
  }
  return null;
};

/** Corps envoyé au serveur. Un champ vide efface la valeur enregistrée (modification). */
export const corpsDepuisForm = (f: FormMembre, role: RoleCreable | "admin") => ({
  name: f.name.trim(), first_name: f.first_name.trim(), email: f.email.trim().toLowerCase(),
  telephone: numero(f.telephone), pays: f.telephone.pays, sexe: f.sexe, date_naissance: f.date_naissance,
  piece_identite: { type: f.piece_type, numero: f.piece_numero.trim() },
  ville: f.ville.trim(), quartier: f.quartier.trim(), adresse: f.adresse.trim(),
  fonction: f.fonction.trim(), date_embauche: f.date_embauche, notes: f.notes.trim(),
  contact_urgence: { nom: f.urgence_nom.trim(), lien: f.urgence_lien, telephone: numero(f.urgence_tel) },
  ...(role === "caissier" ? { poste_caisse: f.poste_caisse.trim() } : {}),
  ...(role === "gerant"
    ? {
        nom_boutique: f.boutique.nom.trim(),
        boutique: {
          nom: f.boutique.nom.trim(), type: f.boutique.type, telephone: numero(f.boutique.tel), pays: f.boutique.tel.pays,
          ville: f.boutique.ville.trim(), quartier: f.boutique.quartier.trim(), adresse: f.boutique.adresse.trim(),
          horaires: f.boutique.horaires.trim(), description: f.boutique.description.trim(),
        },
      }
    : {}),
});

/* ------------------------------------------------------------------ */
/* Serveur                                                              */
/* ------------------------------------------------------------------ */

const entetes = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}` } });
const u = (chemin: string) => `${getUrlServer()}${chemin}`;

export const messageErreur = (e: unknown, defaut = "Une erreur est survenue. Réessayez.") => {
  const d = (e as { response?: { data?: { error?: unknown; message?: unknown } } })?.response?.data;
  const texte = d?.error ?? d?.message;
  return typeof texte === "string" && texte ? texte : defaut;
};

export interface Licence { managers: number; max_managers: number | null; gerants: number; max_gerants: number | null;
  caissiers?: number; max_caissiers?: number | null }

export const apiEquipe = {
  liste: async (): Promise<Membre[]> => (await axios.get(u("/users/"), entetes())).data.users ?? [],
  licence: async (): Promise<Licence | null> => {
    try { return (await axios.get(u("/managers/magasin/profil"), entetes())).data.licence ?? null; } catch { return null; }
  },
  creer: async (role: RoleCreable, corps: object) => (await axios.post(u(ROLES[role].endpoint!), corps, entetes())).data,
  modifier: async (id: string, corps: object) => (await axios.put(u(`/users/${id}`), corps, entetes())).data,
  supprimer: async (id: string) => (await axios.delete(u(`/users/${id}`), entetes())).data,
  invitation: async (id: string) => (await axios.post(u(`/users/${id}/invitation`), {}, entetes())).data,
  reinitialiser: async (id: string) => (await axios.post(u(`/users/reset-password/${id}`), {}, entetes())).data,
};
