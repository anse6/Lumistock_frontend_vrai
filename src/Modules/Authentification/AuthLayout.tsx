// Mise en page des pages de connexion, mot de passe oublié et nouveau mot de
// passe : formulaire à gauche ; à droite (grand écran), panneau violet
// Lumistock sur la gestion de stock et la comptabilité SYSCOHADA (OHADA).
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ConfigProvider } from "antd";
import { ArrowLeft, Boxes, Check, Globe2, Landmark, PackageMinus, Scale } from "lucide-react";
import Logo from "../Public/components/Logo";
import LangueSwitch from "../Public/components/LangueSwitch";
import { useContenu } from "../Public/contenu";
import { THEME_PUBLIC } from "../Public/theme";
import "../Public/public.css";

const ICONES_PILIERS = [Boxes, Scale, Landmark];

// Vente de 6 tôles à 30 000 F HT, TVA 19,25 % : écriture équilibrée
// (571 au débit = 701 + 4431 au crédit), comme dans le journal des ventes.
const ECRITURE = [
  { compte: "571", debit: 214650, credit: 0 },
  { compte: "701", debit: 0, credit: 180000 },
  { compte: "4431", debit: 0, credit: 34650 },
];

const fcfa = (n: number) => `${n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ")} F`;

interface Props {
  titrePage: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<Props> = ({ titrePage, children }) => {
  const c = useContenu();
  const a = c.auth;
  const e = a.ecriture;

  useEffect(() => {
    document.title = `${titrePage} · Lumistock`;
  }, [titrePage]);

  return (
    <ConfigProvider theme={THEME_PUBLIC}>
      <div className="site-public min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex min-h-screen min-w-0 flex-col">
          <header className="flex items-center justify-between gap-3 px-5 py-5 sm:px-10">
            <Logo />
            <LangueSwitch />
          </header>
          <main id="contenu" className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10">
            <div className="w-full max-w-[400px]">{children}</div>
          </main>
          <footer className="px-5 py-6 sm:px-10">
            <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold !text-attenue hover:!text-encre">
              <ArrowLeft size={16} aria-hidden="true" /> {c.auth.retourSite}
            </Link>
          </footer>
        </div>

        {/* Panneau aux couleurs du menu de l'application : violet Lumistock, texte blanc. */}
        <aside className="hidden min-w-0 border-l border-[#2d1045] bg-marque text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center lg:overflow-hidden" aria-hidden="true">
          <div className="mx-auto w-full max-w-[540px] px-12 py-8 xl:px-14">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">{a.panneauSurtitre}</p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1.12] tracking-tight !text-white xl:text-[2.6rem]">{a.panneauTitre}</h2>
            <p className="mt-4 text-base leading-relaxed text-white/85">{a.panneauTexte}</p>

            <ul className="mt-7 space-y-3.5">
              {a.piliers.map((p, i) => {
                const Icone = ICONES_PILIERS[i];
                return (
                  <li key={p.titre} className="flex gap-4 [@media(max-height:820px)]:items-center">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/20">
                      <Icone size={18} />
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{p.titre}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-white/75 [@media(max-height:820px)]:hidden">{p.texte}</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Une vraie écriture : ce que Lumistock passe au journal pour une vente. */}
            <div className="mt-7 rounded-xl bg-white p-4 text-encre shadow-[0_20px_40px_-20px_rgba(10,2,20,0.55)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-marque">{e.titre}</p>
                  <p className="mt-1 text-sm font-semibold">{e.piece}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <Check size={12} strokeWidth={3} /> {e.equilibre}
                </span>
              </div>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b border-trait text-left text-[11px] uppercase tracking-wide text-attenue">
                    <th className="pb-2 font-semibold">{e.compte}</th>
                    <th className="pb-2 text-right font-semibold">{e.debit}</th>
                    <th className="pb-2 text-right font-semibold">{e.credit}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {ECRITURE.map((l, i) => (
                    <tr key={l.compte} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5">
                        <span className="mr-2 font-mono text-[13px] font-semibold text-marque">{l.compte}</span>
                        {e.lignes[i]}
                      </td>
                      <td className="py-1.5 text-right">{l.debit ? fcfa(l.debit) : ""}</td>
                      <td className="py-1.5 text-right">{l.credit ? fcfa(l.credit) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2.5 flex items-center justify-between gap-3 rounded-lg bg-fond px-3 py-1.5 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <PackageMinus size={16} className="text-marque" /> {e.stock}
                </span>
                <span className="font-semibold tabular-nums">{e.stockDetail}</span>
              </div>
            </div>

            <p className="mt-6 flex items-center gap-2 text-sm text-white/75">
              <Globe2 size={16} /> {a.ohada}
            </p>
          </div>
        </aside>
      </div>
    </ConfigProvider>
  );
};

export default AuthLayout;
