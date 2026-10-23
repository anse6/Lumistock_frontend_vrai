// Croissance sur 12 mois : un petit graphique par indicateur (même échelle de
// temps, chacun sa propre échelle de valeurs), lisible aussi sur mobile.
import React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import type { VueEnsemble } from "./api";
import { Carte } from "../../dashboard/ui";
import { COULEURS, formatCompact, formatNombre, libelleMois } from "../../dashboard/theme";

type Cle = "magasins" | "utilisateurs" | "clients" | "ventes";

const INDICATEURS: { cle: Cle; titre: string; unite: string }[] = [
  { cle: "magasins", titre: "Nouveaux magasins", unite: "magasin(s) créé(s)" },
  { cle: "utilisateurs", titre: "Nouveaux utilisateurs", unite: "compte(s) créé(s)" },
  { cle: "clients", titre: "Nouveaux clients", unite: "client(s) ajouté(s)" },
  { cle: "ventes", titre: "Ventes", unite: "vente(s)" },
];

const MiniGraphique: React.FC<{ donnees: VueEnsemble["croissance"]; cle: Cle; titre: string; unite: string }> = ({
  donnees,
  cle,
  titre,
  unite,
}) => {
  const total = donnees.reduce((s, d) => s + d[cle], 0);
  const max = Math.max(...donnees.map((d) => d[cle]), 0);
  const points = donnees.map((d, i) => ({
    mois: libelleMois(d.mois),
    complet: libelleMois(d.mois, true),
    valeur: d[cle],
    enCours: i === donnees.length - 1,
  }));
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-medium text-slate-700">{titre}</p>
        <p className="shrink-0 text-lg font-bold text-purple-950">{formatNombre(total)}</p>
      </div>
      <div className="h-[130px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 6, right: 0, left: 0, bottom: 0 }} barCategoryGap="18%">
            <XAxis
              dataKey="mois"
              axisLine={{ stroke: COULEURS.grille }}
              tickLine={false}
              tick={{ fontSize: 10, fill: COULEURS.axe }}
              interval="preserveStartEnd"
              minTickGap={4}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              // Deux repères seulement (0 et le maximum) : lisible sur petit écran.
              ticks={max > 0 ? [0, max] : [0]}
              domain={[0, Math.max(max, 1)]}
              width={30}
              tick={{ fontSize: 10, fill: COULEURS.axe }}
              tickFormatter={(v: number) => formatCompact(v)}
            />
            <Tooltip
              cursor={{ fill: "rgba(59, 7, 100, 0.05)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof points)[number];
                return (
                  <div className="rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 text-xs shadow-lg">
                    <p className="capitalize text-slate-500">{p.complet}{p.enCours ? " (en cours)" : ""}</p>
                    <p className="mt-0.5">
                      <span className="font-semibold text-slate-900">{formatNombre(p.valeur)}</span>{" "}
                      <span className="text-slate-500">{unite}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="valeur" radius={[3, 3, 0, 0]} fill={COULEURS.serie1} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const GrowthCharts: React.FC<{ data: VueEnsemble }> = ({ data }) => (
  <Carte
    titre="Croissance sur 12 mois"
    sousTitre={`De ${libelleMois(data.croissance[0]?.mois ?? "", true)} à ${libelleMois(data.croissance[data.croissance.length - 1]?.mois ?? "", true)} · créations par mois`}
    icone={<TrendingUp size={18} />}
  >
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {INDICATEURS.map((indicateur) => (
        <MiniGraphique key={indicateur.cle} donnees={data.croissance} {...indicateur} />
      ))}
    </div>
  </Carte>
);

export default GrowthCharts;
