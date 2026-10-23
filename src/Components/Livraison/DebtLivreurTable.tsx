import React, { useState } from 'react';
import { Table, Tag, Space, Avatar, Button, Drawer, Divider, InputNumber, message, Form, Spin } from 'antd';
import { EyeOutlined, WalletOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getUrlServer } from '../../../configServer';
import logo1 from '@/assets/no_data.png';

interface ClientDebt {
  client_id: string;
  nom: string;
  telephone: string;
  ville: string;
  quartier: string;
  nombre_livraisons: number;
  montant_total: number;
  montant_paye: number;
  dette: number;
}

interface DebtHistory {
  livraison_id: string;
  date_livraison: string;
  produits: {
    produit_id: string;
    quantite: number;
    prix: number;
    nom: string;
  }[];
  methode_paiement: string;
  montant_produits: number;
  dette_ancienne_incluse: number;
  montant_total: number;
  montant_paye: number;
  relicat_dette: number;
}

interface DebtDetails {
  client_id: string;
  client_nom: string;
  total_dette: number;
  historique: DebtHistory[];
}

interface DebtLivreurTableProps {
  data: ClientDebt[];
  refreshData?: () => void;
}

const DebtLivreurTable: React.FC<DebtLivreurTableProps> = ({ data, refreshData }) => {
  const { t, i18n } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [debtDetails, setDebtDetails] = useState<DebtDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [partialPayments, setPartialPayments] = useState<Record<string, number>>({});

  const fetchDebtDetails = async (client_id: string) => {
    setLoadingDetails(true);
    setIsModalVisible(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${getUrlServer()}/clients/${client_id}/debt/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDebtDetails(response.data);
    } catch (error) {
      console.error(error);
      message.error(t('admin.customers.debt.messages.errorDebtDetails'));
      setIsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePartialPayment = async (livraison_id: string) => {
    const montant = partialPayments[livraison_id];
    if (!montant || montant <= 0) {
      message.warning(t('admin.customers.debt.messages.validAmountWarning'));
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${getUrlServer()}/livraisons/ajouter-paiement/${livraison_id}`,
        { montant },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(t('admin.customers.debt.messages.paymentSuccess'));
      if (debtDetails) {
        fetchDebtDetails(debtDetails.client_id);
      }
      if (refreshData) refreshData();
    } catch (error) {
      console.error(error);
      message.error(t('admin.customers.debt.messages.paymentError'));
    }
  };

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
      '#84c641ff', '#df9892ff', '#5babd1ff', '#d06060ff', '#d3a950ff', '#c491e7ff', '#daaa43ff',
    ];
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getDebtColor = (dette: number) => {
    if (dette > 50000) return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
    if (dette > 20000) return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
    return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
  };

  const columns: ColumnsType<ClientDebt> = [
    {
      title: t('admin.customers.debt.table.columns.client'),
      key: 'client',
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar
            shape="square"
            style={{
              backgroundColor: getInitialColor(getInitials(record.nom)),
              color: '#0F172A',
              fontWeight: 'bold'
            }}
          >
            {getInitials(record.nom)}
          </Avatar>
          <span className="text-sm font-medium">{record.nom}</span>
        </Space>
      ),
    },
    {
      title: t('admin.customers.debt.table.columns.phone'),
      dataIndex: 'telephone',
      key: 'telephone',
    },
    {
      title: t('admin.customers.debt.table.columns.location'),
      key: 'location',
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium">{record.quartier}</div>
          <div className="text-xs text-gray-400">{record.ville}</div>
        </div>
      ),
    },
    {
      title: t('admin.customers.debt.table.columns.nbDeliveries'),
      dataIndex: 'nombre_livraisons',
      key: 'nombre_livraisons',
      align: 'center',
      render: (val) => (
        <Tag color="blue" className="rounded-full">
          {val}
        </Tag>
      ),
    },
    {
      title: t('admin.customers.debt.table.columns.totalAmount'),
      dataIndex: 'montant_total',
      key: 'montant_total',
      align: 'right',
      render: (val) => (
        <span className="font-semibold text-sm">
          {val.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} CFA
        </span>
      ),
    },
    {
      title: t('admin.customers.debt.table.columns.paidAmount'),
      dataIndex: 'montant_paye',
      key: 'montant_paye',
      align: 'right',
      render: (val) => (
        <span className="text-sm text-green-600 font-medium">
          {val.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} CFA
        </span>
      ),
    },
    {
      title: t('admin.customers.debt.table.columns.debt'),
      dataIndex: 'dette',
      key: 'dette',
      align: 'right',
      fixed: 'right',
      render: (val) => {
        const colors = getDebtColor(val);
        return (
          <span
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              borderColor: colors.border,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
            className="px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap"
          >
            {val.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} CFA
          </span>
        );
      },
    },
    {
      title: t('admin.customers.debt.table.columns.action'),
      key: 'action',
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => fetchDebtDetails(record.client_id)}
          className="bg-[#0F172A] hover:bg-[#1E293B]"
        >{t('admin.customers.debt.table.columns.details')}</Button>
      ),
    }
  ];

  return (
    <div className="w-full h-full overflow-hidden border border-gray-100 rounded-[10px] flex flex-col bg-white">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="client_id"
        pagination={false}
        scroll={{ x: 'max-content' }}
        className="custom-antd-table"
        size="small"
      />

      <Drawer
        title={`${t('admin.customers.debt.modal.title')} ${debtDetails?.client_nom || ''}`}
        placement="right"
        open={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setDebtDetails(null);
          setPartialPayments({});
        }}
        width={700}
      >
        {loadingDetails ? (
          <div className="flex justify-center p-8">
            <Spin />
          </div>
        ) : debtDetails?.historique && debtDetails.historique.length > 0 ? (
          <div className="flex flex-col gap-6 max-h-[100%] overflow-y-auto pr-2 pb-4">
            {debtDetails.historique.map((liv) => (
              <div key={liv.livraison_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700 text-sm">{t('admin.customers.debt.modal.date')} {new Date(liv.date_livraison).toLocaleString('fr-FR')}</span>
                  <Tag color="orange" className="font-bold border-orange-200 text-orange-700 m-0">
                    {t('admin.customers.debt.modal.remainder')} {liv.relicat_dette.toLocaleString()} FCFA
                  </Tag>
                </div>

                <div className="font-mono text-sm bg-white p-3 rounded border border-gray-200 shadow-inner">
                  <div className="flex justify-between">
                    <span>{t('admin.customers.debt.modal.productsDelivered')}</span>
                    <span>{liv.montant_produits.toLocaleString()} FCFA</span>
                  </div>
                  {liv.dette_ancienne_incluse > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>+ {t('admin.customers.debt.modal.oldDebtIncluded')}</span>
                      <span>{liv.dette_ancienne_incluse.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <Divider className="my-2" style={{ borderBlockStartColor: '#d1d5db' }} />
                  <div className="flex justify-between font-bold">
                    <span>{t('admin.customers.debt.modal.totalDue')}</span>
                    <span>{liv.montant_total.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>{t('admin.customers.debt.modal.paid')}</span>
                    <span>{liv.montant_paye.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-orange-600 font-bold mt-1">
                    <span>{t('admin.customers.debt.modal.remainingToPay')}</span>
                    <span>{liv.relicat_dette.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Historique des produits de la livraison */}
                <div className="mt-3 text-sm">
                  <h4 className="font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">{t('admin.customers.debt.modal.productDetails')}</h4>
                  <ul className="space-y-2">
                    {liv.produits && liv.produits.length > 0 ? (
                      liv.produits.map((prod, index) => (
                        <li key={index} className="flex justify-between items-center bg-white p-2 border border-gray-100 rounded shadow-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#0F172A]">{prod.nom}</span>
                            <span className="text-xs text-gray-500">{t('admin.customers.debt.modal.qty')} {prod.quantite}</span>
                          </div>
                          <span className="font-medium text-gray-700">{(prod.prix).toLocaleString()} FCFA</span>
                        </li>
                      ))
                    ) : (
                      <div className="flex justify-center py-4">
                        <img src={logo1} alt="No Data" className="h-24 w-24 object-contain opacity-50" />
                      </div>
                    )}
                  </ul>
                </div>

                <div className="mt-4">
                  <Form
                    layout="inline"
                    onFinish={() => handlePartialPayment(liv.livraison_id)}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <Form.Item
                      name={`payment_${liv.livraison_id}`}
                      rules={[
                        { required: true, message: t('admin.customers.debt.messages.fieldRequired') },
                        {
                          type: 'number',
                          min: 1,
                          max: liv.relicat_dette,
                          message: t('admin.customers.debt.messages.amountMustBeLessOrEqual', { amount: liv.relicat_dette })
                        }
                      ]}
                      className="m-0 flex-grow"
                      style={{ flex: 1 }}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder={t('admin.customers.debt.modal.amountToPay')}
                        value={partialPayments[liv.livraison_id]}
                        onChange={(val) => setPartialPayments({ ...partialPayments, [liv.livraison_id]: val as number })}
                      />
                    </Form.Item>

                    <Form.Item className="m-0">
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full sm:w-auto bg-[#0F172A] hover:bg-[#1E293B]"
                        icon={<WalletOutlined />}
                      >{t('admin.customers.debt.modal.payButton')}</Button>
                    </Form.Item>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <img src={logo1} alt="No Data" className="h-48 w-48 object-contain mb-4" />
            <span className="text-gray-400">{t('admin.customers.table.noData')}</span>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DebtLivreurTable;
