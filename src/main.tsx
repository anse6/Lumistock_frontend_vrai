import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import './i18n';
import { installerTraductionInterface } from './traduction/interface';
import { installerIntercepteurSession } from './Modules/Authentification/services/session';
import { statutErreur } from './api/client';

// Renouvelle automatiquement le token sur une réponse 401 (axios et fetch).
installerIntercepteurSession();

// Traduit à l'affichage les textes d'interface écrits en français dans le code.
installerTraductionInterface();

// Création du client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Une requête refusée (401 session finie, 403 droit, 404) ne se répare
      // pas en réessayant : seules les erreurs réseau ou serveur sont relancées.
      retry: (echecs, erreur) => {
        const statut = statutErreur(erreur);
        return !(statut >= 400 && statut < 500) && echecs < 2;
      },
    },
  },
});

// Point d'entrée de l'application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);



