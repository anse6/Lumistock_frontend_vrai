import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';
import { Empty, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AvatarWithPopover from '../users.tsx/components/AvatarWithPopover';
import StatusToggle from '../users.tsx/components/StatusToggle';
import { getUrlServer } from '../../../configServer';

const { Text } = Typography;
const API_URL = getUrlServer();

interface UtilisateurRecent {
  user_id: string;
  email: string;
  role: string;
  date_connexion?: string | { $date?: string };
  ip: string;
  nom_complet: string;
  is_active?: boolean;
  magasin?: {
    id: string;
    denomination: string;
  };
}

interface ApiResponse {
  utilisateurs_recents_connectes: UtilisateurRecent[];
  total: number;
}

const roleDisplay = (role: string) => {
  const roles: Record<string, { label: string; className: string }> = {
    admin: { label: 'Administrateur', className: '!border-purple-200 !bg-purple-50 !text-purple-900' },
    manager: { label: 'Manager', className: '!border-blue-200 !bg-blue-50 !text-blue-800' },
    gerant: { label: 'Gérant', className: '!border-amber-200 !bg-amber-50 !text-amber-800' },
    livreur: { label: 'Gérant', className: '!border-amber-200 !bg-amber-50 !text-amber-800' },
    staff: { label: 'Staff', className: '!border-slate-200 !bg-slate-50 !text-slate-700' },
  };
  return roles[role?.toLowerCase()] || { label: role || 'Utilisateur', className: '!border-slate-200 !bg-slate-50 !text-slate-700' };
};

const getDateValue = (date?: string | { $date?: string }) => typeof date === 'string' ? date : date?.$date;

const formatDate = (date?: string | { $date?: string }) => {
  const rawDate = getDateValue(date);
  if (!rawDate) return '—';
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Recentusers: React.FC = () => {
  const fetchRecentUsers = async (): Promise<ApiResponse> => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Token non trouvé - veuillez vous reconnecter');

    const response = await axios.get<ApiResponse>(`${API_URL}/staff/stats/utilisateurs-recents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  };

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['utilisateurs-recents', 5],
    queryFn: fetchRecentUsers,
  });

  const users = (usersData?.utilisateurs_recents_connectes || []).slice(0, 5);

  const columns: ColumnsType<UtilisateurRecent> = [
    {
      title: 'Utilisateur',
      key: 'user',
      width: 230,
      render: (_, record) => (
        <div className="flex min-w-0 items-center gap-3">
          <AvatarWithPopover name={record.nom_complet || 'Utilisateur'} email={record.email || '—'} size={38} />
          <div className="min-w-0">
            <Text strong className="block truncate !text-sm !text-slate-800">{record.nom_complet || 'Utilisateur'}</Text>
            <Text type="secondary" className="block truncate !text-xs">{record.email || 'E-mail non renseigné'}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Magasin',
      key: 'magasin',
      responsive: ['md'],
      render: (_, record) => <Text className="text-xs text-slate-600">{record.magasin?.denomination || 'Plateforme'}</Text>,
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const display = roleDisplay(role);
        return <Tag className={`!m-0 !rounded-full !border !px-2.5 !py-0.5 !text-[11px] !font-semibold ${display.className}`}>{display.label}</Tag>;
      },
    },
    {
      title: 'Dernière connexion',
      key: 'date_connexion',
      responsive: ['lg'],
      render: (_, record) => <Text className="whitespace-nowrap text-xs text-slate-500">{formatDate(record.date_connexion)}</Text>,
    },
    {
      title: 'Statut',
      key: 'status',
      render: (_, record) => record.user_id
        ? <StatusToggle userId={record.user_id} initialStatus={record.is_active !== false} />
        : <Tag color={record.is_active !== false ? 'success' : 'error'} className="!m-0 !rounded-full">{record.is_active !== false ? 'Actif' : 'Inactif'}</Tag>,
    },
  ];

  return (
    <section className="min-w-0 rounded-2xl border border-purple-100/70 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Utilisateurs récents</h2>
          <p className="mt-1 text-xs text-slate-500">Les cinq dernières connexions enregistrées.</p>
        </div>
        <Link to="/superadmin/dashboard/recentansevernel" className="flex w-fit items-center text-sm font-semibold !text-purple-950 hover:!text-purple-700">
          Voir tous les utilisateurs <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {error ? <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">Impossible de charger les utilisateurs récents.</div> : isLoading ? <div className="py-12 text-center text-sm text-slate-400">Chargement des utilisateurs récents…</div> : (
        <>
          {/* Mobile : une ligne compacte par utilisateur, sans défilement horizontal */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {users.length === 0 && <li className="py-6 text-center text-sm text-slate-400">Aucun utilisateur récent</li>}
            {users.map((record) => {
              const display = roleDisplay(record.role);
              return (
                <li key={`${record.user_id}-${getDateValue(record.date_connexion) || record.email}`} className="flex items-center gap-3 py-3">
                  <AvatarWithPopover name={record.nom_complet || 'Utilisateur'} email={record.email || '—'} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{record.nom_complet || record.email || 'Utilisateur'}</p>
                    <p className="truncate text-xs text-slate-500">
                      {record.magasin?.denomination || 'Plateforme'} · {formatDate(record.date_connexion)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Tag className={`!m-0 !rounded-full !border !px-2 !py-0 !text-[10px] !font-semibold ${display.className}`}>{display.label}</Tag>
                    <span className={`text-[11px] font-medium ${record.is_active !== false ? 'text-green-700' : 'text-slate-400'}`}>
                      {record.is_active !== false ? '● Actif' : '○ Inactif'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block"><Table columns={columns} dataSource={users} rowKey={(record) => `${record.user_id}-${getDateValue(record.date_connexion) || record.email}`} pagination={false} size="middle" scroll={{ x: 680 }} className="recent-users-table" locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun utilisateur récent" className="py-8" /> }} /></div>
        </>
      )}
    </section>
  );
};

export default Recentusers;
