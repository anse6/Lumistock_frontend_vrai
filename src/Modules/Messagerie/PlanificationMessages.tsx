// Onglet « Automatique et programmés » : relances automatiques récurrentes
// (chaque jour / semaine / mois) et envois programmés à une date.
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, App, Button, Checkbox, Empty, Form, Input, InputNumber, Modal, Popconfirm, Radio, Select, Switch, Table,
  TimePicker, Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { CalendarClock, Pencil, Play, Plus, Repeat, Trash2, X } from "lucide-react";
import { argent, dateHeure, Pastille, Section } from "../Reports/ReportUi";
import useCompteConnecte from "../../hooks/useCompteConnecte";
import {
  annulerProgramme,
  creerRegle,
  executerRegle,
  getProgrammes,
  getRegles,
  LIBELLES_CANAUX,
  LIBELLES_TYPES,
  messageErreur,
  modifierRegle,
  ORDRE_SEGMENTS,
  supprimerRegle,
  type Canal,
  type ConfigMessagerie,
  type EnvoiProgramme,
  type NouvelleRegle,
  type Regle,
} from "./messagerieService";

const STATUTS_PROGRAMME = {
  programme: { ton: "violet", libelle: "Programmé" },
  en_cours: { ton: "orange", libelle: "En cours" },
  envoye: { ton: "vert", libelle: "Envoyé" },
  echec: { ton: "rouge", libelle: "Non envoyé" },
  annule: { ton: "gris", libelle: "Annulé" },
} as const;

const REGLE_VIDE: NouvelleRegle = {
  nom: "Relance des dettes",
  segment: "debiteurs",
  canaux: ["sms"],
  frequence: "hebdomadaire",
  jours: [0],
  heure: "09:00",
  filtres: { dette_minimum: null, anciennete_minimum_jours: 7 },
  actif: true,
};

interface Props {
  config: ConfigMessagerie;
  devise: string;
  rafraichir: number;
  onCampagne: () => void;
}

const PlanificationMessages: React.FC<Props> = ({ config, devise, rafraichir, onCampagne }) => {
  const { message } = App.useApp();
  // Droit « Paramètres de la messagerie » (Paramètres > Accès).
  const estAdmin = useCompteConnecte().peut("messagerie.parametres");
  const plage = config.parametres.options;
  const [regles, setRegles] = useState<Regle[]>([]);
  const [programmes, setProgrammes] = useState<EnvoiProgramme[]>([]);
  const [chargement, setChargement] = useState(true);
  const [edition, setEdition] = useState<Regle | "nouvelle" | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [form] = Form.useForm();
  const frequence = Form.useWatch("frequence", form);
  const segment = Form.useWatch("segment", form);

  const charger = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([getRegles(), getProgrammes()]);
      setRegles(r);
      setProgrammes(p);
    } catch (err) {
      message.error(messageErreur(err, "Impossible de charger la planification."));
    } finally {
      setChargement(false);
    }
  }, [message]);

  useEffect(() => {
    charger();
  }, [charger, rafraichir]);

  const ouvrir = (regle: Regle | "nouvelle") => {
    const valeurs = regle === "nouvelle" ? REGLE_VIDE : regle;
    form.setFieldsValue({
      ...valeurs,
      heure: dayjs(valeurs.heure, "HH:mm"),
      jours_semaine: valeurs.frequence === "hebdomadaire" ? valeurs.jours : [0],
      jours_mois: valeurs.frequence === "mensuelle" ? valeurs.jours : [1],
      dette_minimum: valeurs.filtres?.dette_minimum ?? null,
      anciennete_minimum_jours: valeurs.filtres?.anciennete_minimum_jours ?? null,
    });
    setEdition(regle);
  };

  const enregistrer = async () => {
    const v = await form.validateFields();
    const regle: NouvelleRegle = {
      nom: v.nom,
      segment: v.segment,
      canaux: v.canaux,
      frequence: v.frequence,
      jours: v.frequence === "hebdomadaire" ? v.jours_semaine : v.frequence === "mensuelle" ? v.jours_mois : [],
      heure: v.heure.format("HH:mm"),
      filtres: v.segment === "debiteurs"
        ? { dette_minimum: v.dette_minimum ?? null, anciennete_minimum_jours: v.anciennete_minimum_jours ?? null }
        : {},
      actif: v.actif,
    };
    setEnregistrement(true);
    try {
      if (edition === "nouvelle") await creerRegle(regle);
      else if (edition) await modifierRegle(edition._id, regle);
      message.success("Relance automatique enregistrée.");
      setEdition(null);
      charger();
    } catch (err) {
      message.error(messageErreur(err, "Enregistrement impossible."));
    } finally {
      setEnregistrement(false);
    }
  };

  const action = async (fn: () => Promise<unknown>, succes: string) => {
    try {
      await fn();
      message.success(succes);
      charger();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const executer = async (r: Regle) => {
    try {
      const res = await executerRegle(r._id);
      if (res.campagne_id) {
        message.success("Relance lancée : suivez-la dans l'historique.");
        onCampagne();
      } else message.info(res.info || res.erreur || "Aucun message envoyé.");
      charger();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const libelleFiltres = (f: Regle["filtres"]) =>
    [f?.dette_minimum ? `doit ≥ ${argent(f.dette_minimum, devise)}` : "", f?.anciennete_minimum_jours ? `depuis ≥ ${f.anciennete_minimum_jours} j` : ""]
      .filter(Boolean)
      .join(" · ");

  const colonnesRegles: ColumnsType<Regle> = [
    {
      title: "Relance",
      dataIndex: "nom",
      render: (nom: string, r) => (
        <div>
          <div className="font-semibold text-slate-800">{nom}</div>
          <div className="text-xs text-slate-500">
            {r.segment_libelle} · {r.canaux.map((c) => LIBELLES_CANAUX[c]).join(" + ")}
            {libelleFiltres(r.filtres) && ` · ${libelleFiltres(r.filtres)}`}
          </div>
        </div>
      ),
    },
    { title: "Quand", dataIndex: "description" },
    {
      title: "Prochaine",
      dataIndex: "prochaine_execution",
      render: (d: string | null, r) => (r.actif ? dateHeure(d) : <Pastille ton="gris">En pause</Pastille>),
    },
    {
      title: "Dernier passage",
      key: "dernier",
      responsive: ["lg"],
      render: (_, r) => {
        const res = r.dernier_resultat;
        if (!res) return "—";
        return (
          <Tooltip title={res.erreur || res.info}>
            <span className="text-xs">
              {dateHeure(res.date)}{" "}
              {res.campagne_id ? <Pastille ton="vert">Envoyé</Pastille> : res.erreur ? <Pastille ton="rouge">Erreur</Pastille> : <Pastille ton="gris">Personne à relancer</Pastille>}
            </span>
          </Tooltip>
        );
      },
    },
    ...(estAdmin
      ? [{
          title: "",
          key: "actions",
          render: (_: unknown, r: Regle) => (
            <span className="flex items-center gap-1">
              <Tooltip title={r.actif ? "Mettre en pause" : "Activer"}>
                <Switch size="small" checked={r.actif}
                  onChange={(actif) => action(() => modifierRegle(r._id, { actif }), actif ? "Relance activée." : "Relance mise en pause.")} />
              </Tooltip>
              <Tooltip title="Exécuter maintenant">
                <Popconfirm title="Exécuter cette relance maintenant ?" okText="Exécuter" cancelText="Annuler" onConfirm={() => executer(r)}>
                  <Button type="text" size="small" icon={<Play size={15} />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Modifier"><Button type="text" size="small" icon={<Pencil size={15} />} onClick={() => ouvrir(r)} /></Tooltip>
              <Popconfirm title="Supprimer cette relance ?" okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Annuler"
                onConfirm={() => action(() => supprimerRegle(r._id), "Relance supprimée.")}>
                <Button type="text" size="small" danger icon={<Trash2 size={15} />} />
              </Popconfirm>
            </span>
          ),
        }]
      : []),
  ];

  const colonnesProgrammes: ColumnsType<EnvoiProgramme> = [
    { title: "Date prévue", dataIndex: "date_prevue", render: (d: string) => dateHeure(d) },
    {
      title: "Destinataires",
      key: "dest",
      render: (_, p) => (
        <div>
          <div className="font-semibold text-slate-800">{p.clients ? p.clients.join(", ") : p.segment_libelle}</div>
          <div className="text-xs text-slate-500">
            {LIBELLES_TYPES[p.type_envoi]} · {p.canaux.map((c) => LIBELLES_CANAUX[c]).join(" + ")}
            {p.personnalise && " · texte personnalisé"}
            {!p.clients && " · liste calculée le jour de l'envoi"}
          </div>
        </div>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      render: (s: EnvoiProgramme["statut"], p) => (
        <Tooltip title={p.erreur}>
          <span><Pastille ton={STATUTS_PROGRAMME[s].ton}>{STATUTS_PROGRAMME[s].libelle}</Pastille></span>
        </Tooltip>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_, p) =>
        p.statut === "programme" ? (
          <Popconfirm title="Annuler cet envoi programmé ?" okText="Annuler l'envoi" okButtonProps={{ danger: true }} cancelText="Retour"
            onConfirm={() => action(() => annulerProgramme(p._id), "Envoi annulé.")}>
            <Button size="small" icon={<X size={14} />}>Annuler</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const canauxPossibles = (["sms", "email"] as Canal[]).filter(
    (c) => config.parametres.canaux[c] && config.canaux_plateforme[c].configure,
  );

  return (
    <div className="space-y-4">
      <Section
        titre="Relances automatiques"
        note={estAdmin && <Button type="primary" icon={<Plus size={16} />} onClick={() => ouvrir("nouvelle")}>Nouvelle relance</Button>}
      >
        <p className="mb-3 mt-0 text-xs text-slate-500">
          Les messages partent tout seuls, entre {plage.heure_debut_envoi} h et {plage.heure_fin_envoi} h, avec les montants du jour.
          Un client contacté il y a moins de {config.parametres.options.delai_relance_heures} h n'est pas relancé.
        </p>
        <Table rowKey="_id" loading={chargement} columns={colonnesRegles} dataSource={regles} pagination={false} scroll={{ x: true }}
          locale={{ emptyText: <Empty image={<Repeat size={40} className="mx-auto text-purple-200" />}
            description="Aucune relance automatique. Exemple : chaque lundi à 9 h, rappeler leur dette aux clients qui doivent depuis plus de 7 jours." /> }} />
      </Section>

      <Section titre="Envois programmés" note="Programmez un envoi depuis l'onglet Envoyer ou depuis la fiche d'un client.">
        <Table rowKey="_id" loading={chargement} columns={colonnesProgrammes} dataSource={programmes} scroll={{ x: true }}
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          locale={{ emptyText: <Empty image={<CalendarClock size={40} className="mx-auto text-purple-200" />} description="Aucun envoi programmé." /> }} />
      </Section>

      <Modal
        open={!!edition}
        onCancel={() => setEdition(null)}
        title={edition === "nouvelle" ? "Nouvelle relance automatique" : "Modifier la relance"}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={enregistrement}
        onOk={enregistrer}
        forceRender
      >
        {!canauxPossibles.length && (
          <Alert className="mb-3" type="warning" showIcon message="Aucun canal disponible : activez le SMS ou l'email dans les paramètres." />
        )}
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="nom" label="Nom" rules={[{ required: true, message: "Donnez un nom à la relance." }, { max: 80 }]}>
            <Input placeholder="Ex. Relance hebdomadaire des dettes" />
          </Form.Item>
          <Form.Item name="segment" label="Clients concernés">
            <Select options={ORDRE_SEGMENTS.map((s) => ({
              value: s,
              label: config.segments[s].libelle + (config.parametres.modeles[s].actif ? "" : " (message non activé)"),
              disabled: !config.parametres.modeles[s].actif,
            }))} />
          </Form.Item>
          {segment === "debiteurs" && (
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="dette_minimum" label="Doit au moins">
                <InputNumber className="w-full" min={0} step={1000} addonAfter={devise} placeholder="0" />
              </Form.Item>
              <Form.Item name="anciennete_minimum_jours" label="Depuis au moins">
                <InputNumber className="w-full" min={0} max={3650} addonAfter="jours" placeholder="0" />
              </Form.Item>
            </div>
          )}
          <Form.Item name="canaux" label="Envoyer par" rules={[{ required: true, message: "Choisissez au moins un canal." }]}>
            <Checkbox.Group options={(["sms", "email"] as Canal[]).map((c) => ({
              value: c, label: LIBELLES_CANAUX[c], disabled: !canauxPossibles.includes(c),
            }))} />
          </Form.Item>
          <Form.Item name="frequence" label="Fréquence">
            <Radio.Group optionType="button"
              options={Object.entries(config.frequences).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          {frequence === "hebdomadaire" && (
            <Form.Item name="jours_semaine" label="Jours" rules={[{ required: true, message: "Choisissez au moins un jour." }]}>
              <Checkbox.Group options={config.jours_semaine.map((j, i) => ({ value: i, label: j.charAt(0).toUpperCase() + j.slice(1) }))} />
            </Form.Item>
          )}
          {frequence === "mensuelle" && (
            <Form.Item name="jours_mois" label="Jours du mois" rules={[{ required: true, message: "Choisissez au moins un jour." }]}
              extra="Du 1er au 28 (présents dans tous les mois).">
              <Select mode="multiple" options={Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: i === 0 ? "1er" : String(i + 1) }))} />
            </Form.Item>
          )}
          <Form.Item name="heure" label="Heure" extra={`Entre ${plage.heure_debut_envoi} h et ${plage.heure_fin_envoi} h.`}
            rules={[{ required: true, message: "Choisissez l'heure." }]}>
            <TimePicker format="HH:mm" minuteStep={5}
              disabledTime={() => ({ disabledHours: () => Array.from({ length: 24 }, (_, h) => h).filter((h) => h < plage.heure_debut_envoi || h >= plage.heure_fin_envoi) })} />
          </Form.Item>
          <Form.Item name="actif" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <p className="m-0 rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-900">
            Le texte envoyé est celui du modèle de la catégorie (onglet Paramètres et modèles).
          </p>
        </Form>
      </Modal>
    </div>
  );
};

export default PlanificationMessages;
