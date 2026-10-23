// Rapport PDF de la liste des ventes affichée (recherche et filtres compris).
// Même charte que les autres documents : bandeau, repères, tableau, totaux.
import { traduirePdf } from "../../../../traduction/interface";
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
  TEXT,
  WHITE,
} from "../../Produits/supplyPdf";
import type { RGB } from "../../Produits/supplyPdf";
import { invoiceReference, loadStoreForPdf } from "./deliveryInvoicePdf";
import type { Order } from "./types";

const GREEN: RGB = [5, 150, 105];
const AMBER: RGB = [217, 119, 6];
const RED: RGB = [220, 38, 38];

export interface DeliveriesReportOptions {
  /** Description des filtres appliqués (facultatif). */
  filtres?: string;
}

const dateVente = (o: Order) => o.date_commande || (o.raw_date ? o.raw_date.toISOString() : "");

const statutPaiement = (o: Order): [string, RGB] => {
  const s = (o.paymentStatus || o.statut_paiement || "").toLowerCase();
  if (s.startsWith("pay")) return ["Payée", GREEN];
  if (s.startsWith("partiel")) return ["Partielle", AMBER];
  return ["Non payée", RED];
};

export async function generateDeliveriesReportPdf(
  orders: Order[],
  options: DeliveriesReportOptions = {},
): Promise<string> {
  const { store, logoUrl } = await loadStoreForPdf();
  const { jsPDF } = await import("jspdf");
  // Textes du PDF traduits dans la langue de l'interface.
  const pdf: JsPDF = traduirePdf(new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }));
  const currency = currencyLabel(store.devise);
  const right = PDF_RIGHT;
  const text = (size: number, color: RGB = TEXT, style: "normal" | "bold" = "normal") => setPdfText(pdf, size, color, style);

  // Du plus ancien au plus récent.
  const ventes = [...orders].sort((a, b) => new Date(dateVente(a)).getTime() - new Date(dateVente(b)).getTime());
  const dates = ventes.map((o) => formatDate(dateVente(o), false)).filter(Boolean);
  const periode = !dates.length
    ? "Aucune période"
    : dates[0] === dates[dates.length - 1]
      ? `Le ${dates[0]}`
      : `Du ${dates[0]} au ${dates[dates.length - 1]}`;

  const somme = (f: (o: Order) => number) => ventes.reduce((s, o) => s + (Number(f(o)) || 0), 0);
  const totalVentes = somme((o) => o.montant_total);
  const totalPaye = somme((o) => o.montant_paye);
  const totalReste = somme((o) => o.montant_restant);
  const totalReductions = somme((o) => o.total_reductions ?? 0);
  const totalARembourser = somme((o) => o.retour);
  const totalRembourse = somme((o) => o.montant_rembourse ?? 0);
  const articles = somme((o) => o.quantity);

  // ============ En-tête et repères ============
  const logo = logoUrl ? await loadImage(logoUrl) : null;
  // Même en-tête clair que la facture (logo rond au centre).
  const bandH = drawCompanyBand(pdf, store, logo, {
    kicker: "RAPPORT DE VENTES", title: "VENTES ET LIVRAISONS", pill: periode, clair: true,
  });
  let y = bandH + 8;
  y += drawChips(pdf, y, [
    ["Ventes", formatNumber(ventes.length)],
    ["Articles vendus", formatNumber(articles)],
    ["Chiffre d'affaires", `${formatNumber(totalVentes)} ${currency}`],
    ["Encaissé", `${formatNumber(totalPaye)} ${currency}`],
  ]);
  if (options.filtres) {
    text(7.5, MUTED);
    pdf.text(`Filtres appliqués : ${clean(options.filtres)}`, MARGIN, y + 5, { maxWidth: CONTENT_W });
    y += 6;
  }
  y += 9;

  // ============ Tableau ============
  const cols = [
    { title: "#", w: 8, align: "center" as const },
    { title: "Date", w: 20, align: "left" as const },
    { title: "Client · vente", w: 56, align: "left" as const },
    { title: "Paiement", w: 24, align: "center" as const },
    { title: `Total (${currency})`, w: 25, align: "right" as const },
    { title: "Payé", w: 25, align: "right" as const },
    { title: "Reste", w: CONTENT_W - 158, align: "right" as const },
  ];
  const xs = cols.reduce<number[]>((acc, _c, i) => [...acc, i === 0 ? MARGIN : acc[i - 1] + cols[i - 1].w], []);
  const cx = (i: number) =>
    cols[i].align === "left" ? xs[i] + 2.5 : cols[i].align === "right" ? xs[i] + cols[i].w - 2.5 : xs[i] + cols[i].w / 2;
  const header = () => {
    pdf.setFillColor(...PRIMARY_LIGHT);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 8.5, 2, 2, "F");
    text(7.2, PRIMARY, "bold");
    cols.forEach((c, i) => pdf.text(c.title.toUpperCase(), cx(i), y + 5.6, { align: c.align }));
    y += 10.5;
  };
  const nouvellePage = () => {
    pdf.addPage();
    y = drawContinuationBand(pdf, store, "Rapport des ventes — suite", true);
    header();
  };

  text(11.5, TEXT, "bold");
  pdf.text("Détail des ventes", MARGIN, y);
  text(8, MUTED);
  pdf.text(`${ventes.length} vente${ventes.length > 1 ? "s" : ""}`, right, y, { align: "right" });
  y += 5;
  header();

  ventes.forEach((o, index) => {
    const client = clean(o.clientName || o.client?.nom) || "Client de passage";
    const sousLigne = [invoiceReference(o.id), o.nom_livreur ? `par ${clean(o.nom_livreur)}` : ""].filter(Boolean).join(" · ");
    const extras = [
      (Number(o.retour) || 0) > 0 ? `À rembourser : ${formatNumber(Number(o.retour))}` : "",
      (Number(o.montant_rembourse) || 0) > 0 ? `Remboursé : ${formatNumber(Number(o.montant_rembourse))}` : "",
    ].filter(Boolean).join(" · ");
    text(8.8, TEXT, "bold");
    const nomLignes = pdf.splitTextToSize(client, cols[2].w - 5) as string[];
    const rowH = nomLignes.length * 4 + 3.8 + (extras ? 3.6 : 0) + 3.4;
    if (y + rowH > FOOTER_TOP - 6) nouvellePage();
    const top = y + 4.3;
    text(7.8, MUTED);
    pdf.text(String(index + 1).padStart(2, "0"), cx(0), top, { align: "center" });
    pdf.text(formatDate(dateVente(o), false), cx(1), top);
    text(8.8, TEXT, "bold");
    pdf.text(nomLignes, cx(2), top);
    text(7.2, MUTED);
    pdf.text(sousLigne, cx(2), top + nomLignes.length * 4, { maxWidth: cols[2].w - 5 });
    if (extras) {
      text(7.2, AMBER);
      pdf.text(extras, cx(2), top + nomLignes.length * 4 + 3.6, { maxWidth: cols[2].w - 5 });
    }
    const [statut, couleur] = statutPaiement(o);
    text(7.8, couleur, "bold");
    pdf.text(statut, cx(3), top, { align: "center" });
    text(8.8, TEXT, "bold");
    pdf.text(formatNumber(Number(o.montant_total) || 0), cx(4), top, { align: "right" });
    text(8.8, GREEN);
    pdf.text(formatNumber(Number(o.montant_paye) || 0), cx(5), top, { align: "right" });
    const reste = Number(o.montant_restant) || 0;
    text(8.8, reste > 0 ? AMBER : MUTED, reste > 0 ? "bold" : "normal");
    pdf.text(formatNumber(reste), cx(6), top, { align: "right" });
    y += rowH;
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.25);
    pdf.line(MARGIN, y, right, y);
  });

  // ============ Totaux ============
  const rows: [string, string, RGB?][] = [
    ["Encaissé", `${formatNumber(totalPaye)} ${currency}`, GREEN],
    ["Reste à percevoir", `${formatNumber(totalReste)} ${currency}`, totalReste > 0 ? AMBER : undefined],
  ];
  if (totalReductions > 0) rows.push(["Réductions accordées", `${formatNumber(totalReductions)} ${currency}`]);
  if (totalRembourse > 0) rows.push(["Remboursé aux clients", `${formatNumber(totalRembourse)} ${currency}`]);
  if (totalARembourser > 0) rows.push(["Reste à rembourser", `${formatNumber(totalARembourser)} ${currency}`, AMBER]);

  const totalsW = 84;
  const wordsW = CONTENT_W - totalsW - 8;
  const words = `${amountInWords(totalVentes)} ${currency === "FCFA" ? "francs CFA" : currency}`;
  text(9.5, PRIMARY, "bold");
  const wordLines = pdf.splitTextToSize(words.charAt(0).toUpperCase() + words.slice(1), wordsW - 12) as string[];
  const blockH = Math.max(rows.length * 7 + 16, 13 + wordLines.length * 4.6);
  y += 8;
  if (y + blockH > FOOTER_TOP - 4) {
    pdf.addPage();
    y = drawContinuationBand(pdf, store, "Rapport des ventes — suite", true);
  }
  pdf.setFillColor(...PRIMARY_LIGHT);
  pdf.roundedRect(MARGIN, y, wordsW, blockH, 3, 3, "F");
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(MARGIN + 3, y + 4, 1.4, blockH - 8, 0.7, 0.7, "F");
  text(7, MUTED, "bold");
  pdf.text("CHIFFRE D'AFFAIRES DE LA PÉRIODE", MARGIN + 8, y + 7.5);
  text(9.5, PRIMARY, "bold");
  pdf.text(wordLines, MARGIN + 8, y + 13.5);
  const tx = right - totalsW;
  let ty = y + 4;
  rows.forEach(([label, valeur, couleur]) => {
    text(8.5, couleur || MUTED);
    pdf.text(label, tx + 2, ty + 3);
    text(9, couleur || TEXT, "bold");
    pdf.text(valeur, right - 2, ty + 3, { align: "right" });
    ty += 7;
  });
  const totalY = y + blockH - 11;
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(tx, totalY, totalsW, 11, 2.5, 2.5, "F");
  text(8, ON_PRIMARY, "bold");
  pdf.text("TOTAL VENTES", tx + 4, totalY + 7);
  text(12, WHITE, "bold");
  pdf.text(`${formatNumber(totalVentes)} ${currency}`, right - 4, totalY + 7.3, { align: "right" });

  drawFooters(pdf, store);

  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fileName = `Ventes_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.pdf`;
  pdf.save(fileName);
  return fileName;
}
