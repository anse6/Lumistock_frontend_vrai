// Carte « Double authentification » des paramètres de chaque utilisateur.
// Facultative : l'utilisateur choisit de l'activer. Activation en 3 temps :
// scanner le QR code, saisir un premier code, garder ses codes de secours.
import React, { useCallback, useEffect, useState } from "react";
import { Alert, App, Button, Card, Input, Modal, QRCode, Skeleton, Steps, Tag, Typography } from "antd";
import { Copy, Download, KeyRound, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import dayjs from "dayjs";
import {
  activer,
  desactiver,
  EtatDeuxFacteurs,
  initialiser,
  lireEtat,
  messageErreur,
  regenererCodes,
} from "../../services/deuxFacteurs";

const { Text, Paragraph } = Typography;

const telechargerCodes = (codes: string[]) => {
  const texte = [
    "Lumistock — codes de secours (double authentification)",
    `Générés le ${dayjs().format("DD/MM/YYYY HH:mm")}`,
    "Chaque code ne sert qu'une fois. Gardez-les en lieu sûr.",
    "",
    ...codes,
  ].join("\n");
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(new Blob([texte], { type: "text/plain;charset=utf-8" }));
  lien.download = "lumistock-codes-de-secours.txt";
  lien.click();
  URL.revokeObjectURL(lien.href);
};

const CodesSecours: React.FC<{ codes: string[] }> = ({ codes }) => {
  const { message } = App.useApp();
  return (
    <div>
      <Alert
        type="warning"
        showIcon
        message="Enregistrez ces codes maintenant"
        description="Ils ne seront plus affichés. Chacun permet de vous connecter une seule fois si vous perdez votre téléphone."
      />
      <ul className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-4 font-mono text-sm ring-1 ring-slate-200">
        {codes.map((c) => (
          <li key={c} className="text-center tracking-wider text-slate-800">{c}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          icon={<Copy size={14} />}
          onClick={() => {
            navigator.clipboard?.writeText(codes.join("\n"));
            message.success("Codes copiés.");
          }}
        >
          Copier
        </Button>
        <Button icon={<Download size={14} />} onClick={() => telechargerCodes(codes)}>
          Télécharger (.txt)
        </Button>
      </div>
    </div>
  );
};

const DeuxFacteurs: React.FC = () => {
  const { message } = App.useApp();
  const [etat, setEtat] = useState<EtatDeuxFacteurs | null>(null);
  const [erreurChargement, setErreurChargement] = useState(false);

  // Activation
  const [activation, setActivation] = useState(false);
  const [etape, setEtape] = useState(0);
  const [secret, setSecret] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  // Désactivation / nouveaux codes
  const [action, setAction] = useState<"desactiver" | "codes" | null>(null);
  const [motDePasse, setMotDePasse] = useState("");
  const [codeConfirmation, setCodeConfirmation] = useState("");

  const charger = useCallback(() => {
    setErreurChargement(false);
    lireEtat().then(setEtat).catch(() => setErreurChargement(true));
  }, []);

  useEffect(charger, [charger]);

  const demarrer = async () => {
    setErreur("");
    setCode("");
    setCodes([]);
    setEtape(0);
    setActivation(true);
    try {
      setSecret(await initialiser());
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  const confirmerActivation = async (valeur = code) => {
    if (valeur.length !== 6) return;
    setEnvoi(true);
    setErreur("");
    try {
      const r = await activer(valeur);
      setCodes(r.codes_secours);
      setEtat(r);
      setEtape(2);
    } catch (e) {
      setErreur(messageErreur(e));
      setCode("");
    } finally {
      setEnvoi(false);
    }
  };

  const fermerActivation = () => {
    if (etape === 2) message.success("Double authentification activée.");
    setActivation(false);
    setSecret(null);
  };

  const ouvrirAction = (a: "desactiver" | "codes") => {
    setMotDePasse("");
    setCodeConfirmation("");
    setErreur("");
    setCodes([]);
    setAction(a);
  };

  const executerAction = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      if (action === "desactiver") {
        setEtat(await desactiver(motDePasse, codeConfirmation));
        message.success("Double authentification désactivée.");
        setAction(null);
      } else {
        const r = await regenererCodes(motDePasse);
        setEtat(r);
        setCodes(r.codes_secours);
      }
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Card variant="borderless" className="!rounded-2xl !border !border-purple-100/70 !shadow-sm [&_.ant-card-body]:!p-4 sm:[&_.ant-card-body]:!p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${etat?.actif ? "bg-emerald-50 text-emerald-700" : "bg-purple-50 text-purple-800"}`}>
            <ShieldCheck size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-bold text-slate-900">Double authentification</h3>
              {etat && (etat.actif ? <Tag color="green" className="!m-0">Activée</Tag> : <Tag className="!m-0">Désactivée</Tag>)}
            </div>
            <Text className="text-sm text-slate-500">
              En plus du mot de passe, un code de votre téléphone est demandé à chaque connexion. Facultatif, mais
              fortement conseillé pour les comptes qui gèrent l'argent et l'équipe.
            </Text>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {erreurChargement ? (
          <Alert type="error" showIcon message="État indisponible." action={<Button size="small" onClick={charger}>Réessayer</Button>} />
        ) : !etat ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : etat.actif ? (
          <div className="flex flex-col gap-4 rounded-xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-700">
              Activée{etat.active_le ? ` le ${dayjs(etat.active_le).format("DD/MM/YYYY")}` : ""} ·{" "}
              <span className={etat.codes_secours_restants <= 3 ? "font-semibold text-amber-700" : ""}>
                {etat.codes_secours_restants} code{etat.codes_secours_restants > 1 ? "s" : ""} de secours restant{etat.codes_secours_restants > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button icon={<KeyRound size={14} />} onClick={() => ouvrirAction("codes")}>Nouveaux codes de secours</Button>
              <Button danger icon={<ShieldOff size={14} />} onClick={() => ouvrirAction("desactiver")}>Désactiver</Button>
            </div>
          </div>
        ) : (
          <Button type="primary" icon={<Smartphone size={15} />} onClick={demarrer}>
            Activer la double authentification
          </Button>
        )}
      </div>

      {/* ------------------------------------------------ activation */}
      <Modal
        open={activation}
        onCancel={fermerActivation}
        maskClosable={false}
        width={560}
        centered
        title="Activer la double authentification"
        footer={
          etape === 0 ? (
            <Button type="primary" disabled={!secret} onClick={() => setEtape(1)}>J'ai scanné le code</Button>
          ) : etape === 1 ? (
            <div className="flex justify-between">
              <Button onClick={() => setEtape(0)}>Retour</Button>
              <Button type="primary" loading={envoi} disabled={code.length !== 6} onClick={() => confirmerActivation()}>
                Activer
              </Button>
            </div>
          ) : (
            <Button type="primary" onClick={fermerActivation}>J'ai enregistré mes codes</Button>
          )
        }
      >
        <Steps
          size="small"
          current={etape}
          className="!mb-6 !mt-2"
          items={[{ title: "Scanner" }, { title: "Vérifier" }, { title: "Codes de secours" }]}
        />
        {erreur && <Alert className="!mb-4" type="error" showIcon message={erreur} />}

        {etape === 0 && (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-xl bg-white p-2 ring-1 ring-slate-200">
              {secret ? <QRCode value={secret.uri} size={176} bordered={false} color="#24092f" /> : <Skeleton.Image active className="!h-44 !w-44" />}
            </div>
            <div className="text-sm text-slate-600">
              <ol className="list-decimal space-y-2 pl-4">
                <li>Installez une application d'authentification : Google Authenticator, Microsoft Authenticator ou Authy.</li>
                <li>Dans l'application, ajoutez un compte et scannez ce QR code.</li>
              </ol>
              {secret && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500">Impossible de scanner ? Saisissez cette clé :</p>
                  <Paragraph copyable={{ text: secret.secret }} className="!mb-0 !mt-1 break-all font-mono text-xs font-semibold text-slate-800">
                    {secret.secret.match(/.{1,4}/g)?.join(" ")}
                  </Paragraph>
                </div>
              )}
            </div>
          </div>
        )}

        {etape === 1 && (
          <div className="text-center">
            <p className="text-sm text-slate-600">Saisissez le code à 6 chiffres affiché par l'application.</p>
            <div className="mt-5 flex justify-center">
              <Input.OTP
                length={6}
                size="large"
                value={code}
                autoFocus
                formatter={(v) => v.replace(/\D/g, "")}
                onChange={(v) => {
                  setCode(v);
                  if (v.length === 6) confirmerActivation(v);
                }}
                aria-label="Code de vérification"
              />
            </div>
          </div>
        )}

        {etape === 2 && <CodesSecours codes={codes} />}
      </Modal>

      {/* ------------------------------------------------ désactivation / nouveaux codes */}
      <Modal
        open={action !== null}
        onCancel={() => setAction(null)}
        centered
        width={480}
        title={action === "desactiver" ? "Désactiver la double authentification" : "Nouveaux codes de secours"}
        footer={
          codes.length && action === "codes" ? (
            <Button type="primary" onClick={() => setAction(null)}>J'ai enregistré mes codes</Button>
          ) : (
            <div className="flex justify-end gap-2">
              <Button onClick={() => setAction(null)}>Annuler</Button>
              <Button
                type="primary"
                danger={action === "desactiver"}
                loading={envoi}
                disabled={!motDePasse || (action === "desactiver" && !codeConfirmation.trim())}
                onClick={executerAction}
              >
                {action === "desactiver" ? "Désactiver" : "Générer de nouveaux codes"}
              </Button>
            </div>
          )
        }
      >
        {codes.length && action === "codes" ? (
          <CodesSecours codes={codes} />
        ) : (
          <div className="space-y-4 pt-2">
            {erreur && <Alert type="error" showIcon message={erreur} />}
            <p className="text-sm text-slate-600">
              {action === "desactiver"
                ? "Pour confirmer, saisissez votre mot de passe et un code de l'application (ou un code de secours)."
                : "Les anciens codes de secours ne fonctionneront plus. Confirmez avec votre mot de passe."}
            </p>
            <div>
              <label htmlFor="df-mdp" className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
              <Input.Password id="df-mdp" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoComplete="current-password" autoFocus />
            </div>
            {action === "desactiver" && (
              <div>
                <label htmlFor="df-code" className="mb-1 block text-sm font-medium text-slate-700">Code</label>
                <Input id="df-code" value={codeConfirmation} onChange={(e) => setCodeConfirmation(e.target.value)} placeholder="123456 ou XXXX-XXXX" maxLength={9} autoComplete="one-time-code" />
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default DeuxFacteurs;
