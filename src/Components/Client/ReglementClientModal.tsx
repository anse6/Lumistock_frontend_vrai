// Encaisser un règlement client : l'argent est réparti automatiquement sur la
// dette d'avant Lumistock puis sur les ventes impayées, de la plus ancienne à
// la plus récente ; le surplus va sur le compte du client.
import React, { useEffect, useMemo, useState } from "react";
import { App, Button, InputNumber, Modal, Segmented, Spin, Table, Tag, Typography } from "antd";
import { CheckCircle, HandCoins } from "lucide-react";
import {
  Affectation,
  CompteClient,
  MODES_REGLEMENT,
  formatMontant,
  lireCompteClient,
  messageErreur,
  reglerClient,
  repartirReglement,
} from "../../services/ventes";

const { Text } = Typography;

interface Props {
  open: boolean;
  clientId: string | null;
  clientNom?: string;
  onClose: () => void;
  onDone?: (compte: CompteClient) => void;
}

const LIBELLES_TYPE: Record<Affectation["type"], { texte: string; couleur: string }> = {
  dette_ouverture: { texte: "Dette d'avant Lumistock", couleur: "volcano" },
  vente: { texte: "Vente", couleur: "blue" },
  avance: { texte: "Avance", couleur: "green" },
};

const ReglementClientModal: React.FC<Props> = ({ open, clientId, clientNom, onClose, onDone }) => {
  const { message } = App.useApp();
  const [compte, setCompte] = useState<CompteClient | null>(null);
  const [chargement, setChargement] = useState(false);
  const [montant, setMontant] = useState<number | null>(null);
  const [methode, setMethode] = useState("cash");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{ message: string; affectations: Affectation[] } | null>(null);

  useEffect(() => {
    if (!open || !clientId) return;
    setResultat(null);
    setMethode("cash");
    setChargement(true);
    lireCompteClient(clientId)
      .then((c) => {
        setCompte(c);
        setMontant(c.total_du > 0 ? c.total_du : null);
      })
      .catch((e) => message.error(messageErreur(e, "Impossible de lire le compte du client.")))
      .finally(() => setChargement(false));
  }, [open, clientId, message]);

  const apercu = useMemo(
    () => (compte && montant ? repartirReglement(compte, montant) : []),
    [compte, montant],
  );

  const encaisser = async () => {
    if (!clientId || !montant || montant <= 0) {
      message.warning("Indiquez le montant reçu.");
      return;
    }
    setEnvoi(true);
    try {
      const r = await reglerClient(clientId, montant, methode);
      setResultat({ message: r.message, affectations: r.affectations });
      setCompte(r.compte);
      onDone?.(r.compte);
    } catch (e) {
      message.error(messageErreur(e, "Le règlement n'a pas pu être enregistré."));
    } finally {
      setEnvoi(false);
    }
  };

  const colonnes = [
    {
      title: "Imputé sur",
      key: "libelle",
      render: (_: unknown, a: Affectation) => (
        <span className="flex items-center gap-2">
          <Tag color={LIBELLES_TYPE[a.type].couleur} className="!m-0">{LIBELLES_TYPE[a.type].texte}</Tag>
          {a.type === "vente" && <span className="text-slate-600">{a.libelle}</span>}
        </span>
      ),
    },
    { title: "Montant", dataIndex: "montant", key: "montant", align: "right" as const,
      render: (v: number) => <b>{formatMontant(v)}</b> },
    { title: "Reste après", dataIndex: "reste", key: "reste", align: "right" as const,
      render: (v: number | undefined) => (v === undefined ? "—" : formatMontant(v)) },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      width={620}
      closable={!envoi}
      title={
        <span className="flex items-center gap-2 text-lg">
          <HandCoins size={22} className="text-emerald-600" />
          Encaisser un règlement{clientNom ? ` — ${clientNom}` : ""}
        </span>
      }
      footer={
        resultat
          ? [<Button key="ok" type="primary" onClick={onClose}>Fermer</Button>]
          : [
              <Button key="annuler" onClick={onClose} disabled={envoi}>Annuler</Button>,
              <Button key="ok" type="primary" onClick={encaisser} loading={envoi}
                      disabled={!montant || montant <= 0}>
                Encaisser {montant ? formatMontant(montant) : ""}
              </Button>,
            ]
      }
    >
      {chargement || !compte ? (
        <div className="py-10 flex justify-center"><Spin /></div>
      ) : resultat ? (
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <CheckCircle className="text-emerald-600 shrink-0" />
            <Text className="text-emerald-800">{resultat.message}</Text>
          </div>
          <Table size="small" pagination={false} rowKey={(a, i) => `${a.type}-${i}`}
                 dataSource={resultat.affectations} columns={colonnes} />
          <Text type="secondary">Il reste à payer : <b>{formatMontant(compte.total_du)}</b></Text>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="text-xs text-slate-500">Dette d'avant Lumistock</div>
              <div className="font-bold text-orange-700">{formatMontant(compte.dette_ouverture?.reste)}</div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
              <div className="text-xs text-slate-500">Ventes impayées ({compte.ventes_impayees.length})</div>
              <div className="font-bold text-red-700">{formatMontant(compte.total_ventes_impayees)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
              <div className="text-xs text-slate-500">Total dû</div>
              <div className="font-bold text-slate-900">{formatMontant(compte.total_du)}</div>
            </div>
          </div>
          {compte.avance > 0 && (
            <Text type="secondary" className="block text-sm">
              Le client a déjà {formatMontant(compte.avance)} d'avance sur son compte.
            </Text>
          )}

          <div>
            <div className="text-sm font-semibold text-slate-700 mb-1">Montant reçu</div>
            <InputNumber
              size="large"
              className="w-full"
              style={{ width: "100%" }}
              min={1}
              value={montant}
              onChange={(v) => setMontant(v)}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
              parser={(v) => Number((v || "").replace(/\s|CFA/g, ""))}
              addonAfter="CFA"
              autoFocus
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-1">Argent reçu par</div>
            <Segmented block value={methode} onChange={(v) => setMethode(String(v))} options={MODES_REGLEMENT} />
          </div>

          {apercu.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-1">
                Répartition (la dette la plus ancienne d'abord)
              </div>
              <Table size="small" pagination={false} rowKey={(a, i) => `${a.type}-${i}`}
                     dataSource={apercu} columns={colonnes} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ReglementClientModal;
