// Relecture d'une vente pour l'écran « Modifier la vente » (admin, manager,
// gérant). Le serveur enregistre une ligne par façon de vendre : 3 bouteilles,
// 2 palettes de 6 (quantité = 12 bouteilles)… On regroupe ces lignes par article.
import { getConditioningId } from "../../approvisonnement/conditioning";

export interface LigneVenteLue {
  produit_id: string;
  nom?: string;
  quantite: number;
  prix: number;
  is_conditionne?: boolean;
  conditionnement_id?: string | null;
  conditionnement_nom?: string | null;
  facteur?: number | null;
  conditionnements?: any[];
  prix_vente_fiche?: number | null;
  quantite_magasin?: number;
  quantite_livreur?: number;
  numeros_serie?: string[];
  suivi_serie?: boolean;
  unite?: string;
  image?: string | null;
}

export interface ArticleEnEdition {
  produit_id: string;
  ligne: LigneVenteLue;
  /** Prix d'une unité vendue seule (pas celui de l'unité dans un carton). */
  prixUnitaire: number;
  unites: number;
  /** Conditionnements vendus : identifiant et nombre de cartons (pas d'unités). */
  cartons: { id: string; nombre: number }[];
  /** Conditionnements proposés, avec le prix d'origine de ceux déjà vendus. */
  conditionnements: any[];
  /** Unités de cet article déjà prises par la vente (elles reviennent si on les retire). */
  unitesDansLaVente: number;
  numerosSerie: string[] | null;
  /** Un carton entamé par un retour (ex. 5 bouteilles d'une palette de 6) :
   *  il ne se décrit pas en cartons entiers, les articles ne sont pas modifiables. */
  cartonEntame: boolean;
}

/** Ligne affichée telle quelle quand les articles de la vente sont figés. */
export interface LigneFigee {
  nom: string;
  detail: string;
  montant: number;
}

/** Lignes lisibles d'une vente : « 2 Palette (6) », « 5 bouteille(s) d'une Palette entamée »… */
export const lignesFigees = (lignes: LigneVenteLue[]): LigneFigee[] =>
  lignes.map((l) => {
    const q = Number(l.quantite) || 0;
    const f = Number(l.facteur) || 1;
    const unite = l.unite || "unité";
    let detail = `${q} ${unite}(s)`;
    if (l.is_conditionne && f > 1) {
      const entiers = Math.floor(q / f);
      const reste = q - entiers * f;
      const nom = l.conditionnement_nom || "Conditionnement";
      detail = [entiers ? `${entiers} ${nom} (${f})` : "", reste ? `${reste} ${unite}(s) d'un ${nom} entamé` : ""]
        .filter(Boolean).join(" + ");
    }
    return { nom: l.nom || "Article", detail, montant: Math.round(q * (Number(l.prix) || 0) * 100) / 100 };
  });

export const regrouperLignesVente = (lignes: LigneVenteLue[]): ArticleEnEdition[] => {
  const parArticle = new Map<string, ArticleEnEdition>();
  for (const l of lignes) {
    let a = parArticle.get(l.produit_id);
    if (!a) {
      a = {
        produit_id: l.produit_id,
        ligne: l,
        prixUnitaire: Number(l.prix_vente_fiche) || 0,
        unites: 0,
        cartons: [],
        conditionnements: (l.conditionnements || []).map((c) => ({ ...c })),
        unitesDansLaVente: 0,
        numerosSerie: null,
        cartonEntame: false,
      };
      parArticle.set(l.produit_id, a);
    }
    const quantite = Number(l.quantite) || 0;
    a.unitesDansLaVente += quantite;
    if (Array.isArray(l.numeros_serie) || l.suivi_serie) {
      a.numerosSerie = [...(a.numerosSerie ?? []), ...(l.numeros_serie ?? [])];
      a.prixUnitaire = Number(l.prix) || a.prixUnitaire;
      continue;
    }
    if (l.is_conditionne && l.conditionnement_id) {
      const facteur = Number(l.facteur) || 1;
      const id = String(l.conditionnement_id);
      if (quantite % facteur !== 0) a.cartonEntame = true;
      a.cartons.push({ id, nombre: Math.floor(quantite / facteur) });
      // Le carton garde le prix de la vente d'origine (le serveur fait de même),
      // même s'il a changé ou disparu de la fiche depuis.
      const prixVendu = Math.round(Number(l.prix) * facteur * 100) / 100;
      const existant = a.conditionnements.find((c) => getConditioningId(c._id) === id);
      if (existant) existant.prix_conditionnement = prixVendu;
      else a.conditionnements.push({ _id: id, nom: l.conditionnement_nom || "Conditionnement", facteur, prix_conditionnement: prixVendu });
    } else {
      a.unites += quantite;
      a.prixUnitaire = Number(l.prix) || a.prixUnitaire; // prix accordé sur cette vente
    }
  }
  return [...parArticle.values()];
};
