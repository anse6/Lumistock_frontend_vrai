// src/Modules/Authentification/services/session.ts
// Session de l'utilisateur : stockage des tokens, rafraîchissement
// automatique et déconnexion réelle (révocation côté serveur).
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
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
      // Session glissante : le serveur remplace le refresh token passé la
      // moitié de sa durée, pour qu'un utilisateur actif reste connecté.
      if (typeof response.data?.refresh_token === "string") {
        localStorage.setItem("refresh_token", response.data.refresh_token);
      }
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

/** Session terminée sans retour possible : on repart sur la page de connexion. */
const finDeSession = () => {
  effacerSession();
  if (window.location.pathname !== "/login") window.location.href = "/login";
};

/** La requête vise-t-elle le backend avec un token (hors routes de connexion) ? */
const estAppelAuthentifie = (url: string) =>
  url.startsWith(getUrlServer()) && !ROUTES_AUTH.some((r) => url.includes(r));

/** Un token qui expire dans moins de 15 s est renouvelé avant l'envoi. */
const MARGE_ENVOI = 15;

/**
 * En-tête Authorization à utiliser pour une requête qui part maintenant.
 * Si le token de l'en-tête est expiré (ou presque), il est renouvelé AVANT
 * l'envoi : la requête ne part pas pour revenir en 401. Un écran qui avait
 * gardé un ancien token reçoit aussi le token courant.
 * @returns le nouvel en-tête, ou null pour garder celui de la requête.
 */
const enteteAJour = async (entete: string | null): Promise<string | null> => {
  if (!entete?.startsWith("Bearer ") || !localStorage.getItem("refresh_token")) return null;
  const courant = localStorage.getItem("access_token");
  if (secondesRestantes(entete.slice(7)) > MARGE_ENVOI) return null;
  if (courant && secondesRestantes(courant) > MARGE_ENVOI) return `Bearer ${courant}`;
  const token = await rafraichirToken();
  return token ? `Bearer ${token}` : null;
};

/**
 * Renouvelle le token avant l'envoi s'il expire, et sur une réponse 401
 * renouvelle une fois puis rejoue la requête ; si la session est terminée,
 * renvoie vers la page de connexion. Installé sur l'instance axios globale
 * et sur chaque instance créée (``axios.create``), qui n'hérite pas des
 * intercepteurs globaux.
 */
export const brancherSession = (instance: AxiosInstance) => {
  instance.interceptors.request.use(async (config) => {
    const url = `${config.baseURL && !/^https?:/.test(config.url || "") ? config.baseURL : ""}${config.url || ""}`;
    if (estAppelAuthentifie(url)) {
      const entete = await enteteAJour(config.headers.get("Authorization") as string | null);
      if (entete) config.headers.set("Authorization", entete);
    }
    return config;
  });
  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
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
      finDeSession();
      return Promise.reject(error);
    }
    config.headers.set("Authorization", `Bearer ${token}`);
    return instance(config);
  });
  return instance;
};

/**
 * Mêmes règles pour les appels ``fetch`` (une soixantaine d'écrans) : avant,
 * un token expiré y donnait une erreur sans nouvelle tentative.
 */
const installerIntercepteurFetch = () => {
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!estAppelAuthentifie(url)) return fetchOriginal(input, init);

    const entetes = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const avantEnvoi = await enteteAJour(entetes.get("Authorization"));
    if (avantEnvoi) {
      entetes.set("Authorization", avantEnvoi);
      init = { ...init, headers: entetes };
    }
    // Une requête Request ne se lit qu'une fois : copie gardée pour la rejouer.
    const copie = input instanceof Request ? input.clone() : input;
    const reponse = await fetchOriginal(input, init);
    if (reponse.status !== 401 || !entetes.has("Authorization") || !localStorage.getItem("refresh_token")) {
      return reponse;
    }
    const token = await rafraichirToken();
    if (!token) {
      finDeSession();
      return reponse;
    }
    entetes.set("Authorization", `Bearer ${token}`);
    return fetchOriginal(copie, { ...init, headers: entetes });
  };
};

let intercepteurInstalle = false;

/**
 * À appeler une fois au démarrage : renouvellement sur 401 pour axios et
 * fetch, et déconnexion synchronisée entre les onglets.
 */
export const installerIntercepteurSession = () => {
  if (intercepteurInstalle) return;
  intercepteurInstalle = true;
  brancherSession(axios);
  installerIntercepteurFetch();

  // Déconnexion dans un autre onglet : celui-ci ne garde pas une session morte.
  window.addEventListener("storage", (event) => {
    if (event.key === "access_token" && event.newValue === null && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  });
};
