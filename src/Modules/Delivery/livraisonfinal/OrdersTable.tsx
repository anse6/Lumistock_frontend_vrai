import React, { useState } from 'react';
import { etatVente } from '../../../services/ventes';
import { Table, Tag, Modal, Button, Dropdown, Space, message, InputNumber, Divider } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreVertical, Eye, Trash2, DollarSign, RotateCcw, Edit } from 'lucide-react';
import { Order } from './types';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getUrlServer } from './../../../configServer';
import ReturnModal from './ReturnModal';
import { useTranslation } from 'react-i18next';
import useCompteConnecte from "../../../hooks/useCompteConnecte";


const API_URL = getUrlServer();

interface OrdersTableProps {
  orders: Order[];
  activeMenu: number | null;
  onMenuToggle: (index: number) => void;
  onDelete: (orderId: string) => any;
  onShowDetails: (order: Order) => void;
  onCompletePayment: (orderId: string, remainingAmount: number) => Promise<void>;
  onReturnSuccess: () => void;
  onOrderUpdated: () => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onDelete,
  onShowDetails,
  onCompletePayment,
  onReturnSuccess,
  onOrderUpdated,
}) => {
  const { peut } = useCompteConnecte();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paymentModal, setPaymentModal] = useState<{ visible: boolean; order: Order | null; amount: number }>({
    visible: false,
    order: null,
    amount: 0,
  });
  const [confirmPaymentModal, setConfirmPaymentModal] = useState<{ visible: boolean; order: Order | null; amount: number }>({
    visible: false,
    order: null,
    amount: 0,
  });
  const [refundModal, setRefundModal] = useState<{ visible: boolean; order: Order | null }>({
    visible: false,
    order: null,
  });
  const [returnModal, setReturnModal] = useState<{ visible: boolean; order: Order | null }>({
    visible: false,
    order: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompletePayment = async () => {
    if (!confirmPaymentModal.order) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token non trouvé');

      const response = await axios.post(
        `${API_URL}/livraisons/ajouter-paiement/${confirmPaymentModal.order.id}`,
        { montant: confirmPaymentModal.amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Réponse { livraison } (ancien format : [{ livraison }, statut]).
      const corps = Array.isArray(response.data) ? response.data[0] : response.data;
      if (corps?.livraison) {
        message.success(t('delivery.ordersTable.messages.paymentSuccess'));
        await onCompletePayment(confirmPaymentModal.order.id, confirmPaymentModal.amount);
        onOrderUpdated();
        setConfirmPaymentModal({ visible: false, order: null, amount: 0 });
        setPaymentModal({ visible: false, order: null, amount: 0 });
      } else {
        throw new Error('Réponse inattendue du serveur');
      }
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      message.error(t('delivery.ordersTable.messages.paymentError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!refundModal.order) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token non trouvé');

      const livraisonId = refundModal.order.livraison_id || refundModal.order.id;
      const refundAmount = refundModal.order.ristourne;

      await axios.post(
        `${API_URL}/livraisons/refund/${livraisonId}`,
        { montant: refundAmount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      message.success(t('delivery.ordersTable.messages.refundSuccess', { amount: (refundAmount || 0).toLocaleString() }));
      onOrderUpdated();
      setRefundModal({ visible: false, order: null });
    } catch (error) {
      console.error('Erreur lors du remboursement:', error);
      message.error(t('delivery.ordersTable.messages.noRefund'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnConfirm = async (
    livraison_id: string,
    livreur_id: string,
    motif: string,
    produits: { produit_id: string; quantite: number }[]
  ) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token non trouvé');

      await axios.post(
        `${API_URL}/livraisons/retour`,
        { livraison_id, livreur_id, motif, produits },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      message.success(t('delivery.ordersTable.messages.returnSuccess'));
      onReturnSuccess();
      onOrderUpdated();
      setReturnModal({ visible: false, order: null });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du retour:", error);
      message.error(t('delivery.ordersTable.messages.returnError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token non trouvé');

      const response = await axios.get(`${API_URL}/livraisons/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data) {
        const orderData: Order = {
          ...response.data,
          clientInitials: response.data.client.nom
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2),
          clientName: response.data.client.nom,
          quantity: response.data.quantite,
          paymentStatus: response.data.statut_paiement,
          methode_paiement: response.data.methode_paiement,
          amount: response.data.montant_total,
          date: new Date(response.data.date_commande).toLocaleDateString('fr-FR'),
          status: response.data.etat || 'validee',
          etat: response.data.etat || 'validee',
          abandon_reste: response.data.abandon_reste ?? null,
          abandon_en_attente: !!response.data.abandon_en_attente,
          montant_restant: response.data.montant_restant,
          montant_paye: response.data.montant_paye,
          montant_produits: response.data.montant_produits,
          dette_ancienne: response.data.dette_ancienne,
          date_livraison: response.data.date_livraison,
        };
        onShowDetails(orderData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      message.error(t('delivery.ordersTable.messages.fetchDetailsError'));
    }
  };

  const columns: ColumnsType<Order> = [
    // {
    //   title: 'Commande ID',
    //   dataIndex: 'id',
    //   key: 'id',

    // },
    {
      title: t('delivery.ordersTable.clientName'),
      key: 'client',
      fixed: 'left',

      render: (_, record) => (
        <Space>
          <Tag color="green">{record.clientInitials}</Tag>
          <span className="text-sm font-medium">{record.clientName}</span>
        </Space>
      ),
    },
    {
      title: t('delivery.ordersTable.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',

    },
    {
      title: t('delivery.ordersTable.payment'),
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',

      render: (status) => {
        let color = 'default';
        if (status?.toLowerCase() === 'payé' || status?.toLowerCase() === 'paye') color = 'success';
        if (status?.toLowerCase() === 'partiel') color = 'warning';
        if (status?.toLowerCase() === 'en attente') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: t('delivery.ordersTable.amount'),
      dataIndex: 'montant_produits',
      key: 'montant',

      render: (val) => `${(val || 0).toLocaleString()} CFA`,
    },
    {
      title: t('delivery.ordersTable.date'),
      dataIndex: 'date',
      key: 'date',

    },
    {
      title: t('delivery.ordersTable.amountPaid'),
      dataIndex: 'montant_paye',
      key: 'montant_paye',

      render: (val) => `${(val || 0).toLocaleString()} CFA`,
    },
    {
      title: t('delivery.ordersTable.debt'),
      dataIndex: 'montant_restant',
      key: 'montant_restant',

      render: (val) => `${(val || 0).toLocaleString()} CFA`,
    },
    {
      title: t('delivery.ordersTable.oldDebt'),
      dataIndex: 'dette_ancienne',
      key: 'dette_ancienne',

      render: (val) => (
        <span className={val > 0 ? "text-red-600 font-medium" : "text-gray-600"}>
          {(val || 0).toLocaleString()} CFA
        </span>
      ),
    },
    {
      title: t('delivery.ordersTable.return'),
      dataIndex: 'retour',
      key: 'retour',

      render: (val) => (
        <span className={val > 0 ? "text-red-600 font-medium" : "text-gray-600"}>
          {(val || 0).toLocaleString()} CFA
        </span>
      ),
    },
    {
      // État de la vente (validée, retour, annulée) : le paiement a sa propre colonne.
      title: 'État',
      dataIndex: 'status',
      key: 'status',

      render: (status: string) => (
        <Tag color={etatVente(status).couleur} className="font-bold">
          {etatVente(status).libelle}
        </Tag>
      ),
    },
    {
      title: t('delivery.ordersTable.action'),
      key: 'action',
      fixed: 'right',

      render: (_, record) => {
        const isPaymentPaid = record.paymentStatus?.toLowerCase() === 'payé' || record.paymentStatus?.toLowerCase() === 'paye';
        const items = [
          {
            key: 'details',
            label: t('delivery.ordersTable.actions.showDetails'),
            icon: <Eye size={16} />,
            onClick: () => fetchOrderDetails(record.id),
          },
          ...(peut('ventes.modifier') ? [{
            key: 'edit',
            label: t('delivery.ordersTable.actions.edit'),
            icon: <Edit size={16} />,
            onClick: () => navigate(`/dashboard/delivery/update/${record.id}`),
          }] : []),
        ];

        if (record.montant_restant > 0) {
          items.push({
            key: 'payment',
            label: t('delivery.ordersTable.actions.finalizePayment'),
            icon: <DollarSign size={16} />,
            onClick: () => setPaymentModal({ visible: true, order: record, amount: record.montant_restant }),
          } as any);
        }

        if (isPaymentPaid) {
          items.push({
            key: 'refund',
            label: t('delivery.ordersTable.actions.refundClient'),
            icon: <RotateCcw size={16} />,
            onClick: () => setRefundModal({ visible: true, order: record }),
          } as any);
        }

        items.push({
          key: 'return',
          label: t('delivery.ordersTable.actions.returnItem'),
          icon: <RotateCcw size={16} />,
          onClick: () => setReturnModal({ visible: true, order: record }),
        } as any);

        if (peut('ventes.annuler')) items.push({
          key: 'divider',
          type: 'divider',
        } as any);

        if (peut('ventes.annuler')) items.push({
          key: 'delete',
          label: t('delivery.ordersTable.actions.cancel'),
          icon: <Trash2 size={16} />,
          danger: true,
          onClick: () => onDelete(record.id),
        } as any);

        return (
          <Dropdown menu={{ items: items as any }} trigger={['click']}>
            <Button type="text" icon={<MoreVertical size={20} className="text-gray-500" />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="w-full h-full overflow-hidden border border-gray-100 rounded-[10px] flex flex-col bg-white">
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total, range) => t('delivery.ordersTable.paginationInfo', { start: range[0], end: range[1], total }),
        }}

        scroll={{ x: 'max-content' }}
        className="custom-antd-table"
        size="small"
      />

      {/* Payment Modal — Étape 1 : Saisie du montant */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-blue-600" />
            <span>{t('delivery.ordersTable.paymentModal.title')}</span>
          </div>
        }
        open={paymentModal.visible}
        onOk={() => {
          setPaymentModal(prev => ({ ...prev, visible: false }));
          setConfirmPaymentModal({ visible: true, order: paymentModal.order, amount: paymentModal.amount });
        }}
        onCancel={() => setPaymentModal({ visible: false, order: null, amount: 0 })}
        confirmLoading={false}
        okText={t('delivery.ordersTable.paymentModal.continueBtn')}
        cancelText={t('delivery.ordersTable.paymentModal.cancelBtn')}
        okButtonProps={{ disabled: paymentModal.amount <= 0 }}
      >
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-1">{t('delivery.ordersTable.paymentModal.orderLabel')}{paymentModal.order?.id}</p>
          <p className="font-medium mb-4">{paymentModal.order?.clientName}</p>
          <Divider />
          <p className="text-sm mb-2">{t('delivery.ordersTable.paymentModal.totalAmount')} <span className="font-medium">{(paymentModal.order?.montant_total || 0).toLocaleString()} CFA</span></p>
          <p className="text-sm mb-4">{t('delivery.ordersTable.paymentModal.alreadyPaid')} <span className="font-medium">{(paymentModal.order?.montant_paye || 0).toLocaleString()} CFA</span></p>
          <p className="text-sm mb-4 font-semibold text-red-600">{t('delivery.ordersTable.paymentModal.remainingDue')} {(paymentModal.order?.montant_restant || 0).toLocaleString()} CFA</p>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('delivery.ordersTable.paymentModal.amountToCollect')}
          </label>
          <InputNumber
            className="w-full"
            value={paymentModal.amount}
            onChange={(val) => setPaymentModal(prev => ({ ...prev, amount: val || 0 }))}
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
            addonAfter="CFA"
          />
          {/* Paiement exact */}
          {paymentModal.amount > 0 && paymentModal.amount === (paymentModal.order?.montant_restant || 0) && (
            <p className="text-xs text-green-600 mt-2 font-semibold">
              {t('delivery.ordersTable.paymentModal.fullPaymentSuccess')}
            </p>
          )}
          {/* Paiement partiel */}
          {paymentModal.amount > 0 && paymentModal.amount < (paymentModal.order?.montant_restant || 0) && (
            <p className="text-xs text-blue-600 mt-2">
              {t('delivery.ordersTable.paymentModal.remainingAfterPayment')} <strong>{((paymentModal.order?.montant_restant || 0) - paymentModal.amount).toLocaleString()} CFA</strong>
            </p>
          )}
          {/* Trop-perçu */}
          {paymentModal.amount > (paymentModal.order?.montant_restant || 0) && (
            <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-700 font-semibold">
                {t('delivery.ordersTable.paymentModal.overpaymentWarning')}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {t('delivery.ordersTable.paymentModal.surplusText')} <strong>{(paymentModal.amount - (paymentModal.order?.montant_restant || 0)).toLocaleString()} CFA</strong> {t('delivery.ordersTable.paymentModal.surplusSubtext')}
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Payment Confirmation Modal — Étape 2 : Confirmation finale */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-orange-600">
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>{t('delivery.ordersTable.confirmModal.title')}</span>
          </div>
        }
        open={confirmPaymentModal.visible}
        onOk={handleCompletePayment}
        onCancel={() => {
          setConfirmPaymentModal({ visible: false, order: null, amount: 0 });
          setPaymentModal({ visible: true, order: confirmPaymentModal.order, amount: confirmPaymentModal.amount });
        }}
        confirmLoading={isSubmitting}
        okText={t('delivery.ordersTable.confirmModal.confirmBtn')}
        cancelText={t('delivery.ordersTable.confirmModal.backBtn')}
        okButtonProps={{ className: 'bg-green-600 hover:bg-green-700 border-none' }}
      >
        <div className="py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-700 font-medium">{t('delivery.ordersTable.confirmModal.warningInfo')}</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{t('delivery.ordersTable.confirmModal.clientLabel')}</span>
              <span className="font-semibold text-gray-900">{confirmPaymentModal.order?.clientName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{t('delivery.ordersTable.confirmModal.orderLabel')}</span>
              <span className="font-mono text-xs text-gray-600">#{confirmPaymentModal.order?.id?.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{t('delivery.ordersTable.confirmModal.remainingLabel')}</span>
              <span className="font-medium text-red-500">{(confirmPaymentModal.order?.montant_restant || 0).toLocaleString()} CFA</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3">
              <span className="text-sm font-bold text-green-800">{t('delivery.ordersTable.confirmModal.amountLabel')}</span>
              <span className="text-xl font-bold text-green-700">{confirmPaymentModal.amount.toLocaleString()} CFA</span>
            </div>
            {/* Paiement partiel */}
            {confirmPaymentModal.amount > 0 && confirmPaymentModal.amount < (confirmPaymentModal.order?.montant_restant || 0) && (
              <div className="flex justify-between items-center py-2 bg-blue-50 rounded-lg px-3">
                <span className="text-sm text-blue-700">{t('delivery.ordersTable.confirmModal.remainingAfterLabel')}</span>
                <span className="font-semibold text-blue-900">{((confirmPaymentModal.order?.montant_restant || 0) - confirmPaymentModal.amount).toLocaleString()} CFA</span>
              </div>
            )}
            {/* Paiement exact */}
            {confirmPaymentModal.amount > 0 && confirmPaymentModal.amount === (confirmPaymentModal.order?.montant_restant || 0) && (
              <p className="text-sm text-center text-green-600 font-bold bg-green-50 rounded-lg py-2">
                {t('delivery.ordersTable.confirmModal.fullPaymentLabel')}
              </p>
            )}
            {/* Trop-perçu / Avance */}
            {confirmPaymentModal.amount > (confirmPaymentModal.order?.montant_restant || 0) && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-3 space-y-1">
                <p className="text-sm font-bold text-amber-700">{t('delivery.ordersTable.confirmModal.overpaymentWarning')}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-amber-600">{t('delivery.ordersTable.confirmModal.debtCleared')}</span>
                  <span className="text-xs font-semibold text-green-700">✓ {(confirmPaymentModal.order?.montant_restant || 0).toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-amber-600">{t('delivery.ordersTable.confirmModal.surplusCredit')}</span>
                  <span className="text-xs font-bold text-amber-800">{(confirmPaymentModal.amount - (confirmPaymentModal.order?.montant_restant || 0)).toLocaleString()} CFA</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal
        title={t('delivery.ordersTable.refundModal.title')}
        open={refundModal.visible}
        onOk={handleRefund}
        onCancel={() => setRefundModal({ visible: false, order: null })}
        confirmLoading={isSubmitting}
        okText={t('delivery.ordersTable.refundModal.refundBtn', { amount: (refundModal.order?.retour || 0).toLocaleString() })}
        cancelText={t('delivery.ordersTable.refundModal.cancelBtn')}
      >
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-1">{t('delivery.ordersTable.refundModal.orderLabel')}{refundModal.order?.id}</p>
          <p className="font-medium mb-4">{refundModal.order?.clientName}</p>
          <Divider />
          <p className="text-base font-semibold text-gray-800">
            {t('delivery.ordersTable.refundModal.amountLabel')} <span className="text-[#0F172A] font-bold">{(refundModal.order?.retour || 0).toLocaleString()} CFA</span>
          </p>
          <p className="text-xs text-gray-500 mt-4">
            {t('delivery.ordersTable.refundModal.warningText')}
          </p>
        </div>
      </Modal>

      {/* Return Modal */}
      {returnModal.visible && returnModal.order && (
        <ReturnModal
          order={returnModal.order}
          onConfirm={handleReturnConfirm}
          onCancel={() => setReturnModal({ visible: false, order: null })}
          showSuccessMessage={(msg) => message.success(msg)}
          showErrorMessage={(msg) => message.error(msg)}
        />
      )}
    </div>
  );
};

export default OrdersTable;


