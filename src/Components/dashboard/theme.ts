// Couleurs et formats du tableau de bord super-admin.
//
// La marque (purple-950) sert aux titres, au filtre actif et aux icônes.
// Les séries de données utilisent une palette validée pour le daltonisme
// (violet de la marque en premier, puis orange, turquoise, bleu).
// Les statuts (payé / partiel / non payé) ont leurs propres couleurs,
// toujours accompagnées d'un libellé : jamais la couleur seule.

export const COULEURS = {
  marque: "#3b0764", // purple-950
  marqueDouce: "#f5f3ff", // fond des icônes
  serie1: "#7e22ce", // violet (série principale)
  serie2: "#eb6834", // orange
  serie3: "#1baf7a", // turquoise
  serie4: "#2a78d6", // bleu
  serieClaire: "#d8b4fe", // violet clair (part secondaire d'une barre)
  enCours: "#c4a5e8", // période en cours (pas encore terminée)
  texte: "#0f172a",
  texteSecondaire: "#64748b",
  axe: "#94a3b8",
  grille: "#eef0f3",
  piste: "#f1f0f5", // fond des barres horizontales
  bon: "#0ca30c",
  attention: "#fab219",
  critique: "#d03b3b",
} as const;

// Palettes validées (daltonisme : contrôle automatique, ordre des couleurs compris).
/** Mouvements de stock : entrées au-dessus de zéro, sorties en dessous. */
export const COULEURS_FLUX = {
  approvisionnements: "#1baf7a",
  retours: "#2a78d6",
  ventes: "#7e22ce",
  pertes: "#eb6834",
  ajustements: "#94a3b8",
} as const;
/** Échelle ordonnée (du plus récent au plus ancien / du moins au plus grave). */
export const RAMPE_VIOLETTE = ["#c084fc", "#9333ea", "#6b21a8", "#3b0764"] as const;
/** Cascade : ce qui ajoute, ce qui retire, les totaux. */
export const COULEURS_CASCADE = { hausse: "#1baf7a", baisse: "#eb6834", total: "#3b0764" } as const;

/** Couleur d'une carte de chaleur : du violet très clair (0) au purple-950 (maximum). */
export const couleurChaleur = (ratio: number) => {
  if (ratio <= 0) return "#f8fafc";
  const debut = [237, 233, 254]; // violet-100
  const fin = [59, 7, 100]; // purple-950
  const r = Math.min(Math.max(ratio, 0), 1) ** 0.75;
  const c = debut.map((v, i) => Math.round(v + (fin[i] - v) * r));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

const nombre = new Intl.NumberFormat("fr-FR");

export const formatNombre = (n: number | null | undefined) => nombre.format(n ?? 0);

export const formatCompact = (n: number) =>
  new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const formatMontant = (n: number, devise: string) => {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: devise,
      maximumFractionDigits: ["XAF", "XOF"].includes(devise) ? 0 : 2,
    }).format(n);
  } catch {
    return `${nombre.format(n)} ${devise}`;
  }
};

export const formatMontantCompact = (n: number, devise: string) => {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: devise,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return `${formatCompact(n)} ${devise}`;
  }
};

/** Montant découpé en { nombre, devise } pour afficher la devise en plus petit. */
export const montantEnParties = (n: number, devise: string) => {
  try {
    const parts = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: devise,
      maximumFractionDigits: ["XAF", "XOF"].includes(devise) ? 0 : 2,
    }).formatToParts(n);
    const symbole = parts.filter((p) => p.type === "currency").map((p) => p.value).join("");
    const nombre = parts.filter((p) => p.type !== "currency").map((p) => p.value).join("").trim();
    return { nombre, devise: symbole || devise };
  } catch {
    return { nombre: nombre.format(n), devise };
  }
};

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** "2026-10" -> "oct." (ou "oct. 26" avec l'année). */
export const libelleMois = (cle: string, avecAnnee = false) => {
  const [annee, mois] = cle.split("-").map(Number);
  const libelle = MOIS[(mois || 1) - 1];
  return avecAnnee ? `${libelle} ${String(annee).slice(2)}` : libelle;
};

export const formatDate = (iso: string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", options ?? { day: "2-digit", month: "short", year: "numeric" });
};

/** Évolution en % entre deux valeurs ; null quand il n'y a pas de base. */
export const variation = (actuel: number, precedent: number): number | null =>
  precedent ? Math.round(((actuel - precedent) / precedent) * 1000) / 10 : null;

export const LIBELLES_PERIODE: Record<number, string> = {
  7: "7 derniers jours",
  30: "30 derniers jours",
  90: "90 derniers jours",
  365: "12 derniers mois",
};
