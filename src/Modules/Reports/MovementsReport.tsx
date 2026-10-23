// Journal des mouvements de stock : chaque entrée et sortie, avec sa nature
// (vente, retour, approvisionnement, avarie, stock des livreurs…).
import React, { useEffect, useMemo, useState } from "react";
import { Empty, Input, Select, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Boxes, Search } from "lucide-react";
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
  Pastille,
  periodeDe,
  Section,
  useRapport,
} from "./ReportUi";
import type { Periode } from "./ReportUi";
import { LIBELLES_FAMILLE, lireRapport } from "./reportsApi";
import type { Famille, Mouvement, RapportMouvements } from "./reportsApi";
import { exporterCsv, genererRapportPdf, nomFichier, ROUGE, VERT } from "./reportPdf";

export const TON_FAMILLE: Record<Famille, "violet" | "vert" | "orange" | "rouge" | "gris"> = {
  approvisionnements: "vert",
  ventes: "violet",
  retours: "orange",
  pertes: "rouge",
  livreurs: "gris",
  ajustements: "gris",
};

const MovementsReport: React.FC<{ devise: string }> = ({ devise }) => {
  const [preset, setPreset] = useState("annee");
  const [periode, setPeriode] = useState<Periode>(periodeDe("annee"));
  const [famille, setFamille] = useState<Famille>();
  const [sens, setSens] = useState<"entree" | "sortie">();
  const [produitId, setProduitId] = useState<string>();
  const [recherche, setRecherche] = useState("");
  // Produits rencontrés : la liste du filtre ne rétrécit pas quand on filtre.
  const [produits, setProduits] = useState<Record<string, string>>({});

  const params = { ...paramsPeriode(periode), famille, sens, produit_id: produitId };
  const { donnees, chargement } = useRapport<RapportMouvements>(
    (signal) => lireRapport("mouvements", params, signal),
    JSON.stringify(params),
  );

  useEffect(() => {
    if (!donnees) return;
    setProduits((avant) => {
      const suite = { ...avant };
      donnees.mouvements.forEach((m) => (suite[m.produit_id] = m.produit));
      return suite;
    });
  }, [donnees]);

  const mouvements = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const liste = donnees?.mouvements || [];
    return q ? liste.filter((m) => [m.produit, m.libelle, m.par, m.detail].join(" ").toLowerCase().includes(q)) : liste;
  }, [donnees, recherche]);

  const totaux = useMemo(() => {
    const entrees = mouvements.filter((m) => m.quantite > 0).reduce((s, m) => s + m.quantite, 0);
    const sorties = mouvements.filter((m) => m.quantite < 0).reduce((s, m) => s - m.quantite, 0);
    const parFamille = (Object.keys(LIBELLES_FAMILLE) as Famille[])
      .map((f) => {
        const liste = mouvements.filter((m) => m.famille === f);
        return {
          famille: f,
          entrees: liste.filter((m) => m.quantite > 0).reduce((s, m) => s + m.quantite, 0),
          sorties: liste.filter((m) => m.quantite < 0).reduce((s, m) => s - m.quantite, 0),
          operations: liste.length,
        };
      })
      .filter((f) => f.operations);
    return { entrees, sorties, parFamille, produits: new Set(mouvements.map((m) => m.produit_id)).size };
  }, [mouvements]);

  const reset = () => {
    setPreset("annee");
    setPeriode(periodeDe("annee"));
    setFamille(undefined);
    setSens(undefined);
    setProduitId(undefined);
    setRecherche("");
  };
  const filtres = [
    famille && LIBELLES_FAMILLE[famille].toLowerCase(),
    sens && (sens === "entree" ? "entrées seulement" : "sorties seulement"),
    produitId && `produit ${produits[produitId]}`,
    recherche.trim() && `recherche « ${recherche.trim()} »`,
  ].filter(Boolean).join(", ");

  const pdf = (mode: "download" | "print") =>
    genererRapportPdf(
      {
        fichier: `${nomFichier("Mouvements_de_stock", params.debut, params.fin)}.pdf`,
        kicker: "RAPPORT DE STOCK",
        titre: "JOURNAL DES MOUVEMENTS",
        pastille: libellePeriode(periode),
        filtres,
        chiffres: [
          ["Opérations", fmt(mouvements.length)],
          ["Entrées", fmt(totaux.entrees)],
          ["Sorties", fmt(totaux.sorties)],
          ["Solde", `${totaux.entrees - totaux.sorties >= 0 ? "+" : ""}${fmt(totaux.entrees - totaux.sorties)}`],
        ],
        signatures: true,
        sections: [
          {
            titre: "Récapitulatif par nature",
            lignes: totaux.parFamille,
            colonnes: [
              { titre: "Nature", largeur: 40, valeur: (f: (typeof totaux.parFamille)[number]) => LIBELLES_FAMILLE[f.famille], gras: true },
              { titre: "Opérations", largeur: 15, align: "right", valeur: (f: (typeof totaux.parFamille)[number]) => fmt(f.operations) },
              { titre: "Entrées", largeur: 15, align: "right", valeur: (f: (typeof totaux.parFamille)[number]) => fmt(f.entrees), couleur: () => VERT },
              { titre: "Sorties", largeur: 15, align: "right", valeur: (f: (typeof totaux.parFamille)[number]) => fmt(f.sorties), couleur: () => ROUGE },
              { titre: "Solde", largeur: 15, align: "right", valeur: (f: (typeof totaux.parFamille)[number]) => fmt(f.entrees - f.sorties), gras: true },
            ],
            total: ["TOTAL", fmt(mouvements.length), fmt(totaux.entrees), fmt(totaux.sorties), fmt(totaux.entrees - totaux.sorties)],
          },
          {
            titre: "Détail des mouvements",
            note: `${fmt(mouvements.length)} mouvement(s)`,
            lignes: mouvements,
            colonnes: [
              { titre: "Date", largeur: 15, valeur: (m: Mouvement) => dateHeure(m.date) },
              { titre: "Produit", largeur: 30, valeur: (m: Mouvement) => m.produit, sous: (m: Mouvement) => m.detail, gras: true },
              { titre: "Nature", largeur: 22, valeur: (m: Mouvement) => m.libelle, sous: (m: Mouvement) => (m.par ? `par ${m.par}` : "") },
              {
                titre: "Quantité",
                largeur: 13,
                align: "right",
                valeur: (m: Mouvement) => `${m.quantite > 0 ? "+" : ""}${fmt(m.quantite)}`,
                couleur: (m: Mouvement) => (m.quantite > 0 ? VERT : ROUGE),
                gras: true,
              },
              { titre: `Valeur (${devise})`, largeur: 15, align: "right", valeur: (m: Mouvement) => fmt(m.valeur) },
            ],
          },
        ],
      },
      mode,
    );

  const excel = () =>
    exporterCsv(
      `${nomFichier("Mouvements_de_stock", params.debut, params.fin)}.csv`,
      ["Date", "Produit", "Unité", "Nature", "Type enregistré", "Quantité", "Valeur au prix d'achat", "Par", "Détail"],
      mouvements.map((m) => [dateHeure(m.date), m.produit, m.unite, m.libelle, m.type, m.quantite, m.valeur, m.par || "", m.detail]),
    );

  const colonnes: ColumnsType<Mouvement> = [
    { title: "Date", dataIndex: "date", render: dateHeure, sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: "descend" },
    {
      title: "Produit",
      key: "produit",
      render: (_, m) => (
        <div>
          <div className="font-semibold text-slate-800">
            {m.produit}
            {m.produit_supprime && <span className="ml-1 text-[11px] font-normal text-red-500">(supprimé)</span>}
          </div>
          {m.detail && <div className="text-xs text-slate-500">{m.detail}</div>}
        </div>
      ),
      sorter: (a, b) => a.produit.localeCompare(b.produit),
    },
    {
      title: "Nature",
      key: "nature",
      render: (_, m) => (
        <div>
          <Pastille ton={TON_FAMILLE[m.famille]}>{m.libelle}</Pastille>
          {m.par && <div className="mt-0.5 text-xs text-slate-500">par {m.par}</div>}
        </div>
      ),
    },
    {
      title: "Quantité",
      dataIndex: "quantite",
      align: "right",
      render: (q: number, m) => (
        <span className={`font-bold ${q > 0 ? "text-emerald-700" : "text-red-600"}`}>
          {q > 0 ? "+" : ""}
          {fmt(q)} <span className="text-xs font-normal text-slate-400">{m.unite}</span>
        </span>
      ),
      sorter: (a, b) => a.quantite - b.quantite,
    },
    { title: "Valeur (prix d'achat)", dataIndex: "valeur", align: "right", render: (v: number) => argent(v, devise) },
  ];

  return (
    <div>
      <EnteteRapport
        icone={<ArrowLeftRight size={20} />}
        titre="Journal des mouvements de stock"
        description="Toutes les entrées et sorties de stock, avec leur nature et leur auteur."
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
        <Select
          allowClear
          placeholder="Toutes les natures"
          value={famille}
          onChange={setFamille}
          options={(Object.keys(LIBELLES_FAMILLE) as Famille[]).map((f) => ({ value: f, label: LIBELLES_FAMILLE[f] }))}
          className="w-full sm:w-48"
        />
        <Select
          allowClear
          placeholder="Entrées et sorties"
          value={sens}
          onChange={setSens}
          options={[
            { value: "entree", label: "Entrées" },
            { value: "sortie", label: "Sorties" },
          ]}
          className="w-full sm:w-40"
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Tous les produits"
          value={produitId}
          onChange={setProduitId}
          options={Object.entries(produits)
            .sort((a, b) => a[1].localeCompare(b[1], "fr"))
            .map(([id, nom]) => ({ value: id, label: nom }))}
          className="w-full sm:w-52"
        />
        <Input
          allowClear
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Rechercher…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ maxWidth: 240 }}
          className="w-full"
        />
      </BarreFiltres>

      <Spin spinning={chargement}>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CarteChiffre
            principale
            libelle="Solde de la période"
            valeur={`${totaux.entrees - totaux.sorties >= 0 ? "+" : ""}${fmt(totaux.entrees - totaux.sorties)}`}
            detail={`${fmt(mouvements.length)} mouvement(s)`}
            icone={<ArrowLeftRight size={16} />}
          />
          <CarteChiffre ton="vert" libelle="Entrées" valeur={fmt(totaux.entrees)} icone={<ArrowDownToLine size={16} />} />
          <CarteChiffre ton="rouge" libelle="Sorties" valeur={fmt(totaux.sorties)} icone={<ArrowUpFromLine size={16} />} />
          <CarteChiffre ton="gris" libelle="Produits concernés" valeur={fmt(totaux.produits)} icone={<Boxes size={16} />} />
        </div>

        {totaux.parFamille.length > 0 && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {totaux.parFamille.map((f) => (
              <button
                key={f.famille}
                type="button"
                onClick={() => setFamille(famille === f.famille ? undefined : f.famille)}
                className={`rounded-xl border p-3 text-left transition hover:border-purple-300 ${
                  famille === f.famille ? "border-purple-900 bg-purple-50" : "border-purple-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Pastille ton={TON_FAMILLE[f.famille]}>{LIBELLES_FAMILLE[f.famille]}</Pastille>
                  <span className="text-xs text-slate-400">{f.operations} op.</span>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-emerald-700">+{fmt(f.entrees)}</span>
                  <span className="text-red-600">−{fmt(f.sorties)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <Section titre="Détail des mouvements" note={`${fmt(mouvements.length)} mouvement(s)`}>
          <Table
            rowKey={(m) => `${m.produit_id}-${m.date}-${m.type}-${m.quantite}`}
            size="middle"
            columns={colonnes}
            dataSource={mouvements}
            pagination={{ pageSize: 12, showSizeChanger: true }}
            scroll={{ x: 760 }}
            locale={{ emptyText: <Empty description="Aucun mouvement pour cette sélection" /> }}
          />
        </Section>
      </Spin>
    </div>
  );
};

export default MovementsReport;
