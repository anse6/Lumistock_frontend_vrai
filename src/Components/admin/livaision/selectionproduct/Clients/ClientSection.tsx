// Étape « Client » d'une vente (nouvelle vente, modification, caisse) :
// choisir un client enregistré, ou en créer un avec le même formulaire que
// la page Clients › Nouveau client. Sans client, la vente est au nom du
// client de passage « Autres », qui doit payer en totalité.
import React, { useState } from "react";
import { ConfigProvider, Select } from "antd";
import { UserPlus, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetClients, estClientDePassage, type Client } from "./api/clientApi";
import { AvatarInitiales } from "../../../../super-admin/users.tsx/components/AvatarWithPopover";
import { useDeliveryStore } from "../../newdelivery/deliveryStore";
import FormulaireClient, { PURPLE_950, type ClientCree } from "../../Customer/FormulaireClient";
import { estCaissier } from "../../venteRole";

/** Ligne d'un client dans la liste (et dans le champ une fois choisi) :
 * initiales colorées comme dans la liste des clients, nom, téléphone, crédit. */
const OptionClient: React.FC<{ client: Client }> = ({ client }) => {
  const credit = Number(client.montant_en_caisse) || 0;
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <AvatarInitiales name={client.nom} size={26} />
      <span className="truncate font-medium text-slate-800">{client.nom}</span>
      {client.telephone && <span className="hidden truncate text-xs text-slate-500 sm:inline">{client.telephone}</span>}
      {credit > 0 && (
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          <Wallet size={11} /> {credit.toLocaleString("fr-FR")} CFA
        </span>
      )}
    </span>
  );
};

/** Choix du client d'une vente, quel que soit l'écran : le client retenu est
 * lu et écrit par l'appelant (stockage de la vente admin/caisse ou du gérant). */
export const ChoixClient: React.FC<{ clientId: string; setClientId: (id: string) => void }> = ({
  clientId,
  setClientId,
}) => {
  const { t } = useTranslation();
  const [creation, setCreation] = useState(false);

  const { data: clients, isLoading, isError } = useGetClients();

  // Le nouveau client devient le client de la vente (la liste est rechargée
  // par le formulaire lui-même).
  const clientCree = ({ id }: ClientCree) => {
    setClientId(id);
    setCreation(false);
  };

  // « Autres » (le client de passage) n'est pas proposé : ne choisir aucun
  // client revient au même. Une vente déjà à son nom s'affiche sans client.
  const liste = ((clients as Client[] | undefined) || []).filter((c) => !estClientDePassage(c));
  const valeur = liste.some((c) => String(c._id) === String(clientId)) ? clientId : undefined;

  if (creation) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}>
        <div className="rounded-xl border border-purple-100 border-t-[3px] border-t-purple-950 bg-purple-50/40 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-950 text-white">
              <UserPlus size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-purple-950">{t("admin.customers.add.title")}</h3>
              <p className="text-xs text-slate-500">
                Seul le nom est obligatoire. Le client créé est aussitôt choisi pour cette vente.
              </p>
            </div>
          </div>
          {/* Un caissier n'enregistre pas de dette d'avant Lumistock (le serveur la refuse). */}
          <FormulaireClient compact avecDette={!estCaissier()} onCree={clientCree} onAnnuler={() => setCreation(false)} />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <div>
      {isError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t("admin.deliveries.client.fetchError")}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          showSearch
          allowClear
          value={valeur}
          onChange={(val) => setClientId(val || "")}
          className="w-full"
          size="large"
          placeholder="Client de passage (aucun client choisi)"
          disabled={isLoading}
          loading={isLoading}
          optionFilterProp="recherche"
          options={liste.map((c) => ({
            value: c._id,
            recherche: [c.nom, c.telephone, c.email].filter(Boolean).join(" "),
            label: <OptionClient client={c} />,
          }))}
          notFoundContent="Aucun client trouvé"
        />
        <button
          type="button"
          onClick={() => setCreation(true)}
          disabled={isLoading}
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purple-950 transition hover:bg-purple-50 disabled:opacity-50"
        >
          <UserPlus size={16} /> Nouveau client
        </button>
      </div>

      {!valeur && (
        <p className="mt-2 text-xs text-slate-500">
          Sans client choisi, la vente est au nom du client de passage « Autres » : elle doit être payée en totalité.
        </p>
      )}
    </div>
  );
};

/** Étape « Client » des ventes admin, manager et caissier. */
export const ClientSection: React.FC = () => {
  const clientId = useDeliveryStore((state) => state.clientId) || "";
  const setClientId = useDeliveryStore((state) => state.setClientId);
  return <ChoixClient clientId={clientId} setClientId={setClientId} />;
};
