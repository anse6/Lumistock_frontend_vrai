// Onglet d'une page relié à l'adresse (?onglet=journal) : le menu latéral peut
// ouvrir directement un onglet, et l'onglet ouvert reste visible dans l'URL.
// Sans ?onglet, on reprend le dernier onglet utilisé (mémorisé dans le navigateur).
import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const lire = (cle?: string) => {
  if (!cle) return null;
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
};
const ecrire = (cle: string | undefined, valeur: string) => {
  if (!cle) return;
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    /* préférence non conservée (navigation privée) */
  }
};

/**
 * @param onglets  clés valides (une clé inconnue dans l'URL est ignorée)
 * @param defaut   onglet par défaut
 * @param cleMemoire clé localStorage du dernier onglet utilisé (facultatif)
 */
export const useOngletUrl = (onglets: readonly string[], defaut: string, cleMemoire?: string) => {
  const [params, setParams] = useSearchParams();
  const valide = (v: string | null): v is string => !!v && onglets.includes(v);
  const depuisUrl = params.get("onglet");
  const memoire = lire(cleMemoire);
  const onglet = valide(depuisUrl) ? depuisUrl : valide(memoire) ? memoire : defaut;

  // L'adresse indique toujours l'onglet affiché (le menu latéral s'en sert).
  useEffect(() => {
    if (depuisUrl !== onglet) {
      setParams(
        (p) => {
          p.set("onglet", onglet);
          return p;
        },
        { replace: true },
      );
    }
  }, [depuisUrl, onglet, setParams]);

  useEffect(() => {
    if (valide(depuisUrl)) ecrire(cleMemoire, depuisUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depuisUrl, cleMemoire]);

  const changer = useCallback(
    (cle: string) => {
      ecrire(cleMemoire, cle);
      setParams(
        (p) => {
          p.set("onglet", cle);
          return p;
        },
        { replace: true },
      );
    },
    [cleMemoire, setParams],
  );

  return [onglet, changer] as const;
};

export default useOngletUrl;
