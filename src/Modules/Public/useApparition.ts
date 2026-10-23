// Fait apparaître en douceur les éléments marqués `data-apparition` quand ils
// entrent à l'écran. Rien ne bouge si l'utilisateur préfère réduire les
// animations (réglage du système). `cle` relance l'observation quand la page
// change de contenu sans être recréée (ex. /modules/stock → /modules/caisse).
import { useEffect } from "react";

export const useApparition = (cle?: string) => {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-apparition]:not([data-visible])"));
    const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduit || !("IntersectionObserver" in window)) {
      elements.forEach((e) => e.setAttribute("data-visible", ""));
      return;
    }
    const obs = new IntersectionObserver(
      (entrees) =>
        entrees.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute("data-visible", "");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    elements.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [cle]);
};
