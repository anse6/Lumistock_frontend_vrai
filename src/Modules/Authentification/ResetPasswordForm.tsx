// Choix du mot de passe : lien d'invitation (nouveau compte) ou lien de
// réinitialisation. Le lien est vérifié dès l'ouverture de la page.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Form, Input, Spin } from "antd";
import { CheckCircle2, LinkIcon, LockKeyhole } from "lucide-react";
import axios from "axios";
import { useResetPassword } from "./services/authService";
import { getUrlServer } from "../../configServer";
import { useContenu } from "../Public/contenu";

// Même règle que le serveur : 8 caractères minimum, au moins une lettre et un chiffre.
const MOT_DE_PASSE_ROBUSTE = /^(?=.*[A-Za-zÀ-ÿ])(?=.*\d).{8,128}$/;

/** 0 à 3 : indication visuelle seulement (la règle reste celle du serveur). */
const force = (mdp: string) => {
  if (!MOT_DE_PASSE_ROBUSTE.test(mdp)) return 0;
  let score = 1;
  if (mdp.length >= 12) score++;
  if (/[A-Z]/.test(mdp) && /[a-z]/.test(mdp) && /[^A-Za-z0-9]/.test(mdp)) score++;
  return score;
};

const COULEURS = ["bg-rose-500", "bg-amber-400", "bg-emerald-500", "bg-emerald-600"];

const ResetPasswordForm = () => {
  const contenu = useContenu();
  const c = contenu.auth.reinit;
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { mutateAsync, isPending } = useResetPassword();
  const [etat, setEtat] = useState<"verification" | "valide" | "invalide" | "termine">("verification");
  const [typeLien, setTypeLien] = useState<"invitation" | "reset" | null>(null);
  const [prenom, setPrenom] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const motDePasse = (Form.useWatch("password", form) as string | undefined) || "";

  useEffect(() => {
    if (!token) {
      setEtat("invalide");
      return;
    }
    axios
      .get(`${getUrlServer()}/auth/verify_link/${token}`)
      .then((r) => {
        setTypeLien(r.data.type);
        setPrenom(r.data.first_name || "");
        setEtat("valide");
      })
      .catch((e) => {
        setErreur(e.response?.data?.error || "");
        setEtat("invalide");
      });
  }, [token]);

  const enregistrer = async (values: { password: string; confirmPassword: string }) => {
    setErreur("");
    try {
      const r = await mutateAsync({ token: token ?? "", new_password: values.password, confirm_password: values.confirmPassword });
      setSucces(r.message);
      setEtat("termine");
      setTimeout(() => navigate("/login"), 2500);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      setErreur(message);
      if (/invalide|expiré|déjà été utilisé|expired|used/i.test(message)) setEtat("invalide");
    }
  };

  if (etat === "verification") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-attenue" role="status">
        <Spin size="large" />
        {c.verification}
      </div>
    );
  }

  if (etat === "invalide") {
    return (
      <div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <LinkIcon size={24} />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-encre">{c.invalide}</h1>
        <p className="mt-3 text-texte">{c.invalideTexte}</p>
        {erreur && <p className="mt-2 text-sm text-attenue">{erreur}</p>}
        <Button type="primary" size="large" className="!mt-8 !h-12 !font-semibold" onClick={() => navigate("/forgot-password")}>
          {c.nouveauLien}
        </Button>
      </div>
    );
  }

  if (etat === "termine") {
    return (
      <div role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={24} />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-encre">{succes}</h1>
        <Link to="/login" className="mt-8 inline-flex font-semibold !text-marque hover:underline">
          {contenu.nav.connexion}
        </Link>
      </div>
    );
  }

  const niveau = force(motDePasse);
  const invitation = typeLien === "invitation";

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-encre">
        {invitation ? `${c.bienvenue}${prenom ? ` ${prenom}` : ""} !` : c.titre}
      </h1>
      <p className="mt-2 text-texte">{invitation ? c.invitation : c.reset}</p>

      {erreur && <Alert className="!mt-6" type="error" showIcon message={erreur} closable onClose={() => setErreur("")} />}

      <Form form={form} layout="vertical" requiredMark={false} onFinish={enregistrer} className="!mt-8" size="large">
        <Form.Item
          name="password"
          label={<span className="font-medium text-encre">{c.nouveau}</span>}
          rules={[
            { required: true, message: c.regle },
            { pattern: MOT_DE_PASSE_ROBUSTE, message: c.regle },
          ]}
          extra={
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${motDePasse && i < Math.max(niveau, 1) ? COULEURS[niveau] : "bg-slate-200"}`} />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-attenue">{motDePasse ? c.force[niveau] : c.regle}</p>
            </div>
          }
        >
          <Input.Password prefix={<LockKeyhole size={17} className="mr-1 text-slate-400" />} autoComplete="new-password" autoFocus />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={<span className="font-medium text-encre">{c.confirmer}</span>}
          dependencies={["password"]}
          rules={[
            { required: true, message: c.different },
            ({ getFieldValue }) => ({
              validator: (_, v) => (!v || v === getFieldValue("password") ? Promise.resolve() : Promise.reject(new Error(c.different))),
            }),
          ]}
        >
          <Input.Password prefix={<LockKeyhole size={17} className="mr-1 text-slate-400" />} autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={isPending} className="!mt-2 !h-12 !font-semibold">
          {c.bouton}
        </Button>
      </Form>
    </div>
  );
};

export default ResetPasswordForm;
