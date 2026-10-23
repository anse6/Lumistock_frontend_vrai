// Chiffre d'affaires (barres) et encaissements (ligne) sur la période, même échelle (monnaie).
import React, { useMemo } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import type { VueMagasin } from "./api";
import { Carte, MessageVide } from "../../dashboard/ui";
import { COULEURS, formatCompact, formatMontant, montantEnParties } from "../../dashboard/theme";
import { useTextes } from "./textes";

const SalesChart: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t, locale } = useTextes();
  const { serie, periode, magasin } = data;
  const g = periode.granularite;

  const points = useMemo(
    () =>
      serie.map((p) => {
        const d = new Date(`${p.debut}T00:00:00`);
        const axe =
          g === "mois"
            ? d.toLocaleDateString(locale, { month: "short" })
            : d.toLocaleDateString(locale, { day: "numeric", month: "short" });
        const titre =
          g === "jour"
            ? d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })
            : g === "semaine"
              ? `${t.semaineDu} ${d.toLocaleDateString(locale, { day: "numeric", month: "long" })}`
              : d.toLocaleDateString(locale, { month: "long", year: "numeric" });
        return { ...p, axe, titre };
      }),
    [serie, g, locale, t.semaineDu],
  );
  const vide = points.every((p) => p.ca === 0 && p.encaisse === 0);
  const sousTitre = `${t.libellePeriode[periode.jours]} · ${g === "jour" ? t.parJour : g === "semaine" ? t.parSemaine : t.parMois} · ${montantEnParties(0, magasin.devise).devise}`;

  return (
    <Carte titre={t.evolution} sousTitre={sousTitre} icone={<BarChart3 size={18} />}>
      {/* Légende (toujours visible, pas seulement au survol) */}
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COULEURS.serie1 }} /> {t.serieCa}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: COULEURS.serie2 }} /> {t.serieEncaisse}
        </span>
      </div>
      <div className="h-[260px] w-full sm:h-[320px]">
        {vide ? (
          <MessageVide texte={t.aucuneVente} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 6, left: 0, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid vertical={false} stroke={COULEURS.grille} />
              <XAxis
                dataKey="axe"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: COULEURS.axe }}
                interval="preserveStartEnd"
                minTickGap={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={44}
                tick={{ fontSize: 11, fill: COULEURS.axe }}
                tickFormatter={(v: number) => formatCompact(v)}
              />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Tooltip
                cursor={{ fill: "rgba(59, 7, 100, 0.05)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof points)[number];
                  return (
                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm shadow-lg">
                      <p className="mb-1 text-xs capitalize text-slate-500">{p.titre}</p>
                      <p className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COULEURS.serie1 }} /> {t.serieCa}
                        </span>
                        <span className="font-semibold text-slate-900">{formatMontant(p.ca, magasin.devise)}</span>
                      </p>
                      <p className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="h-0.5 w-3 rounded" style={{ background: COULEURS.serie2 }} /> {t.serieEncaisse}
                        </span>
                        <span className="font-semibold text-slate-900">{formatMontant(p.encaisse, magasin.devise)}</span>
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">{t.ventesN(p.ventes)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="ca" fill={COULEURS.serie1} radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Line
                type="monotone"
                dataKey="encaisse"
                stroke={COULEURS.serie2}
                strokeWidth={2}
                dot={points.length <= 14 ? { r: 3, fill: COULEURS.serie2, strokeWidth: 0 } : false}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Carte>
  );
};

export default SalesChart;
