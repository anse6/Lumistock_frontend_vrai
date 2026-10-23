// Double authentification (facultative) du compte connecté : appels au serveur.
import axios from "axios";
import { getUrlServer } from "../configServer";

export interface EtatDeuxFacteurs {
  actif: boolean;
  active_le: string | null;
  codes_secours_restants: number;
}

const entetes = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
});

const url = (chemin: string) => `${getUrlServer()}/auth/2fa${chemin}`;

export const lireEtat = async (): Promise<EtatDeuxFacteurs> => (await axios.get(url(""), entetes())).data;

export const initialiser = async (): Promise<{ secret: string; uri: string }> =>
  (await axios.post(url("/initialiser"), {}, entetes())).data;

export const activer = async (code: string): Promise<EtatDeuxFacteurs & { codes_secours: string[] }> =>
  (await axios.post(url("/activer"), { code }, entetes())).data;

export const desactiver = async (password: string, code: string): Promise<EtatDeuxFacteurs> =>
  (await axios.post(url("/desactiver"), { password, code }, entetes())).data;

export const regenererCodes = async (password: string): Promise<EtatDeuxFacteurs & { codes_secours: string[] }> =>
  (await axios.post(url("/codes-secours"), { password }, entetes())).data;

/** Désactive la double authentification d'un membre de l'équipe (téléphone perdu). */
export const reinitialiserMembre = async (userId: string): Promise<{ message: string }> =>
  (await axios.delete(`${getUrlServer()}/users/${userId}/deux-facteurs`, entetes())).data;

export const messageErreur = (e: unknown, defaut = "Une erreur est survenue.") =>
  (axios.isAxiosError(e) && (e.response?.data?.error || e.response?.data?.message)) || defaut;
