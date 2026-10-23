// Impôts et taxes : réglages fiscaux du magasin, TVA mois par mois (collectée,
// récupérable, crédit reporté, à reverser, payée), acomptes et impôt sur le
// résultat de l'exercice, autres impôts saisis en charges, et paiements à l'État.
import React, { useMemo, useState } from "react";
import { App, Button, DatePicker, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Spin, Switch, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { AlertTriangle, BadgePercent, Calculator, Landmark, Plus, Receipt, Settings2, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import { argent, CarteChiffre, dateCourte, fmt, Pastille, Section, useRapport } from "../Reports/ReportUi";
import { MOIS_COURTS } from "../Reports/reportsApi";
import { enregistrerFiscalite, getImpots, libelleMode, messageErreur, MODES_REGLEMENT, payerImpot, supprimerPaiementImpot } from "../Charges/chargeService";
import { formatTaux } from "../Charges/financeUi";
import type { MoisTva, OperationFiscale, ParametresFiscaux, SituationFiscale, StatutTva, TypeOperationFiscale } from "../Charges/types";
import useCompteConnecte from "../../hooks/useCompteConnecte";

const STATUTS: Record<StatutTva, { libelle: string; ton: "violet" | "vert" | "orange" | "rouge" | "gris" }> = {
  a_venir: { libelle: "À venir", ton: "gris" },
  en_cours: { libelle: "Mois en cours", ton: "violet" },
  a_payer: { libelle: "À déclarer et payer", ton: "orange" },
  en_retard: { libelle: "En retard", ton: "rouge" },
  paye: { libelle: "Payée", ton: "vert" },
  credit: { libelle: "Crédit reporté", ton: "violet" },
  neant: { libelle: "Néant", ton: "gris" },
};
const TYPES: { value: TypeOperationFiscale; label: string }[] = [
  { value: "tva", label: "Reversement de TVA" },
  { value: "is", label: "Impôt sur le résultat (acompte ou solde)" },
  { value: "remboursement_tva", label: "Remboursement de crédit de TVA reçu" },
];
const nomMois = (periode: string) => {
  const [a, m] = periode.split("-");
  return `${MOIS_COURTS[Number(m) - 1]} ${a}`;
};

const Fiscalite: React.FC<{ devise: string; onChange: () => void }> = ({ devise, onChange }) => {
  const { message } = App.useApp();
  const [annee, setAnnee] = useState(dayjs().year());
  const [version, setVersion] = useState(0);
  const { donnees, chargement } = useRapport<SituationFiscale>((signal) => getImpots(annee, signal), `${annee}-${version}`);
  const [formPaiement] = Form.useForm();
  const [formReglages] = Form.useForm();
  const [paiement, setPaiement] = useState(false);
  const [reglages, setReglages] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  // Droit « Paramètres comptables » (Paramètres > Accès).
  const admin = useCompteConnecte().peut("finances.parametres");
  const typePaiement = Form.useWatch("type", formPaiement) as TypeOperationFiscale | undefined;

  const actualiser = () => {
    setVersion((v) => v + 1);
    onChange();
  };

  const ouvrirPaiement = (type: TypeOperationFiscale, periode: string, montant: number) => {
    formPaiement.resetFields();
    formPaiement.setFieldsValue({ type, periode, montant: Math.round(montant) || undefined, date: dayjs(), mode_paiement: "bancaire" });
    setPaiement(true);
  };

  const enregistrerPaiement = async () => {
    const v = await formPaiement.validateFields();
    setEnvoi(true);
    try {
      await payerImpot({
        type: v.type,
        periode: v.periode,
        montant: v.montant,
        date: v.date.format("YYYY-MM-DDTHH:mm:ss"),
        mode_paiement: v.mode_paiement,
        reference: v.reference || "",
      });
      message.success("Paiement enregistré.");
      setPaiement(false);
      actualiser();
    } catch (err) {
      message.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (o: OperationFiscale) => {
    try {
      await supprimerPaiementImpot(o._id);
      message.success("Paiement supprimé.");
      actualiser();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const ouvrirReglages = (p: ParametresFiscaux) => {
    formReglages.setFieldsValue(p);
    setReglages(true);
  };

  const enregistrerReglages = async () => {
    const v = await formReglages.validateFields();
    setEnvoi(true);
    try {
      await enregistrerFiscalite({
        assujetti_tva: v.assujetti_tva,
        regime: v.regime,
        taux_is: v.taux_is,
        taux_minimum: v.taux_minimum,
        capital_social: v.capital_social || 0,
      });
      message.success("Réglages fiscaux enregistrés.");
      setReglages(false);
      actualiser();
    } catch (err) {
      message.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const annees = useMemo(() => {
    const liste = new Set([...(donnees?.annees || []), dayjs().year(), annee]);
    return [...liste].sort((a, b) => b - a);
  }, [donnees, annee]);

  if (!donnees) return <Spin spinning={chargement}><div className="h-64" /></Spin>;
  const p = donnees.parametres;
  const is = donnees.impot_resultat;
  const forfait = p.regime === "forfait";
  const enRetard = donnees.mois.filter((m) => m.statut === "en_retard");

  const colonnes: ColumnsType<MoisTva> = [
    { title: "Mois", dataIndex: "periode", render: (v: string) => <b className="text-slate-800">{nomMois(v)}</b> },
    { title: "TVA collectée", dataIndex: "collectee", align: "right", render: (n: number) => fmt(n) },
    {
      title: "TVA récupérable",
      dataIndex: "deductible",
      align: "right",
      render: (n: number, m) => (
        <Tooltip
          title={
            <div className="text-xs">
              <div>Charges : {fmt(m.deductible_charges)}</div>
              <div>Factures fournisseurs : {fmt(m.deductible_achats)}</div>
              <div>Immobilisations : {fmt(m.deductible_immobilisations)}</div>
            </div>
          }
        >
          <span className="cursor-help border-b border-dotted border-slate-300">{fmt(n)}</span>
        </Tooltip>
      ),
    },
    { title: "Crédit reporté", dataIndex: "credit_reporte", align: "right", render: (n: number) => (n ? fmt(n) : "—") },
    { title: "TVA à payer", dataIndex: "a_payer", align: "right", render: (n: number) => <b className={n ? "text-orange-700" : "text-slate-400"}>{fmt(n)}</b> },
    { title: "Payée", dataIndex: "paye", align: "right", render: (n: number) => (n ? <span className="text-emerald-700">{fmt(n)}</span> : "—") },
    {
      title: "Crédit à reporter",
      dataIndex: "credit_suivant",
      align: "right",
      render: (n: number) => (n ? <span className="text-purple-800">{fmt(n)}</span> : "—"),
    },
    ...(!forfait && p.taux_minimum
      ? [
          {
            title: <Tooltip title={`Minimum fiscal mensuel : ${formatTaux(p.taux_minimum)} du chiffre d'affaires HT du mois.`}>Acompte d'impôt</Tooltip>,
            dataIndex: "acompte_is",
            align: "right" as const,
            render: (n: number) => (n ? fmt(n) : "—"),
          },
        ]
      : []),
    {
      title: "Statut",
      key: "statut",
      render: (_, m) => (
        <div>
          <Pastille ton={STATUTS[m.statut].ton}>{STATUTS[m.statut].libelle}</Pastille>
          {(m.statut === "a_payer" || m.statut === "en_retard") && <div className="text-[11px] text-slate-400">avant le {dateCourte(m.echeance)}</div>}
        </div>
      ),
    },
    {
      title: "",
      key: "action",
      align: "right",
      render: (_, m) =>
        admin && m.reste > 0 && m.statut !== "a_venir" ? (
          <Button size="small" type="primary" ghost onClick={() => ouvrirPaiement("tva", m.periode, m.reste)}>
            Payer
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Exercice</span>
          <Select value={annee} onChange={setAnnee} options={annees.map((a) => ({ value: a, label: String(a) }))} className="w-28" />
        </div>
        <div className="flex flex-wrap gap-2">
          {admin && (
            <Button icon={<Plus size={14} />} onClick={() => ouvrirPaiement("is", String(annee), Math.max(is.reste, 0))}>
              Paiement d'impôt
            </Button>
          )}
          <Button icon={<Settings2 size={14} />} onClick={() => ouvrirReglages(p)} disabled={!admin}>
            Réglages fiscaux
          </Button>
        </div>
      </div>

      {enRetard.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            TVA non reversée après l'échéance : {enRetard.map((m) => nomMois(m.periode)).join(", ")} ({argent(enRetard.reduce((s, m) => s + m.reste, 0), devise)}).
            Des pénalités de retard peuvent s'appliquer.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CarteChiffre
          principale
          libelle="TVA restant à payer"
          valeur={argent(donnees.totaux.reste, devise)}
          detail={`${argent(donnees.totaux.paye, devise)} déjà reversés en ${annee}`}
          icone={<Receipt size={16} />}
        />
        <CarteChiffre
          libelle="Crédit de TVA"
          valeur={argent(donnees.totaux.credit_fin, devise)}
          detail="Reporté sur les mois suivants"
          icone={<BadgePercent size={16} />}
        />
        <CarteChiffre
          ton={is.reste > 0 ? "orange" : "vert"}
          libelle={`Impôt sur le résultat ${annee}${is.provisoire ? " (estimation)" : ""}`}
          valeur={argent(is.du, devise)}
          detail={forfait ? "Régime forfaitaire : payé en charges" : `Reste ${argent(Math.max(is.reste, 0), devise)} · versé ${argent(is.verse, devise)}`}
          icone={<Calculator size={16} />}
        />
        <CarteChiffre
          ton="gris"
          libelle="Autres impôts et taxes"
          valeur={argent(donnees.autres_taxes.total, devise)}
          detail={donnees.autres_taxes.a_payer ? `dont ${argent(donnees.autres_taxes.a_payer, devise)} à payer` : "Patente, taxes communales… (charges)"}
          icone={<Landmark size={16} />}
        />
      </div>

      <Section
        titre={`Déclarations de TVA ${annee}`}
        note={`Taux ${formatTaux(p.taux_tva)}${p.pays ? ` · ${p.pays}` : ""}${p.assujetti_tva ? "" : " · non assujetti"}`}
      >
        <Table
          rowKey="periode"
          size="small"
          columns={colonnes}
          dataSource={donnees.mois}
          pagination={false}
          scroll={{ x: 1100 }}
          rowClassName={(m) => (m.statut === "a_venir" ? "opacity-50" : "")}
          summary={() => (
            <Table.Summary.Row className="bg-purple-50 font-bold text-purple-950">
              <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">{fmt(donnees.totaux.collectee)}</Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">{fmt(donnees.totaux.deductible)}</Table.Summary.Cell>
              <Table.Summary.Cell index={3} />
              <Table.Summary.Cell index={4} align="right">{fmt(donnees.totaux.a_payer)}</Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">{fmt(donnees.totaux.paye)}</Table.Summary.Cell>
              <Table.Summary.Cell index={6} colSpan={4} />
            </Table.Summary.Row>
          )}
        />
        <p className="mb-0 mt-2 text-xs text-slate-500">
          TVA à payer = TVA collectée − TVA récupérable − crédit du mois précédent. Échéance indicative : le 15 du mois suivant (vérifiez le
          calendrier de votre administration fiscale).
        </p>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section titre={`Impôt sur le résultat ${annee}`} note={p.regimes.find((r) => r.value === p.regime)?.label}>
          {forfait ? (
            <p className="m-0 text-sm text-slate-600">
              Au régime forfaitaire, l'impôt libératoire (ou impôt synthétique) se saisit comme une charge de catégorie « Impôts et taxes ».
              Aucun impôt sur le bénéfice n'est calculé.
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-slate-100 p-0 text-sm">
              {[
                ["Chiffre d'affaires HT", argent(is.chiffre_affaires, devise)],
                ["Résultat avant impôt", argent(is.resultat_avant_impot, devise)],
                [`Impôt sur le bénéfice (${formatTaux(p.taux_is)})`, argent(is.theorique, devise)],
                [`Minimum fiscal (${formatTaux(p.taux_minimum)} du CA)`, argent(is.minimum, devise)],
              ].map(([l, v]) => (
                <li key={l} className="flex justify-between py-2">
                  <span className="text-slate-600">{l}</span>
                  <b className="text-purple-950">{v}</b>
                </li>
              ))}
              <li className="flex justify-between py-2">
                <span className="font-semibold text-slate-700">Impôt dû ({is.base === "minimum" ? "minimum fiscal" : "sur le bénéfice"})</span>
                <b className="text-orange-700">{argent(is.du, devise)}</b>
              </li>
              <li className="flex justify-between py-2">
                <span className="text-slate-600">Acomptes et paiements enregistrés</span>
                <b className="text-emerald-700">− {argent(is.verse, devise)}</b>
              </li>
              <li className="flex justify-between rounded-xl bg-purple-50 px-3 py-2">
                <span className="font-bold text-purple-950">{is.reste >= 0 ? "Reste à payer" : "Trop versé (créance sur l'État)"}</span>
                <b className="text-purple-950">{argent(Math.abs(is.reste), devise)}</b>
              </li>
            </ul>
          )}
          {is.provisoire && !forfait && (
            <p className="mb-0 mt-2 text-xs text-slate-500">Estimation sur les opérations déjà saisies de l'exercice en cours.</p>
          )}
        </Section>

        <Section titre="Paiements à l'État" note={`${donnees.operations.length} en ${annee}`}>
          {donnees.operations.length ? (
            <Table
              rowKey="_id"
              size="small"
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              dataSource={donnees.operations}
              columns={[
                { title: "Date", dataIndex: "date", render: (d: string) => dateCourte(d) },
                {
                  title: "Nature",
                  key: "n",
                  render: (_, o) => (
                    <div>
                      <div className="text-slate-800">{o.libelle_type}</div>
                      <div className="text-[11px] text-slate-400">
                        {o.type === "is" ? `Exercice ${o.periode}` : nomMois(o.periode)} · {libelleMode(o.mode_paiement)}
                        {o.reference ? ` · ${o.reference}` : ""}
                      </div>
                    </div>
                  ),
                },
                { title: "Montant", dataIndex: "montant", align: "right", render: (n: number) => <b>{fmt(n)}</b> },
                {
                  title: "",
                  key: "x",
                  align: "right",
                  render: (_, o) =>
                    admin ? (
                      <Popconfirm title="Supprimer ce paiement ?" okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }} onConfirm={() => supprimer(o)}>
                        <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
                      </Popconfirm>
                    ) : null,
                },
              ]}
            />
          ) : (
            <Empty description="Aucun paiement enregistré" />
          )}
        </Section>
      </div>

      <Section titre="Autres impôts et taxes de l'année" note="Saisis dans les charges, catégorie « Impôts et taxes »">
        {donnees.autres_taxes.lignes.length ? (
          <Table
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            dataSource={donnees.autres_taxes.lignes}
            columns={[
              { title: "Date", dataIndex: "date", render: (d: string) => dateCourte(d) },
              { title: "Impôt ou taxe", dataIndex: "nom" },
              { title: "Montant", dataIndex: "montant", align: "right", render: (n: number) => fmt(n) },
              {
                title: "Statut",
                dataIndex: "statut",
                render: (s: string) => <Pastille ton={s === "payee" ? "vert" : "orange"}>{s === "payee" ? "Payée" : "À payer"}</Pastille>,
              },
            ]}
          />
        ) : (
          <Empty description="Patente, taxe foncière, droits de timbre, taxe communale… : ajoutez-les dans les charges (catégorie « Impôts et taxes »)." />
        )}
      </Section>

      <Modal title="Paiement à l'État" open={paiement} onCancel={() => setPaiement(false)} onOk={enregistrerPaiement} confirmLoading={envoi} okText="Enregistrer" cancelText="Annuler">
        <Form form={formPaiement} layout="vertical" requiredMark={false} className="mt-3">
          <Form.Item name="type" label="Nature" rules={[{ required: true }]}>
            <Select
              options={TYPES}
              onChange={(t: TypeOperationFiscale) =>
                formPaiement.setFieldValue("periode", t === "is" ? String(annee) : dayjs().subtract(1, "month").format("YYYY-MM"))
              }
            />
          </Form.Item>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item
              name="periode"
              label={typePaiement === "is" ? "Exercice (année)" : "Mois déclaré (AAAA-MM)"}
              rules={[
                { required: true, message: "Indiquez la période" },
                {
                  pattern: typePaiement === "is" ? /^\d{4}$/ : /^\d{4}-(0[1-9]|1[0-2])$/,
                  message: typePaiement === "is" ? "Ex. 2026" : "Ex. 2026-09",
                },
              ]}
            >
              <Input placeholder={typePaiement === "is" ? "2026" : "2026-09"} />
            </Form.Item>
            <Form.Item name="montant" label={`Montant (${devise})`} rules={[{ required: true, message: "Indiquez le montant" }]}>
              <InputNumber min={1} className="!w-full" />
            </Form.Item>
            <Form.Item name="date" label="Date du paiement" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" className="w-full" allowClear={false} />
            </Form.Item>
            <Form.Item name="mode_paiement" label={typePaiement === "remboursement_tva" ? "Reçu sur" : "Payé par"}>
              <Select options={MODES_REGLEMENT} />
            </Form.Item>
          </div>
          <Form.Item name="reference" label="N° de quittance / déclaration">
            <Input placeholder="Facultatif" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Réglages fiscaux" open={reglages} onCancel={() => setReglages(false)} onOk={enregistrerReglages} confirmLoading={envoi} okText="Enregistrer" cancelText="Annuler" width={600}>
        <p className="mt-0 text-xs text-slate-500">
          Les taux par défaut viennent du pays du magasin ({p.pays || "pays non renseigné"}). Ils changent avec les lois de finances et la
          taille de l'entreprise : faites-les confirmer par votre comptable.
        </p>
        <Form form={formReglages} layout="vertical" requiredMark={false}>
          <div className="mb-4 flex items-center justify-between rounded-xl border border-purple-100 px-3 py-2">
            <div>
              <div className="text-sm font-semibold text-slate-800">Assujetti à la TVA</div>
              <div className="text-xs text-slate-500">Taux du pays : {formatTaux(p.taux_tva)}. Sinon, la TVA n'est pas proposée sur les achats.</div>
            </div>
            <Form.Item name="assujetti_tva" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="regime" label="Régime d'imposition">
            <Select options={p.regimes} />
          </Form.Item>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item
              name="taux_is"
              label="Impôt sur le bénéfice (%)"
              extra={p.taux_is_defaut !== null ? `Par défaut : ${formatTaux(p.taux_is_defaut)}` : "Pas de taux connu pour ce pays"}
              rules={[{ required: true, message: "Indiquez le taux" }]}
            >
              <InputNumber min={0} max={100} step={0.5} className="!w-full" />
            </Form.Item>
            <Form.Item name="taux_minimum" label="Minimum fiscal (% du CA)" extra={`Par défaut : ${formatTaux(p.taux_minimum_defaut)}`} rules={[{ required: true, message: "Indiquez le taux" }]}>
              <InputNumber min={0} max={100} step={0.1} className="!w-full" />
            </Form.Item>
          </div>
          <Form.Item name="capital_social" label={`Capital social ou apport de départ (${devise})`} extra="Montant figurant dans les statuts ; affiché au passif du bilan.">
            <InputNumber min={0} className="!w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Fiscalite;
