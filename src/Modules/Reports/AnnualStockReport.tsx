// Mouvement de stock annuel : pour chaque produit, stock au 1er janvier,
// entrées et sorties de l'année par nature, stock au 31 décembre et valeurs.
import React, { useMemo, useState } from "react";
import { Alert, Empty, Input, Select, Spin, Switch, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { ArrowDownToLine, ArrowUpFromLine, CalendarRange, PackageCheck, PackageOpen, RefreshCcw, Search } from "lucide-react";
import dayjs from "dayjs";
import {
  ActionsRapport,
  argent,
  BarreFiltres,
  CarteChiffre,
  EnteteRapport,
  fmt,
  PURPLE_950,
  Section,
  useRapport,
} from "./ReportUi";
import { lireRapport, MOIS_COURTS } from "./reportsApi";
import type { LigneStockAnnuel, RapportStockAnnuel } from "./reportsApi";
import { exporterCsv, genererRapportPdf, nomFichier, ORANGE, ROUGE, VERT } from "./reportPdf";

type Cle = "stock_initial" | "creation" | "approvisionnements" | "retours" | "ventes" | "pertes" | "livreurs"
  | "ajustements" | "entrees" | "sorties" | "stock_final" | "valeur_initiale" | "valeur_finale" | "valeur_ventes_cout";
const CLES: Cle[] = ["stock_initial", "creation", "approvisionnements", "retours", "ventes", "pertes", "livreurs",
  "ajustements", "entrees", "sorties", "stock_final", "valeur_initiale", "valeur_finale", "valeur_ventes_cout"];

const signe = (n: number) => (n > 0 ? `+${fmt(n)}` : fmt(n));

const AnnualStockReport: React.FC<{ devise: string }> = ({ devise }) => {
  const [annee, setAnnee] = useState(dayjs().year());
  const [categorieId, setCategorieId] = useState<string>();
  const [avecMouvements, setAvecMouvements] = useState(true);
  const [recherche, setRecherche] = useState("");

  const params = { annee, categorie_id: categorieId, avec_mouvements: avecMouvements };
  const { donnees, chargement } = useRapport<RapportStockAnnuel>(
    (signal) => lireRapport("stock-annuel", params, signal),
    JSON.stringify(params),
  );

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const liste = donnees?.produits || [];
    return q ? liste.filter((l) => `${l.produit} ${l.categorie}`.toLowerCase().includes(q)) : liste;
  }, [donnees, recherche]);

  const t = useMemo(() => {
    const totaux = Object.fromEntries(CLES.map((c) => [c, lignes.reduce((s, l) => s + (Number(l[c]) || 0), 0)])) as Record<Cle, number>;
    const stockMoyen = (totaux.stock_initial + totaux.creation + totaux.stock_final) / 2;
    return { ...totaux, rotation: stockMoyen > 0 ? totaux.ventes / stockMoyen : 0 };
  }, [lignes]);

  const parCategorie = useMemo(() => {
    const groupes = new Map<string, Record<Cle, number> & { produits: number }>();
    lignes.forEach((l) => {
      const g = groupes.get(l.categorie) || ({ produits: 0, ...Object.fromEntries(CLES.map((c) => [c, 0])) } as Record<Cle, number> & { produits: number });
      CLES.forEach((c) => (g[c] += Number(l[c]) || 0));
      g.produits += 1;
      groupes.set(l.categorie, g);
    });
    return [...groupes.entries()].map(([categorie, g]) => ({ categorie, ...g }));
  }, [lignes]);

  const annees = donnees?.annees?.length ? donnees.annees : [dayjs().year()];
  const categorie = donnees?.categories.find((c) => c.id === categorieId)?.nom;
  const filtres = [
    categorie && `catégorie ${categorie}`,
    avecMouvements ? "produits mouvementés dans l'année" : "tous les produits",
    recherche.trim() && `recherche « ${recherche.trim()} »`,
  ].filter(Boolean).join(", ");
  const mois = donnees?.mois || [];

  const pdf = (mode: "download" | "print") =>
    genererRapportPdf(
      {
        fichier: `${nomFichier("Mouvement_de_stock_annuel", String(annee))}.pdf`,
        kicker: "RAPPORT DE STOCK",
        titre: "MOUVEMENT DE STOCK ANNUEL",
        pastille: `Exercice ${annee}`,
        filtres,
        signatures: true,
        chiffres: [
          [`Stock au 01/01/${annee}`, `${fmt(t.stock_initial)} unités`],
          ["Entrées de l'année", `+ ${fmt(t.entrees)}`],
          ["Sorties de l'année", `- ${fmt(t.sorties)}`],
          [`Stock au 31/12/${annee}`, `${fmt(t.stock_final)} unités`],
          [`Valeur au 01/01/${annee}`, argent(t.valeur_initiale, devise)],
          [`Valeur au 31/12/${annee}`, argent(t.valeur_finale, devise)],
          ["Coût des ventes", argent(t.valeur_ventes_cout, devise)],
          ["Rotation du stock", `${fmt(Math.round(t.rotation * 100) / 100)} fois`],
        ],
        sections: [
          {
            titre: "Évolution mensuelle",
            note: "quantités, toutes natures confondues",
            lignes: mois,
            colonnes: [
              { titre: "Mois", largeur: 22, valeur: (m: RapportStockAnnuel["mois"][number]) => `${MOIS_COURTS[m.mois - 1]} ${annee}`, gras: true },
              { titre: "Entrées", largeur: 15, align: "right", valeur: (m: RapportStockAnnuel["mois"][number]) => fmt(m.entrees), couleur: () => VERT },
              { titre: "dont approvisionnements", largeur: 20, align: "right", valeur: (m: RapportStockAnnuel["mois"][number]) => fmt(m.approvisionnements) },
              { titre: "Sorties", largeur: 15, align: "right", valeur: (m: RapportStockAnnuel["mois"][number]) => fmt(m.sorties), couleur: () => ROUGE },
              { titre: "dont ventes nettes", largeur: 15, align: "right", valeur: (m: RapportStockAnnuel["mois"][number]) => fmt(m.ventes) },
              { titre: "Solde", largeur: 13, align: "right", valeur: (m: RapportStockAnnuel["mois"][number]) => signe(m.entrees - m.sorties), gras: true },
            ],
            total: [
              "ANNÉE",
              fmt(mois.reduce((s, m) => s + m.entrees, 0)),
              fmt(mois.reduce((s, m) => s + m.approvisionnements, 0)),
              fmt(mois.reduce((s, m) => s + m.sorties, 0)),
              fmt(mois.reduce((s, m) => s + m.ventes, 0)),
              signe(mois.reduce((s, m) => s + m.entrees - m.sorties, 0)),
            ],
          },
          {
            titre: "Récapitulatif par catégorie",
            lignes: parCategorie,
            colonnes: [
              { titre: "Catégorie", largeur: 30, valeur: (c: (typeof parCategorie)[number]) => c.categorie, sous: (c: (typeof parCategorie)[number]) => `${c.produits} produit(s)`, gras: true },
              { titre: "Stock 01/01", largeur: 12, align: "right", valeur: (c: (typeof parCategorie)[number]) => fmt(c.stock_initial) },
              { titre: "Entrées", largeur: 12, align: "right", valeur: (c: (typeof parCategorie)[number]) => fmt(c.entrees), couleur: () => VERT },
              { titre: "Sorties", largeur: 12, align: "right", valeur: (c: (typeof parCategorie)[number]) => fmt(c.sorties), couleur: () => ROUGE },
              { titre: "Stock 31/12", largeur: 12, align: "right", valeur: (c: (typeof parCategorie)[number]) => fmt(c.stock_final), gras: true },
              { titre: `Valeur 31/12 (${devise})`, largeur: 18, align: "right", valeur: (c: (typeof parCategorie)[number]) => fmt(c.valeur_finale) },
            ],
            total: ["TOTAL", fmt(t.stock_initial), fmt(t.entrees), fmt(t.sorties), fmt(t.stock_final), fmt(t.valeur_finale)],
          },
          {
            titre: "Détail par produit",
            note: `${fmt(lignes.length)} produit(s) · Stock 31/12 = Stock 01/01 + entrées - sorties`,
            lignes,
            colonnes: [
              { titre: "Produit", largeur: 25, valeur: (l: LigneStockAnnuel) => l.produit, sous: (l: LigneStockAnnuel) => l.categorie + (l.supprime ? " · supprimé" : ""), gras: true },
              { titre: "Stock 01/01", largeur: 9, align: "right", valeur: (l: LigneStockAnnuel) => fmt(l.stock_initial) },
              { titre: "Création + appro.", largeur: 10, align: "right", valeur: (l: LigneStockAnnuel) => fmt(l.creation + l.approvisionnements), couleur: () => VERT },
              { titre: "Retours", largeur: 9, align: "right", valeur: (l: LigneStockAnnuel) => fmt(l.retours), couleur: () => VERT },
              { titre: "Ventes", largeur: 8, align: "right", valeur: (l: LigneStockAnnuel) => fmt(l.ventes), couleur: () => ROUGE },
              { titre: "Pertes", largeur: 8, align: "right", valeur: (l: LigneStockAnnuel) => fmt(l.pertes), couleur: () => ROUGE },
              { titre: "Livreurs", largeur: 9, align: "right", valeur: (l: LigneStockAnnuel) => signe(l.livreurs), couleur: () => ORANGE },
              { titre: "Ajust.", largeur: 8, align: "right", valeur: (l: LigneStockAnnuel) => signe(l.ajustements) },
              { titre: "Stock 31/12", largeur: 9, align: "right", valeur: (l: LigneStockAnnuel) => fmt(l.stock_final), gras: true },
              { titre: `Valeur (${devise})`, largeur: 13, align: "right", valeur: (l: LigneStockAnnuel) => fmt(l.valeur_finale) },
            ],
            total: [
              "TOTAL", fmt(t.stock_initial), fmt(t.creation + t.approvisionnements), fmt(t.retours), fmt(t.ventes),
              fmt(t.pertes), signe(t.livreurs), signe(t.ajustements), fmt(t.stock_final), fmt(t.valeur_finale),
            ],
          },
        ],
      },
      mode,
    );

  const excel = () =>
    exporterCsv(
      `${nomFichier("Mouvement_de_stock_annuel", String(annee))}.csv`,
      ["Produit", "Catégorie", "Unité", `Stock 01/01/${annee}`, "Stock à la création", "Approvisionnements", "Retours clients",
        "Ventes", "Avaries et pertes", "Stock des livreurs (net)", "Ajustements", "Total entrées", "Total sorties",
        `Stock 31/12/${annee}`, "Prix d'achat", "Valeur 01/01", "Valeur 31/12", "Coût des ventes", "Supprimé"],
      lignes.map((l) => [
        l.produit, l.categorie, l.unite, l.stock_initial, l.creation, l.approvisionnements, l.retours, l.ventes, l.pertes,
        l.livreurs, l.ajustements, l.entrees, l.sorties, l.stock_final, l.prix_achat, l.valeur_initiale, l.valeur_finale,
        l.valeur_ventes_cout, l.supprime ? "oui" : "",
      ]),
    );

  const nombreCellule = (n: number, couleur?: string) => (
    <span className={n === 0 ? "text-slate-300" : couleur || "text-slate-700"}>{fmt(n)}</span>
  );
  const colonnes: ColumnsType<LigneStockAnnuel> = [
    {
      title: "Produit",
      key: "produit",
      fixed: "left",
      width: 220,
      render: (_, l) => (
        <div>
          <div className="font-semibold text-slate-800">
            {l.produit}
            {l.supprime && <span className="ml-1 text-[11px] font-normal text-red-500">(supprimé)</span>}
          </div>
          <div className="text-xs text-slate-500">{l.categorie}</div>
        </div>
      ),
      sorter: (a, b) => a.produit.localeCompare(b.produit),
    },
    {
      title: <Tooltip title={`Stock au 1er janvier ${annee}`}>Stock 01/01</Tooltip>,
      dataIndex: "stock_initial",
      align: "right",
      render: (n: number) => <b className="text-slate-700">{fmt(n)}</b>,
      sorter: (a, b) => a.stock_initial - b.stock_initial,
    },
    {
      title: "Entrées",
      children: [
        { title: "Création", dataIndex: "creation", align: "right", render: (n: number) => nombreCellule(n, "text-emerald-700") },
        { title: "Appro.", dataIndex: "approvisionnements", align: "right", render: (n: number) => nombreCellule(n, "text-emerald-700") },
        { title: "Retours", dataIndex: "retours", align: "right", render: (n: number) => nombreCellule(n, "text-emerald-700") },
      ],
    },
    {
      title: "Sorties",
      children: [
        { title: "Ventes", dataIndex: "ventes", align: "right", render: (n: number) => nombreCellule(n, "text-red-600"), sorter: (a, b) => a.ventes - b.ventes },
        { title: "Pertes", dataIndex: "pertes", align: "right", render: (n: number) => nombreCellule(n, "text-red-600") },
      ],
    },
    {
      title: <Tooltip title="Stock remis aux livreurs (−) et rendu par eux (+)">Livreurs</Tooltip>,
      dataIndex: "livreurs",
      align: "right",
      render: (n: number) => <span className={n === 0 ? "text-slate-300" : "text-orange-600"}>{signe(n)}</span>,
    },
    {
      title: "Ajust.",
      dataIndex: "ajustements",
      align: "right",
      render: (n: number) => <span className={n === 0 ? "text-slate-300" : "text-slate-700"}>{signe(n)}</span>,
    },
    {
      title: <Tooltip title={`Stock au 31 décembre ${annee}`}>Stock 31/12</Tooltip>,
      dataIndex: "stock_final",
      align: "right",
      render: (n: number) => <b className={n < 0 ? "text-red-600" : "text-purple-950"}>{fmt(n)}</b>,
      sorter: (a, b) => a.stock_final - b.stock_final,
    },
    {
      title: "Valeur 31/12",
      dataIndex: "valeur_finale",
      align: "right",
      render: (n: number) => argent(n, devise),
      sorter: (a, b) => a.valeur_finale - b.valeur_finale,
    },
  ];

  return (
    <div>
      <EnteteRapport
        icone={<CalendarRange size={20} />}
        titre="Mouvement de stock annuel"
        description="Stock au 1er janvier, entrées et sorties de l'année par nature, stock au 31 décembre et valeurs."
        actions={
          <ActionsRapport
            disabled={chargement}
            onPdf={pdf}
            onExcel={excel}
            onReset={() => {
              setAnnee(dayjs().year());
              setCategorieId(undefined);
              setAvecMouvements(true);
              setRecherche("");
            }}
          />
        }
      />
      <BarreFiltres>
        <Select
          value={annee}
          onChange={setAnnee}
          options={annees.map((a) => ({ value: a, label: `Exercice ${a}` }))}
          className="w-full sm:w-40"
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Toutes les catégories"
          value={categorieId}
          onChange={setCategorieId}
          options={donnees?.categories.map((c) => ({ value: c.id, label: c.nom }))}
          className="w-full sm:w-52"
        />
        <Input
          allowClear
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Rechercher un produit…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ maxWidth: 240 }}
          className="w-full"
        />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
          <Switch size="small" checked={avecMouvements} onChange={setAvecMouvements} />
          Produits mouvementés seulement
        </label>
      </BarreFiltres>

      <Spin spinning={chargement}>
        {!!donnees?.anomalies.length && (
          <Alert
            className="mb-4"
            type="warning"
            showIcon
            message={`${donnees.anomalies.length} produit(s) avec un stock reconstitué négatif`}
            description={`${donnees.anomalies.slice(0, 5).map((a) => a.produit).join(", ")} : des mouvements anciens n'ont pas été enregistrés. Vérifiez leur stock par un inventaire.`}
          />
        )}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CarteChiffre
            ton="gris"
            libelle={`Stock au 01/01/${annee}`}
            valeur={fmt(t.stock_initial)}
            detail={argent(t.valeur_initiale, devise)}
            icone={<PackageOpen size={16} />}
          />
          <CarteChiffre
            ton="vert"
            libelle="Entrées de l'année"
            valeur={fmt(t.entrees)}
            detail={`Création ${fmt(t.creation)} · appro. ${fmt(t.approvisionnements)} · retours ${fmt(t.retours)}`}
            icone={<ArrowDownToLine size={16} />}
          />
          <CarteChiffre
            ton="rouge"
            libelle="Sorties de l'année"
            valeur={fmt(t.sorties)}
            detail={`Ventes ${fmt(t.ventes)} · pertes ${fmt(t.pertes)}`}
            icone={<ArrowUpFromLine size={16} />}
          />
          <CarteChiffre
            principale
            libelle={`Stock au 31/12/${annee}`}
            valeur={fmt(t.stock_final)}
            detail={argent(t.valeur_finale, devise)}
            icone={<PackageCheck size={16} />}
          />
        </div>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CarteChiffre ton="gris" libelle="Coût des ventes" valeur={argent(t.valeur_ventes_cout, devise)} detail="Quantités vendues × prix d'achat" icone={<ArrowUpFromLine size={16} />} />
          <CarteChiffre
            ton="gris"
            libelle="Rotation du stock"
            valeur={`${fmt(Math.round(t.rotation * 100) / 100)} fois`}
            detail="Ventes ÷ stock moyen de l'année"
            icone={<RefreshCcw size={16} />}
          />
          <CarteChiffre
            ton="gris"
            libelle="Produits"
            valeur={fmt(lignes.length)}
            detail={`${fmt(lignes.filter((l) => l.mouvements).length)} mouvementés dans l'année`}
            icone={<PackageCheck size={16} />}
          />
        </div>

        <div className="mb-4">
          <Section titre="Évolution mensuelle" note={`Exercice ${annee}`}>
            {mois.some((m) => m.entrees || m.sorties) ? (
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={mois.map((m) => ({ ...m, nom: MOIS_COURTS[m.mois - 1] }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede9fe" />
                    <XAxis dataKey="nom" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(n) => fmt(n)} width={50} />
                    <RTooltip formatter={(n: number, nom: string) => [fmt(n), nom]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="entrees" name="Entrées" fill="#059669" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="sorties" name="Sorties" fill={PURPLE_950} radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="Aucun mouvement cette année" />
            )}
          </Section>
        </div>

        <Section titre="Détail par produit" note="Stock 31/12 = Stock 01/01 + entrées − sorties">
          <Table
            rowKey="produit_id"
            size="small"
            bordered
            columns={colonnes}
            dataSource={lignes}
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (n) => `${n} produit(s)` }}
            scroll={{ x: 1100 }}
            locale={{ emptyText: <Empty description="Aucun produit pour cette sélection" /> }}
            summary={() =>
              lignes.length ? (
                <Table.Summary fixed>
                  <Table.Summary.Row className="bg-purple-50 font-bold text-purple-950">
                    <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                    {[t.stock_initial, t.creation, t.approvisionnements, t.retours, t.ventes, t.pertes].map((n, i) => (
                      <Table.Summary.Cell key={i} index={i + 1} align="right">{fmt(n)}</Table.Summary.Cell>
                    ))}
                    <Table.Summary.Cell index={7} align="right">{signe(t.livreurs)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">{signe(t.ajustements)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={9} align="right">{fmt(t.stock_final)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={10} align="right">{argent(t.valeur_finale, devise)}</Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              ) : null
            }
          />
        </Section>
      </Spin>
    </div>
  );
};

export default AnnualStockReport;
