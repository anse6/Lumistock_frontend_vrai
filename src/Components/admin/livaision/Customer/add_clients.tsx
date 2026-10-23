import React, { useEffect, useState } from "react";
import { App, ConfigProvider, Form, Input, InputNumber, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { ArrowLeft, Camera, Mail, MapPin, NotebookPen, Phone, Save, User, UserPlus, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import type { CountryCode } from "libphonenumber-js";
import PageTitle from "../../../PageTitle";
import { getUrlServer } from "../../../../configServer";
import TelephoneInternational, {
  Drapeau,
  nomPays,
  numeroInternational,
  numeroValide,
  PAYS_PAR_DEFAUT,
} from "../livraisonfinal/TelephoneInternational";
import VilleQuartier from "./VilleQuartier";
import { useTvaMagasin } from "../selectionproduct/Clients/tva";

const PURPLE_950 = "#3b0764";
const TAILLE_MAX_PHOTO = 5 * 1024 * 1024;

interface AddClientProps {
  onSubmit?: (clientData: unknown) => void;
  onCancel: () => void;
}

interface Valeurs {
  fullName: string;
  email?: string;
  montantCaisse?: number | null;
  detteOuverture?: number | null;
}

// Carte de section du formulaire : icône, titre et sous-titre.
const Section: React.FC<{ icone: React.ReactNode; titre: string; sousTitre?: string; children: React.ReactNode }> = ({
  icone,
  titre,
  sousTitre,
  children,
}) => (
  <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-950">{icone}</span>
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

const AddClient: React.FC<AddClientProps> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<Valeurs>();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      message.error(t("admin.customers.add.validation.authRequired"));
      navigate("/login");
    }
  }, [navigate, t, message]);

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
    const token = localStorage.getItem("access_token");
    if (!token) return message.error(t("admin.customers.add.validation.tokenMissing"));

    const corps = new FormData();
    corps.append("nom", valeurs.fullName.trim());
    if (valeurs.email?.trim()) corps.append("email", valeurs.email.trim());
    if (lieu.ville.trim()) corps.append("ville", lieu.ville.trim());
    if (lieu.quartier.trim()) corps.append("quartier", lieu.quartier.trim());
    corps.append("pays", pays);
    if (telephoneSaisi) corps.append("telephone", numeroInternational(telephone.pays, telephone.chiffres));
    if (valeurs.montantCaisse) corps.append("montant_en_caisse", String(valeurs.montantCaisse));
    if (valeurs.detteOuverture) corps.append("dette_ouverture", String(valeurs.detteOuverture));
    const photo = fileList[0]?.originFileObj;
    if (photo) corps.append("photo_profil", photo);

    setEnvoi(true);
    setErreur(null);
    try {
      const response = await fetch(`${getUrlServer()}/clients/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: corps,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || t("admin.customers.add.validation.error"));
      message.success(`Client « ${valeurs.fullName.trim()} » créé avec succès.`);
      onSubmit?.(valeurs);
      navigate("/admin/dashboard/customers");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : t("admin.customers.add.validation.error"));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: PURPLE_950, borderRadius: 10 },
        components: { Button: { colorPrimary: PURPLE_950 } },
      }}
    >
      <PageTitle>{t("admin.customers.title")}</PageTitle>
      <div className="min-h-screen w-full bg-white p-4 pb-16 sm:p-6">
        {/* Fil d'Ariane */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-medium">
          <Link
            to="/admin/dashboard/customers"
            style={{ backgroundColor: PURPLE_950 }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold !text-white shadow-sm hover:opacity-90"
          >
            <ArrowLeft size={14} />
            {t("admin.customers.title")}
          </Link>
          <span className="font-bold text-gray-300">›</span>
          <span className="rounded-xl bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-950">Nouveau client</span>
        </div>

        {/* En-tête */}
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-purple-950/20" style={{ backgroundColor: PURPLE_950 }}>
            <UserPlus size={22} />
          </span>
          <div>
            <h1 className="text-lg font-bold text-purple-950">{t("admin.customers.add.title")}</h1>
            <p className="text-xs text-slate-500">
              Seul le nom est obligatoire. Le numéro de téléphone identifie le client : il ne peut appartenir qu'à un seul
              client du magasin.
            </p>
          </div>
        </div>

        <Form form={form} layout="vertical" requiredMark={false} onFinish={enregistrer} initialValues={{ montantCaisse: null }}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Photo */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-4">
                <Section icone={<Camera size={18} />} titre="Photo du client" sousTitre="Facultatif · image de 5 Mo maximum">
                  <div className="flex flex-col items-center gap-3 rounded-xl bg-purple-50/50 py-6">
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
                          <Camera size={22} />
                          <span className="mt-1 text-xs font-semibold">Ajouter</span>
                        </div>
                      )}
                    </Upload>
                    <p className="px-4 text-center text-xs text-slate-500">
                      {fileList.length ? "Survolez la photo pour la voir ou la retirer." : t("admin.customers.add.uploadPrompt")}
                    </p>
                  </div>
                </Section>
              </div>
            </div>

            <div className="space-y-5 lg:col-span-2">
              <Section icone={<User size={18} />} titre="Identité">
                <Form.Item
                  name="fullName"
                  label={libelle(t("admin.customers.add.fullName"), true)}
                  rules={[
                    { required: true, whitespace: true, message: t("admin.customers.add.validation.nameRequired") },
                    { max: 100, message: "100 caractères maximum." },
                  ]}
                  className="!mb-0"
                >
                  <Input size="large" placeholder={t("admin.customers.add.placeholders.fullName")} maxLength={100} />
                </Form.Item>
              </Section>

              <Section icone={<Phone size={18} />} titre="Coordonnées" sousTitre="Pour joindre le client et lui envoyer ses reçus">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-2">{libelle(t("admin.customers.add.phone"))}</div>
                    <TelephoneInternational
                      pays={telephone.pays}
                      chiffres={telephone.chiffres}
                      onChange={changerTelephone}
                      disabled={envoi}
                    />
                    <p className="mt-1 text-xs text-slate-500">Le pays choisi ici est aussi celui du client.</p>
                  </div>
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
                </div>
              </Section>

              <Section
                icone={<MapPin size={18} />}
                titre="Adresse"
                sousTitre="Les villes du pays sont proposées, puis les quartiers de la ville choisie"
              >
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm">
                  <Drapeau code={pays} />
                  <span className="font-semibold text-purple-950">{nomPays(pays)}</span>
                  <span className="text-xs text-slate-500">· pays choisi avec le numéro de téléphone</span>
                </div>
                <VilleQuartier
                  pays={pays}
                  ville={lieu.ville}
                  quartier={lieu.quartier}
                  onChange={setLieu}
                  disabled={envoi}
                />
              </Section>

              <Section
                icone={<Wallet size={18} />}
                titre="Compte client"
                sousTitre="Facultatif · argent déjà versé par le client (avance), utilisable sur ses achats"
              >
                <Form.Item name="montantCaisse" label={libelle(t("admin.customers.add.cashAmount"))} className="!mb-0">
                  <InputNumber<number>
                    size="large"
                    className="w-full sm:!w-72"
                    min={0}
                    precision={0}
                    placeholder="0"
                    formatter={(v) => `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                    parser={(v) => Number((v || "").replace(/\s|CFA/g, ""))}
                    addonAfter="CFA"
                  />
                </Form.Item>
              </Section>

              <Section
                icone={<NotebookPen size={18} />}
                titre="Dette d'avant Lumistock"
                sousTitre="Facultatif · ce que le client devait déjà (cahier de crédit). Saisie une seule fois, elle sera soldée par ses règlements."
              >
                <Form.Item name="detteOuverture" label={libelle("Montant dû")} className="!mb-0">
                  <InputNumber<number>
                    size="large"
                    className="w-full sm:!w-72"
                    min={0}
                    precision={0}
                    placeholder="0"
                    formatter={(v) => `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                    parser={(v) => Number((v || "").replace(/\s|CFA/g, ""))}
                    addonAfter="CFA"
                  />
                </Form.Item>
              </Section>

              {erreur && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={envoi}
                  className="rounded-xl border border-purple-200 px-5 py-2.5 text-sm font-semibold text-purple-950 hover:bg-purple-50 disabled:opacity-50"
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
            </div>
          </div>
        </Form>
      </div>
    </ConfigProvider>
  );
};

export default AddClient;
