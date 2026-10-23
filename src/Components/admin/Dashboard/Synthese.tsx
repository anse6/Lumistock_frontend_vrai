// Haut du tableau de bord : alertes à traiter et indicateurs clés de la période.
import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Banknote, ChevronRight, CircleCheck, HandCoins, PiggyBank, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import type { VueMagasin } from "./api";
import { Evolution } from "../../dashboard/ui";
import { formatMontant, formatNombre, montantEnParties } from "../../dashboard/theme";
import { useTextes } from "./textes";

/* ------------------------------------------------------------------ */
/* Alertes                                                              */
/* ------------------------------------------------------------------ */

export const Alertes: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t } = useTextes();
  const { kpis, stock, paiements, magasin } = data;
  const m = (n: number) => formatMontant(n, magasin.devise);
  const nonPayees = paiements.statuts.find((s) => s.statut === "non payé")?.nombre ?? 0;

  const alertes: { texte: string; lien: string; grave: boolean }[] = [];
  if (kpis.creances.en_retard > 0) alertes.push({ texte: t.alerteCreances(m(kpis.creances.en_retard)), lien: "/admin/dashboard/customers", grave: true });
  if (stock.ruptures > 0) alertes.push({ texte: t.alerteRuptures(stock.ruptures), lien: "/admin/dashboard/produits_approvisionnements", grave: true });
  if (stock.perimes > 0) alertes.push({ texte: t.alertePerimes(stock.perimes), lien: "/admin/dashboard/produits_approvisionnements", grave: true });
  if (kpis.resultat.valeur < 0) alertes.push({ texte: t.alerteResultat, lien: "/admin/dashboard/finance", grave: false });
  if (stock.stock_bas > 0) alertes.push({ texte: t.alerteStockBas(stock.stock_bas), lien: "/admin/dashboard/produits_approvisionnements", grave: false });
  if (stock.bientot_perimes > 0) alertes.push({ texte: t.alerteBientot(stock.bientot_perimes), lien: "/admin/dashboard/produits_approvisionnements", grave: false });
  if (nonPayees > 0) alertes.push({ texte: t.alerteNonPayees(nonPayees), lien: "/admin/dashboard/deliverys", grave: false });

  if (alertes.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
        <CircleCheck size={18} className="shrink-0" /> {t.toutVaBien}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 sm:p-4" aria-label={t.alertes}>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
        <AlertTriangle size={17} /> {t.alertes} ({alertes.length})
      </p>
      <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {alertes.map((a) => (
          <li key={a.texte}>
            <Link
              to={a.lien}
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm !text-slate-800 shadow-sm transition-colors hover:!bg-amber-50"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${a.grave ? "bg-red-500" : "bg-amber-400"}`} aria-hidden />
                <span className="min-w-0">{a.texte}</span>
              </span>
              <span className="flex shrink-0 items-center text-xs font-semibold text-purple-950">
                {t.voir} <ChevronRight size={14} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Indicateurs clés                                                     */
/* ------------------------------------------------------------------ */

export interface Tuile {
  titre: string;
  valeur: React.ReactNode;
  icone: React.ReactNode;
  evolution?: number | null;
  detail: React.ReactNode;
  negatif?: boolean;
  inverse?: boolean;
}

export const TuileKpi: React.FC<Tuile & { comparaison: string }> = ({ titre, valeur, icone, evolution, detail, negatif, inverse, comparaison }) => (
  <div className="flex min-w-0 flex-col rounded-2xl border border-purple-100/70 bg-white p-3.5 shadow-sm sm:p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-medium leading-tight text-slate-500 sm:text-sm">{titre}</p>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-950">{icone}</span>
    </div>
    <p className={`mt-2 text-lg font-bold leading-tight sm:text-2xl ${negatif ? "text-red-700" : "text-purple-950"}`}>{valeur}</p>
    <div className="mt-1 text-[11px] leading-snug text-slate-500 sm:text-xs">{detail}</div>
    {evolution !== undefined && evolution !== null && (
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5">
        <Evolution valeur={evolution} inverse={inverse} />
        <span className="text-[11px] text-slate-400">{comparaison}</span>
      </div>
    )}
  </div>
);

export const Indicateurs: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t } = useTextes();
  const { kpis, magasin, periode } = data;
  const m = (n: number) => formatMontant(n, magasin.devise);
  // Grand chiffre sans couper la devise : « 4 360 000 » puis « FCFA » en petit.
  const gros = (n: number) => {
    const { nombre, devise } = montantEnParties(n, magasin.devise);
    return (
      <>
        <span className="whitespace-nowrap">{nombre}</span>{" "}
        <span className="whitespace-nowrap text-xs font-semibold opacity-70 sm:text-sm">{devise}</span>
      </>
    );
  };

  const tuiles: Tuile[] = [
    { titre: t.ca, valeur: gros(kpis.chiffre_affaires.valeur), icone: <TrendingUp size={17} />,
      evolution: kpis.chiffre_affaires.variation, detail: t.caDetail(m(kpis.retours.montant)) },
    { titre: t.encaisse, valeur: gros(kpis.encaisse.valeur), icone: <Banknote size={17} />,
      evolution: kpis.encaisse.variation, detail: t.encaisseDetail, negatif: kpis.encaisse.valeur < 0 },
    { titre: t.ventes, valeur: formatNombre(kpis.ventes.valeur), icone: <ShoppingBag size={17} />,
      evolution: kpis.ventes.variation, detail: t.ventesDetail(kpis.ventes.articles, m(kpis.ventes.panier_moyen)) },
    { titre: t.marge, valeur: gros(kpis.marge.valeur), icone: <PiggyBank size={17} />,
      evolution: kpis.marge.variation, detail: kpis.marge.taux !== null ? t.margeDetail(`${kpis.marge.taux.toLocaleString("fr-FR")} %`) : "—" },
    { titre: t.resultat, valeur: gros(kpis.resultat.valeur), icone: <Receipt size={17} />,
      evolution: kpis.resultat.variation, detail: t.resultatDetail(m(kpis.resultat.charges)), negatif: kpis.resultat.valeur < 0 },
    { titre: t.creances, valeur: gros(kpis.creances.valeur), icone: <HandCoins size={17} />,
      detail: (
        <>
          {t.creancesDetail(kpis.creances.clients)}
          {kpis.creances.en_retard > 0 && <span className="block font-medium text-red-700">⚠ {t.creancesRetard(m(kpis.creances.en_retard))}</span>}
        </>
      ) },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
      {tuiles.map((tuile) => (
        <TuileKpi key={tuile.titre} {...tuile} comparaison={t.vsPrecedente(periode.jours)} />
      ))}
    </div>
  );
};
