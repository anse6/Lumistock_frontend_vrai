// Page Finance : la comptabilité du magasin reconstituée à partir des ventes,
// paiements, retours, charges, approvisionnements, pertes et immobilisations.
// Tableau de bord, compte de résultat comparé, trésorerie et TVA, bilan
// simplifié, journal comptable SYSCOHADA (export pour l'expert-comptable).
import React, { useEffect, useMemo, useState } from "react";
import { useOngletUrl } from "../../hooks/useOngletUrl";
import { App, Button, DatePicker, Empty, InputNumber, Progress, Spin, Table, Tabs, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BookOpen,
  Building2,
  CalendarClock,
  Coins,
  Landmark,
  ArrowLeftRight as Banque,
  LayoutDashboard,
  Lock,
  PiggyBank,
  Receipt,
  Scale,
  ShieldCheck,
  Truck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import PageTitle from "../../Components/PageTitle";
import {
  ActionsRapport,
  argent,
  BarreFiltres,
  CarteChiffre,
  ChoixPeriode,
  dateCourte,
  EnteteRapport,
  fmt,
  libellePeriode,
  paramsPeriode,
  periodeDe,
  PURPLE_950,
  Section,
  useRapport,
} from "../Reports/ReportUi";
import type { Periode } from "../Reports/ReportUi";
import { MOIS_COURTS } from "../Reports/reportsApi";
import { exporterCsv, genererRapportPdf, nomFichier, ROUGE, VERT } from "../Reports/reportPdf";
import { enregistrerParametres, getJournal, getSynthese, messageErreur } from "../Charges/chargeService";
import type { Ecriture, JournalComptable, LigneResultat, Montant, SyntheseFinance } from "../Charges/types";
import { ThemeFinance, useDevise, Variation, variation } from "../Charges/financeUi";
import AssetManagement from "../Charges/AssetManagement";
import { formatTaux, oublierFiscalite } from "../Charges/financeUi";
import BilanSyscohada, { lignesPdfBilan, ORDRE_ACTIF, ORDRE_PASSIF } from "./BilanSyscohada";
import Fiscalite from "./Fiscalite";
import Financements from "./Financements";
import FacturesFournisseurs from "./FacturesFournisseurs";
import Rapprochement from "./Rapprochement";
import Cloture from "./Cloture";
import { getClotures } from "../Charges/chargeService";
import useCompteConnecte from "../../hooks/useCompteConnecte";

const CLE_ONGLET = "finance_onglet";
const JOURNAUX: Record<Ecriture["journal"], { libelle: string; couleur: string }> = {
  VT: { libelle: "Ventes", couleur: "purple" },
  AC: { libelle: "Achats / charges", couleur: "orange" },
  CA: { libelle: "Caisse", couleur: "green" },
  MM: { libelle: "Mobile money", couleur: "gold" },
  BQ: { libelle: "Banque", couleur: "blue" },
  OD: { libelle: "Opérations diverses", couleur: "default" },
};

const ONGLETS_FINANCE = [
  "tableau", "resultat", "tresorerie", "impots", "bilan", "journal",
  "fournisseurs", "rapprochement", "immobilisations", "financements", "cloture",
] as const;

// ======================================================================== page
const FinanceIndex: React.FC = () => {
  const devise = useDevise();
  // Onglet relié à l'adresse (?onglet=journal) : le menu latéral ouvre l'onglet voulu.
  const [onglet, changerOnglet] = useOngletUrl(ONGLETS_FINANCE, "tableau", CLE_ONGLET);
  const [preset, setPreset] = useState("mois");
  const [periode, setPeriode] = useState<Periode>(periodeDe("mois"));
  const params = paramsPeriode(periode);
  const { donnees, chargement, recharger } = useRapport<SyntheseFinance>(
    (signal) => getSynthese(params.debut, params.fin, signal),
    JSON.stringify(params),
  );

  const [verrou, setVerrou] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    getClotures()
      .then((e) => setVerrou(e.date_verrouillage))
      .catch(() => undefined);
  }, [version]);
  const actualiser = () => {
    oublierFiscalite();
    recharger();
    setVersion((v) => v + 1);
  };

  const libelle = (icone: React.ReactNode, texte: string) => (
    <span className="flex items-center gap-2">
      {icone}
      {texte}
    </span>
  );
  const vue = (contenu: (d: SyntheseFinance) => React.ReactNode) => (
    <Spin spinning={chargement}>{donnees ? contenu(donnees) : <div className="h-64" />}</Spin>
  );
  const onglets = [
    { key: "tableau", label: libelle(<LayoutDashboard size={16} />, "Tableau de bord"), children: vue((d) => <TableauDeBord d={d} devise={devise} />) },
    {
      key: "resultat",
      label: libelle(<Scale size={16} />, "Compte de résultat"),
      children: vue((d) => <CompteResultat d={d} devise={devise} periode={periode} />),
    },
    {
      key: "tresorerie",
      label: libelle(<Wallet size={16} />, "Trésorerie et TVA"),
      children: vue((d) => <Tresorerie d={d} devise={devise} onChange={actualiser} allerA={changerOnglet} />),
    },
    {
      key: "impots",
      label: libelle(<Landmark size={16} />, "Impôts et taxes"),
      children: <Fiscalite devise={devise} onChange={actualiser} />,
    },
    { key: "bilan", label: libelle(<Scale size={16} />, "Bilan"), children: vue((d) => <Bilan d={d} devise={devise} periode={periode} />) },
    { key: "journal", label: libelle(<BookOpen size={16} />, "Journal comptable"), children: <Journal periode={periode} devise={devise} /> },
    {
      key: "fournisseurs",
      label: libelle(<Truck size={16} />, "Factures fournisseurs"),
      children: <FacturesFournisseurs devise={devise} onChange={actualiser} />,
    },
    {
      key: "rapprochement",
      label: libelle(<Banque size={16} />, "Rapprochement bancaire"),
      children: <Rapprochement periode={periode} devise={devise} onChange={actualiser} />,
    },
    {
      key: "immobilisations",
      label: libelle(<Building2 size={16} />, "Immobilisations"),
      children: <AssetManagement devise={devise} onChange={actualiser} />,
    },
    {
      key: "financements",
      label: libelle(<PiggyBank size={16} />, "Capital et emprunts"),
      children: <Financements devise={devise} onChange={actualiser} />,
    },
    {
      key: "cloture",
      label: libelle(<ShieldCheck size={16} />, "Clôture et règles"),
      children: <Cloture devise={devise} onChange={actualiser} />,
    },
  ];

  return (
    <ThemeFinance>
      <PageTitle>Finance</PageTitle>
      <div className="min-h-screen bg-white p-2 sm:p-6">
        <EnteteRapport
          icone={<TrendingUp size={20} />}
          titre="Finance et comptabilité"
          description="Résultat, trésorerie, TVA et bilan calculés automatiquement à partir de vos ventes, charges et stocks."
        />
        <BarreFiltres>
          <ChoixPeriode
            preset={preset}
            periode={periode}
            onChange={(p, per) => {
              setPreset(p);
              setPeriode(per);
            }}
          />
          {verrou && (
            <button
              type="button"
              onClick={() => changerOnglet("cloture")}
              className="flex items-center gap-1.5 rounded-full bg-purple-950 px-3 py-1 text-xs font-semibold text-white"
            >
              <Lock size={12} /> Clôturé jusqu'au {dateCourte(verrou)}
            </button>
          )}
          {donnees && (
            <span className="text-xs text-slate-500">
              Comparée au {dateCourte(donnees.precedente.debut)} – {dateCourte(donnees.precedente.fin)}
            </span>
          )}
        </BarreFiltres>
        <Tabs activeKey={onglet} onChange={changerOnglet} items={onglets} destroyInactiveTabPane />
      </div>
    </ThemeFinance>
  );
};

// ======================================================================== tableau de bord
const TableauDeBord: React.FC<{ d: SyntheseFinance; devise: string }> = ({ d, devise }) => {
  const i = d.indicateurs;
  const seuil = i.seuil_rentabilite;
  const atteint = seuil != null && i.chiffre_affaires >= seuil;
  const mois = d.evolution.mois.map((m) => ({ ...m, nom: MOIS_COURTS[m.mois - 1] }));
  return (
    <div>
      {(d.a_payer.en_retard > 0 || !d.tresorerie.configure) && (
        <div className="mb-4 space-y-2">
          {d.a_payer.en_retard > 0 && (
            <Link
              to="/admin/dashboard/charges"
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
            >
              <CalendarClock size={16} />
              <span>
                <b>{d.a_payer.en_retard} charge(s) en retard</b> pour {argent(d.a_payer.montant_en_retard, devise)} — voir les charges
              </span>
            </Link>
          )}
          {!d.tresorerie.configure && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              <PiggyBank size={16} />
              <span>
                Indiquez l'argent disponible en caisse et en banque à une date de départ (onglet <b>Trésorerie et TVA</b>) pour
                obtenir un solde de trésorerie exact.
              </span>
            </div>
          )}
        </div>
      )}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CarteChiffre
          principale
          libelle="Chiffre d'affaires HT"
          valeur={argent(i.chiffre_affaires, devise)}
          detail={
            <span>
              {i.ventes} vente(s) ·{" "}
              {variation(i.chiffre_affaires, i.chiffre_affaires_precedent) === null
                ? "pas de comparaison"
                : `${(variation(i.chiffre_affaires, i.chiffre_affaires_precedent) || 0) > 0 ? "+" : ""}${variation(i.chiffre_affaires, i.chiffre_affaires_precedent)} % vs période précédente`}
            </span>
          }
          icone={<Coins size={16} />}
        />
        <CarteChiffre
          ton="vert"
          libelle="Marge commerciale"
          valeur={argent(i.marge, devise)}
          detail={
            <span>
              Taux de marge {fmt(i.taux_marge)} % · <Variation actuel={i.marge} precedent={i.marge_precedente} />
            </span>
          }
          icone={<TrendingUp size={16} />}
        />
        <CarteChiffre
          ton="orange"
          libelle="Charges"
          valeur={argent(i.charges, devise)}
          detail={
            <span>
              Pertes, frais, salaires, amortissements · <Variation actuel={i.charges} precedent={i.charges_precedentes} inverse />
            </span>
          }
          icone={<Receipt size={16} />}
        />
        <CarteChiffre
          ton={i.resultat_net >= 0 ? "vert" : "rouge"}
          libelle={i.resultat_net >= 0 ? "Bénéfice net" : "Perte nette"}
          valeur={argent(i.resultat_net, devise)}
          detail={
            <span>
              {fmt(i.taux_resultat)} % du CA · <Variation actuel={i.resultat_net} precedent={i.resultat_net_precedent} />
            </span>
          }
          icone={i.resultat_net >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Section titre={`Évolution mensuelle ${d.evolution.annee}`} note="Chiffre d'affaires, charges et résultat">
          {mois.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={mois}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede9fe" />
                  <XAxis dataKey="nom" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(n) => fmt(n)} width={72} />
                  <RTooltip cursor={{ fill: "#f5f3ff" }} formatter={(n: number, nom: string) => [argent(n, devise), nom]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="#cbd5e1" />
                  <Bar dataKey="ca" name="Chiffre d'affaires" fill={PURPLE_950} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="charges" name="Charges" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Line dataKey="resultat" name="Résultat" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty description="Aucune donnée cette année" />
          )}
        </Section>
        <div className="grid gap-4">
          <Section titre="Seuil de rentabilité" note="Chiffre d'affaires qui couvre toutes les charges">
            {seuil == null ? (
              <p className="m-0 text-sm text-slate-500">Pas encore calculable : aucune marge sur la période.</p>
            ) : (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl font-bold text-purple-950">{argent(seuil, devise)}</span>
                  <span className={atteint ? "text-sm font-semibold text-emerald-600" : "text-sm font-semibold text-orange-600"}>
                    {atteint ? "Atteint" : `Il manque ${argent(seuil - i.chiffre_affaires, devise)}`}
                  </span>
                </div>
                <Progress
                  percent={Math.min(100, Math.round((i.chiffre_affaires / (seuil || 1)) * 100))}
                  strokeColor={atteint ? "#16a34a" : "#f97316"}
                  showInfo={false}
                />
                <p className="m-0 text-xs text-slate-500">
                  Charges fixes {argent(i.charges_fixes, devise)} ÷ taux de marge {fmt(i.taux_marge)} %.
                  {i.point_mort_jours != null && atteint && ` Seuil atteint en ${fmt(i.point_mort_jours)} jour(s) sur ${d.periode.jours}.`}
                </p>
              </div>
            )}
          </Section>
          <div className="grid grid-cols-2 gap-3">
            <CarteChiffre
              ton={d.tresorerie.solde_fin >= 0 ? "violet" : "rouge"}
              libelle="Trésorerie"
              valeur={argent(d.tresorerie.solde_fin, devise)}
              detail={`Flux ${d.tresorerie.net >= 0 ? "+" : ""}${fmt(d.tresorerie.net)}`}
              icone={<Wallet size={16} />}
            />
            <CarteChiffre
              ton="gris"
              libelle="À encaisser"
              valeur={argent(d.creances, devise)}
              detail={`À payer : ${fmt(d.a_payer.montant + d.a_payer.montant_factures)}`}
              icone={<Coins size={16} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================================================================== compte de résultat
const CompteResultat: React.FC<{ d: SyntheseFinance; devise: string; periode: Periode }> = ({ d, devise, periode }) => {
  const style = (l: LigneResultat) =>
    l.type === "resultat"
      ? "bg-purple-950 font-bold text-white"
      : l.type === "total"
        ? "bg-purple-50 font-bold text-purple-950"
        : l.type === "detail"
          ? "text-slate-500"
          : "font-semibold text-slate-800";
  const signe = (l: LigneResultat, n: number) => (l.type === "charge" || l.type === "detail" ? -n : n);
  const colonnes: ColumnsType<LigneResultat> = [
    { title: "Compte", dataIndex: "compte", width: 90, render: (c: string) => <span className="font-mono text-xs">{c}</span> },
    { title: "Rubrique", dataIndex: "libelle", render: (t: string, l) => <span style={{ paddingLeft: l.niveau * 18 }}>{t}</span> },
    { title: "Période", dataIndex: "montant", align: "right", render: (n: number, l) => argent(signe(l, n), devise) },
    { title: "Période précédente", dataIndex: "precedent", align: "right", render: (n: number, l) => argent(signe(l, n), devise) },
    {
      title: "Variation",
      key: "variation",
      align: "right",
      render: (_, l) =>
        l.type === "detail" ? null : (
          <Variation actuel={l.montant} precedent={l.precedent} inverse={l.type === "charge"} />
        ),
    },
  ];
  const fichier = nomFichier("Compte de resultat", periode.debut.format("YYYY-MM-DD"), periode.fin.format("YYYY-MM-DD"));
  const pdf = (mode: "download" | "print") =>
    genererRapportPdf(
      {
        fichier: `${fichier}.pdf`,
        kicker: "COMPTABILITÉ",
        titre: "COMPTE DE RÉSULTAT",
        pastille: libellePeriode(periode),
        signatures: true,
        chiffres: [
          ["Chiffre d'affaires HT", argent(d.indicateurs.chiffre_affaires, devise)],
          ["Marge commerciale", argent(d.indicateurs.marge, devise)],
          ["Excédent brut d'exploitation", argent(d.indicateurs.ebe, devise)],
          ["Résultat net", argent(d.indicateurs.resultat_net, devise)],
        ],
        sections: [
          {
            titre: "Compte de résultat (plan SYSCOHADA)",
            note: `Comparé au ${dateCourte(d.precedente.debut)} – ${dateCourte(d.precedente.fin)}`,
            lignes: d.compte_resultat,
            colonnes: [
              { titre: "Compte", largeur: 12, valeur: (l: LigneResultat) => l.compte },
              {
                titre: "Rubrique",
                largeur: 46,
                valeur: (l: LigneResultat) => `${l.niveau ? "   " : ""}${l.libelle}`,
                gras: (l: LigneResultat) => l.type === "total" || l.type === "resultat",
              },
              {
                titre: `Période (${devise})`,
                largeur: 20,
                align: "right",
                valeur: (l: LigneResultat) => fmt(signe(l, l.montant)),
                gras: (l: LigneResultat) => l.type !== "detail",
                couleur: (l: LigneResultat) => (l.type === "resultat" ? (l.montant >= 0 ? VERT : ROUGE) : undefined),
              },
              { titre: "Précédente", largeur: 20, align: "right", valeur: (l: LigneResultat) => fmt(signe(l, l.precedent)) },
            ],
          },
        ],
      },
      mode,
    );
  const excel = () =>
    exporterCsv(
      `${fichier}.csv`,
      ["Compte", "Rubrique", "Période", "Période précédente"],
      d.compte_resultat.map((l) => [l.compte, l.libelle, signe(l, l.montant), signe(l, l.precedent)]),
    );
  return (
    <Section titre="Compte de résultat" note={<ActionsRapport onPdf={pdf} onExcel={excel} />}>
      <Table
        rowKey="cle"
        size="small"
        columns={colonnes}
        dataSource={d.compte_resultat}
        pagination={false}
        rowClassName={style}
        scroll={{ x: 700 }}
      />
      <p className="mb-0 mt-3 text-xs text-slate-500">
        Les ventes sont comptées hors TVA, après réductions et retours. Le coût des marchandises vendues est valorisé au prix
        d'achat. Les charges sont comptées à leur date, qu'elles soient payées ou non.
      </p>
    </Section>
  );
};

// ======================================================================== trésorerie et TVA
const ListeMontants: React.FC<{ lignes: Montant[]; devise: string; signe?: "+" | "-" }> = ({ lignes, devise, signe }) => (
  <ul className="m-0 list-none divide-y divide-slate-100 p-0">
    {lignes.map((l) => (
      <li key={l.libelle} className="flex justify-between gap-3 py-2 text-sm">
        <span className="text-slate-600">{l.libelle}</span>
        <b className={signe === "-" ? "text-red-600" : signe === "+" ? "text-emerald-700" : "text-purple-950"}>
          {signe === "-" && l.montant ? "− " : ""}
          {argent(l.montant, devise)}
        </b>
      </li>
    ))}
  </ul>
);

const COMPTES_DEPART: { compte: "571" | "521" | "552"; libelle: string }[] = [
  { compte: "571", libelle: "Caisse (espèces)" },
  { compte: "521", libelle: "Banque" },
  { compte: "552", libelle: "Mobile money" },
];

const Tresorerie: React.FC<{ d: SyntheseFinance; devise: string; onChange: () => void; allerA: (cle: string) => void }> = ({
  d,
  devise,
  onChange,
  allerA,
}) => {
  const { message } = App.useApp();
  const t = d.tresorerie;
  // Droit « Paramètres comptables » (Paramètres > Accès).
  const estAdmin = useCompteConnecte().peut("finances.parametres");
  const [soldes, setSoldes] = useState<Record<"571" | "521" | "552", number>>(
    t.soldes_ouverture || { "571": t.solde_ouverture, "521": 0, "552": 0 },
  );
  const [date, setDate] = useState(t.date_ouverture ? dayjs(t.date_ouverture) : dayjs().startOf("year"));
  const [envoi, setEnvoi] = useState(false);
  const totalDepart = soldes["571"] + soldes["521"] + soldes["552"];
  const enregistrer = async () => {
    setEnvoi(true);
    try {
      await enregistrerParametres(totalDepart, date.format("YYYY-MM-DD"), soldes);
      message.success("Solde de départ enregistré.");
      onChange();
    } catch (err) {
      message.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section titre="Flux de trésorerie de la période" note="Argent réellement entré et sorti">
        <div className="mb-3 flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-600">Solde au début de la période</span>
          <b className="text-purple-950">{argent(t.solde_debut, devise)}</b>
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Entrées</div>
        <ListeMontants lignes={t.entrees} devise={devise} signe="+" />
        <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sorties</div>
        <ListeMontants lignes={t.sorties} devise={devise} signe="-" />
        <div className="mt-3 flex justify-between rounded-xl px-3 py-2 text-sm text-white" style={{ backgroundColor: PURPLE_950 }}>
          <span>Solde en fin de période</span>
          <b>{argent(t.solde_fin, devise)}</b>
        </div>
        {t.soldes_fin && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {t.soldes_fin.map((c) => (
              <div key={c.compte} className="rounded-xl border border-purple-100 px-3 py-2">
                <div className="text-[11px] text-slate-500">
                  <span className="font-mono font-bold text-purple-900">{c.compte}</span> {c.libelle}
                </div>
                <div className={`text-sm font-bold ${c.solde < 0 ? "text-red-600" : "text-purple-950"}`}>{fmt(c.solde)}</div>
              </div>
            ))}
          </div>
        )}
        <p className="mb-0 mt-2 text-xs text-slate-500">
          Les réapprovisionnements sans facture fournisseur sont considérés comme payés comptant (caisse) le jour de l'entrée en stock.
        </p>
      </Section>
      <div className="grid content-start gap-4">
        <Section titre="Par compte de trésorerie" note="Mouvements de la période">
          {t.par_compte.length ? (
            <Table
              rowKey="compte"
              size="small"
              pagination={false}
              dataSource={t.par_compte}
              columns={[
                { title: "Compte", key: "c", render: (_, c) => <span><span className="font-mono text-xs">{c.compte}</span> {c.libelle}</span> },
                { title: "Entrées", dataIndex: "entrees", align: "right", render: (n: number) => fmt(n) },
                { title: "Sorties", dataIndex: "sorties", align: "right", render: (n: number) => fmt(n) },
                {
                  title: "Net",
                  dataIndex: "net",
                  align: "right",
                  render: (n: number) => <b className={n < 0 ? "text-red-600" : "text-emerald-700"}>{fmt(n)}</b>,
                },
              ]}
            />
          ) : (
            <Empty description="Aucun mouvement d'argent" />
          )}
        </Section>
        <Section
          titre="TVA de la période"
          note={
            <Button size="small" type="link" className="!p-0" onClick={() => allerA("impots")}>
              Déclarations et paiements →
            </Button>
          }
        >
          <p className="mt-0 text-xs text-slate-500">
            Taux du pays : <b className="text-purple-950">{formatTaux(d.tva.taux)}</b>
            {d.tva.assujetti ? "" : " · magasin déclaré non assujetti"}
          </p>
          <ListeMontants
            devise={devise}
            lignes={[
              { libelle: "TVA collectée sur les ventes (4431)", montant: d.tva.collectee },
              { libelle: "TVA récupérable sur les charges (4452)", montant: d.tva.deductible_charges ?? d.tva.deductible },
              { libelle: "TVA récupérable sur les factures fournisseurs (4452)", montant: d.tva.deductible_achats ?? 0 },
              { libelle: "TVA récupérable sur les immobilisations (4451)", montant: d.tva.deductible_immobilisations ?? 0 },
            ]}
          />
          <div
            className={`mt-2 flex justify-between rounded-xl px-3 py-2 text-sm font-bold ${d.tva.a_reverser >= 0 ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            <span>{d.tva.a_reverser >= 0 ? "TVA nette de la période" : "Crédit de TVA de la période"}</span>
            <span>{argent(Math.abs(d.tva.a_reverser), devise)}</span>
          </div>
        </Section>
        <Section titre="Solde de départ" note={t.configure ? `Depuis le ${dateCourte(t.date_ouverture)}` : "Non renseigné"}>
          <p className="mt-0 text-xs text-slate-500">
            Argent disponible sur chaque compte à la date de départ. Les soldes suivants sont calculés à partir des opérations enregistrées
            depuis cette date.
          </p>
          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold text-slate-500">Date</div>
            <DatePicker value={date} onChange={(v) => v && setDate(v)} allowClear={false} format="DD/MM/YYYY" disabled={!estAdmin} />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {COMPTES_DEPART.map((c) => (
              <div key={c.compte}>
                <div className="mb-1 text-xs font-semibold text-slate-500">
                  {c.libelle} ({devise})
                </div>
                <InputNumber
                  value={soldes[c.compte]}
                  onChange={(v) => setSoldes((s) => ({ ...s, [c.compte]: Number(v) || 0 }))}
                  className="!w-full"
                  disabled={!estAdmin}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-slate-600">
              Total : <b className="text-purple-950">{argent(totalDepart, devise)}</b>
            </span>
            {estAdmin ? (
              <Button type="primary" loading={envoi} onClick={enregistrer}>
                Enregistrer
              </Button>
            ) : (
              <span className="text-xs text-slate-400">Réservé à l'administrateur</span>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

// ======================================================================== bilan
const Bilan: React.FC<{ d: SyntheseFinance; devise: string; periode: Periode }> = ({ d, devise, periode }) => {
  const passif = (code: string) => d.bilan.passif.find((p) => p.compte === code)?.montant ?? 0;
  const pdf = (mode: "download" | "print") =>
    genererRapportPdf(
      {
        fichier: `${nomFichier("Bilan", periode.fin.format("YYYY-MM-DD"))}.pdf`,
        kicker: "COMPTABILITÉ – SYSCOHADA",
        titre: "BILAN",
        pastille: `Au ${periode.fin.format("DD/MM/YYYY")}`,
        signatures: true,
        chiffres: [
          ["Total du bilan", argent(d.bilan.total, devise)],
          ["Trésorerie", argent(d.tresorerie.solde_fin, devise)],
          ["Capitaux propres", argent(d.bilan.passif.filter((p) => p.rubrique === "capitaux").reduce((s, p) => s + p.montant, 0), devise)],
          ["Dettes fournisseurs", argent(passif("401"), devise)],
        ],
        sections: [
          {
            titre: "Actif",
            lignes: lignesPdfBilan(d.bilan.actif, ORDRE_ACTIF),
            colonnes: colonnesBilan(devise, true),
            total: ["", "TOTAL ACTIF", "", "", fmt(d.bilan.total_actif ?? d.bilan.total)],
          },
          {
            titre: "Passif",
            lignes: lignesPdfBilan(d.bilan.passif, ORDRE_PASSIF),
            colonnes: colonnesBilan(devise, false),
            total: ["", "TOTAL PASSIF", fmt(d.bilan.total_passif ?? d.bilan.total)],
          },
        ],
      },
      mode,
    );
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 max-w-3xl text-xs text-slate-500">
          Situation au {periode.fin.format("DD/MM/YYYY")}, au format SYSCOHADA. Le stock est valorisé au prix d'achat et reconstitué à la
          date ; l'impôt sur le résultat de l'année en cours est une estimation.
        </p>
        <ActionsRapport onPdf={pdf} />
      </div>
      <BilanSyscohada bilan={d.bilan} devise={devise} date={periode.fin.format("DD/MM/YYYY")} />
    </div>
  );
};

type LignePdfBilan = ReturnType<typeof lignesPdfBilan>[number];
const colonnesBilan = (devise: string, avecBrut: boolean) => [
  { titre: "Compte", largeur: 10, valeur: (l: LignePdfBilan) => ("compte" in l && l.compte) || "" },
  { titre: "Poste", largeur: avecBrut ? 45 : 65, valeur: (l: LignePdfBilan) => l.libelle, gras: (l: LignePdfBilan) => l.niveau === 0 },
  ...(avecBrut
    ? [
        { titre: "Brut", largeur: 15, align: "right" as const, valeur: (l: LignePdfBilan) => ("brut" in l && l.brut !== undefined ? fmt(l.brut) : "") },
        {
          titre: "Amort.",
          largeur: 15,
          align: "right" as const,
          valeur: (l: LignePdfBilan) => ("amortissements" in l && l.amortissements !== undefined ? fmt(l.amortissements) : ""),
        },
      ]
    : []),
  { titre: `Net (${devise})`, largeur: avecBrut ? 15 : 25, align: "right" as const, valeur: (l: LignePdfBilan) => fmt(l.montant), gras: true },
];

// ======================================================================== journal
interface LigneJournal {
  cle: string;
  date: string;
  journal: Ecriture["journal"];
  piece: string;
  libelle: string;
  compte: string;
  intitule: string;
  debit: number;
  credit: number;
}

const Journal: React.FC<{ periode: Periode; devise: string }> = ({ periode, devise }) => {
  const params = paramsPeriode(periode);
  const [journal, setJournal] = useState<string>();
  const { donnees, chargement } = useRapport<JournalComptable>(
    (signal) => getJournal(params.debut, params.fin, signal),
    JSON.stringify(params),
  );
  const lignes = useMemo<LigneJournal[]>(
    () =>
      (donnees?.ecritures || [])
        .filter((e) => !journal || e.journal === journal)
        .flatMap((e, n) =>
          e.lignes.map((l, k) => ({ cle: `${n}-${k}`, date: e.date, journal: e.journal, piece: e.piece, libelle: e.libelle, ...l })),
        ),
    [donnees, journal],
  );
  const fichier = nomFichier("Journal comptable", params.debut, params.fin);
  const excel = () =>
    exporterCsv(
      `${fichier}.csv`,
      ["Date", "Journal", "Pièce", "Compte", "Intitulé du compte", "Libellé", "Débit", "Crédit"],
      lignes.map((l) => [dateCourte(l.date), l.journal, l.piece, l.compte, l.intitule, l.libelle, l.debit, l.credit]),
    );
  // PDF : le journal des écritures (filtré comme à l'écran), puis la balance.
  const totalLignes = (champ: "debit" | "credit") => lignes.reduce((s, l) => s + l[champ], 0);
  const pdf = (mode: "download" | "print") =>
    genererRapportPdf(
      {
        fichier: `${fichier}.pdf`,
        kicker: "COMPTABILITÉ",
        titre: journal ? `JOURNAL ${JOURNAUX[journal as Ecriture["journal"]].libelle.toUpperCase()}` : "JOURNAL COMPTABLE",
        pastille: libellePeriode(periode),
        filtres: journal ? `journal ${JOURNAUX[journal as Ecriture["journal"]].libelle.toLowerCase()}` : "",
        chiffres: [
          ["Écritures", fmt(donnees?.totaux.ecritures)],
          ["Total débit", argent(donnees?.totaux.debit, devise)],
          ["Total crédit", argent(donnees?.totaux.credit, devise)],
          ["Équilibre", donnees && donnees.totaux.debit === donnees.totaux.credit ? "Oui" : "Non"],
        ],
        sections: [
          {
            titre: "Journal des écritures",
            note: `${fmt(lignes.length)} ligne(s)`,
            lignes,
            vide: "Aucune écriture sur la période",
            colonnes: [
              { titre: "Date", largeur: 10, valeur: (l: LigneJournal) => dateCourte(l.date) },
              { titre: "Jnl", largeur: 6, valeur: (l: LigneJournal) => l.journal },
              { titre: "Pièce", largeur: 12, valeur: (l: LigneJournal) => l.piece },
              {
                titre: "Compte",
                largeur: 22,
                valeur: (l: LigneJournal) => l.compte,
                sous: (l: LigneJournal) => l.intitule,
                gras: true,
              },
              { titre: "Libellé", largeur: 26, valeur: (l: LigneJournal) => l.libelle },
              { titre: "Débit", largeur: 12, align: "right", valeur: (l: LigneJournal) => (l.debit ? fmt(l.debit) : "") },
              { titre: "Crédit", largeur: 12, align: "right", valeur: (l: LigneJournal) => (l.credit ? fmt(l.credit) : "") },
            ],
            total: ["", "", "", "", "TOTAL", fmt(totalLignes("debit")), fmt(totalLignes("credit"))],
          },
          {
            titre: "Balance",
            lignes: donnees?.balance || [],
            colonnes: [
              { titre: "Compte", largeur: 12, valeur: (b: JournalComptable["balance"][number]) => b.compte, gras: true },
              { titre: "Intitulé", largeur: 40, valeur: (b: JournalComptable["balance"][number]) => b.intitule },
              { titre: "Débit", largeur: 16, align: "right", valeur: (b: JournalComptable["balance"][number]) => fmt(b.debit) },
              { titre: "Crédit", largeur: 16, align: "right", valeur: (b: JournalComptable["balance"][number]) => fmt(b.credit) },
              { titre: "Solde", largeur: 16, align: "right", valeur: (b: JournalComptable["balance"][number]) => fmt(b.solde), gras: true },
            ],
            total: ["", "TOTAL", fmt(donnees?.totaux.debit), fmt(donnees?.totaux.credit), ""],
          },
        ],
      },
      mode,
    );

  const colonnes: ColumnsType<LigneJournal> = [
    { title: "Date", dataIndex: "date", width: 100, render: (d: string) => dateCourte(d) },
    {
      title: "Jnl",
      dataIndex: "journal",
      width: 70,
      render: (j: Ecriture["journal"]) => (
        <Tooltip title={JOURNAUX[j].libelle}>
          <Tag color={JOURNAUX[j].couleur} className="!m-0">
            {j}
          </Tag>
        </Tooltip>
      ),
    },
    { title: "Pièce", dataIndex: "piece", width: 120, render: (p: string) => <span className="font-mono text-xs">{p}</span> },
    {
      title: "Compte",
      key: "compte",
      render: (_, l) => (
        <span>
          <span className="font-mono text-xs font-bold text-purple-950">{l.compte}</span> <span className="text-slate-500">{l.intitule}</span>
        </span>
      ),
    },
    { title: "Libellé", dataIndex: "libelle", ellipsis: true },
    { title: "Débit", dataIndex: "debit", align: "right", render: (n: number) => (n ? fmt(n) : "") },
    { title: "Crédit", dataIndex: "credit", align: "right", render: (n: number) => (n ? fmt(n) : "") },
  ];

  return (
    <Spin spinning={chargement}>
      <div className="mb-4 grid gap-4 xl:grid-cols-[5fr_2fr]">
        <Section
          titre="Journal des écritures"
          note={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">{fmt(donnees?.totaux.ecritures)} écriture(s)</span>
              {(Object.keys(JOURNAUX) as Ecriture["journal"][]).map((j) => (
                <Tag.CheckableTag key={j} checked={journal === j} onChange={(c) => setJournal(c ? j : undefined)}>
                  {JOURNAUX[j].libelle}
                </Tag.CheckableTag>
              ))}
              <ActionsRapport disabled={!donnees} onPdf={pdf} onExcel={excel} />
            </div>
          }
        >
          <Table
            rowKey="cle"
            size="small"
            columns={colonnes}
            dataSource={lignes}
            pagination={{ pageSize: 30, hideOnSinglePage: true, showSizeChanger: false }}
            scroll={{ x: 900 }}
            locale={{ emptyText: <Empty description="Aucune écriture sur la période" /> }}
            summary={() =>
              donnees && !journal ? (
                <Table.Summary.Row className="bg-purple-50 font-bold text-purple-950">
                  <Table.Summary.Cell index={0} colSpan={5}>
                    Total {donnees.totaux.debit === donnees.totaux.credit ? "(équilibré)" : "(déséquilibré)"}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">{fmt(donnees.totaux.debit)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">{fmt(donnees.totaux.credit)}</Table.Summary.Cell>
                </Table.Summary.Row>
              ) : null
            }
          />
        </Section>
        <Section titre="Balance des comptes">
          <Table
            rowKey="compte"
            size="small"
            pagination={false}
            dataSource={donnees?.balance || []}
            columns={[
              {
                title: "Compte",
                key: "compte",
                render: (_, b) => (
                  <Tooltip title={b.intitule}>
                    <span className="font-mono text-xs font-bold text-purple-950">{b.compte}</span>
                  </Tooltip>
                ),
              },
              { title: "Intitulé", dataIndex: "intitule", ellipsis: true },
              {
                title: "Solde",
                dataIndex: "solde",
                align: "right",
                render: (n: number) => <span className={n < 0 ? "text-red-600" : "text-slate-800"}>{fmt(n)}</span>,
              },
            ]}
          />
          <p className="mb-0 mt-2 text-[11px] text-slate-400">Solde = débit − crédit. Exportez le journal (Excel) pour votre expert-comptable.</p>
        </Section>
      </div>
    </Spin>
  );
};

export default FinanceIndex;
