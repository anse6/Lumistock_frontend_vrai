// Factures fournisseurs : achats de marchandises à crédit. La facture fait
// entrer les articles en stock ; la dette est réglée en un ou plusieurs fois.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, AutoComplete, Button, Checkbox, DatePicker, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { AlertTriangle, Banknote, FileMinus, FileText, HandCoins, Paperclip, Plus, Search, Trash2, Truck, Undo2 } from "lucide-react";
import dayjs from "dayjs";
import { argent, BarreFiltres, CarteChiffre, dateCourte, fmt, Pastille, Section } from "../Reports/ReportUi";
import { lireRapport } from "../Reports/reportsApi";
import type { RapportInventaire } from "../Reports/reportsApi";
import {
  annulerReglement,
  creerAvoir,
  creerFacture,
  getFactures,
  getFournisseurs,
  libelleMode,
  messageErreur,
  MODES_REGLEMENT,
  reglerFacture,
  tvaSurHt,
} from "../Charges/chargeService";
import { formatTaux, useFiscalite } from "../Charges/financeUi";
import PiecesJointes from "../Charges/PiecesJointes";
import type { FactureFournisseur, StatutFacture } from "../Charges/types";
import useCompteConnecte from "../../hooks/useCompteConnecte";

const LIBELLES: Record<StatutFacture, string> = { a_payer: "À payer", partielle: "Payée en partie", payee: "Payée", annulee: "Annulée" };

const FacturesFournisseurs: React.FC<{ devise: string; onChange: () => void }> = ({ devise, onChange }) => {
  const { message } = App.useApp();
  // Annuler un paiement fournisseur : droit « Paramètres comptables ».
  const peutAnnulerPaiement = useCompteConnecte().peut("finances.parametres");
  const [form] = Form.useForm();
  const [factures, setFactures] = useState<FactureFournisseur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [produits, setProduits] = useState<{ id: string; nom: string; prix_achat: number }[]>([]);
  const [fournisseurs, setFournisseurs] = useState<{ _id: string; nom: string }[]>([]);
  const [creation, setCreation] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [aRegler, setARegler] = useState<FactureFournisseur | null>(null);
  const [reglement, setReglement] = useState({ montant: 0, mode: "cash", date: dayjs(), reference: "" });
  const [remboursement, setRemboursement] = useState(false);
  const [avoirDe, setAvoirDe] = useState<FactureFournisseur | null>(null);
  const [rendus, setRendus] = useState<Record<string, number>>({});
  const [motifAvoir, setMotifAvoir] = useState("");
  const [piecesDe, setPiecesDe] = useState<string | null>(null);
  const [statut, setStatut] = useState<StatutFacture | "retard">();
  const [recherche, setRecherche] = useState("");

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setFactures(await getFactures());
    } catch (err) {
      message.error(messageErreur(err, "Les factures n'ont pas pu être chargées."));
    } finally {
      setChargement(false);
    }
  }, [message]);

  useEffect(() => {
    charger();
  }, [charger]);

  const ouvrirCreation = async () => {
    form.resetFields();
    form.setFieldsValue({ date_facture: dayjs(), lignes: [{}], montant_tva: 0, acompte_mode: "cash" });
    setTvaAuto(fiscalite?.assujetti_tva !== false && !!fiscalite?.taux_tva);
    setCreation(true);
    try {
      const [inventaire, liste] = await Promise.all([lireRapport<RapportInventaire>("inventaire", {}), getFournisseurs().catch(() => [])]);
      setProduits(inventaire.produits.map((p) => ({ id: p.produit_id, nom: p.produit, prix_achat: p.prix_achat })));
      setFournisseurs(liste);
    } catch (err) {
      message.error(messageErreur(err, "La liste des produits n'a pas pu être chargée."));
    }
  };

  const lignesSaisies = Form.useWatch("lignes", form) as { produit_id?: string; quantite?: number; prix_achat?: number }[] | undefined;
  const tvaSaisie = Form.useWatch("montant_tva", form) as number | undefined;
  const totalHt = (lignesSaisies || []).reduce((s, l) => s + (l?.quantite || 0) * (l?.prix_achat || 0), 0);
  const fiscalite = useFiscalite();
  const taux = fiscalite?.taux_tva ?? null;
  // TVA calculée sur le total HT au taux du pays ; décochée si la facture indique un autre montant.
  const [tvaAuto, setTvaAuto] = useState(true);
  useEffect(() => {
    if (creation && tvaAuto) form.setFieldValue("montant_tva", tvaSurHt(totalHt, taux));
  }, [creation, tvaAuto, totalHt, taux, form]);

  const enregistrer = async () => {
    const v = await form.validateFields();
    const choisi = fournisseurs.find((f) => f.nom.toLowerCase() === String(v.fournisseur).trim().toLowerCase());
    setEnvoi(true);
    try {
      await creerFacture({
        ...(choisi ? { fournisseur_id: choisi._id } : { fournisseur_nom: String(v.fournisseur).trim() }),
        numero: v.numero,
        date_facture: v.date_facture.format("YYYY-MM-DD"),
        date_echeance: v.date_echeance ? v.date_echeance.format("YYYY-MM-DD") : null,
        montant_tva: v.montant_tva || 0,
        note: v.note,
        lignes: v.lignes.map((l: { produit_id: string; quantite: number; prix_achat: number }) => ({
          produit_id: l.produit_id,
          quantite: l.quantite,
          prix_achat: l.prix_achat,
        })),
        paiement: v.acompte ? { montant: v.acompte, mode: v.acompte_mode } : undefined,
      });
      message.success("Facture enregistrée : les articles sont entrés en stock.");
      setCreation(false);
      charger();
      onChange();
    } catch (err) {
      message.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const regler = async () => {
    if (!aRegler) return;
    try {
      await reglerFacture(aRegler._id, {
        ...reglement,
        date: reglement.date.format("YYYY-MM-DD"),
        type: remboursement ? "remboursement" : "reglement",
      });
      message.success(remboursement ? "Remboursement du fournisseur enregistré." : "Règlement enregistré.");
      setARegler(null);
      charger();
      onChange();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const ouvrirAvoir = (f: FactureFournisseur) => {
    setRendus({});
    setMotifAvoir("");
    setAvoirDe(f);
  };

  const enregistrerAvoir = async (toutAnnuler: boolean) => {
    if (!avoirDe) return;
    try {
      await creerAvoir(avoirDe._id, {
        motif: motifAvoir.trim() || (toutAnnuler ? "Annulation de la facture" : "Retour au fournisseur"),
        ...(toutAnnuler
          ? {}
          : { lignes: Object.entries(rendus).filter(([, q]) => q > 0).map(([produit_id, quantite]) => ({ produit_id, quantite })) }),
      });
      message.success(toutAnnuler ? "Facture annulée par avoir : le stock et la dette sont corrigés." : "Avoir enregistré.");
      setAvoirDe(null);
      charger();
      onChange();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const annuler = async (f: FactureFournisseur, paiementId: string) => {
    try {
      await annulerReglement(f._id, paiementId);
      message.success("Règlement annulé.");
      charger();
      onChange();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return factures.filter(
      (f) =>
        (!statut || (statut === "retard" ? f.en_retard : f.statut === statut)) &&
        (!q || `${f.numero} ${f.fournisseur_nom} ${f.lignes.map((l) => l.nom).join(" ")}`.toLowerCase().includes(q)),
    );
  }, [factures, statut, recherche]);

  const totaux = useMemo(() => {
    const ouvertes = factures.filter((f) => f.reste > 0);
    const retard = factures.filter((f) => f.en_retard);
    const mois = factures.filter((f) => dayjs(f.date_facture).isSame(dayjs(), "month"));
    return {
      du: ouvertes.reduce((s, f) => s + f.reste, 0),
      nbDu: ouvertes.length,
      retard: retard.reduce((s, f) => s + f.reste, 0),
      nbRetard: retard.length,
      mois: mois.reduce((s, f) => s + f.montant_ttc, 0),
      nbMois: mois.length,
    };
  }, [factures]);

  const facturePieces = factures.find((f) => f._id === piecesDe);

  const colonnes: ColumnsType<FactureFournisseur> = [
    {
      title: "Date",
      dataIndex: "date_facture",
      width: 105,
      render: (d: string) => dateCourte(d),
      sorter: (a, b) => dayjs(a.date_facture).valueOf() - dayjs(b.date_facture).valueOf(),
    },
    {
      title: "Fournisseur",
      key: "fournisseur",
      render: (_, f) => (
        <div>
          <div className="font-semibold text-slate-800">{f.fournisseur_nom}</div>
          <div className="text-xs text-slate-500">
            {f.numero ? `N° ${f.numero} · ` : ""}
            {f.lignes.length} article(s)
          </div>
        </div>
      ),
    },
    {
      title: "Montant TTC",
      dataIndex: "montant_ttc",
      align: "right",
      render: (n: number, f) => (
        <div>
          <b className="text-purple-950">{argent(n, devise)}</b>
          {f.montant_tva > 0 && <div className="text-[11px] text-slate-400">dont TVA {fmt(f.montant_tva)}</div>}
        </div>
      ),
    },
    {
      title: "Reste dû",
      dataIndex: "reste",
      align: "right",
      render: (n: number) => <span className={n > 0 ? "font-semibold text-orange-600" : "text-slate-400"}>{argent(n, devise)}</span>,
    },
    {
      title: "Statut",
      key: "statut",
      render: (_, f) => (
        <div>
          <Pastille ton={f.statut === "payee" ? "vert" : f.statut === "annulee" ? "gris" : f.en_retard ? "rouge" : "orange"}>
            {f.en_retard ? "En retard" : LIBELLES[f.statut]}
          </Pastille>
          {f.a_recevoir > 0 && <div className="text-[11px] font-semibold text-emerald-700">vous doit {fmt(f.a_recevoir)}</div>}
          {f.date_echeance && f.statut !== "payee" && <div className="text-[11px] text-slate-400">échéance {dateCourte(f.date_echeance)}</div>}
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: 170,
      render: (_, f) => (
        <div className="flex justify-end gap-1">
          {f.reste > 0 && (
            <Button
              size="small"
              icon={<Banknote size={14} />}
              className="!border-emerald-200 !text-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                setRemboursement(false);
                setReglement({ montant: f.reste, mode: "cash", date: dayjs(), reference: "" });
                setARegler(f);
              }}
            >
              Régler
            </Button>
          )}
          {f.a_recevoir > 0 && (
            <Button
              size="small"
              icon={<HandCoins size={14} />}
              className="!border-emerald-200 !text-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                setRemboursement(true);
                setReglement({ montant: f.a_recevoir, mode: "cash", date: dayjs(), reference: "" });
                setARegler(f);
              }}
            >
              Remboursé
            </Button>
          )}
          <Tooltip title={f.pieces_jointes.length ? `${f.pieces_jointes.length} pièce(s) jointe(s)` : "Joindre la facture scannée"}>
            <Button
              size="small"
              type="text"
              icon={<Paperclip size={14} className={f.pieces_jointes.length ? "text-purple-800" : "text-slate-400"} />}
              onClick={(e) => {
                e.stopPropagation();
                setPiecesDe(f._id);
              }}
            >
              {f.pieces_jointes.length || null}
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const detail = (f: FactureFournisseur) => (
    <div className="grid gap-4 py-1 lg:grid-cols-2">
      <div>
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Articles entrés en stock</div>
        <Table
          rowKey="produit_id"
          size="small"
          pagination={false}
          dataSource={f.lignes}
          columns={[
            { title: "Produit", dataIndex: "nom" },
            { title: "Qté", dataIndex: "quantite", align: "right", render: (n: number) => fmt(n) },
            { title: "Prix HT", dataIndex: "prix_achat", align: "right", render: (n: number) => fmt(n) },
            { title: "Total", dataIndex: "total", align: "right", render: (n: number) => <b>{fmt(n)}</b> },
          ]}
        />
        {f.note && <p className="mb-0 mt-2 text-xs text-slate-500">Note : {f.note}</p>}
        {f.avoirs.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Avoirs</div>
            <ul className="m-0 list-none space-y-1 p-0">
              {f.avoirs.map((a) => (
                <li key={a.id} className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span>
                      {dateCourte(a.date)} · {a.motif || "Avoir"}
                    </span>
                    <b className="text-orange-700">− {argent(a.montant_ttc, devise)}</b>
                  </div>
                  <div className="text-[11px] text-slate-500">{a.lignes.map((l) => `${l.quantite} × ${l.nom}`).join(", ")}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {f.statut !== "annulee" && (
          <Button size="small" className="!mt-3" icon={<FileMinus size={14} />} onClick={() => ouvrirAvoir(f)}>
            Retour au fournisseur / annuler
          </Button>
        )}
      </div>
      <div>
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Règlements</div>
        {f.paiements.length ? (
          <ul className="m-0 list-none space-y-1 p-0">
            {f.paiements.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                <span>
                  {dateCourte(p.date)} · {libelleMode(p.mode)}
                  {p.reference && <span className="text-slate-400"> · {p.reference}</span>}
                </span>
                <span className="flex items-center gap-1">
                  <b className="text-emerald-700">{argent(p.montant, devise)}</b>
                  {peutAnnulerPaiement && (
                    <Popconfirm title="Annuler ce règlement ?" okText="Annuler le règlement" cancelText="Non" onConfirm={() => annuler(f, p.id)}>
                      <Button size="small" type="text" danger icon={<Undo2 size={13} />} />
                    </Popconfirm>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-slate-400">Aucun règlement.</p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CarteChiffre principale libelle="Dû aux fournisseurs" valeur={argent(totaux.du, devise)} detail={`${totaux.nbDu} facture(s) ouverte(s)`} icone={<Truck size={16} />} />
        <CarteChiffre
          ton={totaux.nbRetard ? "rouge" : "gris"}
          libelle="En retard"
          valeur={argent(totaux.retard, devise)}
          detail={`${totaux.nbRetard} facture(s) après échéance`}
          icone={<AlertTriangle size={16} />}
        />
        <CarteChiffre ton="gris" libelle="Achats du mois" valeur={argent(totaux.mois, devise)} detail={`${totaux.nbMois} facture(s)`} icone={<FileText size={16} />} />
      </div>
      <BarreFiltres>
        <Select
          allowClear
          placeholder="Toutes les factures"
          value={statut}
          onChange={setStatut}
          options={[
            ...(Object.keys(LIBELLES) as StatutFacture[]).map((s) => ({ value: s, label: LIBELLES[s] })),
            { value: "retard", label: "En retard" },
          ]}
          className="w-full sm:w-48"
        />
        <Input
          allowClear
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Fournisseur, n°, produit…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full sm:!w-64"
        />
        <Button type="primary" icon={<Plus size={15} />} onClick={ouvrirCreation} className="sm:ml-auto">
          Nouvelle facture fournisseur
        </Button>
      </BarreFiltres>
      <Section titre="Factures fournisseurs" note="Cliquez sur une ligne pour voir les articles et les règlements">
        <Table
          rowKey="_id"
          size="middle"
          loading={chargement}
          columns={colonnes}
          dataSource={lignes}
          expandable={{ expandedRowRender: detail, expandRowByClick: true }}
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          scroll={{ x: 860 }}
          locale={{ emptyText: <Empty description="Aucune facture : enregistrez vos achats à crédit pour suivre ce que vous devez" /> }}
        />
      </Section>

      {/* ------------------------------------------------ nouvelle facture */}
      <Modal
        title="Nouvelle facture fournisseur"
        open={creation}
        onCancel={() => setCreation(false)}
        onOk={enregistrer}
        confirmLoading={envoi}
        okText="Enregistrer et entrer en stock"
        cancelText="Annuler"
        width={820}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-3">
          <div className="grid gap-x-4 sm:grid-cols-4">
            <Form.Item name="fournisseur" label="Fournisseur" rules={[{ required: true, whitespace: true, message: "Indiquez le fournisseur" }]} className="sm:col-span-2">
              <AutoComplete
                options={fournisseurs.map((f) => ({ value: f.nom }))}
                filterOption={(saisie, option) => String(option?.value).toLowerCase().includes(saisie.toLowerCase())}
                placeholder="Choisir ou saisir un nom"
              />
            </Form.Item>
            <Form.Item name="numero" label="N° de facture">
              <Input placeholder="Facultatif" />
            </Form.Item>
            <Form.Item name="date_facture" label="Date" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" className="w-full" allowClear={false} />
            </Form.Item>
          </div>

          <div className="mb-1 text-xs font-semibold text-slate-500">Articles reçus (prix d'achat unitaire hors taxes)</div>
          <Form.List name="lignes">
            {(champs, { add, remove }) => (
              <div className="space-y-2">
                {champs.map((champ) => (
                  <div key={champ.key} className="grid grid-cols-[1fr_90px_130px_32px] items-start gap-2">
                    <Form.Item name={[champ.name, "produit_id"]} rules={[{ required: true, message: "Produit" }]} className="!mb-0">
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Produit"
                        options={produits.map((p) => ({ value: p.id, label: p.nom }))}
                        onChange={(id) => {
                          const p = produits.find((x) => x.id === id);
                          if (p) form.setFieldValue(["lignes", champ.name, "prix_achat"], p.prix_achat);
                        }}
                      />
                    </Form.Item>
                    <Form.Item name={[champ.name, "quantite"]} rules={[{ required: true, message: "Qté" }]} className="!mb-0">
                      <InputNumber min={1} precision={0} placeholder="Qté" className="!w-full" />
                    </Form.Item>
                    <Form.Item name={[champ.name, "prix_achat"]} rules={[{ required: true, message: "Prix" }]} className="!mb-0">
                      <InputNumber min={0} placeholder="Prix HT" className="!w-full" />
                    </Form.Item>
                    <Button type="text" danger icon={<Trash2 size={14} />} disabled={champs.length === 1} onClick={() => remove(champ.name)} />
                  </div>
                ))}
                <Button type="dashed" block icon={<Plus size={14} />} onClick={() => add({})}>
                  Ajouter un article
                </Button>
              </div>
            )}
          </Form.List>

          <div className="mt-4 grid gap-x-4 sm:grid-cols-4">
            <Form.Item
              name="montant_tva"
              label={`TVA récupérable (${devise})`}
              tooltip="Calculée sur le total HT au taux du pays du magasin. Décochez « auto » pour saisir le montant de la facture."
              extra={
                <Checkbox checked={tvaAuto} onChange={(e) => setTvaAuto(e.target.checked)} className="!text-xs">
                  Auto {formatTaux(taux)}
                </Checkbox>
              }
            >
              <InputNumber min={0} className="!w-full" disabled={tvaAuto} />
            </Form.Item>
            <Form.Item name="date_echeance" label="Échéance de paiement">
              <DatePicker format="DD/MM/YYYY" className="w-full" />
            </Form.Item>
            <Form.Item name="acompte" label={`Payé à la réception (${devise})`}>
              <InputNumber min={0} className="!w-full" placeholder="0" />
            </Form.Item>
            <Form.Item name="acompte_mode" label="Payé par">
              <Select options={MODES_REGLEMENT} />
            </Form.Item>
          </div>
          <Form.Item name="note" label="Note" className="!mb-2">
            <Input placeholder="Facultatif" />
          </Form.Item>
          <div className="flex flex-wrap justify-end gap-4 rounded-xl bg-purple-50 px-4 py-2 text-sm text-purple-950">
            <span>HT : <b>{argent(totalHt, devise)}</b></span>
            <span>TVA : <b>{argent(tvaSaisie || 0, devise)}</b></span>
            <span>TTC : <b>{argent(totalHt + (tvaSaisie || 0), devise)}</b></span>
          </div>
        </Form>
      </Modal>

      {/* ------------------------------------------------ règlement */}
      <Modal
        title={remboursement ? "Remboursement reçu du fournisseur" : "Régler la facture"}
        open={!!aRegler}
        onCancel={() => setARegler(null)}
        onOk={regler}
        okText={remboursement ? "Enregistrer le remboursement" : "Enregistrer le règlement"}
        cancelText="Annuler"
      >
        {aRegler && (
          <div className="space-y-3">
            <p className="m-0 text-sm text-slate-600">
              {aRegler.fournisseur_nom} {aRegler.numero && `· N° ${aRegler.numero}`} ·{" "}
              {remboursement ? "le fournisseur vous doit " : "reste dû "}
              <b className="text-purple-950">{argent(remboursement ? aRegler.a_recevoir : aRegler.reste, devise)}</b>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">Montant</div>
                <InputNumber min={1} max={remboursement ? aRegler.a_recevoir : aRegler.reste} value={reglement.montant} onChange={(montant) => setReglement((r) => ({ ...r, montant: montant || 0 }))} className="!w-full" />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">Moyen de paiement</div>
                <Select value={reglement.mode} onChange={(mode) => setReglement((r) => ({ ...r, mode }))} options={MODES_REGLEMENT} className="w-full" />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">Date</div>
                <DatePicker value={reglement.date} allowClear={false} format="DD/MM/YYYY" onChange={(date) => date && setReglement((r) => ({ ...r, date }))} className="w-full" />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">Référence (transaction, chèque…)</div>
                <Input value={reglement.reference} onChange={(e) => setReglement((r) => ({ ...r, reference: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ------------------------------------------------ avoir */}
      <Modal
        title="Retour au fournisseur (avoir)"
        open={!!avoirDe}
        onCancel={() => setAvoirDe(null)}
        width={620}
        footer={
          avoirDe && (
            <div className="flex flex-wrap justify-between gap-2">
              <Popconfirm
                title="Annuler toute la facture ?"
                description="Tous les articles non encore rendus sortent du stock et la dette est effacée."
                okText="Annuler la facture"
                cancelText="Non"
                okButtonProps={{ danger: true }}
                onConfirm={() => enregistrerAvoir(true)}
              >
                <Button danger>Annuler toute la facture</Button>
              </Popconfirm>
              <span className="flex gap-2">
                <Button onClick={() => setAvoirDe(null)}>Fermer</Button>
                <Button type="primary" disabled={!Object.values(rendus).some((q) => q > 0)} onClick={() => enregistrerAvoir(false)}>
                  Enregistrer l'avoir
                </Button>
              </span>
            </div>
          )
        }
      >
        {avoirDe && (
          <div className="space-y-3">
            <p className="m-0 text-xs text-slate-500">
              Les articles rendus sortent du stock au prix de la facture et la dette envers {avoirDe.fournisseur_nom} baisse
              d'autant. Si la facture est déjà payée, le fournisseur vous devra la différence. L'avoir est daté d'aujourd'hui :
              une facture d'une période clôturée se corrige ainsi sans toucher à la période close.
            </p>
            {avoirDe.lignes.map((l) => {
              const max = l.quantite - (avoirDe.rendu[l.produit_id] || 0);
              return (
                <div key={l.produit_id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800">{l.nom}</div>
                    <div className="text-xs text-slate-500">
                      {l.quantite} acheté(s) à {fmt(l.prix_achat)}
                      {avoirDe.rendu[l.produit_id] ? ` · ${avoirDe.rendu[l.produit_id]} déjà rendu(s)` : ""}
                    </div>
                  </div>
                  <InputNumber
                    min={0}
                    max={max}
                    precision={0}
                    disabled={max <= 0}
                    value={rendus[l.produit_id] || 0}
                    onChange={(v) => setRendus((r) => ({ ...r, [l.produit_id]: Math.min(max, Number(v) || 0) }))}
                    addonAfter={`/ ${max}`}
                    className="w-32"
                  />
                </div>
              );
            })}
            <Input value={motifAvoir} onChange={(e) => setMotifAvoir(e.target.value)} placeholder="Motif (articles défectueux, erreur de saisie…)" />
            <div className="text-right text-sm text-purple-950">
              Avoir HT :{" "}
              <b>
                {argent(
                  avoirDe.lignes.reduce((s, l) => s + (rendus[l.produit_id] || 0) * l.prix_achat, 0),
                  devise,
                )}
              </b>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={facturePieces ? `Pièces jointes — ${facturePieces.fournisseur_nom}` : "Pièces jointes"}
        open={!!facturePieces}
        onCancel={() => setPiecesDe(null)}
        footer={null}
      >
        {facturePieces && <PiecesJointes type="factures-fournisseurs" id={facturePieces._id} pieces={facturePieces.pieces_jointes} onChange={charger} />}
      </Modal>
    </div>
  );
};

export default FacturesFournisseurs;
