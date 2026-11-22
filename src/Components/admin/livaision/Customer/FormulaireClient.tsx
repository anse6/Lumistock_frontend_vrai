// Formulaire de création d'un client, commun à la page Clients › Nouveau
// client et à l'étape « Client » d'une vente : photo, nom, téléphone
// international (le pays du numéro est celui du client), email, ville et
// quartier du pays, avance sur le compte client et dette d'avant Lumistock.
import React, { useEffect, useState } from "react";
import { App, Form, Input, InputNumber, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { Camera, ChevronDown, ChevronUp, Mail, MapPin, NotebookPen, Phone, Save, User, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { CountryCode } from "libphonenumber-js";
import { api, messageErreur } from "../../../../api/client";
import TelephoneInternational, {
  Drapeau,
  nomPays,
  numeroInternational,
  numeroValide,
  PAYS_PAR_DEFAUT,
} from "../livraisonfinal/TelephoneInternational";
import VilleQuartier from "./VilleQuartier";
import { useTvaMagasin } from "../selectionproduct/Clients/tva";

export const PURPLE_950 = "#3b0764";
const TAILLE_MAX_PHOTO = 5 * 1024 * 1024;

/** Client tout juste créé, renvoyé à l'écran appelant. */
export interface ClientCree {
  id: string;
  nom: string;
}

interface Valeurs {
  fullName: string;
  email?: string;
  montantCaisse?: number | null;
  detteOuverture?: number | null;
}

interface Props {
  onCree: (client: ClientCree) => void;
  onAnnuler: () => void;
  /** Mise en page resserrée (dans une vente) : le nom seul, les autres
   * champs derrière « Ajouter d'autres informations sur le client ». */
  compact?: boolean;
  /** Champ « Dette d'avant Lumistock » (le serveur l'ignore pour un caissier). */
  avecDette?: boolean;
}

// Carte de section du formulaire : icône, titre et sous-titre.
export const Section: React.FC<{ icone: React.ReactNode; titre: string; sousTitre?: string; children: React.ReactNode }> = ({
  icone,
  titre,
  sousTitre,
  children,
}) => (
  <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-950">{icone}</span>
      <div>
        <h2 className="text-sm font-bold text-purple-950">{titre}</h2>
        {sousTitre && <p className="text-xs text-slate-500">{sousTitre}</p>}
      </div>
    </div>
    {children}
  </section>
);

const libelle = (texte: string, obligatoire = false) => (
  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
    {texte} {obligatoire && <span className="text-red-500">*</span>}
  </span>
);

const montantCfa = {
  size: "large" as const,
  className: "w-full sm:!w-72",
  min: 0,
  precision: 0,
  placeholder: "0",
  formatter: (v: number | string | undefined) => `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, " "),
  parser: (v: string | undefined) => Number((v || "").replace(/\s|CFA/g, "")),
  addonAfter: "CFA",
};

const FormulaireClient: React.FC<Props> = ({ onCree, onAnnuler, compact = false, avecDette = true }) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<Valeurs>();
  const queryClient = useQueryClient();
  const { tva } = useTvaMagasin();

  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  // Le pays du client est celui choisi avec son numéro (par défaut : pays du magasin).
  const [paysChoisi, setPaysChoisi] = useState(false);
  const [telephone, setTelephone] = useState<{ pays: CountryCode; chiffres: string }>({
    pays: PAYS_PAR_DEFAUT,
    chiffres: "",
  });
  const pays = telephone.pays;
  const [lieu, setLieu] = useState({ ville: "", quartier: "" });
  // Dans une vente, seul le nom est affiché ; le reste se déroule sur demande.
  const [plusDInfos, setPlusDInfos] = useState(false);

  // Pays du magasin connu : il devient le pays proposé (tant que rien n'est choisi).
  useEffect(() => {
    const code = tva?.code as CountryCode | null | undefined;
    if (code && !paysChoisi) setTelephone((tel) => (tel.chiffres ? tel : { pays: code, chiffres: "" }));
  }, [tva?.code, paysChoisi]);

  const changerTelephone = (p: CountryCode, chiffres: string) => {
    if (p !== telephone.pays) {
      setPaysChoisi(true);
      // Autre pays : la ville et le quartier saisis n'y appartiennent plus.
      setLieu({ ville: "", quartier: "" });
    }
    setTelephone({ pays: p, chiffres });
  };

  const telephoneSaisi = telephone.chiffres.length > 0;
  const telephoneOk = !telephoneSaisi || numeroValide(telephone.pays, telephone.chiffres);

  const controlePhoto: UploadProps["beforeUpload"] = (fichier) => {
    if (!fichier.type.startsWith("image/")) {
      message.error("La photo doit être une image (PNG, JPG, WEBP…).");
      return Upload.LIST_IGNORE;
    }
    if (fichier.size > TAILLE_MAX_PHOTO) {
      message.error("La photo ne doit pas dépasser 5 Mo.");
      return Upload.LIST_IGNORE;
    }
    return false; // envoyée avec le formulaire, pas tout de suite
  };

  const enregistrer = async (valeurs: Valeurs) => {
    if (!telephoneOk) {
      setErreur("Le numéro de téléphone n'est pas valide pour le pays choisi.");
      return;
    }
    const nom = valeurs.fullName.trim();
    const corps = new FormData();
    corps.append("nom", nom);
    if (valeurs.email?.trim()) corps.append("email", valeurs.email.trim());
    if (lieu.ville.trim()) corps.append("ville", lieu.ville.trim());
    if (lieu.quartier.trim()) corps.append("quartier", lieu.quartier.trim());
    corps.append("pays", pays);
    if (telephoneSaisi) corps.append("telephone", numeroInternational(telephone.pays, telephone.chiffres));
    if (valeurs.montantCaisse) corps.append("montant_en_caisse", String(valeurs.montantCaisse));
    if (avecDette && valeurs.detteOuverture) corps.append("dette_ouverture", String(valeurs.detteOuverture));
    const photo = fileList[0]?.originFileObj;
    if (photo) corps.append("photo_profil", photo);

    setEnvoi(true);
    setErreur(null);
    try {
      const { data } = await api.post<{ client_id: string }>("/clients/create", corps);
      // Les listes de clients (page Clients, choix du client d'une vente) se rechargent.
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      message.success(`Client « ${nom} » créé avec succès.`);
      onCree({ id: String(data.client_id), nom });
    } catch (err) {
      setErreur(messageErreur(err, t("admin.customers.add.validation.error")));
    } finally {
      setEnvoi(false);
    }
  };

  /* ------------------------------------------------ champs (communs aux deux mises en page) */

  const champNom = (
    <Form.Item
      name="fullName"
      label={libelle(t("admin.customers.add.fullName"), true)}
      rules={[
        { required: true, whitespace: true, message: t("admin.customers.add.validation.nameRequired") },
        { max: 100, message: "100 caractères maximum." },
      ]}
      className="!mb-0"
    >
      <Input size="large" placeholder={t("admin.customers.add.placeholders.fullName")} maxLength={100} autoFocus={compact} />
    </Form.Item>
  );

  const champTelephone = (
    <div>
      <div className="mb-2">{libelle(t("admin.customers.add.phone"))}</div>
      <TelephoneInternational pays={telephone.pays} chiffres={telephone.chiffres} onChange={changerTelephone} disabled={envoi} />
      {!compact && <p className="mt-1 text-xs text-slate-500">Le pays choisi ici est aussi celui du client.</p>}
    </div>
  );

  const champEmail = (
    <Form.Item
      name="email"
      label={libelle(t("admin.customers.add.email"))}
      rules={[{ type: "email", message: t("admin.customers.add.validation.invalidEmail") }]}
      className="!mb-0"
    >
      <Input
        size="large"
        prefix={<Mail size={15} className="text-purple-400" />}
        placeholder={t("admin.customers.add.placeholders.email")}
        maxLength={120}
      />
    </Form.Item>
  );

  const champsAdresse = (
    <VilleQuartier pays={pays} ville={lieu.ville} quartier={lieu.quartier} onChange={setLieu} disabled={envoi} />
  );

  const champCaisse = (
    <Form.Item name="montantCaisse" label={libelle(t("admin.customers.add.cashAmount"))} className="!mb-0">
      <InputNumber<number> {...montantCfa} className={compact ? "w-full" : montantCfa.className} />
    </Form.Item>
  );

  const champDette = (
    <Form.Item name="detteOuverture" label={libelle("Dette d'avant Lumistock")} className="!mb-0">
      <InputNumber<number> {...montantCfa} className={compact ? "w-full" : montantCfa.className} />
    </Form.Item>
  );

  const champPhoto = (
    <Upload
      listType="picture-circle"
      fileList={fileList}
      beforeUpload={controlePhoto}
      onChange={({ fileList: liste }) => setFileList(liste.slice(-1))}
      accept="image/*"
      maxCount={1}
    >
      {fileList.length === 0 && (
        <div className="flex flex-col items-center text-purple-950">
          <Camera size={compact ? 18 : 22} />
          <span className="mt-1 text-xs font-semibold">Ajouter</span>
        </div>
      )}
    </Upload>
  );

  const blocErreur = erreur && (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</div>
  );

  const boutons = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onAnnuler}
        disabled={envoi}
        className="rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-sm font-semibold text-purple-950 hover:bg-purple-50 disabled:opacity-50"
      >
        {t("admin.customers.add.cancel")}
      </button>
      <button
        type="submit"
        disabled={envoi || !telephoneOk}
        className="flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-950/20 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: PURPLE_950 }}
      >
        {envoi ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Save size={16} />
        )}
        {t("admin.customers.add.save")}
      </button>
    </div>
  );

  /* ------------------------------------------------ dans une vente : le nom, le reste sur demande */

  if (compact) {
    return (
      <Form form={form} layout="vertical" requiredMark={false} onFinish={enregistrer} initialValues={{ montantCaisse: null }}>
        <div className="space-y-4">
          {champNom}

          <button
            type="button"
            onClick={() => setPlusDInfos((v) => !v)}
            aria-expanded={plusDInfos}
            className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-purple-950 hover:text-purple-700"
          >
            {plusDInfos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {plusDInfos ? "Masquer les autres informations" : "Ajouter d'autres informations sur le client"}
          </button>

          {plusDInfos && (
            <div className="space-y-4 rounded-xl border border-purple-100 bg-white p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {champTelephone}
                {champEmail}
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                  <Drapeau code={pays} />
                  <span>
                    Adresse au <span className="font-semibold text-purple-950">{nomPays(pays)}</span> (pays du numéro)
                  </span>
                </div>
                {champsAdresse}
              </div>
              <div className={`grid gap-4 ${avecDette ? "sm:grid-cols-2" : ""}`}>
                {champCaisse}
                {avecDette && champDette}
              </div>
              <div className="flex items-center gap-3">
                {champPhoto}
                <p className="text-xs text-slate-500">Photo du client · facultatif, 5 Mo maximum</p>
              </div>
            </div>
          )}

          {blocErreur}
          {boutons}
        </div>
      </Form>
    );
  }

  /* ------------------------------------------------ page Clients › Nouveau client : sections détaillées */

  return (
    <Form form={form} layout="vertical" requiredMark={false} onFinish={enregistrer} initialValues={{ montantCaisse: null }}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4">
            <Section icone={<Camera size={18} />} titre="Photo du client" sousTitre="Facultatif · image de 5 Mo maximum">
              <div className="flex flex-col items-center gap-3 rounded-xl bg-purple-50/50 py-6">
                {champPhoto}
                <p className="px-4 text-center text-xs text-slate-500">
                  {fileList.length ? "Survolez la photo pour la voir ou la retirer." : t("admin.customers.add.uploadPrompt")}
                </p>
              </div>
            </Section>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Section icone={<User size={18} />} titre="Identité">
            {champNom}
          </Section>

          <Section icone={<Phone size={18} />} titre="Coordonnées" sousTitre="Pour joindre le client et lui envoyer ses reçus">
            <div className="grid gap-4 sm:grid-cols-2">
              {champTelephone}
              {champEmail}
            </div>
          </Section>

          <Section icone={<MapPin size={18} />} titre="Adresse" sousTitre="Les villes du pays sont proposées, puis les quartiers de la ville choisie">
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm">
              <Drapeau code={pays} />
              <span className="font-semibold text-purple-950">{nomPays(pays)}</span>
              <span className="text-xs text-slate-500">· pays choisi avec le numéro de téléphone</span>
            </div>
            {champsAdresse}
          </Section>

          <Section
            icone={<Wallet size={18} />}
            titre="Compte client"
            sousTitre="Facultatif · argent déjà versé par le client (avance), utilisable sur ses achats"
          >
            {champCaisse}
          </Section>

          {avecDette && (
            <Section
              icone={<NotebookPen size={18} />}
              titre="Dette d'avant Lumistock"
              sousTitre="Facultatif · ce que le client devait déjà (cahier de crédit). Saisie une seule fois, elle sera soldée par ses règlements."
            >
              {champDette}
            </Section>
          )}

          {blocErreur}
          {boutons}
        </div>
      </div>
    </Form>
  );
};

export default FormulaireClient;
