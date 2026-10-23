import { useQuery } from '@tanstack/react-query';
import { etatVente } from '../../services/ventes';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';
import { getUrlServer } from '../../configServer';
import { Link } from 'react-router-dom';
import { Table, Tag, Avatar, Space, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import images from "@/assets/no_data.png";

const API_URL = getUrlServer();

type PaymentStatus = 'payé' | 'non payé' | 'partiel';
type DeliveryStatus = 'livré' | 'en cours' | 'annulé';

interface Delivery {
  id: string;
  client: {
    nom: string;
    telephone: string;
    photo_profil?: string;
  };
  produits: Array<{
    quantite: number;
    prix: number;
  }>;
  montant_total: number;
  quantite: number;
  statut_paiement: PaymentStatus;
  statut_livraison: DeliveryStatus;
  date_commande: string;
}

const RecentDeliveries = () => {
  const { t, i18n } = useTranslation();
  const fetchRecentDeliveries = async (): Promise<Delivery[]> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error(t('admin.dashboard.error'));
    }

    try {
      const response = await axios.get(`${API_URL}/livraisons/recente`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw error;
    }
  };

  const { data: deliveries, isLoading, error } = useQuery<Delivery[]>({
    queryKey: ['recentDeliveries'],
    queryFn: fetchRecentDeliveries
  });

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('')
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns: ColumnsType<Delivery> = [
    {
      title: t('admin.dashboard.table.date'),
      dataIndex: 'date_commande',
      key: 'date',
      render: (text) => formatDate(text),
      width: 180,
    },
    {
      title: t('admin.dashboard.table.client'),
      key: 'client',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar
            shape="square"
            style={{ backgroundColor: '#f6ffed', color: '#52c41a', fontWeight: 'bold' }}
          >
            {getInitials(record.client.nom)}
          </Avatar>
          <div>
            <div className="text-sm font-medium">{record.client.nom}</div>
            <div className="text-xs text-gray-400">{record.client.telephone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: t('admin.dashboard.table.quantity'),
      dataIndex: 'quantite',
      key: 'quantite',
      width: 100,
    },
    {
      title: t('admin.dashboard.table.payment'),
      dataIndex: 'statut_paiement',
      key: 'payment',
      width: 120,
      render: (status: PaymentStatus) => {
        let color = 'default';
        if (status === 'payé') color = 'success';
        if (status === 'partiel') color = 'warning';
        if (status === 'non payé') color = 'error';
        return <Tag color={color}>{t(`admin.dashboard.status_labels.${status}`, { defaultValue: status })}</Tag>;
      },
    },
    {
      title: t('admin.dashboard.table.amount'),
      dataIndex: 'montant_total',
      key: 'amount',
      width: 150,
      render: (amount) => `${amount.toLocaleString()} ${t('delivery.productSelection.currency')}`,
    },
    {
      // État de la vente (validée, retour, annulée), indépendant du paiement.
      title: 'État',
      dataIndex: 'etat',
      key: 'status',
      width: 120,
      render: (etat: string) => <Tag color={etatVente(etat).couleur}>{etatVente(etat).libelle}</Tag>,
    }
  ];

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-[10px] min-h-[400px] flex flex-col">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.dashboard.recent_deliveries')}</h2>
        <div className="flex-1 flex items-center justify-center text-gray-500"><Spin /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-[10px] min-h-[400px] flex flex-col">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.dashboard.recent_deliveries')}</h2>
        <div className="flex-1 flex items-center justify-center text-red-500">
          {t('admin.dashboard.error')}: {error instanceof Error ? error.message : t('admin.dashboard.error')}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-[10px] font-['Laura']">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">{t('admin.dashboard.recent_deliveries')}</h2>
        <Link to="/dashboard/delivery" className="text-[#0F172A] font-bold flex items-center text-sm hover:opacity-80 transition-opacity">
          {t('admin.dashboard.access_delivery_page')}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={deliveries}
        rowKey="id"
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="small"
        className="custom-antd-table border border-gray-100 rounded-lg overflow-hidden"
        locale={{
          emptyText: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 0',
                textAlign: 'center'
              }}
            >
              <img src={images} alt="Logo" className="w-16 h-16" />
              <div style={{ color: '#8c8c8c', marginTop: 8 }}>
                {t('admin.dashboard.no_deliveries_recorded')}
              </div>
            </div>
          )
        }}
      />
    </div>
  );
};

export default RecentDeliveries;


