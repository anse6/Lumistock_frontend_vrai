// src/Modules/Authentification/services/session.ts
// Session de l'utilisateur : stockage des tokens, rafraîchissement
// automatique et déconnexion réelle (révocation côté serveur).
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";
import { getUrlServer } from "../../../configServer";

// Clés liées à la session. La déconnexion n'efface que celles-ci : la langue
// et le thème choisis par l'utilisateur sont conservés.
export const CLES_SESSION = [
  "access_token",
  "refresh_token",
  "email",
  "role",
  "denomination_magasin",
  "logo_magasin",
  "magasin_id",
  "user_id",
];

// Un access token est renouvelé quand il lui reste moins de 2 minutes.
const MARGE_RENOUVELLEMENT = 120;

export const effacerSession = () => {
  CLES_SESSION.forEach((cle) => localStorage.removeItem(cle));
};

/** Secondes avant expiration d'un token (négatif s'il est expiré). */
export const secondesRestantes = (token: string | null): number => {
  if (!token) return -1;
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp - Math.floor(Date.now() / 1000);
  } catch {
    return -1;
  }
};

let rafraichissementEnCours: Promise<string | null> | null = null;

/**
 * Demande un nouvel access token avec le refresh token.
 * Les appels simultanés partagent la même requête.
 * @returns le nouveau token, ou null si la session est terminée.
 */
export const rafraichirToken = (): Promise<string | null> => {
  if (rafraichissementEnCours) return rafraichissementEnCours;
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh || secondesRestantes(refresh) <= 0) return Promise.resolve(null);

  rafraichissementEnCours = axios
    .post(`${getUrlServer()}/auth/refresh`, {}, { headers: { Authorization: `Bearer ${refresh}` } })
    .then((response) => {
      const token = response.data?.access_token;
      if (typeof token !== "string") return null;
      localStorage.setItem("access_token", token);
      return token;
    })
    .catch(() => null)
    .finally(() => {
      rafraichissementEnCours = null;
    });
  return rafraichissementEnCours;
};

/** Renouvelle l'access token s'il expire bientôt. False si la session est finie. */
export const garderSessionActive = async (): Promise<boolean> => {
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  if (!access || !refresh) return false;
  if (secondesRestantes(access) > MARGE_RENOUVELLEMENT) return true;
  return (await rafraichirToken()) !== null;
};

/**
 * Termine la session côté serveur (tokens révoqués) puis côté navigateur.
 * partout : ferme aussi les sessions ouvertes sur les autres appareils (POST /auth/logout_all).
 */
export const deconnecter = async (redirection = "/login", options: { partout?: boolean } = {}) => {
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  if (access) {
    const entetes = { headers: { Authorization: `Bearer ${access}` } };
    if (options.partout) {
      try {
        await axios.post(`${getUrlServer()}/auth/logout_all`, {}, entetes);
      } catch {
        // Déjà fermé côté serveur : on continue la déconnexion de cet appareil.
      }
    }
    try {
      await axios.post(`${getUrlServer()}/auth/logout`, { refresh_token: refresh }, entetes);
    } catch {
      // Session déjà expirée (ou fermée par logout_all) : rien d'autre à révoquer.
    }
  }
  effacerSession();
  window.location.href = redirection;
};

/** Enregistre les nouveaux tokens renvoyés après un changement de mot de passe. */
export const enregistrerTokens = (data: { access_token?: string; refresh_token?: string }) => {
  if (data?.access_token) localStorage.setItem("access_token", data.access_token);
  if (data?.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
};

const ROUTES_AUTH = ["/auth/login", "/auth/refresh", "/auth/logout", "/auth/reset_password", "/auth/forgot_password"];

let intercepteurInstalle = false;

/**
 * Intercepteur global d'axios : sur une réponse 401, renouvelle l'access token
 * une fois et rejoue la requête ; si la session est terminée, renvoie vers la
 * page de connexion.
 */
export const installerIntercepteurSession = () => {
  if (intercepteurInstalle) return;
  intercepteurInstalle = true;

  axios.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _rejoue?: boolean }) | undefined;
    const url = config?.url || "";
    if (error.response?.status !== 401 || !config || config._rejoue || ROUTES_AUTH.some((r) => url.includes(r))) {
      return Promise.reject(error);
    }
    // Pas de session ouverte (page publique) : rien à renouveler.
    if (!localStorage.getItem("refresh_token")) return Promise.reject(error);
    config._rejoue = true;
    const token = await rafraichirToken();
    if (!token) {
      effacerSession();
      window.location.href = "/login";
      return Promise.reject(error);
    }
    config.headers.set("Authorization", `Bearer ${token}`);
    return axios(config);
  });
};
