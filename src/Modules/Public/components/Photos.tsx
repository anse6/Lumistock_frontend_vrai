// Photos du site public (Unsplash, licence libre, sans attribution requise),
// une par module + celle de l'accueil. Fichiers dans src/assets/site/.
import React from "react";
import type { SlugModule } from "../site";
import accueil from "../../../assets/site/accueil.webp";
import ventes from "../../../assets/site/ventes.webp";
import caisse from "../../../assets/site/caisse.webp";
import clients from "../../../assets/site/clients.webp";
import messagerie from "../../../assets/site/messagerie.webp";
import stock from "../../../assets/site/stock.webp";
import achats from "../../../assets/site/achats.webp";
import comptabilite from "../../../assets/site/comptabilite.webp";
import pilotage from "../../../assets/site/pilotage.webp";
import equipe from "../../../assets/site/equipe.webp";

export const PHOTO_ACCUEIL = accueil;

/** `position` : point de l'image gardé visible quand elle est recadrée. */
const PHOTOS: Record<SlugModule, { src: string; position: string }> = {
  ventes: { src: ventes, position: "50% 30%" },
  caisse: { src: caisse, position: "50% 50%" },
  clients: { src: clients, position: "50% 40%" },
  messagerie: { src: messagerie, position: "50% 25%" },
  stock: { src: stock, position: "50% 50%" },
  achats: { src: achats, position: "50% 60%" },
  comptabilite: { src: comptabilite, position: "50% 50%" },
  pilotage: { src: pilotage, position: "60% 50%" },
  equipe: { src: equipe, position: "50% 45%" },
};

export const PhotoModule: React.FC<{ slug: SlugModule; className?: string; prioritaire?: boolean }> = ({
  slug,
  className = "",
  prioritaire = false,
}) => {
  const p = PHOTOS[slug];
  return (
    <img
      src={p.src}
      alt=""
      aria-hidden="true"
      loading={prioritaire ? "eager" : "lazy"}
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
      style={{ objectPosition: p.position }}
    />
  );
};
