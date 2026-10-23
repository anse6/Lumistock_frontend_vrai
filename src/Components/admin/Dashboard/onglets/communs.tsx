// Éléments communs aux onglets détaillés.
import React from "react";
import { Evolution, Squelette } from "../../../dashboard/ui";
import { montantEnParties } from "../../../dashboard/theme";
import { useTextesOnglets } from "./textes";

/** Montant en grand, devise en petit (jamais coupée au milieu). */
export const GrosMontant: React.FC<{ valeur: number; devise: string }> = ({ valeur, devise }) => {
  const p = montantEnParties(valeur, devise);
  return (
    <>
      <span className="whitespace-nowrap">{p.nombre}</span>{" "}
      <span className="whitespace-nowrap text-xs font-semibold opacity-70 sm:text-sm">{p.devise}</span>
    </>
  );
};

interface TuileProps {
  titre: string;
  valeur: React.ReactNode;
  icone: React.ReactNode;
  detail?: React.ReactNode;
  evolution?: number | null;
  libelleEvolution?: string;
  ton?: "normal" | "alerte" | "negatif";
  aide?: string;
}

/** Indicateur clé : titre, grand chiffre, explication courte, évolution éventuelle. */
export const Tuile: React.FC<TuileProps> = ({ titre, valeur, icone, detail, evolution, libelleEvolution, ton = "normal", aide }) => (
  <div className="flex min-w-0 flex-col rounded-2xl border border-purple-100/70 bg-white p-3.5 shadow-sm sm:p-4" title={aide}>
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-medium leading-tight text-slate-500 sm:text-sm">{titre}</p>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-950">{icone}</span>
    </div>
    <p className={`mt-2 text-lg font-bold leading-tight sm:text-2xl xl:text-xl 2xl:text-2xl ${
      ton === "negatif" ? "text-red-700" : ton === "alerte" ? "text-amber-700" : "text-purple-950"}`}>{valeur}</p>
    {detail && <div className="mt-1 text-[11px] leading-snug text-slate-500 sm:text-xs">{detail}</div>}
    {evolution !== undefined && evolution !== null && (
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5">
        <Evolution valeur={evolution} />
        {libelleEvolution && <span className="text-[11px] text-slate-400">{libelleEvolution}</span>}
      </div>
    )}
  </div>
);

export const GrilleTuiles: React.FC<{ children: React.ReactNode; colonnes?: 4 | 5 }> = ({ children, colonnes = 5 }) => (
  <div className={`grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 ${colonnes === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>{children}</div>
);

/** Pastille de légende : couleur + libellé, toujours visible. */
export const Legende: React.FC<{ items: { couleur: string; libelle: string; trait?: boolean }[] }> = ({ items }) => (
  <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
    {items.map((i) => (
      <span key={i.libelle} className="flex items-center gap-1.5">
        <span className={i.trait ? "h-0.5 w-4 rounded" : "h-2.5 w-2.5 rounded-sm"} style={{ background: i.couleur }} />
        {i.libelle}
      </span>
    ))}
  </div>
);

/** Infobulle commune des graphiques. */
export const Bulle: React.FC<{ titre: string; lignes: { couleur?: string; libelle: string; valeur: string; trait?: boolean }[]; note?: string }> = ({ titre, lignes, note }) => (
  <div className="max-w-[260px] rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm shadow-lg">
    <p className="mb-1 text-xs capitalize text-slate-500">{titre}</p>
    {lignes.map((l) => (
      <p key={l.libelle} className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-slate-600">
          {l.couleur && <span className={l.trait ? "h-0.5 w-3 rounded" : "h-2.5 w-2.5 rounded-sm"} style={{ background: l.couleur }} />}
          {l.libelle}
        </span>
        <span className="font-semibold tabular-nums text-slate-900">{l.valeur}</span>
      </p>
    ))}
    {note && <p className="mt-1 text-[11px] text-slate-400">{note}</p>}
  </div>
);

/** Chargement / erreur d'un onglet. */
export const EtatOnglet: React.FC<{ chargement: boolean; erreur: boolean; relancer: () => void }> = ({ chargement, erreur, relancer }) => {
  const { t } = useTextesOnglets();
  if (erreur) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        {t.erreur} <button type="button" onClick={relancer} className="font-semibold underline">{t.reessayer}</button>
      </div>
    );
  }
  if (!chargement) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Squelette key={i} hauteur={120} />)}
      </div>
      <Squelette hauteur={340} />
    </div>
  );
};
