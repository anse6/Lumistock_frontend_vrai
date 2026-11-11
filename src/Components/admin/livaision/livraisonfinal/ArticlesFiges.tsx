// Articles d'une vente affichés en lecture seule dans « Modifier la vente »
// (admin, manager, gérant) quand un carton a été entamé par un retour.
import React from "react";
import { Alert } from "antd";
import type { LigneFigee } from "./editionVente";

/** Articles d'une vente qui ne se modifient plus ici (carton entamé par un retour). */
const ArticlesFiges: React.FC<{ lignes: LigneFigee[] }> = ({ lignes }) => (
  <div className="space-y-3">
    <Alert
      type="info"
      showIcon
      message="Articles non modifiables"
      description="Un carton de cette vente a été entamé par un retour. Pour changer les articles, faites un nouveau retour ou une nouvelle vente. Le client, le paiement et les remises restent modifiables."
    />
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
      {lignes.map((l, i) => (
        <li key={i} className="flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{l.nom}</p>
            <p className="text-xs text-slate-500">{l.detail}</p>
          </div>
          <span className="shrink-0 text-sm font-bold text-purple-950">{Math.round(l.montant).toLocaleString("fr-FR")} CFA</span>
        </li>
      ))}
    </ul>
  </div>
);

export default ArticlesFiges;
