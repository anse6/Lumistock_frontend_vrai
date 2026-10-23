import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart4, Truck, Users, Package } from 'lucide-react';
import StatCard from './StatsCard';
import { getUrlServer } from '../../../configServer';
import { useTranslation } from 'react-i18next';

const API_URL = getUrlServer();

type ApiResponse = {
  valeur?: number;
  quantite_totale?: number;
  variation_percent?: number;
  periode?: {
    debut: string;
    fin: string;
  };
};

const DashboardStats: React.FC = () => {
  const { t } = useTranslation();
  const fetchStatsData = async (endpoint: string): Promise<ApiResponse> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error(t('admin.dashboard.error'));
    }

    try {
      const response = await axios.get(`${API_URL}/managers/stats/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw error;
    }
  };

  const { data: caData } = useQuery({
    queryKey: ['chiffreAffaires'],
    queryFn: () => fetchStatsData('chiffre-affaires'),
  });

  const { data: livraisonsData } = useQuery({
    queryKey: ['livraisons'],
    queryFn: () => fetchStatsData('livraisons'),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['client'],
    queryFn: () => fetchStatsData('clients'),
  });

  const { data: produitsData } = useQuery({
    queryKey: ['produits'],
    queryFn: () => fetchStatsData('produits'),
  });

  const stats = [
    {
      title: t('admin.dashboard.revenue'),
      value: caData?.valeur !== undefined ? `${caData.valeur.toFixed(1)} CFA` : t('admin.dashboard.loading'),
      change: caData?.variation_percent ?? 0,
      icon: (
        <div className="bg-green-100 p-1 xs:p-2 rounded-md">
          <BarChart4 size={14} className="xs:w-5 xs:h-5 text-green-500" />
        </div>
      ),
      barColor: 'bg-green-500',
      period: t('admin.dashboard.stats.total'),
    },
    {
      title: t('admin.dashboard.deliveries'),
      value: livraisonsData?.valeur !== undefined ? livraisonsData.valeur.toString() : t('admin.dashboard.loading'),
      change: livraisonsData?.variation_percent ?? 0,
      icon: (
        <div className="bg-slate-100 p-1 xs:p-2 rounded-md">
          <Truck size={14} className="xs:w-5 xs:h-5 text-[#0F172A]" />
        </div>
      ),
      barColor: 'bg-[#0F172A]',
      period: t('admin.dashboard.stats.total'),
    },
    {
      title: t('admin.dashboard.clients'),
      value: clientsData?.valeur !== undefined ? clientsData.valeur.toString() : t('admin.dashboard.loading'),
      change: clientsData?.variation_percent ?? 0,
      icon: (
        <div className="bg-blue-100 p-1 xs:p-2 rounded-md">
          <Users size={14} className="xs:w-5 xs:h-5 text-blue-400" />
        </div>
      ),
      barColor: 'bg-blue-400',
      period: t('admin.dashboard.stats.total'),
    },
    {
      title: t('admin.dashboard.products'),
      value: produitsData?.quantite_totale !== undefined ? produitsData.quantite_totale.toString() : 'N/A',
      change: produitsData?.variation_percent ?? 0,
      icon: (
        <div className="bg-indigo-100 p-1 xs:p-2 rounded-md">
          <Package size={14} className="xs:w-5 xs:h-5 text-indigo-500" />
        </div>
      ),
      barColor: 'bg-indigo-500',
      period: t('admin.dashboard.stats.total'),
    },
  ];

  return (
    <div className="px-1 py-1 xs:py-2 sm:py-4 -translate-y-4">
      {/* Grille pour grands écrans (lg: 4 colonnes) */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Grille pour écrans moyens (sm: 2 colonnes) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:hidden gap-3 xs:gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Grille pour mobile (2x2 ultra-compact) */}
      <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:hidden">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;


