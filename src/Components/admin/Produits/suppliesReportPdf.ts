// Rapport PDF des produits approvisionnés (plusieurs approvisionnements).
// Même charte que le bon d'approvisionnement : bandeau de l'entreprise,
// cartes de repères, tableaux et pied de page partagés via supplyPdf.ts.
import { traduirePdf } from "../../../traduction/interface";
import type { jsPDF as JsPDF } from "jspdf";
import {
  amountInWords,
  clean,
  CONTENT_W,
  currencyLabel,
  drawChips,
  drawCompanyBand,
  drawContinuationBand,
  drawFooters,
  FOOTER_TOP,
  formatDate,
  formatNumber,
  LINE,
  loadImage,
  MARGIN,
  MUTED,
  ON_PRIMARY,
  PDF_RIGHT,
  PRIMARY,
  PRIMARY_LIGHT,
  setPdfText,
  supplyReference,
  TEXT,
  WHITE,
  type SupplyPdfData,
  type SupplyPdfStore,
} from "./supplyPdf";

export interface SuppliesReportOptions {
  /** Description des filtres appliqués à la liste exportée (facultatif). */
  filtres?: string;
  /** false : ne télécharge pas, renvoie le contenu (utile pour les tests). */
  save?: boolean;
}

interface Column {
  title: string;
  w: number;
  align: "left" | "center" | "right";
}

const columnX = (cols: Column[]) =>
  cols.reduce<number[]>((acc, _col, i) => [...acc, i === 0 ? MARGIN : acc[i - 1] + cols[i - 1].w], []);

export async function generateSuppliesReportPdf(
  supplies: SupplyPdfData[],
  store: SupplyPdfStore,
  logoUrl?: string | null,
  options: SuppliesReportOptions = {},
): Promise<{ fileName: string; data?: ArrayBuffer }> {
  const { jsPDF } = await import("jspdf");
  // Textes du PDF traduits dans la langue de l'interface.
  const pdf: JsPDF = traduirePdf(new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }));
  const currency = currencyLabel(store.devise);
  const right = PDF_RIGHT;
  const text = (size: number, color = TEXT, style: "normal" | "bold" = "normal") => setPdfText(pdf, size, color, style);

  // Du plus ancien au plus récent pour une lecture chronologique.
  const ordered = [...supplies].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const dates = ordered.map((s) => formatDate(s.created_at, false)).filter(Boolean);
  const period = !dates.length
    ? "Aucune période"
    : dates[0] === dates[dates.length - 1]
      ? `Le ${dates[0]}`
      : `Du ${dates[0]} au ${dates[dates.length - 1]}`;

  // Nombre de produits différents, tous approvisionnements confondus.
  const produitsDistincts = new Set(
    ordered.flatMap((supply) => supply.produits.map((p) => String((p as { produit_id?: string }).produit_id || p.nom))),
  ).size;
  const totalQuantite = ordered.reduce((sum, s) => sum + s.quantite, 0);
  const totalMontant = ordered.reduce((sum, s) => sum + s.montant, 0);
  const totalAchat = ordered.reduce((sum, s) => sum + (s.montant_achat ?? 0), 0);

  // ============ En-tête et repères ============
  const logo = logoUrl ? await loadImage(logoUrl) : null;
  const bandH = drawCompanyBand(pdf, store, logo, {
    kicker: "RAPPORT D'APPROVISIONNEMENT",
    title: "PRODUITS APPROVISIONNÉS",
    pill: period,
    clair: true, // même en-tête que la facture (logo rond au centre)
  });
  let y = bandH + 8;
  y += drawChips(pdf, y, [
    ["Approvisionnements", formatNumber(ordered.length)],
    ["Produits distincts", formatNumber(produitsDistincts)],
    ["Quantité totale", formatNumber(totalQuantite)],
    ["Montant total", `${formatNumber(totalMontant)} ${currency}`],
  ]);
  if (options.filtres) {
    text(7.5, MUTED);
    pdf.text(`Filtres appliqués : ${clean(options.filtres)}`, MARGIN, y + 5, { maxWidth: CONTENT_W });
    y += 6;
  }
  y += 9;

  const continuation = "Rapport des produits approvisionnés — suite";
  const ensureSpace = (needed: number, onNewPage?: () => void) => {
    if (y + needed > FOOTER_TOP - 6) {
      pdf.addPage();
      y = drawContinuationBand(pdf, store, continuation, true);
      onNewPage?.();
    }
  };
  const sectionTitle = (title: string, subtitle: string) => {
    ensureSpace(24);
    text(11.5, TEXT, "bold");
    pdf.text(title, MARGIN, y);
    text(8, MUTED);
    pdf.text(subtitle, right, y, { align: "right" });
    y += 5;
  };
  const tableHeader = (cols: Column[]) => {
    const xs = columnX(cols);
    pdf.setFillColor(...PRIMARY_LIGHT);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 8.5, 2, 2, "F");
    text(7.5, PRIMARY, "bold");
    cols.forEach((col, i) => {
      const x = col.align === "left" ? xs[i] + 3 : col.align === "right" ? xs[i] + col.w - 3 : xs[i] + col.w / 2;
      pdf.text(col.title.toUpperCase(), x, y + 5.6, { align: col.align });
    });
    y += 10.5;
  };
  const tableRow = (cols: Column[], cells: string[], bold: boolean[] = []) => {
    const xs = columnX(cols);
    text(9, TEXT, "bold");
    const nameLines = pdf.splitTextToSize(cells[1], cols[1].w - 6) as string[];
    const rowH = nameLines.length * 4.3 + 4.2;
    return {
      rowH,
      draw: () => {
        const top = y + 4.4;
        cells.forEach((cell, i) => {
          const col = cols[i];
          const x = col.align === "left" ? xs[i] + 3 : col.align === "right" ? xs[i] + col.w - 3 : xs[i] + col.w / 2;
          if (i === 0) text(8, MUTED);
          else if (i === 1) text(9, TEXT, "bold");
          else text(i === 2 ? 8 : 9, i === 2 ? MUTED : TEXT, bold[i] ? "bold" : "normal");
          pdf.text(i === 1 ? nameLines : cell, x, top, { align: col.align });
        });
        y += rowH;
        pdf.setDrawColor(...LINE);
        pdf.setLineWidth(0.25);
        pdf.line(MARGIN, y, right, y);
      },
    };
  };

  // ============ Détail par approvisionnement ============
  const detailCols: Column[] = [
    { title: "#", w: 10, align: "center" },
    { title: "Produit", w: 78, align: "left" },
    { title: "Unité", w: 20, align: "center" },
    { title: "Qté", w: 16, align: "right" },
    { title: "Prix unitaire", w: 28, align: "right" },
    { title: `Montant (${currency})`, w: CONTENT_W - 152, align: "right" },
  ];
  sectionTitle("Détail par approvisionnement", `${ordered.length} approvisionnement${ordered.length > 1 ? "s" : ""}`);
  ordered.forEach((supply) => {
    const receveur = supply.livreur?.nom_complet || `${supply.first_name ?? ""} ${supply.last_name ?? ""}`.trim() || "Non renseigné";
    const auteur = supply.approvisionne_par?.nom_complet || "Non renseigné";
    const firstRow = supply.produits[0]
      ? tableRow(detailCols, ["01", clean(supply.produits[0].nom) || "Produit", "", "", "", ""]).rowH
      : 0;
    // L'en-tête d'un approvisionnement reste toujours avec sa première ligne.
    ensureSpace(15 + 10.5 + firstRow + 2);
    pdf.setFillColor(...PRIMARY_LIGHT);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 13, 2.5, 2.5, "F");
    pdf.setFillColor(...PRIMARY);
    pdf.roundedRect(MARGIN + 2.5, y + 2.5, 1.3, 8, 0.65, 0.65, "F");
    text(9.5, PRIMARY, "bold");
    pdf.text(`${supplyReference(supply.id)}  ·  ${formatDate(supply.created_at)}`, MARGIN + 7, y + 5.4);
    text(7.8, MUTED);
    pdf.text(
      `Reçu par : ${clean(receveur)}   ·   Approvisionné par : ${clean(auteur)}`,
      MARGIN + 7, y + 10, { maxWidth: CONTENT_W - 60 },
    );
    text(10, PRIMARY, "bold");
    pdf.text(`${formatNumber(supply.montant)} ${currency}`, right - 4, y + 6, { align: "right" });
    text(7.5, MUTED);
    pdf.text(`${formatNumber(supply.quantite)} article${supply.quantite > 1 ? "s" : ""}`, right - 4, y + 10.3, { align: "right" });
    y += 15;
    tableHeader(detailCols);
    supply.produits.forEach((p, index) => {
      const row = tableRow(
        detailCols,
        [String(index + 1).padStart(2, "0"), clean(p.nom) || "Produit", clean(p.unite) || "-", formatNumber(p.quantite), formatNumber(p.prix), formatNumber(p.prix * p.quantite)],
        [false, true, false, false, false, true],
      );
      ensureSpace(row.rowH, () => tableHeader(detailCols));
      row.draw();
    });
    y += 7;
  });

  // ============ Total général ============
  const words = `${amountInWords(totalMontant)} ${currency === "FCFA" ? "francs CFA" : currency}`;
  text(9.5, PRIMARY, "bold");
  const totalsW = 78;
  const wordsW = CONTENT_W - totalsW - 8;
  const wordLines = pdf.splitTextToSize(words.charAt(0).toUpperCase() + words.slice(1), wordsW - 12) as string[];
  const rows: [string, string][] = [
    ["Approvisionnements", formatNumber(ordered.length)],
    ["Quantité totale", formatNumber(totalQuantite)],
    ["Valeur au prix d'achat", `${formatNumber(totalAchat)} ${currency}`],
  ];
  const blockH = Math.max(rows.length * 7 + 16, 13 + wordLines.length * 4.6);
  ensureSpace(blockH + 4);
  pdf.setFillColor(...PRIMARY_LIGHT);
  pdf.roundedRect(MARGIN, y, wordsW, blockH, 3, 3, "F");
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(MARGIN + 3, y + 4, 1.4, blockH - 8, 0.7, 0.7, "F");
  text(7, MUTED, "bold");
  pdf.text("MONTANT TOTAL DES APPROVISIONNEMENTS", MARGIN + 8, y + 7.5);
  text(9.5, PRIMARY, "bold");
  pdf.text(wordLines, MARGIN + 8, y + 13.5);

  const tx = right - totalsW;
  let ty = y + 4;
  rows.forEach(([label, value]) => {
    text(8.5, MUTED);
    pdf.text(label, tx + 2, ty + 3);
    text(9, TEXT, "bold");
    pdf.text(value, right - 2, ty + 3, { align: "right" });
    ty += 7;
  });
  const totalY = y + blockH - 11;
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(tx, totalY, totalsW, 11, 2.5, 2.5, "F");
  text(8, ON_PRIMARY, "bold");
  pdf.text("TOTAL", tx + 4, totalY + 7);
  text(12, WHITE, "bold");
  pdf.text(`${formatNumber(totalMontant)} ${currency}`, right - 4, totalY + 7.3, { align: "right" });

  drawFooters(pdf, store);

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fileName = `Produits_approvisionnes_${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.pdf`;
  if (options.save === false) return { fileName, data: pdf.output("arraybuffer") };
  pdf.save(fileName);
  return { fileName };
}
