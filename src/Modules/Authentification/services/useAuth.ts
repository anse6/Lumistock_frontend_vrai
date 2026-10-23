// services/api/useAuth.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authManager } from './authService';

export const useAuth = (allowedRoles?: string[]) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState(() => authManager.getAuthState());
  const [timeLeft, setTimeLeft] = useState(60); 

  useEffect(() => {
    const unsubscribe = authManager.subscribe(() => {
      setAuthState(authManager.getAuthState());
    });

    return unsubscribe;
  }, []);

  // Session timeout timer
  useEffect(() => {
    if (!authState.isAuthenticated) {
      setTimeLeft(60); // Reset timer when not authenticated
      return;
    }

    if (timeLeft <= 0) {
      console.log('[TIMER] Session expired, logging out');
      authManager.clearCredentials();
      navigate('/');
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, authState.isAuthenticated, navigate]);

  useEffect(() => {
    const { isAuthenticated, user } = authState;

    if (!isAuthenticated) {
      console.warn('🔒 Accès refusé : informations manquantes dans localStorage');
      navigate('/');
      setIsLoading(false);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.warn(`🔑 Rôle "${user.role}" non autorisé pour cette page.`);

      switch (user.role) {
        case 'admin':
        case 'manager':
          navigate('/admin/dashboard');
          break;
        case 'staff':
          navigate('/superadmin/dashboard');
          break;
        case 'livreur':
        case 'gerant':
          navigate('/dashboard');
          break;
        default:
          navigate('/');
      }

      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [authState, navigate, allowedRoles]);

  // Format timer as mm:ss
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    role: authState.user.role,
    email: authState.user.email,
    user: authState.user,
    timeLeft: formatTime(timeLeft), // Expose formatted time
    hasRole: (role: string) => authState.user.role === role,
    hasAnyRole: (roles: string[]) => roles.includes(authState.user.role),
  };
};

export const useAuthState = () => {
  const [authState, setAuthState] = useState(() => authManager.getAuthState());

  useEffect(() => {
    const unsubscribe = authManager.subscribe(() => {
      setAuthState(authManager.getAuthState());
    });

    return unsubscribe;
  }, []);

  return authState;
};
