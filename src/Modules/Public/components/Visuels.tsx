// Visuels du site public : reproductions fidèles de l'interface Lumistock
// (menu violet, tuiles blanches, statuts vert/ambre/rouge), dessinées en
// HTML/CSS pour rester nettes et traduites. Données d'exemple : aria-hidden.
import React from "react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  FileText,
  Home,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
  Users,
  UsersRound,
  Vault,
  Wallet,
} from "lucide-react";
import icone from "../../../assets/logo-lumistock-icone.png";
import { useContenu } from "../contenu";

const fcfa = (n: number) => `${n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ")} F`;

const ICONES_MENU = [Home, BarChart3, PackageCheck, Boxes, Users, ShieldCheck, FileText, Vault];

type Statut = "paye" | "partiel" | "credit";
const STYLE_STATUT: Record<Statut, string> = {
  paye: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  partiel: "bg-amber-50 text-amber-700 ring-amber-200",
  credit: "bg-red-50 text-red-700 ring-red-200",
};

/** Fenêtre de l'application : menu latéral + tableau de bord. */
export const ApercuApplication: React.FC = () => {
  const c = useContenu().apercu;
  const barres = [46, 62, 54, 71, 66, 92, 40];
  const ventes: { n: string; client: string; montant: number; statut: Statut }[] = [
    { n: "V-1043", client: "Ets Fotso & Fils", montant: 182500, statut: "paye" },
    { n: "V-1042", client: "M. Ekane", montant: 46000, statut: "partiel" },
    { n: "V-1041", client: "Boutique Aïcha", montant: 93200, statut: "paye" },
    { n: "V-1040", client: "Chantier Bonabéri", montant: 315000, statut: "credit" },
  ];
  const kpis = [
    { l: c.ca, v: fcfa(1248600), i: TrendingUp },
    { l: c.ventes, v: "37", i: PackageCheck },
    { l: c.encaisse, v: fcfa(1102300), i: Wallet },
    { l: c.credit, v: fcfa(146300), i: UsersRound },
  ];
  return (
    <div aria-hidden="true" className="select-none overflow-hidden rounded-xl border border-trait bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-24px_rgba(15,23,42,0.18)]">
      <div className="flex items-center gap-1.5 border-b border-trait bg-fond px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
      </div>
      <div className="grid md:grid-cols-[176px_1fr]">
        {/* menu latéral, comme dans l'application */}
        <div className="hidden flex-col gap-0.5 bg-marque p-3 md:flex">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-white px-2.5 py-2">
            <img src={icone} alt="" className="h-5 w-5" />
            <span className="truncate text-[11px] font-bold uppercase tracking-tight text-slate-800">{c.magasin}</span>
          </div>
          {c.menu.map((m, i) => {
            const Icone = ICONES_MENU[i];
            const actif = i === 1;
            return (
              <div key={m} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium ${actif ? "bg-white/15 text-white" : "text-white/70"}`}>
                <Icone size={14} />
                {m}
              </div>
            );
          })}
        </div>

        {/* contenu */}
        <div className="min-w-0 bg-fond p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="font-titre text-sm font-semibold text-encre sm:text-base">{c.titre}</p>
            <span className="rounded-md border border-trait bg-white px-2 py-0.5 text-[10.5px] font-semibold text-texte">{c.periode}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.l} className="rounded-xl border border-marque-100 bg-white p-2.5">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-[10px] font-medium leading-tight text-attenue">{k.l}</p>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-marque-50 text-marque"><k.i size={11} /></span>
                </div>
                <p className="mt-1 text-[13px] font-bold tabular-nums text-marque-fonce sm:text-sm">{k.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 grid gap-2 lg:grid-cols-[1.15fr_1fr]">
            <div className="rounded-xl border border-trait bg-white p-3">
              <p className="text-[11px] font-semibold text-encre">{c.graphique}</p>
              <div className="mt-3 flex h-24 items-end gap-1.5 sm:h-28">
                {barres.map((h, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <div className={`w-full rounded-t ${i === 5 ? "bg-marque" : "bg-marque-200"}`} style={{ height: `${h}%` }} />
                    <span className="text-[9px] text-attenue">{c.jours[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-trait bg-white p-3">
              <p className="text-[11px] font-semibold text-encre">{c.recentes}</p>
              <ul className="mt-1.5 divide-y divide-slate-100">
                {ventes.map((v) => (
                  <li key={v.n} className="flex items-center justify-between gap-2 py-1.5">
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold text-encre">{v.client}</span>
                      <span className="block text-[9.5px] text-attenue">{v.n}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="text-[11px] font-semibold tabular-nums text-encre">{fcfa(v.montant)}</span>
                      <span className={`rounded-full px-1.5 py-px text-[9px] font-semibold ring-1 ${STYLE_STATUT[v.statut]}`}>{c.statuts[v.statut]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertTriangle size={14} className="shrink-0 text-amber-600" />
            <p className="truncate text-[11px] text-amber-900">
              <span className="font-semibold">{c.alerte}</span> · {c.alerteProduit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Carte: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div aria-hidden="true" className="mx-auto w-full max-w-md select-none rounded-xl border border-trait bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_32px_-20px_rgba(15,23,42,0.18)] sm:p-6">
    {children}
  </div>
);

export const VisuelCaisse: React.FC = () => {
  const v = useContenu().visuels;
  const lignes = [
    { l: v.fond, m: 25000 },
    { l: v.especes, m: 412500 },
    { l: v.attendu, m: 437500, gras: true },
    { l: v.compte, m: 436000 },
  ];
  return (
    <Carte>
      <div className="flex items-center justify-between gap-3">
        <p className="font-titre font-semibold text-encre">{v.session}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-fond px-2.5 py-0.5 text-[11px] font-semibold text-texte ring-1 ring-trait">
          Awa · 08:02 → 16:05
        </span>
      </div>
      <ul className="mt-5 space-y-3">
        {lignes.map((l) => (
          <li key={l.l} className="flex items-center justify-between text-sm">
            <span className={l.gras ? "font-semibold text-encre" : "text-attenue"}>{l.l}</span>
            <span className={`tabular-nums ${l.gras ? "font-bold text-encre" : "text-texte"}`}>{fcfa(l.m)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="text-sm font-semibold text-amber-900">{v.ecart}</span>
        <span className="font-bold tabular-nums text-amber-900">− {fcfa(1500)}</span>
      </div>
    </Carte>
  );
};

export const VisuelCredit: React.FC = () => {
  const v = useContenu().visuels;
  return (
    <Carte>
      <p className="font-titre font-semibold text-encre">{v.client}</p>
      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-attenue">{v.detteAvant}</span>
          <span className="tabular-nums text-texte">{fcfa(85000)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-attenue">{v.ventesImpayees}</span>
          <span className="tabular-nums text-texte">{fcfa(42500)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-trait pt-3">
          <span className="font-semibold text-encre">{v.totalDu}</span>
          <span className="text-lg font-bold tabular-nums text-danger">{fcfa(127500)}</span>
        </div>
      </div>
      <div className="mt-5 rounded-lg bg-marque px-4 py-2.5 text-center text-sm font-semibold text-white">{v.reglement}</div>
    </Carte>
  );
};

export const VisuelDroits: React.FC = () => {
  const contenu = useContenu();
  const v = contenu.visuels;
  const etats = [
    [true, false, false],
    [true, true, true],
    [false, false, false],
  ];
  return (
    <Carte>
      <div className="grid grid-cols-[1fr_repeat(3,3.75rem)] items-center gap-y-3.5">
        <span />
        {v.roles.map((r) => (
          <span key={r} className="text-center text-[10px] font-semibold uppercase tracking-wide text-attenue">{r}</span>
        ))}
        {v.droits.map((d, i) => (
          <React.Fragment key={d}>
            <span className="pr-2 text-sm font-medium text-encre">{d}</span>
            {etats[i].map((on, j) => (
              <span key={j} className="flex justify-center">
                <span className={`relative inline-flex h-5 w-9 items-center rounded-full ${on ? "bg-marque" : "bg-slate-200"}`}>
                  <span className={`absolute h-4 w-4 rounded-full bg-white shadow-sm ${on ? "left-[18px]" : "left-0.5"}`} />
                </span>
              </span>
            ))}
          </React.Fragment>
        ))}
      </div>
      <p className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
        <ShieldCheck size={14} /> {contenu.zooms[2].points[2]}
      </p>
    </Carte>
  );
};
