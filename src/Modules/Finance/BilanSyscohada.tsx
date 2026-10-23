// Bilan au format SYSCOHADA : actif immobilisé (brut, amortissements, net),
// actif circulant, trésorerie ; capitaux propres, dettes financières, passif
// circulant (fournisseurs, personnel, organismes sociaux, État) et trésorerie
// passive. Les clôtures anciennes (liste simple) restent lisibles.
import React from "react";
import { Alert, Tooltip } from "antd";
import { CheckCircle2, Info, Landmark, Scale, ShieldAlert, Wallet } from "lucide-react";
import { argent, CarteChiffre, fmt, PURPLE_950 } from "../Reports/ReportUi";
import type { Bilan, PosteBilan } from "../Charges/types";

export const ORDRE_ACTIF = [
  { cle: "immobilise", libelle: "Actif immobilisé" },
  { cle: "circulant", libelle: "Actif circulant" },
  { cle: "tresorerie", libelle: "Trésorerie – actif" },
];
export const ORDRE_PASSIF = [
  { cle: "capitaux", libelle: "Capitaux propres" },
  { cle: "financieres", libelle: "Dettes financières" },
  { cle: "circulant", libelle: "Passif circulant" },
  { cle: "tresorerie", libelle: "Trésorerie – passif" },
];

const estDetaille = (bilan: Bilan) => bilan.actif.some((p) => p.rubrique);

/** Lignes à plat (rubrique, postes, sous-total) pour le PDF. */
export const lignesPdfBilan = (postes: PosteBilan[], ordre: { cle: string; libelle: string }[]) => {
  if (!postes.some((p) => p.rubrique)) return postes.map((p) => ({ ...p, niveau: 1 }));
  return ordre.flatMap(({ cle, libelle }) => {
    const groupe = postes.filter((p) => p.rubrique === cle);
    if (!groupe.length) return [];
    return [
      ...groupe.map((p) => ({ ...p, niveau: 1 })),
      { libelle: `Total ${libelle.toLowerCase()}`, montant: groupe.reduce((s, p) => s + p.montant, 0), niveau: 0 },
    ];
  });
};

const Colonne: React.FC<{
  titre: string;
  sousTitre: string;
  postes: PosteBilan[];
  ordre: { cle: string; libelle: string }[];
  total: number;
  devise: string;
  avecBrut?: boolean;
}> = ({ titre, sousTitre, postes, ordre, total, devise, avecBrut }) => {
  const groupes = postes.some((p) => p.rubrique)
    ? ordre.map((o) => ({ ...o, postes: postes.filter((p) => p.rubrique === o.cle) })).filter((g) => g.postes.length)
    : [{ cle: "tout", libelle: "", postes }];
  return (
    <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
      <div className="px-4 py-3 text-white" style={{ backgroundColor: PURPLE_950 }}>
        <div className="text-sm font-bold">{titre}</div>
        <div className="text-[11px] text-purple-200">{sousTitre}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          {avecBrut && (
            <thead>
              <tr className="bg-purple-50 text-[11px] uppercase tracking-wider text-purple-950">
                <th className="px-4 py-2 text-left font-bold">Poste</th>
                <th className="px-2 py-2 text-right font-bold">Brut</th>
                <th className="px-2 py-2 text-right font-bold">Amort.</th>
                <th className="px-4 py-2 text-right font-bold">Net</th>
              </tr>
            </thead>
          )}
          <tbody>
            {groupes.map((g) => (
              <React.Fragment key={g.cle}>
                {g.libelle && (
                  <tr className="bg-slate-50">
                    <td colSpan={avecBrut ? 4 : 2} className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {g.libelle}
                    </td>
                  </tr>
                )}
                {g.postes.map((p) => (
                  <tr key={`${p.compte}-${p.libelle}`} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <span className="flex items-start gap-2">
                        {p.compte && <span className="mt-0.5 w-10 shrink-0 font-mono text-[11px] font-bold text-purple-900">{p.compte}</span>}
                        <span className={p.calcule ? "italic text-slate-500" : "text-slate-700"}>
                          {p.libelle}
                          {p.calcule && (
                            <Tooltip title="Argent et stock de départ, apports anciens… non saisis dans l'application. Indiquez le solde de départ (onglet Trésorerie) et le capital (Impôts et taxes) pour le réduire.">
                              <Info size={12} className="ml-1 inline text-slate-400" />
                            </Tooltip>
                          )}
                        </span>
                      </span>
                    </td>
                    {avecBrut && (
                      <>
                        <td className="px-2 py-2 text-right text-slate-500">{p.brut !== undefined ? fmt(p.brut) : ""}</td>
                        <td className="px-2 py-2 text-right text-slate-500">{p.amortissements !== undefined ? fmt(p.amortissements) : ""}</td>
                      </>
                    )}
                    <td className={`px-4 py-2 text-right font-semibold ${p.montant < 0 ? "text-red-600" : p.montant ? "text-purple-950" : "text-slate-300"}`}>
                      {fmt(p.montant)}
                    </td>
                  </tr>
                ))}
                {g.libelle && (
                  <tr className="border-t border-purple-100 bg-purple-50/50">
                    <td colSpan={avecBrut ? 3 : 1} className="px-4 py-1.5 text-xs font-bold text-purple-950">
                      Total {g.libelle.toLowerCase()}
                    </td>
                    <td className="px-4 py-1.5 text-right text-xs font-bold text-purple-950">{fmt(g.postes.reduce((s, p) => s + p.montant, 0))}</td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between px-4 py-3 text-sm font-bold text-white" style={{ backgroundColor: PURPLE_950 }}>
        <span>Total {titre.split(" ")[0].toLowerCase()}</span>
        <span>{argent(total, devise)}</span>
      </div>
    </div>
  );
};

/** Tableau du bilan (actif et passif côte à côte). */
export const TableauBilan: React.FC<{ bilan: Bilan; devise: string }> = ({ bilan, devise }) => (
  <div className="grid gap-4 xl:grid-cols-2">
    <Colonne
      titre="Actif"
      sousTitre="Ce que possède l'entreprise"
      postes={bilan.actif}
      ordre={ORDRE_ACTIF}
      total={bilan.total_actif ?? bilan.total}
      devise={devise}
      avecBrut={estDetaille(bilan)}
    />
    <Colonne
      titre="Passif"
      sousTitre="Comment c'est financé : capitaux propres et dettes"
      postes={bilan.passif}
      ordre={ORDRE_PASSIF}
      total={bilan.total_passif ?? bilan.total}
      devise={devise}
    />
  </div>
);

const BilanSyscohada: React.FC<{ bilan: Bilan; devise: string; date: string }> = ({ bilan, devise, date }) => {
  const equilibre = Math.abs((bilan.total_actif ?? bilan.total) - (bilan.total_passif ?? bilan.total)) < 1;
  const ratios = bilan.ratios;
  const ouverture = bilan.ouverture ?? 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CarteChiffre principale libelle="Total du bilan" valeur={argent(bilan.total, devise)} detail={`Au ${date}`} icone={<Landmark size={16} />} />
        <CarteChiffre
          ton={(ratios?.fonds_roulement ?? 0) >= 0 ? "vert" : "rouge"}
          libelle="Fonds de roulement"
          valeur={argent(ratios?.fonds_roulement ?? 0, devise)}
          detail="Ressources stables − immobilisations"
          icone={<Scale size={16} />}
        />
        <CarteChiffre
          ton={ratios?.liquidite === null || ratios?.liquidite === undefined || ratios.liquidite >= 1 ? "vert" : "orange"}
          libelle="Liquidité générale"
          valeur={ratios?.liquidite === null || ratios?.liquidite === undefined ? "Aucune dette" : `${ratios.liquidite.toLocaleString("fr-FR")} ×`}
          detail="Actif circulant et trésorerie ÷ dettes (≥ 1 : sain)"
          icone={<Wallet size={16} />}
        />
        <CarteChiffre
          ton={equilibre ? "vert" : "rouge"}
          libelle="Équilibre"
          valeur={equilibre ? "Actif = Passif" : "Déséquilibré"}
          detail={ratios?.endettement !== null && ratios?.endettement !== undefined ? `Endettement : ${ratios.endettement} % des capitaux propres` : "Aucun emprunt"}
          icone={equilibre ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
        />
      </div>
      {estDetaille(bilan) && Math.abs(ouverture) >= 1 && (
        <Alert
          type="info"
          showIcon
          message={`Situation nette d'ouverture : ${argent(ouverture, devise)}`}
          description="Ce montant représente ce qui existait avant les opérations saisies (argent, stock, apports anciens). Pour un bilan précis, indiquez le solde de départ par compte (onglet Trésorerie), le capital social (onglet Impôts et taxes) et enregistrez apports, retraits et emprunts (onglet Capital et emprunts)."
        />
      )}
      <TableauBilan bilan={bilan} devise={devise} />
    </div>
  );
};

export default BilanSyscohada;
