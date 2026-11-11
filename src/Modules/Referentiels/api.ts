// Fournisseurs et catégories de produits : lecture et mise à jour avec React
// Query, par le client API central (token et renouvellement de session gérés).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

export interface Fournisseur {
  _id: string;
  nom: string;
  telephone?: string;
  email?: string;
  pays?: string;
  ville?: string;
  adresse?: string;
  nb_produits: number;
  created_at?: string;
}

export interface Categorie {
  _id: string;
  nom: string;
  description?: string;
  nb_produits: number;
  created_at?: string;
}

export type FournisseurSaisi = Omit<Fournisseur, "_id" | "nb_produits" | "created_at">;
export type CategorieSaisie = Pick<Categorie, "nom" | "description">;

export const CLE_FOURNISSEURS = ["referentiels", "fournisseurs"] as const;
export const CLE_CATEGORIES = ["referentiels", "categories"] as const;

export const useFournisseurs = () =>
  useQuery({
    queryKey: CLE_FOURNISSEURS,
    queryFn: async () => (await api.get<Fournisseur[]>("/fournisseurs")).data,
  });

export const useCategories = () =>
  useQuery({
    queryKey: CLE_CATEGORIES,
    queryFn: async () => (await api.get<Categorie[]>("/categorie/")).data,
  });

/** Crée (sans id) ou modifie (avec id) un fournisseur. */
export const useEnregistrerFournisseur = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, donnees }: { id?: string; donnees: FournisseurSaisi }) =>
      id ? (await api.put(`/fournisseurs/${id}`, donnees)).data : (await api.post("/fournisseurs", donnees)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_FOURNISSEURS }),
  });
};

export const useSupprimerFournisseur = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/fournisseurs/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_FOURNISSEURS }),
  });
};

/** Crée (sans id) ou modifie (avec id) une catégorie. */
export const useEnregistrerCategorie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, donnees }: { id?: string; donnees: CategorieSaisie }) =>
      id ? (await api.put(`/categorie/${id}`, donnees)).data : (await api.post("/categorie/create", donnees)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_CATEGORIES }),
  });
};

export const useSupprimerCategorie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/categorie/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_CATEGORIES }),
  });
};
