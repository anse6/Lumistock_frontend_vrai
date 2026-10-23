// Inscription publique d'un magasin (« Créer mon magasin »).
// Mêmes informations que la création par le staff (super-admin), en 4 étapes ;
// le magasin est créé inactif puis validé par l'équipe Lumistock, qui envoie à
// l'administrateur un lien pour choisir son mot de passe.
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Alert, AutoComplete, Button, Checkbox, ConfigProvider, Form, Input, Select, Upload } from "antd";
import type { UploadFile } from "antd";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ImagePlus, Mail, Pencil, Store, UserRound } from "lucide-react";
import { getUrlServer } from "../../configServer";
import {
  countryOptions,
  findCountryOption,
  legalEntityOptions,
  useCitiesForCountry,
  useNeighborhoodsForCity,
} from "../../Components/super-admin/magasin/locationData";
import CitySelect from "../../Components/super-admin/magasin/CitySelect";
import { currencyOptions } from "../../Components/super-admin/magasin/storeOptions";
import { getApiErrorMessage } from "../../Components/super-admin/magasin/apiErrors";
import Logo from "./components/Logo";
import LangueSwitch from "./components/LangueSwitch";
import { useContenu } from "./contenu";
import { THEME_PUBLIC } from "./theme";
import "./public.css";


type Valeurs = Record<string, string | boolean | undefined>;

// Champs de chaque étape, pour valider étape par étape et revenir à la bonne
// étape quand le serveur signale une erreur.
const CHAMPS_ETAPES = [
  ["denomination", "activité", "email", "telephone", "country_code", "ville", "quartier"],
  ["admin_first_name", "admin_name", "admin_email", "admin_telephone", "admin_fonction", "admin_sexe"],
  ["raison_sociale", "forme_juridique", "numero_immatriculation", "numero_fiscal", "adresse_ligne_1", "code_postal", "devise", "site_web"],
  ["accepte_conditions"],
];

const ACTIVITES = [
  "Alimentation générale", "Quincaillerie", "Matériaux de construction", "Supermarché", "Dépôt de boissons",
  "Boutique de vêtements", "Cosmétiques", "Pharmacie", "Librairie - papeterie", "Électronique", "Pièces détachées",
  "Grossiste",
];

// Devise par défaut selon le pays (zones franc CFA).
const XAF = ["CM", "GA", "TD", "CF", "CG", "GQ"];
const XOF = ["SN", "CI", "BJ", "BF", "ML", "NE", "TG", "GW"];
const deviseDuPays = (code?: string) => (code && XAF.includes(code) ? "XAF" : code && XOF.includes(code) ? "XOF" : undefined);

const RegisterStore: React.FC = () => {
  const c = useContenu();
  const t = c.inscription;
  const [form] = Form.useForm<Valeurs>();
  const [etape, setEtape] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [termine, setTermine] = useState(false);
  const [logo, setLogo] = useState<UploadFile[]>([]);
  const [apercuLogo, setApercuLogo] = useState<string | null>(null);
  const [recap, setRecap] = useState<Valeurs>({});

  const codePays = Form.useWatch("country_code", form) as string | undefined;
  const ville = Form.useWatch("ville", form) as string | undefined;
  const pays = findCountryOption(codePays);
  const { cities, isLoading: chargementVilles } = useCitiesForCountry(codePays);
  const { neighborhoods } = useNeighborhoodsForCity(codePays, ville);
  const quartiers = useMemo(() => neighborhoods.map((n) => ({ value: n })), [neighborhoods]);
  const activites = useMemo(() => ACTIVITES.map((a) => ({ value: a })), []);
  const prefixe = pays ? `${pays.flag} ${pays.callingCode}` : "+";

  useEffect(() => {
    document.title = `${t.titre} · Lumistock`;
  }, [t.titre]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [etape, termine]);

  const allerA = async (cible: number) => {
    if (cible > etape) {
      try {
        // Seuls les champs de l'étape affichée : les autres sont encore vides.
        await form.validateFields(CHAMPS_ETAPES[etape]);
      } catch (e) {
        const premier = (e as { errorFields?: { name: (string | number)[] }[] }).errorFields?.[0]?.name;
        if (premier) form.scrollToField(premier, { block: "center", focus: true });
        return;
      }
    }
    if (cible === 3) setRecap(form.getFieldsValue(true));
    setErreur(null);
    setEtape(cible);
  };

  const suivant = () => (etape < 3 ? allerA(etape + 1) : envoyer());

  const telephone = (chiffres?: string) => {
    const d = String(chiffres || "").replace(/\D/g, "");
    return d ? `${pays?.callingCode || ""}${d}` : "";
  };

  const envoyer = async () => {
    try {
      await form.validateFields(CHAMPS_ETAPES[3]);
    } catch {
      return;
    }
    const v = form.getFieldsValue(true) as Valeurs;
    const fd = new FormData();
    const texte = (cle: string) => String(v[cle] ?? "").trim();
    [
      "denomination", "activité", "email", "country_code", "ville", "quartier",
      "admin_first_name", "admin_name", "admin_email", "admin_fonction", "admin_sexe",
      "raison_sociale", "forme_juridique", "numero_immatriculation", "numero_fiscal",
      "adresse_ligne_1", "code_postal", "devise", "site_web",
    ].forEach((cle) => fd.append(cle, texte(cle)));
    fd.append("pays", pays?.name || "");
    fd.append("telephone", telephone(texte("telephone")));
    fd.append("admin_telephone", telephone(texte("admin_telephone")));
    fd.append("accepte_conditions", v.accepte_conditions ? "true" : "false");
    fd.append("site_internet_societe", texte("site_internet_societe"));
    if (logo[0]?.originFileObj) fd.append("image", logo[0].originFileObj);

    setEnvoi(true);
    setErreur(null);
    try {
      await axios.post(`${getUrlServer()}/magasin/register`, fd);
      setTermine(true);
    } catch (e) {
      const data = axios.isAxiosError(e) ? e.response?.data : null;
      // Erreurs de champ : on les affiche sous le champ et on y retourne.
      const erreurs = (data?.errors || {}) as Record<string, string[] | string>;
      const champs = Object.keys(erreurs).filter((k) => CHAMPS_ETAPES.flat().includes(k));
      if (champs.length) {
        form.setFields(champs.map((k) => ({ name: k, errors: ([] as string[]).concat(erreurs[k]) })));
        setEtape(CHAMPS_ETAPES.findIndex((liste) => liste.includes(champs[0])));
      }
      setErreur(getApiErrorMessage(data, t.erreur));
    } finally {
      setEnvoi(false);
    }
  };

  const requis = { required: true, whitespace: true, message: t.requis };
  const regleTel = (obligatoire: boolean) => [
    ...(obligatoire ? [{ required: true, message: t.requis }] : []),
    { pattern: /^[\d\s]{6,16}$/, message: t.telInvalide },
    ...(codePays === "CM"
      ? [{ validator: (_: unknown, val?: string) => (!val || val.replace(/\D/g, "").length === 9 ? Promise.resolve() : Promise.reject(new Error(t.telCm))) }]
      : []),
  ];

  const icones = [Store, UserRound, Building2, CheckCircle2];

  if (termine) {
    return (
      <Cadre c={c}>
        <div className="mx-auto max-w-lg py-6 text-center" role="status">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
            <Check size={30} strokeWidth={3} />
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-encre">{t.succes.titre}</h1>
          <p className="mt-3 text-texte">{t.succes.texte}</p>
          <div className="mt-8 rounded-2xl border border-trait bg-fond p-6 text-left">
            <p className="text-sm font-semibold text-encre">{t.succes.suite}</p>
            <ol className="mt-4 space-y-4">
              {t.succes.etapes.map((e, i) => (
                <li key={e} className="flex gap-3 text-sm text-texte">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marque text-xs font-bold text-white">{i + 1}</span>
                  {e}
                </li>
              ))}
            </ol>
          </div>
          <Link to="/" className="mt-8 inline-flex items-center justify-center gap-2 min-h-12 rounded-lg !bg-marque px-6 font-semibold !text-white hover:!bg-marque-fonce">
            {t.succes.accueil}
          </Link>
        </div>
      </Cadre>
    );
  }

  const ligneRecap = (libelle: string, valeur?: React.ReactNode) =>
    valeur ? (
      <div className="flex justify-between gap-4 py-1.5 text-sm">
        <dt className="text-attenue">{libelle}</dt>
        <dd className="text-right font-medium text-encre [overflow-wrap:anywhere]">{valeur}</dd>
      </div>
    ) : null;

  const blocRecap = (titre: string, cible: number, contenu: React.ReactNode) => (
    <section className="rounded-2xl border border-trait p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-encre">{titre}</h3>
        <button type="button" onClick={() => setEtape(cible)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-marque hover:bg-marque-50">
          <Pencil size={14} /> {t.verification.modifier}
        </button>
      </div>
      <dl className="divide-y divide-slate-100">{contenu}</dl>
    </section>
  );

  const r = (cle: string) => String(recap[cle] ?? "").trim();

  return (
    <Cadre c={c} etape={etape} icones={icones}>
      <p className="text-sm font-semibold text-marque" aria-live="polite">{t.etapeSur(etape + 1, t.etapes.length)}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t.titre}</h1>
      {etape === 0 && <p className="mt-2 text-[15px] leading-relaxed text-texte">{t.sousTitre}</p>}

      {/* progression (mobile et tablette) */}
      <div className="mt-6 flex gap-1.5 lg:hidden" aria-hidden="true">
        {t.etapes.map((e, i) => (
          <span key={e} className={`h-1.5 flex-1 rounded-full ${i <= etape ? "bg-marque" : "bg-trait"}`} />
        ))}
      </div>

      <div className="mt-8 border-b border-trait pb-5">
        <h2 className="text-lg font-semibold">{t.etapes[etape]}</h2>
        <p className="mt-0.5 text-sm text-attenue">{t.etapesDesc[etape]}</p>
      </div>

      {erreur && <Alert className="!mt-6" type="error" showIcon message={t.erreur} description={erreur} closable onClose={() => setErreur(null)} />}

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="!mt-6"
        initialValues={{ country_code: "CM", devise: "XAF" }}
        onValuesChange={(changes) => {
          if ("country_code" in changes) {
            form.setFieldsValue({ ville: undefined, quartier: undefined, devise: deviseDuPays(changes.country_code as string) });
          }
        }}
        // Pas d'envoi « natif » du formulaire : Ant Design validerait alors tous
        // les champs, y compris ceux des étapes suivantes (cachés et encore
        // vides), et rien ne se passerait. « Continuer » et la touche Entrée
        // ne valident que l'étape affichée.
        onKeyDown={(e) => {
          const cible = e.target as HTMLElement;
          if (e.key === "Enter" && cible.tagName === "INPUT" && !cible.closest(".ant-select")) {
            e.preventDefault();
            suivant();
          }
        }}
      >
        {/* Champ invisible : un humain ne le remplit jamais (anti-robots). */}
        <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
          <Form.Item name="site_internet_societe" noStyle>
            <Input tabIndex={-1} autoComplete="off" />
          </Form.Item>
        </div>

        {/* ------------------------------------------------ étape 1 : magasin */}
        <fieldset hidden={etape !== 0} aria-label={t.magasin.titre} className="min-w-0">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="denomination" label={t.magasin.denomination} rules={[requis, { min: 3, message: t.requis }]}>
              <Input placeholder={t.magasin.denominationPh} maxLength={120} autoComplete="organization" />
            </Form.Item>
            <Form.Item name="activité" label={t.magasin.activite} rules={[requis, { max: 120, message: t.requis }]}>
              <AutoComplete options={activites} filterOption={(s, o) => String(o?.value).toLowerCase().includes(s.toLowerCase())}>
                <Input placeholder={t.magasin.activitePh} />
              </AutoComplete>
            </Form.Item>
            <Form.Item name="email" label={t.magasin.email} rules={[requis, { type: "email", message: t.emailInvalide }]}>
              <Input prefix={<Mail size={16} className="text-slate-400" />} placeholder="contact@monmagasin.com" maxLength={150} autoComplete="email" inputMode="email" />
            </Form.Item>
            <Form.Item name="telephone" label={t.magasin.telephone} rules={regleTel(true)}>
              <Input addonBefore={prefixe} placeholder="6 90 12 34 56" maxLength={16} autoComplete="tel-national" inputMode="tel" />
            </Form.Item>
            <Form.Item name="country_code" label={t.magasin.pays} rules={[{ required: true, message: t.requis }]}>
              <Select showSearch optionFilterProp="label" options={countryOptions.map((p) => ({ value: p.code, label: `${p.flag} ${p.name}` }))} />
            </Form.Item>
            <Form.Item name="ville" label={t.magasin.ville} rules={[requis]}>
              <CitySelect cities={cities} loading={chargementVilles} disabled={!codePays} placeholder={t.magasin.villePh}
                          onCityChange={() => form.setFieldValue("quartier", undefined)} />
            </Form.Item>
            <Form.Item name="quartier" label={t.magasin.quartier} rules={[requis, { max: 120, message: t.requis }]} className="sm:col-span-2">
              <AutoComplete options={quartiers} filterOption placeholder={t.magasin.quartierPh}>
                <Input />
              </AutoComplete>
            </Form.Item>
          </div>
        </fieldset>

        {/* ------------------------------------------------ étape 2 : administrateur */}
        <fieldset hidden={etape !== 1} aria-label={t.admin.titre} className="min-w-0">
          <p className="mb-5 rounded-xl bg-marque-50 px-4 py-3 text-[15px] text-encre">{t.admin.aide}</p>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="admin_first_name" label={t.admin.prenom} rules={[requis, { min: 2, message: t.requis }]}>
              <Input maxLength={80} autoComplete="given-name" />
            </Form.Item>
            <Form.Item name="admin_name" label={t.admin.nom} rules={[requis, { min: 2, message: t.requis }]}>
              <Input maxLength={80} autoComplete="family-name" />
            </Form.Item>
            <Form.Item name="admin_email" label={t.admin.email} extra={t.admin.emailAide} rules={[requis, { type: "email", message: t.emailInvalide }]} className="sm:col-span-2">
              <Input prefix={<Mail size={16} className="text-slate-400" />} maxLength={150} autoComplete="email" inputMode="email" />
            </Form.Item>
            <Form.Item name="admin_telephone" label={<span>{t.admin.telephone} <span className="font-normal text-slate-400">({t.facultatif})</span></span>} rules={regleTel(false)}>
              <Input addonBefore={prefixe} maxLength={16} autoComplete="tel-national" inputMode="tel" />
            </Form.Item>
            <Form.Item name="admin_fonction" label={<span>{t.admin.fonction} <span className="font-normal text-slate-400">({t.facultatif})</span></span>}>
              <Input placeholder={t.admin.fonctionPh} maxLength={100} autoComplete="organization-title" />
            </Form.Item>
            <Form.Item name="admin_sexe" label={<span>{t.admin.sexe} <span className="font-normal text-slate-400">({t.facultatif})</span></span>}>
              <Select allowClear options={[{ value: "Homme", label: t.admin.homme }, { value: "Femme", label: t.admin.femme }]} />
            </Form.Item>
          </div>
        </fieldset>

        {/* ------------------------------------------------ étape 3 : entreprise */}
        <fieldset hidden={etape !== 2} aria-label={t.entreprise.titre} className="min-w-0">
          <p className="mb-5 rounded-xl bg-fond px-4 py-3 text-sm text-texte ring-1 ring-trait">{t.entreprise.aide}</p>
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-trait bg-fond">
              {apercuLogo ? <img src={apercuLogo} alt="" className="h-full w-full object-contain p-1" /> : <ImagePlus className="text-slate-300" size={26} />}
            </span>
            <div>
              <p className="text-sm font-semibold text-encre">{t.entreprise.logo}</p>
              <p className="text-xs text-attenue">{t.entreprise.logoAide}</p>
              <div className="mt-2 flex gap-2">
                <Upload
                  accept="image/png,image/jpeg"
                  maxCount={1}
                  showUploadList={false}
                  fileList={logo}
                  beforeUpload={(f) => f.size <= 2 * 1024 * 1024 || Upload.LIST_IGNORE}
                  customRequest={() => undefined}
                  onChange={({ fileList }) => {
                    const dernier = fileList.slice(-1);
                    setLogo(dernier);
                    const f = dernier[0]?.originFileObj;
                    if (f) {
                      const lecteur = new FileReader();
                      lecteur.onload = () => setApercuLogo(lecteur.result as string);
                      lecteur.readAsDataURL(f);
                    }
                  }}
                >
                  <Button size="small">{t.entreprise.logoChoisir}</Button>
                </Upload>
                {apercuLogo && (
                  <Button size="small" type="text" onClick={() => { setLogo([]); setApercuLogo(null); }}>
                    {t.entreprise.logoRetirer}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="raison_sociale" label={t.entreprise.raisonSociale}>
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item name="forme_juridique" label={t.entreprise.forme}>
              <Select allowClear showSearch options={legalEntityOptions} />
            </Form.Item>
            <Form.Item name="numero_immatriculation" label={t.entreprise.immatriculation}>
              <Input maxLength={120} />
            </Form.Item>
            <Form.Item name="numero_fiscal" label={t.entreprise.fiscal}>
              <Input maxLength={120} />
            </Form.Item>
            <Form.Item name="adresse_ligne_1" label={t.entreprise.adresse}>
              <Input maxLength={255} autoComplete="street-address" />
            </Form.Item>
            <Form.Item name="code_postal" label={t.entreprise.codePostal}>
              <Input maxLength={30} />
            </Form.Item>
            <Form.Item name="devise" label={t.entreprise.devise}>
              <Select allowClear showSearch optionFilterProp="label" options={currencyOptions} />
            </Form.Item>
            <Form.Item name="site_web" label={t.entreprise.site} rules={[{ type: "url", message: t.urlInvalide }]}>
              <Input placeholder="https://" maxLength={200} inputMode="url" />
            </Form.Item>
          </div>
        </fieldset>

        {/* ------------------------------------------------ étape 4 : vérification */}
        <fieldset hidden={etape !== 3} aria-label={t.verification.titre} className="min-w-0">
          <div className="space-y-4">
            {blocRecap(t.magasin.titre, 0, <>
              {ligneRecap(t.magasin.denomination, r("denomination"))}
              {ligneRecap(t.magasin.activite, r("activité"))}
              {ligneRecap(t.magasin.email, r("email"))}
              {ligneRecap(t.magasin.telephone, r("telephone") && `${pays?.callingCode || ""} ${r("telephone")}`)}
              {ligneRecap(t.magasin.quartier, [r("quartier"), r("ville"), pays?.name].filter(Boolean).join(", "))}
            </>)}
            {blocRecap(t.admin.titre, 1, <>
              {ligneRecap(t.admin.nom, `${r("admin_first_name")} ${r("admin_name")}`.trim())}
              {ligneRecap(t.admin.email, r("admin_email"))}
              {ligneRecap(t.admin.telephone, r("admin_telephone") && `${pays?.callingCode || ""} ${r("admin_telephone")}`)}
              {ligneRecap(t.admin.fonction, r("admin_fonction"))}
            </>)}
            {blocRecap(t.entreprise.titre, 2, <>
              {ligneRecap(t.entreprise.raisonSociale, r("raison_sociale"))}
              {ligneRecap(t.entreprise.forme, r("forme_juridique"))}
              {ligneRecap(t.entreprise.immatriculation, r("numero_immatriculation"))}
              {ligneRecap(t.entreprise.fiscal, r("numero_fiscal"))}
              {ligneRecap(t.entreprise.devise, r("devise"))}
              {ligneRecap(t.entreprise.logo, apercuLogo ? <img src={apercuLogo} alt="" className="ml-auto h-8 w-8 rounded object-contain" /> : null)}
              {![r("raison_sociale"), r("forme_juridique"), r("numero_immatriculation"), r("numero_fiscal"), r("devise"), apercuLogo].some(Boolean) && (
                <p className="py-1.5 text-sm text-slate-400">—</p>
              )}
            </>)}
          </div>
          <Form.Item
            name="accepte_conditions"
            valuePropName="checked"
            className="!mt-6"
            rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject(new Error(t.verification.conditionsRequises))) }]}
          >
            <Checkbox>{t.verification.conditions}</Checkbox>
          </Form.Item>
        </fieldset>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-trait pt-6 sm:flex-row sm:items-center sm:justify-between">
          {etape > 0 ? (
            <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => allerA(etape - 1)}>
              {t.precedent}
            </Button>
          ) : (
            <span />
          )}
          <Button type="primary" size="large" htmlType="button" onClick={suivant} loading={envoi} className="!h-12 !px-7 !font-semibold">
            <span className="inline-flex items-center gap-2">
              {etape < 3 ? t.suivant : t.envoyer}
              {etape < 3 && <ArrowRight size={16} />}
            </span>
          </Button>
        </div>
      </Form>
    </Cadre>
  );
};

// Mise en page : panneau de marque à gauche (grand écran), formulaire à droite.
const Cadre: React.FC<{
  c: ReturnType<typeof useContenu>;
  etape?: number;
  icones?: React.ComponentType<{ size?: number }>[];
  children: React.ReactNode;
}> = ({ c, etape, icones, children }) => {
  const t = c.inscription;
  return (
    <ConfigProvider theme={THEME_PUBLIC}>
      <div className="site-public min-h-screen bg-fond lg:grid lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        {/* Panneau aux couleurs du menu de l'application : violet Lumistock, éléments blancs. */}
        <aside className="hidden border-r border-[#2d1045] bg-marque px-8 py-8 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col xl:px-10">
          <div className="flex justify-center rounded-xl bg-white px-4 py-3 shadow-sm">
            <Logo hauteur={26} />
          </div>
          <div className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight !text-white">{t.panneau.titre}</h2>
            {etape !== undefined && icones ? (
              <ol className="mt-8" aria-label={t.titre}>
                {t.etapes.map((e, i) => {
                  const Icone = icones[i];
                  const fait = i < etape;
                  const actif = i === etape;
                  return (
                    <li key={e} className="relative flex gap-4 pb-7 last:pb-0" aria-current={actif ? "step" : undefined}>
                      {i < t.etapes.length - 1 && (
                        <span className={`absolute left-[19px] top-11 h-[calc(100%-2.75rem)] w-0.5 rounded ${fait ? "bg-white" : "bg-white/20"}`} aria-hidden="true" />
                      )}
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                          actif ? "border-white bg-white text-marque" : fait ? "border-white bg-white/15 text-white" : "border-white/30 text-white/70"
                        }`}
                      >
                        {fait ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <Icone size={18} aria-hidden="true" />}
                      </span>
                      <span className="pt-1.5">
                        <span className={`block text-[15px] font-semibold ${actif || fait ? "text-white" : "text-white/75"}`}>{e}</span>
                        <span className="block text-sm text-white/70">{t.etapesDesc[i]}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <ul className="mt-8 space-y-3">
                {t.panneau.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-[15px] text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-marque">
                      <Check size={12} strokeWidth={3} aria-hidden="true" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-auto border-t border-white/15 pt-6 text-[15px] text-white/80">
            {t.panneau.deja}{" "}
            <Link to="/login" className="font-semibold !text-white underline-offset-4 hover:underline">
              {c.nav.connexion}
            </Link>
          </p>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-trait bg-white px-4 py-3.5 sm:px-8 lg:border-b-0 lg:bg-transparent">
            <div className="lg:hidden">
              <Logo hauteur={24} />
            </div>
            <Link to="/" className="hidden min-h-11 items-center gap-2 text-sm font-semibold !text-attenue hover:!text-encre lg:inline-flex">
              <ArrowLeft size={16} aria-hidden="true" /> {t.retour}
            </Link>
            <LangueSwitch />
          </header>
          <main id="contenu" className="flex flex-1 justify-center px-4 py-6 sm:px-8 sm:py-8">
            <div className="w-full max-w-2xl rounded-xl border border-trait bg-white p-6 sm:p-10">{children}</div>
          </main>
          <p className="pb-8 text-center text-[15px] text-attenue lg:hidden">
            {t.panneau.deja}{" "}
            <Link to="/login" className="font-semibold !text-marque">
              {c.nav.connexion}
            </Link>
          </p>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default RegisterStore;
