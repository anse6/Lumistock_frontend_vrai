// Page d'accueil publique de Lumistock, sur le modèle d'Odoo : grand titre
// centré avec un mot surligné, annotations manuscrites, grille des modules
// (« un besoin, un module »), capture du tableau de bord, puis les réalités du
// commerce en Afrique centrale, trois zooms, secteurs, étapes, FAQ et appel final.
import React from "react";
import { Link } from "react-router-dom";
import { Banknote, BookOpenCheck, Languages, Landmark, Smartphone, Truck } from "lucide-react";
import Faq from "./components/Faq";
import { BoutonsAction, CtaFinal, Garanties, PageSite } from "./components/Gabarit";
import { IconeModule, LienFleche, Note, TexteSurligne, TitreSection } from "./components/Elements";
import { delai } from "./outils";
import { Ecran } from "./components/Ecrans";
import { trouverModule, useSite } from "./site";

const ICONES_REALITES = [Banknote, Smartphone, BookOpenCheck, Landmark, Truck, Languages];

const LandingPage: React.FC = () => {
  const s = useSite();
  const a = s.accueil;

  return (
    <PageSite titreDoc={a.titreDoc}>
      {/* ------------------------------------------------------------ bandeau */}
      <section className="relative bg-white pb-16 pt-16 sm:pb-24 sm:pt-24" aria-labelledby="titre-principal">
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="absolute -left-10 top-28 hidden xl:block">
            <Note sens="bas-droite">{a.notes[0]}</Note>
          </div>
          <h1 id="titre-principal" className="text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl" data-apparition>
            <TexteSurligne texte={a.titre} />
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-texte sm:text-xl" data-apparition style={delai(60)}>
            {a.texte}
          </p>
          <div className="relative mt-10" data-apparition style={delai(120)}>
            <div className="absolute left-[calc(50%+250px)] -top-10 hidden xl:block">
              <Note sens="bas-gauche">{a.notes[1]}</Note>
            </div>
            <BoutonsAction />
            <Garanties />
          </div>
        </div>

        {/* grille des modules, comme la grille d'applications d'Odoo */}
        <div className="mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:px-8">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {s.modules.map((m, i) => (
              <li key={m.slug} data-apparition style={delai((i % 3) * 50)}>
                <Link
                  to={`/modules/${m.slug}`}
                  className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-transparent !bg-white p-4 text-center transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-trait hover:shadow-[0_20px_40px_-24px_rgba(59,7,100,0.4)] sm:flex-row sm:items-start sm:p-5 sm:text-left"
                >
                  <IconeModule slug={m.slug} />
                  <span>
                    <span className="block font-titre text-[16px] font-bold !text-encre group-hover:!text-marque sm:text-[17px]">{m.nom}</span>
                    <span className="mt-0.5 hidden text-[14px] leading-snug !text-attenue sm:block">{m.accroche}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center" data-apparition>
            <LienFleche to="/fonctionnalites">{s.commun.toutesFonctions}</LienFleche>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ tableau de bord */}
      <section className="bg-marque py-20 sm:py-28" aria-labelledby="titre-ecran">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="titre-ecran" className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight !text-white sm:text-[2.6rem]" data-apparition>
            <TexteSurligne texte={a.ecranTitre} couleur="#a855f7" />
          </h2>
          <div className="relative mx-auto mt-14 max-w-6xl" data-apparition style={delai(80)}>
            <p className="font-main absolute -top-10 right-4 hidden text-[1.6rem] font-bold text-marque-200 lg:block">{a.ecranNote} ↓</p>
            <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/20 sm:p-3">
              <Ecran cle="tableau" />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ réalités */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitreSection titre={a.realitesTitre} texte={a.realitesTexte} />
          <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {a.realites.map((r, i) => {
              const Icone = ICONES_REALITES[i];
              return (
                <li key={r.titre} data-apparition style={delai((i % 3) * 60)}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-marque-50 text-marque">
                    <Icone size={24} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{r.titre}</h3>
                  <p className="mt-2 text-[15.5px] leading-relaxed text-texte">{r.desc}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ zooms */}
      <div className="border-t border-trait">
        {a.zooms.map((z, i) => {
          const m = trouverModule(s, z.slug)!;
          const sec = m.sections[z.index];
          return (
            <section key={z.slug} className={`py-16 sm:py-24 ${i % 2 === 0 ? "bg-fond" : "bg-white"}`}>
              <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
                <div className={i % 2 ? "lg:order-2" : ""} data-apparition>
                  <Link to={`/modules/${m.slug}`} className="inline-flex items-center gap-2.5 rounded-full border border-trait !bg-white py-1 pl-1 pr-3.5 text-sm font-semibold !text-encre hover:border-marque-200">
                    <IconeModule slug={m.slug} taille="s" />
                    {m.nom}
                  </Link>
                  <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-[2.4rem]">
                    <TexteSurligne texte={sec.titre} />
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-texte">{sec.texte}</p>
                  <div className="mt-7">
                    <LienFleche to={`/modules/${m.slug}`}>{s.commun.decouvrir} : {m.nom}</LienFleche>
                  </div>
                </div>
                <div className={`relative ${i % 2 ? "lg:order-1" : ""}`} data-apparition style={delai(100)}>
                  {sec.note && (
                    <div className={`absolute -top-14 hidden lg:block ${i % 2 ? "right-0" : "left-0"}`}>
                      <Note sens={i % 2 ? "bas-gauche" : "bas-droite"}>{sec.note}</Note>
                    </div>
                  )}
                  <Ecran cle={sec.ecran} />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ------------------------------------------------------------ secteurs */}
      <section className="border-t border-trait bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <TitreSection titre={a.secteursTitre} />
          <ul className="mt-10 flex flex-wrap justify-center gap-3" data-apparition>
            {a.secteurs.map((sect) => (
              <li key={sect} className="rounded-full border border-trait bg-fond px-5 py-2.5 text-[15px] font-semibold text-encre">
                {sect}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ étapes */}
      <section id="etapes" className="bg-fond py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitreSection titre={a.etapesTitre} />
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {a.etapes.map((e, i) => (
              <li key={e.titre} className="rounded-2xl border border-trait bg-white p-7" data-apparition style={delai(i * 80)}>
                <span className="font-main text-5xl font-bold leading-none text-marque-300">{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold">{e.titre}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-texte">{e.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ FAQ */}
      <section id="faq" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Faq />
        </div>
      </section>

      <CtaFinal />
    </PageSite>
  );
};

export default LandingPage;
