// Petits éléments partagés par les cartes du tableau de bord.
import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { COULEURS } from "./theme";

interface CarteProps {
  titre: string;
  sousTitre?: string;
  icone?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Carte blanche avec en-tête (icône, titre, sous-titre, action à droite). */
export const Carte: React.FC<CarteProps> = ({ titre, sousTitre, icone, action, children, className = "" }) => (
  <section className={`min-w-0 rounded-2xl border border-purple-100/70 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
    <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {icone && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-950">
            {icone}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{titre}</h2>
          {sousTitre && <p className="mt-0.5 text-xs text-slate-500">{sousTitre}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
    {children}
  </section>
);

/** Évolution par rapport à la période précédente (flèche + libellé, jamais la couleur seule). */
export const Evolution: React.FC<{ valeur: number | null; inverse?: boolean }> = ({ valeur, inverse = false }) => {
  // Pas de période précédente à comparer (0) : on n'affiche pas de pourcentage.
  if (valeur === null) return null;
  if (valeur === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
        <Minus size={13} /> stable
      </span>
    );
  }
  const hausse = valeur > 0;
  const bon = inverse ? !hausse : hausse;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
        bon ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
      }`}
    >
      {hausse ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {hausse ? "+" : ""}
      {valeur.toLocaleString("fr-FR")} %
    </span>
  );
};

interface BarreProps {
  libelle: React.ReactNode;
  valeur: number;
  max: number;
  texteValeur: string;
  couleur?: string;
  detail?: React.ReactNode;
}

/** Ligne « libellé — valeur » avec une barre horizontale proportionnelle. */
export const Barre: React.FC<BarreProps> = ({ libelle, valeur, max, texteValeur, couleur = COULEURS.serie1, detail }) => {
  const largeur = max > 0 ? Math.max((valeur / max) * 100, valeur > 0 ? 2 : 0) : 0;
  return (
    <div className="min-w-0" title={`${typeof libelle === "string" ? libelle : ""} : ${texteValeur}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-slate-700">{libelle}</span>
        <span className="shrink-0 font-semibold tabular-nums text-slate-900">{texteValeur}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: COULEURS.piste }}>
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${largeur}%`, background: couleur }} />
      </div>
      {detail && <div className="mt-1 text-xs text-slate-500">{detail}</div>}
    </div>
  );
};

/** Bloc d'attente pendant le premier chargement. */
export const Squelette: React.FC<{ hauteur?: number }> = ({ hauteur = 220 }) => (
  <div className="animate-pulse rounded-xl bg-slate-100" style={{ height: hauteur }} />
);

export const MessageVide: React.FC<{ texte: string }> = ({ texte }) => (
  <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-sm text-slate-400">
    {texte}
  </div>
);

interface SegmentProps<T extends string | number> {
  options: { valeur: T; libelle: React.ReactNode }[];
  valeur: T;
  onChange: (valeur: T) => void;
  libelle: string;
  taille?: "sm" | "md";
}

/** Boutons groupés (un seul choix). Défile horizontalement sur très petit écran. */
export function Segment<T extends string | number>({ options, valeur, onChange, libelle, taille = "sm" }: SegmentProps<T>) {
  return (
    <div role="radiogroup" aria-label={libelle} className="flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1">
      {options.map((option) => {
        const actif = option.valeur === valeur;
        return (
          <button
            key={String(option.valeur)}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(option.valeur)}
            className={`shrink-0 whitespace-nowrap rounded-lg font-medium transition-colors ${
              taille === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
            } ${actif ? "bg-purple-950 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-purple-950"}`}
          >
            {option.libelle}
          </button>
        );
      })}
    </div>
  );
}
