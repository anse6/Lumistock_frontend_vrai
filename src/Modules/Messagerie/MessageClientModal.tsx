// Fenêtre « Message au client » : envoyer maintenant ou programmer un message
// à un seul client, avec le modèle de sa catégorie ou un texte personnalisé.
// Utilisée depuis la liste des clients et depuis la page Messages.
import React, { useEffect, useMemo, useState } from "react";
import { Alert, App, Button, Checkbox, DatePicker, Input, Modal, Radio, Select, Skeleton, Tag } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarClock, Mail, MessageSquare, Send } from "lucide-react";
import { argent } from "../Reports/ReportUi";
import { useDevise } from "../Charges/financeUi";
import {
  compterSms,
  dateLocaleIso,
  definirPreference,
  envoyerAuClient,
  getApercu,
  getConfig,
  getSituationClient,
  LIBELLES_CANAUX,
  messageErreur,
  segmentConseille,
  type Canal,
  type ConfigMessagerie,
  type Destinataire,
  type Personnalise,
  type Segment,
  type SituationClient,
} from "./messagerieService";

interface Props {
  clientId: string | null;
  open: boolean;
  onClose: () => void;
  onEnvoye?: () => void;
}

const MessageClientModal: React.FC<Props> = ({ clientId, open, onClose, onEnvoye }) => {
  const { message } = App.useApp();
  const devise = useDevise();
  const [config, setConfig] = useState<ConfigMessagerie | null>(null);
  const [client, setClient] = useState<SituationClient | null>(null);
  const [erreur, setErreur] = useState("");
  const [segment, setSegment] = useState<Segment>("tous");
  const [canaux, setCanaux] = useState<Canal[]>([]);
  const [personnaliser, setPersonnaliser] = useState(false);
  const [texte, setTexte] = useState<Personnalise>({});
  const [quand, setQuand] = useState<"maintenant" | "programmer">("maintenant");
  const [date, setDate] = useState<Dayjs | null>(null);
  const [apercu, setApercu] = useState<Destinataire | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [version, setVersion] = useState(0);

  // Chargement du client et des paramètres à l'ouverture.
  useEffect(() => {
    if (!open || !clientId) return;
    let actif = true;
    setErreur("");
    setClient(null);
    setApercu(null);
    setPersonnaliser(false);
    setQuand("maintenant");
    setDate(null);
    Promise.all([getConfig(), getSituationClient(clientId)])
      .then(([cfg, situation]) => {
        if (!actif) return;
        setConfig(cfg);
        setClient(situation);
        const conseille = segmentConseille(situation.segments);
        setSegment(cfg.parametres.modeles[conseille].actif ? conseille : "tous");
        const disponibles = (["sms", "email"] as Canal[]).filter(
          (c) => cfg.parametres.canaux[c] && cfg.canaux_plateforme[c].configure && (c === "sms" ? situation.telephone : situation.email),
        );
        setCanaux(disponibles.slice(0, 1));
        const modele = cfg.parametres.modeles[conseille];
        setTexte({ sms: modele.sms, email_sujet: modele.email_sujet, email_corps: modele.email_corps });
      })
      .catch((err) => actif && setErreur(messageErreur(err, "Impossible de charger ce client.")));
    return () => {
      actif = false;
    };
  }, [open, clientId, version]);

  const autoriserMessages = async () => {
    if (!client) return;
    try {
      await definirPreference(client.client_id, false);
      message.success(`${client.nom} peut de nouveau recevoir des messages.`);
      setVersion((v) => v + 1);
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  // Aperçu du message avec les vraies valeurs du client (nom, dette, achats…).
  const personnalise = personnaliser ? texte : null;
  useEffect(() => {
    if (!open || !client || !canaux.length) {
      setApercu(null);
      return;
    }
    let actif = true;
    const t = setTimeout(() => {
      getApercu(segment, canaux, { client_ids: [client.client_id], ignorer_delai: true, personnalise })
        .then((data) => actif && setApercu(data.destinataires[0] || null))
        .catch(() => actif && setApercu(null));
    }, 300);
    return () => {
      actif = false;
      clearTimeout(t);
    };
  }, [open, client, segment, canaux, personnalise]);

  const segmentsPossibles = useMemo(
    () => (client ? client.segments : []).filter((s) => config && (personnaliser || config.parametres.modeles[s].actif)),
    [client, config, personnaliser],
  );

  const choisirSegment = (s: Segment) => {
    setSegment(s);
    if (config && !personnaliser) {
      const modele = config.parametres.modeles[s];
      setTexte({ sms: modele.sms, email_sujet: modele.email_sujet, email_corps: modele.email_corps });
    }
  };

  const plage = config?.parametres.options;
  const dateInvalide =
    quand === "programmer" &&
    (!date || date.isBefore(dayjs().add(1, "minute")) ||
      (plage && (date.hour() < plage.heure_debut_envoi || date.hour() >= plage.heure_fin_envoi)));

  const envoyer = async () => {
    if (!client) return;
    setEnvoi(true);
    try {
      const res = await envoyerAuClient(client.client_id, segment, canaux, {
        personnalise,
        date_envoi: quand === "programmer" && date ? dateLocaleIso(date) : null,
      });
      message.success(
        quand === "programmer" && date
          ? `Message programmé pour le ${date.format("DD/MM/YYYY à HH:mm")}.`
          : res.message,
      );
      onEnvoye?.();
      onClose();
    } catch (err) {
      message.error(messageErreur(err, "Le message n'a pas pu être envoyé."));
    } finally {
      setEnvoi(false);
    }
  };

  const raisons = apercu ? canaux.map((c) => apercu.canaux[c]?.raison).filter(Boolean) : [];
  const smsInfo = canaux.includes("sms") ? apercu?.canaux.sms : undefined;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={client ? `Message à ${client.nom}` : "Message au client"}
      width={680}
      destroyOnHidden
      footer={[
        <Button key="annuler" onClick={onClose}>Annuler</Button>,
        <Button
          key="envoyer"
          type="primary"
          icon={quand === "programmer" ? <CalendarClock size={16} /> : <Send size={16} />}
          loading={envoi}
          disabled={!client || !canaux.length || !segmentsPossibles.includes(segment) || raisons.length > 0 || dateInvalide}
          onClick={envoyer}
        >
          {quand === "programmer" ? "Programmer" : "Envoyer maintenant"}
        </Button>,
      ]}
    >
      {erreur ? (
        <Alert type="error" showIcon message={erreur} />
      ) : !client || !config ? (
        <Skeleton active />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {client.dette > 0 && <Tag color="red">Doit {argent(client.dette, devise)}</Tag>}
            {client.avance > 0 && <Tag color="green">Avance {argent(client.avance, devise)}</Tag>}
            {client.dette <= 0 && client.avance <= 0 && <Tag>À jour</Tag>}
            <span className="text-slate-500">{[client.telephone, client.email].filter(Boolean).join(" · ") || "Aucun contact"}</span>
          </div>

          {client.ne_pas_contacter && (
            <Alert type="warning" showIcon message="Ce client a demandé à ne plus recevoir de messages."
              description="À ne lever que si le client vous a donné son accord."
              action={<Button size="small" onClick={autoriserMessages}>Autoriser à nouveau</Button>} />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-sm font-semibold text-slate-700">Type de message</div>
              <Select
                className="w-full"
                value={segment}
                onChange={choisirSegment}
                options={client.segments.map((s) => ({
                  value: s,
                  label: config.segments[s].libelle,
                  disabled: !segmentsPossibles.includes(s),
                }))}
              />
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-slate-700">Envoyer par</div>
              <Checkbox.Group
                value={canaux}
                onChange={(v) => setCanaux(v as Canal[])}
                options={(["sms", "email"] as Canal[]).map((c) => ({
                  value: c,
                  label: LIBELLES_CANAUX[c],
                  disabled: !config.parametres.canaux[c] || !config.canaux_plateforme[c].configure || !(c === "sms" ? client.telephone : client.email),
                }))}
              />
            </div>
          </div>

          <Checkbox checked={personnaliser} onChange={(e) => setPersonnaliser(e.target.checked)}>
            Modifier le texte pour ce message uniquement
          </Checkbox>
          {personnaliser && (
            <div className="space-y-2 rounded-xl border border-purple-100 p-3">
              <p className="m-0 text-xs text-slate-500">
                Variables possibles : {Object.keys(config.variables).map((v) => `{${v}}`).join(" ")}
              </p>
              {canaux.includes("sms") && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> SMS</span>
                    <span>{compterSms(texte.sms || "").caracteres} caractères (avant remplacement des variables)</span>
                  </div>
                  <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} maxLength={config.longueurs_max.sms}
                    value={texte.sms} onChange={(e) => setTexte((t) => ({ ...t, sms: e.target.value }))} />
                </div>
              )}
              {canaux.includes("email") && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500"><Mail size={12} /> Email</div>
                  <Input placeholder="Objet" maxLength={config.longueurs_max.email_sujet} value={texte.email_sujet}
                    onChange={(e) => setTexte((t) => ({ ...t, email_sujet: e.target.value }))} />
                  <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} maxLength={config.longueurs_max.email_corps}
                    value={texte.email_corps} onChange={(e) => setTexte((t) => ({ ...t, email_corps: e.target.value }))} />
                </div>
              )}
            </div>
          )}

          {canaux.length > 0 && (
            <div className="rounded-xl bg-purple-50 p-3">
              <div className="mb-1 flex justify-between text-xs font-semibold text-purple-950">
                <span>Aperçu du message reçu</span>
                {smsInfo && <span>{smsInfo.caracteres} caractères · {smsInfo.sms} SMS</span>}
              </div>
              {!apercu ? (
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              ) : (
                canaux.map((c) => (
                  <div key={c} className="whitespace-pre-line text-sm text-slate-700">
                    {apercu.canaux[c]?.sujet && <div className="font-semibold">{apercu.canaux[c]?.sujet}</div>}
                    {apercu.canaux[c]?.texte}
                  </div>
                ))
              )}
              {raisons.map((r) => <Alert key={r} className="mt-2" type="warning" showIcon message={r} />)}
            </div>
          )}

          <div>
            <Radio.Group value={quand} onChange={(e) => setQuand(e.target.value)}>
              <Radio value="maintenant">Envoyer maintenant</Radio>
              <Radio value="programmer">Programmer pour plus tard</Radio>
            </Radio.Group>
            {quand === "programmer" && (
              <div className="mt-2">
                <DatePicker
                  showTime={{ format: "HH:mm", minuteStep: 5 }}
                  format="DD/MM/YYYY HH:mm"
                  value={date}
                  onChange={setDate}
                  disabledDate={(d) => d.isBefore(dayjs(), "day") || d.isAfter(dayjs().add(1, "year"))}
                  placeholder="Date et heure d'envoi"
                />
                {plage && (
                  <p className="mb-0 mt-1 text-xs text-slate-500">
                    Entre {plage.heure_debut_envoi} h et {plage.heure_fin_envoi} h. Le montant dû sera calculé le jour de l'envoi :
                    si le client a payé entre-temps, le rappel ne partira pas.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MessageClientModal;
