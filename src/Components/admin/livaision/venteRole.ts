// Écrans de vente partagés entre l'admin / le manager et le caissier.
// Pour l'admin et le manager, les valeurs sont celles d'origine (rien ne change).
// Pour le caissier : mêmes écrans, mais ses propres routes serveur (/caisse/...),
// limitées à ses ventes, sans prix d'achat ni options réservées aux responsables.
import { getUrlServer } from "../../../configServer";

export const estCaissier = () => localStorage.getItem("role") === "caissier";

/** Pages du parcours de vente (liste → choix des produits → vente finale). */
export const cheminsVente = () =>
  estCaissier()
    ? {
        liste: "/caisse/ventes",
        selection: "/caisse/ventes/nouvelle",
        finale: "/caisse/ventes/nouvelle/clientselection",
        libelleListe: "Mes ventes",
      }
    : {
        liste: "/admin/dashboard/deliverys",
        selection: "/admin/dashboard/deliverys/develive",
        finale: "/admin/dashboard/deliverys/develive/clientselection",
        libelleListe: null as string | null,
      };

/** Adresses du serveur utilisées par ces écrans. */
export const apiVente = () => {
  const base = getUrlServer();
  return estCaissier()
    ? {
        stock: `${base}/caisse/stock_par_categorie`,
        codeBarre: (code: string) => `${base}/caisse/code-barre/${code}`,
        creer: `${base}/caisse/ventes`,
        liste: `${base}/caisse/livraisons`,
        detail: (id: string) => `${base}/caisse/livraisons/${id}`,
        paiement: (id: string) => `${base}/caisse/livraisons/ajouter-paiement/${id}`,
        annuler: (id: string) => `${base}/caisse/livraisons/${id}`,
      }
    : {
        stock: `${base}/managers/stock_par_categorie`,
        codeBarre: (code: string) => `${base}/produits/code-barre/${code}`,
        creer: `${base}/admin_or_manager/livraisons`,
        liste: `${base}/managers/livraisons`,
        detail: (id: string) => `${base}/livraisons/${id}`,
        paiement: (id: string) => `${base}/livraisons/ajouter-paiement/${id}`,
        annuler: (id: string) => `${base}/livraisons/${id}`,
      };
};
