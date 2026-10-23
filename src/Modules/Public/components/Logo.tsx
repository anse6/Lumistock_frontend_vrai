// Logo officiel Lumistock (le mot entier, proportions d'origine), lien vers l'accueil.
import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/logo-lumistock.png";

const Logo: React.FC<{ hauteur?: number; vers?: string }> = ({ hauteur = 28, vers = "/" }) => (
  <Link
    to={vers}
    aria-label="Lumistock, accueil"
    className="inline-flex shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marque"
  >
    <img src={logo} alt="Lumistock" style={{ height: hauteur, width: (hauteur * 720) / 138 }} />
  </Link>
);

export default Logo;
