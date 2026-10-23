import React, { useState, useEffect } from "react";
import { Select } from "antd";
import { UserPlus, Phone, MapPin, Wallet, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import AddClientForm from "./AddClientForm";
import { useCreateClient, useGetClients, Client } from "./api/clientApi";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useDeliveryStore } from "../../newdelivery/deliveryStore";

interface ClientSelectionProps {
  onClientSelect?: (client: Client | null) => void;
  initialSelectedClient?: Client | null;
}

export const ClientSection: React.FC<ClientSelectionProps> = ({
  onClientSelect,
  initialSelectedClient = null,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [montantCaisse, setMontantCaisse] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const setClientId = useDeliveryStore((state) => state.setClientId);
  const clientIdFromStore = useDeliveryStore((state) => state.clientId);

  // Modification de useGetClients pour utiliser uniquement react-query
  const {
    data: clients,
    isLoading: isLoadingClients,
    refetch: refetchClients,
    isError: isFetchError,
  } = useGetClients();

  const createClientMutation = useCreateClient();

  // Élimination des boucles: on déduit l'état au lieu de le synchroniser!
  const selectedClientId = clientIdFromStore || "";
  // selectedClient déduit du store si besoin par les enfants via onClientSelect

  // Initialisation du client (1 seule fois si store vide)
  useEffect(() => {
    if (initialSelectedClient?._id && !clientIdFromStore) {
      setClientId(initialSelectedClient._id);
    }
  }, [initialSelectedClient, clientIdFromStore, setClientId]);

  const handleAddClientClick = () => {
    if (!localStorage.getItem("access_token")) {
      navigate("/login");
      return;
    }
    setShowClientForm(true);
  };

  const handleCancelClick = () => {
    setShowClientForm(false);
    setAddError(null);
    resetFormFields();
  };

  const resetFormFields = () => {
    setClientName("");
    setCity("");
    setPhone("");
    setDistrict("");
    setEmail("");
    setMontantCaisse("");
    setProfileImage(null);
  };

  const handleClientSelect = (clientId: string) => {
    setClientId(clientId);

    if (onClientSelect) {
      if (!clientId) {
        onClientSelect(null);
      } else {
        const client = clients?.find(
          (c: Client) => String(c._id) === String(clientId),
        );
        if (client) onClientSelect(client);
      }
    }
  };

  const handleAddClient = async () => {
    setAddError(null);
    if (!clientName.trim()) {
      setAddError("Le nom du client est obligatoire.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAddError("L'adresse email n'est pas valide.");
      return;
    }
    if (montantCaisse && Number(montantCaisse) < 0) {
      setAddError("Le montant initial ne peut pas être négatif.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("nom", clientName.trim());
      formData.append("telephone", phone);
      formData.append("email", email.trim());
      formData.append("ville", city);
      formData.append("quartier", district);
      if (montantCaisse) formData.append("montant_en_caisse", montantCaisse);
      if (profileImage) {
        formData.append("photo_profil", profileImage);
      }

      const response = await createClientMutation.mutateAsync(formData);
      await refetchClients();

      // Extract the complex nested ID from the API response
      const newClientId = response.client_id?.client_id || response.client_id;

      if (newClientId) {
        setClientId(newClientId);
      }

      setShowClientForm(false);
      resetFormFields();
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string; error?: string; errors?: Record<string, string[]> }>;
      console.error("Erreur lors de l'ajout du client:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      } else {
        // Message précis du serveur (doublon, champ invalide…) si disponible.
        const data = error.response?.data;
        const detail = data?.errors ? Object.values(data.errors).flat().join(" ") : data?.error || data?.message;
        setAddError(detail || t("admin.deliveries.client.addError"));
      }
    }
  };

  const selectedClient = clients?.find((c: Client) => String(c._id) === String(selectedClientId)) as
    | (Client & { montant_en_caisse?: number })
    | undefined;
  const initiales = (selectedClient?.nom || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      {isFetchError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t("admin.deliveries.client.fetchError")}
        </div>
      )}
      {addError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{addError}</div>
      )}

      {!showClientForm ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              showSearch
              allowClear
              value={selectedClientId || undefined}
              onChange={(val) => handleClientSelect(val || "")}
              className="w-full"
              size="large"
              placeholder="Client de passage (aucun client choisi)"
              disabled={isLoadingClients}
              loading={isLoadingClients}
              optionFilterProp="label"
              options={(clients || []).map((client: Client) => ({
                value: client._id,
                label: [client.nom, client.telephone].filter(Boolean).join(" — "),
              }))}
              notFoundContent="Aucun client trouvé"
            />
            <button
              type="button"
              onClick={() => { setAddError(null); handleAddClientClick(); }}
              disabled={isLoadingClients}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purple-950 transition hover:bg-purple-50 disabled:opacity-50"
            >
              <UserPlus size={16} /> Nouveau client
            </button>
          </div>

          {selectedClient ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-950 text-sm font-bold text-white">
                {initiales || <User size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-slate-800">{selectedClient.nom}</div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  {selectedClient.telephone && (
                    <span className="flex items-center gap-1"><Phone size={12} /> {selectedClient.telephone}</span>
                  )}
                  {(selectedClient.quartier || selectedClient.ville) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {[selectedClient.quartier, selectedClient.ville].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              {Number(selectedClient.montant_en_caisse) > 0 && (
                <div className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-right ring-1 ring-emerald-100">
                  <div className="flex items-center justify-end gap-1 text-[10px] font-semibold uppercase text-emerald-700">
                    <Wallet size={11} /> Crédit client
                  </div>
                  <div className="text-sm font-bold text-emerald-700">
                    {Number(selectedClient.montant_en_caisse).toLocaleString("fr-FR")} CFA
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Sans client choisi, la vente est enregistrée au nom du client de passage « Autres ».
            </p>
          )}
        </>
      ) : (
        <AddClientForm
          clientName={clientName}
          setClientName={setClientName}
          city={city}
          setCity={setCity}
          phone={phone}
          setPhone={setPhone}
          district={district}
          setDistrict={setDistrict}
          email={email}
          setEmail={setEmail}
          montantCaisse={montantCaisse}
          setMontantCaisse={setMontantCaisse}
          onCancel={handleCancelClick}
          onAdd={handleAddClient}
          isLoading={createClientMutation.isPending}
          onFileSelected={setProfileImage}
        />
      )}
    </div>
  );
};
