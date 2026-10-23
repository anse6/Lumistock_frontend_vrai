import React from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getUrlServer } from './../../configServer';
import {
  Document,
  Page,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import { Card, Result, Spin, Space, Typography } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import images from "../../assets/no_data.png";

const { Title, Text } = Typography;

const API_URL = getUrlServer();

type Client = {
  id: string;
  name: string;
  initials: string;
  purchaseAmount: string;
  value: number;
  avatarColor: string;
};

// Colors from the admin version mapping
const avatarColors = [
  'bg-slate-100 text-[#0F172A]',
  'bg-green-100 text-green-500',
  'bg-red-50 text-red-400',
  'bg-blue-50 text-blue-400',
  'bg-gray-200 text-gray-700',
];
const avatarColorsHex = [
  '#0F172A',
  '#22c55e',
  '#f87171',
  '#60a5fa',
  '#374151',
];

const pdfStyles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica' },
  title: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
  clientContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 10, borderRadius: 6, backgroundColor: '#f6f6f6' },
  avatar: { width: 40, height: 40, borderRadius: 6, color: '#fff', textAlign: 'center', lineHeight: 40, fontWeight: 'bold', fontSize: 16 },
  clientInfo: { flex: 1, paddingLeft: 10 },
  name: { fontSize: 14, marginBottom: 2 },
  value: { fontSize: 16, fontWeight: 'bold' },
  purchaseAmount: { fontSize: 14, fontWeight: 'bold', color: '#555' },
});

const generateInitials = (name?: string): string => {
  if (!name || typeof name !== 'string') return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.trim().slice(0, 2).toUpperCase();
};

const DownloadIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const TopClients: React.FC = () => {
  const { t } = useTranslation();

  const TopClientsPDF: React.FC<{ clients: Client[] }> = ({ clients }) => (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{t('admin.dashboard.top_clients')}</Text>
        {clients.slice(0, 5).map((client, index) => (
          <View key={client.id} style={pdfStyles.clientContainer}>
            <View style={{ ...pdfStyles.avatar, backgroundColor: avatarColorsHex[index % avatarColorsHex.length] }}>
              <Text>{client.initials}</Text>
            </View>
            <View style={pdfStyles.clientInfo}>
              <Text style={pdfStyles.name}>{client.name}</Text>
              <Text style={pdfStyles.value}>{client.value} {t('admin.dashboard.stats.deliveries')}</Text>
            </View>
            <Text style={pdfStyles.purchaseAmount}>{client.purchaseAmount}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
  const fetchTopClients = async (): Promise<Client[]> => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error(t('admin.dashboard.error'));
    const response = await axios.get(`${API_URL}/clients/best/livreur/`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    return response.data.map((item: any, index: number) => ({
      id: item.client_id,
      name: item.nom ?? t('common.unknown', { defaultValue: 'Inconnu' }),
      initials: generateInitials(item.nom),
      purchaseAmount: `${item.montant_total.toLocaleString().replace(/\s/g, '.')} CFA`,
      value: item.nombre_livraisons,
      avatarColor: avatarColors[index % avatarColors.length],
    }));
  };

  const { data: clients, isLoading, error } = useQuery<Client[]>({
    queryKey: ['topClientsLiv'],
    queryFn: fetchTopClients,
  });

  if (isLoading) {
    return (
      <Card style={{ borderRadius: '12px', height: '100%' }} bodyStyle={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip={t('common.loading')} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ borderRadius: '12px', height: '100%' }}>
        <Result status="error" title={t('common.error')} subTitle={(error as Error).message} />
      </Card>
    );
  }

  const topClients = clients?.slice(0, 5) || [];

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined style={{ color: '#faad14', fontSize: '20px' }} />
          <Title level={5} style={{ margin: 0 }}>{t('admin.dashboard.top_clients')}</Title>
        </Space>
      }
      extra={
        topClients.length > 0 && (
          <PDFDownloadLink
            document={<TopClientsPDF clients={topClients} />}
            fileName="meilleurs-clients.pdf"
          >
            {({ loading }) => (
              <button
                className="text-gray-400 hover:text-[#0F172A] transition-colors"
                title="Exporter"
                disabled={loading}
              >
                {loading ? <Spin size="small" /> : <DownloadIcon className="w-5 h-5" />}
              </button>
            )}
          </PDFDownloadLink>
        )
      }
      style={{ borderRadius: '12px', border: '1px solid #f0f0f0', height: '100%' }}
      bodyStyle={{ padding: '24px' }}
      hoverable
    >
      <div className="space-y-4">
        {topClients.length > 0 ? topClients.map((client) => (
          <div key={client.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${client.avatarColor} mr-4`}>
                <span className="text-base font-semibold">{client.initials}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">{client.name}</p>
                <p className="text-lg font-bold text-gray-800">{client.value}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">{client.purchaseAmount}</p>
            </div>
          </div>
        )) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '200px',
              textAlign: 'center'
            }}
          >
            <img src={images} alt="Logo" className="w-16 h-16" />
            <Text type="secondary">
              {t('admin.dashboard.no_clients_found', { defaultValue: 'Aucun client trouvé.' })}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TopClients;
