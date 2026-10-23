// Messagerie clients : appels à l'API /messagerie (SMS et emails aux clients).
import axios from "axios";
import { getUrlServer } from "../../configServer";

export type Segment = "debiteurs" | "avances" | "acheteurs" | "tous";
export type Canal = "sms" | "email";

export interface Modele {
  actif: boolean;
  sms: string;
  email_sujet: string;
  email_corps: string;
}

export interface Parametres {
  canaux: Record<Canal, boolean>;
  modeles: Record<Segment, Modele>;
  options: { delai_relance_heures: number; heure_debut_envoi: number; heure_fin_envoi: number };
}

/** Conditions facultatives d'un envoi : dette minimale, ancienneté de la dette. */
export interface Filtres {
  dette_minimum?: number | null;
  anciennete_minimum_jours?: number | null;
}

/** Texte saisi pour un envoi ponctuel, à la place du modèle. */
export type Personnalise = Partial<Pick<Modele, "sms" | "email_sujet" | "email_corps">>;

export interface OptionsEnvoi {
  client_ids?: string[] | null;
  filtres?: Filtres;
  ignorer_delai?: boolean;
  personnalise?: Personnalise | null;
  /** Date et heure locales (ISO) : l'envoi est programmé au lieu d'être immédiat. */
  date_envoi?: string | null;
}

export interface Quota {
  limite: number | null;
  utilises: number;
  restants: number | null;
}

export interface EtatPlateforme {
  sms: { fournisseur: string | null; configure: boolean; simulation: boolean; manquant: string[] };
  email: { configure: boolean };
}

export interface ResumeSegments {
  segments: Record<Segment, { clients: number; joignables_sms: number; joignables_email: number }>;
  total_dette: number;
  total_avances: number;
}

export interface ConfigMessagerie {
  parametres: Parametres;
  segments: Record<Segment, { libelle: string; description: string }>;
  variables: Record<string, string>;
  longueurs_max: { sms: number; email_sujet: number; email_corps: number };
  canaux_plateforme: EtatPlateforme;
  quota: Quota;
  resume: ResumeSegments;
  frequences: Record<Frequence, string>;
  jours_semaine: string[];
}

export type Frequence = "quotidienne" | "hebdomadaire" | "mensuelle";
export type TypeEnvoi = "manuel" | "individuel" | "programme" | "automatique" | "renvoi";

export interface Regle {
  _id: string;
  nom: string;
  segment: Segment;
  segment_libelle: string;
  canaux: Canal[];
  frequence: Frequence;
  jours: number[];
  heure: string;
  filtres: Filtres;
  actif: boolean;
  description: string;
  prochaine_execution: string | null;
  derniere_execution: string | null;
  dernier_resultat?: { date: string; campagne_id?: string; erreur?: string; info?: string } | null;
}

export type NouvelleRegle = Pick<Regle, "nom" | "segment" | "canaux" | "frequence" | "jours" | "heure" | "filtres" | "actif">;

export interface EnvoiProgramme {
  _id: string;
  segment: Segment;
  segment_libelle: string;
  canaux: Canal[];
  date_prevue: string;
  statut: "programme" | "en_cours" | "envoye" | "echec" | "annule";
  type_envoi: TypeEnvoi;
  clients: string[] | null;
  filtres: Filtres;
  personnalise: boolean;
  campagne_id: string | null;
  erreur: string | null;
}

export interface SituationClient {
  client_id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  dette: number;
  avance: number;
  segments: Segment[];
  ne_pas_contacter: boolean;
  nombre_achats_non_soldes: number;
}

export interface MessageCanal {
  texte: string;
  sujet?: string;
  caracteres?: number;
  sms?: number;
  encodage?: string;
  joignable: boolean;
  raison: string | null;
}

export interface Destinataire {
  client_id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  dette: number;
  avance: number;
  canaux: Partial<Record<Canal, MessageCanal>>;
}

export interface Apercu {
  segment: Segment;
  modele_actif: boolean;
  destinataires: Destinataire[];
  totaux: Partial<Record<Canal, { joignables: number; sms_factures: number | null }>>;
  quota: Quota;
}

export type StatutCampagne = "en_cours" | "terminee" | "interrompue";

export interface Campagne {
  _id: string;
  segment: Segment;
  segment_libelle: string;
  type_envoi: TypeEnvoi;
  type_libelle: string;
  origine: { regle_id?: string; programme_id?: string; campagne_id?: string };
  canaux: Canal[];
  statut: StatutCampagne;
  total: number;
  envoyes: number;
  echecs: number;
  ignores: number;
  auteur?: string;
  created_at: string;
  termine_at?: string | null;
}

export interface MessageEnvoye {
  client_id: string;
  client_nom: string;
  canal: Canal;
  destinataire: string;
  contenu: string;
  sujet?: string;
  statut: "en_attente" | "envoye" | "simule" | "echec";
  erreur?: string | null;
  envoye_at?: string | null;
}

const base = () => `${getUrlServer()}/messagerie`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

/** Message lisible d'une erreur d'API. */
export const messageErreur = (err: unknown, defaut = "Opération impossible.") => {
  const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
  return data?.error || data?.message || defaut;
};

export const getConfig = async (): Promise<ConfigMessagerie> =>
  (await axios.get(`${base()}/parametres`, { headers: headers() })).data;

export const enregistrerParametres = async (parametres: Partial<Parametres>): Promise<Parametres> =>
  (await axios.put(`${base()}/parametres`, parametres, { headers: headers() })).data.parametres;

export const getApercu = async (segment: Segment, canaux: Canal[], options: OptionsEnvoi = {}): Promise<Apercu> =>
  (await axios.post(`${base()}/apercu`, { segment, canaux, ...options }, { headers: headers() })).data;

interface ResultatEnvoi {
  message: string;
  campagne_id?: string;
  programme_id?: string;
}

/** Envoi groupé immédiat, ou programmé si `date_envoi` est fourni. */
export const lancerCampagne = async (segment: Segment, canaux: Canal[], options: OptionsEnvoi = {}) =>
  (await axios.post(`${base()}/campagnes`, { segment, canaux, ...options }, { headers: headers() })).data as ResultatEnvoi;

/** Message à un seul client (immédiat ou programmé). */
export const envoyerAuClient = async (clientId: string, segment: Segment, canaux: Canal[], options: OptionsEnvoi = {}) =>
  (await axios.post(`${base()}/clients/${clientId}/envoyer`, { segment, canaux, ...options }, { headers: headers() }))
    .data as ResultatEnvoi;

export const getSituationClient = async (clientId: string): Promise<SituationClient> =>
  (await axios.get(`${base()}/clients/${clientId}`, { headers: headers() })).data;

export const renvoyerCampagne = async (id: string, date_envoi?: string | null) =>
  (await axios.post(`${base()}/campagnes/${id}/renvoyer`, { date_envoi: date_envoi || undefined }, { headers: headers() }))
    .data as ResultatEnvoi;

export const getProgrammes = async (): Promise<EnvoiProgramme[]> =>
  (await axios.get(`${base()}/programmes`, { headers: headers() })).data.programmes;

export const annulerProgramme = async (id: string) =>
  axios.delete(`${base()}/programmes/${id}`, { headers: headers() });

export const getRegles = async (): Promise<Regle[]> =>
  (await axios.get(`${base()}/regles`, { headers: headers() })).data.regles;

export const creerRegle = async (regle: NouvelleRegle): Promise<Regle> =>
  (await axios.post(`${base()}/regles`, regle, { headers: headers() })).data.regle;

export const modifierRegle = async (id: string, regle: Partial<NouvelleRegle>): Promise<Regle> =>
  (await axios.put(`${base()}/regles/${id}`, regle, { headers: headers() })).data.regle;

export const supprimerRegle = async (id: string) => axios.delete(`${base()}/regles/${id}`, { headers: headers() });

export const executerRegle = async (id: string): Promise<NonNullable<Regle["dernier_resultat"]>> =>
  (await axios.post(`${base()}/regles/${id}/executer`, {}, { headers: headers() })).data.resultat;

export const getCampagnes = async (): Promise<Campagne[]> =>
  (await axios.get(`${base()}/campagnes`, { headers: headers() })).data.campagnes;

export const getCampagne = async (id: string): Promise<Campagne & { messages: MessageEnvoye[] }> =>
  (await axios.get(`${base()}/campagnes/${id}`, { headers: headers() })).data;

export const reprendreCampagne = async (id: string) =>
  (await axios.post(`${base()}/campagnes/${id}/reprendre`, {}, { headers: headers() })).data;

export const envoyerTest = async (segment: Segment, canal: Canal, destinataire: string): Promise<string> =>
  (await axios.post(`${base()}/test`, { segment, canal, destinataire }, { headers: headers() })).data.message;

export const definirPreference = async (clientId: string, ne_pas_contacter: boolean) =>
  axios.put(`${base()}/clients/${clientId}/preference`, { ne_pas_contacter }, { headers: headers() });

// ------------------------------------------------------------------ SMS
// Même calcul que le serveur : 160 caractères par SMS en alphabet GSM,
// 70 dès qu'un caractère spécial (emoji, ê, â, ô…) est présent.
const GSM_BASE =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_ETENDU = "^{}\\[~]|€";

export const compterSms = (texte: string) => {
  const caracteres = Array.from(texte || "");
  const gsm = caracteres.every((c) => GSM_BASE.includes(c) || GSM_ETENDU.includes(c));
  if (gsm) {
    const longueur = caracteres.reduce((n, c) => n + (GSM_ETENDU.includes(c) ? 2 : 1), 0);
    return { caracteres: longueur, sms: longueur <= 160 ? 1 : Math.ceil(longueur / 153), encodage: "GSM" };
  }
  const longueur = caracteres.length;
  return { caracteres: longueur, sms: longueur <= 70 ? 1 : Math.ceil(longueur / 67), encodage: "Unicode" };
};

export const LIBELLES_CANAUX: Record<Canal, string> = { sms: "SMS", email: "Email" };
export const ORDRE_SEGMENTS: Segment[] = ["debiteurs", "avances", "acheteurs", "tous"];

export const LIBELLES_TYPES: Record<TypeEnvoi, string> = {
  manuel: "Envoi groupé",
  individuel: "Message individuel",
  programme: "Envoi programmé",
  automatique: "Relance automatique",
  renvoi: "Renvoi",
};

/** Date choisie dans un DatePicker -> ISO locale sans fuseau (attendu par le serveur). */
export const dateLocaleIso = (d: { format: (f: string) => string }) => d.format("YYYY-MM-DDTHH:mm");

/** Catégorie conseillée pour un client : sa dette d'abord, puis son avance. */
export const segmentConseille = (segments: Segment[]): Segment =>
  (["debiteurs", "avances", "acheteurs"] as Segment[]).find((s) => segments.includes(s)) || "tous";
