// src/hooks/useEnregistrerLivraison.ts
import { useMutation } from '@tanstack/react-query';
import { postLivraison } from '../api/livraisonApi';

export const useEnregistrerLivraison = (token: string) => {
  return useMutation({
    mutationFn: () => postLivraison(token)
  });
};
