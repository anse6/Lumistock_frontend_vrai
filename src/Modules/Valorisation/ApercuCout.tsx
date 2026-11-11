// Aperçu, dans la fenêtre d'approvisionnement, du coût d'achat de l'article
// après la réception du lot saisi.
import { Spin } from "antd";
import { coutApresEntree, formatMontant, useValorisation } from "./api";

const EXPLICATION = {
  CMUP: "Coût moyen pondéré : le nouveau lot se mélange au stock existant.",
  FIFO: "FIFO : les ventes prendront d'abord le coût des lots les plus anciens.",
  LIFO: "LIFO : les ventes prendront d'abord le coût des lots les plus récents.",
};

interface Props {
  articleId: string;
  quantite?: number | null;
  prix?: number | null;
  devise?: string;
}

const ApercuCout = ({ articleId, quantite, prix, devise = "FCFA" }: Props) => {
  const { data: v, isLoading } = useValorisation(articleId);
  if (isLoading) return <Spin size="small" />;
  if (!v) return null;
  const q = Number(quantite) || 0;
  const p = Number(prix) || 0;
  const nouveau = q > 0 ? coutApresEntree(v, q, p) : null;

  return (
    <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-3 text-xs text-gray-700 mb-3">
      <div className="flex flex-wrap justify-between gap-2">
        <span>
          Coût d'achat actuel : <b>{formatMontant(v.cout_achat)} {devise}</b>
          <span className="text-gray-500"> · {v.quantite_valorisee} en stock · {v.methode}</span>
        </span>
        {nouveau !== null && (
          <span>
            Après ce lot : <b className="text-purple-900">{formatMontant(nouveau)} {devise}</b>
          </span>
        )}
      </div>
      <p className="mt-1 text-gray-500">{EXPLICATION[v.methode]}</p>
    </div>
  );
};

export default ApercuCout;
