// Tableau de bord de l'admin et du manager d'un magasin.
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchVueMagasin, type Jours } from "../../Components/admin/Dashboard/api";
import { useTextes } from "../../Components/admin/Dashboard/textes";
import { Alertes, Indicateurs } from "../../Components/admin/Dashboard/Synthese";
import SalesChart from "../../Components/admin/Dashboard/SalesChart";
import {
  ConseilsIACard, DebiteursCard, PaiementsCard, StockCard, TopClientsCard, TopProduitsCard,
  VendeursCard, VentesRecentesCard,
} from "../../Components/admin/Dashboard/Cartes";
import { Segment, Squelette } from "../../Components/dashboard/ui";
import { BarreOnglets, ContenuOnglet } from "../../Components/admin/Dashboard/onglets/Onglets";
import { CLES_ONGLETS, type CleOnglet } from "../../Components/admin/Dashboard/onglets/cles";

const Adminsdashboard = () => {
  const { t, locale } = useTextes();
  const [jours, setJours] = useState<Jours>(30);
  // Onglet ouvert, gardé dans l'adresse (?onglet=stock) : il survit à un rafraîchissement.
  const [params, setParams] = useSearchParams();
  const demande = params.get("onglet") as CleOnglet | null;
  const onglet: CleOnglet = demande && CLES_ONGLETS.includes(demande) ? demande : "apercu";
  const changerOnglet = (o: CleOnglet) => setParams(o === "apercu" ? {} : { onglet: o }, { replace: true });

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin-vue-ensemble", jours],
    queryFn: () => fetchVueMagasin(jours),
    placeholderData: keepPreviousData,
  });

  const date = (iso: string, avecAnnee = false) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short", ...(avecAnnee ? { year: "numeric" } : {}) });

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-4 sm:gap-5">
      {/* En-tête + période (s'applique à toute la page) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-purple-950">{t.titre}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data
              ? `${data.magasin.denomination} · ${t.libellePeriode[jours]} (${t.du} ${date(data.periode.debut)} ${t.au} ${date(data.periode.fin, true)})`
              : t.libellePeriode[jours]}
          </p>
        </div>
        <Segment
          libelle="Période"
          taille="md"
          options={([7, 30, 90, 365] as Jours[]).map((j) => ({ valeur: j, libelle: t.periodes[j] }))}
          valeur={jours}
          onChange={setJours}
        />
      </div>

      <BarreOnglets actif={onglet} onChange={changerOnglet} />

      {onglet !== "apercu" ? (
        <ContenuOnglet key={onglet} onglet={onglet} jours={jours} />
      ) : isError && !data ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {t.erreur}{" "}
          <button type="button" onClick={() => refetch()} className="font-semibold underline">{t.reessayer}</button>
        </div>
      ) : isLoading || !data ? (
        <>
          <Squelette hauteur={56} />
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => <Squelette key={i} hauteur={130} />)}
          </div>
          <Squelette hauteur={380} />
        </>
      ) : (
        <div className={`flex flex-col gap-4 transition-opacity sm:gap-5 ${isFetching ? "opacity-70" : ""}`}>
          <Alertes data={data} />
          <Indicateurs data={data} />

          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2"><SalesChart data={data} /></div>
            <PaiementsCard data={data} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            <TopProduitsCard data={data} />
            <TopClientsCard data={data} />
            <div className="min-w-0 md:col-span-2 xl:col-span-1"><DebiteursCard data={data} /></div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0 md:col-span-2 xl:col-span-1"><StockCard data={data} /></div>
            <VendeursCard data={data} />
            <VentesRecentesCard data={data} />
          </div>

          <ConseilsIACard />
        </div>
      )}
    </div>
  );
};

export default Adminsdashboard;
