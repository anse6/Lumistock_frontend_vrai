// Page Paramètres de l'admin et du manager (/admin/dashboard/parameter).
// Données : useCompteConnecte (utilisateur connecté + magasin). Ce que chacun
// peut modifier dépend de son rôle, comme sur le serveur.
import React, { useEffect, useState } from "react";
import { useOngletUrl } from "../../../hooks/useOngletUrl";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  ColorPicker,
  ConfigProvider,
  Form,
  Input,
  Skeleton,
  Switch,
  Tabs,
  Typography,
} from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Building, Check, Layers, Palette, Scan } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUES, langueDe } from "../../../langues";
import { changerLangue } from "../../../i18n";

import { getUrlServer } from "../../../configServer";
import { enregistrerTokens } from "../../../Modules/Authentification/services/session";
import useCompteConnecte from "../../../hooks/useCompteConnecte";
import { RoleTag } from "./elements";
import { APP_COLOR, carte, formatPhone, getApiError } from "./outils";
import MonProfil from "./MonProfil";
import FicheMagasin from "./FicheMagasin";
import GestionAcces from "./GestionAcces";
import { StoreStatus } from "../../super-admin/magasin/storeUi";
import DeuxFacteurs from "../../Securite/DeuxFacteurs";

const { Title, Text } = Typography;

const ONGLETS = ["profil", "magasin", "acces", "preferences", "securite"];
const CLE_ONGLET = "parametres_onglet";


const CompanyProfiles: React.FC = () => {
  const { message } = AntdApp.useApp();
  const { t, i18n } = useTranslation();
  const compte = useCompteConnecte();
  const { utilisateur, magasin, peut, recharger } = compte;

  // Onglet relié à l'adresse (?onglet=securite) : le menu latéral ouvre l'onglet voulu.
  const [onglet, changerOnglet] = useOngletUrl(ONGLETS, "profil", CLE_ONGLET);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  // Préférences
  const [themeColor, setThemeColor] = useState(localStorage.getItem("theme_primary_color") || APP_COLOR);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [showOldDebt, setShowOldDebt] = useState(localStorage.getItem("show_old_debt") !== "false");
  // Méthode de valorisation des stocks (CMUP par défaut, FIFO, LIFO)
  const [stockMethod, setStockMethod] = useState<string>("CMUP");
  const [stockMethods, setStockMethods] = useState<{ code: string; nom: string; description: string }[]>([]);
  const [savingStockMethod, setSavingStockMethod] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t("admin.parameters.title")} · Lumistock`;
  }, [t]);

  useEffect(() => {
    setBarcodeMode(Boolean(utilisateur?.barcode_mode));
  }, [utilisateur?.barcode_mode]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`${getUrlServer()}/magasin/parametres/stock`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setStockMethod(data.methode);
        setStockMethods(data.methodes || []);
      })
      .catch(() => undefined);
  }, []);

  const changePassword = async (values: { old_password: string; new_password: string; confirm_password: string }) => {
    if (values.new_password !== values.confirm_password) {
      passwordForm.setFields([{ name: "confirm_password", errors: ["Les mots de passe ne correspondent pas."] }]);
      return;
    }
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${getUrlServer()}/auth/change_password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, "Impossible de modifier le mot de passe."));
      // Les autres sessions sont fermées ; celle-ci reçoit de nouveaux tokens.
      enregistrerTokens(data);
      passwordForm.resetFields();
      message.success(data?.message || "Mot de passe modifié avec succès.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Impossible de modifier le mot de passe.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateTheme = (color: string) => {
    setThemeColor(color);
    localStorage.setItem("theme_primary_color", color);
    window.dispatchEvent(new Event("themeChange"));
    message.success(t("admin.parameters.customization.success"));
  };

  const handleToggleBarcodeMode = async (checked: boolean) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${getUrlServer()}/users/settings/barcode`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ barcode_mode: checked }),
      });
      if (response.ok) {
        setBarcodeMode(checked);
        message.success(t("admin.parameters.customization.success"));
      } else {
        message.error(t("profile.errorValidation"));
      }
    } catch {
      message.error(t("profile.errorConnection"));
    }
  };

  const handleChangeStockMethod = async (code: string) => {
    if (code === stockMethod || savingStockMethod) return;
    setSavingStockMethod(code);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${getUrlServer()}/magasin/parametres/stock`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ methode: code }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getApiError(data, "Impossible de changer la méthode."));
      setStockMethod(data.methode);
      message.success(data.message || "Méthode de valorisation mise à jour.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setSavingStockMethod(null);
    }
  };

  const handleToggleOldDebt = (checked: boolean) => {
    setShowOldDebt(checked);
    localStorage.setItem("show_old_debt", checked ? "true" : "false");
    window.dispatchEvent(new Event("oldDebtSettingChange"));
    message.success(t("admin.parameters.customization.success"));
  };

  const enveloppe = (contenu: React.ReactNode) => (
    <ConfigProvider theme={{ token: { colorPrimary: APP_COLOR, borderRadius: 10 } }}>
      <main className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full min-w-0 max-w-6xl">{contenu}</div>
      </main>
    </ConfigProvider>
  );

  if (!utilisateur && !compte.erreur) {
    return enveloppe(<Skeleton active avatar paragraph={{ rows: 10 }} />);
  }

  if (!utilisateur || !magasin) {
    return enveloppe(
      <Alert
        type="error"
        showIcon
        message="Paramètres indisponibles"
        description={compte.erreur || "Impossible de récupérer les informations du magasin."}
        action={<Button onClick={() => recharger()}>Réessayer</Button>}
      />,
    );
  }

  const preferences = (
    <div className="flex max-w-3xl flex-col gap-5">
      <Card variant="borderless" className={carte}>
        <Title level={4} className="!mb-1 !text-[17px] !text-slate-900">
          {t("admin.parameters.customization.title")}
        </Title>
        <Text type="secondary" className="mb-5 block text-xs">
          {t("admin.parameters.customization.description")} Ces choix ne valent que pour ce navigateur.
        </Text>

        <div className="mb-4 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center">
          <div>
            <Text strong className="block">{t("admin.parameters.customization.primaryColor")}</Text>
            <Text type="secondary" className="text-xs">{t("admin.parameters.customization.primaryColorDesc")}</Text>
          </div>
          <ColorPicker value={themeColor} onChangeComplete={(c) => handleUpdateTheme(c.toHexString())} showText />
        </div>
        <div className="mb-4 grid grid-cols-5 gap-2 sm:grid-cols-9">
          {["#3b1558", "#0F172A", "#4F46E5", "#059669", "#DC2626", "#D97706", "#7C3AED", "#DB2777", "#2563EB"].map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Couleur ${c}`}
              onClick={() => handleUpdateTheme(c)}
              className={`h-9 rounded-lg border-2 shadow-sm transition-transform hover:scale-110 ${
                themeColor.toLowerCase() === c.toLowerCase() ? "border-slate-800" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center">
          <div>
            <Text strong className="block">{t("admin.parameters.customization.language")}</Text>
            <Text type="secondary" className="text-xs">{t("admin.parameters.customization.languageDesc")}</Text>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUES.map((l) => {
              const actif = langueDe(i18n.language).code === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  lang={l.code}
                  aria-pressed={actif}
                  onClick={() => changerLangue(l.code)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                    actif
                      ? "border-purple-900 bg-purple-900 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                  }`}
                >
                  {l.drapeau ? (
                    <img src={`https://flagcdn.com/${l.drapeau}.svg`} width="20" alt="" className="rounded-sm" />
                  ) : (
                    <span aria-hidden className="flex h-[15px] w-5 items-center justify-center rounded-sm bg-emerald-700 text-[10px] text-white">ع</span>
                  )}
                  {l.nom}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card variant="borderless" className={carte}>
        <div className="mb-1 flex items-center gap-2">
          <Layers size={18} style={{ color: APP_COLOR }} />
          <Text strong>Méthode de valorisation des stocks</Text>
        </div>
        <Text type="secondary" className="mb-4 block text-xs">
          Détermine le coût d'achat de chaque article vendu, et donc vos marges et votre bénéfice. Le changement
          s'applique aux sorties suivantes ; les ventes déjà enregistrées gardent leur coût.
        </Text>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {stockMethods.map((m) => {
            const active = m.code === stockMethod;
            const disabled = !peut("stock.methode") || Boolean(savingStockMethod);
            return (
              <button
                key={m.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handleChangeStockMethod(m.code)}
                disabled={disabled && !active}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  active
                    ? "bg-white shadow-md"
                    : "border-slate-200 bg-white/70 hover:border-purple-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                }`}
                style={active ? { borderColor: APP_COLOR } : undefined}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: APP_COLOR }}>
                    {m.code}
                    {m.code === "CMUP" && (
                      <span className="ml-2 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-900">
                        Par défaut
                      </span>
                    )}
                  </span>
                  {savingStockMethod === m.code ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-transparent" />
                  ) : active ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: APP_COLOR }}>
                      <Check size={12} />
                    </span>
                  ) : null}
                </div>
                <div className="mb-1 text-xs font-semibold text-slate-700">{m.nom.split("—")[1]?.trim() || m.nom}</div>
                <div className="text-xs leading-relaxed text-slate-500">{m.description}</div>
              </button>
            );
          })}
        </div>
        {!peut("stock.methode") && (
          <Text type="secondary" className="mt-3 block text-xs">
            Vous n'avez pas le droit de changer la méthode (voir l'onglet Accès).
          </Text>
        )}
      </Card>

      <Card variant="borderless" className={carte}>
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Scan size={18} className="text-purple-800" />
                <Text strong>{t("profile.barcodeMode")}</Text>
              </div>
              <Text type="secondary" className="text-xs">{t("profile.barcodeModeDesc")}</Text>
            </div>
            <Switch checked={barcodeMode} onChange={handleToggleBarcodeMode} />
          </div>
          <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Building size={18} className="text-amber-600" />
                <Text strong>{t("admin.parameters.customization.showOldDebt")}</Text>
              </div>
              <Text type="secondary" className="text-xs">{t("admin.parameters.customization.showOldDebtDesc")}</Text>
            </div>
            <Switch checked={showOldDebt} onChange={handleToggleOldDebt} />
          </div>
        </div>
      </Card>
    </div>
  );

  const securite = (
    <div className="flex max-w-2xl flex-col gap-5">
      <Card variant="borderless" className={carte}>
        <Title level={4} className="!mb-1 !text-[17px] !text-slate-900">
          {t("admin.parameters.passwordModal.title")}
        </Title>
        <Text className="mb-5 block text-xs text-slate-500">
          Au moins 8 caractères, avec au moins une lettre et un chiffre. Vos autres appareils seront déconnectés.
        </Text>
        <Form form={passwordForm} layout="vertical" requiredMark={false} onFinish={changePassword}>
          <Form.Item
            name="old_password"
            label={t("admin.parameters.passwordModal.oldPassword")}
            rules={[{ required: true, message: t("admin.parameters.passwordModal.oldPasswordReq") }]}
          >
            <Input.Password prefix={<LockOutlined className="text-slate-400" />} className="h-11" autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label={t("admin.parameters.passwordModal.newPassword")}
            rules={[
              { required: true, message: t("admin.parameters.passwordModal.newPasswordReq") },
              { pattern: /^(?=.*[A-Za-zÀ-ÿ])(?=.*\d).{8,128}$/, message: t("admin.parameters.passwordModal.newPasswordMin") },
            ]}
          >
            <Input.Password prefix={<KeyOutlined className="text-slate-400" />} className="h-11" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label={t("admin.parameters.passwordModal.confirmPassword")}
            dependencies={["new_password"]}
            rules={[
              { required: true, message: t("admin.parameters.passwordModal.confirmPasswordReq") },
              ({ getFieldValue }) => ({
                validator: (_, v) =>
                  !v || v === getFieldValue("new_password")
                    ? Promise.resolve()
                    : Promise.reject(new Error("Les mots de passe ne correspondent pas.")),
              }),
            ]}
          >
            <Input.Password prefix={<CheckCircleOutlined className="text-slate-400" />} className="h-11" autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={passwordLoading} icon={<SaveOutlined />} className="h-11 !px-6">
            {t("admin.parameters.passwordModal.update")}
          </Button>
        </Form>
      </Card>
      <DeuxFacteurs />
    </div>
  );

  const libelle = (icone: React.ReactNode, texte: string) => (
    <span className="flex items-center gap-2">
      {icone} {texte}
    </span>
  );

  const tabItems = [
    {
      key: "profil",
      label: libelle(<UserOutlined />, "Mon profil"),
      children: <MonProfil utilisateur={utilisateur} libelleRole={compte.libelleRole} onSaved={recharger} />,
    },
    {
      key: "magasin",
      label: libelle(<BankOutlined />, "Magasin"),
      children: <FicheMagasin magasin={magasin} peut={peut} onSaved={recharger} />,
    },
    {
      key: "acces",
      label: libelle(<LockOutlined />, "Accès"),
      children: <GestionAcces />,
    },
    {
      key: "preferences",
      label: libelle(<Palette size={15} />, t("admin.parameters.tabs.customization")),
      children: preferences,
    },
    {
      key: "securite",
      label: libelle(<SafetyCertificateOutlined />, "Sécurité"),
      children: securite,
    },
  ];

  return enveloppe(
    <>
      <div className="mb-6">
        <Title level={2} className="!mb-1 !text-2xl !font-bold !text-purple-950">
          {t("admin.parameters.title")}
        </Title>
        <Text className="text-sm text-slate-500">
          {peut("magasin.modifier")
            ? "Gérez votre compte, les informations du magasin, les accès et vos préférences."
            : "Gérez votre compte et vos préférences. Les informations du magasin sont gérées par l'administrateur."}
        </Text>
      </div>

      <section className="mb-6 overflow-hidden rounded-2xl border border-purple-100/70 bg-white shadow-sm">
        <div className="flex flex-col gap-5 bg-gradient-to-r from-purple-50/80 to-white p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-purple-100 bg-white sm:h-20 sm:w-20">
              {magasin.logo ? (
                <img
                  src={magasin.logo}
                  alt={`Logo ${magasin.denomination}`}
                  className="h-full w-full object-contain p-1.5"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-2xl font-bold text-purple-900">
                  {(magasin.denomination || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-purple-950 sm:text-2xl">{magasin.denomination}</h2>
                <StoreStatus store={{ is_active: magasin.is_active !== false }} />
              </div>
              <p className="truncate text-sm text-slate-500">
                {[magasin.activité, [magasin.ville, magasin.pays].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-purple-100 bg-white px-4 py-3 md:max-w-[50%]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-900 text-sm font-bold text-white">
              {`${utilisateur.first_name?.[0] || ""}${utilisateur.name?.[0] || ""}`.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold capitalize text-slate-900">
                {compte.nomComplet || utilisateur.email}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <RoleTag role={utilisateur.role} libelle={compte.libelleRole} />
                <StoreStatus store={{ is_active: utilisateur.is_active !== false }} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 border-t border-slate-100 text-sm text-slate-600 sm:grid-cols-2">
          <div className="flex min-w-0 items-center gap-2 border-b border-slate-100 px-5 py-3 sm:border-b-0 sm:border-r">
            <MailOutlined className="text-purple-800" />
            <span className="truncate">{magasin.email || "Email du magasin non renseigné"}</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-3">
            <PhoneOutlined className="text-purple-800" />
            <span>{formatPhone(magasin.telephone) || "Téléphone non renseigné"}</span>
          </div>
        </div>
      </section>

      <Tabs activeKey={onglet} onChange={changerOnglet} items={tabItems} size="large" />
    </>,
  );
};

export default CompanyProfiles;
