import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { effacerSession } from './services/session';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiresAuth?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, requiresAuth = true }: ProtectedRouteProps) => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');

  // Si la route demande une authentification et qu'il n'y a pas de token
  if (requiresAuth && !token) {
    effacerSession();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    // Rediriger vers le dashboard selon le rôle
    switch(role) {
      case 'admin':
      case 'manager':
        return <Navigate to="/admin/dashboard" replace />;
      case 'staff':
        return <Navigate to="/superadmin/dashboard" replace />;
      case 'livreur':
      case 'gerant':
        return <Navigate to="/dashboard" replace />;
      case 'caissier':
        return <Navigate to="/caisse" replace />;
      default:
        effacerSession();
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;


