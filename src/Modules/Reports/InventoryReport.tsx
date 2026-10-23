// Inventaire : l'état actuel du stock, valorisé au prix d'achat et au prix de
// vente, avec les produits en rupture ou sous le seuil d'alerte.
import React, { useMemo, useState } from "react";
import { Alert, Empty, Input, Select, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { AlertTriangle, Boxes, ClipboardList, Coins, PackageX, Search } from "lucide-react";
import dayjs from "dayjs";
import {
  ActionsRapport,
  argent,
  BarreFiltres,
  CarteChiffre,
  dateCourte,
  EnteteRapport,
  fmt,
  Pastille,
  Section,
  useRapport,
} from "./ReportUi";
import { LIBELLES_ETAT, lireRapport } from "./reportsApi";
import type { EtatStock, LigneInventaire, RapportInventaire } from "./reportsApi";
import { exporterCsv, genererRapportPdf, nomFichier, ORANGE, ROUGE } from "./reportPdf";

const TON_ETAT: Record<EtatStock, "vert" | "orange" | "rouge"> = { en_stock: "vert", critique: "orange", rupture: "rouge" };

const InventoryReport: React.FC<{ devise: string }> = ({ devise }) => {
  const [categorieId, setCategorieId] = useState<string>();
  const [etat, setEtat] = useState<EtatStock>();
  const [recherche, setRecherche] = useState("");

  const params = { categorie_id: categorieId, etat };
  const { donnees, chargement } = useRapport<RapportInventaire>(
    (signal) => lireRapport("inventaire", params, signal),
    JSON.stringify(params),
  );

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const liste = donnees?.produits || [];
    return q ? liste.filter((l) => `${l.produit} ${l.categorie} ${l.reference}`.toLowerCase().includes(q)) : liste;
  }, [donnees, recherche]);

  const t = useMemo(() => {
    const somme = (f: (l: LigneInventaire) => number) => lignes.reduce((s, l) => s + (Number(f(l)) || 0), 0);
    return {
      quantite: somme((l) => l.quantite),
      achat: somme((l) => l.valeur_achat),
      vente: somme((l) => l.valeur_vente),
      marge: somme((l) => l.marge_potentielle),
      critique: lignes.filter((l) => l.etat === "critique").length,
      rupture: lignes.filter((l) => l.etat === "rupture").length,
    };
  }, [lignes]);

  const categorie = donnees?.categories.find((c) => c.id === categorieId)?.nom;
  const filtres = [
    categorie && `catégorie ${categorie}`,
    etat && LIBELLES_ETAT[etat].toLowerCase(),
    recherche.trim() && `recherche « ${recherche.trim()} »`,
  ].filter(Boolean).join(", ");
  const jour = dayjs(donnees?.date).format("DD/MM/YYYY");

  const pdf = (mode: "download" | "print") =>
    genererRapportPdf(
      {
        fichier: `${nomFichier("Inventaire", dayjs().format("YYYY-MM-DD"))}.pdf`,
        kicker: "RAPPORT DE STOCK",
        titre: "INVENTAIRE DU STOCK",
        pastille: `Au ${jour}`,
        filtres,
        signatures: true,
        chiffres: [
          ["Produits", fmt(lignes.length)],
          ["Quantité en stock", fmt(t.quantite)],
          ["Valeur d'achat", argent(t.achat, devise)],
          ["Valeur de vente", argent(t.vente, devise)],
          ["Marge potentielle", argent(t.marge, devise)],
          ["Stock critique", fmt(t.critique)],
          ["En rupture", fmt(t.rupture)],
          ["Taux de marge", t.achat ? `${fmt(Math.round((t.marge / t.achat) * 1000) / 10)} %` : "—"],
        ],
        sections: [
          {
            titre: "État du stock par produit",
            note: `${fmt(lignes.length)} produit(s)`,
            lignes,
            colonnes: [
              { titre: "Produit", largeur: 32, valeur: (l: LigneInventaire) => l.produit, sous: (l: LigneInventaire) => [l.categorie, l.reference].filter(Boolean).join(" · "), gras: true },
              {
                titre: "Stock",
                largeur: 11,
                align: "right",
                valeur: (l: LigneInventaire) => `${fmt(l.quantite)} ${l.unite}`.trim(),
                sous: (l: LigneInventaire) => (l.etat === "en_stock" ? "" : LIBELLES_ETAT[l.etat]),
                couleur: (l: LigneInventaire) => (l.etat === "rupture" ? ROUGE : l.etat === "critique" ? ORANGE : undefined),
                gras: true,
              },
              { titre: "Prix d'achat", largeur: 12, align: "right", valeur: (l: LigneInventaire) => fmt(l.prix_achat) },
              { titre: "Prix de vente", largeur: 12, align: "right", valeur: (l: LigneInventaire) => fmt(l.prix_vente) },
              { titre: `Valeur achat (${devise})`, largeur: 15, align: "right", valeur: (l: LigneInventaire) => fmt(l.valeur_achat), gras: true },
              { titre: "Valeur vente", largeur: 14, align: "right", valeur: (l: LigneInventaire) => fmt(l.valeur_vente) },
            ],
            total: ["TOTAL", fmt(t.quantite), "", "", fmt(t.achat), fmt(t.vente)],
          },
        ],
      },
      mode,
    );

  const excel = () =>
    exporterCsv(
      `${nomFichier("Inventaire", dayjs().format("YYYY-MM-DD"))}.csv`,
      ["Produit", "Référence", "Catégorie", "Unité", "Quantité", "Seuil d'alerte", "État", "Prix d'achat", "Prix de vente",
        "Valeur d'achat", "Valeur de vente", "Marge potentielle", "Péremption"],
      lignes.map((l) => [
        l.produit, l.reference, l.categorie, l.unite, l.quantite, l.seuil_alerte ?? "", LIBELLES_ETAT[l.etat], l.prix_achat,
        l.prix_vente, l.valeur_achat, l.valeur_vente, l.marge_potentielle, l.date_peremption ? dateCourte(l.date_peremption) : "",
      ]),
    );

  const colonnes: ColumnsType<LigneInventaire> = [
    {
      title: "Produit",
      key: "produit",
      render: (_, l) => (
        <div>
          <div className="font-semibold text-slate-800">
            {l.produit}
            {l.doublon && <span className="ml-1.5 rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">en double</span>}
          </div>
          <div className="text-xs text-slate-500">{[l.categorie, l.reference].filter(Boolean).join(" · ")}</div>
        </div>
      ),
      sorter: (a, b) => a.produit.localeCompare(b.produit),
    },
    {
      title: "Stock",
      dataIndex: "quantite",
      align: "right",
      render: (q: number, l) => (
        <span className="font-bold text-purple-950">
          {fmt(q)} <span className="text-xs font-normal text-slate-400">{l.unite}</span>
        </span>
      ),
      sorter: (a, b) => a.quantite - b.quantite,
    },
    {
      title: "État",
      dataIndex: "etat",
      align: "center",
      render: (e: EtatStock, l) => (
        <div>
          <Pastille ton={TON_ETAT[e]}>{LIBELLES_ETAT[e]}</Pastille>
          {l.seuil_alerte != null && <div className="text-[11px] text-slate-400">seuil {fmt(l.seuil_alerte)}</div>}
        </div>
      ),
    },
    { title: "Prix d'achat", dataIndex: "prix_achat", align: "right", render: (n: number) => argent(n, devise) },
    { title: "Prix de vente", dataIndex: "prix_vente", align: "right", render: (n: number) => argent(n, devise) },
    {
      title: "Valeur d'achat",
      dataIndex: "valeur_achat",
      align: "right",
      render: (n: number) => <b className="text-slate-800">{argent(n, devise)}</b>,
      sorter: (a, b) => a.valeur_achat - b.valeur_achat,
      defaultSortOrder: "descend",
    },
    {
      title: "Marge potentielle",
      dataIndex: "marge_potentielle",
      align: "right",
      render: (n: number) => <span className={n < 0 ? "text-red-600" : "text-emerald-700"}>{argent(n, devise)}</span>,
      sorter: (a, b) => a.marge_potentielle - b.marge_potentielle,
    },
  ];

  return (
    <div>
      <EnteteRapport
        icone={<ClipboardList size={20} />}
        titre="Inventaire du stock"
        description="Ce qui est en stock aujourd'hui, sa valeur d'achat et de vente, les ruptures et les stocks critiques."
        actions={
          <ActionsRapport
            disabled={chargement}
            onPdf={pdf}
            onExcel={excel}
            onReset={() => {
              setCategorieId(undefined);
              setEtat(undefined);
              setRecherche("");
            }}
          />
        }
      />
      <BarreFiltres>
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
        <Select
          allowClear
          placeholder="Tous les états"
          value={etat}
          onChange={setEtat}
          options={(Object.keys(LIBELLES_ETAT) as EtatStock[]).map((e) => ({ value: e, label: LIBELLES_ETAT[e] }))}
          className="w-full sm:w-44"
        />
        <Input
          allowClear
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Produit, référence…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ maxWidth: 240 }}
          className="w-full"
        />
      </BarreFiltres>

      <Spin spinning={chargement}>
        {!!donnees?.doublons.length && (
          <Alert
            className="mb-4"
            type="warning"
            showIcon
            message={`${donnees.doublons.length} nom(s) de produit utilisés plusieurs fois`}
            description={`Par exemple : ${donnees.doublons.slice(0, 4).join(", ")}${donnees.doublons.length > 4 ? "…" : ""}. Un même article enregistré en double fausse le stock et les ventes : vérifiez-les dans Produits (ils sont marqués « en double » ci-dessous).`}
          />
        )}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CarteChiffre
            principale
            libelle="Valeur d'achat du stock"
            valeur={argent(t.achat, devise)}
            detail={`${fmt(lignes.length)} produit(s) · ${fmt(t.quantite)} unités`}
            icone={<Boxes size={16} />}
          />
          <CarteChiffre
            ton="vert"
            libelle="Valeur de vente"
            valeur={argent(t.vente, devise)}
            detail={`Marge potentielle ${fmt(t.marge)}`}
            icone={<Coins size={16} />}
          />
          <CarteChiffre
            ton={t.critique ? "orange" : "gris"}
            libelle="Stock critique"
            valeur={fmt(t.critique)}
            detail="Sous le seuil d'alerte"
            icone={<AlertTriangle size={16} />}
          />
          <CarteChiffre
            ton={t.rupture ? "rouge" : "gris"}
            libelle="En rupture"
            valeur={fmt(t.rupture)}
            detail="Stock épuisé"
            icone={<PackageX size={16} />}
          />
        </div>

        <Section titre="État du stock par produit" note={`Au ${jour}`}>
          <Table
            rowKey="produit_id"
            size="middle"
            columns={colonnes}
            dataSource={lignes}
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (n) => `${n} produit(s)` }}
            scroll={{ x: 900 }}
            locale={{ emptyText: <Empty description="Aucun produit pour cette sélection" /> }}
          />
        </Section>
      </Spin>
    </div>
  );
};

export default InventoryReport;
