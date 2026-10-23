// Reçu de remboursement (A4), même charte que la facture de vente.
import { traduirePdf } from "../../../../traduction/interface";
import type { jsPDF as JsPDF } from "jspdf";
import {
  amountInWords,
  clean,
  CONTENT_W,
  currencyLabel,
  drawChips,
  drawCompanyBand,
  drawFooters,
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
import {
  invoiceReference,
  libelleModeRemboursement,
  livrerPdf,
  loadStoreForPdf,
  type InvoiceMode,
} from "./deliveryInvoicePdf";
import type { Order } from "./types";

const GREEN: RGB = [5, 150, 105];
const AMBER: RGB = [217, 119, 6];

export type Remboursement = NonNullable<Order["remboursements"]>[number];

/** Date ISO enregistrée en UTC sans fuseau : on la lit comme UTC. */
const dateUtc = (iso: string) => (iso.endsWith("Z") || /[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);

export const refundReference = (order: Order, remboursement: Remboursement): string => {
  const index = (order.remboursements || []).findIndex((r) => r.date === remboursement.date);
  return `RMB-${(order.id || "").slice(-6).toUpperCase()}-${String((index >= 0 ? index : (order.remboursements || []).length) + 1).padStart(2, "0")}`;
};

export async function generateRefundReceiptPdf(
  order: Order,
  remboursement: Remboursement,
  mode: InvoiceMode = "download",
): Promise<string> {
  const { store, logoUrl } = await loadStoreForPdf();
  const { jsPDF } = await import("jspdf");
  // Textes du PDF traduits dans la langue de l'interface.
  const pdf: JsPDF = traduirePdf(new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }));
  const currency = currencyLabel(store.devise);
  const right = PDF_RIGHT;
  const reference = refundReference(order, remboursement);
  const date = dateUtc(remboursement.date);
  const montant = Number(remboursement.montant) || 0;
  const modeLibelle = libelleModeRemboursement(remboursement.mode, remboursement.mode_libelle);

  // ======================= EN-TÊTE ET REPÈRES =======================
  const logo = logoUrl ? await loadImage(logoUrl) : null;
  const bandH = drawCompanyBand(pdf, store, logo, {
    // Même en-tête clair en téléchargement et à l'impression.
    kicker: "SERVICE CLIENT", title: "REÇU DE REMBOURSEMENT", pill: reference, clair: true,
  });
  let y = bandH + 8;
  drawChips(pdf, y, [
    ["Date", formatDate(date)],
    ["Vente concernée", invoiceReference(order.id)],
    ["Mode", modeLibelle],
    ["Montant", `${formatNumber(montant)} ${currency}`],
  ]);
  y += 15 + 10;

  // ======================= BÉNÉFICIAIRE =======================
  const client = order.client || { nom: "" };
  const lignesClient = [
    clean(client.nom) || clean(order.clientName) || "Client de passage",
    client.telephone ? `Tél. : ${clean(client.telephone)}` : "",
    [clean(client.quartier), clean(client.ville)].filter((v) => v && v.toUpperCase() !== "N/A").join(", "),
  ].filter(Boolean);
  const lignesOperation: [string, string][] = [
    ["Mode de remboursement", modeLibelle],
    ...(remboursement.reference ? [["Référence de transaction", clean(remboursement.reference)] as [string, string]] : []),
    ...(remboursement.telephone ? [["Numéro bénéficiaire", clean(remboursement.telephone)] as [string, string]] : []),
    ...(remboursement.par_nom ? [["Effectué par", clean(remboursement.par_nom)] as [string, string]] : []),
    ...(remboursement.motif ? [["Note", clean(remboursement.motif)] as [string, string]] : []),
  ];
  const boxW = (CONTENT_W - 8) / 2;
  const boxH = 12 + Math.max(lignesClient.length * 5, lignesOperation.length * 8.5) + 4;
  const box = (x: number, titre: string) => {
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.3);
    pdf.setFillColor(...WHITE);
    pdf.roundedRect(x, y, boxW, boxH, 3, 3, "FD");
    setPdfText(pdf, 7, MUTED, "bold");
    pdf.text(titre, x + 5, y + 6.5);
  };
  box(MARGIN, "REMBOURSÉ À");
  lignesClient.forEach((l, i) => {
    setPdfText(pdf, i === 0 ? 11 : 8.5, i === 0 ? TEXT : MUTED, i === 0 ? "bold" : "normal");
    pdf.text(l, MARGIN + 5, y + 13 + i * 5, { maxWidth: boxW - 10 });
  });
  const ox = MARGIN + boxW + 8;
  box(ox, "OPÉRATION");
  lignesOperation.forEach(([label, valeur], i) => {
    setPdfText(pdf, 7.5, MUTED);
    pdf.text(label, ox + 5, y + 12.5 + i * 8.5);
    setPdfText(pdf, 9, TEXT, "bold");
    pdf.text(valeur, ox + 5, y + 16.5 + i * 8.5, { maxWidth: boxW - 10 });
  });
  y += boxH + 10;

  // ======================= ORIGINE : RETOURS =======================
  const retours = order.retours || [];
  if (retours.length) {
    setPdfText(pdf, 11, TEXT, "bold");
    pdf.text("Articles retournés", MARGIN, y);
    y += 4;
    pdf.setFillColor(...PRIMARY_LIGHT);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 8.5, 2, 2, "F");
    setPdfText(pdf, 7.5, PRIMARY, "bold");
    pdf.text("DATE", MARGIN + 3, y + 5.6);
    pdf.text("ARTICLES", MARGIN + 36, y + 5.6);
    pdf.text(`VALEUR (${currency})`, right - 3, y + 5.6, { align: "right" });
    y += 10.5;
    retours.forEach((r) => {
      const articles = (r.produits || [])
        .map((p) => `${formatNumber(Number(p.quantite) || 0)} × ${clean(p.nom) || "article"}`)
        .join(", ");
      const texte = [articles, r.motif ? `Motif : ${clean(r.motif)}` : ""].filter(Boolean).join("  ·  ");
      setPdfText(pdf, 8.5, TEXT);
      const lignes = pdf.splitTextToSize(texte || "-", CONTENT_W - 36 - 40) as string[];
      setPdfText(pdf, 8, MUTED);
      pdf.text(formatDate(r.created_at, false), MARGIN + 3, y + 4);
      setPdfText(pdf, 8.5, TEXT);
      pdf.text(lignes, MARGIN + 36, y + 4);
      if (r.montant_retour != null) {
        setPdfText(pdf, 9, TEXT, "bold");
        pdf.text(formatNumber(Number(r.montant_retour)), right - 3, y + 4, { align: "right" });
      }
      y += lignes.length * 4.2 + 3.5;
      pdf.setDrawColor(...LINE);
      pdf.setLineWidth(0.25);
      pdf.line(MARGIN, y - 1, right, y - 1);
    });
    y += 6;
  }

  // ======================= MONTANT =======================
  // Cumul et reste calculés depuis l'historique, à la date de CE remboursement :
  // un reçu réimprimé plus tard garde les chiffres de son jour.
  const historique = order.remboursements || [];
  const totalHistorique = historique.reduce((s, r) => s + (Number(r.montant) || 0), 0);
  const instant = new Date(date).getTime();
  const dejaRembourse = historique.some((r) => r.date === remboursement.date)
    ? historique
        .filter((r) => new Date(dateUtc(r.date)).getTime() <= instant)
        .reduce((s, r) => s + (Number(r.montant) || 0), 0)
    : totalHistorique + montant;
  const resteDu = Math.max(totalHistorique + (Number(order.retour) || 0) - dejaRembourse, 0);
  const rows: [string, string, RGB?][] = [
    ["Total de la vente (après retour)", `${formatNumber(Number(order.montant_total) || 0)} ${currency}`],
    ["Payé par le client", `${formatNumber(Number(order.montant_paye) || 0)} ${currency}`],
    ["Total remboursé à ce jour", `${formatNumber(dejaRembourse)} ${currency}`, GREEN],
    ["Reste à rembourser", `${formatNumber(resteDu)} ${currency}`, resteDu > 0 ? AMBER : undefined],
  ];
  const totalsW = 86;
  const wordsW = CONTENT_W - totalsW - 8;
  const words = `${amountInWords(montant)} ${currency === "FCFA" ? "francs CFA" : currency}`;
  setPdfText(pdf, 9.5, PRIMARY, "bold");
  const wordLines = pdf.splitTextToSize(words.charAt(0).toUpperCase() + words.slice(1), wordsW - 12) as string[];
  const blockH = Math.max(rows.length * 7 + 16, 13 + wordLines.length * 4.6);
  pdf.setFillColor(...PRIMARY_LIGHT);
  pdf.roundedRect(MARGIN, y, wordsW, blockH, 3, 3, "F");
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(MARGIN + 3, y + 4, 1.4, blockH - 8, 0.7, 0.7, "F");
  setPdfText(pdf, 7, MUTED, "bold");
  pdf.text("ARRÊTÉ LE PRÉSENT REÇU À LA SOMME DE", MARGIN + 8, y + 7.5);
  setPdfText(pdf, 9.5, PRIMARY, "bold");
  pdf.text(wordLines, MARGIN + 8, y + 13.5);
  const tx = right - totalsW;
  let ty = y + 4;
  rows.forEach(([label, valeur, couleur]) => {
    setPdfText(pdf, 8.3, couleur || MUTED);
    pdf.text(label, tx + 2, ty + 3);
    setPdfText(pdf, 9, couleur || TEXT, "bold");
    pdf.text(valeur, right - 2, ty + 3, { align: "right" });
    ty += 7;
  });
  const totalY = y + blockH - 11;
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(tx, totalY, totalsW, 11, 2.5, 2.5, "F");
  setPdfText(pdf, 8, ON_PRIMARY, "bold");
  pdf.text("MONTANT REMBOURSÉ", tx + 4, totalY + 7);
  setPdfText(pdf, 12, WHITE, "bold");
  pdf.text(`${formatNumber(montant)} ${currency}`, right - 4, totalY + 7.3, { align: "right" });
  y += blockH + 16;

  // ======================= SIGNATURES =======================
  const sigW = (CONTENT_W - 20) / 2;
  [["Le client", MARGIN], ["Pour le magasin", MARGIN + sigW + 20]].forEach(([label, x]) => {
    setPdfText(pdf, 8, MUTED, "bold");
    pdf.text(String(label).toUpperCase(), Number(x), y);
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.4);
    pdf.line(Number(x), y + 18, Number(x) + sigW, y + 18);
    setPdfText(pdf, 7, MUTED);
    pdf.text("Nom et signature", Number(x), y + 22);
  });

  drawFooters(pdf, store);

  const fileName = `Recu_remboursement_${reference}.pdf`;
  livrerPdf(pdf, fileName, mode);
  return fileName;
}
