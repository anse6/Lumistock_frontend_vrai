// Boîte de réception du staff : messages du formulaire de contact public.
import axios from "axios";
import { getUrlServer } from "../configServer";

export type StatutContact = "nouveau" | "en_cours" | "repondu" | "clos";

export interface ResumeContact {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  entreprise: string | null;
  sujet: string;
  sujet_libelle: string;
  statut: StatutContact;
  lu: boolean;
  extrait: string;
  nb_reponses: number;
  created_at: string;
}

export interface DetailContact extends ResumeContact {
  message: string;
  note: string | null;
  reponses: { texte: string; par: string; le: string }[];
  traite_le: string | null;
}

export interface ListeContact {
  messages: ResumeContact[];
  compteurs: Record<StatutContact | "tous" | "non_lus", number>;
  statuts: Record<StatutContact, string>;
}

const entetes = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } });
const url = (chemin = "") => `${getUrlServer()}/contact/messages${chemin}`;

export const listerMessages = async (statut?: string, q?: string): Promise<ListeContact> =>
  (await axios.get(url(), { ...entetes(), params: { statut: statut || undefined, q: q || undefined } })).data;

export const compterNonLus = async (): Promise<number> => (await axios.get(url("/non-lus"), entetes())).data.non_lus;

export const lireMessage = async (id: string): Promise<DetailContact> => (await axios.get(url(`/${id}`), entetes())).data;

export const modifierMessage = async (id: string, data: { statut?: StatutContact; note?: string; lu?: boolean }): Promise<DetailContact> =>
  (await axios.patch(url(`/${id}`), data, entetes())).data;

export const repondreMessage = async (id: string, texte: string): Promise<DetailContact> =>
  (await axios.post(url(`/${id}/repondre`), { texte }, entetes())).data;

export const supprimerMessage = async (id: string): Promise<void> => {
  await axios.delete(url(`/${id}`), entetes());
};

export const erreurContact = (e: unknown, defaut = "Une erreur est survenue.") =>
  (axios.isAxiosError(e) && (e.response?.data?.message || e.response?.data?.error)) || defaut;

/** Événement envoyé quand un message est lu ou traité : le menu met son compteur à jour. */
export const EVENEMENT_CONTACT = "lumistock:contact";
