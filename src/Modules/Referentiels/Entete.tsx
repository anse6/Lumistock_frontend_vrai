// En-tête commun des pages Fournisseurs et Catégories (même style que Codes-barres).
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { PURPLE_950 } from "./theme";

const Entete: React.FC<{
  titre: string;
  description: string;
  icone: React.ReactNode;
  actions?: React.ReactNode;
  chiffres: { libelle: string; valeur: number }[];
}> = ({ titre, description, icone, actions, chiffres }) => (
  <>
    <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 text-sm font-medium sm:px-6">
      <Link
        to="/admin/dashboard/produits_approvisionnements"
        style={{ backgroundColor: PURPLE_950 }}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold !text-white shadow-sm hover:opacity-90"
      >
        <ArrowLeftOutlined className="text-xs" />
        Articles
      </Link>
      <span className="font-bold text-gray-300">›</span>
      <span className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs text-gray-500">{titre}</span>
    </div>

    <div className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm sm:mx-6">
      <div className="flex items-center gap-3">
        <span className="text-purple-950">{icone}</span>
        <div>
          <h1 className="text-lg font-bold text-purple-950">{titre}</h1>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {chiffres.map((c) => (
          <div key={c.libelle} className="rounded-xl border border-purple-100 bg-white px-3 py-1.5 text-center">
            <div className="text-base font-bold text-purple-950">{c.valeur}</div>
            <div className="text-[11px] text-slate-500">{c.libelle}</div>
          </div>
        ))}
        {actions}
      </div>
    </div>
  </>
);

export default Entete;
