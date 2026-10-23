// Facture de vente au format PDF (A4), même charte que le bon d'approvisionnement.
// Toutes les mesures sont en millimètres.
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
  formatDate,
  formatNumber,
  FOOTER_TOP,
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
import type { RGB, SupplyPdfStore } from "../../Produits/supplyPdf";
import { getUrlServer } from "../../../../configServer";
import type { Order } from "./types";

const GREEN: RGB = [5, 150, 105];
const AMBER: RGB = [217, 119, 6];
const RED: RGB = [220, 38, 38];

const METHODES: Record<string, string> = {
  cash: "Espèces",
  om: "Orange Money",
  momo: "MTN MoMo",
  bancaire: "Virement bancaire",
};

export const invoiceReference = (id: string): string => `FAC-${(id || "").slice(-8).toUpperCase()}`;

const initials = (name?: string): string => {
  const parts = clean(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Identité de l'entreprise (profil du magasin) et logo, pour l'en-tête. */
export const loadStoreForPdf = async (): Promise<{ store: SupplyPdfStore; logoUrl: string | null }> => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  let store: SupplyPdfStore = { denomination: localStorage.getItem("denomination_magasin") || undefined };
  try {
    const res = await fetch(`${getUrlServer()}/magasin/`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) store = (await res.json())?.magasin || store;
  } catch {
    // En-tête minimal si le profil est indisponible.
  }
  return { store, logoUrl: store.logo || localStorage.getItem("logo_magasin") || null };
};

export type InvoiceMode = "download" | "print";

/** Télécharge le PDF, ou l'imprime tel quel (cadre caché ; en secours, nouvel onglet). */
export const livrerPdf = (pdf: JsPDF, fileName: string, mode: InvoiceMode) => {
  if (mode !== "print") {
    pdf.save(fileName);
    return;
  }
  pdf.autoPrint();
  const url = pdf.output("bloburl") as unknown as string;
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.src = url;
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      window.open(url, "_blank");
    }
    setTimeout(() => frame.remove(), 60_000);
  };
  document.body.appendChild(frame);
};

const MODES_REMBOURSEMENT: Record<string, string> = {
  especes: "Espèces",
  om: "Orange Money",
  momo: "MTN MoMo",
  bancaire: "Virement bancaire",
  credit_client: "Crédit compte client",
};
export const libelleModeRemboursement = (mode?: string | null, libelle?: string | null) =>
  clean(libelle) || MODES_REMBOURSEMENT[mode || ""] || clean(mode) || "-";

export async function generateDeliveryInvoicePdf(
  order: Order & { paiements?: { methode: string; montant: number }[]; dette_ancienne?: number; created_at?: string },
  mode: InvoiceMode = "download",
): Promise<string> {
  const { store, logoUrl } = await loadStoreForPdf();
  const { jsPDF } = await import("jspdf");
  // Textes du PDF traduits dans la langue de l'interface.
  const pdf: JsPDF = traduirePdf(new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }));
  const currency = currencyLabel(store.devise);
  const reference = invoiceReference(order.id);
  const right = PDF_RIGHT;
  const date = order.date_commande || order.created_at || "";

  // ======================= EN-TÊTE =======================
  const logo = logoUrl ? await loadImage(logoUrl) : null;
  // En-tête clair (logo rond au centre) : identique en téléchargement et à
  // l'impression, et lisible sur toutes les imprimantes.
  const bandH = drawCompanyBand(pdf, store, logo, {
    kicker: "DOCUMENT DE VENTE", title: "FACTURE", pill: reference, clair: true,
  });
  let y = bandH + 8;

  // ======================= REPÈRES =======================
  const statut = (order.statut_paiement || "").toLowerCase();
  const statutLabel = statut.startsWith("pay") ? "Payée" : statut.startsWith("partiel") ? "Partiellement payée" : "Non payée";
  const produits = order.produits || [];
  drawChips(pdf, y, [
    ["Date de vente", formatDate(date)],
    ["Articles", formatNumber(produits.length)],
    ["Quantité totale", formatNumber(order.quantity ?? produits.reduce((s, p) => s + (Number(p.quantite) || 0), 0))],
    ["Paiement", statutLabel],
  ]);
  y += 15 + 8;

  // ======================= PARTIES =======================
  const partyW = (CONTENT_W - 8) / 2;
  const client = order.client || { nom: "" };
  const clientDetails = [
    client.telephone ? `Tél. : ${clean(client.telephone)}` : "",
    client.email ? clean(client.email) : "",
    [clean(client.quartier), clean(client.ville)].filter((v) => v && v.toUpperCase() !== "N/A").join(", "),
  ].filter(Boolean);
  const partyH = 14 + Math.max(clientDetails.length, 1) * 4.5 + 6;

  const drawParty = (x: number, title: string, nom: string, role: string, details: string[]) => {
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.3);
    pdf.setFillColor(...WHITE);
    pdf.roundedRect(x, y, partyW, partyH, 3, 3, "FD");
    setPdfText(pdf, 7, MUTED, "bold");
    pdf.text(title, x + 5, y + 6.5);
    const cx = x + 10.5;
    const cy = y + 15.5;
    pdf.setFillColor(...PRIMARY);
    pdf.circle(cx, cy, 5.5, "F");
    setPdfText(pdf, 8.5, WHITE, "bold");
    pdf.text(initials(nom), cx, cy + 1.1, { align: "center" });
    const tx = x + 19;
    const tw = partyW - 23;
    setPdfText(pdf, 10.5, TEXT, "bold");
    pdf.text(clean(nom) || "Non renseigné", tx, y + 14.5, { maxWidth: tw });
    setPdfText(pdf, 8, PRIMARY, "bold");
    pdf.text(role, tx, y + 19, { maxWidth: tw });
    setPdfText(pdf, 8, MUTED);
    details.forEach((line, i) => pdf.text(line, tx, y + 23.5 + i * 4.5, { maxWidth: tw }));
  };
  drawParty(MARGIN, "VENDU PAR", order.nom_livreur || clean(store.denomination), "Vendeur", []);
  drawParty(MARGIN + partyW + 8, "FACTURÉ À", client.nom || "Client de passage", "Client", clientDetails);
  y += partyH + 10;

  // ======================= TABLEAU =======================
  setPdfText(pdf, 11, TEXT, "bold");
  pdf.text("Détail des articles", MARGIN, y);
  y += 4;

  const cols = [
    { title: "#", w: 10, align: "center" as const },
    { title: "Désignation", w: 74, align: "left" as const },
    { title: "Unité", w: 20, align: "center" as const },
    { title: "Qté", w: 16, align: "right" as const },
    { title: "Prix unitaire", w: 28, align: "right" as const },
    { title: `Montant (${currency})`, w: CONTENT_W - 148, align: "right" as const },
  ];
  const colX = cols.reduce<number[]>((acc, _c, i) => [...acc, i === 0 ? MARGIN : acc[i - 1] + cols[i - 1].w], []);
  const cellX = (i: number) => {
    const col = cols[i];
    return col.align === "left" ? colX[i] + 3 : col.align === "right" ? colX[i] + col.w - 3 : colX[i] + col.w / 2;
  };
  const drawTableHeader = () => {
    pdf.setFillColor(...PRIMARY_LIGHT);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, "F");
    setPdfText(pdf, 7.5, PRIMARY, "bold");
    cols.forEach((col, i) => pdf.text(col.title.toUpperCase(), cellX(i), y + 5.8, { align: col.align }));
    y += 11;
  };
  const newPage = () => {
    pdf.addPage();
    y = drawContinuationBand(pdf, store, `Facture ${reference} — suite`, true);
  };

  drawTableHeader();
  produits.forEach((p, index) => {
    const nom = clean(p.nom) || "Produit";
    const sous = p.is_conditionne && p.conditionnement_nom ? `Vendu par ${clean(p.conditionnement_nom).toLowerCase()} de ${p.facteur}` : "";
    setPdfText(pdf, 9.5, TEXT, "bold");
    const lines = pdf.splitTextToSize(nom, cols[1].w - 6) as string[];
    const rowH = lines.length * 4.4 + (sous ? 4 : 0) + 4.4;
    if (y + rowH > FOOTER_TOP - 8) {
      newPage();
      drawTableHeader();
    }
    const top = y + 4.6;
    const quantite = Number(p.quantite) || 0;
    const prix = Number(p.prix) || 0;
    setPdfText(pdf, 8.5, MUTED);
    pdf.text(String(index + 1).padStart(2, "0"), cellX(0), top, { align: "center" });
    setPdfText(pdf, 9.5, TEXT, "bold");
    pdf.text(lines, cellX(1), top);
    if (sous) {
      setPdfText(pdf, 7.5, MUTED);
      pdf.text(sous, cellX(1), top + lines.length * 4.4);
    }
    setPdfText(pdf, 8.5, MUTED);
    pdf.text(clean(p.unite) || "-", cellX(2), top, { align: "center" });
    setPdfText(pdf, 9.5, TEXT);
    pdf.text(formatNumber(quantite), cellX(3), top, { align: "right" });
    pdf.text(formatNumber(prix), cellX(4), top, { align: "right" });
    setPdfText(pdf, 9.5, TEXT, "bold");
    pdf.text(formatNumber(quantite * prix), cellX(5), top, { align: "right" });
    y += rowH;
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.25);
    pdf.line(MARGIN, y, right, y);
  });

  // ======================= TOTAUX =======================
  const montantTotal = Number(order.montant_total) || 0;
  const montantPaye = Number(order.montant_paye) || 0;
  const reste = Number(order.montant_restant) || Math.max(montantTotal - montantPaye, 0);
  const dette = Number(order.dette_ancienne) || 0;
  const reductions = order.reductions || [];
  const rows: [string, string, RGB?][] = [];
  const montantTva = Number(order.montant_tva) || 0;
  const tauxTva = Number(order.taux_tva) || 0;
  const avecTva = !!order.appliquer_tva && montantTva > 0;
  // Sans réduction, le sous-total serait égal au total HT affiché ensuite.
  if (reductions.length || !avecTva) {
    rows.push(["Sous-total", `${formatNumber(order.montant_brut ?? order.montant_produits ?? montantTotal)} ${currency}`]);
  }
  reductions.forEach((r) => {
    const libelle = `${r.libelle}${r.mode === "pourcentage" ? ` (${formatNumber(r.valeur)} %)` : ""}`;
    rows.push([libelle, `- ${formatNumber(r.montant)} ${currency}`, GREEN]);
  });
  if (avecTva) {
    rows.push(["Total HT", `${formatNumber(order.montant_produits)} ${currency}`]);
    rows.push([`TVA (${formatNumber(tauxTva)} %)`, `+ ${formatNumber(montantTva)} ${currency}`]);
  } else if (reductions.length) {
    rows.push(["Net commercial", `${formatNumber(order.montant_produits)} ${currency}`]);
  }
  if (dette > 0) rows.push(["Dette antérieure", `+ ${formatNumber(dette)} ${currency}`]);

  const totalsW = 82;
  const wordsW = CONTENT_W - totalsW - 8;
  const words = `${amountInWords(montantTotal)} ${currency === "FCFA" ? "francs CFA" : currency}`;
  setPdfText(pdf, 9.5, PRIMARY, "bold");
  const wordLines = pdf.splitTextToSize(words.charAt(0).toUpperCase() + words.slice(1), wordsW - 10) as string[];
  const totalsH = rows.length * 7 + 16;
  const wordsH = 13 + wordLines.length * 4.6;
  const blockH = Math.max(totalsH, wordsH);
  if (y + 8 + blockH + 30 > FOOTER_TOP - 4) newPage();
  y += 8;

  pdf.setFillColor(...PRIMARY_LIGHT);
  pdf.roundedRect(MARGIN, y, wordsW, blockH, 3, 3, "F");
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(MARGIN + 3, y + 4, 1.4, blockH - 8, 0.7, 0.7, "F");
  setPdfText(pdf, 7, MUTED, "bold");
  pdf.text("ARRÊTÉE LA PRÉSENTE FACTURE À LA SOMME DE", MARGIN + 8, y + 7.5);
  setPdfText(pdf, 9.5, PRIMARY, "bold");
  pdf.text(wordLines, MARGIN + 8, y + 13.5);

  const tx = right - totalsW;
  let ty = y + 4;
  rows.forEach(([label, value, color]) => {
    setPdfText(pdf, 8.5, color || MUTED);
    pdf.text(label, tx + 2, ty + 3, { maxWidth: totalsW - 38 });
    setPdfText(pdf, 9, color || TEXT, "bold");
    pdf.text(value, right - 2, ty + 3, { align: "right" });
    ty += 7;
  });
  const totalY = y + blockH - 11;
  pdf.setFillColor(...PRIMARY);
  pdf.roundedRect(tx, totalY, totalsW, 11, 2.5, 2.5, "F");
  setPdfText(pdf, 8, ON_PRIMARY, "bold");
  pdf.text(avecTva ? "TOTAL TTC" : "TOTAL À PAYER", tx + 4, totalY + 7);
  setPdfText(pdf, 12, WHITE, "bold");
  pdf.text(`${formatNumber(montantTotal)} ${currency}`, right - 4, totalY + 7.3, { align: "right" });
  y += blockH + 8;

  // ======================= RÈGLEMENT =======================
  const paiements = (order.paiements || []).filter((p) => Number(p.montant) > 0);
  const modes = paiements.length
    ? paiements.map((p) => `${METHODES[p.methode] || clean(p.methode)} : ${formatNumber(p.montant)} ${currency}`).join("   ·   ")
    : montantPaye > 0 && order.methode_paiement
      ? `${METHODES[order.methode_paiement] || clean(order.methode_paiement)} : ${formatNumber(montantPaye)} ${currency}`
      : "";
  const etat: [string, RGB] = reste <= 0 && montantTotal > 0 ? ["PAYÉE", GREEN] : montantPaye > 0 ? ["PARTIELLEMENT PAYÉE", AMBER] : ["NON PAYÉE", RED];

  pdf.setDrawColor(...LINE);
  pdf.setFillColor(...WHITE);
  pdf.roundedRect(MARGIN, y, CONTENT_W, modes ? 20 : 15, 3, 3, "FD");
  setPdfText(pdf, 7, MUTED, "bold");
  pdf.text("RÈGLEMENT", MARGIN + 5, y + 6);
  setPdfText(pdf, 9, TEXT);
  pdf.text(`Payé : `, MARGIN + 5, y + 11.5);
  setPdfText(pdf, 9, GREEN, "bold");
  pdf.text(`${formatNumber(montantPaye)} ${currency}`, MARGIN + 16, y + 11.5);
  setPdfText(pdf, 9, TEXT);
  pdf.text(`Reste à payer : `, MARGIN + 62, y + 11.5);
  setPdfText(pdf, 9, reste > 0 ? AMBER : TEXT, "bold");
  pdf.text(`${formatNumber(reste)} ${currency}`, MARGIN + 87, y + 11.5);
  if (modes) {
    setPdfText(pdf, 8, MUTED);
    pdf.text(modes, MARGIN + 5, y + 16.5, { maxWidth: CONTENT_W - 50 });
  }
  // Tampon d'état
  setPdfText(pdf, 9, etat[1], "bold");
  const stampW = pdf.getTextWidth(etat[0]) + 10;
  pdf.setDrawColor(...etat[1]);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(right - stampW - 5, y + 4.5, stampW, 9, 2, 2, "S");
  pdf.text(etat[0], right - 5 - stampW / 2, y + 10.3, { align: "center" });
  y += (modes ? 20 : 15) + 7;

  // ======================= RETOURS ET REMBOURSEMENTS =======================
  const retours = order.retours || [];
  const remboursements = order.remboursements || [];
  const resteARembourser = Number(order.retour) || 0;
  if (retours.length || remboursements.length || resteARembourser > 0) {
    type Ligne = { date: string; titre: string; detail: string; montant: string; couleur: RGB };
    const lignes: Ligne[] = [
      ...retours.map((r) => ({
        date: r.created_at,
        titre: "Retour d'articles",
        detail: [
          (r.produits || [])
            .map((p) => `${formatNumber(Number(p.quantite) || 0)} × ${clean(p.nom) || "article"}`)
            .join(", "),
          r.motif ? `Motif : ${clean(r.motif)}` : "",
        ].filter(Boolean).join("  ·  "),
        montant: r.montant_retour != null ? `- ${formatNumber(Number(r.montant_retour))} ${currency}` : "",
        couleur: AMBER,
      })),
      ...remboursements.map((r) => ({
        date: r.date.endsWith("Z") || r.date.includes("+") ? r.date : `${r.date}Z`,
        titre: `Remboursement · ${libelleModeRemboursement(r.mode, r.mode_libelle)}`,
        detail: [r.reference ? `Réf. ${clean(r.reference)}` : "", r.telephone ? `N° ${clean(r.telephone)}` : "",
          r.par_nom ? `par ${clean(r.par_nom)}` : "", clean(r.motif)].filter(Boolean).join("  ·  "),
        montant: `${formatNumber(Number(r.montant) || 0)} ${currency}`,
        couleur: GREEN,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const mesures = lignes.map((l) => {
      setPdfText(pdf, 7.8, MUTED);
      const detail = l.detail ? (pdf.splitTextToSize(l.detail, CONTENT_W - 70) as string[]) : [];
      return { ...l, detailLignes: detail, h: 6 + detail.length * 3.8 + 2.5 };
    });
    const titreH = 9;
    const resteH = resteARembourser > 0 ? 9 : 0;
    if (y + titreH + (mesures[0]?.h ?? 0) + resteH > FOOTER_TOP - 10) newPage();
    setPdfText(pdf, 11, TEXT, "bold");
    pdf.text("Retours et remboursements", MARGIN, y + 4);
    setPdfText(pdf, 7.5, MUTED);
    pdf.text("Les quantités de la facture tiennent déjà compte des articles retournés.", PDF_RIGHT, y + 4, { align: "right" });
    y += titreH;
    mesures.forEach((l) => {
      if (y + l.h > FOOTER_TOP - 8) newPage();
      pdf.setFillColor(...l.couleur);
      pdf.circle(MARGIN + 2, y + 2.6, 1.1, "F");
      setPdfText(pdf, 9, TEXT, "bold");
      pdf.text(l.titre, MARGIN + 6, y + 3.6);
      const titreW = pdf.getTextWidth(l.titre);
      setPdfText(pdf, 7.8, MUTED);
      pdf.text(formatDate(l.date), MARGIN + 6 + titreW + 4, y + 3.6);
      if (l.detailLignes.length) pdf.text(l.detailLignes, MARGIN + 6, y + 7.6);
      if (l.montant) {
        setPdfText(pdf, 9.5, l.couleur, "bold");
        pdf.text(l.montant, right, y + 3.6, { align: "right" });
      }
      y += l.h;
      pdf.setDrawColor(...LINE);
      pdf.setLineWidth(0.25);
      pdf.line(MARGIN, y - 1, right, y - 1);
    });
    if (resteARembourser > 0) {
      pdf.setFillColor(254, 243, 199);
      pdf.roundedRect(MARGIN, y + 1, CONTENT_W, 8, 2, 2, "F");
      setPdfText(pdf, 8.5, AMBER, "bold");
      pdf.text("Reste à rembourser au client", MARGIN + 4, y + 6.2);
      pdf.text(`${formatNumber(resteARembourser)} ${currency}`, right - 4, y + 6.2, { align: "right" });
      y += resteH;
    }
    y += 6;
  }

  setPdfText(pdf, 7.5, MUTED);
  pdf.text("Merci pour votre confiance. Les marchandises vendues restent soumises aux conditions de retour du magasin.",
    MARGIN, Math.min(y, FOOTER_TOP - 4), { maxWidth: CONTENT_W });

  drawFooters(pdf, store);

  const fileName = `Facture_${reference}_${formatDate(date, false).split("/").reverse().join("-") || "vente"}.pdf`;
  livrerPdf(pdf, fileName, mode);
  return fileName;
}
