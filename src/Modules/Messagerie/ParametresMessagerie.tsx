// Onglet « Paramètres et modèles » (administrateur) : canaux utilisés par le
// magasin, types de message activés et leur texte, délai entre deux relances,
// envoi d'un test.
import React, { useRef, useState } from "react";
import { Alert, App, Button, Input, InputNumber, Space, Switch, Tag, Tooltip } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import { Mail, MessageSquare, Save, Send } from "lucide-react";
import { Section } from "../Reports/ReportUi";
import {
  compterSms,
  enregistrerParametres,
  envoyerTest,
  messageErreur,
  ORDRE_SEGMENTS,
  type Canal,
  type ConfigMessagerie,
  type Modele,
  type Parametres,
  type Segment,
} from "./messagerieService";

type Champ = "sms" | "email_sujet" | "email_corps";

interface Props {
  config: ConfigMessagerie;
  onEnregistre: (p: Parametres) => void;
}

const EtatPlateforme: React.FC<{ config: ConfigMessagerie }> = ({ config }) => {
  const { sms, email } = config.canaux_plateforme;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sms.simulation ? (
        <Alert type="warning" showIcon message="SMS : mode simulation"
          description="Les SMS sont écrits dans les journaux du serveur, aucun n'est réellement envoyé. Configurez un fournisseur (Orange ou Twilio) pour les envois réels." />
      ) : sms.configure ? (
        <Alert type="success" showIcon message={`SMS : fournisseur ${sms.fournisseur} configuré`}
          description={config.quota.limite ? `${config.quota.utilises} / ${config.quota.limite} SMS utilisés ce mois-ci.` : `${config.quota.utilises} SMS envoyés ce mois-ci.`} />
      ) : (
        <Alert type="info" showIcon message="SMS : pas encore configuré sur la plateforme"
          description={sms.manquant.length ? `Paramètres manquants : ${sms.manquant.join(", ")}.` : "Contactez l'équipe Lumistock pour activer l'envoi de SMS."} />
      )}
      {email.configure ? (
        <Alert type="success" showIcon message="Email : serveur d'envoi configuré"
          description="Les réponses des clients arrivent sur l'adresse email du magasin." />
      ) : (
        <Alert type="info" showIcon message="Email : pas encore configuré sur la plateforme"
          description="Contactez l'équipe Lumistock pour activer l'envoi d'emails." />
      )}
    </div>
  );
};

const ParametresMessagerie: React.FC<Props> = ({ config, onEnregistre }) => {
  const { message } = App.useApp();
  const [params, setParams] = useState<Parametres>(config.parametres);
  const [enregistrement, setEnregistrement] = useState(false);
  const [testeur, setTesteur] = useState<Record<Canal, string>>({ sms: "", email: localStorage.getItem("email") || "" });
  const [test, setTest] = useState<string>("");
  // Dernier champ de texte utilisé : les variables s'y insèrent à l'endroit du curseur.
  const champsRef = useRef<Record<string, TextAreaRef | null>>({});
  const dernierChamp = useRef<{ segment: Segment; champ: Champ } | null>(null);

  const modifierModele = (segment: Segment, changes: Partial<Modele>) =>
    setParams((p) => ({ ...p, modeles: { ...p.modeles, [segment]: { ...p.modeles[segment], ...changes } } }));

  const insererVariable = (segment: Segment, variable: string) => {
    const cible = dernierChamp.current?.segment === segment ? dernierChamp.current.champ : "sms";
    const zone = champsRef.current[`${segment}-${cible}`]?.resizableTextArea?.textArea;
    const texte = params.modeles[segment][cible] || "";
    const debut = zone?.selectionStart ?? texte.length;
    const fin = zone?.selectionEnd ?? texte.length;
    modifierModele(segment, { [cible]: `${texte.slice(0, debut)}{${variable}}${texte.slice(fin)}` });
  };

  const enregistrer = async () => {
    setEnregistrement(true);
    try {
      const resultat = await enregistrerParametres(params);
      setParams(resultat);
      onEnregistre(resultat);
      message.success("Paramètres enregistrés.");
    } catch (err) {
      message.error(messageErreur(err, "Enregistrement impossible."));
    } finally {
      setEnregistrement(false);
    }
  };

  const tester = async (segment: Segment, canal: Canal) => {
    setTest(`${segment}-${canal}`);
    try {
      // Le test utilise le texte enregistré : on enregistre d'abord.
      await enregistrerParametres(params);
      message.success(await envoyerTest(segment, canal, testeur[canal]));
    } catch (err) {
      message.error(messageErreur(err, "Le test n'a pas pu être envoyé."));
    } finally {
      setTest("");
    }
  };

  const zone = (segment: Segment, champ: Champ, lignes: number) => (
    <Input.TextArea
      ref={(r) => { champsRef.current[`${segment}-${champ}`] = r; }}
      value={params.modeles[segment][champ]}
      autoSize={{ minRows: lignes, maxRows: lignes + 8 }}
      maxLength={config.longueurs_max[champ]}
      onFocus={() => { dernierChamp.current = { segment, champ }; }}
      onChange={(e) => modifierModele(segment, { [champ]: e.target.value })}
    />
  );

  return (
    <div className="space-y-4">
      <EtatPlateforme config={config} />

      <Section titre="Canaux et règles d'envoi">
        <div className="flex flex-wrap items-center gap-6">
          {(["sms", "email"] as Canal[]).map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <Switch checked={params.canaux[c]} onChange={(v) => setParams((p) => ({ ...p, canaux: { ...p.canaux, [c]: v } }))} />
              {c === "sms" ? <MessageSquare size={16} /> : <Mail size={16} />}
              {c === "sms" ? "Envoyer des SMS" : "Envoyer des emails"}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            Ne pas recontacter un client avant
            <InputNumber min={0} max={720} value={params.options.delai_relance_heures}
              onChange={(v) => setParams((p) => ({ ...p, options: { ...p.options, delai_relance_heures: Number(v) || 0 } }))} />
            heures
          </label>
          <label className="flex items-center gap-2 text-sm">
            Envois programmés et automatiques entre
            <InputNumber min={0} max={23} value={params.options.heure_debut_envoi} addonAfter="h" style={{ width: 90 }}
              onChange={(v) => setParams((p) => ({ ...p, options: { ...p.options, heure_debut_envoi: Number(v) || 0 } }))} />
            et
            <InputNumber min={1} max={24} value={params.options.heure_fin_envoi} addonAfter="h" style={{ width: 90 }}
              onChange={(v) => setParams((p) => ({ ...p, options: { ...p.options, heure_fin_envoi: Number(v) || 0 } }))} />
          </label>
        </div>
        <p className="mb-0 mt-2 text-xs text-slate-500">
          Le délai évite de relancer trop souvent un même client ; il ne s'applique pas aux messages individuels
          ni aux renvois que vous décidez vous-même. Hors de la plage horaire, aucun envoi programmé ou automatique ne part.
        </p>
      </Section>

      {ORDRE_SEGMENTS.map((segment) => {
        const modele = params.modeles[segment];
        const compte = compterSms(modele.sms);
        return (
          <Section
            key={segment}
            titre={config.segments[segment].libelle}
            note={
              <label className="flex items-center gap-2">
                <span>{modele.actif ? "Message activé" : "Message désactivé"}</span>
                <Switch size="small" checked={modele.actif} onChange={(v) => modifierModele(segment, { actif: v })} />
              </label>
            }
          >
            <p className="mb-3 mt-0 text-xs text-slate-500">{config.segments[segment].description}</p>
            <div className={modele.actif ? "" : "opacity-60"}>
              <div className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                Insérer :
                {Object.entries(config.variables).map(([v, libelle]) => (
                  <Tooltip key={v} title={libelle}>
                    <Tag className="cursor-pointer" color="purple" onClick={() => insererVariable(segment, v)}>{`{${v}}`}</Tag>
                  </Tooltip>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span className="flex items-center gap-1"><MessageSquare size={14} /> SMS</span>
                    <span className={`text-xs font-normal ${compte.sms > 1 ? "text-orange-600" : "text-slate-500"}`}>
                      {compte.caracteres} caractères · {compte.sms} SMS{compte.encodage === "Unicode" ? " (caractères spéciaux)" : ""}
                    </span>
                  </div>
                  {zone(segment, "sms", 4)}
                  <p className="mb-0 mt-1 text-xs text-slate-400">
                    Le nom du client et les montants allongent le texte : chaque tranche de 160 caractères est facturée comme un SMS.
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1 text-sm font-semibold text-slate-700"><Mail size={14} /> Email</div>
                  <Input
                    className="mb-2"
                    placeholder="Objet"
                    value={modele.email_sujet}
                    maxLength={config.longueurs_max.email_sujet}
                    onChange={(e) => modifierModele(segment, { email_sujet: e.target.value })}
                  />
                  {zone(segment, "email_corps", 5)}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {(["sms", "email"] as Canal[]).filter((c) => params.canaux[c]).map((c) => (
                  <Space.Compact key={c}>
                    <Input
                      style={{ width: 220 }}
                      placeholder={c === "sms" ? "+237 6XX XX XX XX" : "votre@email.com"}
                      value={testeur[c]}
                      onChange={(e) => setTesteur((t) => ({ ...t, [c]: e.target.value }))}
                    />
                    <Button icon={<Send size={14} />} loading={test === `${segment}-${c}`} disabled={!testeur[c]}
                      onClick={() => tester(segment, c)}>
                      Tester {c === "sms" ? "le SMS" : "l'email"}
                    </Button>
                  </Space.Compact>
                ))}
              </div>
            </div>
          </Section>
        );
      })}

      <div className="sticky bottom-0 flex justify-end rounded-xl bg-white/90 py-3 backdrop-blur">
        <Button type="primary" size="large" icon={<Save size={16} />} loading={enregistrement} onClick={enregistrer}>
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
};

export default ParametresMessagerie;
