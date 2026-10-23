import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getUrlServer } from '../../../configServer';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { WalletOutlined } from '@ant-design/icons';
import { Result, Card, Typography, Spin, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import images from "@/assets/no_data.png";

const { Text, Title } = Typography;

type PaymentData = {
  mode_paiement: string;
  pourcentage: number;
  nombre: number;
};

type PaymentStats = {
  name: string;
  value: number;
  color: string;
  count: number;
};

const CustomTooltip = ({ active, payload, t }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        border: '1px solid #f0f0f0',
        backdropFilter: 'blur(8px)',
        minWidth: '150px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: data.color }} />
          <Text strong style={{ color: '#1f2937' }}>{data.name}</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {t('admin.dashboard.payment_volume')} <Text strong style={{ color: '#1f2937' }}>{data.count} {t('admin.dashboard.payment_distribution_unit', { defaultValue: 'paiements' })}</Text>
          </Text>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {t('admin.dashboard.payment_proportion')} <Text strong style={{ color: data.color }}>{data.value.toFixed(1)}%</Text>
          </Text>
        </div>
      </div>
    );
  }
  return null;
};

export const PaymentStatsChart: React.FC = () => {
  const { t } = useTranslation();
  const fetchPaymentStats = async (): Promise<PaymentData[]> => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error(t('admin.dashboard.error'));

    try {
      const response = await axios.get(`${getUrlServer()}/livreurs/stats/paiements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          window.location.href = '/login';
        }
        throw new Error(error.response?.data?.message || t('admin.dashboard.error'));
      }
      throw error;
    }
  };

  const { data: paymentData, isLoading, error } = useQuery<PaymentData[]>({
    queryKey: ['paymentStatsLiv'],
    queryFn: fetchPaymentStats,
  });

  const paymentStats: PaymentStats[] = React.useMemo(() => {
    if (!paymentData) return [];

    const findItem = (mode: string) => paymentData.find((item) => item.mode_paiement === mode);

    return [
      {
        name: t('delivery.searchAndFilters.paymentPaid'),
        value: findItem('payé')?.pourcentage || 0,
        count: findItem('payé')?.nombre || 0,
        color: '#52c41a',
      },
      {
        name: t('delivery.searchAndFilters.paymentPartial'),
        value: findItem('partiellement payé')?.pourcentage || 0,
        count: findItem('partiellement payé')?.nombre || 0,
        color: '#faad14',
      },
      {
        name: t('delivery.searchAndFilters.paymentUnpaid'),
        value: findItem('non payé')?.pourcentage || 0,
        count: findItem('non payé')?.nombre || 0,
        color: '#ff4d4f',
      },
    ].filter(stat => stat.value > 0);
  }, [paymentData]);

  const hasData = paymentStats.some((stat) => stat.value > 0);

  if (isLoading) {
    return (
      <Card
        style={{ borderRadius: '12px', border: '1px solid #f0f0f0', height: '100%' }}
        bodyStyle={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Spin size="large" tip={t('admin.dashboard.loading_payments')} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        style={{ borderRadius: '12px', border: '1px solid #f0f0f0', height: '100%' }}
        bodyStyle={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Result status="error" title={t('common.error')} subTitle={(error as Error).message} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <WalletOutlined style={{ color: '#722ed1', fontSize: '20px' }} />
          <Title level={5} style={{ margin: 0 }}>{t('admin.dashboard.payment_distribution')}</Title>
        </Space>
      }
      style={{ borderRadius: '12px', border: '1px solid #f0f0f0', height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      hoverable
    >
      {!hasData ? (
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
            {t('admin.dashboard.no_data')}
          </Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', height: '100%', gap: '24px' }}>
          <div style={{ flex: '1 1 200px', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {paymentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip t={t} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PaymentStatsChart;
