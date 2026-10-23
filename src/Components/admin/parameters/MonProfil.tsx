// Onglet « Mon profil » : les informations du compte connecté, modifiables
// par l'utilisateur lui-même (sauf l'email, qui sert d'identifiant).
import React, { useState } from "react";
import { App, Button, Card, DatePicker, Form, Input, Modal, Select } from "antd";
import { EditOutlined, IdcardOutlined, UserOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { getUrlServer } from "../../../configServer";
import type { UtilisateurConnecte } from "../../../hooks/useCompteConnecte";
import { DetailItem, RoleTag, SectionTitle } from "./elements";
import { carte, formatDate, formatPhone, getApiError } from "./outils";
import { StoreStatus } from "../../super-admin/magasin/storeUi";

interface Props {
  utilisateur: UtilisateurConnecte;
  libelleRole: string;
  onSaved: () => void;
}

interface Valeurs {
  first_name: string;
  name: string;
  telephone?: string;
  sexe?: string;
  date_naissance?: Dayjs | null;
  fonction?: string;
}

const MonProfil: React.FC<Props> = ({ utilisateur, libelleRole, onSaved }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<Valeurs>();
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const ouvrir = () => {
    form.setFieldsValue({
      first_name: utilisateur.first_name,
      name: utilisateur.name,
      telephone: utilisateur.telephone,
      sexe: utilisateur.sexe,
      date_naissance: utilisateur.date_naissance ? dayjs(utilisateur.date_naissance) : null,
      fonction: utilisateur.fonction,
    });
    setOuvert(true);
  };

  const enregistrer = async (v: Valeurs) => {
    setEnvoi(true);
    try {
      const token = localStorage.getItem("access_token");
      const r = await fetch(`${getUrlServer()}/users/${utilisateur._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: v.first_name.trim(),
          name: v.name.trim(),
          // Un champ vidé est envoyé vide : le serveur le retire du compte.
          telephone: (v.telephone || "").replace(/[\s.\-()]/g, ""),
          sexe: v.sexe || "",
          date_naissance: v.date_naissance ? v.date_naissance.format("YYYY-MM-DD") : "",
          fonction: (v.fonction || "").trim(),
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(getApiError(data, "Impossible d'enregistrer votre profil."));
      message.success("Profil mis à jour.");
      setOuvert(false);
      onSaved();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Card variant="borderless" className={carte}>
      <SectionTitle
        icon={<UserOutlined />}
        title="Mes informations"
        description="Votre compte personnel dans ce magasin"
        extra={
          <Button icon={<EditOutlined />} onClick={ouvrir}>
            Modifier
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <DetailItem label="Prénom" value={utilisateur.first_name} />
        <DetailItem label="Nom" value={utilisateur.name} />
        <DetailItem label="Email (identifiant de connexion)" value={utilisateur.email} />
        <DetailItem label="Téléphone" value={formatPhone(utilisateur.telephone)} />
        <DetailItem label="Rôle" value={<RoleTag role={utilisateur.role} libelle={libelleRole} />} />
        <DetailItem label="Fonction" value={utilisateur.fonction} />
        <DetailItem label="Sexe" value={utilisateur.sexe} />
        <DetailItem label="Date de naissance" value={formatDate(utilisateur.date_naissance)} />
        <DetailItem label="Compte créé le" value={formatDate(utilisateur.created_at)} />
        <DetailItem
          label="Statut du compte"
          value={<StoreStatus store={{ is_active: utilisateur.is_active !== false }} />}
        />
      </div>

      <Modal
        open={ouvert}
        onCancel={() => setOuvert(false)}
        centered
        width={560}
        title={
          <span className="flex items-center gap-2">
            <IdcardOutlined className="text-purple-800" /> Modifier mes informations
          </span>
        }
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={envoi}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={enregistrer} className="pt-2">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="first_name" label="Prénom" rules={[{ required: true, whitespace: true, message: "Le prénom est requis" }]}>
              <Input maxLength={80} />
            </Form.Item>
            <Form.Item name="name" label="Nom" rules={[{ required: true, whitespace: true, message: "Le nom est requis" }]}>
              <Input maxLength={80} />
            </Form.Item>
            <Form.Item
              name="telephone"
              label="Téléphone"
              rules={[{ pattern: /^\+[1-9][\d\s.\-()]{6,20}$/, message: "Format international : +237 6 90 12 34 56" }]}
            >
              <Input placeholder="+237 6 90 12 34 56" maxLength={22} />
            </Form.Item>
            <Form.Item name="fonction" label="Fonction">
              <Input placeholder="Ex. : Directeur commercial" maxLength={100} />
            </Form.Item>
            <Form.Item name="sexe" label="Sexe">
              <Select allowClear placeholder="Choisir" options={[{ value: "Homme" }, { value: "Femme" }]} />
            </Form.Item>
            <Form.Item name="date_naissance" label="Date de naissance">
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                disabledDate={(d) => d.isAfter(dayjs().subtract(16, "year"), "day")}
                defaultPickerValue={dayjs().subtract(30, "year")}
              />
            </Form.Item>
          </div>
          <p className="text-xs text-slate-500">
            L'email sert à vous connecter : pour le changer, demandez-le à{" "}
            {utilisateur.role === "admin" ? "l'équipe Lumistock" : "l'administrateur du magasin"}.
          </p>
        </Form>
      </Modal>
    </Card>
  );
};

export default MonProfil;
