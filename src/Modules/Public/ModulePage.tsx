// Page d'un module (/modules/:slug), sur le modèle des pages d'applications
// d'Odoo : sous-navigation Aperçu / Fonctionnalités, grand titre avec un mot
// surligné, capture de l'écran annotée à la main, sections alternées, grille
// des fonctionnalités, modules liés et appel final.
import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { BoutonsAction, CtaFinal, Garanties, PageSite } from "./components/Gabarit";
import { IconeModule, LienFleche, Note, TexteSurligne, TitreSection } from "./components/Elements";
import { delai } from "./outils";
import { Ecran } from "./components/Ecrans";
import { trouverModule, useSite, type Module } from "./site";

/** Bandeau sous la navigation : nom du module + onglets, comme chez Odoo. */
export const SousNavModule: React.FC<{ module: Module; actif: "apercu" | "fonctionnalites" }> = ({ module, actif }) => {
  const s = useSite();
  const onglet = "flex h-12 items-center border-b-2 px-1 text-[15px] font-semibold transition-colors duration-150";
  return (
    <div className="sticky top-16 z-40 border-b border-trait bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to={`/modules/${module.slug}`} className="flex items-center gap-2.5 py-2 !text-encre">
          <IconeModule slug={module.slug} taille="s" />
          <span className="hidden font-titre text-base font-bold sm:inline">{module.nom}</span>
        </Link>
        <nav className="flex gap-5" aria-label={module.nom}>
          <Link
            to={`/modules/${module.slug}`}
            aria-current={actif === "apercu" ? "page" : undefined}
            className={`${onglet} ${actif === "apercu" ? "border-marque !text-marque" : "border-transparent !text-attenue hover:!text-encre"}`}
          >
            {s.nav.apercu}
          </Link>
          <Link
            to={`/fonctionnalites#${module.slug}`}
            className={`${onglet} ${actif === "fonctionnalites" ? "border-marque !text-marque" : "border-transparent !text-attenue hover:!text-encre"}`}
          >
            {s.nav.fonctionnalites}
          </Link>
        </nav>
      </div>
    </div>
  );
};

const ModulePage: React.FC = () => {
  const { slug } = useParams();
  const s = useSite();
  const m = trouverModule(s, slug);
  if (!m) return <Navigate to="/" replace />;

  return (
    <PageSite titreDoc={`${m.nom} · Lumistock`} cle={m.slug}>
      <SousNavModule module={m} actif="apercu" />

      {/* ------------------------------------------------------------ bandeau */}
      <section className="bg-white pb-8 pt-14 sm:pt-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex justify-center" data-apparition>
            <IconeModule slug={m.slug} taille="l" />
          </div>
          <div className="mt-6">
            <TitreSection titre={m.titre} texte={m.texte} niveau="h1" />
          </div>
          <div className="mt-10" data-apparition style={delai(80)}>
            <BoutonsAction />
            <Garanties />
          </div>
        </div>
        <div className="relative mx-auto mt-14 max-w-5xl px-4 sm:px-6" data-apparition style={delai(140)}>
          <div className="absolute -left-2 -top-16 hidden xl:block">
            <Note sens="bas-droite">{m.note}</Note>
          </div>
          <div className="rounded-[1.75rem] bg-gradient-to-b from-marque-50 to-white p-3 sm:p-6">
            <Ecran cle={m.ecran} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ sections */}
      <div className="bg-white">
        {m.sections.map((sec, i) =>
          // Section dont l'écran est déjà celui du bandeau : texte centré et
          // points en cartes, pour ne pas montrer deux fois la même capture.
          sec.ecran === m.ecran ? (
            <section key={sec.titre} className={`py-16 sm:py-24 ${i % 2 === 0 ? "bg-fond" : "bg-white"}`}>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <TitreSection titre={sec.titre} texte={sec.texte} />
                <ul className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
                  {sec.points.map((p, j) => (
                    <li key={p} className="flex items-start gap-3 rounded-2xl border border-trait bg-white p-5 text-[15.5px] font-semibold text-encre" data-apparition style={delai(j * 60)}>
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marque text-white">
                        <Check size={13} strokeWidth={3} aria-hidden="true" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : (
            <section key={sec.titre} className={`py-16 sm:py-24 ${i % 2 === 0 ? "bg-fond" : "bg-white"}`}>
              <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
                <div className={i % 2 ? "lg:order-2" : ""}>
                  <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-[2.4rem]" data-apparition>
                    <TexteSurligne texte={sec.titre} />
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-texte" data-apparition>{sec.texte}</p>
                  <ul className="mt-7 space-y-3" data-apparition>
                    {sec.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-[15.5px] text-encre">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-marque text-white">
                          <Check size={12} strokeWidth={3} aria-hidden="true" />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
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
          ),
        )}
      </div>

      {/* ------------------------------------------------------------ fonctionnalités */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitreSection titre={s.commun.fonctionsTitre} />
          <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {m.fonctions.slice(0, 6).map((f, i) => (
              <li key={f.titre} className="border-t-2 border-marque-100 pt-5" data-apparition style={delai((i % 3) * 60)}>
                <h3 className="text-lg font-bold">{f.titre}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-texte">{f.desc}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center" data-apparition>
            <LienFleche to={`/fonctionnalites#${m.slug}`}>{s.commun.toutesFonctions}</LienFleche>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ modules liés */}
      <section className="border-t border-trait bg-fond py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitreSection titre={s.commun.liesTitre} texte={s.commun.liesTexte} />
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {m.lies.map((slugLie, i) => {
              const lie = trouverModule(s, slugLie)!;
              return (
                <li key={slugLie} data-apparition style={delai(i * 70)}>
                  <Link
                    to={`/modules/${slugLie}`}
                    className="group flex h-full flex-col rounded-2xl border border-trait !bg-white p-7 transition-[border-color,box-shadow] duration-200 hover:border-marque-200 hover:shadow-[0_20px_40px_-24px_rgba(59,7,100,0.35)]"
                  >
                    <IconeModule slug={slugLie} />
                    <h3 className="mt-5 text-xl font-bold">{lie.nom}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed !text-texte">{lie.accroche}</p>
                    <span className="mt-5 text-[15px] font-semibold !text-marque">
                      {s.commun.decouvrir} <span aria-hidden="true" className="inline-block transition-transform duration-150 group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <CtaFinal />
    </PageSite>
  );
};

export default ModulePage;
