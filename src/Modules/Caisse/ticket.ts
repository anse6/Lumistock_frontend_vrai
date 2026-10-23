// Ticket de caisse au format 80 mm (imprimantes thermiques), imprimé dans un cadre caché.
import type { ContexteCaisse, VenteCaisse } from "./api";
import { api, argent, libelleMode } from "./api";
import { traduireArbre } from "../../traduction/interface";

const echapper = (t: unknown) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Ce dont le ticket a besoin : l'en-tête du magasin (contexte du caissier ou route /caisse/tickets). */
export type EnteteTicket = Pick<ContexteCaisse, "magasin">;

export const htmlTicket = (vente: VenteCaisse, ctx: EnteteTicket, monnaieRendue = 0, libelleVendeur = "Caissier") => {
  const d = ctx.magasin.devise;
  const m = (n: number) => echapper(argent(n, d));
  const lignes = vente.lignes
    .map((l) => {
      const qte = l.conditionnement ? `${l.quantite_conditionnement} × ${l.conditionnement} (${l.facteur})` : `${l.quantite} × ${m(l.prix_unitaire)}`;
      return `<tr><td colspan="2" class="nom">${echapper(l.nom)}</td></tr>
        <tr><td class="qte">${echapper(qte)}</td><td class="r">${m(l.total)}</td></tr>`;
    })
    .join("");
  const reductions = vente.reductions
    .map((r) => `<tr><td>${echapper(r.libelle)}</td><td class="r">− ${m(r.montant)}</td></tr>`)
    .join("");
  const paiements = vente.paiements
    .map((p) => `<tr><td>${echapper(libelleMode(p.mode))}</td><td class="r">${m(p.montant)}</td></tr>`)
    .join("");
  const date = new Date(vente.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  // En-tête : nom commercial, puis mentions légales (Paramètres > profil du magasin).
  const mag = ctx.magasin;
  const nomMagasin = mag.denomination || mag.raison_sociale || "";
  const juridique = mag.raison_sociale ? [mag.forme_juridique, mag.raison_sociale].filter(Boolean).join(" · ") : "";
  const adresse = mag.adresse_lignes?.length ? mag.adresse_lignes : mag.adresse ? [mag.adresse] : [];

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${echapper(vente.numero)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { width: 80mm; margin: 0; padding: 4mm 4mm 8mm; font: 12px/1.35 "Courier New", ui-monospace, monospace; color: #000; }
  .c { text-align: center; } .r { text-align: right; white-space: nowrap; }
  h1 { font-size: 15px; margin: 0 0 2px; } .petit { font-size: 10.5px; }
  hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; } td { padding: 1px 0; vertical-align: top; }
  .nom { font-weight: bold; padding-top: 4px; } .qte { padding-left: 6px; }
  .total td { font-size: 15px; font-weight: bold; padding-top: 4px; }
  img { max-height: 14mm; max-width: 30mm; display: block; margin: 0 auto 4px; }
  .entete td:first-child { padding-right: 6px; white-space: nowrap; }
  .entete .adresse { white-space: normal; }
</style></head><body>
  ${mag.logo ? `<img src="${echapper(mag.logo)}" alt="">` : ""}
  <h1>${echapper(nomMagasin)}</h1>
  ${juridique ? `<div class="petit"><b>${echapper(juridique)}</b></div>` : ""}
  <table class="petit entete">
    ${mag.rccm ? `<tr><td>RCCM</td><td class="r">${echapper(mag.rccm)}</td></tr>` : ""}
    ${mag.niu ? `<tr><td>NIU</td><td class="r">${echapper(mag.niu)}</td></tr>` : ""}
    ${mag.telephone ? `<tr><td>Tél.</td><td class="r">${echapper(mag.telephone)}</td></tr>` : ""}
    ${mag.email ? `<tr><td>E-mail</td><td class="r">${echapper(mag.email)}</td></tr>` : ""}
    ${adresse.length ? `<tr><td>Adresse</td><td class="r adresse">${adresse.map(echapper).join("<br>")}</td></tr>` : ""}
  </table>
  <hr>
  <table class="petit">
    <tr><td>Ticket</td><td class="r">${echapper(vente.numero)}</td></tr>
    <tr><td>Date</td><td class="r">${echapper(date)}</td></tr>
    <tr><td>${echapper(libelleVendeur)}</td><td class="r">${echapper(vente.vendeur)}</td></tr>
    <tr><td>Client</td><td class="r">${echapper(vente.client.nom)}</td></tr>
  </table>
  <hr>
  <table>${lignes}</table>
  <hr>
  <table>
    ${vente.total_reductions > 0 ? `<tr><td>Sous-total</td><td class="r">${m(vente.montant_brut)}</td></tr>${reductions}` : ""}
    ${vente.appliquer_tva ? `<tr><td>Total HT</td><td class="r">${m(vente.montant_ht)}</td></tr>
      <tr><td>TVA ${echapper(vente.taux_tva)} %</td><td class="r">${m(vente.montant_tva)}</td></tr>` : ""}
    <tr class="total"><td>TOTAL${vente.appliquer_tva ? " TTC" : ""}</td><td class="r">${m(vente.montant_total)}</td></tr>
  </table>
  <hr>
  <table>
    ${paiements}
    ${vente.credit_client_utilise > 0 ? `<tr><td>Avoir client utilisé</td><td class="r">${m(vente.credit_client_utilise)}</td></tr>` : ""}
    ${monnaieRendue > 0 ? `<tr><td>Monnaie rendue</td><td class="r">${m(monnaieRendue)}</td></tr>` : ""}
    ${vente.reste > 0 ? `<tr><td><b>Reste à payer</b></td><td class="r"><b>${m(vente.reste)}</b></td></tr>` : ""}
  </table>
  ${vente.annulee ? `<hr><div class="c"><b>*** VENTE ANNULÉE ***</b></div>` : ""}
  <hr>
  <div class="c petit">${vente.articles} article${vente.articles > 1 ? "s" : ""}</div>
  <div class="c petit">Merci de votre visite chez ${echapper(nomMagasin)} !</div>
</body></html>`;
};

/** Imprime le ticket via un cadre caché (pas de fenêtre surgissante bloquée). */
export const imprimerTicket = (vente: VenteCaisse, ctx: EnteteTicket, monnaieRendue = 0, libelleVendeur = "Caissier") => {
  const cadre = document.createElement("iframe");
  cadre.setAttribute("aria-hidden", "true");
  Object.assign(cadre.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(cadre);
  const doc = cadre.contentDocument!;
  doc.open();
  doc.write(htmlTicket(vente, ctx, monnaieRendue, libelleVendeur));
  doc.close();
  // Textes du ticket traduits dans la langue de l'interface.
  traduireArbre(doc.documentElement);
  const lancer = () => {
    cadre.contentWindow?.focus();
    cadre.contentWindow?.print();
    setTimeout(() => cadre.remove(), 1500);
  };
  // Attendre le logo avant d'imprimer.
  const img = doc.querySelector("img");
  if (img && !img.complete) {
    img.onload = lancer;
    img.onerror = lancer;
  } else setTimeout(lancer, 50);
};

/**
 * Réimprime le ticket 80 mm de n'importe quelle vente : le caissier passe par sa
 * caisse, l'admin et le manager par /caisse/tickets (même ticket, même mise en page).
 */
export const imprimerTicketVente = async (venteId: string, caissier: boolean) => {
  if (caissier) {
    const [vente, ctx] = await Promise.all([api.vente(venteId), api.contexte()]);
    imprimerTicket(vente, ctx);
    return;
  }
  const { vente, magasin } = await api.ticket(venteId);
  imprimerTicket(vente, { magasin }, 0, "Vendeur");
};
