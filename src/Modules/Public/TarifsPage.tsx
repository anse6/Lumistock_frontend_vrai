// Page « Tarifs ». Lumistock n'affiche pas de prix public : la licence dépend
// du nombre de comptes (managers, gérants, caissiers), tous les modules sont
// inclus. La page l'explique et mène au formulaire de contact (sujet « tarifs »).
import React, { useState } from "react";
import { Check, Minus, Plus, Store, Truck, UserCog, UsersRound } from "lucide-react";
import { CtaFinal, PageSite } from "./components/Gabarit";
import { BoutonPrincipal, BoutonSecondaire, IconeModule, Note, TexteSurligne, TitreSection } from "./components/Elements";
import { delai } from "./outils";
import { useSite } from "./site";

const ICONES_VARIABLES = [UserCog, Truck, Store];

const TarifsPage: React.FC = () => {
  const s = useSite();
  const t = s.tarifs;
  const [ouverte, setOuverte] = useState<number | null>(0);

  return (
    <PageSite titreDoc={t.titreDoc}>
      <section className="bg-white pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitreSection titre={t.titre} texte={t.texte} niveau="h1" />

          <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-[1.25fr_1fr]">
            {/* l'offre : tous les modules */}
            <div className="relative rounded-3xl border-2 border-marque bg-white p-7 shadow-[0_30px_60px_-30px_rgba(59,7,100,0.45)] sm:p-10" data-apparition>
              <span className="absolute -top-3.5 left-8 rounded-full bg-marque px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">Lumistock</span>
              <h2 className="text-2xl font-bold sm:text-3xl">{t.carteTitre}</h2>
              <p className="mt-2 text-[16px] text-texte">{t.carteTexte}</p>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.12em] text-attenue">{t.inclus}</p>
              <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {s.modules.map((m) => (
                  <li key={m.slug} className="flex items-center gap-3 text-[15px] font-semibold text-encre">
                    <IconeModule slug={m.slug} taille="s" />
                    {m.nom}
                  </li>
                ))}
              </ul>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <BoutonPrincipal to="/contact?sujet=tarifs" grand>{t.demander}</BoutonPrincipal>
                <BoutonSecondaire to="/register-store" grand>{s.commun.commencer}</BoutonSecondaire>
              </div>
            </div>

            {/* ce qui fait varier le prix */}
            <div className="relative rounded-3xl bg-fond p-7 sm:p-10" data-apparition style={delai(100)}>
              <h2 className="text-2xl font-bold">{t.variableTitre}</h2>
              <ul className="mt-6 space-y-5">
                {t.variable.map((v, i) => {
                  const Icone = ICONES_VARIABLES[i];
                  return (
                    <li key={v.titre} className="flex gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-marque ring-1 ring-trait">
                        <Icone size={20} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-[16px] font-bold text-encre">{v.titre}</span>
                        <span className="block text-[15px] leading-relaxed text-texte">{v.desc}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-7 flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-[15px] font-semibold text-encre ring-1 ring-trait">
                <UsersRound size={18} aria-hidden="true" className="text-stock" />
                {t.variableNote}
              </p>
              <div className="absolute -bottom-14 right-6 hidden lg:block">
                <Note sens="haut-gauche">{s.commun.garanties[1]}</Note>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* étapes */}
      <section className="border-y border-trait bg-fond py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TitreSection titre={t.etapesTitre} />
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {t.etapes.map((e, i) => (
              <li key={e.titre} className="rounded-2xl border border-trait bg-white p-7" data-apparition style={delai(i * 80)}>
                <span className="font-main text-5xl font-bold leading-none text-marque-300">{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold">{e.titre}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-texte">{e.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* questions */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-[2.6rem]" data-apparition>
            <TexteSurligne texte={t.faqTitre} />
          </h2>
          <ul className="mt-12 divide-y divide-trait border-y border-trait">
            {t.faq.map((q, i) => {
              const ouvert = ouverte === i;
              return (
                <li key={q.q}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={ouvert}
                      aria-controls={`tarif-${i}`}
                      onClick={() => setOuverte(ouvert ? null : i)}
                      className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-[17px] font-semibold text-encre focus-visible:outline-2 focus-visible:outline-marque"
                    >
                      {q.q}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-marque-50 text-marque" aria-hidden="true">
                        {ouvert ? <Minus size={16} /> : <Plus size={16} />}
                      </span>
                    </button>
                  </h3>
                  <div id={`tarif-${i}`} hidden={!ouvert}>
                    <p className="flex gap-3 pb-5 text-[15.5px] leading-relaxed text-texte">
                      <Check size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-stock" />
                      {q.r}
                    </p>
                  </div>
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

export default TarifsPage;
