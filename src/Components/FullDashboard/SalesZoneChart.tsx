import { useState, useEffect } from 'react';
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
import images from "@/assets/no_data.png";

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

const SalesZoneChart = () => {
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
      if (!accessToken) throw new Error('Token non trouvé');

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
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (period: string, periodType: string) => {
    if (periodType === 'month') {
      const [, month] = period.split('-');
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      return monthNames[parseInt(month) - 1];
    }
    if (periodType === 'week') {
      return `S${period.split('-W')[1]}`;
    }
    if (periodType === 'day') {
      const date = new Date(period);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
    return period;
  };

  const chartData = data?.statistics.map(stat => ({
    period: formatPeriod(stat.period, data.period_type),
    'Montant Total': stat.montant_total,
    'Montant Payé': stat.montant_paye,
    'Dette': stat.dette,
    nombre_livraisons: stat.nombre_livraisons,
  })) || [];

  if (error) {
    return (
      <Card title="Évolution des Dettes" style={{ borderRadius: '12px' }} className="shadow-sm border-gray-100 h-full">
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          action={<button onClick={fetchData} className="text-blue-500 underline ml-4">Réessayer</button>}
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BankOutlined style={{ color: '#0F172A', fontSize: '20px' }} />
          <Text strong style={{ fontSize: '16px', color: '#0F172A', margin: 0 }}>Évolution des Dettes Clients</Text>
        </div>
      }
      className="shadow-sm border-gray-100 h-full w-full"
      style={{ borderRadius: '12px' }}
      extra={
        <Radio.Group
          value={activePeriod}
          onChange={(e) => setActivePeriod(e.target.value)}
          buttonStyle="solid"
          size="middle"
          disabled={loading}
        >
          <Radio.Button value="day">Jour</Radio.Button>
          <Radio.Button value="week">Semaine</Radio.Button>
          <Radio.Button value="month">Mois</Radio.Button>
          <Radio.Button value="year">Année</Radio.Button>
        </Radio.Group>
      }
    >
      <Spin spinning={loading} tip="Chargement des données...">
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card type="inner" bodyStyle={{ padding: '16px' }} className="bg-red-50/50 border-red-100" style={{ height: '100%' }}>
              <Statistic
                title="Total Dette Restante"
                value={data?.total_dette || 0}
                precision={0}
                valueStyle={{ color: '#cf1322', fontWeight: 600, fontSize: '20px' }}
                prefix={<ArrowUpOutlined />}
                suffix="FCFA"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card type="inner" bodyStyle={{ padding: '16px' }} className="bg-green-50/50 border-green-100" style={{ height: '100%' }}>
              <Statistic
                title="Total Montant Payé"
                value={data?.total_paye || 0}
                precision={0}
                valueStyle={{ color: '#3f8600', fontWeight: 600, fontSize: '20px' }}
                prefix={<DollarOutlined />}
                suffix="FCFA"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card type="inner" bodyStyle={{ padding: '16px' }} className="bg-blue-50/50 border-blue-100" style={{ height: '100%' }}>
              <Statistic
                title="Montant Total des Livraisons"
                value={data?.total_montant || 0}
                precision={0}
                valueStyle={{ color: '#0958d9', fontWeight: 600, fontSize: '20px' }}
                prefix={<CreditCardOutlined />}
                suffix="FCFA"
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
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Total
                            </span>
                            <span className="font-semibold text-gray-800">{params['Montant Total'].toLocaleString('fr-FR')} FCFA</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Payé
                            </span>
                            <span className="font-semibold text-gray-800">{params['Montant Payé'].toLocaleString('fr-FR')} FCFA</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div> Dette
                            </span>
                            <span className="font-semibold text-gray-800">{params['Dette'].toLocaleString('fr-FR')} FCFA</span>
                          </div>
                          <Divider style={{ margin: '8px 0' }} />
                          <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>Livraisons</span>
                            <span>{params.nombre_livraisons}</span>
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
              <Bar dataKey="Montant Total" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Montant Payé" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Dette" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {data?.statistics.length === 0 && (
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
              Aucun paiement enregistré
            </Text>
          </div>
        )}

      </Spin>
    </Card>
  );
};

export default SalesZoneChart;
