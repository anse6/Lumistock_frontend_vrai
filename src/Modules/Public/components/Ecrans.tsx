// Vraies captures de Lumistock pour le site public, prises sur l'instance de
// démonstration (magasin fictif, données d'exemple). Fichiers WebP dans
// src/assets/ecrans/ : le tableau de bord avec son menu, les autres écrans
// sans le menu ni la barre du haut pour rester lisibles en petit.
import React from "react";
import type { CleEcran } from "../site";
import tableau from "../../../assets/ecrans/tableau.webp";
import caisse from "../../../assets/ecrans/caisse.webp";
import session from "../../../assets/ecrans/session.webp";
import ticket from "../../../assets/ecrans/ticket.webp";
import vente from "../../../assets/ecrans/vente.webp";
import stock from "../../../assets/ecrans/stock.webp";
import mouvements from "../../../assets/ecrans/mouvements.webp";
import valorisation from "../../../assets/ecrans/valorisation.webp";
import approvisionnement from "../../../assets/ecrans/approvisionnement.webp";
import factures from "../../../assets/ecrans/factures.webp";
import gerant from "../../../assets/ecrans/gerant.webp";
import compteClient from "../../../assets/ecrans/compteClient.webp";
import reglement from "../../../assets/ecrans/reglement.webp";
import journal from "../../../assets/ecrans/journal.webp";
import tva from "../../../assets/ecrans/tva.webp";
import bilan from "../../../assets/ecrans/bilan.webp";
import messagerie from "../../../assets/ecrans/messagerie.webp";
import planification from "../../../assets/ecrans/planification.webp";
import rapport from "../../../assets/ecrans/rapport.webp";
import ia from "../../../assets/ecrans/ia.webp";
import droits from "../../../assets/ecrans/droits.webp";
import equipe from "../../../assets/ecrans/equipe.webp";

/** Image et dimensions réelles (évite le saut de mise en page au chargement). */
const CAPTURES: Record<Exclude<CleEcran, "ticket">, { src: string; l: number; h: number }> = {
  tableau: { src: tableau, l: 1800, h: 1125 },
  caisse: { src: caisse, l: 1400, h: 989 },
  session: { src: session, l: 1400, h: 989 },
  vente: { src: vente, l: 1400, h: 989 },
  stock: { src: stock, l: 1400, h: 989 },
  mouvements: { src: mouvements, l: 1400, h: 989 },
  valorisation: { src: valorisation, l: 1400, h: 989 },
  approvisionnement: { src: approvisionnement, l: 1400, h: 989 },
  factures: { src: factures, l: 1400, h: 989 },
  gerant: { src: gerant, l: 1400, h: 989 },
  compteClient: { src: compteClient, l: 1400, h: 989 },
  reglement: { src: reglement, l: 1400, h: 989 },
  journal: { src: journal, l: 1600, h: 1052 },
  tva: { src: tva, l: 1400, h: 989 },
  bilan: { src: bilan, l: 1400, h: 989 },
  messagerie: { src: messagerie, l: 1400, h: 989 },
  planification: { src: planification, l: 1400, h: 989 },
  rapport: { src: rapport, l: 1400, h: 989 },
  ia: { src: ia, l: 1400, h: 989 },
  droits: { src: droits, l: 1400, h: 989 },
  equipe: { src: equipe, l: 1400, h: 989 },
};

/** Cadre de fenêtre d'application autour de la capture. */
const Fenetre: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <figure
    aria-hidden="true"
    className="overflow-hidden rounded-xl border border-trait bg-white shadow-[0_30px_60px_-30px_rgba(59,7,100,0.35),0_2px_6px_rgba(15,23,42,0.06)]"
  >
    <div className="flex items-center gap-1.5 border-b border-trait bg-fond px-3.5 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
    </div>
    {children}
  </figure>
);

/** Le ticket de caisse 80 mm, posé comme un vrai ticket papier. */
const Ticket: React.FC = () => (
  <figure aria-hidden="true" className="flex justify-center rounded-2xl bg-gradient-to-b from-marque-50 to-fond px-6 py-10 sm:py-12">
    <img
      src={ticket}
      alt=""
      width={302}
      height={629}
      loading="lazy"
      decoding="async"
      className="w-[240px] rounded-sm bg-white shadow-[0_24px_48px_-20px_rgba(59,7,100,0.45),0_2px_6px_rgba(15,23,42,0.08)] sm:w-[280px]"
    />
  </figure>
);

export const Ecran: React.FC<{ cle: CleEcran }> = ({ cle }) => {
  if (cle === "ticket") return <Ticket />;
  const c = CAPTURES[cle];
  return (
    <Fenetre>
      <img src={c.src} alt="" width={c.l} height={c.h} loading="lazy" decoding="async" className="block h-auto w-full" />
    </Fenetre>
  );
};
