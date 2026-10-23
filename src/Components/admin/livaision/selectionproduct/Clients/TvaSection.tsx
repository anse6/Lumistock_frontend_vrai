import React from "react";
import { Switch } from "antd";
import { AlertTriangle } from "lucide-react";
import * as Drapeaux from "country-flag-icons/react/3x2";
import { Link } from "react-router-dom";
import { useDeliveryStore } from "../../newdelivery/deliveryStore";
import { useMontantsVente } from "./reductions";
import { formatTaux, useTvaMagasin } from "./tva";

const fmt = (value: number) => `${Math.round(value || 0).toLocaleString("fr-FR")} CFA`;

// TVA de la vente : taux du pays du magasin, ajouté au montant net (prix HT).
export const TvaSection: React.FC = () => {
  const appliquer = useDeliveryStore((s) => s.appliquer_tva);
  const setAppliquerTva = useDeliveryStore((s) => s.setAppliquerTva);
  const tauxVente = useDeliveryStore((s) => s.taux_tva_vente);
  const { tva, chargement, erreur } = useTvaMagasin();
  const { net, montantTva, tauxTva } = useMontantsVente();

  const Drapeau = tva?.code
    ? (Drapeaux as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[tva.code]
    : undefined;
  const tauxInconnu = !chargement && tauxTva == null;

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
          appliquer && !tauxInconnu ? "border-purple-200 bg-purple-50/40" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {Drapeau ? (
            <Drapeau className="h-6 w-9 shrink-0 rounded shadow-sm" aria-hidden="true" />
          ) : (
            <span className="h-6 w-9 shrink-0 rounded bg-slate-200" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800">
              {chargement ? "Chargement du taux…" : tva?.pays ? `TVA ${tva.pays}` : "TVA"}
              {tva?.code && <span className="ml-1.5 text-xs font-medium text-slate-400">{tva.code}</span>}
            </div>
            <div className="text-xs text-slate-500">
              {tauxTva != null
                ? `Taux ${formatTaux(tauxTva)}${tauxVente != null && tauxVente !== tva?.taux ? " (taux de la vente d'origine)" : ""}`
                : erreur
                  ? "Taux indisponible (serveur injoignable)"
                  : chargement
                    ? ""
                    : "Pays du magasin sans taux connu"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {appliquer && montantTva > 0 && <span className="text-sm font-bold text-purple-950">+ {fmt(montantTva)}</span>}
          <Switch
            checked={appliquer && !tauxInconnu}
            disabled={tauxInconnu || chargement}
            onChange={(c) => setAppliquerTva(c)}
            aria-label="Appliquer la TVA"
          />
        </div>
      </div>

      {tauxInconnu ? (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Renseignez le pays du magasin dans{" "}
            <Link to="/admin/dashboard/parameter" className="font-semibold underline">
              Paramètres
            </Link>{" "}
            pour appliquer la TVA.
          </span>
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          {appliquer
            ? `Les prix sont hors taxe : ${formatTaux(tauxTva ?? 0)} de TVA s'ajoutent au montant net (${fmt(net)}), après les réductions. La dette ancienne n'est pas taxée.`
            : "Vente sans TVA : le total correspond au montant net des articles."}
        </p>
      )}
    </div>
  );
};
