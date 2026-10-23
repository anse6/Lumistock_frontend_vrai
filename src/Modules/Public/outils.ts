// Petits utilitaires partagés par les pages du site public.
import type React from "react";

/** Décalage de l'apparition au défilement (voir public.css). */
export const delai = (ms: number) => ({ "--delai": `${ms}ms` }) as React.CSSProperties;

/** Retire les astérisques de surlignage (titre de document…). */
export const sansMarques = (texte: string) => texte.replace(/\*/g, "");
