import React from "react";
import { InputNumber, Switch, Tooltip } from "antd";
import { Info } from "lucide-react";
import { useDeliveryStore } from "../../newdelivery/deliveryStore";
import { TYPES_REDUCTION, TypeReduction, ModeReduction, useMontantsVente } from "./reductions";

const fmt = (value: number) => `${Math.round(value || 0).toLocaleString("fr-FR")} CFA`;

// Saisie des réductions commerciales : rabais, remise, ristourne.
export const ReductionsSection: React.FC = () => {
  const reductions = useDeliveryStore((s) => s.reductions);
  const setReductions = useDeliveryStore((s) => s.setReductions);
  const { detail } = useMontantsVente();

  const activer = (type: TypeReduction, actif: boolean) =>
    setReductions(
      actif
        ? [...reductions, { type, mode: "pourcentage", valeur: 0, motif: "" }]
        : reductions.filter((r) => r.type !== type),
    );

  const modifier = (type: TypeReduction, champs: Partial<{ mode: ModeReduction; valeur: number; motif: string }>) =>
    setReductions(reductions.map((r) => (r.type === type ? { ...r, ...champs } : r)));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        Les réductions s'appliquent dans l'ordre rabais → remise → ristourne, chacune sur le montant restant.
      </p>
      {TYPES_REDUCTION.map(({ type, libelle, aide, exemple }) => {
        const r = reductions.find((x) => x.type === type);
        const calcul = detail.find((d) => d.type === type);
        return (
          <div
            key={type}
            className={`rounded-xl border p-3 transition ${r ? "border-purple-200 bg-purple-50/40" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-800">{libelle}</span>
                <Tooltip title={aide}>
                  <Info size={14} className="shrink-0 cursor-help text-slate-400" />
                </Tooltip>
              </div>
              <div className="flex items-center gap-3">
                {calcul && <span className="text-sm font-bold text-emerald-700">− {fmt(calcul.montant)}</span>}
                <Switch size="small" checked={!!r} onChange={(c) => activer(type, c)} aria-label={libelle} />
              </div>
            </div>
            {r && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_1.4fr]">
                <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs font-semibold">
                  {(["pourcentage", "montant"] as ModeReduction[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => modifier(type, { mode, valeur: 0 })}
                      className={`flex-1 px-3 py-2 transition ${
                        r.mode === mode ? "bg-purple-950 text-white" : "bg-white text-slate-600 hover:bg-purple-50"
                      }`}
                    >
                      {mode === "pourcentage" ? "%" : "CFA"}
                    </button>
                  ))}
                </div>
                <InputNumber
                  className="w-full"
                  min={0}
                  max={r.mode === "pourcentage" ? 100 : undefined}
                  value={r.valeur || null}
                  placeholder="0"
                  onChange={(v) => modifier(type, { valeur: Number(v) || 0 })}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  parser={(value) => Number((value || "").replace(/\s|%|CFA/g, "")) as any}
                  addonAfter={r.mode === "pourcentage" ? "%" : "CFA"}
                />
                <input
                  type="text"
                  maxLength={200}
                  value={r.motif || ""}
                  placeholder={`Motif (${exemple.toLowerCase()})`}
                  onChange={(e) => modifier(type, { motif: e.target.value })}
                  className="h-8 rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-purple-950"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
