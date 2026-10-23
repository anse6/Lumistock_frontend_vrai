// Activité de la plateforme : connexions, ventes ou articles vendus par période.
import React, { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchUtilisation, type Granularite, type Metrique, type PointSerie } from "./api";
import { Carte, Evolution, MessageVide, Segment, Squelette } from "../../dashboard/ui";
import { COULEURS, formatCompact, formatDate, formatNombre, libelleMois } from "../../dashboard/theme";

const METRIQUES: { valeur: Metrique; libelle: string; unite: string; couleur: string }[] = [
  { valeur: "connexions", libelle: "Connexions", unite: "connexion(s)", couleur: COULEURS.serie1 },
  { valeur: "livraisons", libelle: "Ventes", unite: "vente(s)", couleur: COULEURS.serie4 },
  { valeur: "produits_livres", libelle: "Articles vendus", unite: "article(s)", couleur: COULEURS.serie2 },
];

const GRANULARITES: { valeur: Granularite; libelle: string; nom: string }[] = [
  { valeur: "jour", libelle: "Jour", nom: "jours" },
  { valeur: "semaine", libelle: "Semaine", nom: "semaines" },
  { valeur: "mois", libelle: "Mois", nom: "mois" },
  { valeur: "annee", libelle: "Année", nom: "années" },
];

const libelleAxe = (point: PointSerie, granularite: Granularite) => {
  const debut = new Date(`${point.debut}T00:00:00`);
  if (granularite === "jour") return debut.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
  if (granularite === "semaine") return debut.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  if (granularite === "mois") return libelleMois(point.date);
  return point.date;
};

const libellePeriode = (point: PointSerie, granularite: Granularite) => {
  const debut = new Date(`${point.debut}T00:00:00`);
  if (granularite === "jour") return debut.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (granularite === "semaine") return `Semaine du ${formatDate(point.debut, { day: "numeric", month: "long" })} au ${formatDate(point.fin, { day: "numeric", month: "long", year: "numeric" })}`;
  if (granularite === "mois") return debut.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return `Année ${point.date}`;
};

const UsageChart: React.FC = () => {
  const [granularite, setGranularite] = useState<Granularite>("semaine");
  const [metrique, setMetrique] = useState<Metrique>("connexions");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["staff-utilisation", granularite, page],
    queryFn: () => fetchUtilisation(granularite, page),
    placeholderData: keepPreviousData, // pas de clignotement en changeant de page
  });

  const config = METRIQUES.find((m) => m.valeur === metrique)!;
  const nomPeriodes = GRANULARITES.find((g) => g.valeur === granularite)!.nom;

  const points = useMemo(
    () =>
      (data?.series[metrique] ?? []).map((p) => ({
        ...p,
        axe: libelleAxe(p, data!.periode),
        titre: libellePeriode(p, data!.periode),
      })),
    [data, metrique],
  );
  const aDesDonnees = points.some((p) => p.count > 0);
  const enCours = points.some((p) => p.incomplet);

  const changerGranularite = (g: Granularite) => {
    setGranularite(g);
    setPage(0);
  };

  return (
    <Carte
      titre="Activité de la plateforme"
      sousTitre={
        data
          ? `Du ${formatDate(data.debut, { day: "numeric", month: "short", year: "numeric" })} au ${formatDate(data.fin, { day: "numeric", month: "short", year: "numeric" })}`
          : "Chargement…"
      }
      icone={<BarChart3 size={18} />}
      action={
        <Segment
          libelle="Regroupement"
          options={GRANULARITES.map(({ valeur, libelle }) => ({ valeur, libelle }))}
          valeur={granularite}
          onChange={changerGranularite}
        />
      }
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segment libelle="Indicateur" taille="md" options={METRIQUES} valeur={metrique} onChange={setMetrique} />
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <span className="text-xs text-slate-500">{GRANULARITES.find((g) => g.valeur === granularite)!.libelle} · {points.length} {nomPeriodes}</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-purple-300 hover:text-purple-950"
              aria-label="Période précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, 0))}
              disabled={page >= 0}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-purple-300 hover:text-purple-950 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Période suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Squelette hauteur={300} />
      ) : isError || !data ? (
        <MessageVide texte="Impossible de charger l'activité. Réessayez dans un instant." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 rounded-xl bg-purple-50/60 p-3 sm:col-span-2">
              <p className="text-xs text-slate-500">{config.libelle} sur la période</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-2xl font-bold text-purple-950">{formatNombre(data.totaux[metrique])}</span>
                <Evolution valeur={data.growth_rate[metrique]} />
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                vs {formatNombre(data.totaux_precedents[metrique])} sur les {points.length} {nomPeriodes} d'avant
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Utilisateurs actifs</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatNombre(data.totaux.utilisateurs_actifs)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Magasins actifs</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatNombre(data.totaux.magasins_actifs)}</p>
            </div>
          </div>

          <div className={`relative h-[260px] w-full sm:h-[300px] ${isFetching ? "opacity-60" : ""} transition-opacity`}>
            {!aDesDonnees ? (
              <MessageVide texte={`Aucune ${config.libelle.toLowerCase()} sur cette période.`} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={points} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke={COULEURS.grille} />
                  <XAxis
                    dataKey="axe"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: COULEURS.axe }}
                    interval="preserveStartEnd"
                    minTickGap={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={44}
                    tick={{ fontSize: 11, fill: COULEURS.axe }}
                    tickFormatter={(v: number) => formatCompact(v)}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(59, 7, 100, 0.05)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as (typeof points)[number];
                      return (
                        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm shadow-lg">
                          <p className="text-xs capitalize text-slate-500">{p.titre}</p>
                          <p className="mt-1 flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: config.couleur }} />
                            <span className="font-semibold text-slate-900">{formatNombre(p.count)}</span>
                            <span className="text-slate-500">{config.unite}</span>
                          </p>
                          {p.incomplet && <p className="mt-1 text-[11px] text-slate-400">Période en cours</p>}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {points.map((p) => (
                      <Cell key={p.date} fill={config.couleur} fillOpacity={p.incomplet ? 0.45 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {enCours && aDesDonnees && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: config.couleur, opacity: 0.45 }} />
              Barre plus claire : période en cours, pas encore terminée.
            </p>
          )}
        </>
      )}
    </Carte>
  );
};

export default UsageChart;
