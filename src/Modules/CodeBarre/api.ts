// Appels serveur liés aux codes-barres.
import axios from "axios";
import { getUrlServer } from "../../configServer";
import { apiVente } from "../../Components/admin/livaision/venteRole";
import type { Conditioning } from "../../Components/admin/livaision/index/NewDeliveryadmin";

export interface ConditionnementScanne extends Conditioning {
  code_barre?: string | null;
}

export interface ProduitScanne {
  _id: string;
  nom: string;
  prix: number;
  quantite: number;
  unite: string;
  image_url?: string | null;
  code_barre?: string | null;
  conditionnements?: ConditionnementScanne[];
  conditionnement_scanne?: ConditionnementScanne | null;
}

const entetes = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

/**
 * Cherche l'article scanné en essayant chaque écriture du code.
 * Renvoie null si aucun produit ne porte ce code ; lève une erreur si le serveur ne répond pas.
 */
export const chercherParCode = async (variantes: string[]): Promise<{ produit: ProduitScanne; code: string } | null> => {
  for (const code of variantes) {
    try {
      const { data } = await axios.get<ProduitScanne>(apiVente().codeBarre(encodeURIComponent(code)), {
        headers: entetes(),
      });
      if (data?._id) return { produit: data, code };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) continue;
      throw err;
    }
  }
  return null;
};

export const associerCode = async (produitId: string, code: string, conditionnementId?: string | null) => {
  const { data } = await axios.put(
    `${getUrlServer()}/produits/${produitId}/code-barre`,
    { code_barre: code, conditionnement_id: conditionnementId || undefined },
    { headers: entetes() },
  );
  return data as { code_barre: string | null };
};

export const genererCode = async (): Promise<string> => {
  const { data } = await axios.get(`${getUrlServer()}/produits/generate-barcode`, { headers: entetes() });
  return data.code_barre;
};

export const genererCodesManquants = async (produitIds: string[]) => {
  const { data } = await axios.post(
    `${getUrlServer()}/produits/codes-barres/generer`,
    { produit_ids: produitIds },
    { headers: entetes() },
  );
  return data as { generes: { produit_id: string; nom: string; code_barre: string }[] };
};

/** Message d'erreur lisible d'une réponse serveur. */
export const messageErreur = (err: unknown, defaut: string) =>
  (axios.isAxiosError(err) && (err.response?.data?.error || err.response?.data?.message)) || defaut;
