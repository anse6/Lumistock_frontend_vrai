// Page Contact du site public, construite avec Ant Design : le formulaire
// occupe toute la largeur de la page. Le message est enregistré côté serveur
// (POST /contact) et arrive dans la boîte de réception du super-admin.
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Alert, Button, Card, Checkbox, Col, ConfigProvider, Form, Input, Result, Row, Select, Typography } from "antd";
import { Building2, Mail, Phone, Send, Tag, UserRound } from "lucide-react";
import { getUrlServer } from "../../configServer";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatNanse from "./components/ChatNanse";
import { useContenu } from "./contenu";
import { THEME_PUBLIC } from "./theme";
import "./public.css";

const { Title, Paragraph, Text } = Typography;

interface Valeurs {
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  sujet: string;
  message: string;
  consentement: boolean;
  site_web_societe?: string;
}

// Champs grands, arrondis, icône à gauche : thème propre à ce formulaire.
const THEME_CONTACT = {
  ...THEME_PUBLIC,
  token: { ...THEME_PUBLIC.token, colorSuccess: "#059669" },
  components: {
    ...THEME_PUBLIC.components,
    Input: { controlHeightLG: 52, paddingInlineLG: 14, activeShadow: "0 0 0 3px rgba(59,7,100,0.12)" },
    Select: { controlHeightLG: 52, optionHeight: 40, optionPadding: "10px 14px" },
    Form: { ...THEME_PUBLIC.components.Form, itemMarginBottom: 22, labelFontSize: 15 },
  },
};

const icone = (Composant: React.ComponentType<{ size?: number; className?: string }>) => (
  <Composant size={18} className="mr-1.5 text-attenue" />
);

const ContactPage: React.FC = () => {
  const t = useContenu().contact;
  const navigate = useNavigate();
  const [form] = Form.useForm<Valeurs>();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);
  // Sujet prérempli depuis un lien du site (ex. /contact?sujet=tarifs).
  const [recherche] = useSearchParams();
  const sujetLien = recherche.get("sujet");
  const sujetInitial = sujetLien && sujetLien in t.sujets ? sujetLien : undefined;

  useEffect(() => {
    document.title = `${t.surtitre} · Lumistock`;
  }, [t.surtitre]);

  const envoyer = async (v: Valeurs) => {
    setEnvoi(true);
    setErreur(null);
    try {
      await axios.post(`${getUrlServer()}/contact`, {
        ...v,
        nom: v.nom.trim(),
        email: v.email.trim(),
        consentement: Boolean(v.consentement),
      });
      setEnvoye(true);
      form.resetFields();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const data = axios.isAxiosError(e) ? e.response?.data : null;
      const erreurs = (data?.errors || {}) as Record<string, string[]>;
      const champs = Object.keys(erreurs);
      if (champs.length) form.setFields(champs.map((c) => ({ name: c as keyof Valeurs, errors: erreurs[c] })));
      setErreur(data?.message || t.erreur);
    } finally {
      setEnvoi(false);
    }
  };

  const libelle = (texte: string, facultatif?: boolean) => (
    <span className="font-semibold text-encre">
      {texte}
      {facultatif && <Text type="secondary" className="!ml-1 !font-normal">({t.facultatif})</Text>}
    </span>
  );

  return (
    <ConfigProvider theme={THEME_CONTACT}>
      <div className="site-public min-h-screen overflow-x-clip bg-white">
        <Navbar />
        <main id="contenu" className="bg-fond px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <Text strong className="!text-marque">{t.surtitre}</Text>
              <Title level={1} className="!mb-0 !mt-2 !text-4xl !font-semibold sm:!text-5xl">{t.titre}</Title>
              <Paragraph className="!mb-0 !mt-4 !text-lg !text-texte">{t.sousTitre}</Paragraph>
            </div>

            <Card className="!rounded-2xl !border-trait [&_.ant-card-body]:!p-5 sm:[&_.ant-card-body]:!p-8 lg:[&_.ant-card-body]:!p-10">
              {envoye ? (
                <Result
                  status="success"
                  title={t.succesTitre}
                  subTitle={t.succesTexte}
                  extra={[
                    <Button key="nouveau" size="large" onClick={() => setEnvoye(false)}>{t.nouveau}</Button>,
                    <Button key="accueil" size="large" type="primary" onClick={() => navigate("/")}>{t.accueil}</Button>,
                  ]}
                />
              ) : (
                <>
                  <Title level={2} className="!mb-1 !text-2xl !font-semibold">{t.formulaireTitre}</Title>
                  <Paragraph type="secondary" className="!mb-8">{t.reponse}</Paragraph>

                  {erreur && (
                    <Alert className="!mb-6" type="error" showIcon message={t.erreur} description={erreur} closable onClose={() => setErreur(null)} />
                  )}

                  <Form<Valeurs>
                    form={form}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                    initialValues={{ sujet: sujetInitial }}
                    onFinish={envoyer}
                    scrollToFirstError={{ block: "center" }}
                  >
                    {/* Champ invisible : un humain ne le remplit jamais (anti-robots). */}
                    <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
                      <Form.Item name="site_web_societe" noStyle>
                        <Input type="url" placeholder="https://" tabIndex={-1} autoComplete="off" />
                      </Form.Item>
                    </div>

                    <Row gutter={[24, 0]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="nom"
                          label={libelle(t.nom)}
                          rules={[{ required: true, whitespace: true, message: t.requis }, { min: 2, message: t.requis }]}
                        >
                          <Input prefix={icone(UserRound)} placeholder={t.nomPh} maxLength={120} autoComplete="name" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="email"
                          label={libelle(t.courriel)}
                          rules={[{ required: true, message: t.requis }, { type: "email", message: t.emailInvalide }]}
                        >
                          <Input prefix={icone(Mail)} placeholder="vous@exemple.com" maxLength={150} autoComplete="email" inputMode="email" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="telephone"
                          label={libelle(t.tel, true)}
                          rules={[{ pattern: /^\+?[\d\s.\-()]{6,22}$/, message: t.telInvalide }]}
                        >
                          <Input prefix={icone(Phone)} placeholder="+237 6 90 12 34 56" maxLength={22} autoComplete="tel" inputMode="tel" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="entreprise" label={libelle(t.entreprise, true)}>
                          <Input prefix={icone(Building2)} placeholder={t.entreprisePh} maxLength={150} autoComplete="organization" />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item name="sujet" label={libelle(t.sujet)} rules={[{ required: true, message: t.requis }]}>
                          <Select
                            placeholder={
                              <span className="inline-flex items-center gap-2">
                                <Tag size={18} className="text-attenue" /> {t.sujetPh}
                              </span>
                            }
                            options={Object.entries(t.sujets).map(([value, label]) => ({ value, label }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          name="message"
                          label={libelle(t.message)}
                          rules={[{ required: true, whitespace: true, message: t.requis }, { min: 10, message: t.messageCourt }]}
                        >
                          <Input.TextArea placeholder={t.messagePh} autoSize={{ minRows: 6, maxRows: 14 }} maxLength={5000} showCount />
                        </Form.Item>
                      </Col>
                    </Row>

                    <div className="mt-2 flex flex-col gap-5 border-t border-trait pt-6 md:flex-row md:items-center md:justify-between">
                      <Form.Item
                        name="consentement"
                        valuePropName="checked"
                        className="!mb-0"
                        rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject(new Error(t.consentementRequis))) }]}
                      >
                        <Checkbox>{t.consentement}</Checkbox>
                      </Form.Item>
                      <Button type="primary" htmlType="submit" loading={envoi} icon={<Send size={18} />} className="!h-[52px] !px-8 !text-base">
                        {t.envoyer}
                      </Button>
                    </div>
                  </Form>
                </>
              )}
            </Card>

          </div>
        </main>
        <Footer />
        <ChatNanse />
      </div>
    </ConfigProvider>
  );
};

export default ContactPage;
