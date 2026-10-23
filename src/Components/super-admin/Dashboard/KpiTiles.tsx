// Six indicateurs clés de la plateforme pour la période choisie.
import React from "react";
import { Activity, Boxes, ShoppingBag, Store, UserRound, UsersRound } from "lucide-react";
import type { VueEnsemble } from "./api";
import { Evolution } from "../../dashboard/ui";
import { formatNombre, variation } from "../../dashboard/theme";

interface Tuile {
  titre: string;
  valeur: number;
  icone: React.ReactNode;
  evolution?: number | null;
  libelleEvolution?: string;
  detail: React.ReactNode;
}

const TuileKpi: React.FC<Tuile> = ({ titre, valeur, icone, evolution, libelleEvolution, detail }) => (
  <div className="flex min-w-0 flex-col rounded-2xl border border-purple-100/70 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-medium leading-tight text-slate-500 sm:text-sm">{titre}</p>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-950">{icone}</span>
    </div>
    <p className="mt-2 text-2xl font-bold text-purple-950 sm:text-3xl">{formatNombre(valeur)}</p>
    <div className="mt-1 text-xs text-slate-500">{detail}</div>
    {evolution !== undefined && (
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
        <Evolution valeur={evolution} />
        {libelleEvolution && <span className="text-[11px] text-slate-400">{libelleEvolution}</span>}
      </div>
    )}
  </div>
);

const KpiTiles: React.FC<{ data: VueEnsemble }> = ({ data }) => {
  const { kpis, periode } = data;
  const comparaison = `vs ${periode.jours} j précédents`;

  const tuiles: Tuile[] = [
    {
      titre: "Magasins actifs",
      valeur: kpis.magasins.actifs,
      icone: <Store size={17} />,
      detail: (
        <>
          sur {formatNombre(kpis.magasins.total)}
          {kpis.magasins.desactives > 0 && ` · ${kpis.magasins.desactives} désactivé(s)`}
          {kpis.magasins.archives > 0 && ` · ${kpis.magasins.archives} archivé(s)`}
        </>
      ),
      evolution: variation(kpis.magasins.nouveaux, kpis.magasins.nouveaux_prec),
      libelleEvolution: `${kpis.magasins.nouveaux} nouveau(x)`,
    },
    {
      titre: "Utilisateurs actifs",
      valeur: kpis.utilisateurs.actifs,
      icone: <UsersRound size={17} />,
      detail: `sur ${formatNombre(kpis.utilisateurs.total)} comptes`,
      evolution: variation(kpis.utilisateurs.nouveaux, kpis.utilisateurs.nouveaux_prec),
      libelleEvolution: `${kpis.utilisateurs.nouveaux} nouveau(x)`,
    },
    {
      titre: "Clients des magasins",
      valeur: kpis.clients.total,
      icone: <UserRound size={17} />,
      detail: `${formatNombre(kpis.clients.nouveaux)} ajouté(s) sur la période`,
      evolution: variation(kpis.clients.nouveaux, kpis.clients.nouveaux_prec),
      libelleEvolution: comparaison,
    },
    {
      titre: "Ventes",
      valeur: kpis.ventes.nombre,
      icone: <ShoppingBag size={17} />,
      detail: `${formatNombre(kpis.ventes.articles)} article(s) vendu(s)`,
      evolution: variation(kpis.ventes.nombre, kpis.ventes.nombre_prec),
      libelleEvolution: comparaison,
    },
    {
      titre: "Connexions",
      valeur: kpis.connexions.nombre,
      icone: <Activity size={17} />,
      detail: `${formatNombre(kpis.connexions.utilisateurs_actifs)} utilisateur(s) connecté(s)`,
      evolution: variation(kpis.connexions.nombre, kpis.connexions.nombre_prec),
      libelleEvolution: comparaison,
    },
    {
      titre: "Produits référencés",
      valeur: kpis.produits.total,
      icone: <Boxes size={17} />,
      detail:
        kpis.produits.en_rupture > 0 ? (
          <span className="font-medium text-amber-700">⚠ {formatNombre(kpis.produits.en_rupture)} en rupture de stock</span>
        ) : (
          "Aucune rupture de stock"
        ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
      {tuiles.map((tuile) => (
        <TuileKpi key={tuile.titre} {...tuile} />
      ))}
    </div>
  );
};

export default KpiTiles;
