// Onglet « Envoyer » : choisir une catégorie de clients et un canal, affiner
// (dette minimale, ancienneté), vérifier la liste des destinataires et le
// message de chacun, puis envoyer maintenant ou programmer l'envoi.
import React, { useEffect, useMemo, useState } from "react";
import { Alert, App, Button, Checkbox, DatePicker, Empty, InputNumber, Popconfirm, Popover, Radio, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarClock, Coins, Mail, MessageSquare, Send, UserRound, Users, Wallet } from "lucide-react";
import { argent, Pastille, Section } from "../Reports/ReportUi";
import MessageClientModal from "./MessageClientModal";
import {
  dateLocaleIso,
  definirPreference,
  getApercu,
  lancerCampagne,
  LIBELLES_CANAUX,
  messageErreur,
  ORDRE_SEGMENTS,
  type Apercu,
  type Canal,
  type ConfigMessagerie,
  type Destinataire,
  type Filtres,
  type Segment,
} from "./messagerieService";

const ICONES: Record<Segment, React.ReactNode> = {
  debiteurs: <Coins size={18} />,
  avances: <Wallet size={18} />,
  acheteurs: <Users size={18} />,
  tous: <Users size={18} />,
};

const RAISON_REFUS = "Le client ne souhaite pas être contacté.";

interface Props {
  config: ConfigMessagerie;
  devise: string;
  onEnvoye: (programme: boolean) => void;
}

const EnvoiMessages: React.FC<Props> = ({ config, devise, onEnvoye }) => {
  const { message } = App.useApp();
  const { parametres, segments, resume, canaux_plateforme, quota } = config;
  const plage = parametres.options;
  const [segment, setSegment] = useState<Segment>("debiteurs");
  const canauxDisponibles = (["sms", "email"] as Canal[]).filter(
    (c) => parametres.canaux[c] && canaux_plateforme[c].configure,
  );
  const [canaux, setCanaux] = useState<Canal[]>(canauxDisponibles.slice(0, 1));
  const [filtres, setFiltres] = useState<Filtres>({});
  const [ignorerDelai, setIgnorerDelai] = useState(false);
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [chargement, setChargement] = useState(false);
  const [selection, setSelection] = useState<React.Key[]>([]);
  const [quand, setQuand] = useState<"maintenant" | "programmer">("maintenant");
  const [date, setDate] = useState<Dayjs | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [version, setVersion] = useState(0);
  const [clientIndividuel, setClientIndividuel] = useState<string | null>(null);

  const modeleActif = parametres.modeles[segment].actif;
  const filtresActifs = segment === "debiteurs" ? filtres : {};

  useEffect(() => {
    if (!canaux.length || !modeleActif) {
      setApercu(null);
      return;
    }
    let actif = true;
    setChargement(true);
    const t = setTimeout(() => {
      getApercu(segment, canaux, { filtres: filtresActifs, ignorer_delai: ignorerDelai })
        .then((data) => {
          if (!actif) return;
          setApercu(data);
          // Par défaut, tous les clients joignables sont sélectionnés.
          setSelection(data.destinataires.filter((d) => canaux.some((c) => d.canaux[c]?.joignable)).map((d) => d.client_id));
        })
        .catch((err) => actif && message.error(messageErreur(err, "Impossible de charger les destinataires.")))
        .finally(() => actif && setChargement(false));
    }, 300);
    return () => {
      actif = false;
      clearTimeout(t);
    };
    // filtresActifs est dérivé de filtres et segment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, canaux, modeleActif, filtres, ignorerDelai, version, message]);

  const joignable = (d: Destinataire) => canaux.some((c) => d.canaux[c]?.joignable);
  const joignables = useMemo(() => (apercu?.destinataires || []).filter(joignable), [apercu, canaux]); // eslint-disable-line react-hooks/exhaustive-deps
  const choisis = useMemo(
    () => (apercu?.destinataires || []).filter((d) => selection.includes(d.client_id)),
    [apercu, selection],
  );
  const smsFactures = choisis.reduce((n, d) => n + (d.canaux.sms?.joignable ? d.canaux.sms.sms || 1 : 0), 0);
  const emails = choisis.filter((d) => d.canaux.email?.joignable).length;
  const depasseQuota = quota.restants !== null && canaux.includes("sms") && smsFactures > quota.restants;
  const dateInvalide =
    quand === "programmer" &&
    (!date || date.isBefore(dayjs().add(1, "minute")) || date.hour() < plage.heure_debut_envoi || date.hour() >= plage.heure_fin_envoi);

  const envoyer = async () => {
    setEnvoi(true);
    try {
      // Tous les clients joignables choisis : pour un envoi programmé, la liste
      // sera recalculée le jour J (nouveaux débiteurs inclus, clients à jour exclus).
      const tous = choisis.length === joignables.length;
      const programme = quand === "programmer" && date;
      const res = await lancerCampagne(segment, canaux, {
        client_ids: tous && programme ? null : choisis.map((d) => d.client_id),
        filtres: filtresActifs,
        ignorer_delai: ignorerDelai,
        date_envoi: programme ? dateLocaleIso(date) : null,
      });
      message.success(
        programme
          ? `Envoi programmé pour le ${date.format("DD/MM/YYYY à HH:mm")}.`
          : `${res.message} Suivez la progression dans l'historique.`,
      );
      onEnvoye(Boolean(programme));
    } catch (err) {
      message.error(messageErreur(err, "L'envoi n'a pas pu être lancé."));
    } finally {
      setEnvoi(false);
    }
  };

  const neplusContacter = async (d: Destinataire) => {
    try {
      await definirPreference(d.client_id, true);
      message.success(`${d.nom} ne recevra plus de messages.`);
      setVersion((v) => v + 1);
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const colonnes: ColumnsType<Destinataire> = [
    {
      title: "Client",
      dataIndex: "nom",
      render: (nom: string, d) => (
        <div>
          <div className="font-semibold text-slate-800">{nom}</div>
          <div className="text-xs text-slate-500">{[d.telephone, d.email].filter(Boolean).join(" · ") || "Aucun contact"}</div>
        </div>
      ),
    },
    {
      title: "Doit",
      dataIndex: "dette",
      align: "right",
      render: (n: number) => (n > 0 ? <span className="font-semibold text-red-600">{argent(n, devise)}</span> : "—"),
    },
    {
      title: "Avance",
      dataIndex: "avance",
      align: "right",
      responsive: ["md"],
      render: (n: number) => (n > 0 ? <span className="text-emerald-700">{argent(n, devise)}</span> : "—"),
    },
    ...canaux.map((canal) => ({
      title: LIBELLES_CANAUX[canal],
      key: canal,
      render: (_: unknown, d: Destinataire) => {
        const info = d.canaux[canal];
        if (!info) return null;
        if (!info.joignable)
          return (
            <Tooltip title={info.raison}>
              <span><Pastille ton="gris">Non envoyé</Pastille></span>
            </Tooltip>
          );
        return (
          <Popover
            title={info.sujet || `Message ${LIBELLES_CANAUX[canal]}`}
            content={<div className="max-w-xs whitespace-pre-line text-sm">{info.texte}</div>}
          >
            <span className="cursor-help">
              <Pastille ton="vert">{canal === "sms" ? `${info.sms} SMS · ${info.caracteres} car.` : "Aperçu"}</Pastille>
            </span>
          </Popover>
        );
      },
    })),
    {
      title: "",
      key: "actions",
      render: (_, d) => {
        const refus = Object.values(d.canaux).some((c) => c?.raison === RAISON_REFUS);
        return (
          <div className="flex flex-col items-start">
            <Button type="link" size="small" className="!px-0 text-xs" icon={<UserRound size={12} />}
              onClick={() => setClientIndividuel(d.client_id)}>
              Message individuel
            </Button>
            {!refus && (
              <Popconfirm title="Ne plus contacter ce client ?" description="Il ne recevra plus aucun SMS ni email du magasin."
                okText="Confirmer" cancelText="Annuler" onConfirm={() => neplusContacter(d)}>
                <Button type="link" size="small" className="!px-0 text-xs !text-slate-500">Ne plus contacter</Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Catégorie de clients */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ORDRE_SEGMENTS.map((s) => {
          const info = resume.segments[s];
          const actif = s === segment;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSegment(s)}
              className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                actif ? "border-purple-900 bg-purple-50 ring-2 ring-purple-900/20" : "border-purple-100 bg-white hover:border-purple-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{segments[s].libelle}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-900">{ICONES[s]}</span>
              </div>
              <div className="mt-2 text-xl font-bold text-purple-950">{info.clients} client{info.clients > 1 ? "s" : ""}</div>
              <div className="mt-1 text-xs text-slate-500">
                {s === "debiteurs" ? `${argent(resume.total_dette, devise)} à recouvrer · ` : ""}
                {s === "avances" ? `${argent(resume.total_avances, devise)} versés · ` : ""}
                {info.joignables_sms} joignable{info.joignables_sms > 1 ? "s" : ""} par SMS
              </div>
              {!parametres.modeles[s].actif && <div className="mt-2"><Pastille ton="gris">Message non activé</Pastille></div>}
            </button>
          );
        })}
      </div>

      {!modeleActif ? (
        <Alert type="info" showIcon message={`Le message « ${segments[segment].libelle} » n'est pas activé.`}
          description="Un administrateur peut l'activer et modifier son texte dans l'onglet Paramètres et modèles. Vous pouvez aussi écrire à un client précis avec un texte personnalisé (Message individuel)." />
      ) : !canauxDisponibles.length ? (
        <Alert type="warning" showIcon message="Aucun canal d'envoi disponible."
          description="Activez le SMS ou l'email dans l'onglet Paramètres et modèles. Si un canal est activé mais indisponible, la plateforme n'est pas encore configurée pour ce canal." />
      ) : (
        <Section
          titre="Destinataires et messages"
          note={
            <span className="flex items-center gap-3">
              {(["sms", "email"] as Canal[]).map((c) => (
                <Tooltip key={c} title={!parametres.canaux[c] ? "Canal désactivé dans les paramètres"
                  : !canaux_plateforme[c].configure ? "Non configuré sur la plateforme" : undefined}>
                  <Checkbox checked={canaux.includes(c)} disabled={!canauxDisponibles.includes(c)}
                    onChange={(e) => setCanaux((prev) => (e.target.checked ? [...prev, c] : prev.filter((x) => x !== c)))}>
                    {c === "sms" ? <MessageSquare size={14} className="mr-1 inline" /> : <Mail size={14} className="mr-1 inline" />}
                    {LIBELLES_CANAUX[c]}
                  </Checkbox>
                </Tooltip>
              ))}
            </span>
          }
        >
          {/* 2. Conditions */}
          <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-purple-100 p-3 text-sm">
            {segment === "debiteurs" && (
              <>
                <label className="flex items-center gap-2">
                  Doit au moins
                  <InputNumber min={0} step={1000} placeholder="0" value={filtres.dette_minimum ?? null}
                    onChange={(v) => setFiltres((f) => ({ ...f, dette_minimum: v }))} addonAfter={devise} style={{ width: 170 }} />
                </label>
                <label className="flex items-center gap-2">
                  Depuis au moins
                  <InputNumber min={0} max={3650} placeholder="0" value={filtres.anciennete_minimum_jours ?? null}
                    onChange={(v) => setFiltres((f) => ({ ...f, anciennete_minimum_jours: v }))} addonAfter="jours" style={{ width: 140 }} />
                </label>
              </>
            )}
            <Tooltip title={`Par défaut, un client contacté il y a moins de ${parametres.options.delai_relance_heures} h n'est pas relancé.`}>
              <Checkbox checked={ignorerDelai} onChange={(e) => setIgnorerDelai(e.target.checked)}>
                Inclure les clients déjà contactés récemment
              </Checkbox>
            </Tooltip>
          </div>

          {canaux_plateforme.sms.simulation && canaux.includes("sms") && (
            <Alert className="mb-3" type="warning" showIcon message="Mode simulation : aucun SMS réel ne sera envoyé (fournisseur « console »)." />
          )}
          {!canaux.length ? (
            <Empty description="Choisissez au moins un canal (SMS ou email)." />
          ) : (
            <>
              <Table
                rowKey="client_id"
                size="middle"
                loading={chargement}
                columns={colonnes}
                dataSource={apercu?.destinataires || []}
                pagination={{ pageSize: 20, hideOnSinglePage: true }}
                scroll={{ x: true }}
                rowSelection={{ selectedRowKeys: selection, onChange: setSelection, getCheckboxProps: (d) => ({ disabled: !joignable(d) }) }}
                locale={{ emptyText: <Empty description="Aucun client ne correspond." /> }}
              />

              {/* 3. Quand envoyer */}
              <div className="mt-3 flex flex-col gap-3 rounded-xl bg-purple-50 p-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-purple-950">
                  <strong>{choisis.length}</strong> client{choisis.length > 1 ? "s" : ""} sélectionné{choisis.length > 1 ? "s" : ""}
                  {canaux.includes("sms") && <> · <strong>{smsFactures}</strong> SMS facturé{smsFactures > 1 ? "s" : ""}</>}
                  {canaux.includes("email") && <> · <strong>{emails}</strong> email{emails > 1 ? "s" : ""}</>}
                  {quota.restants !== null && <span className="text-slate-500"> · quota restant : {quota.restants} SMS</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Radio.Group value={quand} onChange={(e) => setQuand(e.target.value)} optionType="button" size="small"
                    options={[{ value: "maintenant", label: "Maintenant" }, { value: "programmer", label: "Programmer" }]} />
                  {quand === "programmer" && (
                    <Tooltip title={`Entre ${plage.heure_debut_envoi} h et ${plage.heure_fin_envoi} h. La liste et les montants seront recalculés le jour de l'envoi.`}>
                      <DatePicker showTime={{ format: "HH:mm", minuteStep: 5 }} format="DD/MM/YYYY HH:mm" value={date} onChange={setDate}
                        disabledDate={(d) => d.isBefore(dayjs(), "day") || d.isAfter(dayjs().add(1, "year"))}
                        placeholder="Date et heure" status={date && dateInvalide ? "error" : undefined} />
                    </Tooltip>
                  )}
                  <Popconfirm
                    title={quand === "programmer" ? "Confirmer la programmation" : "Confirmer l'envoi"}
                    description={quand === "programmer" && date
                      ? `Programmer l'envoi pour le ${date.format("DD/MM/YYYY à HH:mm")} ?`
                      : `Envoyer le message à ${choisis.length} client${choisis.length > 1 ? "s" : ""} ?`}
                    okText="Confirmer" cancelText="Annuler" onConfirm={envoyer}
                    disabled={!choisis.length || depasseQuota || dateInvalide}
                  >
                    <Tooltip title={depasseQuota ? "Quota de SMS du mois insuffisant" : undefined}>
                      <Button type="primary" icon={quand === "programmer" ? <CalendarClock size={16} /> : <Send size={16} />}
                        loading={envoi} disabled={!choisis.length || depasseQuota || dateInvalide}>
                        {quand === "programmer" ? "Programmer" : "Envoyer"}
                      </Button>
                    </Tooltip>
                  </Popconfirm>
                </div>
              </div>
            </>
          )}
        </Section>
      )}

      <MessageClientModal
        open={!!clientIndividuel}
        clientId={clientIndividuel}
        onClose={() => setClientIndividuel(null)}
        onEnvoye={() => setVersion((v) => v + 1)}
      />
    </div>
  );
};

export default EnvoiMessages;
