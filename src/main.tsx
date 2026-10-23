import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import './i18n';
import { installerTraductionInterface } from './traduction/interface';
import { installerIntercepteurSession } from './Modules/Authentification/services/session';

// Renouvelle automatiquement le token sur une réponse 401 (requêtes axios).
installerIntercepteurSession();

// Traduit à l'affichage les textes d'interface écrits en français dans le code.
installerTraductionInterface();

// Création du client React Query
const queryClient = new QueryClient();

// Point d'entrée de l'application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);



