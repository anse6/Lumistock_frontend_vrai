// Éléments de mise en page du site public, dans l'esprit des pages produit
// d'Odoo : titre avec un mot surligné au pinceau, annotation manuscrite avec
// flèche, boutons d'action, icônes de modules colorées.
import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UsersRound,
} from "lucide-react";
import type { SlugModule } from "../site";

/* ------------------------------------------------------------ surlignage */

const PINCEAU = "M4 18 C 40 8, 90 6, 140 9 S 240 14, 296 8 L 292 26 C 230 31, 160 27, 100 30 S 30 32, 6 30 Z";
const TRAIT = "M3 9 C 60 2, 150 1, 297 7";

/** Mot mis en valeur : coup de pinceau derrière (défaut) ou trait souligné. */
export const Surligne: React.FC<{ children: React.ReactNode; style?: "pinceau" | "trait"; couleur?: string }> = ({
  children,
  style = "pinceau",
  couleur,
}) => (
  <span className={`surligne surligne-${style}`}>
    {children}
    <svg viewBox="0 0 300 36" preserveAspectRatio="none" aria-hidden="true">
      {style === "pinceau" ? (
        <path d={PINCEAU} fill={couleur ?? "#fcd34d"} opacity="0.75" />
      ) : (
        <path d={TRAIT} fill="none" stroke={couleur ?? "#a855f7"} strokeWidth="5" strokeLinecap="round" />
      )}
    </svg>
  </span>
);

/** Texte où le passage entre astérisques est surligné : « Votre stock, *au produit près* ». */
export const TexteSurligne: React.FC<{ texte: string; style?: "pinceau" | "trait"; couleur?: string }> = ({ texte, style, couleur }) => (
  <>
    {/* espace insécable avant « : ; ! ? » : la ponctuation ne part jamais seule à la ligne */}
    {texte.replace(/ ([:;!?])/g, "\u00a0$1").split(/(\*[^*]+\*)/).map((morceau, i) =>
      morceau.startsWith("*") && morceau.endsWith("*") ? (
        <Surligne key={i} style={style} couleur={couleur}>{morceau.slice(1, -1)}</Surligne>
      ) : (
        <React.Fragment key={i}>{morceau}</React.Fragment>
      ),
    )}
  </>
);

/* ------------------------------------------------------------ annotation */

type SensFleche = "bas-gauche" | "bas-droite" | "haut-gauche" | "haut-droite";

const Fleche: React.FC<{ sens: SensFleche; className?: string }> = ({ sens, className = "" }) => {
  const retourne = sens.endsWith("gauche") ? "-scale-x-100" : "";
  const vertical = sens.startsWith("haut") ? "-scale-y-100" : "";
  return (
    <svg viewBox="0 0 80 60" className={`h-12 w-16 ${retourne} ${vertical} ${className}`} fill="none" aria-hidden="true">
      <path d="M6 6 C 30 4, 58 14, 66 46" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M54 38 L 66 48 L 72 33" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/** Petite note manuscrite avec une flèche, posée près d'une capture d'écran. */
export const Note: React.FC<{ children: React.ReactNode; sens?: SensFleche; className?: string }> = ({
  children,
  sens = "bas-droite",
  className = "",
}) => {
  const fleche = <Fleche sens={sens} className="shrink-0" />;
  const enHaut = sens.startsWith("haut");
  return (
    <span className={`pointer-events-none flex select-none items-end gap-1 text-marque-600 ${enHaut ? "flex-col-reverse items-start" : ""} ${className}`}>
      {sens.endsWith("gauche") && !enHaut && fleche}
      <span className="font-main max-w-[15rem] text-[1.45rem] font-bold leading-[1.05]">{children}</span>
      {(sens.endsWith("droite") || enHaut) && fleche}
    </span>
  );
};

/* ------------------------------------------------------------ boutons */

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marque";

export const BoutonPrincipal: React.FC<{ to: string; children: React.ReactNode; grand?: boolean; fleche?: boolean }> = ({
  to,
  children,
  grand,
  fleche = true,
}) => (
  <Link
    to={to}
    className={`group inline-flex items-center justify-center gap-2 rounded-lg !bg-marque font-semibold !text-white shadow-[0_8px_20px_-10px_rgba(59,7,100,0.7)] transition-colors duration-150 hover:!bg-marque-fonce ${focus} ${
      grand ? "min-h-13 px-7 text-[17px]" : "min-h-11 px-5 text-[15px]"
    }`}
  >
    {children}
    {fleche && <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5" />}
  </Link>
);

export const BoutonSecondaire: React.FC<{ to: string; children: React.ReactNode; grand?: boolean }> = ({ to, children, grand }) => (
  <Link
    to={to}
    className={`inline-flex items-center justify-center rounded-lg border border-trait !bg-white font-semibold !text-encre transition-colors duration-150 hover:border-slate-300 hover:!bg-fond ${focus} ${
      grand ? "min-h-13 px-7 text-[17px]" : "min-h-11 px-5 text-[15px]"
    }`}
  >
    {children}
  </Link>
);

export const LienFleche: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} className={`group inline-flex items-center gap-1.5 rounded font-semibold !text-marque hover:!text-marque-600 ${focus}`}>
    {children}
    <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5" />
  </Link>
);

/* ------------------------------------------------------------ icônes des modules */

const ICONES: Record<SlugModule, { icone: React.ElementType; fond: string; trait: string }> = {
  ventes: { icone: ShoppingCart, fond: "#fff1e6", trait: "#c2410c" },
  caisse: { icone: Store, fond: "#e8f7ef", trait: "#047857" },
  clients: { icone: UsersRound, fond: "#fdecef", trait: "#be123c" },
  messagerie: { icone: MessageSquareText, fond: "#e6f4fb", trait: "#0369a1" },
  stock: { icone: Boxes, fond: "#f3e8ff", trait: "#6b21a8" },
  achats: { icone: Truck, fond: "#fef6dc", trait: "#a16207" },
  comptabilite: { icone: Landmark, fond: "#e7ecfb", trait: "#3730a3" },
  pilotage: { icone: BarChart3, fond: "#e3f6f4", trait: "#0f766e" },
  equipe: { icone: ShieldCheck, fond: "#eef0f3", trait: "#334155" },
};

export const IconeModule: React.FC<{ slug: SlugModule; taille?: "s" | "m" | "l" }> = ({ slug, taille = "m" }) => {
  const { icone: Icone, fond, trait } = ICONES[slug];
  const dims = { s: "h-9 w-9 rounded-lg", m: "h-14 w-14 rounded-2xl", l: "h-20 w-20 rounded-[1.4rem]" }[taille];
  const px = { s: 18, m: 26, l: 36 }[taille];
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center ${dims}`} style={{ backgroundColor: fond, color: trait }}>
      <Icone size={px} strokeWidth={1.9} />
    </span>
  );
};

/* ------------------------------------------------------------ titres de section */

export const TitreSection: React.FC<{ titre: string; texte?: string; centre?: boolean; niveau?: "h1" | "h2" }> = ({
  titre,
  texte,
  centre = true,
  niveau = "h2",
}) => {
  const Balise = niveau;
  return (
    <div className={centre ? "mx-auto max-w-3xl text-center" : "max-w-2xl"} data-apparition>
      <Balise className={`font-bold tracking-tight ${niveau === "h1" ? "text-4xl leading-[1.08] sm:text-5xl lg:text-6xl" : "text-3xl leading-tight sm:text-[2.6rem]"}`}>
        <TexteSurligne texte={titre} />
      </Balise>
      {texte && <p className="mt-5 text-lg leading-relaxed text-texte sm:text-xl">{texte}</p>}
    </div>
  );
};
