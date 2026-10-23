import React from 'react';
import { Button, Empty, Pagination, Skeleton, Tag, Typography } from 'antd';
import { EditOutlined, EyeOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import AvatarWithPopover from './AvatarWithPopover';
import StatusToggle from './StatusToggle';

interface UserCardRecord {
  _id: string;
  name: string;
  first_name: string;
  email: string;
  role: string;
  is_active?: boolean;
  magasin_nom?: string;
  nom_boutique?: string;
  telephone?: string;
  fonction?: string;
}

interface UserCardsProps {
  users: UserCardRecord[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  onView: (user: UserCardRecord) => void;
  onEdit: (user: UserCardRecord) => void;
  onStatusChange: (userId: string, isActive: boolean) => void;
  loading?: boolean;
}

const roleDisplay = (role: string) => {
  const roles: Record<string, { label: string; className: string }> = {
    admin: { label: 'Administrateur', className: '!border-purple-200 !bg-purple-50 !text-purple-900' },
    manager: { label: 'Manager', className: '!border-blue-200 !bg-blue-50 !text-blue-800' },
    gerant: { label: 'Gérant', className: '!border-amber-200 !bg-amber-50 !text-amber-800' },
    livreur: { label: 'Gérant', className: '!border-amber-200 !bg-amber-50 !text-amber-800' },
    staff: { label: 'Staff', className: '!border-slate-200 !bg-slate-50 !text-slate-700' },
  };
  return roles[role] || { label: role || '—', className: '!border-slate-200 !bg-slate-50 !text-slate-700' };
};

const getUserName = (user: UserCardRecord) => `${user.name || ''} ${user.first_name || ''}`.trim() || 'Utilisateur';
const getStoreLabel = (user: UserCardRecord) => user.magasin_nom || user.nom_boutique || 'Plateforme';

const UserCards: React.FC<UserCardsProps> = ({ users, currentPage, setCurrentPage, itemsPerPage, onView, onEdit, onStatusChange, loading = false }) => {
  const pageUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="p-4"><Skeleton active avatar paragraph={{ rows: 3 }} /></div>;
  if (!users.length) return <Empty description="Aucun utilisateur ne correspond aux filtres" className="py-16" />;

  return (
    <div className="p-3 sm:p-4 md:p-5">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pageUsers.map((user) => {
          const role = roleDisplay(user.role);
          return (
            <div key={user._id} className="min-w-0 rounded-xl border border-purple-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <AvatarWithPopover name={getUserName(user)} email={user.email || '—'} size={46} />
                <div className="min-w-0 flex-1">
                  <Typography.Text strong ellipsis={{ tooltip: getUserName(user) }} className="block !text-base !text-black">{getUserName(user)}</Typography.Text>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Tag className={`!m-0 !rounded-full !px-3 !py-0.5 !text-[11px] !font-semibold ${role.className}`}>{role.label}</Tag>
                    <StatusToggle userId={user._id} initialStatus={user.is_active !== false} onStatusChange={(isActive) => onStatusChange(user._id, isActive)} />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex min-w-0 items-center gap-2"><MailOutlined className="shrink-0 text-purple-800" /> <span className="truncate">{user.email || 'Email non renseigné'}</span></div>
                <div className="flex items-center gap-2"><PhoneOutlined className="shrink-0 text-purple-800" /> {user.telephone || 'Téléphone non renseigné'}</div>
                <div className="truncate text-xs text-slate-500">Magasin : <span className="font-medium text-slate-700">{getStoreLabel(user)}</span></div>
                {user.fonction && <div className="truncate text-xs text-slate-500">Fonction : <span className="font-medium text-slate-700">{user.fonction}</span></div>}
              </div>

              <div className="mt-4 flex gap-2 border-t border-purple-100 pt-3">
                <Button icon={<EyeOutlined />} onClick={() => onView(user)} className="flex-1 border-purple-200 text-purple-800 hover:!border-purple-800 hover:!text-purple-900">Détails</Button>
                <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(user)} className="flex-1 !bg-purple-950 hover:!bg-purple-900">Modifier</Button>
              </div>
            </div>
          );
        })}
      </div>
      {users.length > itemsPerPage && <div className="mt-5 flex justify-center sm:justify-end"><Pagination simple current={currentPage} pageSize={itemsPerPage} total={users.length} showSizeChanger={false} onChange={setCurrentPage} /></div>}
    </div>
  );
};

export default UserCards;
