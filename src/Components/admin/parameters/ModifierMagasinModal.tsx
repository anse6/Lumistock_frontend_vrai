// Modification de la fiche du magasin par son administrateur.
// La licence n'est pas modifiable ici : le serveur la réserve au staff.
import React, { useEffect, useMemo, useState } from "react";
import { App, AutoComplete, Form, Input, Modal, Select, Upload } from "antd";
import type { UploadFile } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { getUrlServer } from "../../../configServer";
import type { MagasinConnecte } from "../../../hooks/useCompteConnecte";
import {
  countryOptions,
  findCountryOption,
  legalEntityOptions,
  useCitiesForCountry,
  useNeighborhoodsForCity,
} from "../../super-admin/magasin/locationData";
import CitySelect from "../../super-admin/magasin/CitySelect";
import { currencyOptions } from "../../super-admin/magasin/storeOptions";
import { getApiError } from "./outils";

interface Props {
  open: boolean;
  magasin: MagasinConnecte;
  onClose: () => void;
  onSaved: () => void;
}

type Valeurs = Record<string, string | undefined>;

// Champs envoyés tels quels ; un champ facultatif vidé part en "" et le
// serveur l'efface. « region » n'a pas de champ ici : jamais envoyé.
const CHAMPS = [
  "denomination", "raison_sociale", "forme_juridique", "activité", "email", "site_web", "devise",
  "country_code", "ville", "quartier", "adresse_ligne_1", "adresse_ligne_2", "code_postal",
  "numero_immatriculation", "numero_fiscal",
];

const pays = (m: MagasinConnecte) =>
  m.country_code || countryOptions.find((c) => c.name === m.pays)?.code || "CM";

const ModifierMagasinModal: React.FC<Props> = ({ open, magasin, onClose, onSaved }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<Valeurs>();
  const [envoi, setEnvoi] = useState(false);
  const [logo, setLogo] = useState<UploadFile[]>([]);
  const [apercu, setApercu] = useState<string | null>(null);

  const codePays = Form.useWatch("country_code", form);
  const ville = Form.useWatch("ville", form);
  const paysChoisi = findCountryOption(codePays);
  const { cities, isLoading: chargementVilles } = useCitiesForCountry(codePays);
  const { neighborhoods } = useNeighborhoodsForCity(codePays, ville);
  const quartiers = useMemo(() => neighborhoods.map((n) => ({ value: n })), [neighborhoods]);

  useEffect(() => {
    if (!open) return;
    const code = pays(magasin);
    const indicatif = findCountryOption(code)?.callingCode || "";
    const tel = magasin.telephone || "";
    form.setFieldsValue({
      ...Object.fromEntries(CHAMPS.map((c) => [c, (magasin as unknown as Valeurs)[c] || undefined])),
      country_code: code,
      telephone: tel.startsWith(indicatif) ? tel.slice(indicatif.length) : tel.replace(/\D/g, ""),
    });
    setLogo([]);
    setApercu(magasin.logo || null);
  }, [open, magasin, form]);

  const enregistrer = async (v: Valeurs) => {
    setEnvoi(true);
    try {
      const fd = new FormData();
      CHAMPS.forEach((c) => fd.append(c, (v[c] || "").trim()));
      fd.append("pays", paysChoisi?.name || magasin.pays || "");
      const chiffres = (v.telephone || "").replace(/\D/g, "");
      if (chiffres) fd.append("telephone", `${paysChoisi?.callingCode || ""}${chiffres}`);
      if (logo[0]?.originFileObj) fd.append("image", logo[0].originFileObj);

      const r = await fetch(`${getUrlServer()}/magasin/update/${magasin._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: fd,
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(getApiError(data, "Impossible d'enregistrer le magasin."));
      message.success("Informations du magasin enregistrées.");
      onSaved();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={760}
      centered
      title="Modifier les informations du magasin"
      okText="Enregistrer"
      cancelText="Annuler"
      confirmLoading={envoi}
      onOk={() => form.submit()}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" } }}
    >
      <Form form={form} layout="vertical" requiredMark="optional" onFinish={enregistrer} className="pt-2">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {apercu ? (
              <img src={apercu} alt="Logo du magasin" className="h-full w-full object-contain p-1.5" />
            ) : (
              <PictureOutlined className="text-3xl text-purple-300" />
            )}
          </div>
          <Upload
            accept="image/png,image/jpeg,image/webp"
            maxCount={1}
            fileList={logo}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              setLogo(fileList);
              const f = fileList[0]?.originFileObj;
              if (f) {
                const lecteur = new FileReader();
                lecteur.onload = () => setApercu(lecteur.result as string);
                lecteur.readAsDataURL(f);
              } else {
                setApercu(magasin.logo || null);
              }
            }}
          >
            <button type="button" className="rounded-lg border border-dashed border-purple-300 px-4 py-2 text-sm font-medium text-purple-900 hover:bg-purple-50">
              Changer le logo
            </button>
          </Upload>
        </div>

        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Identité</h4>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="denomination" label="Dénomination" rules={[{ required: true, min: 3, message: "3 caractères minimum" }]}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name="raison_sociale" label="Raison sociale">
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="forme_juridique" label="Forme juridique">
            <Select allowClear showSearch options={legalEntityOptions} />
          </Form.Item>
          <Form.Item name="activité" label="Activité" rules={[{ required: true, message: "L'activité est requise" }]}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Email valide requis" }]}>
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item
            name="telephone"
            label="Téléphone"
            rules={[
              { pattern: /^\d{6,14}$/, message: "Chiffres uniquement" },
              ...(codePays === "CM" ? [{ len: 9, message: "9 chiffres au Cameroun" }] : []),
            ]}
          >
            <Input
              addonBefore={paysChoisi ? `${paysChoisi.flag} ${paysChoisi.callingCode}` : "+"}
              maxLength={codePays === "CM" ? 9 : 14}
              onChange={(e) => form.setFieldValue("telephone", e.target.value.replace(/\D/g, ""))}
            />
          </Form.Item>
          <Form.Item name="site_web" label="Site web" rules={[{ type: "url", message: "Adresse complète : https://…" }]}>
            <Input placeholder="https://" maxLength={200} />
          </Form.Item>
          <Form.Item name="devise" label="Devise">
            <Select allowClear showSearch optionFilterProp="label" options={currencyOptions} />
          </Form.Item>
        </div>

        <h4 className="mb-3 mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Adresse</h4>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="country_code" label="Pays" rules={[{ required: true, message: "Le pays est requis" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={countryOptions.map((c) => ({ value: c.code, label: `${c.flag} ${c.name} (${c.callingCode})` }))}
              onChange={() => form.setFieldsValue({ ville: undefined, quartier: undefined })}
            />
          </Form.Item>
          <Form.Item name="ville" label="Ville" rules={[{ required: true, message: "La ville est requise" }]}>
            <CitySelect
              cities={cities}
              loading={chargementVilles}
              disabled={!codePays}
              placeholder="Choisir ou saisir la ville"
              onCityChange={() => form.setFieldValue("quartier", undefined)}
            />
          </Form.Item>
          <Form.Item name="quartier" label="Quartier" rules={[{ required: true, whitespace: true, message: "Le quartier est requis" }]}>
            <AutoComplete options={quartiers} filterOption placeholder="Choisir ou saisir le quartier">
              <Input maxLength={120} />
            </AutoComplete>
          </Form.Item>
          <Form.Item name="code_postal" label="Code postal / BP">
            <Input maxLength={30} />
          </Form.Item>
          <Form.Item name="adresse_ligne_1" label="Adresse ligne 1">
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="adresse_ligne_2" label="Adresse ligne 2">
            <Input maxLength={255} />
          </Form.Item>
        </div>

        <h4 className="mb-3 mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Informations légales</h4>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="numero_immatriculation" label="N° d'immatriculation">
            <Input placeholder="Ex. : RCCM" maxLength={120} />
          </Form.Item>
          <Form.Item name="numero_fiscal" label="N° fiscal">
            <Input placeholder="Ex. : NIU" maxLength={120} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default ModifierMagasinModal;
