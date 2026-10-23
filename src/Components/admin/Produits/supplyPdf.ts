// Génération du « Bon d'approvisionnement » au format PDF (A4).
// Toutes les mesures sont en millimètres.
import { traduirePdf } from "../../../traduction/interface";
import type { jsPDF as JsPDF } from "jspdf";

export interface SupplyPdfPerson {
  nom_complet?: string;
  role?: string;
  email?: string;
  telephone?: string;
}

export interface SupplyPdfProduct {
  nom: string;
  unite?: string;
  quantite: number;
  prix: number;
  prix_achat?: number;
}

export interface SupplyPdfData {
  id: string;
  created_at: string;
  updated_at?: string | null;
  montant: number;
  montant_achat?: number;
  quantite: number;
  produits: SupplyPdfProduct[];
  livreur?: SupplyPdfPerson | null;
  approvisionne_par?: SupplyPdfPerson | null;
  modifie_par?: SupplyPdfPerson | null;
  first_name?: string;
  last_name?: string;
}

export interface SupplyPdfStore {
  denomination?: string;
  raison_sociale?: string;
  forme_juridique?: string;
  numero_immatriculation?: string;
  numero_fiscal?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  adresse_ligne_1?: string;
  adresse_ligne_2?: string;
  quartier?: string;
  ville?: string;
  region?: string;
  pays?: string;
  code_postal?: string;
  devise?: string;
  logo?: string | null;
}

type RGB = [number, number, number];
const PRIMARY: RGB = [59, 21, 88]; // #3b1558, couleur de l'application
const PRIMARY_LIGHT: RGB = [246, 241, 251];
const TEXT: RGB = [31, 30, 41];
const MUTED: RGB = [110, 108, 125];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const FOOTER_TOP = PAGE_H - 18;

// Les polices standard de jsPDF n'affichent que le jeu WinAnsi : on remplace
// les espaces spéciales (insérées par toLocaleString) et on retire les
// caractères non imprimables (emoji…) pour éviter des symboles parasites.
const WINANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/[\u00a0\u202f\u2007\u2009]/g, " ")
    .split("")
    .filter((c) => c.charCodeAt(0) <= 0xff || WINANSI_EXTRA.includes(c))
    .join("")
    .trim();

const formatNumber = (value: number): string => {
  const n = Number(value) || 0;
  const [int, dec] = Math.abs(n).toFixed(Number.isInteger(n) ? 0 : 2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${n < 0 ? "-" : ""}${grouped}${dec ? `,${dec}` : ""}`;
};

const currencyLabel = (devise?: string): string => {
  const code = (devise || "XAF").toUpperCase();
  return code === "XAF" || code === "XOF" ? "FCFA" : code;
};

const formatDate = (iso?: string | null, withTime = true): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (x: number) => String(x).padStart(2, "0");
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return withTime ? `${date} à ${pad(d.getHours())}h${pad(d.getMinutes())}` : date;
};

export const supplyReference = (id: string): string =>
  `APP-${(id || "").slice(-8).toUpperCase()}`;

// ---------------------------------------------------------------------------
// Montant en lettres (français), pour la mention « Arrêté le présent bon… ».
const UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize"];
const TENS = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];

const below100 = (n: number): string => {
  if (n <= 16) return UNITS[n];
  if (n < 20) return `dix-${UNITS[n - 10]}`;
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return TENS[t];
    return u === 1 ? `${TENS[t]} et un` : `${TENS[t]}-${UNITS[u]}`;
  }
  if (n < 80) return n === 71 ? "soixante et onze" : `soixante-${below100(n - 60)}`;
  if (n === 80) return "quatre-vingts";
  return `quatre-vingt-${below100(n - 80)}`;
};

const below1000 = (n: number): string => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let out = "";
  if (h === 1) out = "cent";
  else if (h > 1) out = `${UNITS[h]} cent${r === 0 ? "s" : ""}`;
  if (r) out = out ? `${out} ${below100(r)}` : below100(r);
  return out || "zéro";
};

export const amountInWords = (value: number): string => {
  let n = Math.floor(Math.abs(Number(value) || 0));
  if (n === 0) return "zéro";
  const parts: string[] = [];
  const scales: [number, string, string][] = [
    [1_000_000_000, "milliard", "milliards"],
    [1_000_000, "million", "millions"],
  ];
  for (const [size, one, many] of scales) {
    const q = Math.floor(n / size);
    if (q) {
      parts.push(`${below1000(q)} ${q > 1 ? many : one}`);
      n %= size;
    }
  }
  const thousands = Math.floor(n / 1000);
  if (thousands) {
    // « mille » est invariable et « un mille » ne se dit pas ;
    // « cent » perd son « s » devant « mille » (deux cent mille).
    parts.push(thousands === 1 ? "mille" : `${below1000(thousands).replace(/cents$/, "cent").replace(/vingts$/, "vingt")} mille`);
    n %= 1000;
  }
  if (n) parts.push(below1000(n));
  return parts.join(" ");
};

// ---------------------------------------------------------------------------
// Chargement du logo : converti en PNG via un canvas pour accepter tous les
// formats (PNG, JPG, WEBP, GIF) et conserver ses proportions.
const loadImage = async (url: string): Promise<{ data: string; ratio: number } | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const objectUrl = URL.createObjectURL(await response.blob());
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = objectUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx || !canvas.width || !canvas.height) return null;
      ctx.drawImage(img, 0, 0);
      return { data: canvas.toDataURL("image/png"), ratio: canvas.width / canvas.height };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Éléments graphiques partagés par tous les documents PDF (bon, rapport…).
export const WHITE: RGB = [255, 255, 255];
export const ON_PRIMARY: RGB = [226, 213, 241];
export const LINE: RGB = [234, 228, 242];
export const PDF_RIGHT = PAGE_W - MARGIN;
export { PRIMARY, PRIMARY_LIGHT, TEXT, MUTED, PAGE_W, PAGE_H, MARGIN, CONTENT_W, FOOTER_TOP };
export { clean, formatNumber, currencyLabel, formatDate, loadImage };
export type { RGB };

export const setPdfText = (pdf: JsPDF, size: number, color: RGB = TEXT, style: "normal" | "bold" = "normal") => {
  pdf.setFont("helvetica", style);
  pdf.setFontSize(size);
  pdf.setTextColor(...color);
};

export interface BandTitle {
  kicker: string;
  title: string;
  pill: string;
  /**
   * En-tête clair pour l'impression papier (voir drawPrintHeader). Sur le
   * bandeau violet, le petit texte clair (RCCM, NIU, téléphone, adresse)
   * disparaît en noir et blanc, en économie d'encre ou sur une imprimante de
   * tickets.
   */
  clair?: boolean;
}

/**
 * En-tête d'impression sur fond blanc, en trois colonnes :
 * identité de l'entreprise à gauche, logo au centre, coordonnées à droite ;
 * puis une bande claire avec le type de document et sa référence.
 * Renvoie la hauteur occupée.
 */
const drawPrintHeader = (
  pdf: JsPDF,
  store: SupplyPdfStore,
  logo: { data: string; ratio: number } | null,
  heading: BandTitle,
): number => {
  const top = 11;
  const colW = 64; // gauche et droite ; le logo occupe le centre
  const right = PDF_RIGHT;
  const centreX = PAGE_W / 2;

  // ---- Colonne gauche : identité légale
  const companyName = clean(store.denomination) || "Entreprise";
  setPdfText(pdf, 15, PRIMARY, "bold");
  const nameLines = (pdf.splitTextToSize(companyName, colW) as string[]).slice(0, 2);
  const legal = [clean(store.forme_juridique), clean(store.raison_sociale)].filter(Boolean).join(" · ");
  const gauche: [string, string][] = [
    ...(store.numero_immatriculation ? [["RCCM", clean(store.numero_immatriculation)] as [string, string]] : []),
    ...(store.numero_fiscal ? [["NIU", clean(store.numero_fiscal)] as [string, string]] : []),
  ];
  // ---- Colonne droite : coordonnées
  const adresse = [
    clean(store.adresse_ligne_1), clean(store.adresse_ligne_2), clean(store.quartier),
    [clean(store.code_postal), clean(store.ville)].filter(Boolean).join(" "), clean(store.pays),
  ].filter(Boolean).join(", ");
  setPdfText(pdf, 8.5, TEXT);
  const droite: string[][] = [
    store.telephone ? [`Tél. : ${clean(store.telephone)}`] : [],
    store.email ? [clean(store.email)] : [],
    adresse ? (pdf.splitTextToSize(adresse, colW) as string[]) : [],
  ].filter((l) => l.length);

  const hGauche = nameLines.length * 6 + (legal ? 5 : 0) + gauche.length * 4.6;
  const hDroite = droite.reduce((s, l) => s + l.length * 4.2, 0) + Math.max(droite.length - 1, 0) * 1.2;
  // Logo dans un cercle (border-radius 50 %) : l'image entière tient dans le
  // cercle, sans être rognée, qu'elle soit carrée ou en bannière.
  const diametre = 30;
  const interieur = diametre - 4; // marge entre le bord du cercle et l'image
  const diagonale = logo ? Math.sqrt(logo.ratio * logo.ratio + 1) : 1;
  const logoW = logo ? (interieur * logo.ratio) / diagonale : 0;
  const logoImgH = logo ? interieur / diagonale : 0;
  const blocH = Math.max(hGauche, hDroite, logo ? diametre : 0, 18);

  // Gauche
  let y = top + 5;
  setPdfText(pdf, 15, PRIMARY, "bold");
  pdf.text(nameLines, MARGIN, y);
  y += nameLines.length * 6 - 1;
  if (legal) {
    setPdfText(pdf, 8.5, MUTED, "bold");
    pdf.text(legal, MARGIN, y, { maxWidth: colW });
    y += 5;
  }
  gauche.forEach(([label, valeur]) => {
    setPdfText(pdf, 8.5, MUTED);
    pdf.text(`${label} :`, MARGIN, y);
    setPdfText(pdf, 8.5, TEXT, "bold");
    pdf.text(valeur, MARGIN + pdf.getTextWidth(`${label} : `) + 0.5, y);
    y += 4.6;
  });

  // Centre : logo dans un cercle blanc bordé, centré sur la hauteur du bloc
  if (logo) {
    const cy = top + blocH / 2;
    pdf.setFillColor(...WHITE);
    pdf.setDrawColor(...LINE); // contour gris très clair, sans couleur
    pdf.setLineWidth(0.3);
    pdf.circle(centreX, cy, diametre / 2, "FD");
    pdf.addImage(logo.data, "PNG", centreX - logoW / 2, cy - logoImgH / 2, logoW, logoImgH);
  }

  // Droite : coordonnées alignées à droite (même ligne de départ que le nom)
  y = top + 4.5;
  droite.forEach((lignes, i) => {
    setPdfText(pdf, 8.5, i === 0 ? TEXT : MUTED, i === 0 ? "bold" : "normal");
    pdf.text(lignes, right, y, { align: "right" });
    y += lignes.length * 4.2 + 1.2;
  });

  // Bande du document : type à gauche, référence à droite
  y = top + blocH + 6;
  pdf.setFillColor(...PRIMARY);
  pdf.rect(MARGIN, y, CONTENT_W, 0.7, "F");
  y += 3.5;
  pdf.setFillColor(...PRIMARY_LIGHT);
  pdf.roundedRect(MARGIN, y, CONTENT_W, 13, 2.5, 2.5, "F");
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(MARGIN + 2.5, y + 2.5, 1.3, 8, 0.65, 0.65, "F");
  setPdfText(pdf, 7, MUTED, "bold");
  pdf.text(heading.kicker, MARGIN + 7, y + 5);
  setPdfText(pdf, 13, PRIMARY, "bold");
  pdf.text(heading.title, MARGIN + 7, y + 10.5);
  setPdfText(pdf, 9.5, PRIMARY, "bold");
  const pillW = pdf.getTextWidth(heading.pill) + 10;
  pdf.setFillColor(...WHITE);
  pdf.setDrawColor(...PRIMARY);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(right - 4 - pillW, y + 2.75, pillW, 7.5, 3.75, 3.75, "FD");
  pdf.text(heading.pill, right - 4 - pillW / 2, y + 7.8, { align: "center" });
  return y + 13 - 2;
};

/** Bandeau violet d'en-tête avec le logo et l'identité de l'entreprise. Renvoie sa hauteur. */
export const drawCompanyBand = (
  pdf: JsPDF,
  store: SupplyPdfStore,
  logo: { data: string; ratio: number } | null,
  heading: BandTitle,
): number => {
  if (heading.clair) return drawPrintHeader(pdf, store, logo, heading);
  const companyName = clean(store.denomination) || "Entreprise";
  const legal = [clean(store.forme_juridique), clean(store.raison_sociale)].filter(Boolean).join("  ·  ");
  const ids = [
    store.numero_immatriculation ? `RCCM : ${clean(store.numero_immatriculation)}` : "",
    store.numero_fiscal ? `NIU : ${clean(store.numero_fiscal)}` : "",
  ].filter(Boolean).join("     ");
  const contact = [
    store.telephone ? `Tél. : ${clean(store.telephone)}` : "",
    store.email ? clean(store.email) : "",
  ].filter(Boolean).join("     ");
  const address = [
    clean(store.adresse_ligne_1), clean(store.adresse_ligne_2), clean(store.quartier),
    [clean(store.code_postal), clean(store.ville)].filter(Boolean).join(" "), clean(store.pays),
  ].filter(Boolean).join(", ");

  // Carte du logo : carrée pour un logo carré, plus large pour une bannière.
  const logoBox = 30;
  const logoCardW = logo ? Math.min(Math.max(logoBox * logo.ratio * 0.75, logoBox), 40) : 0;
  const infoX = MARGIN + (logo ? logoCardW + 7 : 0);
  const infoW = 108 - (infoX - MARGIN);

  setPdfText(pdf, 16, WHITE, "bold");
  const nameLines = (pdf.splitTextToSize(companyName, infoW) as string[]).slice(0, 2);
  setPdfText(pdf, 8.5, ON_PRIMARY);
  const infoLines = [legal, ids, contact, address]
    .filter(Boolean)
    .flatMap((line) => pdf.splitTextToSize(line, infoW) as string[]);
  const bandH = Math.max(47, 16 + nameLines.length * 6.5 + infoLines.length * 4.4 + 6);

  pdf.setFillColor(...PRIMARY);
  pdf.rect(0, 0, PAGE_W, bandH, "F");
  // Liseré décoratif plus clair en bas du bandeau
  pdf.setFillColor(91, 34, 134);
  pdf.rect(0, bandH - 2, PAGE_W, 2, "F");

  if (logo) {
    pdf.setFillColor(...WHITE);
    pdf.roundedRect(MARGIN, 11, logoCardW, logoBox, 3, 3, "F");
    const w = Math.min(logoCardW - 5, (logoBox - 5) * logo.ratio);
    const h = w / logo.ratio;
    pdf.addImage(logo.data, "PNG", MARGIN + (logoCardW - w) / 2, 11 + (logoBox - h) / 2, w, h);
  }

  setPdfText(pdf, 16, WHITE, "bold");
  pdf.text(nameLines, infoX, 18);
  setPdfText(pdf, 8.5, ON_PRIMARY);
  pdf.text(infoLines, infoX, 18 + nameLines.length * 6.5);

  // Titre du document, à droite dans le bandeau
  setPdfText(pdf, 7.5, ON_PRIMARY, "bold");
  pdf.text(heading.kicker, PDF_RIGHT, 18, { align: "right" });
  setPdfText(pdf, 13.5, WHITE, "bold");
  pdf.text(heading.title, PDF_RIGHT, 25.5, { align: "right" });
  pdf.setFillColor(...WHITE);
  setPdfText(pdf, 9, PRIMARY, "bold");
  const pillW = pdf.getTextWidth(heading.pill) + 9;
  pdf.roundedRect(PDF_RIGHT - pillW, 30, pillW, 7.5, 3.75, 3.75, "F");
  pdf.text(heading.pill, PDF_RIGHT - pillW / 2, 35, { align: "center" });
  return bandH;
};

/** Rangée de 4 cartes « libellé / valeur ». Renvoie la hauteur occupée. */
export const drawChips = (pdf: JsPDF, y: number, chips: [string, string][]): number => {
  const gap = 4;
  const w = (CONTENT_W - gap * (chips.length - 1)) / chips.length;
  chips.forEach(([label, value], i) => {
    const x = MARGIN + i * (w + gap);
    pdf.setFillColor(...PRIMARY_LIGHT);
    pdf.roundedRect(x, y, w, 15, 2.5, 2.5, "F");
    setPdfText(pdf, 7, MUTED, "bold");
    pdf.text(label.toUpperCase(), x + 4, y + 5.5);
    setPdfText(pdf, 10, PRIMARY, "bold");
    pdf.text(value, x + 4, y + 11.5, { maxWidth: w - 6 });
  });
  return 15;
};

/** Bandeau compact des pages suivantes. Renvoie l'ordonnée de départ du contenu. */
export const drawContinuationBand = (pdf: JsPDF, store: SupplyPdfStore, label: string, clair = false): number => {
  if (clair) {
    pdf.setFillColor(...PRIMARY);
    pdf.rect(MARGIN, 13, CONTENT_W, 0.6, "F");
  } else {
    pdf.setFillColor(...PRIMARY);
    pdf.rect(0, 0, PAGE_W, 14, "F");
  }
  setPdfText(pdf, 9, clair ? PRIMARY : WHITE, "bold");
  pdf.text(clean(store.denomination) || "Entreprise", MARGIN, 9);
  setPdfText(pdf, 8.5, clair ? TEXT : ON_PRIMARY);
  pdf.text(label, PDF_RIGHT, 9, { align: "right" });
  return 24;
};

/** Pied de page (coordonnées, date de génération, pagination) sur toutes les pages. */
export const drawFooters = (pdf: JsPDF, store: SupplyPdfStore) => {
  const pages = pdf.getNumberOfPages();
  const footerInfo = [
    clean(store.denomination) || "Entreprise",
    store.numero_immatriculation ? `RCCM ${clean(store.numero_immatriculation)}` : "",
    store.numero_fiscal ? `NIU ${clean(store.numero_fiscal)}` : "",
    store.telephone ? `Tél. ${clean(store.telephone)}` : "",
  ].filter(Boolean).join("   ·   ");
  const generatedAt = formatDate(new Date().toISOString());
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, PAGE_H - 15, PDF_RIGHT, PAGE_H - 15);
    setPdfText(pdf, 7.5, TEXT, "bold");
    pdf.text(footerInfo, MARGIN, PAGE_H - 10.5, { maxWidth: CONTENT_W - 22 });
    setPdfText(pdf, 7, MUTED);
    pdf.text(`Généré avec Lumistock le ${generatedAt}`, MARGIN, PAGE_H - 6.5);
    setPdfText(pdf, 7.5, PRIMARY, "bold");
    pdf.text(`${page} / ${pages}`, PDF_RIGHT, PAGE_H - 8.5, { align: "right" });
    pdf.setFillColor(...PRIMARY);
    pdf.rect(0, PAGE_H - 2, PAGE_W, 2, "F");
  }
};

// ---------------------------------------------------------------------------
const initials = (name?: string): string => {
  const parts = clean(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export interface SupplyPdfOptions {
  /** false : ne télécharge pas, renvoie le contenu (utile pour les tests). */
  save?: boolean;
}

export async function generateSupplyPdf(
  supply: SupplyPdfData,
  store: SupplyPdfStore,
  logoUrl?: string | null,
  options: SupplyPdfOptions = {},
): Promise<{ fileName: string; data?: ArrayBuffer }> {
  const { jsPDF } = await import("jspdf");
  // Textes du PDF traduits dans la langue de l'interface.
  const pdf: JsPDF = traduirePdf(new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }));
  const currency = currencyLabel(store.devise);
  const reference = supplyReference(supply.id);

  const setText = (size: number, color: RGB = TEXT, style: "normal" | "bold" = "normal") => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };

  // ======================= EN-TÊTE (bandeau violet) =======================
  const logo = logoUrl ? await loadImage(logoUrl) : null;
  const bandH = drawCompanyBand(pdf, store, logo, {
    kicker: "DOCUMENT DE REMISE DE STOCK",
    title: "BON D'APPROVISIONNEMENT",
    pill: reference,
    clair: true, // même en-tête que la facture (logo rond au centre)
  });
  const right = PDF_RIGHT;
  let y = bandH + 8;

  // ======================= REPÈRES (4 cartes) =======================
  const chips: [string, string][] = [
    ["Date d'émission", formatDate(supply.created_at)],
    ["Produits", formatNumber(supply.produits.length)],
    ["Quantité totale", formatNumber(supply.quantite)],
    ["Montant total", `${formatNumber(supply.montant)} ${currency}`],
  ];
  drawChips(pdf, y, chips);
  y += 15;

  if (supply.updated_at) {
    const who = supply.modifie_par?.nom_complet ? ` par ${clean(supply.modifie_par.nom_complet)}` : "";
    setText(7.5, MUTED);
    pdf.text(`Dernière modification le ${formatDate(supply.updated_at)}${who}.`, MARGIN, y + 5);
    y += 6;
  }
  y += 8;

  // ======================= PARTIES =======================
  const receveur: SupplyPdfPerson = supply.livreur || {
    nom_complet: `${supply.first_name ?? ""} ${supply.last_name ?? ""}`.trim(),
    role: "Gérant",
  };
  const partyW = (CONTENT_W - 8) / 2;
  const details = (p?: SupplyPdfPerson | null) =>
    [p?.telephone ? `Tél. : ${clean(p.telephone)}` : "", p?.email ? clean(p.email) : ""].filter(Boolean);
  const partyH = 14 + Math.max(details(supply.approvisionne_par).length, details(receveur).length, 1) * 4.5 + 6;

  const drawParty = (x: number, title: string, person?: SupplyPdfPerson | null) => {
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.3);
    pdf.setFillColor(...WHITE);
    pdf.roundedRect(x, y, partyW, partyH, 3, 3, "FD");
    setText(7, MUTED, "bold");
    pdf.text(title, x + 5, y + 6.5);
    // Pastille d'initiales
    const cx = x + 10.5;
    const cy = y + 15.5;
    pdf.setFillColor(...PRIMARY);
    pdf.circle(cx, cy, 5.5, "F");
    setText(8.5, WHITE, "bold");
    pdf.text(initials(person?.nom_complet), cx, cy + 1.1, { align: "center" });
    const tx = x + 19;
    const tw = partyW - 23;
    setText(10.5, TEXT, "bold");
    pdf.text(clean(person?.nom_complet) || "Non renseigné", tx, y + 14.5, { maxWidth: tw });
    setText(8, PRIMARY, "bold");
    pdf.text(clean(person?.role) || "", tx, y + 19, { maxWidth: tw });
    setText(8, MUTED);
    details(person).forEach((line, i) => pdf.text(line, tx, y + 23.5 + i * 4.5, { maxWidth: tw }));
  };
  drawParty(MARGIN, "APPROVISIONNÉ PAR", supply.approvisionne_par);
  drawParty(MARGIN + partyW + 8, "REÇU PAR", receveur);
  y += partyH + 10;

  // ======================= TABLEAU =======================
  setText(11, TEXT, "bold");
  pdf.text("Détail des produits", MARGIN, y);
  y += 4;

  const cols = [
    { title: "#", w: 10, align: "center" as const },
    { title: "Désignation", w: 74, align: "left" as const },
    { title: "Unité", w: 20, align: "center" as const },
    { title: "Qté", w: 16, align: "right" as const },
    { title: "Prix unitaire", w: 28, align: "right" as const },
    { title: `Montant (${currency})`, w: CONTENT_W - 148, align: "right" as const },
  ];
  const colX = cols.reduce<number[]>((acc, _col, i) => [...acc, i === 0 ? MARGIN : acc[i - 1] + cols[i - 1].w], []);
  const cellX = (i: number) => {
    const col = cols[i];
    return col.align === "left" ? colX[i] + 3 : col.align === "right" ? colX[i] + col.w - 3 : colX[i] + col.w / 2;
  };
  const drawTableHeader = () => {
    pdf.setFillColor(...PRIMARY_LIGHT);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, "F");
    setText(7.5, PRIMARY, "bold");
    cols.forEach((col, i) => pdf.text(col.title.toUpperCase(), cellX(i), y + 5.8, { align: col.align }));
    y += 11;
  };
  const newPage = () => {
    pdf.addPage();
    y = drawContinuationBand(pdf, store, `Bon d'approvisionnement ${reference} — suite`, true);
  };

  drawTableHeader();
  supply.produits.forEach((produit, index) => {
    setText(9.5, TEXT, "bold");
    const lines = pdf.splitTextToSize(clean(produit.nom) || "Produit", cols[1].w - 6) as string[];
    const rowH = lines.length * 4.4 + 4.4;
    if (y + rowH > FOOTER_TOP - 8) {
      newPage();
      drawTableHeader();
    }
    const top = y + 4.6;
    setText(8.5, MUTED);
    pdf.text(String(index + 1).padStart(2, "0"), cellX(0), top, { align: "center" });
    setText(9.5, TEXT, "bold");
    pdf.text(lines, cellX(1), top);
    setText(8.5, MUTED);
    pdf.text(clean(produit.unite) || "-", cellX(2), top, { align: "center" });
    setText(9.5, TEXT);
    pdf.text(formatNumber(produit.quantite), cellX(3), top, { align: "right" });
    pdf.text(formatNumber(produit.prix), cellX(4), top, { align: "right" });
    setText(9.5, TEXT, "bold");
    pdf.text(formatNumber(produit.prix * produit.quantite), cellX(5), top, { align: "right" });
    y += rowH;
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.25);
    pdf.line(MARGIN, y, right, y);
  });

  // ======================= TOTAUX =======================
  const totalsW = 78;
  const wordsW = CONTENT_W - totalsW - 8;
  const words = `${amountInWords(supply.montant)} ${currency === "FCFA" ? "francs CFA" : currency}`;
  setText(9.5, PRIMARY, "bold");
  const wordLines = pdf.splitTextToSize(words.charAt(0).toUpperCase() + words.slice(1), wordsW - 10) as string[];
  const rows: [string, string][] = [
    ["Quantité totale", formatNumber(supply.quantite)],
    ["Sous-total", `${formatNumber(supply.montant)} ${currency}`],
  ];
  if (supply.montant_achat !== undefined) {
    rows.push(["Valeur au prix d'achat", `${formatNumber(supply.montant_achat)} ${currency}`]);
  }
  const totalsH = rows.length * 7 + 16;
  const wordsH = 13 + wordLines.length * 4.6;
  const blockH = Math.max(totalsH, wordsH);
  if (y + 8 + blockH > FOOTER_TOP - 4) newPage();
  y += 8;

  // Montant en lettres (gauche)
  pdf.setFillColor(...PRIMARY_LIGHT);
  pdf.roundedRect(MARGIN, y, wordsW, blockH, 3, 3, "F");
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(MARGIN + 3, y + 4, 1.4, blockH - 8, 0.7, 0.7, "F");
  setText(7, MUTED, "bold");
  pdf.text("ARRÊTÉ LE PRÉSENT BON À LA SOMME DE", MARGIN + 8, y + 7.5);
  setText(9.5, PRIMARY, "bold");
  pdf.text(wordLines, MARGIN + 8, y + 13.5);

  // Totaux (droite)
  const tx = right - totalsW;
  let ty = y + 4;
  rows.forEach(([label, value]) => {
    setText(8.5, MUTED);
    pdf.text(label, tx + 2, ty + 3);
    setText(9, TEXT, "bold");
    pdf.text(value, right - 2, ty + 3, { align: "right" });
    ty += 7;
  });
  const totalY = y + blockH - 11;
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(tx, totalY, totalsW, 11, 2.5, 2.5, "F");
  setText(8, ON_PRIMARY, "bold");
  pdf.text("TOTAL", tx + 4, totalY + 7);
  setText(12, WHITE, "bold");
  pdf.text(`${formatNumber(supply.montant)} ${currency}`, right - 4, totalY + 7.3, { align: "right" });
  y += blockH + 10;

  // Mention de bas de document
  setText(7.5, MUTED);
  pdf.text(
    "Les quantités ci-dessus ont été retirées du stock du magasin et ajoutées au stock du gérant destinataire.",
    MARGIN, Math.min(y, FOOTER_TOP - 4),
  );

  // ======================= PIED DE PAGE =======================
  drawFooters(pdf, store);

  const fileName = `Bon_approvisionnement_${reference}_${formatDate(supply.created_at, false).split("/").reverse().join("-")}.pdf`;
  if (options.save === false) {
    return { fileName, data: pdf.output("arraybuffer") };
  }
  pdf.save(fileName);
  return { fileName };
}
