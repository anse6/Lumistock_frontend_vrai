// src/services/api/authService.ts
import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { getUrlServer } from './../../../configServer';
import { deconnecter, effacerSession } from './session';

// Configuration Axios
const api = axios.create({
  baseURL: getUrlServer(),
  withCredentials: true,
});

// Interfaces
export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  role: string;
  /** Double authentification activée : le code est demandé avant d'ouvrir la session. */
  deuxFacteurs?: { jeton: string };
  user?: {
    email: string;
    role: string;
    denomination_magasin?: string;
    logo_magasin?: string | null;
    magasin_id?: string;
  };
}


class AuthManager {
  private static instance: AuthManager;
  private listeners: Array<() => void> = [];

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  setCredentials(data: {
    access_token: string;
    refresh_token?: string;
    email: string;
    role: string;
    denomination_magasin?: string;
    logo_magasin?: string | null;
    magasin_id?: string;
    id?: string;
  }) {
    console.log(' [AuthManager] Setting credentials for user:', data.email);
    localStorage.setItem('access_token', data.access_token);
    console.log(' [AuthManager] access_token saved');

    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
      console.log(' [AuthManager] refresh_token saved');
    }

    localStorage.setItem('email', data.email);
    localStorage.setItem('role', data.role);

    if (data.denomination_magasin) {
      localStorage.setItem('denomination_magasin', data.denomination_magasin);
    }
    if (data.logo_magasin !== undefined) {
      localStorage.setItem('logo_magasin', data.logo_magasin || '');
    }
    if (data.magasin_id) {
      localStorage.setItem('magasin_id', data.magasin_id);
    }
    if (data.id) {
      localStorage.setItem('user_id', data.id);
    }

    console.log(' [AuthManager] Credentials saved');
    this.notifyListeners();
  }

  getAuthState() {
    const access_token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    const denomination_magasin = localStorage.getItem('denomination_magasin');
    const logo_magasin = localStorage.getItem('logo_magasin');
    const magasin_id = localStorage.getItem('magasin_id');
    const user_id = localStorage.getItem('user_id');

    return {
      isAuthenticated: !!(access_token && email && role),
      access_token,
      refresh_token,
      user: {
        email: email || '',
        role: role || '',
        denomination_magasin,
        logo_magasin,
        magasin_id,
        user_id,
      },
    };
  }

  clearCredentials() {
    // Seules les données de session sont effacées (langue et thème conservés).
    effacerSession();
    this.notifyListeners();
  }

  isAuthenticated(): boolean {
    return this.getAuthState().isAuthenticated;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    const language = localStorage.getItem('app_language') || 'fr';

    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      'Accept-Language': language,
      'Content-Type': 'application/json',
    };
  }
}

export const authManager = AuthManager.getInstance();

const enteteLangue = () => ({
  'Content-Type': 'application/json',
  'Accept-Language': localStorage.getItem('app_language') || 'fr',
});

const messageServeur = (error: unknown, defaut: string): string =>
  (axios.isAxiosError(error) && (error.response?.data?.error || error.response?.data?.message)) || defaut;

interface ReponseSession {
  access_token?: string;
  refresh_token?: string;
  email?: string;
  role?: string;
  denomination_magasin?: string;
  logo_magasin?: string | null;
  magasin_id?: string;
  id?: string;
}

// Enregistre la session renvoyée par /auth/login ou /auth/login/2fa.
const ouvrirSession = (data: ReponseSession): LoginResponse => {
  const { access_token, refresh_token, email, role, denomination_magasin, logo_magasin, magasin_id, id } = data;
  if (!access_token || !email || !role) {
    throw new Error('Invalid login response - missing required fields');
  }
  authManager.setCredentials({
    access_token,
    refresh_token,
    email,
    role,
    denomination_magasin,
    logo_magasin,
    magasin_id,
    id,
  });
  return {
    success: true,
    role,
    user: { email, role, denomination_magasin, logo_magasin, magasin_id },
  };
};

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', data, { headers: enteteLangue() });
    if (response.data?.deux_facteurs_requis) {
      return { success: false, role: '', deuxFacteurs: { jeton: response.data.jeton_2fa } };
    }
    return ouvrirSession(response.data);
  } catch (error: unknown) {
    authManager.clearCredentials();
    throw new Error(messageServeur(error, 'Login failed'));
  }
};

/** Seconde étape : code de l'application d'authentification ou code de secours. */
export const loginDeuxFacteurs = async (jeton: string, code: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login/2fa', { jeton_2fa: jeton, code }, { headers: enteteLangue() });
    return ouvrirSession(response.data);
  } catch (error: unknown) {
    const err = new Error(messageServeur(error, 'Code incorrect')) as Error & { status?: number };
    err.status = axios.isAxiosError(error) ? error.response?.status : undefined;
    throw err;
  }
};

export const useLogin = (): UseMutationResult<LoginResponse, Error, LoginData> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: () => {
      authManager.clearCredentials();
      queryClient.clear();
    },
  });
};





export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await api.post('/auth/forgot_password', { email }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': localStorage.getItem('app_language') || 'fr',
      },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Failed to send password reset email';
    throw new Error(errorMessage);
  }
};

export const useForgotPassword = (): UseMutationResult<{ message: string }, Error, string> => {
  return useMutation({ mutationFn: forgotPassword });
};

export const resetPassword = async (data: {
  token: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ message: string }> => {
  try {
    const response = await api.post(`/auth/reset_password/${data.token}`, {
      new_password: data.new_password,
      confirm_password: data.confirm_password,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': localStorage.getItem('app_language') || 'fr',
      },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Failed to reset password';
    throw new Error(errorMessage);
  }
};

export const useResetPassword = (): UseMutationResult<
  { message: string },
  Error,
  { token: string; new_password: string; confirm_password: string }
> => {
  return useMutation({ mutationFn: resetPassword });
};

export const logout = async (): Promise<void> => {
  // Révoque les tokens côté serveur, efface la session et revient à l'accueil.
  await deconnecter('/');
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
    },
  });
};

export const makeAuthenticatedRequest = async (config: any) => {
  return api({
    ...config,
    headers: {
      ...authManager.getAuthHeaders(),
      ...config.headers,
    },
  });
};

export { api };