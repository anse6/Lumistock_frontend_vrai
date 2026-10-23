// Connexion : email + mot de passe, puis, si l'utilisateur a activé la double
// authentification, le code de son application (ou un code de secours).
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Form, Input } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { loginDeuxFacteurs, useLogin } from "./services/authService";
import { useContenu } from "../Public/contenu";

const ACCUEIL_PAR_ROLE: Record<string, string> = {
  admin: "/admin/dashboard",
  manager: "/admin/dashboard",
  staff: "/superadmin/dashboard",
  livreur: "/dashboard",
  gerant: "/dashboard",
  caissier: "/caisse",
};

const LoginForm = () => {
  const { t } = useTranslation();
  const c = useContenu().auth;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const { mutateAsync, isPending } = useLogin();
  const [erreur, setErreur] = useState("");
  const [jeton, setJeton] = useState<string | null>(null);
  const [secours, setSecours] = useState(false);
  const [code, setCode] = useState("");
  const [verification, setVerification] = useState(false);

  const entrer = (role: string) => {
    queryClient.invalidateQueries({ queryKey: ["auth"] });
    navigate(ACCUEIL_PAR_ROLE[role] || "/");
  };

  const seConnecter = async (values: { email: string; password: string }) => {
    setErreur("");
    try {
      const resultat = await mutateAsync(values);
      if (resultat.deuxFacteurs) {
        setJeton(resultat.deuxFacteurs.jeton);
        setSecours(false);
        setCode("");
        return;
      }
      if (resultat.success) entrer(resultat.role);
    } catch (e) {
      setErreur(e instanceof Error && e.message !== "Login failed" ? e.message : t("login.messages.serverError"));
    }
  };

  const verifier = async (valeur = code) => {
    if (!jeton || !valeur.trim()) return;
    setErreur("");
    setVerification(true);
    try {
      const resultat = await loginDeuxFacteurs(jeton, valeur.trim());
      entrer(resultat.role);
    } catch (e) {
      const err = e as Error & { status?: number };
      setErreur(err.message);
      setCode("");
      // Jeton expiré ou invalide : retour à l'étape du mot de passe.
      if (err.status === 401 && /délai|invalide|reconnect|expired|again/i.test(err.message)) {
        setJeton(null);
      }
    } finally {
      setVerification(false);
    }
  };

  const retour = () => {
    setJeton(null);
    setErreur("");
    setCode("");
  };

  // -------------------------------------------------------- étape du code
  if (jeton) {
    return (
      <div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-marque">
          {secours ? <KeyRound size={24} /> : <ShieldCheck size={24} />}
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-encre">
          {secours ? c.deuxFacteurs.secoursTitre : c.deuxFacteurs.titre}
        </h1>
        <p className="mt-2 text-texte">{secours ? c.deuxFacteurs.secoursTexte : c.deuxFacteurs.texte}</p>

        {erreur && <Alert className="!mt-6" type="error" showIcon message={erreur} />}

        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            verifier();
          }}
        >
          {secours ? (
            <Input
              size="large"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              maxLength={9}
              autoFocus
              autoComplete="one-time-code"
              aria-label={c.deuxFacteurs.secoursTitre}
              className="!text-center !font-mono !text-lg !tracking-[0.2em]"
            />
          ) : (
            <div className="flex justify-center">
              <Input.OTP
                length={6}
                size="large"
                value={code}
                autoFocus
                formatter={(v) => v.replace(/\D/g, "")}
                onChange={(v) => {
                  setCode(v);
                  if (v.length === 6) verifier(v);
                }}
                aria-label={c.deuxFacteurs.titre}
              />
            </div>
          )}
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={verification}
            disabled={secours ? code.replace(/[^A-Z0-9]/g, "").length < 8 : code.length < 6}
            className="!mt-6 !h-12 !font-semibold"
          >
            {c.deuxFacteurs.valider}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-attenue">{c.deuxFacteurs.expire}</p>
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-trait pt-6 text-sm">
          <button
            type="button"
            onClick={() => {
              setSecours((s) => !s);
              setCode("");
              setErreur("");
            }}
            className="cursor-pointer font-semibold text-marque hover:underline"
          >
            {secours ? c.deuxFacteurs.utiliserApp : c.deuxFacteurs.utiliserSecours}
          </button>
          <button type="button" onClick={retour} className="cursor-pointer text-attenue hover:text-encre">
            {c.deuxFacteurs.retour}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------- email + mot de passe
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-encre">{c.titre}</h1>
      <p className="mt-2 text-texte">{c.sousTitre}</p>

      {erreur && <Alert className="!mt-6" type="error" showIcon message={erreur} closable onClose={() => setErreur("")} />}

      <Form form={form} layout="vertical" requiredMark={false} onFinish={seConnecter} className="!mt-8" size="large">
        <Form.Item
          name="email"
          label={<span className="font-medium text-encre">{t("login.emailLabel")}</span>}
          rules={[
            { required: true, message: t("login.emailRequired") },
            { type: "email", message: t("login.emailInvalid") },
          ]}
        >
          <Input
            prefix={<Mail size={17} className="mr-1 text-slate-400" />}
            placeholder={t("login.emailPlaceholder")}
            autoComplete="username"
            inputMode="email"
            autoFocus
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span className="font-medium text-encre">{t("login.passwordLabel")}</span>}
          rules={[{ required: true, message: t("login.passwordRequired") }]}
          className="!mb-2"
        >
          <Input.Password
            prefix={<LockKeyhole size={17} className="mr-1 text-slate-400" />}
            placeholder={t("login.passwordPlaceholder")}
            autoComplete="current-password"
          />
        </Form.Item>
        <div className="mb-6 flex justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold !text-marque hover:underline">
            {t("login.forgotPassword")}
          </Link>
        </div>
        <Button type="primary" htmlType="submit" block loading={isPending} className="!h-12 !font-semibold">
          {isPending ? t("login.loading") : t("login.submitBtn")}
        </Button>
      </Form>

      <p className="mt-10 border-t border-trait pt-6 text-center text-sm text-texte">
        {c.pasDeCompte}{" "}
        <Link to="/register-store" className="font-semibold !text-marque hover:underline">
          {c.creer}
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
