// Identifiant d'un conditionnement : l'API actuelle (MySQL) l'envoie en texte,
// l'ancienne API Mongo l'envoyait sous la forme { $oid: "..." }.
export type ConditioningId = string | { $oid: string };

export const getConditioningId = (id: ConditioningId | undefined | null): string =>
  typeof id === "string" ? id : id?.$oid ?? "";

interface ConditionnementStock {
  nom: string;
  facteur: number;
}

/** Stock décomposé du plus grand conditionnement à l'unité :
 *  1 040 bouteilles → « 2 Palette + 6 Pack + 2 bouteille ». Vide sans conditionnement. */
export const decomposerStock = (quantite: number, conditionnements: ConditionnementStock[] = [], unite = "unité"): string => {
  const tries = conditionnements.filter((c) => Number(c.facteur) >= 2).sort((a, b) => b.facteur - a.facteur);
  let reste = Math.max(0, Math.floor(Number(quantite) || 0));
  if (!tries.length || reste < tries[tries.length - 1].facteur) return "";
  const parties: string[] = [];
  for (const c of tries) {
    const n = Math.floor(reste / c.facteur);
    if (n > 0) parties.push(`${n} ${c.nom}`);
    reste -= n * c.facteur;
  }
  if (reste > 0) parties.push(`${reste} ${unite}`);
  return parties.join(" + ");
};

/** « 84 × Pack (504) » pour une palette faite de packs, « 6 » sinon. */
export const contenuConditionnement = (c: { facteur: number; contenu_nom?: string | null; contenu_nombre?: number | null }) =>
  c.contenu_nom && c.contenu_nombre ? `${c.contenu_nombre} × ${c.contenu_nom} = ${c.facteur}` : `${c.facteur}`;
