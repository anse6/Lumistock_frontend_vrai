import { Store } from './types';

/** Nombre d'utilisateurs actifs du magasin, par rôle. */
export const compterUtilisateurs = (store: Store) => {
  const actifs = (store.utilisateurs || []).filter((u) => u.is_active !== false);
  return {
    managers: actifs.filter((u) => u.role === 'manager').length,
    gerants: actifs.filter((u) => u.role === 'gerant' || u.role === 'livreur').length,
  };
};
