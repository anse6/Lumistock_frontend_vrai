// Capital et emprunts : apports en capital, apports et retraits de
// l'exploitant, emprunts reçus et leurs remboursements (capital + intérêts).
// Chaque opération entre dans la trésorerie, le journal et le bilan.
import React, { useCallback, useEffect, useState } from "react";
import { App, Button, DatePicker, Empty, Form, Input, InputNumber, Modal, Popconfirm, Progress, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowDownCircle, ArrowUpCircle, Banknote, Landmark, Plus, Trash2, Wallet } from "lucide-react";
import dayjs from "dayjs";
import { argent, CarteChiffre, dateCourte, fmt, Section } from "../Reports/ReportUi";
import { creerFinancement, getFinancements, libelleMode, messageErreur, MODES_REGLEMENT, supprimerFinancement } from "../Charges/chargeService";
import type { Emprunt, Financements as DonneesFinancements, OperationFinancement, TypeFinancement } from "../Charges/types";
import useCompteConnecte from "../../hooks/useCompteConnecte";

const TYPES: { value: TypeFinancement; label: string; aide: string; couleur: string }[] = [
  { value: "apport_capital", label: "Apport en capital", aide: "Argent apporté au capital de la société (compte 101).", couleur: "purple" },
  { value: "apport", label: "Apport de l'exploitant", aide: "Argent personnel mis dans le commerce (compte 108).", couleur: "green" },
  { value: "retrait", label: "Retrait de l'exploitant", aide: "Argent pris dans la caisse pour un usage personnel (compte 108).", couleur: "orange" },
  { value: "emprunt", label: "Emprunt reçu", aide: "Prêt d'une banque, d'une microfinance ou d'un proche (compte 162).", couleur: "blue" },
  { value: "remboursement", label: "Remboursement d'emprunt", aide: "Échéance payée : capital (162) et intérêts (671).", couleur: "volcano" },
];
const typeDe = (t: string) => TYPES.find((x) => x.value === t) || TYPES[0];

const Financements: React.FC<{ devise: string; onChange: () => void }> = ({ devise, onChange }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [donnees, setDonnees] = useState<DonneesFinancements | null>(null);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const type = Form.useWatch("type", form) as TypeFinancement | undefined;
  const empruntChoisi = Form.useWatch("emprunt_id", form) as string | undefined;
  // Droit « Paramètres comptables » (Paramètres > Accès).
  const admin = useCompteConnecte().peut("finances.parametres");

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setDonnees(await getFinancements());
    } catch (err) {
      message.error(messageErreur(err, "Les opérations n'ont pas pu être chargées."));
    } finally {
      setChargement(false);
    }
  }, [message]);

  useEffect(() => {
    charger();
  }, [charger]);

  const ouvrir = (t: TypeFinancement, emprunt?: Emprunt) => {
    form.resetFields();
    form.setFieldsValue({ type: t, date: dayjs(), mode_paiement: t === "emprunt" || t === "remboursement" ? "bancaire" : "cash", emprunt_id: emprunt?._id });
    setOuvert(true);
  };

  const enregistrer = async () => {
    const v = await form.validateFields();
    setEnvoi(true);
    try {
      await creerFinancement({
        type: v.type,
        montant: v.montant || 0,
        interets: v.interets || 0,
        emprunt_id: v.emprunt_id,
        date: v.date.format("YYYY-MM-DDTHH:mm:ss"),
        mode_paiement: v.mode_paiement,
        tiers: v.tiers || "",
        libelle: v.libelle || "",
        duree_mois: v.duree_mois,
        taux: v.taux,
        note: v.note || "",
      });
      message.success("Opération enregistrée.");
      setOuvert(false);
      charger();
      onChange();
    } catch (err) {
      message.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (o: OperationFinancement) => {
    try {
      await supprimerFinancement(o._id);
      message.success("Opération supprimée.");
      charger();
      onChange();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const t = donnees?.totaux;
  const emprunt = donnees?.emprunts.find((e) => e._id === empruntChoisi);
  const interetsPayes = (donnees?.emprunts || []).reduce((s, e) => s + e.interets_payes, 0);

  const colonnesEmprunts: ColumnsType<Emprunt> = [
    {
      title: "Emprunt",
      key: "e",
      render: (_, e) => (
        <div>
          <div className="font-semibold text-slate-800">{e.libelle}</div>
          <div className="text-xs text-slate-500">
            {e.tiers || "Prêteur non précisé"} · reçu le {dateCourte(e.date)}
            {e.duree_mois ? ` · ${e.duree_mois} mois` : ""}
            {e.taux ? ` · ${e.taux} %` : ""}
          </div>
        </div>
      ),
    },
    { title: "Montant", dataIndex: "montant", align: "right", render: (n: number) => argent(n, devise) },
    {
      title: "Remboursé",
      key: "r",
      width: 180,
      render: (_, e) => (
        <div>
          <Progress percent={e.montant ? Math.round((e.rembourse / e.montant) * 100) : 0} size="small" strokeColor="#3b0764" />
          <div className="text-[11px] text-slate-400">
            {fmt(e.rembourse)} de capital · {fmt(e.interets_payes)} d'intérêts
          </div>
        </div>
      ),
    },
    { title: "Restant dû", dataIndex: "restant_du", align: "right", render: (n: number) => <b className="text-purple-950">{argent(n, devise)}</b> },
    {
      title: "",
      key: "a",
      align: "right",
      render: (_, e) =>
        admin && e.restant_du > 0 ? (
          <Button size="small" type="primary" ghost onClick={() => ouvrir("remboursement", e)}>
            Rembourser
          </Button>
        ) : null,
    },
  ];

  const colonnes: ColumnsType<OperationFinancement> = [
    { title: "Date", dataIndex: "date", width: 110, render: (d: string) => dateCourte(d) },
    {
      title: "Opération",
      key: "o",
      render: (_, o) => (
        <div>
          <Tag color={typeDe(o.type).couleur} className="!m-0">
            {typeDe(o.type).label}
          </Tag>
          <div className="mt-0.5 text-xs text-slate-500">
            {o.libelle !== typeDe(o.type).label ? o.libelle : ""}
            {o.tiers ? ` ${o.tiers}` : ""} · {libelleMode(o.mode_paiement)}
          </div>
        </div>
      ),
    },
    {
      title: "Montant",
      key: "m",
      align: "right",
      render: (_, o) => {
        const sortie = o.type === "retrait" || o.type === "remboursement";
        return (
          <div>
            <b className={sortie ? "text-red-600" : "text-emerald-700"}>
              {sortie ? "− " : "+ "}
              {fmt(o.montant + o.interets)}
            </b>
            {o.interets > 0 && <div className="text-[11px] text-slate-400">dont {fmt(o.interets)} d'intérêts</div>}
          </div>
        );
      },
    },
    {
      title: "",
      key: "x",
      align: "right",
      width: 50,
      render: (_, o) =>
        admin ? (
          <Popconfirm title="Supprimer cette opération ?" okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }} onConfirm={() => supprimer(o)}>
            <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CarteChiffre principale libelle="Emprunts restant dus" valeur={argent(t?.restant_du, devise)} detail={`${argent(t?.emprunte, devise)} empruntés au total`} icone={<Landmark size={16} />} />
        <CarteChiffre libelle="Apports en capital" valeur={argent(t?.capital, devise)} detail="Hors capital social des réglages fiscaux" icone={<Banknote size={16} />} />
        <CarteChiffre
          ton={(t?.apports || 0) - (t?.retraits || 0) >= 0 ? "vert" : "orange"}
          libelle="Compte de l'exploitant"
          valeur={argent((t?.apports || 0) - (t?.retraits || 0), devise)}
          detail={`${fmt(t?.apports)} apportés · ${fmt(t?.retraits)} retirés`}
          icone={<Wallet size={16} />}
        />
        <CarteChiffre ton="orange" libelle="Intérêts payés" valeur={argent(interetsPayes, devise)} detail="Charges financières (671)" icone={<ArrowDownCircle size={16} />} />
      </div>

      {admin && (
        <div className="flex flex-wrap gap-2">
          <Button type="primary" icon={<Plus size={14} />} onClick={() => ouvrir("emprunt")}>
            Emprunt reçu
          </Button>
          <Button icon={<ArrowUpCircle size={14} />} onClick={() => ouvrir("apport")}>
            Apport
          </Button>
          <Button icon={<ArrowDownCircle size={14} />} onClick={() => ouvrir("retrait")}>
            Retrait de l'exploitant
          </Button>
        </div>
      )}

      <Section titre="Emprunts" note="Capital restant dû au passif du bilan (162)">
        <Table
          rowKey="_id"
          size="middle"
          loading={chargement}
          columns={colonnesEmprunts}
          dataSource={donnees?.emprunts || []}
          pagination={false}
          scroll={{ x: 800 }}
          locale={{ emptyText: <Empty description="Aucun emprunt enregistré" /> }}
        />
      </Section>

      <Section titre="Toutes les opérations" note={`${donnees?.operations.length || 0} opération(s)`}>
        <Table
          rowKey="_id"
          size="small"
          loading={chargement}
          columns={colonnes}
          dataSource={donnees?.operations || []}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={{ emptyText: <Empty description="Apports, retraits et emprunts apparaîtront ici" /> }}
        />
        <p className="mb-0 mt-2 text-xs text-slate-500">
          Les intérêts saisis avec un remboursement sont déjà comptés en charges financières : ne les ajoutez pas une seconde fois dans
          les charges.
        </p>
      </Section>

      <Modal title={type ? typeDe(type).label : "Opération"} open={ouvert} onCancel={() => setOuvert(false)} onOk={enregistrer} confirmLoading={envoi} okText="Enregistrer" cancelText="Annuler" width={600}>
        <Form form={form} layout="vertical" requiredMark={false} className="mt-3">
          <Form.Item name="type" label="Nature" extra={type ? typeDe(type).aide : undefined}>
            <Select options={TYPES.map((x) => ({ value: x.value, label: x.label }))} />
          </Form.Item>
          {type === "remboursement" && (
            <Form.Item name="emprunt_id" label="Emprunt remboursé" rules={[{ required: true, message: "Choisissez l'emprunt" }]}>
              <Select
                options={(donnees?.emprunts || []).filter((e) => e.restant_du > 0).map((e) => ({
                  value: e._id,
                  label: `${e.libelle}${e.tiers ? ` – ${e.tiers}` : ""} (reste ${fmt(e.restant_du)})`,
                }))}
                notFoundContent="Aucun emprunt à rembourser"
              />
            </Form.Item>
          )}
          <div className="grid gap-x-4 sm:grid-cols-2">
            {type !== "remboursement" && (
              <>
                <Form.Item name="libelle" label="Libellé">
                  <Input placeholder={type === "emprunt" ? "Ex. Prêt équipement" : "Facultatif"} />
                </Form.Item>
                <Form.Item name="tiers" label={type === "emprunt" ? "Prêteur" : "Personne"}>
                  <Input placeholder={type === "emprunt" ? "Ex. Afriland, CCA, proche…" : "Facultatif"} />
                </Form.Item>
              </>
            )}
            <Form.Item
              name="montant"
              label={type === "remboursement" ? `Capital remboursé (${devise})` : `Montant (${devise})`}
              extra={emprunt ? `Restant dû : ${argent(emprunt.restant_du, devise)}` : undefined}
              rules={[{ required: type !== "remboursement", message: "Indiquez le montant" }]}
            >
              <InputNumber min={0} max={type === "remboursement" && emprunt ? emprunt.restant_du : undefined} className="!w-full" />
            </Form.Item>
            {type === "remboursement" && (
              <Form.Item name="interets" label={`Intérêts payés (${devise})`}>
                <InputNumber min={0} className="!w-full" />
              </Form.Item>
            )}
            {type === "emprunt" && (
              <>
                <Form.Item name="duree_mois" label="Durée (mois)">
                  <InputNumber min={1} max={600} className="!w-full" />
                </Form.Item>
                <Form.Item name="taux" label="Taux d'intérêt annuel (%)">
                  <InputNumber min={0} max={100} step={0.5} className="!w-full" />
                </Form.Item>
              </>
            )}
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" className="w-full" allowClear={false} />
            </Form.Item>
            <Form.Item name="mode_paiement" label={type === "emprunt" || type === "apport" || type === "apport_capital" ? "Reçu sur" : "Payé par"}>
              <Select options={MODES_REGLEMENT} />
            </Form.Item>
          </div>
          <Form.Item name="note" label="Note">
            <Input placeholder="Facultatif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Financements;
