// Chat du site public avec Nansé, l'assistante Lumistock : côté visiteur
// (jeton secret gardé dans le navigateur) et côté staff (boîte de réception).
import axios from "axios";
import { getUrlServer } from "../configServer";

export const NOM_ASSISTANT = "Nansé";

export type AuteurMessage = "visiteur" | "ia" | "conseiller" | "systeme";
export type StatutConversation = "ia" | "attente" | "conseiller" | "fermee";

export interface MessageAssistant {
  id: string;
  auteur: AuteurMessage;
  auteur_nom: string | null;
  texte: string;
  pertinente: boolean | null;
  created_at: string;
}

export interface ConversationVisiteur {
  id: string;
  nom: string;
  statut: StatutConversation;
  statut_libelle: string;
  agent_nom: string | null;
  langue: "fr" | "en";
  messages?: MessageAssistant[];
  nouveaux?: MessageAssistant[];
  jeton?: string;
}

export interface ConversationStaff extends ConversationVisiteur {
  email: string;
  questions_pertinentes: number;
  non_lus: number;
  dernier_message: string | null;
  page: string | null;
  notifie_le: string | null;
  derniere_activite: string | null;
  created_at: string;
  updated_at: string;
  en_ligne: boolean;
}

export interface ListeConversations {
  conversations: ConversationStaff[];
  compteurs: Record<StatutConversation | "tous" | "non_lus", number>;
  statuts: Record<StatutConversation, string>;
  seuil: number;
}

const base = (chemin: string) => `${getUrlServer()}/assistant${chemin}`;

// ----------------------------------------------------------------- visiteur
const CLE_SESSION = "lumistock-assistant";

export interface SessionVisiteur {
  id: string;
  jeton: string;
  nom: string;
  email: string;
}

export const lireSession = (): SessionVisiteur | null => {
  try {
    const brut = localStorage.getItem(CLE_SESSION);
    return brut ? (JSON.parse(brut) as SessionVisiteur) : null;
  } catch {
    return null;
  }
};

export const ecrireSession = (s: SessionVisiteur | null) => {
  try {
    if (s) localStorage.setItem(CLE_SESSION, JSON.stringify(s));
    else localStorage.removeItem(CLE_SESSION);
  } catch {
    /* navigation privée : la conversation ne survivra pas au rechargement */
  }
};

const enteteVisiteur = (jeton: string) => ({ headers: { "X-Assistant-Jeton": jeton } });

export const demarrerConversation = async (data: { nom: string; email: string; langue: string; page: string }) =>
  (await axios.post<ConversationVisiteur>(base("/conversations"), data)).data;

export const lireConversation = async (s: SessionVisiteur, depuis?: string) =>
  (await axios.get<ConversationVisiteur>(base(`/conversations/${s.id}`), { ...enteteVisiteur(s.jeton), params: { depuis } })).data;

export const envoyerMessage = async (s: SessionVisiteur, texte: string) =>
  (await axios.post<ConversationVisiteur>(base(`/conversations/${s.id}/messages`), { texte }, enteteVisiteur(s.jeton))).data;

// ----------------------------------------------------------------- staff
const enteteStaff = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } });

export const listerConversations = async (statut?: string, q?: string) =>
  (await axios.get<ListeConversations>(base("/admin/conversations"), { ...enteteStaff(), params: { statut: statut || undefined, q: q || undefined } })).data;

export const compterConversations = async () => (await axios.get<{ non_lus: number }>(base("/admin/non-lus"), enteteStaff())).data.non_lus;

export const ouvrirConversation = async (id: string) =>
  (await axios.get<ConversationStaff>(base(`/admin/conversations/${id}`), enteteStaff())).data;

export const repondreConversation = async (id: string, texte: string) =>
  (await axios.post<ConversationStaff>(base(`/admin/conversations/${id}/messages`), { texte }, enteteStaff())).data;

export const changerStatutConversation = async (id: string, statut: "ia" | "fermee") =>
  (await axios.patch<ConversationStaff>(base(`/admin/conversations/${id}`), { statut }, enteteStaff())).data;

export const erreurAssistant = (e: unknown, defaut = "Une erreur est survenue.") =>
  (axios.isAxiosError(e) && (e.response?.data?.message || e.response?.data?.error)) || defaut;

export const statutHttp = (e: unknown) => (axios.isAxiosError(e) ? e.response?.status : undefined);

/** Événement envoyé quand une conversation est lue : le menu met sa pastille à jour. */
export const EVENEMENT_ASSISTANT = "lumistock:assistant";
