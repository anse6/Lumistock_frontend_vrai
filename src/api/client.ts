// Client HTTP unique du backend, à utiliser pour tout nouvel écran (avec
// React Query) : le token à jour est ajouté à chaque requête et la session
// est renouvelée sur une réponse 401 (voir Authentification/services/session).
import axios from "axios";
import { getUrlServer } from "../configServer";
import { brancherSession } from "../Modules/Authentification/services/session";

export const api = brancherSession(axios.create({ baseURL: getUrlServer() }));

api.interceptors.request.use((config) => {
  // Lu à chaque requête : un token renouvelé est pris en compte aussitôt.
  const token = localStorage.getItem("access_token");
  if (token && !config.headers.has("Authorization")) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

/** Message d'erreur renvoyé par le serveur, sinon le message par défaut. */
export const messageErreur = (err: unknown, defaut: string): string =>
  (axios.isAxiosError(err) && (err.response?.data?.error || err.response?.data?.message || err.response?.data?.msg)) ||
  defaut;

/** Code HTTP d'une erreur axios (0 si le serveur n'a pas répondu). */
export const statutErreur = (err: unknown): number => (axios.isAxiosError(err) ? err.response?.status ?? 0 : 0);
