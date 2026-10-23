import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Trash2 } from 'lucide-react';
import { Spin, Table, Button, Empty, message, Drawer, Modal } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { getUrlServer } from '../../../configServer';

interface CorbeilleModalProps {
  onClose: () => void;
  onRestoreSuccess: () => void;
}

const CorbeilleModal: React.FC<CorbeilleModalProps> = ({ onClose, onRestoreSuccess }) => {
  const { t } = useTranslation();
  const [deletedLivraisons, setDeletedLivraisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const fetchCorbeille = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      // "Pour que le livreur voit ses propres suppressions en attente"
      const res = await axios.get(`${getUrlServer()}/livraisons/corbeille/livreur`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setDeletedLivraisons(res.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de la corbeille:', error);
      message.error(t('delivery.corbeilleModal.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorbeille();
  }, []);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${getUrlServer()}/livraisons/corbeille/${id}/restaurer`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      message.success(t('delivery.corbeilleModal.restoreSuccess'));
      setDeletedLivraisons(prev => prev.filter(item => item.id !== id && item._id !== id));
      onRestoreSuccess();
    } catch (error: any) {
      console.error('Erreur lors de la restauration:', error);
      message.error(error.response?.data?.error || t('delivery.corbeilleModal.restoreError'));
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteDefinitive = (id: string) => {
    if (!id) return;
    setIdToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDeleteDefinitive = async () => {
    if (!idToDelete) return;
    const id = idToDelete;
    
    setDeletingId(id);
    setDeleteModalVisible(false);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const url = `${getUrlServer()}/livraisons/corbeille/${id}/definitive`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        message.success(t('admin.deliveries.modals.corbeille.successDeleteDefinitive', { defaultValue: 'Livraison supprimée définitivement.' }));
        setDeletedLivraisons(prev => prev.filter(item => item.id !== id && item._id !== id));
      } else {
        message.error(result.error || t('admin.deliveries.modals.corbeille.failDeleteDefinitive', { defaultValue: 'Erreur lors de la suppression définitive.' }));
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression définitive:', error);
      message.error(t('admin.deliveries.modals.corbeille.failDeleteDefinitive', { defaultValue: 'Erreur lors de la suppression définitive.' }));
    } finally {
      setDeletingId(null);
      setIdToDelete(null);
    }
  };

  const columns = [
    {
      title: t('delivery.corbeilleModal.colIdDate'),
      dataIndex: 'livraison_id',
      key: 'livraison_id',
      render: (_text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#0F172A]">{_text || record.id || record._id}</span>
          <span className="text-xs text-gray-500">
            {record.date_commande ? dayjs(record.date_commande).format('DD MMM YYYY, HH:mm') : 'N/A'}
          </span>
        </div>
      )
    },
    {
      title: t('delivery.corbeilleModal.colClient'),
      dataIndex: ['client', 'nom'],
      key: 'client',
      render: (_text: string, record: any) => (
        <span>{record.client?.nom} {record.client?.prenom}</span>
      )
    },
    {
      title: t('delivery.corbeilleModal.colAmount'),
      dataIndex: 'montant_total',
      key: 'montant_total',
      render: (_text: number) => <span className="font-semibold text-emerald-600">{_text?.toLocaleString('fr-FR')} CFA</span>
    },
    {
      title: t('delivery.corbeilleModal.colAction'),
      key: 'action',
      render: (_: any, record: any) => {
        const id = record.id || record._id;
        const isRestoring = restoringId === id;
        const isDeleting = deletingId === id;
        return (
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={isRestoring ? <RefreshCw className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              size="small"
              className="bg-[#0F172A] flex items-center hover:bg-[#1E293B]"
              onClick={() => handleRestore(id)}
              disabled={isRestoring || isDeleting}
            >
              {t('delivery.corbeilleModal.restoreBtn')}
            </Button>
            <Button
              danger
              type="primary"
              icon={isDeleting ? <Spin size="small" className="text-white" /> : <Trash2 className="h-4 w-4" />}
              size="small"
              className="flex items-center"
              onClick={() => handleDeleteDefinitive(id)}
              disabled={isRestoring || isDeleting}
            >
              {t('admin.deliveries.modals.corbeille.deleteDefinitive', { defaultValue: 'Supprimer définitivement' })}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('delivery.corbeilleModal.title')}</h2>
            <p className="text-sm text-gray-500 font-normal">
              {t('delivery.corbeilleModal.subtitle')}
            </p>
          </div>
        </div>
      }
      placement="right"
      width={720}
      onClose={onClose}
      open={true}
      closeIcon={<X className="h-5 w-5" />}
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose} size="large" className="rounded-lg">
            {t('delivery.corbeilleModal.closeBtn')}
          </Button>
        </div>
      }
    >
      <div className="flex-1 p-6 overflow-y-auto w-full h-full">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : deletedLivraisons.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span className="text-gray-500 text-lg">{t('delivery.corbeilleModal.empty')}</span>}
            />
          </div>
        ) : (
          <Table
            dataSource={deletedLivraisons}
            columns={columns}
            rowKey={record => record.id || record._id}
            pagination={{ pageSize: 8 }}
            className="font-sans shadow-sm rounded-lg overflow-hidden border border-gray-100"
          />
        )}
      </div>

      <Modal
        title={t('admin.deliveries.modals.corbeille.confirmDeleteTitle', { defaultValue: 'Confirmer la suppression' })}
        open={deleteModalVisible}
        onOk={confirmDeleteDefinitive}
        onCancel={() => setDeleteModalVisible(false)}
        okText={t('admin.deliveries.modals.corbeille.deleteDefinitive', { defaultValue: 'Supprimer définitivement' })}
        cancelText={t('admin.deliveries.modals.corbeille.close', { defaultValue: 'Fermer' })}
        okButtonProps={{ danger: true }}
        centered
      >
        <p>{t('admin.deliveries.modals.corbeille.confirmDeleteMessage', { defaultValue: 'Êtes-vous sûr de vouloir supprimer définitivement cette livraison ? Cette action est irréversible.' })}</p>
      </Modal>
    </Drawer>
  );
};

export default CorbeilleModal;
