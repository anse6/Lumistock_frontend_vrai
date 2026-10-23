
// import axios from 'axios';
// import { getUrlServer } from './../../../configServer';
// import { refreshToken, authManager } from './authService';

// const api = axios.create({
//   baseURL: getUrlServer(),
//   withCredentials: true,
// });

// let isRefreshing = false;
// let failedQueue: Array<{
//   resolve: (value: any) => void;
//   reject: (reason?: any) => void;
// }> = [];

// const processQueue = (error: any, token: string | null = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error);
//     } else if (token) {
//       prom.resolve(token);
//     }
//   });
//   failedQueue = [];
// };

// // Intercepteur de requêtes
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('access_token');
//     const url = config.url || 'URL_INCONNUE';

//     console.log('[REQUEST] === REQUÊTE SORTANTE ===');
//     console.log('[REQUEST] Method:', config.method?.toUpperCase());
//     console.log('[REQUEST] URL:', url);
//     console.log('[REQUEST] BaseURL:', config.baseURL);
//     console.log('[REQUEST] Full URL:', `${config.baseURL}${url}`);
//     console.log('[REQUEST] Headers avant ajout token:', config.headers);
//     console.log('[REQUEST] Data:', config.data);
//     console.log('[REQUEST] Token disponible:', !!token);

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log('[REQUEST] Token ajouté:', token.substring(0, 50) + '...');
//     } else {
//       console.log('[REQUEST] Aucun token disponible pour cette requête');
//     }

//     const language = localStorage.getItem('app_language') || 'fr';
//     config.headers['Accept-Language'] = language;
//     console.log('[REQUEST] Langue:', language);

//     console.log('[REQUEST] Headers finaux:', config.headers);
//     console.log('[REQUEST] === FIN REQUÊTE SORTANTE ===');

//     return config;
//   },
//   (error) => {
//     console.error('[REQUEST] Erreur dans l\'intercepteur de requête:', error);
//     return Promise.reject(error);
//   }
// );

// // Intercepteur de réponses
// api.interceptors.response.use(
//   (response) => {
//     console.log('[RESPONSE] === RÉPONSE REÇUE ===');
//     console.log('[RESPONSE] Status:', response.status);
//     console.log('[RESPONSE] URL:', response.config.url);
//     console.log('[RESPONSE] Data:', response.data);
//     console.log('[RESPONSE] === FIN RÉPONSE ===');
//     return response;
//   },
//   async (error) => {
//     console.log('[RESPONSE] === INTERCEPTEUR D\'ERREUR DÉCLENCHÉ ===');
//     console.log('[RESPONSE] Error object complet:', error);
//     console.log('[RESPONSE] Type d\'erreur:', error.constructor.name);
//     console.log('[RESPONSE] Message:', error.message);

//     if (!error.response) {
//       console.log('[RESPONSE] Erreur de réseau ou pas de réponse du serveur');
//       console.log('[RESPONSE] Error code:', error.code);
//       console.log('[RESPONSE] Error config:', error.config);
//       return Promise.reject(error);
//     }

//     console.log('[RESPONSE] === ERREUR HTTP INTERCEPTÉE ===');
//     console.log('[RESPONSE] Status:', error?.response?.status);
//     console.log('[RESPONSE] Status Text:', error?.response?.statusText);
//     console.log('[RESPONSE] Data:', error?.response?.data);
//     console.log('[RESPONSE] Headers:', error?.response?.headers);
//     console.log('[RESPONSE] Config URL:', error?.config?.url);
//     console.log('[RESPONSE] Config Method:', error?.config?.method);

//     const originalRequest = error.config;
//     const isUnauthorized = error.response?.status === 401;
//     const url = error.config?.url ?? 'URL_INCONNUE';
//     const isLoginOrRegisterRoute = ['/auth/login', '/auth/register', '/auth/refresh'].some((path) =>
//       url.includes(path)
//     );
      
//     if (isUnauthorized && !isLoginOrRegisterRoute && !originalRequest._retry) {
//       console.error('[401] ERREUR 401 - NON AUTORISÉ');
//       console.error('[401] URL:', url);
//       console.error('[401] Méthode:', error.config?.method?.toUpperCase());
//       console.error('[401] Status:', error.response.status);
//       console.error('[401] Message serveur:', error.response.data?.message || error.response.data?.error || 'Aucun message disponible');
//       console.error('[401] Depuis le backend:', error.response.data);

//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             return api(originalRequest);
//           })
//           .catch((err) => Promise.reject(err));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const newAccessToken = await refreshToken();
//         isRefreshing = false;
//         processQueue(null, newAccessToken);
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         isRefreshing = false;
//         processQueue(refreshError);
//         console.log('[401] Refresh token failed, logging out');
//         authManager.clearCredentials();
//         window.location.href = '/';
//         return Promise.reject(refreshError);
//       }
//     }

//     if (isUnauthorized && !isLoginOrRegisterRoute) {
//       console.log('[401] Token expiré ou invalide, déconnexion automatique');
//       authManager.clearCredentials();
//       window.location.href = '/';
//     }

//     console.log('[RESPONSE] Rejet de l\'erreur');
//     return Promise.reject(error);
//   }
// );

// export default api;