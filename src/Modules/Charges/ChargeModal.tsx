// Saisie d'une charge : montant TTC avec sa TVA récupérable (calculée au taux
// réel du pays du magasin, modifiable), fournisseur et n° de facture, payée ou
// à payer (échéance), ponctuelle ou récurrente.
import React, { useEffect, useState } from "react";
import { DatePicker, Form, Input, InputNumber, Modal, Segmented, Select, Switch } from "antd";
import dayjs from "dayjs";
import type { Charge, ChargeCategory, CreateChargeDto } from "./types";
import { CATEGORIES_AVEC_TVA, CATEGORIES_CHARGES, MODES_REGLEMENT, RECURRENCES, tvaDansTtc } from "./chargeService";
import { formatTaux, useFiscalite } from "./financeUi";

interface ChargeModalProps {
  visible: boolean;
  onCancel: () => void;
  initialValues?: Charge | null;
  loading: boolean;
  devise: string;
  onFinish: (values: CreateChargeDto) => void;
}

const ChargeModal: React.FC<ChargeModalProps> = ({ visible, onCancel, initialValues, loading, devise, onFinish }) => {
  const [form] = Form.useForm();
  const statut = Form.useWatch("statut", form);
  const montant = Form.useWatch("montant", form) as number | undefined;
  const categorie = Form.useWatch("categorie", form) as ChargeCategory | undefined;
  const avecTva = Form.useWatch("avec_tva", form) as boolean | undefined;
  const tvaSaisie = Form.useWatch("montant_tva", form) as number | undefined;
  const fiscalite = useFiscalite();
  const taux = fiscalite?.taux_tva ?? null;
  // Vrai quand l'utilisateur a corrigé la TVA calculée (facture à taux réduit, montant arrondi…).
  const [manuelle, setManuelle] = useState(false);

  // TVA calculée à partir du TTC, au taux du pays du magasin.
  useEffect(() => {
    if (!visible || manuelle) return;
    form.setFieldValue("montant_tva", avecTva ? tvaDansTtc(montant || 0, taux) : 0);
  }, [visible, manuelle, avecTva, montant, taux, form]);

  const changerCategorie = (cle: ChargeCategory) => {
    if (initialValues || manuelle) return;
    form.setFieldValue("avec_tva", !!fiscalite?.assujetti_tva && CATEGORIES_AVEC_TVA.has(cle));
  };

  useEffect(() => {
    if (!visible) return;
    form.resetFields();
    if (initialValues) {
      const calculee = tvaDansTtc(initialValues.montant, taux);
      setManuelle(initialValues.montant_tva > 0 && Math.abs(initialValues.montant_tva - calculee) > 1);
      form.setFieldsValue({
        avec_tva: initialValues.montant_tva > 0,
        ...initialValues,
        date_charge: initialValues.date_charge ? dayjs(initialValues.date_charge) : dayjs(),
        date_paiement: initialValues.date_paiement ? dayjs(initialValues.date_paiement) : undefined,
        date_echeance: initialValues.date_echeance ? dayjs(initialValues.date_echeance) : undefined,
      });
    } else {
      setManuelle(false);
      form.setFieldsValue({
        avec_tva: !!fiscalite?.assujetti_tva && CATEGORIES_AVEC_TVA.has("autre"),
        categorie: "autre",
        statut: "payee",
        mode_paiement: "cash",
        recurrence: "aucune",
        montant_tva: 0,
        date_charge: dayjs(),
      });
    }
    // Recalculé quand les réglages fiscaux arrivent (taux et assujettissement).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialValues, form, fiscalite]);

  const valider = async () => {
    const v = await form.validateFields();
    // Heure locale, sans fuseau : la date choisie reste celle du magasin.
    const iso = (d?: dayjs.Dayjs) => (d ? d.format("YYYY-MM-DDTHH:mm:ss") : null);
    onFinish({
      nom: v.nom.trim(),
      montant: v.montant,
      montant_tva: v.avec_tva ? v.montant_tva || 0 : 0,
      categorie: v.categorie,
      description: v.description || "",
      fournisseur: v.fournisseur || "",
      reference: v.reference || "",
      statut: v.statut,
      date_charge: iso(v.date_charge) || undefined,
      date_paiement: v.statut === "payee" ? iso(v.date_paiement || v.date_charge) : null,
      date_echeance: v.statut === "a_payer" ? iso(v.date_echeance) : null,
      mode_paiement: v.statut === "payee" ? v.mode_paiement : v.mode_paiement || null,
      recurrence: v.recurrence,
    });
  };

  return (
    <Modal
      title={initialValues ? "Modifier la charge" : "Nouvelle charge"}
      open={visible}
      onCancel={onCancel}
      onOk={valider}
      confirmLoading={loading}
      width={680}
      okText="Enregistrer"
      cancelText="Annuler"
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark={false} className="mt-3">
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item name="nom" label="Libellé" rules={[{ required: true, whitespace: true, message: "Indiquez le libellé" }]}>
            <Input placeholder="Ex. Loyer d'octobre" />
          </Form.Item>
          <Form.Item name="categorie" label="Catégorie (compte comptable)" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              onChange={changerCategorie}
              options={CATEGORIES_CHARGES.map((c) => ({ value: c.value, label: `${c.compte} · ${c.label}` }))}
            />
          </Form.Item>
          <Form.Item
            name="montant"
            label={`Montant TTC (${devise})`}
            rules={[{ required: true, message: "Indiquez le montant" }]}
          >
            <InputNumber min={0} className="!w-full" placeholder="0" />
          </Form.Item>
          <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50/40 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-700">TVA récupérable</span>
              <Form.Item name="avec_tva" valuePropName="checked" noStyle>
                <Switch size="small" onChange={() => setManuelle(false)} />
              </Form.Item>
            </div>
            {avecTva ? (
              <div className="mt-1 text-xs text-slate-500">
                {manuelle ? (
                  <Form.Item
                    name="montant_tva"
                    className="!mb-0 !mt-1"
                    dependencies={["montant"]}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator: (_, valeur) =>
                          (valeur || 0) > (getFieldValue("montant") || 0)
                            ? Promise.reject(new Error("La TVA ne peut pas dépasser le montant"))
                            : Promise.resolve(),
                      }),
                    ]}
                  >
                    <InputNumber min={0} size="small" className="!w-full" addonAfter={devise} />
                  </Form.Item>
                ) : (
                  <span>
                    <Form.Item name="montant_tva" hidden><InputNumber /></Form.Item>
                    <b className="text-purple-950">{(tvaSaisie || 0).toLocaleString("fr-FR")} {devise}</b> au taux de {formatTaux(taux)}
                    {fiscalite?.pays ? ` (${fiscalite.pays})` : ""}
                  </span>
                )}
                <button type="button" className="ml-2 text-purple-700 underline" onClick={() => setManuelle(!manuelle)}>
                  {manuelle ? "Recalculer" : "Corriger"}
                </button>
                {!taux && !manuelle && <div className="text-orange-600">Taux inconnu pour le pays du magasin : saisissez la TVA.</div>}
              </div>
            ) : (
              <div className="mt-1 text-xs text-slate-400">
                {categorie && !CATEGORIES_AVEC_TVA.has(categorie) ? "Pas de TVA sur ce type de charge." : "Facture sans TVA (ou non récupérable)."}
                <Form.Item name="montant_tva" hidden><InputNumber /></Form.Item>
              </div>
            )}
          </div>
          <Form.Item name="fournisseur" label="Fournisseur / bénéficiaire">
            <Input placeholder="Ex. ENEO, bailleur, employé…" />
          </Form.Item>
          <Form.Item name="reference" label="N° de facture / pièce">
            <Input placeholder="Facultatif" />
          </Form.Item>
          <Form.Item name="date_charge" label="Date de la charge" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" className="w-full" allowClear={false} />
          </Form.Item>
          <Form.Item name="recurrence" label="Répétition">
            <Select options={RECURRENCES} />
          </Form.Item>
        </div>

        <Form.Item name="statut" label="Règlement">
          <Segmented
            block
            options={[
              { value: "payee", label: "Déjà payée" },
              { value: "a_payer", label: "À payer plus tard" },
            ]}
          />
        </Form.Item>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {statut === "a_payer" ? (
            <Form.Item name="date_echeance" label="Échéance de paiement">
              <DatePicker format="DD/MM/YYYY" className="w-full" />
            </Form.Item>
          ) : (
            <Form.Item name="date_paiement" label="Date du paiement" tooltip="Par défaut, la date de la charge.">
              <DatePicker format="DD/MM/YYYY" className="w-full" />
            </Form.Item>
          )}
          <Form.Item name="mode_paiement" label="Moyen de paiement">
            <Select options={MODES_REGLEMENT} allowClear={statut === "a_payer"} />
          </Form.Item>
        </div>
        <Form.Item name="description" label="Note">
          <Input.TextArea rows={2} placeholder="Facultatif" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChargeModal;
