// Questions fréquentes : groupes titrés, chaque question dans un bloc gris
// clair arrondi ; le carré violet à droite affiche « + » (fermée) ou « − »
// (ouverte). Une seule question ouverte à la fois. À gauche : bouton vers la
// page Contact.
import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MessageSquareText, Minus, Phone, Plus } from "lucide-react";
import { CONTACT, useContenu } from "../contenu";

const Question: React.FC<{
  id: string;
  question: string;
  reponse: string;
  ouverte: boolean;
  basculer: () => void;
}> = ({ id, question, reponse, ouverte, basculer }) => (
  <div className="rounded-[10px] bg-[#F4F6F8]">
    <h4>
      <button
        type="button"
        id={`${id}-titre`}
        aria-expanded={ouverte}
        aria-controls={`${id}-reponse`}
        onClick={basculer}
        className="flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-4 rounded-[10px] px-5 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marque"
      >
        <span className="text-base font-semibold text-marque">{question}</span>
        <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-marque text-white">
          {ouverte ? <Minus size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
        </span>
      </button>
    </h4>
    <div id={`${id}-reponse`} role="region" aria-labelledby={`${id}-titre`} hidden={!ouverte}>
      <p className="px-5 pb-5 text-[15px] leading-relaxed text-[#333333]">{reponse}</p>
    </div>
  </div>
);

const Faq: React.FC = () => {
  const c = useContenu().faq;
  const prefixe = useId();
  const [ouverte, setOuverte] = useState<string | false>(false);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:gap-16">
      <div className="lg:sticky lg:top-24 lg:self-start" data-apparition>
        <p className="text-sm font-semibold text-marque">{c.surtitre}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{c.titre}</h2>
        <div className="mt-8 rounded-xl bg-marque p-6 text-white">
          <h3 className="text-lg font-semibold !text-white">{c.aideTitre}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-white/85">{c.aideTexte}</p>
          <Link
            to="/contact"
            className="group mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg !bg-white px-5 font-semibold !text-marque transition-colors duration-150 hover:!bg-marque-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <MessageSquareText size={18} aria-hidden="true" />
            {c.aideBouton}
            <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
          <ul className="mt-5 space-y-0.5 border-t border-white/15 pt-4 text-sm">
            <li>
              <a href={`tel:${CONTACT.telephoneLien}`} className="inline-flex min-h-10 items-center gap-2.5 !text-white/85 hover:!text-white hover:underline">
                <Phone size={15} aria-hidden="true" /> {CONTACT.telephone}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className="inline-flex min-h-10 items-center gap-2.5 break-all !text-white/85 hover:!text-white hover:underline">
                <Mail size={15} aria-hidden="true" className="shrink-0" /> {CONTACT.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-10">
        {c.groupes.map((g, gi) => (
          <div key={g.titre} data-apparition>
            <h3 className="text-2xl font-semibold">{g.titre}</h3>
            <span aria-hidden="true" className="mt-2 mb-5 block h-1 w-12 rounded-full bg-marque" />
            <div className="space-y-3">
              {g.questions.map((q, qi) => {
                const id = `${prefixe}-${gi}-${qi}`;
                return (
                  <Question
                    key={q.q}
                    id={id}
                    question={q.q}
                    reponse={q.r}
                    ouverte={ouverte === id}
                    basculer={() => setOuverte((o) => (o === id ? false : id))}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Faq;
