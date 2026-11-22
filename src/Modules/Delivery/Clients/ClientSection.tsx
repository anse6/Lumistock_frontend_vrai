// Étape « Client » d'une vente du gérant : le même choix du client que pour
// l'admin, le manager et le caissier (initiales, création rapide, client de
// passage), branché sur le stockage de vente du gérant.
import React from "react";
import { ChoixClient } from "../../../Components/admin/livaision/selectionproduct/Clients/ClientSection";
import { useDeliveryStore } from "./composantclient/deliveryStore";

export const ClientSection: React.FC = () => {
  const clientId = useDeliveryStore((state) => state.clientId) || "";
  const setClientId = useDeliveryStore((state) => state.setClientId);
  return <ChoixClient clientId={clientId} setClientId={setClientId} />;
};
