// ApprovisionnementTable.tsx
import React, { useState } from 'react';
import { Approvisionnement } from '../types';
import DetailApproModal from './DetailApproModal';
import { MoreVertical, Eye, FileText, Box, XCircle } from 'lucide-react';
import { Table, Tag, Button, Dropdown } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface ApprovisionnementTableProps {
  approvisionnements: Approvisionnement[];
}

const ApprovisionnementTable: React.FC<ApprovisionnementTableProps> = ({ approvisionnements }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedApprovisionnement, setSelectedApprovisionnement] = useState<number | null>(null);

  const handleView = (id: number) => {
    setSelectedApprovisionnement(id);
    setShowModal(true);
  };

  const handleDetail = (id: number) => {
    console.log('Afficher détail', id);
  };

  const handleApprovisionner = (id: number) => {
    console.log('Approvisionner', id);
  };

  const handleCancel = (id: number) => {
    console.log('Annuler', id);
  };

  const columns: ColumnsType<Approvisionnement> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Livreur',
      dataIndex: 'deliveryPerson',
      key: 'deliveryPerson',
      width: 150,
    },
    {
      title: 'Quantité',
      dataIndex: 'productQuantity',
      key: 'productQuantity',
      width: 100,
    },
    {
      title: 'Restantes',
      dataIndex: 'remainingQuantity',
      key: 'remainingQuantity',
      width: 100,
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'Livré' ? 'success' : 'warning'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 80,
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            label: 'Afficher',
            icon: <Eye size={16} />,
            onClick: () => handleView(Number(record.id)),
          },
          {
            key: 'detail',
            label: 'Détails',
            icon: <FileText size={16} />,
            onClick: () => handleDetail(Number(record.id)),
          },
          {
            key: 'provision',
            label: 'Approvisionner',
            icon: <Box size={16} />,
            onClick: () => handleApprovisionner(Number(record.id)),
          },
          {
            key: 'cancel',
            label: 'Annuler',
            icon: <XCircle size={16} />,
            onClick: () => handleCancel(Number(record.id)),
            danger: true,
          },
        ];

        return (
          <Dropdown menu={{ items: items as any }} trigger={['click']}>
            <Button type="text" icon={<MoreVertical size={20} className="text-gray-500" />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <Table 
        columns={columns} 
        dataSource={approvisionnements} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        size="small"
        className="custom-antd-table border border-gray-100 rounded-lg overflow-hidden"
      />

      <DetailApproModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        approvisionnementId={selectedApprovisionnement || undefined}
      />
    </>
  );
};

export default ApprovisionnementTable;


