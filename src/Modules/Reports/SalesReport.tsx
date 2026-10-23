// Rapport des ventes : chiffre d'affaires (HT, TVA, TTC), encaissé, reste,
// marge, réductions, retours et remboursements, par vente et par produit.
import React, { useMemo, useState } from "react";
import { Empty, Input, Select, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { BadgePercent, Coins, HandCoins, Receipt, Search, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import dayjs from "dayjs";
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
  PURPLE_950,
  Section,
  useRapport,
} from "./ReportUi";
import type { Periode } from "./ReportUi";
import { LIBELLES_STATUT, lireRapport } from "./reportsApi";
import type { RapportVentes, StatutVente, Vente } from "./reportsApi";
import { exporterCsv, genererRapportPdf, nomFichier, ORANGE, ROUGE, VERT } from "./reportPdf";

// Une couleur par jour dans le graphique du chiffre d'affaires.
const COULEURS_JOURS = ["#16a34a", "#eab308", "#2563eb", "#f97316", "#9333ea", "#0891b2", "#dc2626", "#db2777"];

const TON_STATUT: Record<StatutVente, "vert" | "orange" | "rouge"> = { paye: "vert", partiel: "orange", non_paye: "rouge" };

const SalesReport: React.FC<{ devise: string; estLivreur: boolean }> = ({ devise, estLivreur }) => {
  const [preset, setPreset] = useState("mois");
  const [periode, setPeriode] = useState<Periode>(periodeDe("mois"));
  const [clientId, setClientId] = useState<string>();
  const [vendeurId, setVendeurId] = useState<string>();
  const [produitId, setProduitId] = useState<string>();
  const [statut, setStatut] = useState<StatutVente>();
  const [recherche, setRecherche] = useState("");

  const params = { ...paramsPeriode(periode), client_id: clientId, vendeur_id: vendeurId, produit_id: produitId, statut };
  const { donnees, chargement } = useRapport<RapportVentes>(
    (signal) => lireRapport("ventes", params, signal),
    JSON.stringify(params),
  );

  const ventes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const liste = donnees?.ventes || [];
    return q
      ? liste.filter((v) => [v.facture, v.client.nom, v.client.telephone, v.vendeur.nom].join(" ").toLowerCase().includes(q))
      : liste;
  }, [donnees, recherche]);

  // Totaux de la liste affichée (la recherche locale compte aussi)
  const t = useMemo(() => {
    const somme = (f: (v: Vente) => number) => ventes.reduce((s, v) => s + (Number(f(v)) || 0), 0);
    const ht = somme((v) => v.montant_ht);
    const marge = somme((v) => v.marge);
    return {
      ventes: ventes.length,
      articles: somme((v) => v.articles),
      ht,
      tva: somme((v) => v.montant_tva),
      ttc: somme((v) => v.montant_ttc),
      paye: somme((v) => v.montant_paye),
      reste: somme((v) => v.reste),
      reductions: somme((v) => v.reductions),
      rembourse: somme((v) => v.montant_rembourse),
      retourne: somme((v) => v.montant_retourne),
      marge,
      tauxMarge: ht ? (marge / ht) * 100 : 0,
    };
  }, [ventes]);

  const reset = () => {
    setPreset("mois");
    setPeriode(periodeDe("mois"));
    setClientId(undefined);
    setVendeurId(undefined);
    setProduitId(undefined);
    setStatut(undefined);
    setRecherche("");
  };

  const options = donnees?.options;
  const descriptionFiltres = [
    clientId && `client ${options?.clients.find((c) => c.id === clientId)?.nom}`,
    vendeurId && `vendeur ${options?.vendeurs.find((c) => c.id === vendeurId)?.nom}`,
    produitId && `produit ${options?.produits.find((c) => c.id === produitId)?.nom}`,
    statut && `statut ${LIBELLES_STATUT[statut].toLowerCase()}`,
    recherche.trim() && `recherche « ${recherche.trim()} »`,
  ].filter(Boolean).join(", ");

  const pdf = (mode: "download" | "print") => {
    const top = [...(donnees?.top_produits || [])];
    return genererRapportPdf(
      {
        fichier: `${nomFichier("Rapport_ventes", paramsPeriode(periode).debut, paramsPeriode(periode).fin)}.pdf`,
        kicker: "RAPPORT DE GESTION",
        titre: "RAPPORT DES VENTES",
        pastille: libellePeriode(periode),
        filtres: descriptionFiltres,
        chiffres: [
          ["Ventes", `${fmt(t.ventes)} · ${fmt(t.articles)} art.`],
          ["Chiffre d'affaires TTC", argent(t.ttc, devise)],
          ["Encaissé", argent(t.paye, devise)],
          ["Reste à percevoir", argent(t.reste, devise)],
          ["Total HT", argent(t.ht, devise)],
          ["TVA collectée", argent(t.tva, devise)],
          ["Marge brute", `${argent(t.marge, devise)} (${fmt(Math.round(t.tauxMarge * 10) / 10)} %)`],
          ["Remboursé", argent(t.rembourse, devise)],
        ],
        signatures: true,
        sections: [
          {
            titre: "Détail des ventes",
            note: `${fmt(ventes.length)} vente${ventes.length > 1 ? "s" : ""}`,
            lignes: ventes,
            colonnes: [
              { titre: "Facture", largeur: 17, valeur: (v: Vente) => v.facture, sous: (v: Vente) => dateHeure(v.date), gras: true },
              { titre: "Client", largeur: 24, valeur: (v: Vente) => v.client.nom, sous: (v: Vente) => (estLivreur ? "" : `par ${v.vendeur.nom}`) },
              { titre: "Art.", largeur: 7, align: "right", valeur: (v: Vente) => fmt(v.articles) },
              { titre: "HT", largeur: 14, align: "right", valeur: (v: Vente) => fmt(v.montant_ht) },
              { titre: "TVA", largeur: 11, align: "right", valeur: (v: Vente) => fmt(v.montant_tva) },
              { titre: "TTC", largeur: 14, align: "right", valeur: (v: Vente) => fmt(v.montant_ttc), gras: true },
              { titre: "Payé", largeur: 14, align: "right", valeur: (v: Vente) => fmt(v.montant_paye), couleur: () => VERT },
              {
                titre: "Reste",
                largeur: 14,
                align: "right",
                valeur: (v: Vente) => fmt(v.reste),
                sous: (v: Vente) => LIBELLES_STATUT[v.statut],
                couleur: (v: Vente) => (v.reste > 0 ? (v.statut === "non_paye" ? ROUGE : ORANGE) : undefined),
              },
            ],
            total: ["TOTAL", "", fmt(t.articles), fmt(t.ht), fmt(t.tva), fmt(t.ttc), fmt(t.paye), fmt(t.reste)],
          },
          {
            titre: "Produits les plus vendus",
            note: "classés par montant",
            lignes: top,
            colonnes: [
              { titre: "Produit", largeur: 46, valeur: (p: (typeof top)[number]) => p.nom, gras: true },
              { titre: "Quantité", largeur: 14, align: "right", valeur: (p: (typeof top)[number]) => fmt(p.quantite) },
              { titre: `Montant (${devise})`, largeur: 20, align: "right", valeur: (p: (typeof top)[number]) => fmt(p.montant) },
              { titre: "Marge", largeur: 20, align: "right", valeur: (p: (typeof top)[number]) => fmt(p.marge), couleur: () => VERT },
            ],
          },
          {
            titre: "Répartition par statut de paiement",
            lignes: (["paye", "partiel", "non_paye"] as StatutVente[]).map((s) => ({
              statut: s,
              nombre: ventes.filter((v) => v.statut === s).length,
              montant: ventes.filter((v) => v.statut === s).reduce((x, v) => x + v.montant_ttc, 0),
              reste: ventes.filter((v) => v.statut === s).reduce((x, v) => x + v.reste, 0),
            })),
            colonnes: [
              { titre: "Statut", largeur: 40, valeur: (r: { statut: StatutVente }) => LIBELLES_STATUT[r.statut], gras: true },
              { titre: "Ventes", largeur: 15, align: "right", valeur: (r: { nombre: number }) => fmt(r.nombre) },
              { titre: `Montant TTC (${devise})`, largeur: 25, align: "right", valeur: (r: { montant: number }) => fmt(r.montant) },
              { titre: "Reste", largeur: 20, align: "right", valeur: (r: { reste: number }) => fmt(r.reste) },
            ],
          },
        ],
      },
      mode,
    );
  };

  const excel = () =>
    exporterCsv(
      `${nomFichier("Rapport_ventes", paramsPeriode(periode).debut, paramsPeriode(periode).fin)}.csv`,
      ["Facture", "Date", "Client", "Téléphone", "Vendeur", "Articles", "Brut", "Réductions", "HT", "Taux TVA %",
        "TVA", "TTC", "Payé", "Reste", "Statut", "Retourné", "Remboursé", "Coût d'achat", "Marge"],
      ventes.map((v) => [
        v.facture, dateHeure(v.date), v.client.nom, v.client.telephone, v.vendeur.nom, v.articles, v.montant_brut,
        v.reductions, v.montant_ht, v.taux_tva, v.montant_tva, v.montant_ttc, v.montant_paye, v.reste,
        LIBELLES_STATUT[v.statut], v.montant_retourne, v.montant_rembourse, v.cout_achat, v.marge,
      ]),
    );

  const colonnes: ColumnsType<Vente> = [
    {
      title: "Facture",
      key: "facture",
      render: (_, v) => (
        <div>
          <div className="font-bold text-purple-950">{v.facture}</div>
          <div className="text-xs text-slate-500">{dateHeure(v.date)}</div>
        </div>
      ),
      sorter: (a, b) => a.date.localeCompare(b.date),
      defaultSortOrder: "descend",
    },
    {
      title: "Client",
      key: "client",
      render: (_, v) => (
        <div>
          <div className="font-semibold text-slate-800">{v.client.nom}</div>
          {!estLivreur && <div className="text-xs text-slate-500">par {v.vendeur.nom}</div>}
        </div>
      ),
      sorter: (a, b) => a.client.nom.localeCompare(b.client.nom),
    },
    { title: "Articles", dataIndex: "articles", align: "right", render: (n) => fmt(n), sorter: (a, b) => a.articles - b.articles },
    {
      title: "Montant TTC",
      key: "ttc",
      align: "right",
      render: (_, v) => (
        <div>
          <div className="font-bold text-slate-800">{argent(v.montant_ttc, devise)}</div>
          {v.montant_tva > 0 && <div className="text-[11px] text-slate-400">dont TVA {fmt(v.montant_tva)}</div>}
          {v.reductions > 0 && <div className="text-[11px] text-orange-600">− {fmt(v.reductions)} de réduction</div>}
        </div>
      ),
      sorter: (a, b) => a.montant_ttc - b.montant_ttc,
    },
    {
      title: "Payé",
      dataIndex: "montant_paye",
      align: "right",
      render: (n) => <span className="font-semibold text-emerald-700">{argent(n, devise)}</span>,
      sorter: (a, b) => a.montant_paye - b.montant_paye,
    },
    {
      title: "Reste",
      dataIndex: "reste",
      align: "right",
      render: (n) => <span className={n > 0 ? "font-semibold text-orange-600" : "text-slate-400"}>{argent(n, devise)}</span>,
      sorter: (a, b) => a.reste - b.reste,
    },
    {
      title: "Statut",
      dataIndex: "statut",
      align: "center",
      render: (s: StatutVente) => <Pastille ton={TON_STATUT[s]}>{LIBELLES_STATUT[s]}</Pastille>,
    },
  ];

  const ligneDetail = (v: Vente) => (
    <div className="grid gap-4 rounded-xl bg-purple-50/60 p-3 md:grid-cols-[2fr_1fr]">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
            <th className="pb-1">Produit</th>
            <th className="pb-1 text-right">Qté</th>
            <th className="pb-1 text-right">Prix</th>
            <th className="pb-1 text-right">Total</th>
            {!estLivreur && <th className="pb-1 text-right">Marge</th>}
          </tr>
        </thead>
        <tbody>
          {v.lignes.map((l, i) => (
            <tr key={i} className="border-t border-purple-100">
              <td className={`py-1 ${l.quantite === 0 ? "text-slate-400 line-through" : "text-slate-700"}`}>{l.nom}</td>
              <td className="py-1 text-right">{fmt(l.quantite)}</td>
              <td className="py-1 text-right">{fmt(l.prix)}</td>
              <td className="py-1 text-right font-semibold">{fmt(l.total)}</td>
              {!estLivreur && <td className="py-1 text-right text-emerald-700">{fmt(l.marge)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-xs">
        {[
          ["Montant brut", v.montant_brut],
          ["Réductions", -v.reductions],
          ["Total HT", v.montant_ht],
          [`TVA${v.taux_tva ? ` (${fmt(v.taux_tva)} %)` : ""}`, v.montant_tva],
          ["Ancienne dette reportée", v.dette_ancienne],
          ["Retourné", v.montant_retourne],
          ["Remboursé", v.montant_rembourse],
        ]
          .filter(([libelle, n]) => Number(n) !== 0 || libelle === "Total HT")
          .map(([libelle, n]) => (
            <div key={String(libelle)} className="flex justify-between gap-2">
              <span className="text-slate-500">{libelle}</span>
              <span className="font-semibold text-slate-700">{argent(Number(n), devise)}</span>
            </div>
          ))}
        <div className="flex justify-between gap-2 border-t border-purple-200 pt-1">
          <span className="font-bold text-purple-950">Total TTC</span>
          <span className="font-bold text-purple-950">{argent(v.montant_ttc, devise)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <EnteteRapport
        icone={<Receipt size={20} />}
        titre="Rapport des ventes"
        description="Chiffre d'affaires, encaissements, reste à percevoir et marge sur la période."
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
          showSearch
          optionFilterProp="label"
          placeholder="Tous les clients"
          value={clientId}
          onChange={setClientId}
          options={options?.clients.map((c) => ({ value: c.id, label: c.nom }))}
          className="w-full sm:w-44"
        />
        {!estLivreur && (
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Tous les vendeurs"
            value={vendeurId}
            onChange={setVendeurId}
            options={options?.vendeurs.map((c) => ({ value: c.id, label: c.nom }))}
            className="w-full sm:w-44"
          />
        )}
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Tous les produits"
          value={produitId}
          onChange={setProduitId}
          options={options?.produits.map((c) => ({ value: c.id, label: c.nom }))}
          className="w-full sm:w-48"
        />
        <Select
          allowClear
          placeholder="Tous les statuts"
          value={statut}
          onChange={setStatut}
          options={(["paye", "partiel", "non_paye"] as StatutVente[]).map((s) => ({ value: s, label: LIBELLES_STATUT[s] }))}
          className="w-full sm:w-36"
        />
        <Input
          allowClear
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Facture, client…"
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
            libelle="Chiffre d'affaires TTC"
            valeur={argent(t.ttc, devise)}
            detail={`HT ${fmt(t.ht)} · TVA ${fmt(t.tva)}`}
            icone={<TrendingUp size={16} />}
          />
          <CarteChiffre
            ton="vert"
            libelle="Encaissé"
            valeur={argent(t.paye, devise)}
            detail={t.ttc ? `${fmt(Math.round((t.paye / t.ttc) * 1000) / 10)} % du chiffre d'affaires` : "—"}
            icone={<Wallet size={16} />}
          />
          <CarteChiffre
            ton={t.reste > 0 ? "orange" : "gris"}
            libelle="Reste à percevoir"
            valeur={argent(t.reste, devise)}
            detail={`${fmt(ventes.filter((v) => v.reste > 0).length)} vente(s) à solder`}
            icone={<HandCoins size={16} />}
          />
          {estLivreur ? (
            <CarteChiffre
              libelle="Ventes"
              valeur={fmt(t.ventes)}
              detail={`${fmt(t.articles)} articles`}
              icone={<ShoppingCart size={16} />}
            />
          ) : (
            <CarteChiffre
              libelle="Marge brute"
              valeur={argent(t.marge, devise)}
              detail={`${fmt(Math.round(t.tauxMarge * 10) / 10)} % du HT`}
              icone={<Coins size={16} />}
            />
          )}
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {!estLivreur && (
            <CarteChiffre ton="gris" libelle="Ventes" valeur={fmt(t.ventes)} detail={`${fmt(t.articles)} articles`} icone={<ShoppingCart size={16} />} />
          )}
          <CarteChiffre
            ton="gris"
            libelle="Panier moyen"
            valeur={argent(t.ventes ? Math.round(t.ttc / t.ventes) : 0, devise)}
            icone={<Receipt size={16} />}
          />
          <CarteChiffre ton={t.reductions > 0 ? "orange" : "gris"} libelle="Réductions" valeur={argent(t.reductions, devise)} icone={<BadgePercent size={16} />} />
          <CarteChiffre
            ton={t.rembourse > 0 ? "rouge" : "gris"}
            libelle="Remboursé"
            valeur={argent(t.rembourse, devise)}
            detail={`Retours : ${fmt(t.retourne)}`}
            icone={<HandCoins size={16} />}
          />
        </div>

        <div className="mb-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Section titre="Chiffre d'affaires par jour" note={libellePeriode(periode)}>
            {donnees?.par_jour.length ? (
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={donnees.par_jour.map((j) => ({ ...j, jour: dayjs(j.date).format("DD/MM") }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede9fe" />
                    <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(n) => fmt(n)} width={70} />
                    <RTooltip
                      cursor={{ fill: "#f5f3ff" }}
                      formatter={(n: number) => [argent(n, devise), "Chiffre d'affaires"]}
                    />
                    <Bar dataKey="montant" maxBarSize={36} radius={[6, 6, 0, 0]}>
                      {donnees.par_jour.map((j, i) => (
                        <Cell key={j.date} fill={COULEURS_JOURS[i % COULEURS_JOURS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="Aucune vente sur la période" />
            )}
          </Section>
          <Section titre="Produits les plus vendus">
            {donnees?.top_produits.length ? (
              <ul className="m-0 list-none space-y-2 p-0">
                {donnees.top_produits.slice(0, 6).map((p, i) => {
                  const max = donnees.top_produits[0].montant || 1;
                  return (
                    <li key={p.nom}>
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="truncate font-semibold text-slate-700">
                          {i + 1}. {p.nom}
                        </span>
                        <span className="shrink-0 text-slate-500">
                          {fmt(p.quantite)} · <b className="text-purple-950">{fmt(p.montant)}</b>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-purple-100">
                        <div className="h-1.5 rounded-full" style={{ width: `${(p.montant / max) * 100}%`, backgroundColor: PURPLE_950 }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty description="Aucun produit vendu" />
            )}
          </Section>
        </div>

        <Section titre="Détail des ventes" note={`${fmt(ventes.length)} vente(s) · cliquez sur une ligne pour voir les produits`}>
          <Table
            rowKey="id"
            size="middle"
            columns={colonnes}
            dataSource={ventes}
            expandable={{ expandedRowRender: ligneDetail, expandRowByClick: true }}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (n) => `${n} vente(s)` }}
            scroll={{ x: 820 }}
            locale={{ emptyText: <Empty description="Aucune vente pour cette sélection" /> }}
            summary={() =>
              ventes.length ? (
                <Table.Summary.Row className="bg-purple-50 font-bold text-purple-950">
                  <Table.Summary.Cell index={0} />
                  <Table.Summary.Cell index={1}>Total</Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                  <Table.Summary.Cell index={3} align="right">{fmt(t.articles)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">{argent(t.ttc, devise)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">{argent(t.paye, devise)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">{argent(t.reste, devise)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={7} />
                </Table.Summary.Row>
              ) : null
            }
          />
        </Section>
      </Spin>
    </div>
  );
};

export default SalesReport;
