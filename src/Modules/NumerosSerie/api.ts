// Numéros de série : option du magasin, unités disponibles, listes et rapports.
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

export interface EvenementSerie {
  type: string;
  libelle: string;
  date: string;
  par_nom?: string;
  client_nom?: string;
  vente_id?: string;
  prix?: number;
  origine?: string;
  motif?: string;
}

export interface NumeroSerie {
  _id: string;
  numero_serie: string;
  produit_id: string;
  produit?: string;
  statut: "en_stock" | "vendu" | "avarie" | "retire";
  statut_libelle: string;
  cout_achat: number;
  prix_vente?: number | null;
  date_entree?: string;
  date_sortie?: string | null;
  origine?: string;
  vente_id?: string | null;
  historique: EvenementSerie[];
}

export interface SortieSerie {
  numero_serie: string;
  produit_id: string;
  produit?: string;
  type: string;
  libelle: string;
  date: string;
  vente_id?: string;
  client_nom?: string;
  par_nom?: string;
  prix?: number;
  revenu: boolean;
  revenu_libelle?: string;
  statut_actuel: string;
}

const EVENEMENT = "suiviSerieChange";

/** L'option « Numéros de série » est-elle activée pour le magasin ? */
export const useSuiviSerieActif = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const recharger = () => queryClient.invalidateQueries({ queryKey: ["parametres-stock"] });
    window.addEventListener(EVENEMENT, recharger);
    return () => window.removeEventListener(EVENEMENT, recharger);
  }, [queryClient]);
  const { data } = useQuery({
    queryKey: ["parametres-stock"],
    queryFn: async () => (await api.get("/magasin/parametres/stock")).data as { suivi_numeros_serie?: boolean },
    staleTime: 60_000,
  });
  return Boolean(data?.suivi_numeros_serie);
};

export const useNumerosDisponibles = (articleId?: string) =>
  useQuery({
    queryKey: ["numeros-disponibles", articleId],
    queryFn: async () =>
      (await api.get(`/numeros-serie/disponibles/${articleId}`)).data as { suivi_serie: boolean; numeros: string[] },
    enabled: Boolean(articleId),
  });

export const useNumeros = (filtres: { produit_id?: string; statut?: string; q?: string }, actif = true) =>
  useQuery({
    queryKey: ["numeros-serie", filtres],
    queryFn: async () => (await api.get("/numeros-serie", { params: filtres })).data as NumeroSerie[],
    enabled: actif,
  });

export const useSorties = (debut: string, fin: string) =>
  useQuery({
    queryKey: ["numeros-serie-sorties", debut, fin],
    queryFn: async () => (await api.get("/numeros-serie/sorties", { params: { debut, fin } })).data as SortieSerie[],
  });

export const genererNumeros = async (nombre: number) => {
  const numeros: string[] = [];
  while (numeros.length < nombre) {
    const lot = Math.min(500, nombre - numeros.length); // le serveur en donne 500 au plus par appel
    numeros.push(...((await api.get("/numeros-serie/generer", { params: { nombre: lot } })).data.numeros as string[]));
  }
  return numeros;
};

export const exporterSorties = async (debut: string, fin: string) => {
  const { data } = await api.get("/numeros-serie/sorties/export", { params: { debut, fin }, responseType: "blob" });
  const url = URL.createObjectURL(data);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `numeros_serie_sortis_${debut}_${fin}.xlsx`;
  lien.click();
  URL.revokeObjectURL(url);
};

/** Découpe un collage (une ligne, une virgule ou un point-virgule par numéro). */
export const decouper = (texte: string) =>
  texte.split(/[\n,;\t]+/).map((n) => n.trim()).filter(Boolean);

export const cle = (n: string) => n.trim().replace(/\s+/g, " ").toUpperCase();
