// Gabarit commun des pages du site public : barre de navigation, contenu,
// appel à l'action final et pied de page.
import React, { useEffect } from "react";
import { Check } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatNanse from "./ChatNanse";
import { BoutonPrincipal, BoutonSecondaire, Note, TexteSurligne } from "./Elements";
import { sansMarques } from "../outils";
import { useSite } from "../site";
import { useApparition } from "../useApparition";
import "../public.css";

export const PageSite: React.FC<{ titreDoc: string; cle?: string; children: React.ReactNode }> = ({ titreDoc, cle, children }) => {
  useApparition(cle ?? titreDoc);
  useEffect(() => {
    document.title = sansMarques(titreDoc);
  }, [titreDoc]);
  return (
    <div className="site-public min-h-screen overflow-x-clip bg-white">
      <Navbar />
      <main id="contenu">{children}</main>
      <Footer />
      <ChatNanse />
    </div>
  );
};

export const Garanties: React.FC<{ centre?: boolean }> = ({ centre = true }) => {
  const s = useSite();
  return (
    <ul className={`mt-6 flex flex-wrap gap-x-6 gap-y-2 ${centre ? "justify-center" : ""}`}>
      {s.commun.garanties.map((g) => (
        <li key={g} className="flex items-center gap-2 text-[15px] text-texte">
          <Check size={16} strokeWidth={2.5} aria-hidden="true" className="text-stock" />
          {g}
        </li>
      ))}
    </ul>
  );
};

export const BoutonsAction: React.FC<{ secondaire?: { to: string; libelle: string } }> = ({ secondaire }) => {
  const s = useSite();
  const sec = secondaire ?? { to: "/contact?sujet=demonstration", libelle: s.commun.conseiller };
  return (
    <div className="flex flex-col justify-center gap-3 sm:flex-row">
      <BoutonPrincipal to="/register-store" grand>{s.commun.commencer}</BoutonPrincipal>
      <BoutonSecondaire to={sec.to} grand>{sec.libelle}</BoutonSecondaire>
    </div>
  );
};

/** Dernier bloc de chaque page, comme chez Odoo : une phrase, une action. */
export const CtaFinal: React.FC = () => {
  const s = useSite();
  return (
    <section className="relative overflow-hidden bg-marque-50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6" data-apparition>
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          <TexteSurligne texte={s.commun.ctaTitre} />
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-texte">{s.commun.ctaTexte}</p>
        <div className="relative mt-10 inline-flex flex-col items-center">
          <BoutonsAction secondaire={{ to: "/login", libelle: s.commun.ctaDeja }} />
          <Note sens="haut-gauche" className="absolute -right-4 top-full mt-2 hidden translate-x-full md:flex">
            {s.commun.garanties[0]}
          </Note>
        </div>
      </div>
    </section>
  );
};
