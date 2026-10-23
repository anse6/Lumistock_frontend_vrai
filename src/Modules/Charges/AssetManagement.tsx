// Immobilisations : matériel, véhicules, mobilier… achetés hors taxe (TVA
// récupérable à part), amortis linéairement au prorata des jours jusqu'à leur
// valeur résiduelle (valeur de revente estimée, calculée selon la nature du
// bien). La vente d'un bien arrête son amortissement et dégage une plus ou
// moins-value. La dotation entre dans le compte de résultat, la valeur nette au bilan.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Checkbox, DatePicker, Empty, Form, Input, InputNumber, Modal, Popconfirm, Progress, Select, Switch, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Armchair, Building2, HandCoins, Layers, Monitor, Package, Pencil, Plus, Trash2, Truck, Undo2 } from "lucide-react";
import dayjs from "dayjs";
import { argent, CarteChiffre, dateCourte, fmt, Section } from "../Reports/ReportUi";
import {
  annulerCession,
  cederAsset,
  createAsset,
  deleteAsset,
  getAssets,
  messageErreur,
  MODES_REGLEMENT,
  tvaSurHt,
  updateAsset,
} from "./chargeService";
import { formatTaux, useFiscalite } from "./financeUi";
import type { Asset, AssetCategory } from "./types";

/** Comptes SYSCOHADA, durée d'usage et valeur résiduelle usuelles (identiques au serveur). */
const CATEGORIES: { value: AssetCategory; label: string; compte: string; icone: React.ReactNode; duree: number; residuel: number }[] = [
  { value: "informatique", label: "Matériel informatique", compte: "2442", icone: <Monitor size={14} />, duree: 3, residuel: 5 },
  { value: "mobilier", label: "Mobilier", compte: "2444", icone: <Armchair size={14} />, duree: 10, residuel: 10 },
  { value: "vehicule", label: "Véhicule", compte: "245", icone: <Truck size={14} />, duree: 4, residuel: 20 },
  { value: "equipement", label: "Équipement, machine", compte: "241", icone: <Package size={14} />, duree: 5, residuel: 10 },
  { value: "autre", label: "Autre matériel", compte: "244", icone: <Layers size={14} />, duree: 5, residuel: 5 },
];
const categorie = (cle?: string) => CATEGORIES.find((c) => c.value === cle) || CATEGORIES[4];
const residuelleAuto = (valeur: number | undefined, cle?: string) => Math.round(((valeur || 0) * categorie(cle).residuel) / 100);

/** Valeur nette d'un bien à une date (linéaire au prorata des jours, comme le serveur). */
const valeurNetteAu = (a: Asset, date: dayjs.Dayjs) => {
  const achat = dayjs(a.date_achat);
  const fin = achat.add(a.duree_vie_annees, "year");
  const total = fin.diff(achat, "second");
  const ecoule = Math.min(Math.max(date.diff(achat, "second"), 0), total);
  const base = Math.max(a.valeur_achat - a.valeur_residuelle, 0);
  return a.valeur_achat - (total ? (base * ecoule) / total : 0);
};

const AssetManagement: React.FC<{ devise: string; onChange?: () => void }> = ({ devise, onChange }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [formCession] = Form.useForm();
  const [actifs, setActifs] = useState<Asset[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modale, setModale] = useState(false);
  const [edition, setEdition] = useState<Asset | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [aCeder, setACeder] = useState<Asset | null>(null);
  const [tvaAuto, setTvaAuto] = useState(true);
  const fiscalite = useFiscalite();
  const taux = fiscalite?.taux_tva ?? null;

  const valeurAchat = Form.useWatch("valeur_achat", form) as number | undefined;
  const cat = Form.useWatch("categorie", form) as AssetCategory | undefined;
  const auto = Form.useWatch("residuelle_auto", form) as boolean | undefined;
  const tva = Form.useWatch("montant_tva", form) as number | undefined;
  const prixCession = Form.useWatch("prix_cession", formCession) as number | undefined;
  const dateCession = Form.useWatch("date_cession", formCession) as dayjs.Dayjs | undefined;

  useEffect(() => {
    if (modale && auto) form.setFieldValue("valeur_residuelle", residuelleAuto(valeurAchat, cat));
  }, [modale, auto, valeurAchat, cat, form]);
  useEffect(() => {
    if (modale && tvaAuto) form.setFieldValue("montant_tva", tvaSurHt(valeurAchat || 0, taux));
  }, [modale, tvaAuto, valeurAchat, taux, form]);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setActifs(await getAssets());
    } catch (err) {
      message.error(messageErreur(err, "Les immobilisations n'ont pas pu être chargées."));
    } finally {
      setChargement(false);
    }
  }, [message]);

  useEffect(() => {
    charger();
  }, [charger]);

  const totaux = useMemo(() => {
    const enService = actifs.filter((a) => !a.cession);
    return {
      achat: enService.reduce((s, a) => s + a.valeur_achat, 0),
      nette: enService.reduce((s, a) => s + a.valeur_nette, 0),
      mensuel: enService.reduce((s, a) => s + a.amortissement_mensuel, 0),
      residuelle: enService.reduce((s, a) => s + a.valeur_residuelle, 0),
      enService: enService.length,
      cedees: actifs.length - enService.length,
    };
  }, [actifs]);

  const ouvrir = (a: Asset | null) => {
    setEdition(a);
    form.resetFields();
    if (a) {
      setTvaAuto(Math.abs((a.montant_tva || 0) - tvaSurHt(a.valeur_achat, taux)) <= 1 && (a.montant_tva || 0) > 0);
      form.setFieldsValue({ ...a, date_achat: dayjs(a.date_achat), residuelle_auto: a.residuelle_auto, montant_tva: a.montant_tva || 0 });
    } else {
      setTvaAuto(fiscalite?.assujetti_tva !== false && !!taux);
      form.setFieldsValue({
        categorie: "informatique", duree_vie_annees: 3, residuelle_auto: true, date_achat: dayjs(), mode_paiement: "cash", montant_tva: 0,
      });
    }
    setModale(true);
  };

  const enregistrer = async () => {
    const v = await form.validateFields();
    setEnregistrement(true);
    try {
      const donnees = {
        nom: v.nom.trim(),
        categorie: v.categorie,
        valeur_achat: v.valeur_achat,
        montant_tva: v.montant_tva || 0,
        date_achat: v.date_achat.format("YYYY-MM-DDTHH:mm:ss"),
        duree_vie_annees: v.duree_vie_annees,
        residuelle_auto: !!v.residuelle_auto,
        ...(v.residuelle_auto ? {} : { valeur_residuelle: v.valeur_residuelle || 0 }),
        mode_paiement: v.mode_paiement,
        fournisseur: v.fournisseur || "",
        reference: v.reference || "",
        description: v.description || "",
      };
      if (edition) await updateAsset(edition._id, donnees);
      else await createAsset(donnees);
      message.success(edition ? "Immobilisation modifiée." : "Immobilisation enregistrée.");
      setModale(false);
      charger();
      onChange?.();
    } catch (err) {
      message.error(messageErreur(err));
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async (id: string) => {
    try {
      await deleteAsset(id);
      message.success("Immobilisation supprimée.");
      charger();
      onChange?.();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const ouvrirCession = (a: Asset) => {
    formCession.resetFields();
    formCession.setFieldsValue({ date_cession: dayjs(), prix_cession: Math.round(a.valeur_nette), mode_paiement: "cash" });
    setACeder(a);
  };

  const ceder = async () => {
    if (!aCeder) return;
    const v = await formCession.validateFields();
    setEnregistrement(true);
    try {
      await cederAsset(aCeder._id, {
        date_cession: v.date_cession.format("YYYY-MM-DDTHH:mm:ss"),
        prix_cession: v.prix_cession || 0,
        mode_paiement: v.mode_paiement,
        acheteur: v.acheteur || "",
      });
      message.success("Vente de l'immobilisation enregistrée.");
      setACeder(null);
      charger();
      onChange?.();
    } catch (err) {
      message.error(messageErreur(err));
    } finally {
      setEnregistrement(false);
    }
  };

  const annuler = async (a: Asset) => {
    try {
      await annulerCession(a._id);
      message.success("Vente annulée : le bien est de nouveau en service.");
      charger();
      onChange?.();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const vncCession = aCeder && dateCession ? valeurNetteAu(aCeder, dateCession) : 0;
  const plusValue = (prixCession || 0) - vncCession;

  const colonnes: ColumnsType<Asset> = [
    {
      title: "Immobilisation",
      key: "nom",
      render: (_, a) => (
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-900">{categorie(a.categorie).icone}</span>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              {a.nom}
              {a.cession && <Tag color="default" className="!m-0 !text-[10px]">Vendue le {dateCourte(a.cession.date)}</Tag>}
            </div>
            <div className="text-xs text-slate-500">
              {categorie(a.categorie).compte} · {categorie(a.categorie).label} · achat le {dateCourte(a.date_achat)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Valeur d'achat HT",
      dataIndex: "valeur_achat",
      align: "right",
      render: (n: number, a) => (
        <div>
          <div>{argent(n, devise)}</div>
          {a.montant_tva > 0 && <div className="text-[11px] text-slate-400">+ TVA {fmt(a.montant_tva)}</div>}
        </div>
      ),
    },
    { title: "Durée", dataIndex: "duree_vie_annees", align: "center", render: (n: number) => `${n} an${n > 1 ? "s" : ""}` },
    {
      title: (
        <Tooltip title="Valeur de revente estimée à la fin de la durée d'utilisation. Elle n'est pas amortie.">
          <span>Valeur résiduelle</span>
        </Tooltip>
      ),
      dataIndex: "valeur_residuelle",
      align: "right",
      render: (n: number, a) => (
        <div>
          <div>{argent(n, devise)}</div>
          <div className="text-[11px] text-slate-400">{a.residuelle_auto ? `auto · ${a.taux_residuel} %` : "saisie"}</div>
        </div>
      ),
    },
    {
      title: "Dotation",
      key: "dotation",
      align: "right",
      render: (_, a) =>
        a.cession ? (
          <span className="text-xs text-slate-400">Arrêtée</span>
        ) : (
          <div>
            <div>{argent(a.amortissement_annuel, devise)} / an</div>
            <div className="text-[11px] text-slate-400">{fmt(a.amortissement_mensuel)} / mois</div>
          </div>
        ),
    },
    {
      title: "Amorti",
      key: "amorti",
      width: 140,
      render: (_, a) => {
        const base = a.valeur_achat - a.valeur_residuelle;
        return (
          <Tooltip title={`${argent(a.amortissements_cumules, devise)} amortis`}>
            <Progress percent={base ? Math.round((a.amortissements_cumules / base) * 100) : 100} size="small" strokeColor="#3b0764" />
          </Tooltip>
        );
      },
    },
    {
      title: "Valeur nette",
      dataIndex: "valeur_nette",
      align: "right",
      render: (n: number, a) =>
        a.cession ? (
          <div>
            <div className="text-slate-500">Vendue {argent(a.cession.prix, devise)}</div>
            <div className={`text-[11px] font-semibold ${a.cession.plus_value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {a.cession.plus_value >= 0 ? "Plus-value" : "Moins-value"} {fmt(Math.abs(a.cession.plus_value))}
            </div>
          </div>
        ) : (
          <b className="text-purple-950">{argent(n, devise)}</b>
        ),
      sorter: (a, b) => a.valeur_nette - b.valeur_nette,
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: 120,
      render: (_, a) => (
        <div className="flex justify-end gap-1">
          {a.cession ? (
            <Popconfirm title="Annuler la vente de ce bien ?" okText="Annuler la vente" cancelText="Non" onConfirm={() => annuler(a)}>
              <Tooltip title="Annuler la vente">
                <Button size="small" type="text" icon={<Undo2 size={14} />} />
              </Tooltip>
            </Popconfirm>
          ) : (
            <>
              <Tooltip title="Vendre ou mettre au rebut">
                <Button size="small" type="text" icon={<HandCoins size={14} />} onClick={() => ouvrirCession(a)} />
              </Tooltip>
              <Tooltip title="Modifier">
                <Button size="small" type="text" icon={<Pencil size={14} />} onClick={() => ouvrir(a)} />
              </Tooltip>
            </>
          )}
          <Popconfirm title="Supprimer cette immobilisation ?" okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }} onConfirm={() => supprimer(a._id)}>
            <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CarteChiffre principale libelle="Valeur nette des immobilisations" valeur={argent(totaux.nette, devise)} icone={<Building2 size={16} />} />
        <CarteChiffre
          libelle="Valeur d'achat HT (en service)"
          valeur={argent(totaux.achat, devise)}
          detail={`${totaux.enService} en service${totaux.cedees ? ` · ${totaux.cedees} vendue(s)` : ""}`}
          icone={<Layers size={16} />}
        />
        <CarteChiffre libelle="Valeurs résiduelles" valeur={argent(totaux.residuelle, devise)} detail="Revente estimée en fin d'usage" icone={<HandCoins size={16} />} />
        <CarteChiffre ton="orange" libelle="Dotation mensuelle" valeur={argent(totaux.mensuel, devise)} detail="Charge non décaissée, déduite du résultat" icone={<Package size={16} />} />
      </div>
      <Section
        titre="Registre des immobilisations"
        note={
          <Button type="primary" size="small" icon={<Plus size={14} />} onClick={() => ouvrir(null)}>
            Ajouter
          </Button>
        }
      >
        <Table
          rowKey="_id"
          size="middle"
          loading={chargement}
          columns={colonnes}
          dataSource={actifs}
          rowClassName={(a) => (a.cession ? "opacity-70" : "")}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 1050 }}
          locale={{ emptyText: <Empty description="Aucune immobilisation : ordinateurs, véhicules, mobilier… achetés pour durer" /> }}
        />
      </Section>

      <Modal
        title={edition ? "Modifier l'immobilisation" : "Nouvelle immobilisation"}
        open={modale}
        onCancel={() => setModale(false)}
        onOk={enregistrer}
        confirmLoading={enregistrement}
        okText="Enregistrer"
        cancelText="Annuler"
        width={680}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-3">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="nom" label="Désignation" rules={[{ required: true, whitespace: true, message: "Indiquez la désignation" }]}>
              <Input placeholder="Ex. Ordinateur portable HP" />
            </Form.Item>
            <Form.Item name="categorie" label="Catégorie">
              <Select
                options={CATEGORIES.map((c) => ({ value: c.value, label: `${c.compte} · ${c.label}` }))}
                onChange={(v) => !edition && form.setFieldValue("duree_vie_annees", categorie(v).duree)}
              />
            </Form.Item>
            <Form.Item name="valeur_achat" label={`Valeur d'achat hors taxe (${devise})`} rules={[{ required: true, message: "Indiquez la valeur" }]}>
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
            <Form.Item
              name="montant_tva"
              label={`TVA récupérable (${devise})`}
              tooltip="TVA payée sur l'achat, déduite de la TVA à reverser (compte 4451). Décochez « auto » si la facture indique un autre montant."
              extra={
                <Checkbox checked={tvaAuto} onChange={(e) => setTvaAuto(e.target.checked)} className="!text-xs">
                  Auto {formatTaux(taux)}
                </Checkbox>
              }
              dependencies={["valeur_achat"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, v) =>
                    (v || 0) > (getFieldValue("valeur_achat") || 0) ? Promise.reject(new Error("Supérieure à la valeur d'achat")) : Promise.resolve(),
                }),
              ]}
            >
              <InputNumber min={0} className="!w-full" disabled={tvaAuto} />
            </Form.Item>
            <Form.Item name="date_achat" label="Date d'achat (mise en service)" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" className="w-full" allowClear={false} />
            </Form.Item>
            <Form.Item name="duree_vie_annees" label="Durée d'amortissement (années)" rules={[{ required: true }]}>
              <InputNumber min={1} max={50} className="!w-full" />
            </Form.Item>
            <Form.Item
              name="valeur_residuelle"
              label={`Valeur résiduelle – revente estimée (${devise})`}
              tooltip="Ce que le bien vaudra encore à la fin de sa durée d'utilisation. Elle n'est pas amortie."
              extra={
                <span className="flex items-center gap-2 text-xs">
                  <Form.Item name="residuelle_auto" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                  {auto ? `Calcul automatique : ${categorie(cat).residuel} % de la valeur d'achat` : "Saisie manuelle"}
                </span>
              }
              dependencies={["valeur_achat"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, v) =>
                    (v || 0) > (getFieldValue("valeur_achat") || 0) ? Promise.reject(new Error("Supérieure à la valeur d'achat")) : Promise.resolve(),
                }),
              ]}
            >
              <InputNumber min={0} className="!w-full" disabled={!!auto} />
            </Form.Item>
            <Form.Item name="mode_paiement" label="Payé par">
              <Select options={MODES_REGLEMENT} />
            </Form.Item>
            <Form.Item name="fournisseur" label="Fournisseur">
              <Input placeholder="Facultatif" />
            </Form.Item>
            <Form.Item name="reference" label="N° de facture">
              <Input placeholder="Facultatif" />
            </Form.Item>
            <Form.Item name="description" label="Note">
              <Input placeholder="Facultatif" />
            </Form.Item>
          </div>
          <div className="flex flex-wrap justify-end gap-4 rounded-xl bg-purple-50 px-4 py-2 text-sm text-purple-950">
            <span>HT : <b>{argent(valeurAchat || 0, devise)}</b></span>
            <span>TVA : <b>{argent(tva || 0, devise)}</b></span>
            <span>Payé TTC : <b>{argent((valeurAchat || 0) + (tva || 0), devise)}</b></span>
          </div>
        </Form>
      </Modal>

      <Modal
        title={aCeder ? `Vendre « ${aCeder.nom} »` : ""}
        open={!!aCeder}
        onCancel={() => setACeder(null)}
        onOk={ceder}
        confirmLoading={enregistrement}
        okText="Enregistrer la vente"
        cancelText="Annuler"
        width={560}
      >
        <p className="mt-0 text-xs text-slate-500">
          L'amortissement s'arrête à la date de vente. Le prix encaissé et la valeur nette sortie de l'actif apparaissent dans le compte
          de résultat (opérations hors activités ordinaires). Prix 0 : mise au rebut.
        </p>
        <Form form={formCession} layout="vertical" requiredMark={false}>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="date_cession" label="Date de la vente" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" className="w-full" allowClear={false} />
            </Form.Item>
            <Form.Item name="prix_cession" label={`Prix de vente (${devise})`} rules={[{ required: true, message: "Indiquez le prix" }]}>
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
            <Form.Item name="mode_paiement" label="Encaissé par">
              <Select options={MODES_REGLEMENT} />
            </Form.Item>
            <Form.Item name="acheteur" label="Acheteur">
              <Input placeholder="Facultatif" />
            </Form.Item>
          </div>
        </Form>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-purple-50 px-4 py-3 text-sm">
          <span className="text-slate-600">Valeur nette au jour de la vente</span>
          <b className="text-right text-purple-950">{argent(vncCession, devise)}</b>
          <span className="text-slate-600">{plusValue >= 0 ? "Plus-value" : "Moins-value"}</span>
          <b className={`text-right ${plusValue >= 0 ? "text-emerald-700" : "text-red-600"}`}>{argent(Math.abs(plusValue), devise)}</b>
        </div>
      </Modal>
    </div>
  );
};

export default AssetManagement;
