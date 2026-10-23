// Encaissements : l'argent reçu (paiements à la vente et complémentaires) et
// rendu (remboursements, annulations), par mode de paiement.
import React, { useState } from "react";
import { Empty, Select, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import {
  ActionsRapport,
  argent,
  BarreFiltres,
  CarteChiffre,
  ChoixPeriode,
  dateHeure,
  EnteteRapport,
  fmt,
  libellePeriode,
  paramsPeriode,
  periodeDe,
  Section,
  useRapport,
} from "./ReportUi";
import type { Periode } from "./ReportUi";
import { lireRapport, MODES_PAIEMENT } from "./reportsApi";
import type { Operation, RapportEncaissements } from "./reportsApi";
import { exporterCsv, genererRapportPdf, nomFichier, ROUGE, VERT } from "./reportPdf";

const ICONES: Record<string, React.ReactNode> = {
  cash: <Banknote size={16} />,
  om: <Smartphone size={16} />,
  momo: <Smartphone size={16} />,
  bancaire: <Landmark size={16} />,
  credit_client: <CreditCard size={16} />,
};

const CashReport: React.FC<{ devise: string }> = ({ devise }) => {
  const [preset, setPreset] = useState("mois");
  const [periode, setPeriode] = useState<Periode>(periodeDe("mois"));
  const [mode, setMode] = useState<string>();
  const [sens, setSens] = useState<"entree" | "sortie">();

  const params = { ...paramsPeriode(periode), mode, sens };
  const { donnees, chargement } = useRapport<RapportEncaissements>(
    (signal) => lireRapport("encaissements", params, signal),
    JSON.stringify(params),
  );
  const t = donnees?.totaux;
  const operations = donnees?.operations || [];

  const reset = () => {
    setPreset("mois");
    setPeriode(periodeDe("mois"));
    setMode(undefined);
    setSens(undefined);
  };
  const filtres = [
    mode && `mode ${MODES_PAIEMENT.find((m) => m.value === mode)?.label}`,
    sens && (sens === "entree" ? "entrées seulement" : "sorties seulement"),
  ].filter(Boolean).join(", ");

  const pdf = (sortie: "download" | "print") =>
    genererRapportPdf(
      {
        fichier: `${nomFichier("Encaissements", params.debut, params.fin)}.pdf`,
        kicker: "RAPPORT DE TRÉSORERIE",
        titre: "ENCAISSEMENTS",
        pastille: libellePeriode(periode),
        filtres,
        signatures: true,
        chiffres: [
          ["Reçu des clients", argent(t?.entrees, devise)],
          ["Rendu aux clients", argent(t?.sorties, devise)],
          ["Solde net", argent(t?.net, devise)],
          ["Opérations", fmt(t?.operations)],
        ],
        sections: [
          {
            titre: "Récapitulatif par mode de paiement",
            lignes: donnees?.par_mode || [],
            colonnes: [
              { titre: "Mode", largeur: 34, valeur: (m: RapportEncaissements["par_mode"][number]) => m.libelle, gras: true },
              { titre: "Opérations", largeur: 14, align: "right", valeur: (m: RapportEncaissements["par_mode"][number]) => fmt(m.operations) },
              { titre: `Reçu (${devise})`, largeur: 18, align: "right", valeur: (m: RapportEncaissements["par_mode"][number]) => fmt(m.entrees), couleur: () => VERT },
              { titre: "Rendu", largeur: 17, align: "right", valeur: (m: RapportEncaissements["par_mode"][number]) => fmt(m.sorties), couleur: () => ROUGE },
              { titre: "Net", largeur: 17, align: "right", valeur: (m: RapportEncaissements["par_mode"][number]) => fmt(m.net), gras: true },
            ],
            total: ["TOTAL", fmt(t?.operations), fmt(t?.entrees), fmt((t?.sorties || 0) + (t?.credits_clients || 0)), fmt(t?.net)],
          },
          {
            titre: "Détail des opérations",
            note: `${fmt(operations.length)} opération(s)`,
            lignes: operations,
            colonnes: [
              { titre: "Date", largeur: 15, valeur: (o: Operation) => dateHeure(o.date) },
              { titre: "Facture", largeur: 25, valeur: (o: Operation) => o.facture, sous: (o: Operation) => o.client, gras: true },
              { titre: "Nature", largeur: 25, valeur: (o: Operation) => o.nature, sous: (o: Operation) => [o.detail, o.par && `par ${o.par}`].filter(Boolean).join(" · ") },
              { titre: "Mode", largeur: 17, valeur: (o: Operation) => o.mode_libelle },
              {
                titre: `Montant (${devise})`,
                largeur: 18,
                align: "right",
                valeur: (o: Operation) => `${o.sens === "entree" ? "+" : "-"} ${fmt(o.montant)}`,
                couleur: (o: Operation) => (o.sens === "entree" ? VERT : ROUGE),
                gras: true,
              },
            ],
          },
        ],
      },
      sortie,
    );

  const excel = () =>
    exporterCsv(
      `${nomFichier("Encaissements", params.debut, params.fin)}.csv`,
      ["Date", "Facture", "Client", "Nature", "Mode", "Sens", "Montant", "Détail", "Par"],
      operations.map((o) => [
        dateHeure(o.date), o.facture, o.client, o.nature, o.mode_libelle, o.sens === "entree" ? "Entrée" : "Sortie",
        o.sens === "entree" ? o.montant : -o.montant, o.detail, o.par || "",
      ]),
    );

  const colonnes: ColumnsType<Operation> = [
    { title: "Date", dataIndex: "date", render: dateHeure, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: "descend" },
    {
      title: "Vente",
      key: "facture",
      render: (_, o) => (
        <div>
          <div className="font-bold text-purple-950">{o.facture}</div>
          <div className="text-xs text-slate-500">{o.client}</div>
        </div>
      ),
    },
    {
      title: "Nature",
      key: "nature",
      render: (_, o) => (
        <div>
          <div className="font-semibold text-slate-700">{o.nature}</div>
          {(o.detail || o.par) && (
            <div className="text-xs text-slate-500">{[o.detail, o.par && `par ${o.par}`].filter(Boolean).join(" · ")}</div>
          )}
        </div>
      ),
    },
    {
      title: "Mode",
      dataIndex: "mode_libelle",
      render: (libelle, o) => (
        <span className="inline-flex items-center gap-1.5 text-slate-700">
          {ICONES[o.mode] || <Wallet size={16} />} {libelle}
        </span>
      ),
    },
    {
      title: "Montant",
      key: "montant",
      align: "right",
      render: (_, o) => (
        <span className={`font-bold ${o.sens === "entree" ? "text-emerald-700" : "text-red-600"}`}>
          {o.sens === "entree" ? "+" : "−"} {argent(o.montant, devise)}
        </span>
      ),
      sorter: (a, b) => a.montant - b.montant,
    },
  ];

  return (
    <div>
      <EnteteRapport
        icone={<Wallet size={20} />}
        titre="Encaissements"
        description="L'argent reçu des clients et rendu (remboursements, annulations), par mode de paiement."
        actions={<ActionsRapport disabled={chargement} onPdf={pdf} onExcel={excel} onReset={reset} />}
      />
      <BarreFiltres>
        <ChoixPeriode
          preset={preset}
          periode={periode}
          onChange={(p, v) => {
            setPreset(p);
            setPeriode(v);
          }}
        />
        <Select allowClear placeholder="Tous les modes" value={mode} onChange={setMode} options={MODES_PAIEMENT} className="w-full sm:w-52" />
        <Select
          allowClear
          placeholder="Entrées et sorties"
          value={sens}
          onChange={setSens}
          options={[
            { value: "entree", label: "Entrées (reçu)" },
            { value: "sortie", label: "Sorties (rendu)" },
          ]}
          className="w-full sm:w-44"
        />
      </BarreFiltres>

      <Spin spinning={chargement}>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CarteChiffre principale libelle="Solde net" valeur={argent(t?.net, devise)} detail="Reçu − rendu" icone={<Wallet size={16} />} />
          <CarteChiffre ton="vert" libelle="Reçu des clients" valeur={argent(t?.entrees, devise)} icone={<ArrowDownLeft size={16} />} />
          <CarteChiffre ton="rouge" libelle="Rendu aux clients" valeur={argent(t?.sorties, devise)} icone={<ArrowUpRight size={16} />} />
          <CarteChiffre
            ton="gris"
            libelle="Crédité aux comptes"
            valeur={argent(t?.credits_clients, devise)}
            detail="Remboursé sur le compte client"
            icone={<CreditCard size={16} />}
          />
        </div>

        <div className="mb-4">
          <Section titre="Par mode de paiement">
            {donnees?.par_mode.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {donnees.par_mode.map((m) => (
                  <div key={m.mode} className="rounded-xl border border-purple-100 p-3">
                    <div className="mb-2 flex items-center gap-2 font-bold text-purple-950">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-900">
                        {ICONES[m.mode] || <Wallet size={16} />}
                      </span>
                      {m.libelle}
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">Reçu</span><b className="text-emerald-700">{fmt(m.entrees)}</b></div>
                      <div className="flex justify-between"><span className="text-slate-500">Rendu</span><b className="text-red-600">{fmt(m.sorties)}</b></div>
                      <div className="flex justify-between border-t border-purple-100 pt-0.5">
                        <span className="font-semibold text-slate-700">Net</span>
                        <b className="text-purple-950">{argent(m.net, devise)}</b>
                      </div>
                      <div className="text-right text-[11px] text-slate-400">{m.operations} opération(s)</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="Aucun encaissement sur la période" />
            )}
          </Section>
        </div>

        <Section titre="Détail des opérations" note={`${fmt(operations.length)} opération(s)`}>
          <Table
            rowKey={(o) => `${o.vente_id}-${o.date}-${o.sens}-${o.montant}`}
            size="middle"
            columns={colonnes}
            dataSource={operations}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 760 }}
            locale={{ emptyText: <Empty description="Aucune opération pour cette sélection" /> }}
          />
        </Section>
      </Spin>
    </div>
  );
};

export default CashReport;
