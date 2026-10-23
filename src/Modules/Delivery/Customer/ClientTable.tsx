import { Table, Avatar, Space, Tag, Button, Dropdown } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreVertical, Edit, Trash2, User, HandCoins, NotebookPen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Client {
  client_id: string;
  nombre_livraisons: number;
  montant_total: number;
  nom: string;
  telephone: string;
  quartier: string;
  ville: string;
  photo_profil: string;
  created_at: {
    $date: string;
  };
}

interface ClientTableProps {
  clients: Client[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: string) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onViewDetails: (client: Client) => void;
  /** Encaisser un règlement (réparti sur ses dettes, la plus ancienne d'abord). */
  onRegler?: (client: Client) => void;
  /** Saisir la dette d'avant Lumistock (cahier de crédit). */
  onDetteOuverture?: (client: Client) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onEdit,
  onDelete,
  onViewDetails,
  onRegler,
  onDetteOuverture
}) => {
  const { t } = useTranslation();
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || '??';
  };

  const getInitialColor = (initials: string) => {
    const colors = [
      '#84c641ff', // green-100
      '#df9892ff', // red-100
      '#5babd1ff', // blue-100
      '#d06060ff', // gray-100
      '#d3a950ff', // yellow-100
      '#c491e7ff', // purple-100
      '#daaa43ff', // orange-100
    ];
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const formatCurrency = (amount: number) => {
    const value = amount || 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(value).replace('XOF', 'CFA');
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    if (typeof phone !== 'string') return '';

    if (phone.startsWith('237')) {
      return `+237 ${phone.slice(3, 4)}${phone.slice(4, 6)} ${phone.slice(6, 8)} ${phone.slice(8, 10)} ${phone.slice(10)}`;
    }
    return `+237 ${phone}`;
  };

  const columns: ColumnsType<Client> = [
    {
      title: t('admin.customers.table.columns.id'),
      dataIndex: 'client_id',
      key: 'client_id',
      fixed: 'left',

    },
    {
      title: t('admin.customers.table.columns.name'),
      dataIndex: 'nom',
      key: 'nom',
      render: (text) => {
        const initials = getInitials(text);
        return (
          <Space>
            <Avatar
              shape="square"
              style={{
                backgroundColor: getInitialColor(initials),
                color: '#0F172A',
                fontWeight: 'bold'
              }}
            >
              {initials}
            </Avatar>
            <span className="font-medium">{text}</span>
          </Space>
        );
      },

    },
    {
      title: t('admin.customers.table.columns.phone'),
      dataIndex: 'telephone',
      key: 'telephone',
      render: (text) => formatPhone(text),

    },
    {
      title: t('admin.customers.table.columns.address'),
      key: 'adresse',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.quartier}</div>
          <div className="text-gray-400 text-xs">{record.ville}</div>
        </div>
      ),

    },
    {
      title: t('admin.customers.table.columns.deliveries'),
      dataIndex: 'nombre_livraisons',
      key: 'nombre_livraisons',
      render: (count) => (
        <Tag color="blue" className="rounded-full">
          {count} {t('admin.customers.table.columns.deliveries', { defaultValue: 'livraisons' })}
        </Tag>
      ),

    },
    {
      title: t('admin.customers.table.columns.amount'),
      dataIndex: 'montant_total',
      key: 'montant_total',
      render: (amount) => (
        <span className="font-bold text-gray-900">
          {formatCurrency(amount)}
        </span>
      ),

    },
    {
      title: t('admin.customers.table.columns.actions'),
      key: 'action',
      fixed: 'right',
      render: (_, record) => {
        const items = [
          {
            key: 'edit',
            label: t('admin.customers.table.edit'),
            icon: <Edit size={16} />,
            onClick: () => onEdit(record),
          },
          {
            key: 'details',
            label: t('admin.customers.table.clientDetails'),
            icon: <User size={16} />,
            onClick: () => onViewDetails(record),
          },
          ...(onRegler
            ? [{
                key: 'regler',
                label: <span className="font-semibold text-emerald-700">Encaisser un règlement</span>,
                icon: <HandCoins size={16} className="text-emerald-600" />,
                onClick: () => onRegler(record),
              }]
            : []),
          ...(onDetteOuverture
            ? [{
                key: 'dette_ouverture',
                label: <span className="font-medium text-orange-700">Dette d'avant Lumistock</span>,
                icon: <NotebookPen size={16} className="text-orange-600" />,
                onClick: () => onDetteOuverture(record),
              }]
            : []),
          {
            key: 'delete',
            label: t('admin.customers.table.delete'),
            icon: <Trash2 size={16} />,
            danger: true,
            onClick: () => onDelete(record),
          } as any
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreVertical size={20} className="text-gray-400" />} />
          </Dropdown>
        );
      },

    },
  ];

  return (
    <div className="flex-1 overflow-auto p-4 border border-gray-100 rounded-[10px] bg-white mx-4 my-2">
      <Table
        columns={columns}
        dataSource={clients}
        rowKey="client_id"
        pagination={false}
        scroll={{ x: 'max-content' }}
        className="custom-antd-table"
        size="small"
        locale={{ emptyText: t('admin.customers.table.noData') }}
      />
    </div>
  );
};

export default ClientTable;



