import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUrlServer } from './../../../configServer';

interface Client {
  client_id: string;
  nombre_livraisons: number;
  montant_total: number;
  nom: string;
  telephone: string;
  quartier: string;
  ville: string;
  photo_profil: string;
  created_at: {
    $date: string;
  };
}

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onClientUpdated: () => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onClientUpdated
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    ville: '',
    quartier: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        telephone: client.telephone || '',
        email: '',
        ville: client.ville || '',
        quartier: client.quartier || ''
      });
    }
  }, [client]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error(t('admin.customers.add.validation.authRequired'));
      }

      const response = await fetch(`${getUrlServer()}/clients/${client.client_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('Client mis à jour:', result);

      setSuccess(true);

      setTimeout(() => {
        onClientUpdated();
        onClose();
        setSuccess(false);
      }, 1200);

    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.customers.add.validation.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">

        {success ? (
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('admin.customers.modals.edit.success')}
            </h2>

            <p className="text-gray-700 mb-6">
              {t('admin.customers.modals.edit.successMsg', { name: client.nom })}
            </p>

            <button
              onClick={() => {
                onClientUpdated();
                onClose();
                setSuccess(false);
              }}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              {t('admin.customers.modals.edit.close')}
            </button>
          </div>

        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {t('admin.customers.modals.edit.title')}
              </h2>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* ✅ noValidate supprime "Please fill out this field" */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.add.fullName')}
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.add.phone')}
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.add.email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.add.city')}
                </label>
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.add.district')}
                </label>
                <input
                  type="text"
                  name="quartier"
                  value={formData.quartier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  {t('admin.customers.add.cancel')}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#0F172A] rounded-md hover:bg-[#0F172A] disabled:opacity-50"
                >
                  {loading ? t('admin.customers.modals.edit.submitting') : t('admin.customers.table.edit')}
                </button>
              </div>

            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EditClientModal;