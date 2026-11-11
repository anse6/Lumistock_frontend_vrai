// Barre d'onglets du tableau de bord et chargement des onglets détaillés (à la demande).
import React from "react";
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
  // Téléphone : grille 3 × 2, les six sections visibles d'un coup (icône au-dessus
  // du nom). À partir de la tablette : une seule ligne, comme avant.
  return (
    <nav aria-label="Sections du tableau de bord">
      <div
        role="tablist"
        className="grid grid-cols-3 gap-1.5 rounded-2xl border border-purple-100/70 bg-white p-1.5 shadow-sm md:flex md:gap-1 md:p-1"
      >
        {CLES_ONGLETS.map((cle) => {
          const choisi = cle === actif;
          return (
            <button
              key={cle}
              type="button"
              role="tab"
              aria-selected={choisi}
              onClick={() => onChange(cle)}
              className={`flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[12px] font-semibold leading-tight transition-colors md:min-h-0 md:flex-1 md:flex-row md:gap-2 md:whitespace-nowrap md:px-3.5 md:text-sm md:font-medium ${
                choisi
                  ? "bg-purple-950 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-purple-50 hover:text-purple-950 md:bg-transparent"
              }`}
            >
              <span className="shrink-0">{ICONES[cle]}</span>
              <span className="max-w-full text-center [text-wrap:balance]">{t.onglets[cle]}</span>
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
