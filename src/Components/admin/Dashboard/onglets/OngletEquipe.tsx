// Onglet « Équipe » : part de chacun dans les ventes, fiche de performance par membre.
import React from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { PieChart, UsersRound } from "lucide-react";
import type { MembreEquipe, OngletEquipe as Donnees } from "./api";
import { Carte, Evolution, MessageVide } from "../../../dashboard/ui";
import { COULEURS, formatMontant, formatNombre } from "../../../dashboard/theme";
import { useTextesOnglets } from "./textes";

const initiales = (nom: string) => nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join("") || "?";

/** Part de chaque membre : barre 100 % découpée + liste. */
const Repartition: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const actifs = d.membres.filter((m) => m.ca > 0);
  // Teintes d'une seule famille (violet) : l'ordre suit le classement.
  const teintes = ["#3b0764", "#6b21a8", "#9333ea", "#c084fc", "#e9d5ff"];
  return (
    <Carte titre={t.equipe.titre} sousTitre={t.equipe.titreSous} icone={<PieChart size={18} />}>
      {actifs.length === 0 ? <MessageVide texte={t.vide} /> : (
        <>
          <div className="flex h-4 w-full gap-[2px] overflow-hidden rounded-full">
            {actifs.map((m, i) => <div key={m.id} style={{ width: `${m.part}%`, background: teintes[Math.min(i, teintes.length - 1)] }} title={`${m.nom} : ${m.part} %`} />)}
          </div>
          <ul className="mt-4 space-y-2">
            {actifs.map((m, i) => (
              <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: teintes[Math.min(i, teintes.length - 1)] }} />
                  <span className="truncate text-slate-700">{m.nom}</span>
                </span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-semibold text-slate-900">{formatMontant(m.ca, d.devise)}</span>
                  <span className="ml-1.5 text-xs text-slate-400">{m.part.toLocaleString("fr-FR")} %</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Carte>
  );
};

const FicheMembre: React.FC<{ m: MembreEquipe; devise: string }> = ({ m, devise }) => {
  const { t, locale } = useTextesOnglets();
  const montant = (n: number) => formatMontant(n, devise);
  const chiffres = [
    { libelle: t.equipe.ventes, valeur: formatNombre(m.ventes) },
    { libelle: t.equipe.ca, valeur: montant(m.ca) },
    { libelle: t.equipe.encaisse, valeur: montant(m.encaisse) },
    { libelle: t.equipe.reste, valeur: montant(m.reste), alerte: m.reste > 0 },
  ];
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-purple-100/70 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-950 text-sm font-bold text-white">{initiales(m.nom)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{m.nom}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-950">{t.equipe.roles[m.role] ?? m.role}</span>
            {!m.actif && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">{t.equipe.inactif}</span>}
            <Evolution valeur={m.variation} />
          </div>
        </div>
      </div>

      {/* Mini-courbe du chiffre d'affaires sur la période */}
      <div className="mt-3 h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={m.serie} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`degrade-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COULEURS.serie1} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COULEURS.serie1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="ca" stroke={COULEURS.serie1} strokeWidth={1.5} fill={`url(#degrade-${m.id})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        {chiffres.map((c) => (
          <div key={c.libelle} className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-1.5">
            <dt className="text-[11px] text-slate-500">{c.libelle}</dt>
            <dd className={`truncate text-sm font-semibold tabular-nums ${c.alerte ? "text-red-700" : "text-slate-900"}`}>{c.valeur}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {m.stock_unites > 0 && (
          <p className="flex justify-between gap-2"><span>{t.equipe.stock}</span>
            <span className="font-medium text-slate-800">{formatNombre(m.stock_unites)} · {montant(m.stock_valeur)}</span></p>
        )}
        <p className="flex justify-between gap-2"><span>{t.equipe.activite}</span>
          <span className="text-right">
            {t.equipe.connexions(m.connexions)} · {m.derniere_connexion
              ? t.equipe.derniere(new Date(m.derniere_connexion).toLocaleDateString(locale, { day: "numeric", month: "short" }))
              : t.equipe.jamais}
          </span>
        </p>
      </div>
    </article>
  );
};

const OngletEquipe: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Repartition d={d} />
      <Carte titre={t.equipe.membres} icone={<UsersRound size={18} />}>
        {d.membres.length === 0 ? <MessageVide texte={t.equipe.aucun} /> : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {d.membres.map((m) => <FicheMembre key={m.id} m={m} devise={d.devise} />)}
          </div>
        )}
      </Carte>
    </div>
  );
};

export default OngletEquipe;
