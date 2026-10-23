// Barre de navigation du site public, sur le modèle d'Odoo : un menu
// « Modules » qui ouvre un grand panneau classé par usage (Vendre, Gérer le
// stock, Finances, Piloter), puis Fonctionnalités, Tarifs, Sécurité, Contact.
// Sur mobile, le menu s'ouvre en plein écran avec les modules en accordéon.
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import Logo from "./Logo";
import LangueSwitch from "./LangueSwitch";
import { IconeModule } from "./Elements";
import { trouverModule, useSite } from "../site";

const lienNav =
  "rounded-md px-3 py-2 text-[15px] font-medium !text-texte transition-colors duration-150 hover:!bg-fond hover:!text-encre aria-[current=page]:!text-marque focus-visible:outline-2 focus-visible:outline-marque";

const Navbar: React.FC = () => {
  const s = useSite();
  const { pathname, hash } = useLocation();
  const [defile, setDefile] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [panneau, setPanneau] = useState(false);
  const [modulesMobile, setModulesMobile] = useState(false);
  const zone = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 8);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);

  // Nouvelle page : on ferme les menus et on remonte en haut (sauf ancre).
  useEffect(() => {
    setOuvert(false);
    setPanneau(false);
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    // Arrivée depuis une autre page sur une ancre (ex. /fonctionnalites#stock).
    const id = requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView());
    return () => cancelAnimationFrame(id);
  }, [pathname, hash]);

  // Le panneau se ferme avec Échap ou par un clic ailleurs.
  useEffect(() => {
    if (!panneau) return;
    const echap = (e: KeyboardEvent) => e.key === "Escape" && setPanneau(false);
    const dehors = (e: MouseEvent) => zone.current && !zone.current.contains(e.target as Node) && setPanneau(false);
    document.addEventListener("keydown", echap);
    document.addEventListener("mousedown", dehors);
    return () => {
      document.removeEventListener("keydown", echap);
      document.removeEventListener("mousedown", dehors);
    };
  }, [panneau]);

  const liens = [
    { to: "/fonctionnalites", libelle: s.nav.fonctionnalites },
    { to: "/tarifs", libelle: s.nav.tarifs },
    { to: "/securite", libelle: s.nav.securite },
    { to: "/contact", libelle: s.nav.contact },
  ];
  const surModule = pathname.startsWith("/modules/");

  return (
    <header className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-colors duration-200 ${defile || ouvert || panneau ? "border-trait" : "border-transparent"}`}>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-md focus:!bg-marque focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:!text-white">
        {s.nav.contenu}
      </a>
      <nav className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8" aria-label={s.nav.principale}>
        <Logo />
        <ul className="hidden items-center gap-0.5 lg:flex">
          <li ref={zone}>
            <button
              type="button"
              aria-expanded={panneau}
              aria-controls="panneau-modules"
              onClick={() => setPanneau((p) => !p)}
              className={`flex cursor-pointer items-center gap-1 ${lienNav} ${surModule ? "!text-marque" : ""}`}
            >
              {s.nav.modules}
              <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-150 ${panneau ? "rotate-180" : ""}`} />
            </button>
            {panneau && (
              <div
                id="panneau-modules"
                className="absolute left-1/2 top-[calc(100%+8px)] w-[min(900px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-trait bg-white p-6 shadow-[0_30px_60px_-24px_rgba(15,23,42,0.35)]"
              >
                <div className="grid grid-cols-4 gap-6">
                  {s.nav.groupes.map((g) => (
                    <div key={g.titre}>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-attenue">{g.titre}</p>
                      <ul className="mt-3 space-y-1">
                        {g.modules.map((slug) => {
                          const m = trouverModule(s, slug)!;
                          return (
                            <li key={slug}>
                              <Link
                                to={`/modules/${slug}`}
                                aria-current={pathname === `/modules/${slug}` ? "page" : undefined}
                                className="-mx-2 flex items-start gap-3 rounded-xl p-2 transition-colors duration-150 hover:!bg-fond aria-[current=page]:!bg-marque-50"
                              >
                                <IconeModule slug={slug} taille="s" />
                                <span>
                                  <span className="block text-[14.5px] font-semibold !text-encre">{m.nom}</span>
                                  <span className="block text-[13px] leading-snug !text-attenue">{m.accroche}</span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-trait pt-4">
                  <Link to="/fonctionnalites" className="text-[14.5px] font-semibold !text-marque hover:underline">{s.nav.tousModules} →</Link>
                  <Link to="/register-store" className="rounded-lg !bg-marque px-4 py-2 text-sm font-semibold !text-white hover:!bg-marque-fonce">{s.nav.inscription}</Link>
                </div>
              </div>
            )}
          </li>
          {liens.map((l) => (
            <li key={l.to}>
              <Link to={l.to} aria-current={pathname === l.to ? "page" : undefined} className={lienNav}>
                {l.libelle}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 lg:flex">
          <LangueSwitch />
          <Link to="/login" className="rounded-lg px-3.5 py-2 text-[15px] font-semibold !text-encre transition-colors duration-150 hover:!bg-fond">
            {s.nav.connexion}
          </Link>
          <Link to="/register-store" className="rounded-lg !bg-marque px-4 py-2 text-[15px] font-semibold !text-white transition-colors duration-150 hover:!bg-marque-fonce focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marque">
            {s.nav.inscription}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          aria-controls="menu-mobile"
          aria-label={ouvert ? s.nav.fermer : s.nav.menu}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-encre hover:bg-fond lg:hidden"
        >
          {ouvert ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </nav>

      {ouvert && (
        <div id="menu-mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-trait bg-white px-4 pb-6 pt-2 lg:hidden">
          <button
            type="button"
            onClick={() => setModulesMobile((m) => !m)}
            aria-expanded={modulesMobile}
            className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-md px-3 text-base font-semibold text-encre hover:bg-fond"
          >
            {s.nav.modules}
            <ChevronDown size={18} aria-hidden="true" className={`transition-transform ${modulesMobile ? "rotate-180" : ""}`} />
          </button>
          {modulesMobile && (
            <div className="mb-2 space-y-4 px-3 pb-2 pt-1">
              {s.nav.groupes.map((g) => (
                <div key={g.titre}>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-attenue">{g.titre}</p>
                  <ul className="mt-1.5">
                    {g.modules.map((slug) => (
                      <li key={slug}>
                        <Link to={`/modules/${slug}`} className="flex min-h-12 items-center gap-3 rounded-lg px-1 text-[15px] font-medium !text-encre hover:!bg-fond">
                          <IconeModule slug={slug} taille="s" />
                          {trouverModule(s, slug)!.nom}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <ul>
            {liens.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="flex min-h-12 items-center rounded-md px-3 text-base font-semibold !text-encre hover:!bg-fond">
                  {l.libelle}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2 border-t border-trait pt-4">
            <Link to="/register-store" className="flex min-h-12 items-center justify-center rounded-lg !bg-marque text-base font-semibold !text-white">
              {s.nav.inscription}
            </Link>
            <Link to="/login" className="flex min-h-12 items-center justify-center rounded-lg border border-trait text-base font-semibold !text-encre">
              {s.nav.connexion}
            </Link>
            <div className="flex justify-center pt-2">
              <LangueSwitch />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
