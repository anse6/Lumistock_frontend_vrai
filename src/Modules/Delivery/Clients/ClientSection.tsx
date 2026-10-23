import React, { useState, useEffect } from 'react';
import AddClientForm from './AddClientForm';
import { useCreateClient, useGetClients, Client } from './api/clientApi';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useDeliveryStore } from './composantclient/deliveryStore';
import { useTranslation } from 'react-i18next';

interface ClientSelectionProps {
  onClientSelect?: (client: Client | null) => void;
  initialSelectedClient?: Client | null;
}

export const ClientSection: React.FC<ClientSelectionProps> = ({
  onClientSelect,
  initialSelectedClient = null
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialSelectedClient);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialSelectedClient?._id || '');
  const setClientId = useDeliveryStore((state) => state.setClientId);
  const clientIdFromStore = useDeliveryStore((state) => state.clientId);

  // Modification de useGetClients pour forcer le chargement initial
  const { 
    data: clients, 
    isLoading: isLoadingClients, 
    refetch: refetchClients,
    isError: isFetchError
  } = useGetClients();

console.log("client",clients);

  const createClientMutation = useCreateClient();

  // Chargement initial des clients
  useEffect(() => {
    if (!isLoadingClients  && !isFetchError) {
      refetchClients();
    }
  }, [isLoadingClients, isFetchError, refetchClients]);

  // Synchronisation du client sélectionné manuellement ou via store
  useEffect(() => {
    if (clientIdFromStore && clients && (!selectedClient || selectedClient._id !== clientIdFromStore)) {
      const clientInList = clients.find((c: Client) => c._id === clientIdFromStore);
      if (clientInList) {
        setSelectedClient(clientInList);
        setSelectedClientId(clientInList._id ?? '');
        setClientName(clientInList.nom);
      }
    }
  }, [clientIdFromStore, clients, selectedClient]);

  // Synchronisation du client sélectionné localement avec le store
  useEffect(() => {
    if (selectedClient && selectedClient._id !== clientIdFromStore) {
      setClientName(selectedClient.nom);
      setSelectedClientId(selectedClient._id ?? '');
      setClientId(selectedClient._id ?? '');
    } else if (!selectedClient && !clientIdFromStore) {
      setSelectedClientId('');
      setClientId('');
    }
  }, [selectedClient, clientIdFromStore, setClientId]);

  const handleAddClientClick = () => {
    if (!localStorage.getItem('access_token')) {
      navigate('/dashboard/delivery/new-delivery/client-selection');
      return;
    }
    setShowClientForm(true);
  };

  const handleCancelClick = () => {
    setShowClientForm(false);
    resetFormFields();
  };

  const resetFormFields = () => {
    setClientName('');
    setCity('');
    setPhone('');
    setDistrict('');
    setEmail('');
    setProfileImage(null);
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);
    setClientId(clientId);
    
    if (clientId === '') {
      setSelectedClient(null);
      setClientId('');
      if (onClientSelect) onClientSelect(null);
      return;
    }

    const client = clients.find((c: Client) => c._id === clientId);
    if (client) {
      setSelectedClient(client);
      setClientId(client._id);
      if (onClientSelect) onClientSelect(client);
    }
  };

  const handleAddClient = async () => {
    try {
      const formData = new FormData();
      formData.append('nom', clientName);
      formData.append('telephone', phone);
      formData.append('email', email);
      formData.append('ville', city);
      formData.append('quartier', district);
      if (profileImage) {
        formData.append('photo_profil', profileImage);
      }

      const response = await createClientMutation.mutateAsync(formData);
      await refetchClients();

      // Extract the complex nested ID from the API response
      const newClientId = response.client_id?.client_id || response.client_id;
      
      if (newClientId) {
        setSelectedClientId(newClientId);
        setClientId(newClientId);
      }

      setShowClientForm(false);
      resetFormFields();
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error("Erreur lors de l'ajout du client:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        alert(t('delivery.deliveryConfig.clientAddError'));
      }
    }
  };

   return (
    <div className="mb-6">
      {isFetchError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {t('delivery.deliveryConfig.clientFetchError')}
        </div>
      )}

      <div className="flex items-center mb-2">
        <label className="block text-gray-700 font-medium">
          {t('delivery.deliveryConfig.clientLabel')} 
          <span className="text-gray-400 text-xs ml-2 font-normal">({t('delivery.deliveryConfig.optionalLabel', 'Optionnel - Défaut: Autres')})</span>
        </label>
      </div>

      {!showClientForm ? (
        <>
          <p className="text-sm text-gray-500 mb-2">{t('delivery.deliveryConfig.clientSelectExisting')}</p>
          <div className="relative">
            <select
              value={selectedClientId}
              onChange={handleClientSelect}
              className="w-full px-4 py-2 border rounded-md text-gray-700 mb-2 appearance-none"
              disabled={isLoadingClients}
            >
              <option value="">{t('delivery.deliveryConfig.clientSelectPlaceholder')}</option>
              {isLoadingClients ? (
                <option value="" disabled>{t('delivery.deliveryConfig.clientLoading')}</option>
              ) : (
                clients?.map((client: Client) => (
                  <option key={client._id} value={client._id}>
                    {client.nom}
                  </option>
                ))
              )}
            </select>
            {isLoadingClients && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center">
            <span className="text-gray-700 mr-2">{t('delivery.deliveryConfig.clientNotInList')}</span>
            <button
              onClick={handleAddClientClick}
              className="flex items-center border border-[#0F172A] text-[#0F172A] px-3 py-1 rounded hover:bg-indigo-50 transition"
              disabled={isLoadingClients}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {t('delivery.deliveryConfig.clientAddBtn')}
            </button>
          </div>
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
          onCancel={handleCancelClick}
          onAdd={handleAddClient}
          isLoading={createClientMutation.isPending}
          onFileSelected={setProfileImage}
        />
      )}
    </div>
  );
};


