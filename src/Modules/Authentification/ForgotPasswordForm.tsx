// Mot de passe oublié : envoie un lien de réinitialisation. La réponse est la
// même que le compte existe ou non (rien n'est révélé).
import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Form, Input } from "antd";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useForgotPassword } from "./services/authService";
import { useContenu } from "../Public/contenu";

const ForgotPasswordForm = () => {
  const { t } = useTranslation();
  const c = useContenu().auth.oubli;
  const { mutateAsync, isPending } = useForgotPassword();
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState<string | null>(null);

  const envoyer = async (values: { email: string }) => {
    setErreur("");
    try {
      await mutateAsync(values.email.trim().toLowerCase());
      setEnvoye(values.email.trim());
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("login.messages.serverError"));
    }
  };

  if (envoye) {
    return (
      <div role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <MailCheck size={24} />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-encre">{c.titre}</h1>
        <p className="mt-3 text-texte">{c.ok}</p>
        <p className="mt-2 font-medium text-encre [overflow-wrap:anywhere]">{envoye}</p>
        <Link to="/login" className="mt-10 inline-flex items-center gap-2 font-semibold !text-marque hover:underline">
          <ArrowLeft size={16} /> {c.retour}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-encre">{c.titre}</h1>
      <p className="mt-2 text-texte">{c.sousTitre}</p>
      {erreur && <Alert className="!mt-6" type="error" showIcon message={erreur} closable onClose={() => setErreur("")} />}
      <Form layout="vertical" requiredMark={false} onFinish={envoyer} className="!mt-8" size="large">
        <Form.Item
          name="email"
          label={<span className="font-medium text-encre">{t("login.emailLabel")}</span>}
          rules={[
            { required: true, message: t("login.emailRequired") },
            { type: "email", message: t("login.emailInvalid") },
          ]}
        >
          <Input prefix={<Mail size={17} className="mr-1 text-slate-400" />} placeholder={t("login.emailPlaceholder")} autoComplete="email" inputMode="email" autoFocus />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={isPending} className="!h-12 !font-semibold">
          {isPending ? c.envoi : c.bouton}
        </Button>
      </Form>
      <p className="mt-10 border-t border-trait pt-6 text-center text-sm">
        <Link to="/login" className="inline-flex items-center gap-2 font-semibold !text-texte hover:!text-marque">
          <ArrowLeft size={16} /> {c.retour}
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;
