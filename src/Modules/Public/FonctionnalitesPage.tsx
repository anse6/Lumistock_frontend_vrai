// Page « Fonctionnalités » : la liste complète, module par module, avec une
// barre de sommaire collante, comme la page Fonctionnalités d'Odoo Inventaire.
import React from "react";
import { BoutonsAction, CtaFinal, PageSite } from "./components/Gabarit";
import { IconeModule, LienFleche, Surligne, TitreSection } from "./components/Elements";
import { delai } from "./outils";
import { useSite } from "./site";

const FonctionnalitesPage: React.FC = () => {
  const s = useSite();
  const f = s.fonctionnalites;
  const total = s.modules.reduce((n, m) => n + m.fonctions.length, 0);

  return (
    <PageSite titreDoc={f.titreDoc}>
      <section className="bg-white pb-14 pt-16 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <TitreSection titre={f.titre} texte={f.texte} niveau="h1" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-attenue" data-apparition>
            {s.modules.length} {s.nav.modules.toLowerCase()} · {total} {s.nav.fonctionnalites.toLowerCase()}
          </p>
          <div className="mt-10" data-apparition>
            <BoutonsAction />
          </div>
        </div>
      </section>

      {/* sommaire */}
      <nav aria-label={f.sommaire} className="sticky top-16 z-40 border-y border-trait bg-white/95 backdrop-blur">
        <ul className="mx-auto flex max-w-7xl justify-center-safe gap-1 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:px-6 lg:px-8">
          {s.modules.map((m) => (
            <li key={m.slug} className="shrink-0">
              <a href={`#${m.slug}`} className="flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold !text-texte transition-colors hover:!bg-marque-50 hover:!text-marque">
                {m.nom}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="bg-white">
        {s.modules.map((m, i) => (
          <section key={m.slug} id={m.slug} className={`py-16 sm:py-20 ${i % 2 ? "bg-white" : "bg-fond"}`} aria-labelledby={`titre-${m.slug}`}>
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-16 lg:px-8">
              <div className="lg:sticky lg:top-40 lg:self-start" data-apparition>
                <IconeModule slug={m.slug} />
                <h2 id={`titre-${m.slug}`} className="mt-5 text-3xl font-bold tracking-tight">
                  <Surligne style="trait">{m.nom}</Surligne>
                </h2>
                <p className="mt-4 text-[16px] leading-relaxed text-texte">{m.accroche}</p>
                <div className="mt-5">
                  <LienFleche to={`/modules/${m.slug}`}>{f.voirModule}</LienFleche>
                </div>
              </div>
              <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {m.fonctions.map((fn, j) => (
                  <li key={fn.titre} data-apparition style={delai((j % 2) * 50)}>
                    <h3 className="text-[17px] font-bold">{fn.titre}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-texte">{fn.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <CtaFinal />
    </PageSite>
  );
};

export default FonctionnalitesPage;
