// Page d'accueil publique de Lumistock, sur le modèle d'Odoo : grand titre
// centré avec un mot surligné, annotations manuscrites, grille des modules
// (« un besoin, un module »), capture du tableau de bord, puis les réalités du
// commerce en Afrique centrale, trois zooms, secteurs, étapes, FAQ et appel final.
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Banknote, BookOpenCheck, Monitor, Tablet, Languages, Landmark, Smartphone, Truck, WalletCards } from "lucide-react";
import Faq from "./components/Faq";
import { BoutonsAction, CtaFinal, Garanties, PageSite } from "./components/Gabarit";
import { IconeModule, LienFleche, Note, TexteSurligne, TitreSection } from "./components/Elements";
import { delai } from "./outils";
import { Ecran } from "./components/Ecrans";
import { PHOTO_ACCUEIL } from "./components/Photos";
import Appareils from "./components/Appareils";
import { trouverModule, useSite } from "./site";

const ICONES_APPAREILS = [Monitor, Tablet, Smartphone];
const ICONES_REALITES = [Banknote, WalletCards, BookOpenCheck, Landmark, Truck, Languages];

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

        {/* photo d'ambiance : une commerçante à son comptoir */}
        <div className="mx-auto mt-14 max-w-6xl px-4 sm:mt-16 sm:px-6 lg:px-8" data-apparition style={delai(180)}>
          <div className="relative overflow-hidden rounded-[1.75rem] bg-marque-50 shadow-[0_40px_80px_-40px_rgba(59,7,100,0.45)] ring-1 ring-trait sm:rounded-[2rem]">
            <img
              src={PHOTO_ACCUEIL}
              alt=""
              aria-hidden="true"
              width={2000}
              height={1333}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/3] w-full object-cover sm:aspect-[16/9] lg:aspect-[21/9]"
              style={{ objectPosition: "50% 38%" }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/5" />
          </div>
        </div>

        {/* grille des modules, comme la grille d'applications d'Odoo */}
        <div className="mx-auto mt-20 max-w-6xl px-4 sm:mt-28 sm:px-6 lg:px-8">
          <TitreSection id="titre-modules" titre={a.modulesTitre} texte={a.modulesTexte} />
          <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {s.modules.map((m, i) => (
              <li key={m.slug} className={i === s.modules.length - 1 && s.modules.length % 2 ? "col-span-2 sm:col-span-1" : undefined} data-apparition style={delai((i % 3) * 50)}>
                {/* carte cliquable : bordure, ombre et flèche visibles d'emblée,
                    pour qu'on comprenne qu'elle mène à la page du module */}
                <Link
                  to={`/modules/${m.slug}`}
                  className="group flex h-full cursor-pointer flex-col items-center gap-3 rounded-2xl border border-trait !bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-16px_rgba(59,7,100,0.25)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-marque-200 hover:shadow-[0_20px_40px_-20px_rgba(59,7,100,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marque active:scale-[0.98] sm:flex-row sm:items-center sm:p-5 sm:text-start"
                >
                  <IconeModule slug={m.slug} />
                  <span className="flex flex-1 flex-col items-center sm:items-start">
                    <span className="block font-titre text-[16px] font-bold !text-encre group-hover:!text-marque sm:text-[17px]">{m.nom}</span>
                    <span className="mt-0.5 hidden text-[14px] leading-snug !text-attenue sm:block">{m.accroche}</span>
                    {/* sur mobile, pas de place pour la flèche à droite : lien texte */}
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[13px] font-semibold !text-marque sm:hidden">
                      {s.commun.decouvrir}
                      <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" className="rtl:-scale-x-100" />
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marque-50 text-marque transition-[background-color,color,transform] duration-200 group-hover:translate-x-0.5 group-hover:bg-marque group-hover:text-white rtl:group-hover:-translate-x-0.5 sm:flex"
                  >
                    <ArrowRight size={17} strokeWidth={2.25} className="rtl:-scale-x-100" />
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
          <div className="relative mx-auto mt-16 max-w-6xl" data-apparition style={delai(80)}>
            <p className="font-main absolute -top-12 right-4 hidden text-[1.6rem] font-bold text-marque-200 lg:block">{a.ecranNote} ↓</p>
            <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/20 sm:p-3">
              <Ecran cle="tableau" />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ multiplateforme */}
      <section className="overflow-hidden bg-white py-20 sm:py-28" aria-labelledby="titre-appareils">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center" data-apparition>
            <h2 id="titre-appareils" className="text-3xl font-bold leading-tight tracking-tight sm:text-[2.6rem]">
              <TexteSurligne texte={a.appareils.titre} />
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-texte sm:text-xl">{a.appareils.texte}</p>
          </div>
          <div className="relative mt-14 sm:mt-20" data-apparition style={delai(80)}>
            <div className="absolute -top-12 end-[6%] hidden lg:block">
              <Note sens="bas-gauche">{a.appareils.note}</Note>
            </div>
            <div aria-hidden="true" className="absolute inset-x-[8%] bottom-[6%] top-[12%] -z-0 rounded-full bg-marque-100/60 blur-3xl" />
            <div className="relative">
              <Appareils />
            </div>
          </div>
          <ul className="mx-auto mt-16 grid max-w-5xl gap-6 sm:mt-24 md:grid-cols-3">
            {a.appareils.points.map((pt, i) => {
              const Icone = ICONES_APPAREILS[i];
              return (
                <li key={pt.titre} className="rounded-2xl border border-trait bg-fond p-6" data-apparition style={delai(i * 70)}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-marque ring-1 ring-trait">
                    <Icone size={22} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{pt.titre}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-texte">{pt.desc}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ réalités */}
      <section className="border-t border-trait bg-fond py-20 sm:py-28" aria-labelledby="titre-realites">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitreSection id="titre-realites" titre={a.realitesTitre} texte={a.realitesTexte} />
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
            <section key={z.slug} className={`py-16 sm:py-24 ${i % 2 === 0 ? "bg-white" : "bg-fond"}`}>
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
                <span className="font-main text-5xl font-bold leading-none text-marque-600">{i + 1}</span>
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
