// Statistiques du caissier, construites avec les mêmes pièces que le tableau de bord admin
// (tuiles de chiffres, cartes, barres, graphique). Ses ventes à lui seulement, sans marge.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, BarChart3, HandCoins, ShoppingBag, TrendingUp, Trophy, Wallet } from "lucide-react";
import PageTitle from "../../Components/PageTitle";
import { TuileKpi } from "../../Components/admin/Dashboard/Synthese";
import { Barre, Carte, MessageVide, Segment, Squelette } from "../../Components/dashboard/ui";
import { COULEURS, formatCompact, formatNombre, montantEnParties } from "../../Components/dashboard/theme";
import type { Periode } from "./api";
import { api, argent, devise } from "./api";

const PERIODES: { valeur: Periode; libelle: string; comparaison: string; titre: string }[] = [
  { valeur: "jour", libelle: "Aujourd'hui", comparaison: "vs hier", titre: "aujourd'hui" },
  { valeur: "semaine", libelle: "Cette semaine", comparaison: "vs semaine dernière", titre: "cette semaine" },
  { valeur: "mois", libelle: "Ce mois", comparaison: "vs mois dernier", titre: "ce mois-ci" },
];

const Rang = ({ n }: { n: number }) => (
  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
    n === 0 ? "bg-purple-950 text-white" : "bg-purple-50 text-purple-950"}`}>{n + 1}</span>
);

/** « 4 360 000 » puis « FCFA » en petit, comme sur le tableau de bord admin. */
const gros = (n: number) => {
  const p = montantEnParties(n, devise());
  return (
    <>
      <span className="whitespace-nowrap">{p.nombre}</span>{" "}
      <span className="whitespace-nowrap text-xs font-semibold opacity-70 sm:text-sm">{p.devise}</span>
    </>
  );
};

export default function MesStatistiques() {
  const [periode, setPeriode] = useState<Periode>("jour");
  const choix = PERIODES.find((p) => p.valeur === periode)!;
  const { data, isLoading } = useQuery({ queryKey: ["caisse", "stats", periode], queryFn: () => api.statistiques({ periode }) });
  const k = data?.kpis;
  const debut = data ? new Date(data.periode.debut).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "";

  return (
    <>
      <PageTitle>Mes statistiques</PageTitle>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Vos ventes {choix.titre}{periode === "jour" && debut ? ` (${debut})` : periode !== "jour" && debut ? ` (depuis le ${debut})` : ""} · vos chiffres uniquement
          </p>
          <Segment libelle="Période" taille="md" valeur={periode} onChange={setPeriode}
            options={PERIODES.map((p) => ({ valeur: p.valeur, libelle: p.libelle }))} />
        </div>

        {isLoading || !data || !k ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Squelette key={i} hauteur={128} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
              <TuileKpi titre="Chiffre d'affaires" valeur={gros(k.chiffre_affaires)} icone={<TrendingUp size={17} />}
                evolution={k.variations.chiffre_affaires} comparaison={choix.comparaison}
                detail={`${formatNombre(k.articles)} article(s) vendu(s)`} />
              <TuileKpi titre="Encaissé" valeur={gros(k.encaisse)} icone={<Banknote size={17} />} comparaison={choix.comparaison}
                detail={k.rendu > 0 ? `dont ${argent(k.rendu)} rendus aux clients` : "paiements reçus à votre caisse"} />
              <TuileKpi titre="Ventes" valeur={formatNombre(k.ventes)} icone={<ShoppingBag size={17} />}
                evolution={k.variations.ventes} comparaison={choix.comparaison}
                detail={`panier moyen ${argent(k.panier_moyen)}${k.annulations ? ` · ${k.annulations} annulée(s)` : ""}`} />
              <TuileKpi titre="Crédits en cours" valeur={gros(data.credits.total)} icone={<HandCoins size={17} />} comparaison=""
                detail={`${data.credits.clients.length} client(s) doivent encore de l'argent`} negatif={false} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              <Carte className="lg:col-span-2" titre="Chiffre d'affaires"
                sousTitre={`${choix.libelle} · ${data.serie.granularite === "heure" ? "par heure" : "par jour"} · ${montantEnParties(0, devise()).devise}`}
                icone={<BarChart3 size={18} />}>
                <div className="h-[260px] w-full sm:h-[300px]">
                  {data.serie.points.every((p) => p.chiffre_affaires === 0) ? (
                    <MessageVide texte="Aucune vente sur la période." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.serie.points} margin={{ top: 8, right: 6, left: 0, bottom: 0 }} barCategoryGap="25%">
                        <CartesianGrid vertical={false} stroke={COULEURS.grille} />
                        <XAxis dataKey="libelle" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COULEURS.axe }}
                          interval="preserveStartEnd" minTickGap={10} />
                        <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11, fill: COULEURS.axe }}
                          tickFormatter={(v: number) => formatCompact(v)} />
                        <Tooltip
                          cursor={{ fill: "rgba(59, 7, 100, 0.05)" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const p = payload[0].payload as (typeof data.serie.points)[number];
                            return (
                              <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm shadow-lg">
                                <p className="mb-1 text-xs text-slate-500">{p.libelle}</p>
                                <p className="font-semibold text-slate-900">{argent(p.chiffre_affaires)}</p>
                                <p className="mt-1 text-[11px] text-slate-400">{p.ventes} vente{p.ventes > 1 ? "s" : ""}</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="chiffre_affaires" fill={COULEURS.serie1} radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Carte>

              <Carte titre="Encaissé par mode" sousTitre="Espèces, mobile money et banque" icone={<Wallet size={18} />}>
                {data.modes.length === 0 ? <MessageVide texte="Aucun encaissement sur la période." /> : (
                  <div className="space-y-4">
                    {data.modes.map((m) => (
                      <Barre key={m.mode} libelle={m.libelle} valeur={m.net} max={Math.max(...data.modes.map((x) => x.net))}
                        texteValeur={argent(m.net)} detail={m.sorties > 0 ? `${argent(m.entrees)} reçus · ${argent(m.sorties)} rendus` : undefined} />
                    ))}
                  </div>
                )}
              </Carte>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              <Carte titre="Mes meilleurs produits" sousTitre={`Par chiffre d'affaires, ${choix.titre}`} icone={<Trophy size={18} />}>
                {data.top_produits.length === 0 ? <MessageVide texte="Aucune vente sur la période." /> : (
                  <ol className="space-y-4">
                    {data.top_produits.map((p, i) => (
                      <li key={p.produit_id} className="flex items-start gap-3">
                        <Rang n={i} />
                        <div className="min-w-0 flex-1">
                          <Barre libelle={p.nom} valeur={p.chiffre_affaires} max={data.top_produits[0].chiffre_affaires}
                            texteValeur={argent(p.chiffre_affaires)} detail={`${formatNombre(p.quantite)} unité(s)`} />
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Carte>

              <Carte titre="Clients à relancer" sousTitre="Ce qui reste dû sur vos ventes, toutes périodes" icone={<HandCoins size={18} />}>
                {data.credits.clients.length === 0 ? <MessageVide texte="Aucun crédit en cours sur vos ventes." /> : (
                  <ul className="divide-y divide-slate-100">
                    {data.credits.clients.map((c) => (
                      <li key={c.client_id} className="flex items-center justify-between gap-3 py-2.5">
                        <p className="truncate text-sm font-medium text-slate-800">{c.nom}</p>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-red-700">{argent(c.reste)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Carte>
            </div>
          </>
        )}
      </div>
    </>
  );
}
