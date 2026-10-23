// TVA du pays du magasin (miroir de backend/services/tva_service.py).
import { useEffect, useState } from "react";
import { getUrlServer } from "../../../../../configServer";

export interface TvaMagasin {
  /** Pays du magasin tel qu'enregistré (ex. « Cameroun »). */
  pays: string | null;
  /** Code ISO du pays (ex. « CM »). */
  code: string | null;
  /** Taux standard en % ; null si le pays est inconnu. */
  taux: number | null;
  /** Décimales des montants : 0 pour le franc CFA (pas de centimes). */
  decimales?: number;
}

let cache: Promise<TvaMagasin> | null = null;

const chargerTva = (): Promise<TvaMagasin> => {
  if (!cache) {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    cache = fetch(`${getUrlServer()}/livraisons/tva`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .catch((e) => {
        cache = null; // nouvel essai au prochain affichage
        throw e;
      });
  }
  return cache;
};

/** Taux de TVA du magasin courant (chargé une fois). */
export const useTvaMagasin = () => {
  const [tva, setTva] = useState<TvaMagasin | null>(null);
  const [erreur, setErreur] = useState(false);
  useEffect(() => {
    let actif = true;
    chargerTva()
      .then((t) => actif && setTva(t))
      .catch(() => actif && setErreur(true));
    return () => {
      actif = false;
    };
  }, []);
  return { tva, chargement: !tva && !erreur, erreur };
};

export const formatTaux = (taux: number) => `${taux.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Arrondi commercial (0,5 vers le haut) à l'unité de la monnaie, comme le serveur. */
export const arrondirMontant = (montant: number, decimales = 0) => {
  const facteur = 10 ** decimales;
  return Math.round(((Number(montant) || 0) + Number.EPSILON) * facteur) / facteur;
};

export const calculerTva = (montantHt: number, taux: number | null | undefined, decimales = 0) =>
  !taux || montantHt <= 0 ? 0 : arrondirMontant((montantHt * taux) / 100, decimales);
