// Dette d'avant Lumistock (cahier de crédit) : saisie une seule fois sur la
// fiche du client, jamais ajoutée au total d'une vente.
import React, { useEffect, useState } from "react";
import { Alert, App, Button, DatePicker, Input, InputNumber, Modal, Spin, Typography } from "antd";
import { NotebookPen } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import {
  CompteClient,
  definirDetteOuverture,
  formatMontant,
  lireCompteClient,
  messageErreur,
} from "../../services/ventes";
import useCompteConnecte from "../../hooks/useCompteConnecte";

const { Text } = Typography;

interface Props {
  open: boolean;
  clientId: string | null;
  clientNom?: string;
  // Sans le droit « Modifier une dette d'avant Lumistock » (Paramètres > Accès),
  // on peut saisir la dette d'un client qui n'en a pas, pas la modifier.
  peutModifier?: boolean;
  onClose: () => void;
  onDone?: (compte: CompteClient) => void;
}

const DetteOuvertureModal: React.FC<Props> = ({ open, clientId, clientNom, peutModifier: forcer, onClose, onDone }) => {
  const { message } = App.useApp();
  const { peut } = useCompteConnecte();
  const peutModifier = forcer ?? peut("clients.dette_ouverture");
  const [compte, setCompte] = useState<CompteClient | null>(null);
  const [chargement, setChargement] = useState(false);
  const [montant, setMontant] = useState<number | null>(null);
  const [dateOrigine, setDateOrigine] = useState<Dayjs | null>(null);
  const [note, setNote] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!open || !clientId) return;
    setChargement(true);
    lireCompteClient(clientId)
      .then((c) => {
        setCompte(c);
        const d = c.dette_ouverture;
        setMontant(d ? d.montant : null);
        setDateOrigine(d?.date_origine ? dayjs(d.date_origine) : null);
        setNote(d?.note || "");
      })
      .catch((e) => message.error(messageErreur(e, "Impossible de lire le compte du client.")))
      .finally(() => setChargement(false));
  }, [open, clientId, message]);

  const existante = compte?.dette_ouverture;
  const verrouillee = !!existante && !peutModifier;
  const dejaPaye = existante?.montant_paye || 0;

  const enregistrer = async () => {
    if (!clientId || montant === null || montant < 0) {
      message.warning("Indiquez le montant que le client devait.");
      return;
    }
    setEnvoi(true);
    try {
      const r = await definirDetteOuverture(clientId, {
        montant,
        date_origine: dateOrigine ? dateOrigine.format("YYYY-MM-DD") : null,
        note,
      });
      message.success(montant > 0 ? "Dette d'avant Lumistock enregistrée." : "Dette d'avant Lumistock supprimée.");
      onDone?.(r.compte);
      onClose();
    } catch (e) {
      message.error(messageErreur(e, "La dette n'a pas pu être enregistrée."));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      width={520}
      title={
        <span className="flex items-center gap-2 text-lg">
          <NotebookPen size={22} className="text-orange-600" />
          Dette d'avant Lumistock{clientNom ? ` — ${clientNom}` : ""}
        </span>
      }
      footer={[
        <Button key="annuler" onClick={onClose} disabled={envoi}>Annuler</Button>,
        <Button key="ok" type="primary" onClick={enregistrer} loading={envoi} disabled={verrouillee || chargement}>
          Enregistrer
        </Button>,
      ]}
    >
      {chargement ? (
        <div className="py-10 flex justify-center"><Spin /></div>
      ) : (
        <div className="space-y-4 py-2">
          <Alert
            type="info"
            showIcon
            message="Ce que le client devait avant l'installation du logiciel (cahier de crédit)."
            description="Saisissez-la une seule fois ici. Elle ne s'ajoute pas à une vente : ses versements
              s'encaissent avec « Encaisser un règlement », qui la solde en premier."
          />
          {verrouillee && (
            <Alert type="warning" showIcon
                   message="Ce client a déjà une dette d'ouverture : vous n'avez pas le droit de la modifier." />
          )}
          {existante && (
            <Text type="secondary" className="block">
              Déjà réglé : <b>{formatMontant(dejaPaye)}</b> · reste dû : <b>{formatMontant(existante.reste)}</b>
            </Text>
          )}
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-1">Montant dû</div>
            <InputNumber
              size="large"
              className="w-full"
              style={{ width: "100%" }}
              min={0}
              value={montant}
              disabled={verrouillee}
              onChange={(v) => setMontant(v)}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
              parser={(v) => Number((v || "").replace(/\s|CFA/g, ""))}
              addonAfter="CFA"
              autoFocus
            />
            {existante && !verrouillee && (
              <Text type="secondary" className="text-xs">
                Mettez 0 pour supprimer la dette (seulement si rien n'a encore été réglé).
              </Text>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-1">Date de la dette (facultatif)</div>
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              value={dateOrigine}
              disabled={verrouillee}
              onChange={(d) => setDateOrigine(d)}
              disabledDate={(d) => d.isAfter(dayjs(), "day")}
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-1">Note (facultatif)</div>
            <Input.TextArea
              rows={2}
              maxLength={300}
              value={note}
              disabled={verrouillee}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex. : cahier de crédit, page 12"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DetteOuvertureModal;
