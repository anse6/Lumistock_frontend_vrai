// Ce que le client doit déjà (dette d'avant Lumistock + ventes impayées),
// avec les actions pour encaisser un règlement ou saisir sa dette d'ouverture.
// Remplace l'ancienne case « dette ancienne » ajoutée au total d'une vente.
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "antd";
import { HandCoins, NotebookPen, Wallet } from "lucide-react";
import { CompteClient, formatMontant, lireCompteClient } from "../../services/ventes";
import ReglementClientModal from "./ReglementClientModal";
import DetteOuvertureModal from "./DetteOuvertureModal";
import useCompteConnecte from "../../hooks/useCompteConnecte";

interface Props {
  clientId: string | null | undefined;
  clientNom?: string;
  // Par défaut : le droit « Modifier une dette d'avant Lumistock ».
  peutModifierDette?: boolean;
  // Masque le bandeau quand le client ne doit rien (écran de vente).
  compact?: boolean;
  onChange?: (compte: CompteClient) => void;
}

const SituationClient: React.FC<Props> = ({ clientId, clientNom, peutModifierDette: forcer, compact, onChange }) => {
  const { peut } = useCompteConnecte();
  const peutModifierDette = forcer ?? peut("clients.dette_ouverture");
  const [compte, setCompte] = useState<CompteClient | null>(null);
  const [reglement, setReglement] = useState(false);
  const [dette, setDette] = useState(false);

  const charger = useCallback(() => {
    if (!clientId) {
      setCompte(null);
      return;
    }
    lireCompteClient(clientId).then(setCompte).catch(() => setCompte(null));
  }, [clientId]);

  useEffect(charger, [charger]);

  const misAJour = (c: CompteClient) => {
    setCompte(c);
    onChange?.(c);
  };

  if (!clientId || !compte) return null;
  const ouverture = compte.dette_ouverture?.reste || 0;
  if (compact && compte.total_du <= 0 && compte.avance <= 0) return null;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-3 sm:p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-700">
          {compte.total_du > 0 ? (
            <>
              <span className="font-semibold">{clientNom || compte.nom}</span> doit déjà{" "}
              <span className="font-bold text-red-600">{formatMontant(compte.total_du)}</span>
              {ouverture > 0 && (
                <span className="text-slate-500">
                  {" "}(dont {formatMontant(ouverture)} d'avant Lumistock
                  {compte.total_ventes_impayees > 0 && ` et ${formatMontant(compte.total_ventes_impayees)} de ventes impayées`})
                </span>
              )}
            </>
          ) : (
            <><span className="font-semibold">{clientNom || compte.nom}</span> ne doit rien.</>
          )}
          {compte.avance > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-700">
              <Wallet size={14} /> avance de {formatMontant(compte.avance)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {compte.total_du > 0 && (
            <Button size="small" type="primary" icon={<HandCoins size={14} />} onClick={() => setReglement(true)}>
              Encaisser un règlement
            </Button>
          )}
          {(peutModifierDette || !compte.dette_ouverture) && (
            <Button size="small" icon={<NotebookPen size={14} />} onClick={() => setDette(true)}>
              {compte.dette_ouverture ? "Dette d'avant Lumistock" : "Saisir une dette d'avant Lumistock"}
            </Button>
          )}
        </div>
      </div>
      <ReglementClientModal open={reglement} clientId={clientId} clientNom={clientNom || compte.nom}
                            onClose={() => setReglement(false)} onDone={misAJour} />
      <DetteOuvertureModal open={dette} clientId={clientId} clientNom={clientNom || compte.nom}
                           peutModifier={peutModifierDette} onClose={() => setDette(false)} onDone={misAJour} />
    </div>
  );
};

export default SituationClient;
