// Tableau de bord du super-admin (staff) : vue d'ensemble de la plateforme.
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchVueEnsemble, type Jours } from "../../Components/super-admin/Dashboard/api";
import { formatDate, LIBELLES_PERIODE } from "../../Components/dashboard/theme";
import { Segment, Squelette } from "../../Components/dashboard/ui";
import KpiTiles from "../../Components/super-admin/Dashboard/KpiTiles";
import UsageChart from "../../Components/super-admin/Dashboard/UsageChart";
import GrowthCharts from "../../Components/super-admin/Dashboard/GrowthCharts";
import { PaymentsCard, RolesCard } from "../../Components/super-admin/Dashboard/BreakdownCards";
import { StoresHealthCard, TopStoresCard } from "../../Components/super-admin/Dashboard/StoresCards";
import Recentusers from "../../Components/super-admin/Diagramme/Recentusers";

const PERIODES: { valeur: Jours; libelle: string }[] = [
  { valeur: 7, libelle: "7 j" },
  { valeur: 30, libelle: "30 j" },
  { valeur: 90, libelle: "90 j" },
  { valeur: 365, libelle: "12 mois" },
];

const Superadmindashboard = () => {
  const [jours, setJours] = useState<Jours>(30);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["staff-vue-ensemble", jours],
    queryFn: () => fetchVueEnsemble(jours),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 sm:gap-5">
      {/* En-tête et filtre de période (s'applique à toute la page sauf l'activité) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-950">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data
              ? `${LIBELLES_PERIODE[jours]} · du ${formatDate(data.periode.debut, { day: "numeric", month: "short" })} au ${formatDate(data.periode.fin)}`
              : "Vue d'ensemble de la plateforme"}
          </p>
        </div>
        <Segment libelle="Période analysée" taille="md" options={PERIODES} valeur={jours} onChange={setJours} />
      </div>

      {isError && !data ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          Impossible de charger le tableau de bord.{" "}
          <button type="button" onClick={() => refetch()} className="font-semibold underline">
            Réessayer
          </button>
        </div>
      ) : isLoading || !data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Squelette key={i} hauteur={128} />
          ))}
        </div>
      ) : (
        <div className={`transition-opacity ${isFetching ? "opacity-70" : ""}`}>
          <KpiTiles data={data} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <UsageChart />
        </div>
        {data ? <PaymentsCard data={data} /> : <Squelette hauteur={380} />}
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <GrowthCharts data={data} />
            </div>
            <TopStoresCard data={data} />
          </div>

          <StoresHealthCard data={data} />

          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
            <RolesCard data={data} />
            <div className="min-w-0 xl:col-span-2">
              <Recentusers />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Superadmindashboard;
