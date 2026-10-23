// Page « Sécurité » : les protections réelles de Lumistock, en trois groupes
// (accès aux comptes, droits de chacun, intégrité des données).
import React from "react";
import {
  Archive,
  LockKeyhole,
  DatabaseZap,
  FileLock2,
  Fingerprint,
  History,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
  Store,
  Timer,
  UserX,
  Vault,
} from "lucide-react";
import { CtaFinal, PageSite } from "./components/Gabarit";
import { BoutonPrincipal, Note, Surligne, TitreSection } from "./components/Elements";
import { delai } from "./outils";
import { Ecran } from "./components/Ecrans";
import { useSite } from "./site";

const ICONES = [
  [Smartphone, Timer, Mail, KeyRound, LogOut, History],
  [ShieldCheck, Vault, UserX, Fingerprint],
  [Store, DatabaseZap, LockKeyhole, Archive, FileLock2],
];

const SecuritePage: React.FC = () => {
  const s = useSite();
  const t = s.securite;

  return (
    <PageSite titreDoc={t.titreDoc}>
      <section className="bg-white pb-10 pt-16 sm:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center" data-apparition>
            <span className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-marque text-white shadow-[0_16px_30px_-14px_rgba(59,7,100,0.7)]">
              <ShieldCheck size={38} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </div>
          <div className="mt-6">
            <TitreSection titre={t.titre} texte={t.texte} niveau="h1" />
          </div>
        </div>
        <div className="relative mx-auto mt-14 max-w-xl px-4" data-apparition style={delai(120)}>
          <div className="absolute -right-56 top-6 hidden xl:block">
            <Note sens="bas-gauche">{t.note}</Note>
          </div>
          <Ecran cle="droits" />
        </div>
      </section>

      {t.groupes.map((g, i) => (
        <section key={g.titre} className={`py-16 sm:py-24 ${i % 2 === 0 ? "bg-fond" : "bg-white"}`}>
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16 lg:px-8">
            <div data-apparition>
              <p className="font-main text-3xl font-bold text-marque-300">0{i + 1}</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">
                <Surligne style="trait">{g.titre}</Surligne>
              </h2>
              <p className="mt-4 text-[16.5px] leading-relaxed text-texte">{g.texte}</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {g.liste.map((e, j) => {
                const Icone = ICONES[i][j] ?? ShieldCheck;
                return (
                  <li key={e.titre} className="rounded-2xl border border-trait bg-white p-6" data-apparition style={delai((j % 2) * 60)}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-marque-50 text-marque">
                      <Icone size={20} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-[17px] font-bold">{e.titre}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-texte">{e.desc}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}

      <section className="bg-white py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 rounded-3xl border border-trait px-6 py-10 text-center sm:px-10 md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-bold">{t.questionTitre}</h2>
            <p className="mt-2 text-[16px] text-texte">{t.questionTexte}</p>
          </div>
          <BoutonPrincipal to="/contact?sujet=support">{s.nav.contact}</BoutonPrincipal>
        </div>
      </section>

      <CtaFinal />
    </PageSite>
  );
};

export default SecuritePage;
