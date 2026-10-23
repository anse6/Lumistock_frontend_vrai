import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

/** Contexte de la caisse (caissier, magasin, paramètres, session ouverte). */
export const useContexteCaisse = (actif = true) =>
  useQuery({
    enabled: actif,
    queryKey: ["caisse", "contexte"],
    queryFn: async () => {
      const ctx = await api.contexte();
      try {
        localStorage.setItem("devise_magasin", ctx.magasin.devise);
      } catch {
        /* stockage indisponible */
      }
      return ctx;
    },
    staleTime: 30_000,
  });

/** Recharge tout ce qui dépend d'une vente ou de la session. */
export const useRafraichirCaisse = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["caisse"] });
  };
};
