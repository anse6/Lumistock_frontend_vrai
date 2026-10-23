import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUrlServer } from './../../../../configServer';

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

interface DeleteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onClientDeleted: () => void;
}

const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onClientDeleted
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDelete = async () => {
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
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('Client supprimé:', result);

      setSuccess(true);
      setTimeout(() => {
        onClientDeleted();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.customers.add.validation.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {success ? (
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('admin.customers.modals.delete.success')}
            </h2>
            <p className="text-gray-700 mb-6">
              {t('admin.customers.modals.delete.successMsg', { name: client.nom })}
            </p>
            <button
              onClick={() => {
                onClientDeleted();
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
                {t('admin.customers.modals.delete.title')}
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

            <div className="mb-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>

              <div className="text-center">
                <p className="text-gray-700 mb-2">
                  {t('admin.customers.modals.delete.confirmTitle')}
                </p>
                <p className="font-semibold text-gray-900 mb-2">
                  {client.nom}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  ID: {client.client_id}
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>{t('admin.customers.modals.delete.warningTitle')}</strong> {t('admin.customers.modals.delete.warningMsg')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('admin.customers.add.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('admin.customers.modals.delete.deleting') : t('admin.customers.table.delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteClientModal;


