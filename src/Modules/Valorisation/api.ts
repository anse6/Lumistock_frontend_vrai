// Valorisation d'un article : lots d'achat, coût d'achat et valeur du stock
// selon la méthode du magasin (CMUP, FIFO ou LIFO).
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";

export type Methode = "CMUP" | "FIFO" | "LIFO";

export interface Lot {
  id: string;
  date: string;
  origine: string;
  quantite_initiale: number;
  quantite_restante: number;
  prix_unitaire: number;
}

export interface Valorisation {
  methode: Methode;
  methode_nom: string;
  cout_achat: number;
  dernier_prix_achat: number;
  cout_modifiable: boolean;
  quantite_valorisee: number;
  valeur_stock: number;
  cout_moyen: number;
  cout_prochaine_sortie: number;
  lots: Lot[];
}

export const cleValorisation = (articleId?: string) => ["valorisation", articleId];

export const useValorisation = (articleId?: string, actif = true) =>
  useQuery({
    queryKey: cleValorisation(articleId),
    queryFn: async () => (await api.get<Valorisation>(`/produits/${articleId}/valorisation`)).data,
    enabled: Boolean(articleId) && actif,
  });

/** Coût d'achat après une entrée de `quantite` unités payées `prix` l'unité.
 *  Valable pour les trois méthodes : le coût d'achat est toujours la valeur
 *  du stock restant divisée par sa quantité (comme dans Odoo). */
export const coutApresEntree = (v: Valorisation, quantite: number, prix: number) => {
  const q = v.quantite_valorisee + quantite;
  return q > 0 ? (v.valeur_stock + quantite * prix) / q : prix;
};

export const formatMontant = (n: number) =>
  (Math.round((n ?? 0) * 100) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
