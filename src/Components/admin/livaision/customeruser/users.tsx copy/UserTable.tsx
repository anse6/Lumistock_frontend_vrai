import React from 'react';
import { Table, Space, Button, Dropdown, Avatar } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { MoreVertical, Edit, Trash2, RotateCcw, UserCheck, UserX } from 'lucide-react';
import images from '@/assets/no_data.png';

interface User {
  _id: string;
  name: string;
  first_name: string;
  email: string;
  role: string;
  is_active?: boolean;
  nom_boutique?: string;
  created_at?: {
    $date: string;
  };
}

interface UserTableProps {
  users: User[];
  loading: boolean; // ✅ ajouté
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onEdit,
  onDelete,
  onResetPassword,
  onActivate,
  onDeactivate
}) => {
  const { t, i18n } = useTranslation();

  const getInitials = (name: string, firstName: string) => {
    return `${name?.charAt(0) || ''}${firstName?.charAt(0) || ''}`.toUpperCase();
  };

  const getInitialColor = (initials: string) => {
    const colors = [
      '#84c641ff',
      '#df9892ff',
      '#5babd1ff',
      '#d06060ff',
      '#d3a950ff',
      '#c491e7ff',
      '#daaa43ff',
    ];

    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const columns: ColumnsType<User> = [

    {
      title: t('admin.users.table.shop'),
      dataIndex: 'nom_boutique',
      key: 'nom_boutique',
      render: (boutique) => (
        <span className="text-sm text-gray-600">{boutique || '-'}</span>
      )
    },
    {
      title: t('admin.users.table.name'),
      key: 'name',
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar
            shape="square"
            style={{
              backgroundColor: getInitialColor(getInitials(record.name, record.first_name)),
              color: '#0F172A',
              fontWeight: 'bold'
            }}
          >
            {getInitials(record.name, record.first_name)}
          </Avatar>
          <span className="text-sm font-medium">
            {record.name} {record.first_name}
          </span>
        </Space>
      ),
    },
    {
      title: t('admin.users.table.email'),
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <span className="text-sm text-gray-600">{email}</span>
      )
    },
    {
      title: t('admin.users.table.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${role === 'admin'
          ? 'bg-slate-100 text-slate-800'
          : role === 'staff'
            ? 'bg-blue-100 text-blue-800'
            : role === 'livreur'
              ? 'bg-yellow-100 text-yellow-800'
              : role === 'caissier'
                ? 'bg-fuchsia-100 text-fuchsia-800'
                : 'bg-green-100 text-green-800'
          }`}>
          {t(`common.roles.${role}`, { defaultValue: role })}
        </span>
      )
    },
    {
      title: t('admin.users.table.status'),
      key: 'status',
      render: (_, record) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.is_active !== false
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
          }`}>
          {record.is_active !== false ? t('admin.users.table.active') : t('admin.users.table.inactive')}
        </span>
      )
    },
    {
      title: t('admin.users.table.date'),
      key: 'created_at',
      render: (_, record) =>
        record.created_at
          ? new Date(record.created_at.$date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          : 'N/A'
    },
    {
      title: t('admin.users.table.action'),
      key: 'action',
      fixed: 'right',
      render: (_, record) => {
        const items = [
          {
            key: 'edit',
            label: t('admin.users.actions.edit'),
            icon: <Edit size={16} />,
            onClick: () => onEdit(record),
          },
          {
            key: 'reset',
            label: t('admin.users.actions.resetPassword'),
            icon: <RotateCcw size={16} />,
            onClick: () => onResetPassword(record),
          },
          record.is_active !== false
            ? {
              key: 'deactivate',
              label: t('admin.users.actions.deactivate'),
              icon: <UserX size={16} />,
              onClick: () => onDeactivate(record),
            }
            : {
              key: 'activate',
              label: t('admin.users.actions.activate'),
              icon: <UserCheck size={16} />,
              onClick: () => onActivate(record),
            },
          {
            key: 'delete',
            label: t('admin.users.actions.delete'),
            icon: <Trash2 size={16} />,
            danger: true,
            onClick: () => onDelete(record),
          }
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreVertical size={20} className="text-gray-400" />}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="w-full h-full overflow-hidden border border-gray-100 rounded-[10px] flex flex-col bg-white">

      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        pagination={false}
        scroll={{ x: 'max-content' }}
        className="custom-antd-table"
        size="small"
        loading={loading}
        locale={{
          emptyText: !loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <img
                src={images}
                alt="No Data"
                className="h-32 w-32 object-contain mb-3 opacity-80"
              />
              <span className="text-gray-400 text-sm">
                {t('admin.customers.table.noData')}
              </span>
            </div>
          ) : null
        }}
      />

    </div>
  );
};

export default UserTable;