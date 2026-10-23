// Générateur PDF commun aux rapports : même en-tête clair que les factures et
// bons (identité, logo rond, coordonnées), chiffres clés, tableaux paginés avec
// en-tête de colonnes répété, ligne de total, signatures et pied de page.
// Le même document sert au téléchargement et à l'impression.
import { traduirePdf } from "../../traduction/interface";
import type { jsPDF as JsPDF } from "jspdf";
import {
  clean,
  CONTENT_W,
  drawChips,
  drawCompanyBand,
  drawContinuationBand,
  drawFooters,
  FOOTER_TOP,
  LINE,
  loadImage,
  MARGIN,
  MUTED,
  PDF_RIGHT,
  PRIMARY,
  PRIMARY_LIGHT,
  setPdfText,
  TEXT,
} from "../../Components/admin/Produits/supplyPdf";
import type { RGB } from "../../Components/admin/Produits/supplyPdf";
import { livrerPdf, loadStoreForPdf } from "../../Components/admin/livaision/livraisonfinal/deliveryInvoicePdf";
import type { InvoiceMode } from "../../Components/admin/livaision/livraisonfinal/deliveryInvoicePdf";

export const VERT: RGB = [5, 150, 105];
export const ORANGE: RGB = [217, 119, 6];
export const ROUGE: RGB = [220, 38, 38];

export interface PdfColonne<T> {
  titre: string;
  /** Largeur relative (les largeurs sont réparties sur la page). */
  largeur: number;
  align?: "left" | "right" | "center";
  valeur: (ligne: T) => string;
  /** Seconde ligne en petit, sous la valeur (colonnes alignées à gauche). */
  sous?: (ligne: T) => string;
  couleur?: (ligne: T) => RGB | undefined;
  gras?: boolean | ((ligne: T) => boolean);
}

export interface PdfSection<T> {
  titre: string;
  note?: string;
  colonnes: PdfColonne<T>[];
  lignes: T[];
  /** Cellules de la ligne de total, dans l'ordre des colonnes ("" pour vide). */
  total?: string[];
  /** Texte affiché quand il n'y a aucune ligne. */
  vide?: string;
}

export interface RapportPdfOptions {
  fichier: string;
  kicker: string;
  titre: string;
  /** Pastille à droite du titre (période, année, date…). */
  pastille: string;
  /** Chiffres clés, par rangées de 4. */
  chiffres: [string, string][];
  filtres?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sections: PdfSection<any>[];
  /** Zone de signature en fin de document. */
  signatures?: boolean;
}

export async function genererRapportPdf(options: RapportPdfOptions, mode: InvoiceMode): Promise<string> {
  const { store, logoUrl } = await loadStoreForPdf();
  const { jsPDF } = await import("jspdf");
  // Textes du PDF traduits dans la langue de l'interface.
  const pdf: JsPDF = traduirePdf(new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }));
  const texte = (taille: number, couleur: RGB = TEXT, style: "normal" | "bold" = "normal") =>
    setPdfText(pdf, taille, couleur, style);
  const suite = `${options.titre.charAt(0)}${options.titre.slice(1).toLowerCase()} — suite`;

  const logo = logoUrl ? await loadImage(logoUrl) : null;
  let y = drawCompanyBand(pdf, store, logo, {
    kicker: options.kicker, title: options.titre, pill: options.pastille, clair: true,
  }) + 7;

  for (let i = 0; i < options.chiffres.length; i += 4) {
    // clean() : les espaces insécables du format français s'affichent « / » sinon.
    const rangee = options.chiffres.slice(i, i + 4).map(([l, v]) => [clean(l), clean(v)] as [string, string]);
    y += drawChips(pdf, y, rangee) + 3;
  }
  if (options.filtres) {
    texte(7.5, MUTED);
    const lignes = pdf.splitTextToSize(`Filtres : ${clean(options.filtres)}`, CONTENT_W) as string[];
    pdf.text(lignes, MARGIN, y + 2);
    y += lignes.length * 3.6 + 1;
  }
  y += 5;

  const nouvellePage = () => {
    pdf.addPage();
    y = drawContinuationBand(pdf, store, suite, true);
  };

  options.sections.forEach((section) => {
    const poids = section.colonnes.reduce((s, c) => s + c.largeur, 0);
    const largeurs = section.colonnes.map((c) => (c.largeur / poids) * CONTENT_W);
    const xs = largeurs.map((_, i) => MARGIN + largeurs.slice(0, i).reduce((s, w) => s + w, 0));
    const ancre = (i: number) => {
      const a = section.colonnes[i].align || "left";
      return a === "left" ? xs[i] + 2 : a === "right" ? xs[i] + largeurs[i] - 2 : xs[i] + largeurs[i] / 2;
    };
    const entete = () => {
      pdf.setFillColor(...PRIMARY_LIGHT);
      pdf.roundedRect(MARGIN, y, CONTENT_W, 8, 1.8, 1.8, "F");
      texte(6.3, PRIMARY, "bold");
      section.colonnes.forEach((c, i) => {
        const titre = pdf.splitTextToSize(clean(c.titre).toUpperCase(), largeurs[i] - 2) as string[];
        pdf.text(titre.slice(0, 2), ancre(i), y + (titre.length > 1 ? 3.4 : 5.2), { align: c.align || "left" });
      });
      y += 10;
    };

    // Titre de la section (gardé avec au moins l'en-tête et une ligne)
    if (y + 28 > FOOTER_TOP - 6) nouvellePage();
    texte(11, TEXT, "bold");
    pdf.text(clean(section.titre), MARGIN, y);
    if (section.note) {
      texte(7.8, MUTED);
      pdf.text(clean(section.note), PDF_RIGHT, y, { align: "right" });
    }
    y += 4;
    entete();

    if (!section.lignes.length) {
      texte(8.5, MUTED);
      pdf.text(clean(section.vide || "Aucune donnée pour cette sélection."), MARGIN + 2, y + 3);
      y += 9;
    }

    section.lignes.forEach((ligne, index) => {
      // Hauteur de la ligne : la cellule la plus haute (texte replié + sous-ligne)
      const cellules = section.colonnes.map((c, i) => {
        texte(7.8, TEXT, "bold");
        const valeur = clean(c.valeur(ligne));
        const lignes = (c.align || "left") === "left"
          ? (pdf.splitTextToSize(valeur, largeurs[i] - 3) as string[]).slice(0, 3)
          : [valeur];
        texte(6.6, MUTED);
        const sous = c.sous ? clean(c.sous(ligne)) : "";
        const sousLignes = sous ? (pdf.splitTextToSize(sous, largeurs[i] - 3) as string[]).slice(0, 2) : [];
        return { lignes, sousLignes };
      });
      const hauteur = Math.max(...cellules.map((c) => c.lignes.length * 3.6 + c.sousLignes.length * 3)) + 3.2;
      if (y + hauteur > FOOTER_TOP - 6) {
        nouvellePage();
        entete();
      }
      if (index % 2 === 1) {
        pdf.setFillColor(251, 249, 253);
        pdf.rect(MARGIN, y - 0.6, CONTENT_W, hauteur, "F");
      }
      section.colonnes.forEach((c, i) => {
        const gras = typeof c.gras === "function" ? c.gras(ligne) : c.gras;
        texte(7.8, c.couleur?.(ligne) || TEXT, gras ? "bold" : "normal");
        pdf.text(cellules[i].lignes, ancre(i), y + 3, { align: c.align || "left" });
        if (cellules[i].sousLignes.length) {
          texte(6.6, MUTED);
          pdf.text(cellules[i].sousLignes, ancre(i), y + 3 + cellules[i].lignes.length * 3.6 - 0.4, {
            align: c.align || "left",
          });
        }
      });
      y += hauteur;
      pdf.setDrawColor(...LINE);
      pdf.setLineWidth(0.2);
      pdf.line(MARGIN, y - 0.6, PDF_RIGHT, y - 0.6);
    });

    if (section.total && section.lignes.length) {
      if (y + 10 > FOOTER_TOP - 6) {
        nouvellePage();
        entete();
      }
      pdf.setFillColor(...PRIMARY);
      pdf.roundedRect(MARGIN, y + 0.5, CONTENT_W, 8, 1.8, 1.8, "F");
      texte(7.6, [255, 255, 255], "bold");
      section.total.forEach((cellule, i) => {
        if (cellule) pdf.text(clean(cellule), ancre(i), y + 5.6, { align: section.colonnes[i].align || "left" });
      });
      y += 10;
    }
    y += 8;
  });

  if (options.signatures) {
    y -= 3;
    if (y + 20 > FOOTER_TOP - 2) nouvellePage();
    const largeur = 70;
    [["Le responsable", MARGIN], ["Cachet de l'entreprise", PDF_RIGHT - largeur]].forEach(([libelle, x]) => {
      texte(8.5, TEXT, "bold");
      pdf.text(String(libelle), Number(x) + largeur / 2, y + 3, { align: "center" });
      pdf.setDrawColor(...MUTED);
      pdf.setLineWidth(0.3);
      pdf.line(Number(x), y + 18, Number(x) + largeur, y + 18);
    });
  }

  drawFooters(pdf, store);
  livrerPdf(pdf, options.fichier, mode);
  return options.fichier;
}

/** Fichier CSV lisible par Excel (séparateur « ; », accents conservés). */
export function exporterCsv(fichier: string, entetes: string[], lignes: (string | number)[][]) {
  const cellule = (v: string | number) => {
    const s = typeof v === "number" ? String(v).replace(".", ",") : String(v ?? "");
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const contenu = [entetes, ...lignes].map((l) => l.map(cellule).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + contenu], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = fichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** « Rapport_ventes_2026-10-01_2026-10-31 » → nom de fichier sûr. */
export const nomFichier = (...parties: string[]) =>
  parties.filter(Boolean).join("_").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "-");
