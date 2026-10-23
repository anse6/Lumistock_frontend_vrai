// Fin de vente : confirmation, monnaie à rendre, impression du ticket, nouvelle vente (Entrée).
import { useEffect, useState } from "react";
import { Modal, Switch } from "antd";
import { CheckCircle2, Printer, ShoppingCart } from "lucide-react";
import type { ContexteCaisse, VenteCaisse } from "../api";
import { argent } from "../api";
import { imprimerTicket } from "../ticket";

const CLE_AUTO = "caisse_impression_auto";
const lireAuto = () => {
  try { return localStorage.getItem(CLE_AUTO) === "1"; } catch { return false; }
};

interface Props { vente: VenteCaisse | null; monnaie: number; ctx: ContexteCaisse; onNouvelle: () => void }

export default function VenteTerminee({ vente, monnaie, ctx, onNouvelle }: Props) {
  const [auto, setAuto] = useState(lireAuto);

  useEffect(() => {
    if (vente && lireAuto()) imprimerTicket(vente, ctx, monnaie);
  }, [vente, ctx, monnaie]);

  const changerAuto = (v: boolean) => {
    setAuto(v);
    try { localStorage.setItem(CLE_AUTO, v ? "1" : "0"); } catch { /* stockage indisponible */ }
  };

  return (
    <Modal open={!!vente} onCancel={onNouvelle} footer={null} width={440} closable={false} destroyOnHidden>
      {vente && (
        <div className="text-center" onKeyDown={(e) => e.key === "Enter" && onNouvelle()}>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={34} />
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Vente enregistrée</h2>
          <p className="text-sm text-slate-500">{vente.numero} · {vente.client.nom}</p>
          <p className="mt-3 text-3xl font-bold text-purple-950">{argent(vente.montant_total)}</p>

          {monnaie > 0 && (
            <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">Monnaie à rendre</p>
              <p className="text-3xl font-bold text-emerald-800">{argent(monnaie)}</p>
            </div>
          )}
          {vente.reste > 0 && (
            <div className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 ring-1 ring-sky-200">
              <p className="text-sm font-semibold text-sky-900">Reste à payer par le client</p>
              <p className="text-2xl font-bold text-sky-900">{argent(vente.reste)}</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={() => imprimerTicket(vente, ctx, monnaie)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-purple-200 py-3 text-sm font-semibold text-purple-950 hover:bg-purple-50"
            >
              <Printer size={17} /> Imprimer le ticket
            </button>
            <button
              onClick={onNouvelle}
              autoFocus
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl !bg-purple-950 py-3 text-sm font-bold !text-white hover:!bg-purple-900"
            >
              <ShoppingCart size={17} /> Nouvelle vente
            </button>
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs text-slate-500">
            <Switch size="small" checked={auto} onChange={changerAuto} /> Imprimer le ticket automatiquement
          </label>
        </div>
      )}
    </Modal>
  );
}
