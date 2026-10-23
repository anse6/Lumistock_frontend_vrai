import React from 'react';
import { Table, Tag, Avatar, Typography, ConfigProvider, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Client } from './types';

const { Text } = Typography;

// Fonction pour retourner une couleur basée sur la première lettre du nom
const getColorFromLetter = (letter: string): string => {
  const colors: { [key: string]: string } = {
    A: '#f56a00',
    B: '#7265e6',
    C: '#ffbf00',
    D: '#00a2ae',
    E: '#2db7f5',
    F: '#87d068',
    G: '#108ee9',
    H: '#fa541c',
    I: '#13c2c2',
    J: '#52c41a',
    K: '#722ed1',
    L: '#eb2f96',
    M: '#faad14',
    N: '#a0d911',
    O: '#1890ff',
    P: '#f5222d',
    Q: '#fa8c16',
    R: '#13c2c2',
    S: '#b37feb',
    T: '#73d13d',
    U: '#ffc53d',
    V: '#d46b08',
    W: '#597ef7',
    X: '#9254de',
    Y: '#ff7a45',
    Z: '#36cfc9',
  };

  const upper = letter.toUpperCase();
  return colors[upper] || '#d9d9d9'; // Couleur par défaut
};

interface ClientsTableProps {
  clients: Client[];
  loading?: boolean;
  showNoData?: boolean;
}

const ClientsTable: React.FC<ClientsTableProps> = ({ clients, loading, showNoData }) => {
  const columns: ColumnsType<Client> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id) => <Text className="text-gray-600 text-xs">{id}</Text>,
    },
    {
      title: 'Client',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
      render: (name: string) => {
        const initial = name?.charAt(0).toUpperCase() || '?';
        const bgColor = getColorFromLetter(initial);
        return (
          <div className="flex items-center">
            <Avatar 
              size="small"
              style={{ 
                backgroundColor: bgColor, 
                color: '#fff',
                marginRight: 8,
                fontSize: '10px'
              }}
            >
              {initial}
            </Avatar>
            <Text className="truncate text-xs" style={{ maxWidth: 120 }}>{name}</Text>
          </div>
        );
      },
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone) => <Text className="text-gray-600 text-xs">{phone}</Text>,
    },
    {
      title: 'Localisation',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location) => <Text className="text-gray-600 text-xs">{location}</Text>,
    },
    {
      title: 'Commandes',
      dataIndex: 'command',
      key: 'command',
      width: 100,
      render: (command) => <Tag className="text-xs">{command}</Tag>,
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <Text strong className="text-gray-900 text-xs">
          {amount}
        </Text>
      ),
    },
  ];

  const customEmptyText = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span className="text-gray-500">
          {showNoData ? "Aucune donnée trouvée" : "Aucun client"}
        </span>
      }
    />
  );

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            cellPaddingBlock: 24,
            cellPaddingInline: 15,
            fontSize: 14,
          },
        },
      }}
    >
      <Table
        columns={columns}
        dataSource={clients}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
        pagination={false}
        className="rounded-[10px] border border-gray-200"
        size="middle"
        locale={{
          emptyText: customEmptyText
        }}
      />
    </ConfigProvider>
  );
};

export default ClientsTable;



