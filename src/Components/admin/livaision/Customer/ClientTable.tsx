import React from 'react';
import { Table, Space, Button, Dropdown, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreVertical, Edit, Trash2, PlusCircle, User, Banknote, MessageSquare, HandCoins, NotebookPen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import images from '@/assets/no_data.png';

import type { Client } from './client';
import { NumeroAvecDrapeau } from '../livraisonfinal/TelephoneInternational';
// Même avatar à initiales que la liste des utilisateurs (super-admin).
import AvatarWithPopover from '../../../super-admin/users.tsx/components/AvatarWithPopover';
import useCompteConnecte from "../../../../hooks/useCompteConnecte";

interface ClientTableProps {
  clients: Client[];
  sortColumn: string | null;
  loading: boolean;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: string) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onAddToCash?: (client: Client) => void;
  onWithdrawFromCash?: (client: Client) => void;
  onViewDetails: (client: Client) => void;
  onSendMessage?: (client: Client) => void;
  /** Encaisser un règlement (réparti sur ses dettes, la plus ancienne d'abord). */
  onRegler?: (client: Client) => void;
  /** Dette d'avant Lumistock (cahier de crédit). */
  onDetteOuverture?: (client: Client) => void;
  hiddenColumns?: string[];
}

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  loading,
  handleSort,
  onEdit,
  onDelete,
  onAddToCash,
  onWithdrawFromCash,
  onViewDetails,
  onSendMessage,
  onRegler,
  onDetteOuverture,
  hiddenColumns = []
}) => {
  const { peut } = useCompteConnecte();
  const { t, i18n } = useTranslation();
  

  const allColumns: ColumnsType<Client> = [
    {
      title: t('admin.customers.table.columns.name'),
      key: 'nom',
      fixed: 'left',
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('nom') }),
      render: (_, record) => (
        <Space>
          <AvatarWithPopover name={record.nom} email={record.email} size={36} />
          <span className="text-sm font-medium">{record.nom}</span>
        </Space>
      ),
    },
    {
      title: t('admin.customers.table.columns.phone'),
      dataIndex: 'telephone',
      key: 'telephone',
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('telephone') }),
      // Drapeau du pays + numéro international (« +237 6 90 12 34 56 »).
      render: (phone) => <NumeroAvecDrapeau numero={phone} className="text-sm text-slate-600" />,
    },
    {
      title: t('admin.customers.table.columns.deliveries'),
      dataIndex: 'nombre_livraisons',
      key: 'nombre_livraisons',
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('nombre_livraisons') }),
      render: (val) => <Tag color="purple" className="font-bold">{(val || 0)}</Tag>
    },
    {
      title: t('admin.customers.table.columns.address'),
      key: 'address',
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('ville') }),
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium">{record.quartier || '-'}</div>
          <div className="text-xs text-gray-400">{record.ville || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Solde compte', // argent du client sur son compte
      dataIndex: 'montant_en_caisse',
      key: 'montant_en_caisse',
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('montant_en_caisse') }),
      render: (val) => (
        <span className={(val || 0) > 0 ? 'font-bold text-emerald-600' : 'text-gray-300'}>
          {(val || 0).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} CFA
        </span>
      ),
    },
    {
      title: t('admin.customers.table.columns.amount'), // "Montant Total"
      dataIndex: 'montant_total',
      key: 'montant_total',
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('montant_total') }),
      render: (val) => (
        <span className="font-semibold text-slate-700">
          {(val || 0).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} CFA
        </span>
      ),
    },
    {
      title: 'Dette',
      dataIndex: 'dette',
      key: 'dette',
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('dette') }),
      render: (val) =>
        (val || 0) > 0 ? (
          <span className="font-semibold text-amber-600">
            {(val || 0).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} CFA
          </span>
        ) : (
          <span className="text-gray-300">0 CFA</span>
        ),
    },
    {
      title: t('admin.customers.table.columns.date'),
      // Date ISO du serveur (et non plus created_at.$date, toujours vide).
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('created_at') }),
      render: (date) => date ? new Date(date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : '-',
    },
    {
      title: t('admin.customers.table.columns.actions'),
      key: 'action',
      fixed: 'right',
      render: (_, record) => {
        const solde = record.montant_en_caisse ?? 0;
        const items = [
          {
            key: 'details',
            label: <span style={{ color: '#3b0764', fontWeight: 600 }}>{t('admin.customers.table.clientDetails')}</span>,
            icon: <User size={16} style={{ color: '#3b0764' }} />,
            onClick: () => onViewDetails(record),
          },
          // Message SMS / email au client (pas pour le client de passage).
          ...(onSendMessage && !record.par_defaut
            ? [{
                key: 'message',
                label: <span className="font-medium text-purple-900">{t('admin.customers.table.sendMessage')}</span>,
                icon: <MessageSquare size={16} className="text-purple-900" />,
                onClick: () => onSendMessage(record),
              }]
            : []),
          {
            key: 'edit',
            label: t('admin.customers.table.edit'),
            icon: <Edit size={16} />,
            onClick: () => onEdit(record),
          },
          ...(onRegler && (record.dette ?? 0) > 0
            ? [{
                key: 'regler',
                label: <span className="font-semibold text-emerald-700">Encaisser un règlement</span>,
                icon: <HandCoins size={16} className="text-emerald-600" />,
                onClick: () => onRegler(record),
              }]
            : []),
          ...(onDetteOuverture && !record.par_defaut
            ? [{
                key: 'dette_ouverture',
                label: <span className="font-medium text-orange-700">Dette d'avant Lumistock</span>,
                icon: <NotebookPen size={16} className="text-orange-600" />,
                onClick: () => onDetteOuverture(record),
              }]
            : []),
          {
            key: 'add_cash',
            label: <span className="font-medium text-emerald-700">{t('admin.customers.table.addToCash')}</span>,
            icon: <PlusCircle size={16} className="text-emerald-600" />,
            onClick: () => onAddToCash?.(record),
          },
          // Retirer seulement s'il y a de l'argent sur le compte.
          ...(solde > 0 && peut("clients.retirer_avance")
            ? [{
                key: 'withdraw_cash',
                label: <span className="font-medium text-orange-600">{t('admin.customers.modals.withdrawFromCash.title')}</span>,
                icon: <Banknote size={16} className="text-orange-500" />,
                onClick: () => onWithdrawFromCash?.(record),
              }]
            : []),
          // Le client de passage « Autres » n'est jamais supprimé.
          ...(!record.par_defaut && peut("clients.supprimer")
            ? [{ type: 'divider' as const }, {
                key: 'delete',
                label: t('admin.customers.table.delete'),
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: () => onDelete(record),
              }]
            : []),
        ] as any[];
        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreVertical size={20} className="text-gray-400" />} />
          </Dropdown>
        );
      },
    },
  ];

  const columns = allColumns.filter(col => !hiddenColumns.includes(col.key as string));

  return (
    <div className="w-full h-full overflow-hidden border border-gray-100 rounded-[10px] flex flex-col bg-white">
      <Table
        columns={columns}
        dataSource={clients}
        rowKey={(record) => record.client_id || record._id || record.nom}
        pagination={false}
        scroll={{ x: 'max-content' }}
        className="custom-antd-table"
        size="small"
        loading={loading}
        locale={{
          emptyText: !loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <img src={images} alt="No Data" className="h-32 w-32 object-contain mb-3 opacity-80" />
              <span className="text-gray-400 text-sm">{t('admin.customers.table.noData')}</span>
            </div>
          ) : null
        }}
      />
    </div>
  );
};

export default ClientTable;
