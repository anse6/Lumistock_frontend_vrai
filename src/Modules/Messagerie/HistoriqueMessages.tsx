// Onglet « Historique » : envois passés, progression des envois en cours et
// statut de chaque message (envoyé, simulé, en échec et pourquoi).
import React, { useCallback, useEffect, useState } from "react";
import { App, Button, DatePicker, Drawer, Empty, Modal, Progress, Radio, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { Repeat, RotateCcw } from "lucide-react";
import { dateHeure, Pastille } from "../Reports/ReportUi";
import {
  dateLocaleIso,
  getCampagne,
  getCampagnes,
  LIBELLES_CANAUX,
  messageErreur,
  renvoyerCampagne,
  reprendreCampagne,
  type Campagne,
  type MessageEnvoye,
} from "./messagerieService";

const STATUTS_CAMPAGNE = {
  en_cours: { ton: "orange", libelle: "En cours" },
  terminee: { ton: "vert", libelle: "Terminé" },
  interrompue: { ton: "rouge", libelle: "Interrompu" },
} as const;

const STATUTS_MESSAGE = {
  en_attente: { ton: "gris", libelle: "En attente" },
  envoye: { ton: "vert", libelle: "Envoyé" },
  simule: { ton: "orange", libelle: "Simulé" },
  echec: { ton: "rouge", libelle: "Échec" },
} as const;

interface Props {
  rafraichir: number;
  plage: { heure_debut_envoi: number; heure_fin_envoi: number };
  onProgramme: () => void;
}

const HistoriqueMessages: React.FC<Props> = ({ rafraichir, plage, onProgramme }) => {
  const { message } = App.useApp();
  const [renvoi, setRenvoi] = useState<Campagne | null>(null);
  const [quandRenvoi, setQuandRenvoi] = useState<"maintenant" | "programmer">("maintenant");
  const [dateRenvoi, setDateRenvoi] = useState<Dayjs | null>(null);
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [detail, setDetail] = useState<(Campagne & { messages: MessageEnvoye[] }) | null>(null);

  const charger = useCallback(async () => {
    try {
      setCampagnes(await getCampagnes());
    } catch (err) {
      message.error(messageErreur(err, "Impossible de charger l'historique."));
    } finally {
      setChargement(false);
    }
  }, [message]);

  useEffect(() => {
    charger();
  }, [charger, rafraichir]);

  // Actualisation automatique tant qu'un envoi est en cours.
  const enCours = campagnes.some((c) => c.statut === "en_cours") || detail?.statut === "en_cours";
  useEffect(() => {
    if (!enCours) return;
    const id = setInterval(async () => {
      charger();
      if (detail) setDetail(await getCampagne(detail._id));
    }, 4000);
    return () => clearInterval(id);
  }, [enCours, charger, detail]);

  const ouvrir = async (c: Campagne) => {
    try {
      setDetail(await getCampagne(c._id));
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const reprendre = async (c: Campagne) => {
    try {
      await reprendreCampagne(c._id);
      message.success("Envoi relancé.");
      charger();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const dateRenvoiInvalide =
    quandRenvoi === "programmer" &&
    (!dateRenvoi || dateRenvoi.isBefore(dayjs().add(1, "minute")) ||
      dateRenvoi.hour() < plage.heure_debut_envoi || dateRenvoi.hour() >= plage.heure_fin_envoi);

  const confirmerRenvoi = async () => {
    if (!renvoi) return;
    setRenvoiEnCours(true);
    try {
      const programme = quandRenvoi === "programmer" && dateRenvoi;
      await renvoyerCampagne(renvoi._id, programme ? dateLocaleIso(dateRenvoi) : null);
      message.success(programme ? `Renvoi programmé pour le ${dateRenvoi.format("DD/MM/YYYY à HH:mm")}.` : "Renvoi lancé.");
      setRenvoi(null);
      if (programme) onProgramme();
      else charger();
    } catch (err) {
      message.error(messageErreur(err, "Le renvoi n'a pas pu être lancé."));
    } finally {
      setRenvoiEnCours(false);
    }
  };

  const colonnes: ColumnsType<Campagne> = [
    { title: "Date", dataIndex: "created_at", render: (d: string) => dateHeure(d) },
    {
      title: "Envoi",
      key: "envoi",
      render: (_, c) => (
        <div>
          <div className="font-semibold text-slate-800">{c.segment_libelle}</div>
          <div className="text-xs text-slate-500">{c.type_libelle}</div>
        </div>
      ),
    },
    { title: "Canal", dataIndex: "canaux", render: (c: Campagne["canaux"]) => c.map((x) => LIBELLES_CANAUX[x]).join(" + ") },
    {
      title: "Progression",
      key: "progression",
      render: (_, c) => (
        <div className="min-w-[160px]">
          <Progress
            size="small"
            percent={c.total ? Math.round(((c.envoyes + c.echecs) / c.total) * 100) : 100}
            success={{ percent: c.total ? Math.round((c.envoyes / c.total) * 100) : 0 }}
            showInfo={false}
          />
          <div className="text-xs text-slate-500">
            {c.envoyes} envoyé{c.envoyes > 1 ? "s" : ""}
            {c.echecs ? ` · ${c.echecs} échec${c.echecs > 1 ? "s" : ""}` : ""}
            {c.ignores ? ` · ${c.ignores} non joignable${c.ignores > 1 ? "s" : ""}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      render: (s: Campagne["statut"], c) => (
        <span className="flex items-center gap-2">
          <Pastille ton={STATUTS_CAMPAGNE[s].ton}>{STATUTS_CAMPAGNE[s].libelle}</Pastille>
          {s === "interrompue" && (
            <Tooltip title="Reprendre l'envoi des messages restants">
              <Button size="small" icon={<RotateCcw size={14} />} onClick={(e) => { e.stopPropagation(); reprendre(c); }} />
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: "Par",
      dataIndex: "auteur",
      responsive: ["lg"],
      render: (auteur: string, c) => auteur || (c.type_envoi === "automatique" ? "Automatique" : "—"),
    },
    {
      title: "",
      key: "renvoyer",
      render: (_, c) =>
        c.statut !== "en_cours" ? (
          <Tooltip title="Renvoyer aux mêmes clients, avec les montants du jour">
            <Button size="small" icon={<Repeat size={14} />}
              onClick={(e) => { e.stopPropagation(); setQuandRenvoi("maintenant"); setDateRenvoi(null); setRenvoi(c); }}>
              Renvoyer
            </Button>
          </Tooltip>
        ) : null,
    },
  ];

  const colonnesMessages: ColumnsType<MessageEnvoye> = [
    {
      title: "Client",
      dataIndex: "client_nom",
      render: (nom: string, m) => (
        <div>
          <div className="font-semibold">{nom}</div>
          <div className="text-xs text-slate-500">{LIBELLES_CANAUX[m.canal]} · {m.destinataire}</div>
        </div>
      ),
    },
    {
      title: "Message",
      dataIndex: "contenu",
      render: (texte: string, m) => (
        <div className="max-w-md whitespace-pre-line text-xs text-slate-600">
          {m.sujet && <div className="font-semibold text-slate-700">{m.sujet}</div>}
          {texte}
        </div>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      render: (s: MessageEnvoye["statut"], m) => (
        <Tooltip title={m.erreur || (m.envoye_at ? dateHeure(m.envoye_at) : undefined)}>
          <span><Pastille ton={STATUTS_MESSAGE[s].ton}>{STATUTS_MESSAGE[s].libelle}</Pastille></span>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Table
        rowKey="_id"
        loading={chargement}
        columns={colonnes}
        dataSource={campagnes}
        scroll={{ x: true }}
        pagination={{ pageSize: 15, hideOnSinglePage: true }}
        onRow={(c) => ({ onClick: () => ouvrir(c), className: "cursor-pointer" })}
        locale={{ emptyText: <Empty description="Aucun message envoyé pour le moment." /> }}
      />
      <Modal
        open={!!renvoi}
        onCancel={() => setRenvoi(null)}
        title="Renvoyer ce message"
        okText={quandRenvoi === "programmer" ? "Programmer" : "Renvoyer maintenant"}
        cancelText="Annuler"
        okButtonProps={{ disabled: dateRenvoiInvalide }}
        confirmLoading={renvoiEnCours}
        onOk={confirmerRenvoi}
      >
        {renvoi && (
          <div className="space-y-3">
            <p className="m-0 text-sm text-slate-600">
              Le message « {renvoi.segment_libelle} » sera renvoyé aux clients de cet envoi, avec les montants du jour :
              un client qui a réglé sa dette entre-temps ne sera plus relancé.
            </p>
            <Radio.Group value={quandRenvoi} onChange={(e) => setQuandRenvoi(e.target.value)}>
              <Radio value="maintenant">Maintenant</Radio>
              <Radio value="programmer">À une date</Radio>
            </Radio.Group>
            {quandRenvoi === "programmer" && (
              <div>
                <DatePicker showTime={{ format: "HH:mm", minuteStep: 5 }} format="DD/MM/YYYY HH:mm" value={dateRenvoi}
                  onChange={setDateRenvoi} disabledDate={(d) => d.isBefore(dayjs(), "day") || d.isAfter(dayjs().add(1, "year"))}
                  placeholder="Date et heure" />
                <p className="mb-0 mt-1 text-xs text-slate-500">Entre {plage.heure_debut_envoi} h et {plage.heure_fin_envoi} h.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        width={Math.min(760, window.innerWidth)}
        title={detail ? `${detail.segment_libelle} — ${dateHeure(detail.created_at)}` : ""}
      >
        {detail && (
          <Table
            rowKey={(m) => `${m.client_id}-${m.canal}`}
            size="small"
            columns={colonnesMessages}
            dataSource={detail.messages}
            pagination={{ pageSize: 25, hideOnSinglePage: true }}
          />
        )}
      </Drawer>
    </>
  );
};

export default HistoriqueMessages;
