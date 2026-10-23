import React from "react";
import { useTranslation } from "react-i18next";
import { useProductStore } from "./api/useProductStore";
import { useDeliveryStore } from "../../newdelivery/deliveryStore";
import { useMontantsVente } from "./reductions";
import { formatTaux } from "./tva";

const fmt = (value: number) => `${Math.round(value || 0).toLocaleString("fr-FR")} CFA`;

// Récapitulatif de la vente, présenté comme un ticket de caisse.
export const TotalSection: React.FC = () => {
  const { t } = useTranslation();
  const { selectedProducts } = useProductStore();
  const { statut_paiement, montant_paye } = useDeliveryStore();
  const { brut, detail, totalReductions, net, dette, totalAPayer: aPayer, appliquerTva, tauxTva, montantTva } =
    useMontantsVente();

  const lignes = selectedProducts.map((p) => {
    const unites =
      (Number(p.quantity) || 0) +
      (p.conditionconfig || []).reduce(
        (sum, cc) => sum + (Number(cc.conditionedQuantity) || 0) * (cc.selectedConditioning?.facteur || 1),
        0,
      );
    return { id: p.id, nom: p.name, unites, total: p.total || 0 };
  });
  const totalUnites = lignes.reduce((sum, l) => sum + l.unites, 0);
  const paye = statut_paiement === "non payé" || statut_paiement === "none" ? 0 : Number(montant_paye) || 0;
  const reste = Math.max(aPayer - paye, 0);

  const badge =
    paye <= 0
      ? { texte: t("admin.deliveries.payment.status.none"), classe: "bg-slate-100 text-slate-600" }
      : reste > 0
        ? { texte: t("admin.deliveries.payment.status.partial"), classe: "bg-amber-100 text-amber-700" }
        : { texte: t("admin.deliveries.payment.status.total"), classe: "bg-emerald-100 text-emerald-700" };

  return (
    <div className="flex flex-col gap-3">
      {/* Articles */}
      <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
        {lignes.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">Aucun article</p>
        ) : (
          lignes.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-2 text-sm">
              <span className="min-w-0 text-slate-600">
                <span className="font-semibold text-slate-800">{l.unites} ×</span>{" "}
                <span className="break-words">{l.nom}</span>
              </span>
              <span className={`shrink-0 font-medium ${l.unites === 0 ? "text-red-500" : "text-slate-700"}`}>
                {fmt(l.total)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="space-y-1.5 border-t border-dashed border-slate-300 pt-3 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>
            {lignes.length} article{lignes.length > 1 ? "s" : ""} · {totalUnites} unité{totalUnites > 1 ? "s" : ""}
          </span>
        </div>
        {/* Sans réduction, le sous-total serait égal au total HT affiché juste après. */}
        {!(appliquerTva && totalReductions === 0) && (
          <div className="flex justify-between text-slate-600">
            <span>Sous-total</span>
            <span className="font-medium">{fmt(brut)}</span>
          </div>
        )}
        {detail.map((r) => (
          <div key={r.type} className="flex justify-between gap-2 text-emerald-700">
            <span className="min-w-0">
              {r.libelle}
              {r.mode === "pourcentage" && ` (${r.valeur} %)`}
              {r.motif && <span className="block truncate text-xs text-slate-400">{r.motif}</span>}
            </span>
            <span className="shrink-0 font-medium">− {fmt(r.montant)}</span>
          </div>
        ))}
        {(totalReductions > 0 || appliquerTva) && (
          <div className="flex justify-between border-t border-slate-100 pt-1.5 font-semibold text-slate-700">
            <span>{appliquerTva ? "Total HT" : "Net commercial"}</span>
            <span>{fmt(net)}</span>
          </div>
        )}
        {appliquerTva && tauxTva != null && (
          <div className="flex justify-between text-slate-600">
            <span>TVA ({formatTaux(tauxTva)})</span>
            <span className="font-medium">+ {fmt(montantTva)}</span>
          </div>
        )}
        {dette > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Dette ancienne</span>
            <span className="font-medium">+ {fmt(dette)}</span>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-purple-950 px-4 py-3 text-white">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-200">
          {appliquerTva ? "Total TTC à payer" : "Total à payer"}
        </div>
        <div className="text-2xl font-extrabold">{fmt(aPayer)}</div>
        {totalReductions > 0 && (
          <div className="mt-0.5 text-xs text-purple-200">Économie client : {fmt(totalReductions)}</div>
        )}
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Encaissé</span>
          <span className="font-semibold text-emerald-700">{fmt(paye)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Reste à payer</span>
          <span className={`font-semibold ${reste > 0 ? "text-amber-600" : "text-slate-700"}`}>{fmt(reste)}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-500">Statut</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classe}`}>{badge.texte}</span>
        </div>
      </div>
    </div>
  );
};
