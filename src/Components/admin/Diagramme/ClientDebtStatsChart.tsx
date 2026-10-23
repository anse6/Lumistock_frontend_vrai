import { useState, useEffect, useMemo } from 'react';
import { Card, Spin, Alert, Row, Col, Statistic, Radio, Typography, Divider } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import axios from 'axios';
import { getUrlServer } from '../../../configServer';
import { ArrowUpOutlined, DollarOutlined, BankOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface PeriodStat {
  period: string;
  montant_total: number;
  montant_paye: number;
  dette: number;
  nombre_livraisons: number;
}

interface DebtStatsData {
  period_type: string;
  magasin_id: string;
  client_id: string | null;
  date_debut: string | null;
  date_fin: string | null;
  statistics: PeriodStat[];
  total_dette: number;
  total_montant: number;
  total_paye: number;
}

type PeriodType = 'day' | 'week' | 'month' | 'year';

const ClientDebtStatsChart = () => {
  const { t, i18n } = useTranslation();
  const [activePeriod, setActivePeriod] = useState<PeriodType>('month');
  const [data, setData] = useState<DebtStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activePeriod]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new Error(t('admin.dashboard.error'));

      const response = await axios.get(
        `${getUrlServer()}/clients/debt/statistics/`,
        {
          params: { period: activePeriod },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setData(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err.response?.data?.message || t('admin.dashboard.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (period: string, periodType: string) => {
    if (periodType === 'month') {
      const [, month] = period.split('-');
      const monthNames = t('common.months', { returnObjects: true }) as string[];
      return monthNames[parseInt(month) - 1];
    }
    if (periodType === 'week') {
      return `S${period.split('-W')[1]}`;
    }
    if (periodType === 'day') {
      const date = new Date(period);
      return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' });
    }
    return period;
  };

  const chartData = useMemo(() => data?.statistics.map(stat => ({
    period: formatPeriod(stat.period, data.period_type),
    total: stat.montant_total,
    paid: stat.montant_paye,
    debt: stat.dette,
    count: stat.nombre_livraisons,
  })) || [], [data, i18n.language, t]);

  if (error) {
    return (
      <Card title={t('admin.dashboard.debt_evolution')} className="shadow-sm border-gray-100">
        <Alert
          message={t('admin.dashboard.error')}
          description={error}
          type="error"
          showIcon
          action={<button onClick={fetchData} className="text-blue-500 underline ml-4">{t('admin.dashboard.retry')}</button>}
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BankOutlined style={{ color: '#0F172A' }} />
          <Text strong style={{ fontSize: '16px', color: '#0F172A' }}>{t('admin.dashboard.debt_evolution')}</Text>
        </div>
      }
      className="shadow-sm border-gray-100 h-full w-full"
      extra={
        <Radio.Group 
          value={activePeriod} 
          onChange={(e) => setActivePeriod(e.target.value)}
          buttonStyle="solid"
          size="middle"
          disabled={loading}
        >
          <Radio.Button value="day">{t('admin.dashboard.periods.day')}</Radio.Button>
          <Radio.Button value="week">{t('admin.dashboard.periods.week')}</Radio.Button>
          <Radio.Button value="month">{t('admin.dashboard.periods.month')}</Radio.Button>
          <Radio.Button value="year">{t('admin.dashboard.periods.year')}</Radio.Button>
        </Radio.Group>
      }
    >
      <Spin spinning={loading} tip={t('admin.dashboard.loading_stats')}>
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card type="inner" bodyStyle={{ padding: '16px' }} className="bg-red-50/50 border-red-100">
              <Statistic
                title={t('admin.dashboard.total_debt')}
                value={data?.total_dette || 0}
                precision={0}
                valueStyle={{ color: '#cf1322', fontWeight: 600 }}
                prefix={<ArrowUpOutlined />}
                suffix="CFA"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card type="inner" bodyStyle={{ padding: '16px' }} className="bg-green-50/50 border-green-100">
               <Statistic
                title={t('admin.dashboard.total_paid')}
                value={data?.total_paye || 0}
                precision={0}
                valueStyle={{ color: '#3f8600', fontWeight: 600 }}
                prefix={<DollarOutlined />}
                suffix="CFA"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card type="inner" bodyStyle={{ padding: '16px' }} className="bg-blue-50/50 border-blue-100">
               <Statistic
                title={t('admin.dashboard.total_delivery_amount')}
                value={data?.total_montant || 0}
                precision={0}
                valueStyle={{ color: '#0958d9', fontWeight: 600 }}
                prefix={<CreditCardOutlined />}
                suffix="CFA"
              />
            </Card>
          </Col>
        </Row>

        <div style={{ height: '320px', width: '100%', marginTop: '24px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barSize={24}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="period" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }} 
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                dx={-10} 
              />
              <Tooltip
                cursor={{ fill: '#F3F4F6' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const params = payload[0].payload;
                    return (
                      <div className="bg-white p-4 shadow-xl rounded-lg border border-gray-100" style={{ minWidth: '200px' }}>
                        <Text strong style={{ display: 'block', marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                          {params.period}
                        </Text>
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div> {t('admin.dashboard.stats.total')}
                            </span>
                            <span className="font-semibold text-gray-800">{params.total.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} CFA</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {t('admin.dashboard.stats.paid')}
                            </span>
                            <span className="font-semibold text-gray-800">{params.paid.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} CFA</span>
                          </div>
                           <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div> {t('admin.dashboard.stats.debt')}
                            </span>
                            <span className="font-semibold text-gray-800">{params.debt.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} CFA</span>
                          </div>
                          <Divider style={{ margin: '8px 0' }} />
                          <div className="flex justify-between items-center text-xs text-gray-400">
                             <span>{t('admin.dashboard.stats.deliveries')}</span>
                             <span>{params.count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar dataKey="total" name={t('admin.dashboard.stats.total')} fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="paid" name={t('admin.dashboard.stats.paid')} fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="debt" name={t('admin.dashboard.stats.debt')} fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Spin>
    </Card>
  );
};

export default ClientDebtStatsChart;
