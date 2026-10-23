import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getUrlServer } from '../../../configServer';
import { Card, Segmented, Space, Button, Statistic, Typography, Spin, Select } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined,
  RollbackOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

interface DataPoint {
  periode: string;
  total_retours: number;
  start?: string;
  fin?: string;
  incomplet?: boolean;
  plage_dates?: string;
}

interface RetoursData {
  valeur: number;
  variation: number;
  granularite: string;
  page: number;
  detail: DataPoint[];
}

interface Livreur {
  id: string;
  name: string;
  first_name: string;
}

interface ApiResponse {
  retours: RetoursData;
  livreurs: Livreur[];
}

type Granularity = 'jour' | 'semaine' | 'mois' | 'annee';

interface RevenueChartretoursProps {
  hideLivreurSelect?: boolean;
}

const RevenueChartretours: React.FC<RevenueChartretoursProps> = ({ hideLivreurSelect = false }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Granularity>('jour');
  const [selectedLivreurId, setSelectedLivreurId] = useState<string>('all');
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [data, setData] = useState<RetoursData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const paginationLimits: Record<Granularity, { min: number; max: number }> = {
    jour: { min: -50, max: 50 },
    semaine: { min: -50, max: 50 },
    mois: { min: -24, max: 24 },
    annee: { min: -10, max: 10 },
  };

  const fetchChartData = React.useCallback(
    async (granularite: Granularity = activeTab, page: number = 0, livreurId: string = selectedLivreurId) => {
      try {
        setChartLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const token = localStorage.getItem('access_token');
        if (!token) throw new Error(t('admin.dashboard.error'));

        const url = new URL(`${getUrlServer()}/retours/stats/par-periode`);
        url.searchParams.append('granularite', granularite);
        url.searchParams.append('page', page.toString());
        if (livreurId !== 'all') {
          url.searchParams.append('livreur_id', livreurId);
        }

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404 || response.status === 400) {
            throw new Error(t('admin.dashboard.no_data'));
          }
          throw new Error(`${t('admin.dashboard.error')}: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        if (result.livreurs) {
          setLivreurs(result.livreurs);
        }

        if (!result.retours.detail || result.retours.detail.length === 0) {
          throw new Error(t('admin.dashboard.no_data'));
        }

        setData(result.retours);
      } catch (err) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'name' in err &&
          (err as { name: string }).name !== 'AbortError'
        ) {
          console.error('Erreur lors du chargement des données:', err);
          setError(err instanceof Error ? err.message : t('admin.dashboard.error'));
        }
      } finally {
        setChartLoading(false);
        setInitialLoading(false);
      }
    },
    [activeTab, t, selectedLivreurId]
  );

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  useEffect(() => {
    if (!initialLoading) {
      setCurrentPage(0);
      fetchChartData(activeTab, 0, selectedLivreurId);
    }
  }, [activeTab, selectedLivreurId, fetchChartData, initialLoading]);

  const handleTabChange = (tab: string | number) => {
    setActiveTab(tab as Granularity);
  };

  const handlePrevious = async () => {
    if (isNavigating || chartLoading) return;
    const newPage = currentPage - 1;
    const { min } = paginationLimits[activeTab];
    if (newPage >= min) {
      setIsNavigating(true);
      setCurrentPage(newPage);
      try {
        await fetchChartData(activeTab, newPage);
      } catch (_error) {
        setCurrentPage(currentPage);
      } finally {
        setIsNavigating(false);
      }
    }
  };

  const handleNext = async () => {
    if (isNavigating || chartLoading) return;
    const newPage = currentPage + 1;
    const { max } = paginationLimits[activeTab];
    if (newPage <= max) {
      setIsNavigating(true);
      setCurrentPage(newPage);
      try {
        await fetchChartData(activeTab, newPage);
      } catch (_error) {
        setCurrentPage(currentPage);
      } finally {
        setIsNavigating(false);
      }
    }
  };

  const formatPeriode = (item: DataPoint, granularite: Granularity) => {
    if (granularite === 'semaine' && item.periode.includes('-W')) {
      return `S${item.periode.split('-W')[1]}`;
    }
    if (granularite === 'mois' && item.periode.match(/^\d{4}-\d{2}$/)) {
      const [, month] = item.periode.split('-');
      const monthNames = t('common.months', { returnObjects: true }) as string[];
      return monthNames[parseInt(month) - 1];
    }
    if (granularite === 'jour') {
      const dateObj = new Date(item.periode);
      return dateObj.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
        day: '2-digit',
        month: 'short',
      }).replace('.', '');
    }
    return item.periode;
  };

  const formatTooltipDate = (item: DataPoint, granularite: Granularity) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    if (granularite === 'semaine') {
      if (item.start && item.fin) {
        const debut = new Date(item.start);
        const fin = new Date(item.fin);
        return i18n.language === 'fr' 
          ? `Semaine du ${debut.toLocaleDateString(locale)} au ${fin.toLocaleDateString(locale)}`
          : `Week from ${debut.toLocaleDateString(locale)} to ${fin.toLocaleDateString(locale)}`;
      }
      return item.periode;
    }

    const date = new Date(item.periode);
    if (isNaN(date.getTime())) return item.periode;

    switch (granularite) {
      case 'jour':
        return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'mois':
        return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
      case 'annee':
        return i18n.language === 'fr' ? `Année ${date.getFullYear()}` : `Year ${date.getFullYear()}`;
      default:
        return item.periode;
    }
  };

  const chartData = React.useMemo(
    () =>
      data?.detail.map((item) => ({
        periode: formatPeriode(item, activeTab),
        total_retours: item.total_retours,
        periode_originale: item.periode,
        start: item.start,
        fin: item.fin,
        granularite: activeTab,
      })) || [],
    [data, activeTab, i18n.language]
  );

  const getPeriodTitle = React.useMemo(() => {
    if (!data || !data.detail || data.detail.length === 0) return t('admin.dashboard.loading');

    const firstItem = data.detail[0];
    const lastItem = data.detail[data.detail.length - 1];
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

    switch (activeTab) {
      case 'jour':
        if (firstItem.start && lastItem.fin) {
          return `${new Date(firstItem.start).toLocaleDateString(locale, { day: '2-digit', month: 'short' })} - ${new Date(lastItem.fin).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}`;
        }
        return `${firstItem.periode} - ${lastItem.periode}`;
      case 'semaine':
        if (firstItem.start) return new Date(firstItem.start).toLocaleDateString(locale, { month: 'short', year: 'numeric' });
        return firstItem.periode;
      case 'mois':
        if (firstItem.periode) return firstItem.periode.split('-')[0];
        return firstItem.periode;
      case 'annee':
        return `${firstItem.periode} - ${lastItem.periode}`;
      default:
        return '';
    }
  }, [data, activeTab, i18n.language, t]);

  const { min: minPage, max: maxPage } = paginationLimits[activeTab];
  const canGoPrevious = currentPage > minPage && !isNavigating && !chartLoading;
  const canGoNext = currentPage < maxPage && !isNavigating && !chartLoading;

  return (
    <Card 
      title={
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <RollbackOutlined style={{ color: '#fa8c16', fontSize: '20px' }} />
            <Title level={5} style={{ margin: 0 }}>{t('admin.dashboard.returns_title')}</Title>
          </Space>
        </Space>
      }
      style={{ borderRadius: '12px', border: '1px solid #f0f0f0', overflow: 'hidden' }}
      bodyStyle={{ padding: '24px' }}
      hoverable
    >
      {initialLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px' }}>
          <Spin size="large" tip={t('admin.dashboard.loading_returns')} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px' }}>
            <Statistic
              title={t('admin.dashboard.total_period')}
              value={data?.valeur || 0}
              precision={0}
              suffix="CFA"
              valueStyle={{ color: '#1f2937', fontWeight: 700, fontSize: '28px' }}
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
            <Space wrap>
              <Segmented 
                options={[
                  { label: t('admin.dashboard.periods.day'), value: 'jour' },
                  { label: t('admin.dashboard.periods.week'), value: 'semaine' },
                  { label: t('admin.dashboard.periods.month'), value: 'mois' },
                  { label: t('admin.dashboard.periods.year'), value: 'annee' },
                ]}
                value={activeTab}
                onChange={handleTabChange}
                disabled={chartLoading || isNavigating}
              />
              {!hideLivreurSelect && (
                <Select
                  value={selectedLivreurId}
                  onChange={(val) => setSelectedLivreurId(val)}
                  disabled={chartLoading || isNavigating}
                  style={{ width: 180 }}
                  options={[
                    { label: t('admin.dashboard.all_stores', 'Tous les magasins'), value: 'all' },
                    ...livreurs.map((l) => ({ label: `${l.first_name} ${l.name}`, value: l.id }))
                  ]}
                />
              )}
            </Space>

            <Space>
              <Button 
                icon={<LeftOutlined />} 
                onClick={handlePrevious} 
                disabled={!canGoPrevious} 
                type="text" 
              />
              <Text strong style={{ minWidth: '100px', textAlign: 'center' }}>
                {getPeriodTitle}
              </Text>
              <Button 
                icon={<RightOutlined />} 
                onClick={handleNext} 
                disabled={!canGoNext} 
                type="text"
              />
            </Space>
          </div>

          {error && data && (
            <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: '#fff2e8', border: '1px solid #ffd8bf', borderRadius: '6px' }}>
              <Text type="warning" style={{ fontSize: '13px', color: '#d4380d' }}>{error}</Text>
            </div>
          )}

          <div style={{ height: '300px', width: '100%', position: 'relative' }}>
            {chartLoading && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin />
              </div>
            )}
            
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={window.innerWidth < 640 ? 12 : 32}
              >
                <defs>
                   <linearGradient id="colorRetours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fa8c16" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fa8c16" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="periode"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#8c8c8c' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: '#8c8c8c' }}
                />
                <Tooltip
                  cursor={{ fill: '#f5f5f5' }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      const dataPoint: DataPoint = {
                        periode: data.periode_originale,
                        total_retours: data.total_retours,
                        start: data.start,
                        fin: data.fin
                      };

                      return (
                        <div style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          padding: '12px', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: '1px solid #f0f0f0',
                          backdropFilter: 'blur(4px)'
                        }}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                            {formatTooltipDate(dataPoint, data.granularite)}
                          </Text>
                          <Text strong style={{ color: '#d4380d', fontSize: '16px' }}>
                            {new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : 'en-US').format(data.total_retours)} CFA
                          </Text>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="total_retours" 
                  fill="url(#colorRetours)" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                >
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
};

export default RevenueChartretours;
