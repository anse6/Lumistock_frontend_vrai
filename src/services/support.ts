// Support interne : conversations entre l'administrateur d'un magasin et le
// staff Lumistock. Mêmes routes pour les deux côtés (le serveur limite un
// administrateur à ses propres conversations).
import axios from "axios";
import { getUrlServer } from "../configServer";

export type StatutSupport = "ouverte" | "fermee";
export type AuteurSupport = "admin" | "staff" | "systeme";

export interface MessageSupport {
  id: string;
  auteur: AuteurSupport;
  auteur_nom: string | null;
  texte: string;
  created_at: string;
}

export interface ConversationSupport {
  id: string;
  sujet: string;
  statut: StatutSupport;
  initie_par: "admin" | "staff";
  admin_id: string;
  admin_nom: string;
  magasin_id: string | null;
  magasin_nom: string | null;
  staff_nom: string | null;
  dernier_message: string | null;
  non_lus: number;
  vu_par_autre_le: string | null;
  created_at: string;
  updated_at: string;
  messages?: MessageSupport[];
}

export interface ListeSupport {
  conversations: ConversationSupport[];
  compteurs: Record<StatutSupport | "tous" | "non_lus", number>;
  statuts: Record<StatutSupport, string>;
}

export interface AdminSupport {
  id: string;
  nom: string;
  email: string;
  magasin_id: string | null;
  magasin_nom: string | null;
  actif: boolean;
}

const url = (chemin: string) => `${getUrlServer()}/support${chemin}`;
const entetes = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } });

export const listerSupport = async (statut?: string, q?: string) =>
  (await axios.get<ListeSupport>(url("/conversations"), { ...entetes(), params: { statut: statut || undefined, q: q || undefined } })).data;

export const compterSupport = async () => (await axios.get<{ non_lus: number }>(url("/non-lus"), entetes())).data.non_lus;

export const listerAdmins = async (q?: string) =>
  (await axios.get<{ admins: AdminSupport[] }>(url("/admins"), { ...entetes(), params: { q: q || undefined } })).data.admins;

export const creerSupport = async (data: { sujet: string; texte: string; admin_id?: string }) =>
  (await axios.post<ConversationSupport>(url("/conversations"), data, entetes())).data;

export const ouvrirSupport = async (id: string) => (await axios.get<ConversationSupport>(url(`/conversations/${id}`), entetes())).data;

export const ecrireSupport = async (id: string, texte: string) =>
  (await axios.post<ConversationSupport>(url(`/conversations/${id}/messages`), { texte }, entetes())).data;

export const statutSupport = async (id: string, statut: StatutSupport) =>
  (await axios.patch<ConversationSupport>(url(`/conversations/${id}`), { statut }, entetes())).data;

export const erreurSupport = (e: unknown, defaut = "Une erreur est survenue.") =>
  (axios.isAxiosError(e) && (e.response?.data?.message || e.response?.data?.msg || e.response?.data?.error)) || defaut;

/** Événement envoyé quand une conversation est lue : le menu met sa pastille à jour. */
export const EVENEMENT_SUPPORT = "lumistock:support";
