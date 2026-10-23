// Barre d'onglets du tableau de bord et chargement des onglets détaillés (à la demande).
import React, { useEffect, useRef } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Banknote, Boxes, LayoutDashboard, ShoppingBag, UsersRound, Contact } from "lucide-react";
import type { Jours } from "../api";
import { fetchOnglet, type Onglets } from "./api";
import { EtatOnglet } from "./communs";
import { useTextesOnglets } from "./textes";
import { CLES_ONGLETS, type CleOnglet } from "./cles";
import OngletStock from "./OngletStock";
import OngletVentes from "./OngletVentes";
import OngletClients from "./OngletClients";
import OngletFinances from "./OngletFinances";
import OngletEquipe from "./OngletEquipe";


const ICONES: Record<CleOnglet, React.ReactNode> = {
  apercu: <LayoutDashboard size={16} />,
  ventes: <ShoppingBag size={16} />,
  stock: <Boxes size={16} />,
  clients: <Contact size={16} />,
  finances: <Banknote size={16} />,
  equipe: <UsersRound size={16} />,
};

export const BarreOnglets: React.FC<{ actif: CleOnglet; onChange: (o: CleOnglet) => void }> = ({ actif, onChange }) => {
  const { t } = useTextesOnglets();
  const actifRef = useRef<HTMLButtonElement>(null);
  // Sur mobile, la barre défile : l'onglet choisi est ramené au centre.
  useEffect(() => {
    actifRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [actif]);
  return (
    <nav aria-label="Sections du tableau de bord" className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <div role="tablist" className="flex w-max min-w-full gap-1 rounded-2xl border border-purple-100/70 bg-white p-1 shadow-sm">
        {CLES_ONGLETS.map((cle) => {
          const choisi = cle === actif;
          return (
            <button
              key={cle}
              ref={choisi ? actifRef : undefined}
              type="button"
              role="tab"
              aria-selected={choisi}
              onClick={() => onChange(cle)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                choisi ? "bg-purple-950 text-white shadow-sm" : "text-slate-600 hover:bg-purple-50 hover:text-purple-950"
              }`}
            >
              {ICONES[cle]} {t.onglets[cle]}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

/** Contenu d'un onglet détaillé : données chargées seulement à l'ouverture de l'onglet. */
export function ContenuOnglet<K extends keyof Onglets>({ onglet, jours }: { onglet: K; jours: Jours }) {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin-onglet", onglet, jours],
    queryFn: () => fetchOnglet(onglet, jours),
    // On garde les données affichées pendant le rechargement uniquement pour le
    // MÊME onglet (changement de période). Sinon un onglet recevrait un instant
    // les données d'un autre onglet, de forme différente (ex. Équipe → Finances).
    placeholderData: (precedentes, requetePrecedente) =>
      requetePrecedente?.queryKey[1] === onglet ? keepPreviousData(precedentes) : undefined,
  });
  if (!data || (isError && !data)) return <EtatOnglet chargement={isLoading} erreur={isError} relancer={() => refetch()} />;

  // Les données précédentes restent affichées (un peu atténuées) pendant le rechargement.
  const garde = (ok: boolean) => (ok ? "" : "pointer-events-none");
  const contenu = (() => {
    switch (onglet) {
      case "stock": return <OngletStock d={data as Onglets["stock"]} />;
      case "ventes": return <OngletVentes d={data as Onglets["ventes"]} />;
      case "clients": return <OngletClients d={data as Onglets["clients"]} />;
      case "finances": return <OngletFinances d={data as Onglets["finances"]} />;
      default: return <OngletEquipe d={data as Onglets["equipe"]} />;
    }
  })();
  return <div className={`transition-opacity ${isFetching ? "opacity-70" : ""} ${garde(!isFetching)}`}>{contenu}</div>;
}
