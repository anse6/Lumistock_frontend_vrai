// Après une vente du caissier : « Vente enregistrée » avec impression du ticket.
// La page des ventes reçoit ?ticket=<id> à la fin du parcours de vente.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { VenteCaisse } from "./api";
import { api } from "./api";
import { useContexteCaisse } from "./hooks";
import VenteTerminee from "./pos/VenteTerminee";

export default function TicketApresVente() {
  const [params, setParams] = useSearchParams();
  const id = params.get("ticket");
  const { data: ctx } = useContexteCaisse(!!id);
  const [vente, setVente] = useState<VenteCaisse | null>(null);

  useEffect(() => {
    if (!id) return;
    api.vente(id).then(setVente).catch(() => setVente(null));
  }, [id]);

  const fermer = () => {
    setVente(null);
    params.delete("ticket");
    setParams(params, { replace: true });
  };

  if (!ctx || !vente) return null;
  return <VenteTerminee vente={vente} monnaie={0} ctx={ctx} onNouvelle={fermer} />;
}
