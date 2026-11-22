// Logo officiel Lumistock (le mot entier, proportions d'origine), lien vers
// l'accueil du site public (projet séparé, adresse VITE_SITE_URL).
import React from "react";
import logo from "../../../assets/logo-lumistock.png";
import { versSite } from "../../../configServer";

const Logo: React.FC<{ hauteur?: number }> = ({ hauteur = 28 }) => (
  <a
    href={versSite("/")}
    aria-label="Lumistock, accueil"
    className="inline-flex shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marque"
  >
    <img src={logo} alt="Lumistock" style={{ height: hauteur, width: (hauteur * 1440) / 261 }} />
  </a>
);

export default Logo;
