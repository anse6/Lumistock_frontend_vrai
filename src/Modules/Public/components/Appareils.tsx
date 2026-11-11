// Lumistock sur ordinateur, tablette et téléphone : vraies captures de la
// démonstration (liste des ventes, caisse tactile, vente sur mobile), posées
// dans des cadres d'appareils dessinés en CSS.
import React from "react";
import ordinateur from "../../../assets/ecrans/appareil-ordinateur.webp";
import tablette from "../../../assets/ecrans/appareil-tablette.webp";
import mobileCaisse from "../../../assets/ecrans/appareil-mobile-caisse.webp";
import mobileAccueil from "../../../assets/ecrans/appareil-mobile-accueil.webp";

const CADRE = "bg-[#1d1230] shadow-[0_40px_80px_-30px_rgba(59,7,100,0.55),0_4px_10px_rgba(15,23,42,0.12)] ring-1 ring-black/10";

const Image: React.FC<{ src: string; l: number; h: number; className?: string }> = ({ src, l, h, className = "" }) => (
  <img src={src} alt="" width={l} height={h} loading="lazy" decoding="async" className={`block h-auto w-full bg-white ${className}`} />
);

const Ordinateur: React.FC = () => (
  <div>
    <div className={`rounded-t-[1rem] p-[1.4%] pb-[2%] sm:rounded-t-[1.4rem] ${CADRE}`}>
      <Image src={ordinateur} l={1600} h={1000} className="rounded-[0.3rem]" />
    </div>
    {/* socle du portable */}
    <div className="relative -mx-[5%] h-3 rounded-b-[1.2rem] bg-gradient-to-b from-[#e7e3ee] to-[#b9b1c8] sm:h-4">
      <div className="absolute left-1/2 top-0 h-1.5 w-[16%] -translate-x-1/2 rounded-b-lg bg-[#a69eb6]" />
    </div>
  </div>
);

const Tablette: React.FC = () => (
  <div className={`rounded-[1.4rem] p-[3.5%] sm:rounded-[1.8rem] ${CADRE}`}>
    <Image src={tablette} l={900} h={1295} className="rounded-[0.8rem] sm:rounded-[1rem]" />
  </div>
);

const Telephone: React.FC<{ src: string }> = ({ src }) => (
  <div className={`relative rounded-[1.6rem] p-[5%] sm:rounded-[2.1rem] ${CADRE}`}>
    <div className="absolute left-1/2 top-[2.6%] z-10 h-[2.2%] w-[28%] -translate-x-1/2 rounded-full bg-[#1d1230]" />
    <Image src={src} l={540} h={1169} className="rounded-[1.1rem] sm:rounded-[1.6rem]" />
  </div>
);

/**
 * Sur mobile : l'ordinateur en entier, puis la tablette et un téléphone côte à
 * côte. À partir de md : tablette et téléphones posés devant l'ordinateur.
 */
const Appareils: React.FC = () => (
  <div aria-hidden="true" className="relative mx-auto max-w-6xl md:pb-[9%]">
    <div className="mx-auto w-full px-[4%] md:w-[80%] md:px-0">
      <Ordinateur />
    </div>
    <div className="mt-8 flex items-end justify-center gap-4 sm:gap-6 md:mt-0">
      <div className="w-[56%] max-w-[340px] md:absolute md:bottom-0 md:start-0 md:w-[30%] md:max-w-none">
        <Tablette />
      </div>
      <div className="w-[30%] max-w-[190px] md:absolute md:bottom-[2%] md:end-[1%] md:w-[15.5%] md:max-w-none">
        <Telephone src={mobileCaisse} />
      </div>
      <div className="hidden md:absolute md:bottom-[-3%] md:end-[16%] md:block md:w-[14%]">
        <Telephone src={mobileAccueil} />
      </div>
    </div>
  </div>
);

export default Appareils;
