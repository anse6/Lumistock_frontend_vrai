// Ouverture de la caisse : le caissier déclare son fond de caisse (monnaie de départ).
import { useState } from "react";
import { App, Input, InputNumber } from "antd";
import { LockOpen, Vault } from "lucide-react";
import { api, argent, messageErreur, symboleDevise } from "../api";
import { useRafraichirCaisse } from "../hooks";

export const formatterMontant = (v: number | string | undefined) => `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
export const parserMontant = (v: string | undefined) => Number((v ?? "").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

const RAPIDES = [0, 5000, 10000, 20000, 50000];

export default function OuvertureCaisse({ nom }: { nom: string }) {
  const { message } = App.useApp();
  const rafraichir = useRafraichirCaisse();
  const [fond, setFond] = useState<number>(0);
  const [note, setNote] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const ouvrir = async () => {
    setEnvoi(true);
    try {
      await api.ouvrir(fond, note.trim() || undefined);
      message.success("Caisse ouverte. Bonnes ventes !");
      rafraichir();
    } catch (e) {
      message.error(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-6">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-purple-100">
        <div className="relative overflow-hidden bg-purple-950 px-6 pb-7 pt-6 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-purple-900/70" />
          <div className="relative">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Vault size={24} />
            </span>
            <h1 className="mt-4 text-2xl font-bold">Bonjour {nom.split(" ")[0] || ""} 👋</h1>
            <p className="mt-1 text-sm text-purple-100">
              Votre caisse est fermée. Comptez la monnaie de départ et ouvrez la caisse pour commencer à vendre.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Fond de caisse (espèces au départ)</label>
            <InputNumber<number>
              size="large"
              min={0}
              value={fond}
              onChange={(v) => setFond(Number(v) || 0)}
              formatter={formatterMontant}
              parser={parserMontant}
              className="!w-full"
              autoFocus
              onPressEnter={ouvrir}
              suffix={symboleDevise()}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {RAPIDES.map((v) => (
                <button
                  key={v}
                  onClick={() => setFond(v)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                    fond === v ? "bg-purple-950 text-white ring-purple-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-purple-50"
                  }`}
                >
                  {v === 0 ? "Aucun" : argent(v)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Note <span className="font-normal text-slate-400">(facultatif)</span>
            </label>
            <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="Ex. : fond remis par le manager" />
          </div>
          <button
            onClick={ouvrir}
            disabled={envoi}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl !bg-purple-950 py-3.5 text-base font-bold !text-white shadow-md shadow-purple-950/20 transition hover:!bg-purple-900 disabled:cursor-wait disabled:opacity-70"
          >
            <LockOpen size={19} /> Ouvrir la caisse
          </button>
          <p className="text-center text-xs text-slate-400">
            Le soir, vous fermerez la caisse en comptant les espèces : l'application calcule l'écart automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}
