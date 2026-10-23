// Pied de page du site public, sur fond purple-950 : tous les modules, les
// pages de découverte, le compte et le contact.
import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import logo from "../../../assets/logo-lumistock.png";
import LangueSwitch from "./LangueSwitch";
import { CONTACT } from "../contenu";
import { useSite } from "../site";

const Footer: React.FC = () => {
  const s = useSite();
  const lien = "inline-flex min-h-10 items-center text-[15px] !text-white/70 transition-colors duration-150 hover:!text-white";
  const titre = "text-xs font-bold uppercase tracking-[0.14em] !text-white";
  return (
    <footer className="bg-marque text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1.7fr_1fr_1.2fr] lg:px-8">
        <div className="max-w-sm">
          <Link to="/" aria-label="Lumistock" className="inline-flex rounded-lg !bg-white px-3 py-2">
            <img src={logo} alt="Lumistock" style={{ height: 24, width: (24 * 720) / 138 }} />
          </Link>
          <p className="mt-5 text-[15px] leading-relaxed text-white/70">{s.footer.accroche}</p>
          <p className="mt-4 text-sm font-semibold text-white/90">{s.footer.ohada}</p>
        </div>
        <nav aria-label={s.footer.modules}>
          <h2 className={titre}>{s.footer.modules}</h2>
          <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {s.modules.map((m) => (
              <li key={m.slug}><Link to={`/modules/${m.slug}`} className={lien}>{m.nom}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label={s.footer.decouvrir}>
          <h2 className={titre}>{s.footer.decouvrir}</h2>
          <ul className="mt-3">
            <li><Link to="/fonctionnalites" className={lien}>{s.nav.fonctionnalites}</Link></li>
            <li><Link to="/tarifs" className={lien}>{s.nav.tarifs}</Link></li>
            <li><Link to="/securite" className={lien}>{s.nav.securite}</Link></li>
            <li><a href="/#faq" className={lien}>{s.footer.faq}</a></li>
          </ul>
          <h2 className={`${titre} mt-6`}>{s.footer.compte}</h2>
          <ul className="mt-3">
            <li><Link to="/register-store" className={lien}>{s.nav.inscription}</Link></li>
            <li><Link to="/login" className={lien}>{s.nav.connexion}</Link></li>
            <li><Link to="/forgot-password" className={lien}>{s.footer.oubli}</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className={titre}>{s.footer.contact}</h2>
          <ul className="mt-3">
            <li><Link to="/contact" className={lien}>{s.nav.contact}</Link></li>
            <li>
              <a href={`tel:${CONTACT.telephoneLien}`} className={`gap-2.5 ${lien}`}>
                <Phone size={16} aria-hidden="true" /> {CONTACT.telephone}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className={`gap-2.5 break-all ${lien}`}>
                <Mail size={16} aria-hidden="true" className="shrink-0" /> {CONTACT.email}
              </a>
            </li>
          </ul>
          <div className="mt-5">
            <LangueSwitch />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-white/60 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Lumistock. {s.footer.droits}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
