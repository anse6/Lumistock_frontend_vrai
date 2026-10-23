// Abandon du reste impayé d'une vente (remplace l'ancienne case « a couché »).
// Avec le droit « Abandonner le reste impayé » (Paramètres > Accès), on
// abandonne directement et on valide / refuse les demandes ; sans ce droit,
// un gérant envoie une demande motivée, et un manager ne fait que consulter.
// Une fois validé, le reste devient une ristourne : le total de la vente baisse
// jusqu'au montant payé et la vente est soldée.
import React, { useState } from "react";
import { Alert, App, Button, Input, Modal, Space } from "antd";
import { Ban } from "lucide-react";
import {
  AbandonReste as Abandon,
  abandonnerReste,
  demanderAbandon,
  formatMontant,
  messageErreur,
  refuserAbandon,
  validerAbandon,
} from "../../services/ventes";
import useCompteConnecte from "../../hooks/useCompteConnecte";

interface Props {
  livraisonId: string;
  reste: number;
  abandon?: Abandon | null;
  enAttente?: boolean;
  // « responsable » = admin ou manager ; « gerant » = vendeur depuis son stock.
  profil: "responsable" | "gerant";
  annulee?: boolean;
  onDone?: () => void;
}

const dateCourte = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "");

const AbandonReste: React.FC<Props> = ({ livraisonId, reste, abandon, enAttente, profil, annulee, onDone }) => {
  const { message, modal } = App.useApp();
  const { peut } = useCompteConnecte();
  const autorise = peut("ventes.abandon_reste");
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const executer = async (action: () => Promise<{ message?: string }>) => {
    setEnvoi(true);
    try {
      const r = await action();
      message.success(r?.message || "Enregistré.");
      setOuvert(false);
      setMotif("");
      onDone?.();
    } catch (e) {
      message.error(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  if (annulee) return null;

  if (abandon?.statut === "valide") {
    return (
      <Alert
        type="info"
        showIcon
        message={`Reste de ${formatMontant(abandon.montant)} abandonné`}
        description={[
          abandon.motif,
          abandon.valide_par_nom && `Validé par ${abandon.valide_par_nom} le ${dateCourte(abandon.valide_le)}`,
        ].filter(Boolean).join(" · ")}
      />
    );
  }

  if (enAttente) {
    const montant = abandon?.montant ?? reste;
    return (
      <Alert
        type="warning"
        showIcon
        message={`Demande d'abandon du reste : ${formatMontant(montant)}`}
        description={
          <div className="space-y-2">
            <div>
              {[abandon?.demande_par_nom && `Demandé par ${abandon.demande_par_nom}`,
                abandon?.demande_le && `le ${dateCourte(abandon.demande_le)}`].filter(Boolean).join(" ")}
              {abandon?.motif && <> : « {abandon.motif} »</>}
            </div>
            {autorise ? (
              <Space wrap>
                <Button type="primary" size="small" loading={envoi}
                        onClick={() => modal.confirm({
                          title: "Valider l'abandon du reste ?",
                          content: `Le client ne devra plus ${formatMontant(montant)} sur cette vente. `
                            + "Le montant devient une ristourne : le total de la vente baisse d'autant.",
                          okText: "Valider",
                          cancelText: "Annuler",
                          onOk: () => executer(() => validerAbandon(livraisonId)),
                        })}>
                  Valider
                </Button>
                <Button danger size="small" loading={envoi}
                        onClick={() => executer(() => refuserAbandon(livraisonId))}>
                  Refuser
                </Button>
              </Space>
            ) : (
              <div className="text-xs text-slate-500">En attente de la décision d'un responsable.</div>
            )}
          </div>
        }
      />
    );
  }

  if (reste <= 0) return null;
  // Un manager sans le droit n'a rien à faire ici.
  if (profil === "responsable" && !autorise) return null;

  // Sans le droit, le gérant demande ; avec, il abandonne directement (même route).
  const gerant = profil === "gerant" && !autorise;
  return (
    <>
      {abandon?.statut === "refuse" && (
        <div className="mb-2 text-xs text-slate-500">
          Demande d'abandon refusée{abandon.refuse_par_nom ? ` par ${abandon.refuse_par_nom}` : ""}
          {abandon.refuse_le ? ` le ${dateCourte(abandon.refuse_le)}` : ""}.
        </div>
      )}
      <Button icon={<Ban size={14} />} onClick={() => setOuvert(true)}>
        {gerant ? "Demander l'abandon du reste" : "Abandonner le reste"}
      </Button>
      <Modal
        open={ouvert}
        onCancel={() => setOuvert(false)}
        centered
        title={gerant ? "Demander l'abandon du reste" : "Abandonner le reste"}
        okText={gerant ? "Envoyer la demande" : "Abandonner"}
        cancelText="Annuler"
        confirmLoading={envoi}
        okButtonProps={{ danger: !gerant, disabled: gerant && !motif.trim() }}
        onOk={() => executer(() => (profil === "gerant" ? demanderAbandon(livraisonId, motif) : abandonnerReste(livraisonId, motif)))}
      >
        <div className="space-y-3">
          <p>
            Le client ne paiera pas les <b>{formatMontant(reste)}</b> restants. Ce montant devient une ristourne :
            le total de la vente baisse d'autant et la vente est soldée.
          </p>
          {gerant && <p className="text-slate-500 text-sm">Un manager doit valider la demande.</p>}
          <Input.TextArea
            rows={3}
            maxLength={200}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={gerant ? "Motif (obligatoire) : client en difficulté, geste commercial…" : "Motif (facultatif)"}
          />
        </div>
      </Modal>
    </>
  );
};

export default AbandonReste;
