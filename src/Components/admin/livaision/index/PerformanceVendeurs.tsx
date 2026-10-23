// Ventes par vendeur (caissiers, gérants, managers, admin) sur la période et les filtres choisis.
// Un clic sur un vendeur filtre la liste des ventes sur lui.
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import type { Order } from "../livraisonfinal/types";
import { formatMontant } from "../../../dashboard/theme";

export const LIBELLES_ROLES: Record<string, string> = {
  caissier: "Caissier", gerant: "Gérant", livreur: "Gérant", manager: "Manager", admin: "Administrateur",
};
const TONS_ROLES: Record<string, string> = {
  caissier: "bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200",
  gerant: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  manager: "bg-sky-50 text-sky-800 ring-sky-200",
  admin: "bg-purple-50 text-purple-900 ring-purple-200",
};

export interface LigneVendeur {
  id: string; nom: string; role: string; ventes: number; articles: number;
  ca: number; encaisse: number; reste: number; panier: number; part: number;
}

export const statsParVendeur = (orders: Order[]): LigneVendeur[] => {
  const parId = new Map<string, LigneVendeur>();
  for (const o of orders) {
    const id = o.livreur_id || "inconnu";
    const role = o.vendeur_role === "livreur" ? "gerant" : o.vendeur_role || "";
    const l = parId.get(id) ?? { id, nom: (o.nom_livreur || "").trim() || "Vendeur supprimé", role, ventes: 0, articles: 0, ca: 0, encaisse: 0, reste: 0, panier: 0, part: 0 };
    l.ventes += 1;
    l.articles += o.quantity || 0;
    l.ca += o.montant_produits || 0;
    l.encaisse += o.montant_paye || 0;
    l.reste += o.montant_restant || 0;
    parId.set(id, l);
  }
  const lignes = [...parId.values()];
  const total = lignes.reduce((s, l) => s + l.ca, 0);
  lignes.forEach((l) => { l.panier = l.ventes ? l.ca / l.ventes : 0; l.part = total ? (l.ca / total) * 100 : 0; });
  return lignes.sort((a, b) => b.ca - a.ca);
};

export const BadgeRole = ({ role }: { role: string }) =>
  role ? (
    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${TONS_ROLES[role] ?? "bg-slate-50 text-slate-600 ring-slate-200"}`}>
      {LIBELLES_ROLES[role] ?? role}
    </span>
  ) : null;

interface Props {
  orders: Order[];
  vendeurActif: string;
  onChoisir: (id: string) => void;
  devise?: string;
}

export default function PerformanceVendeurs({ orders, vendeurActif, onChoisir, devise = "XAF" }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const lignes = useMemo(() => statsParVendeur(orders), [orders]);
  const m = (n: number) => formatMontant(n, devise);
  if (lignes.length === 0) return null;
  const totaux = lignes.reduce((t, l) => ({ ventes: t.ventes + l.ventes, articles: t.articles + l.articles, ca: t.ca + l.ca, encaisse: t.encaisse + l.encaisse, reste: t.reste + l.reste }),
    { ventes: 0, articles: 0, ca: 0, encaisse: 0, reste: 0 });

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
      <button type="button" aria-expanded={ouvert} onClick={() => setOuvert((x) => !x)} className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950 text-white"><Users size={17} /></span>
          <span>
            <span className="block font-semibold text-slate-900">Ventes par vendeur</span>
            <span className="block text-xs text-slate-500">
              {lignes.length} vendeur{lignes.length > 1 ? "s" : ""} sur la période · cliquez sur un vendeur pour ne voir que ses ventes
            </span>
          </span>
        </span>
        {ouvert ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      {ouvert && (
        <div className="overflow-x-auto border-t border-slate-100 scrollbar-hide">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Vendeur</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ventes</th>
                <th className="px-4 py-2.5 text-right font-semibold">Articles vendus</th>
                <th className="px-4 py-2.5 text-right font-semibold">Chiffre d'affaires</th>
                <th className="px-4 py-2.5 text-left font-semibold">Part du total</th>
                <th className="px-4 py-2.5 text-right font-semibold">Panier moyen</th>
                <th className="px-4 py-2.5 text-right font-semibold">Encaissé</th>
                <th className="px-4 py-2.5 text-right font-semibold">Reste dû</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lignes.map((l) => {
                const actif = vendeurActif === l.id;
                return (
                  <tr key={l.id} onClick={() => onChoisir(actif ? "" : l.id)}
                    className={`cursor-pointer transition-colors ${actif ? "bg-purple-50" : "hover:bg-purple-50/40"}`}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        {actif && <span className="h-6 w-1 rounded-full bg-purple-700" />}
                        <span className="truncate font-semibold text-slate-900">{l.nom}</span>
                        <BadgeRole role={l.role} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.ventes.toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.articles.toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{m(l.ca)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <span className="block h-full rounded-full bg-purple-700" style={{ width: `${Math.max(l.part, 1)}%` }} />
                        </span>
                        <span className="w-11 text-right text-xs tabular-nums text-slate-500">{l.part.toFixed(1).replace(".", ",")} %</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{m(l.panier)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-800">{m(l.encaisse)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${l.reste > 0 ? "font-semibold text-sky-900" : "text-slate-400"}`}>{m(l.reste)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 text-sm font-semibold text-slate-900">
              <tr>
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{totaux.ventes.toLocaleString("fr-FR")}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{totaux.articles.toLocaleString("fr-FR")}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{m(totaux.ca)}</td>
                <td />
                <td className="px-4 py-2.5 text-right tabular-nums">{m(totaux.ventes ? totaux.ca / totaux.ventes : 0)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{m(totaux.encaisse)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{m(totaux.reste)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
