// Page Charges : dépenses du magasin rattachées au plan comptable SYSCOHADA,
// payées ou à payer (échéances, retards), récurrentes (loyer, salaires…),
// avec la TVA récupérable. Elles alimentent la page Finance.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, DatePicker, Empty, Input, Modal, Popconfirm, Select, Spin, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { AlertTriangle, CalendarClock, CheckCircle2, Coins, Lock, Paperclip, Pencil, Plus, Receipt, Repeat, Search, Trash2, Wallet } from "lucide-react";
import dayjs from "dayjs";
import PageTitle from "../../Components/PageTitle";
import ChargeModal from "./ChargeModal";
import PiecesJointes from "./PiecesJointes";
import {
  CATEGORIES_CHARGES,
  categorieDe,
  createCharge,
  deleteCharge,
  genererChargesRecurrentes,
  getCharges,
  getClotures,
  libelleMode,
  MODES_REGLEMENT,
  messageErreur,
  payerCharge,
  RECURRENCES,
  updateCharge,
} from "./chargeService";
import type { Charge, CreateChargeDto } from "./types";
import { ThemeFinance, useDevise } from "./financeUi";
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
  Pastille,
  periodeDe,
  PURPLE_950,
  Section,
} from "../Reports/ReportUi";
import type { Periode } from "../Reports/ReportUi";
import { exporterCsv, genererRapportPdf, nomFichier, ORANGE, ROUGE, VERT } from "../Reports/reportPdf";

type Etat = "payee" | "a_payer" | "en_retard";

const etatDe = (c: Charge): Etat =>
  c.statut === "payee" ? "payee" : c.date_echeance && dayjs(c.date_echeance).isBefore(dayjs(), "day") ? "en_retard" : "a_payer";

const LIBELLES_ETAT: Record<Etat, string> = { payee: "Payée", a_payer: "À payer", en_retard: "En retard" };

const ChargesPage: React.FC = () => {
  const { message } = App.useApp();
  const devise = useDevise();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [edition, setEdition] = useState<Charge | null>(null);
  const [modale, setModale] = useState(false);
  const [aPayer, setAPayer] = useState<Charge | null>(null);
  const [reglement, setReglement] = useState({ mode: "cash", date: dayjs() });
  const [piecesDe, setPiecesDe] = useState<string | null>(null);
  const [verrou, setVerrou] = useState<string | null>(null);

  const [preset, setPreset] = useState("mois");
  const [periode, setPeriode] = useState<Periode>(periodeDe("mois"));
  const [categorie, setCategorie] = useState<string>();
  const [etat, setEtat] = useState<Etat>();
  const [recherche, setRecherche] = useState("");

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setCharges(await getCharges());
    } catch (err) {
      message.error(messageErreur(err, "Les charges n'ont pas pu être chargées."));
    } finally {
      setChargement(false);
    }
  }, [message]);

  useEffect(() => {
    charger();
    getClotures()
      .then((e) => setVerrou(e.date_verrouillage))
      .catch(() => undefined);
  }, [charger]);

  const chargePieces = charges.find((c) => c._id === piecesDe);

  const dansPeriode = useMemo(
    () =>
      charges.filter((c) => {
        const d = dayjs(c.date_charge);
        return !d.isBefore(periode.debut, "day") && !d.isAfter(periode.fin, "day");
      }),
    [charges, periode],
  );

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    // « À payer » et « En retard » : toutes les dettes, quelle que soit leur date.
    const base = etat && etat !== "payee" ? charges : dansPeriode;
    return base.filter(
      (c) =>
        (!categorie || c.categorie === categorie) &&
        (!etat || etatDe(c) === etat || (etat === "a_payer" && etatDe(c) === "en_retard")) &&
        (!q || `${c.nom} ${c.fournisseur} ${c.reference} ${c.description}`.toLowerCase().includes(q)),
    );
  }, [charges, dansPeriode, categorie, etat, recherche]);

  const t = useMemo(() => {
    const somme = (liste: Charge[], f: (c: Charge) => number = (c) => c.montant) => liste.reduce((s, c) => s + (Number(f(c)) || 0), 0);
    const dettes = charges.filter((c) => c.statut !== "payee");
    const retard = dettes.filter((c) => etatDe(c) === "en_retard");
    return {
      total: somme(lignes),
      tva: somme(lignes, (c) => c.montant_tva),
      payees: somme(lignes.filter((c) => c.statut === "payee")),
      dettes: somme(dettes),
      nbDettes: dettes.length,
      retard: somme(retard),
      nbRetard: retard.length,
    };
  }, [lignes, charges]);

  const parCategorie = useMemo(() => {
    const m = new Map<string, number>();
    lignes.forEach((c) => m.set(c.categorie, (m.get(c.categorie) || 0) + c.montant));
    return [...m.entries()].map(([cle, montant]) => ({ ...categorieDe(cle), montant })).sort((a, b) => b.montant - a.montant);
  }, [lignes]);

  // ---------------------------------------------------------------- actions
  const enregistrer = async (valeurs: CreateChargeDto) => {
    setEnregistrement(true);
    try {
      if (edition) await updateCharge(edition._id, valeurs);
      else await createCharge(valeurs);
      message.success(edition ? "Charge modifiée." : "Charge enregistrée.");
      setModale(false);
      charger();
    } catch (err) {
      message.error(messageErreur(err));
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async (id: string) => {
    try {
      await deleteCharge(id);
      message.success("Charge supprimée.");
      charger();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const confirmerPaiement = async () => {
    if (!aPayer) return;
    try {
      await payerCharge(aPayer._id, reglement.mode, reglement.date.format("YYYY-MM-DDTHH:mm:ss"));
      message.success("Paiement enregistré.");
      setAPayer(null);
      charger();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const recurrentes = async () => {
    try {
      const r = await genererChargesRecurrentes(dayjs().format("YYYY-MM"));
      message.success(r.charges.length ? r.message : "Les charges récurrentes du mois sont déjà créées.");
      if (r.charges.length) charger();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  // ---------------------------------------------------------------- exports
  const filtres = [
    categorie && categorieDe(categorie).label,
    etat && LIBELLES_ETAT[etat].toLowerCase(),
    recherche.trim() && `recherche « ${recherche.trim()} »`,
  ]
    .filter(Boolean)
    .join(", ");

  const pdf = (mode: "download" | "print") =>
    genererRapportPdf(
      {
        fichier: `${nomFichier("Charges", periode.debut.format("YYYY-MM-DD"), periode.fin.format("YYYY-MM-DD"))}.pdf`,
        kicker: "COMPTABILITÉ",
        titre: "ÉTAT DES CHARGES",
        pastille: libellePeriode(periode),
        filtres,
        signatures: true,
        chiffres: [
          ["Total TTC", argent(t.total, devise)],
          ["Dont TVA récupérable", argent(t.tva, devise)],
          ["Payées", argent(t.payees, devise)],
          ["Reste à payer (total)", argent(t.dettes, devise)],
        ],
        sections: [
          {
            titre: "Détail des charges",
            note: `${fmt(lignes.length)} charge(s)`,
            lignes,
            colonnes: [
              { titre: "Date", largeur: 11, valeur: (c: Charge) => dateCourte(c.date_charge) },
              {
                titre: "Libellé",
                largeur: 30,
                valeur: (c: Charge) => c.nom,
                sous: (c: Charge) => [c.fournisseur, c.reference].filter(Boolean).join(" · "),
                gras: true,
              },
              { titre: "Compte", largeur: 20, valeur: (c: Charge) => `${c.compte} ${categorieDe(c.categorie).label}` },
              { titre: "TVA", largeur: 10, align: "right", valeur: (c: Charge) => (c.montant_tva ? fmt(c.montant_tva) : "") },
              { titre: `Montant (${devise})`, largeur: 14, align: "right", valeur: (c: Charge) => fmt(c.montant), gras: true },
              {
                titre: "État",
                largeur: 13,
                valeur: (c: Charge) => LIBELLES_ETAT[etatDe(c)],
                couleur: (c: Charge) => ({ payee: VERT, a_payer: ORANGE, en_retard: ROUGE })[etatDe(c)],
              },
            ],
            total: ["", "TOTAL", "", fmt(t.tva), fmt(t.total), ""],
          },
        ],
      },
      mode,
    );

  const excel = () =>
    exporterCsv(
      `${nomFichier("Charges", periode.debut.format("YYYY-MM-DD"), periode.fin.format("YYYY-MM-DD"))}.csv`,
      ["Date", "Libellé", "Compte", "Catégorie", "Fournisseur", "N° pièce", "Montant HT", "TVA", "Montant TTC", "État",
        "Date de paiement", "Moyen de paiement", "Échéance", "Répétition"],
      lignes.map((c) => [
        dateCourte(c.date_charge), c.nom, c.compte, categorieDe(c.categorie).label, c.fournisseur, c.reference,
        c.montant - c.montant_tva, c.montant_tva, c.montant, LIBELLES_ETAT[etatDe(c)],
        c.date_paiement ? dateCourte(c.date_paiement) : "", c.statut === "payee" ? libelleMode(c.mode_paiement) : "",
        c.date_echeance ? dateCourte(c.date_echeance) : "", RECURRENCES.find((r) => r.value === c.recurrence)?.label || "",
      ]),
    );

  // ---------------------------------------------------------------- tableau
  const colonnes: ColumnsType<Charge> = [
    {
      title: "Date",
      dataIndex: "date_charge",
      width: 110,
      render: (d: string) => <span className="whitespace-nowrap text-slate-600">{dateCourte(d)}</span>,
      sorter: (a, b) => dayjs(a.date_charge).valueOf() - dayjs(b.date_charge).valueOf(),
      defaultSortOrder: "descend",
    },
    {
      title: "Libellé",
      key: "nom",
      render: (_, c) => (
        <div>
          <div className="font-semibold text-slate-800">
            {c.nom}
            {c.recurrence !== "aucune" && (
              <Tooltip title={RECURRENCES.find((r) => r.value === c.recurrence)?.label}>
                <Repeat size={12} className="ml-1.5 inline text-purple-700" />
              </Tooltip>
            )}
          </div>
          <div className="text-xs text-slate-500">{[c.fournisseur, c.reference && `N° ${c.reference}`, c.description].filter(Boolean).join(" · ")}</div>
        </div>
      ),
    },
    {
      title: "Catégorie",
      dataIndex: "categorie",
      render: (cat: string, c) => (
        <Tag color={categorieDe(cat).couleur} className="!m-0">
          {c.compte} · {categorieDe(cat).label}
        </Tag>
      ),
    },
    {
      title: "Montant",
      dataIndex: "montant",
      align: "right",
      render: (n: number, c) => (
        <div>
          <b className="text-purple-950">{argent(n, devise)}</b>
          {c.montant_tva > 0 && <div className="text-[11px] text-slate-400">dont TVA {fmt(c.montant_tva)}</div>}
        </div>
      ),
      sorter: (a, b) => a.montant - b.montant,
    },
    {
      title: "Règlement",
      key: "etat",
      render: (_, c) => {
        const e = etatDe(c);
        return (
          <div>
            <Pastille ton={e === "payee" ? "vert" : e === "en_retard" ? "rouge" : "orange"}>{LIBELLES_ETAT[e]}</Pastille>
            <div className="mt-0.5 text-[11px] text-slate-400">
              {e === "payee"
                ? `${dateCourte(c.date_paiement)} · ${libelleMode(c.mode_paiement)}`
                : c.date_echeance
                  ? `échéance ${dateCourte(c.date_echeance)}`
                  : "sans échéance"}
            </div>
          </div>
        );
      },
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: 190,
      render: (_, c) => (
        <div className="flex justify-end gap-1">
          {c.statut !== "payee" && (
            <Tooltip title="Enregistrer le paiement">
              <Button
                size="small"
                icon={<CheckCircle2 size={14} />}
                onClick={() => {
                  setReglement({ mode: c.mode_paiement || "cash", date: dayjs() });
                  setAPayer(c);
                }}
                className="!border-emerald-200 !text-emerald-700"
              >
                Payer
              </Button>
            </Tooltip>
          )}
          <Tooltip title={c.pieces_jointes?.length ? `${c.pieces_jointes.length} pièce(s) jointe(s)` : "Joindre la facture"}>
            <Button
              size="small"
              type="text"
              icon={<Paperclip size={14} className={c.pieces_jointes?.length ? "text-purple-800" : "text-slate-400"} />}
              onClick={() => setPiecesDe(c._id)}
            >
              {c.pieces_jointes?.length || null}
            </Button>
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              size="small"
              type="text"
              icon={<Pencil size={14} />}
              onClick={() => {
                setEdition(c);
                setModale(true);
              }}
            />
          </Tooltip>
          <Popconfirm title="Supprimer cette charge ?" okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }} onConfirm={() => supprimer(c._id)}>
            <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <ThemeFinance>
      <PageTitle>Charges</PageTitle>
      <div className="min-h-screen bg-white p-2 sm:p-6">
        <EnteteRapport
          icone={<Receipt size={20} />}
          titre="Charges et dépenses"
          description="Loyer, salaires, factures… payées ou à payer. Elles sont classées au plan comptable et alimentent la page Finance."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip title="Crée, à payer, le loyer, les salaires… marqués « Tous les mois » (ou trimestre, année) pour le mois en cours.">
                <Button icon={<Repeat size={15} />} onClick={recurrentes}>
                  Charges récurrentes du mois
                </Button>
              </Tooltip>
              <ActionsRapport disabled={chargement} onPdf={pdf} onExcel={excel} />
              <Button
                type="primary"
                icon={<Plus size={15} />}
                onClick={() => {
                  setEdition(null);
                  setModale(true);
                }}
              >
                Nouvelle charge
              </Button>
            </div>
          }
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
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Toutes les catégories"
            value={categorie}
            onChange={setCategorie}
            options={CATEGORIES_CHARGES.map((c) => ({ value: c.value, label: `${c.compte} · ${c.label}` }))}
            className="w-full sm:w-60"
          />
          <Select
            allowClear
            placeholder="Tous les règlements"
            value={etat}
            onChange={setEtat}
            options={(Object.keys(LIBELLES_ETAT) as Etat[]).map((e) => ({ value: e, label: LIBELLES_ETAT[e] }))}
            className="w-full sm:w-44"
          />
          <Input
            allowClear
            prefix={<Search size={14} className="text-slate-400" />}
            placeholder="Libellé, fournisseur, n° de pièce…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full sm:!w-64"
          />
        </BarreFiltres>

        <Spin spinning={chargement}>
          {verrou && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
              <Lock size={15} />
              <span>
                Comptabilité clôturée jusqu'au <b>{dateCourte(verrou)}</b> : les charges de cette période ne peuvent plus être
                créées, modifiées ni supprimées.
              </span>
            </div>
          )}
          {t.nbRetard > 0 && (
            <button
              type="button"
              onClick={() => setEtat("en_retard")}
              className="mb-4 flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-left text-sm text-red-700"
            >
              <AlertTriangle size={16} />
              <span>
                <b>{t.nbRetard} charge(s) en retard de paiement</b> pour {argent(t.retard, devise)}. Cliquez pour les afficher.
              </span>
            </button>
          )}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CarteChiffre
              principale
              libelle="Charges de la sélection"
              valeur={argent(t.total, devise)}
              detail={`${fmt(lignes.length)} charge(s)`}
              icone={<Coins size={16} />}
            />
            <CarteChiffre ton="vert" libelle="Déjà payées" valeur={argent(t.payees, devise)} icone={<Wallet size={16} />} />
            <CarteChiffre
              ton={t.nbRetard ? "rouge" : t.nbDettes ? "orange" : "gris"}
              libelle="Reste à payer (total)"
              valeur={argent(t.dettes, devise)}
              detail={`${t.nbDettes} facture(s)${t.nbRetard ? ` · ${t.nbRetard} en retard` : ""}`}
              icone={<CalendarClock size={16} />}
            />
            <CarteChiffre
              ton="gris"
              libelle="TVA récupérable"
              valeur={argent(t.tva, devise)}
              detail="À déduire de la TVA collectée"
              icone={<Receipt size={16} />}
            />
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-[2fr_5fr]">
            <Section titre="Répartition par catégorie">
              {parCategorie.length ? (
                <ul className="m-0 list-none space-y-2 p-0">
                  {parCategorie.map((c) => (
                    <li key={c.value}>
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="truncate font-semibold text-slate-700">
                          {c.compte} · {c.label}
                        </span>
                        <b className="shrink-0 text-purple-950">{fmt(c.montant)}</b>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-purple-100">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${(c.montant / (parCategorie[0].montant || 1)) * 100}%`, backgroundColor: PURPLE_950 }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty description="Aucune charge" />
              )}
            </Section>
            <Section titre="Liste des charges" note={etat && etat !== "payee" ? "Toutes périodes" : libellePeriode(periode)}>
              <Table
                rowKey="_id"
                size="middle"
                columns={colonnes}
                dataSource={lignes}
                pagination={{ pageSize: 15, hideOnSinglePage: true, showTotal: (n) => `${n} charge(s)` }}
                scroll={{ x: 820 }}
                locale={{ emptyText: <Empty description="Aucune charge pour ces critères" /> }}
              />
            </Section>
          </div>
        </Spin>

        <ChargeModal
          visible={modale}
          onCancel={() => setModale(false)}
          initialValues={edition}
          loading={enregistrement}
          devise={devise}
          onFinish={enregistrer}
        />
        <Modal
          title={chargePieces ? `Pièces jointes — ${chargePieces.nom}` : "Pièces jointes"}
          open={!!chargePieces}
          onCancel={() => setPiecesDe(null)}
          footer={null}
        >
          {chargePieces && (
            <PiecesJointes type="charges" id={chargePieces._id} pieces={chargePieces.pieces_jointes || []} onChange={charger} />
          )}
        </Modal>
        <Modal
          title="Enregistrer le paiement"
          open={!!aPayer}
          onCancel={() => setAPayer(null)}
          onOk={confirmerPaiement}
          okText="Confirmer le paiement"
          cancelText="Annuler"
        >
          {aPayer && (
            <div className="space-y-3">
              <p className="m-0 text-sm text-slate-600">
                {aPayer.nom} · <b className="text-purple-950">{argent(aPayer.montant, devise)}</b>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-500">Moyen de paiement</div>
                  <Select value={reglement.mode} onChange={(mode) => setReglement((r) => ({ ...r, mode }))} options={MODES_REGLEMENT} className="w-full" />
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-500">Date du paiement</div>
                  <DatePicker
                    value={reglement.date}
                    allowClear={false}
                    format="DD/MM/YYYY"
                    onChange={(date) => date && setReglement((r) => ({ ...r, date }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </ThemeFinance>
  );
};

export default ChargesPage;
