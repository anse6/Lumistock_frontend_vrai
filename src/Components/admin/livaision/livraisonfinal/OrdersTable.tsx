import React, { useState } from "react";
import {
  Table,
  Tag,
  Modal,
  Button,
  Dropdown,
  Space,
  App,
  InputNumber,
  Divider,
} from "antd";
import {
  MoreVertical,
  Eye,
  DollarSign,
  RotateCcw,
  Edit,
  HandCoins,
  Ban,
  Printer,
} from "lucide-react";
import { Order } from "./types";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getUrlServer } from "../../../../configServer";
import ReturnModal, { ProduitRetour } from "./ReturnModal";
import RefundModal, { ModeRemboursement } from "./RefundModal";

// Message du serveur ({ error } ou { error: { champ: [...] } }) ou texte par défaut.
const messageServeur = (error: unknown, defaut: string): string => {
  const data = axios.isAxiosError(error) ? error.response?.data : undefined;
  const detail = data?.error ?? data?.message;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") return Object.values(detail).flat().join(" ");
  return defaut;
};
import { ColumnsType } from "antd/es/table";
import { apiVente, estCaissier } from "../venteRole";
import { imprimerTicketVente } from "../../../../Modules/Caisse/ticket";
import { etatVente } from "../../../../services/ventes";
import useCompteConnecte from "../../../../hooks/useCompteConnecte";

const API_URL = getUrlServer();

interface OrdersTableProps {
  orders: Order[];
  activeMenu: number | null;
  onMenuToggle: (index: number) => void;
  onDelete: (orderId: string) => void;
  onShowDetails: (order: Order) => void;
  onCompletePayment: (
    orderId: string,
    remainingAmount: number,
  ) => Promise<void>;
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
  const { t, i18n } = useTranslation();
  // Le `message` statique d'antd 5 ne s'affiche pas sous React 19 : on passe par le contexte <App>.
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [paymentModal, setPaymentModal] = useState<{
    visible: boolean;
    order: Order | null;
    amount: number;
  }>({
    visible: false,
    order: null,
    amount: 0,
  });
  const [confirmPaymentModal, setConfirmPaymentModal] = useState<{
    visible: boolean;
    order: Order | null;
    amount: number;
  }>({
    visible: false,
    order: null,
    amount: 0,
  });
  const [refundAFaireSuivre, setRefundAFaireSuivre] = useState(false);
  const [refundModal, setRefundModal] = useState<{
    visible: boolean;
    order: Order | null;
  }>({
    visible: false,
    order: null,
  });
  const [returnModal, setReturnModal] = useState<{
    visible: boolean;
    order: Order | null;
  }>({
    visible: false,
    order: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompletePayment = async () => {
    if (!confirmPaymentModal.order) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error(t("admin.deliveries.messages.tokenError"));

      const response = await axios.post(
        apiVente().paiement(confirmPaymentModal.order.id),
        { montant: confirmPaymentModal.amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Réponse { livraison } (ancien format : [{ livraison }, statut]).
      const corps = Array.isArray(response.data) ? response.data[0] : response.data;
      if (corps?.livraison) {
        message.success(t("admin.modals.payment.success"));
        if (onCompletePayment)
          await onCompletePayment(
            confirmPaymentModal.order.id,
            confirmPaymentModal.amount,
          );
        onOrderUpdated();
        setConfirmPaymentModal({ visible: false, order: null, amount: 0 });
        setPaymentModal({ visible: false, order: null, amount: 0 });
      } else {
        throw new Error(t("admin.modals.payment.error"));
      }
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      message.error(t("admin.modals.payment.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Les erreurs sont relancées : la fenêtre reste ouverte et affiche le message.
  const handleRefund = async (
    livraisonId: string,
    data: { mode: ModeRemboursement; montant: number; motif: string; reference?: string; telephone?: string },
  ) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.post(`${API_URL}/livraisons/refund/${livraisonId}`, data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      message.success(response.data?.message || "Remboursement enregistré");
      // Liste rechargée à la fermeture : la recharger maintenant afficherait le
      // chargement de la page et fermerait la fenêtre du reçu.
      setRefundAFaireSuivre(true);
      // La fenêtre reste ouverte pour imprimer ou télécharger le reçu : on lui
      // passe la vente à jour (totaux et historique des remboursements).
      const base = refundModal.order as Order;
      const remboursement = response.data?.remboursement;
      if (!remboursement) return;
      let vente: Order = {
        ...base,
        retour: Number(response.data?.restant) || 0,
        montant_rembourse: (Number(base.montant_rembourse) || 0) + (Number(remboursement.montant) || 0),
        remboursements: [...(base.remboursements || []), remboursement],
      };
      try {
        const detail = await axios.get(`${API_URL}/livraisons/${livraisonId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (detail.data?.id) vente = { ...base, ...detail.data, clientName: base.clientName };
      } catch {
        // Reçu construit avec les données locales si le rechargement échoue.
      }
      return { order: vente, remboursement };
    } catch (error) {
      console.error("Erreur lors du remboursement:", error);
      throw new Error(messageServeur(error, "Le remboursement n'a pas pu être enregistré."));
    }
  };

  const handleReturnConfirm = async (livraison_id: string, motif: string, produits: ProduitRetour[], retenue_pourcentage: number) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.post(
        `${API_URL}/livraisons/retour`,
        { livraison_id, motif, produits, retenue_pourcentage },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } },
      );
      const aRembourser = Number(response.data?.montant_a_rembourser) || 0;
      const frais = Number(response.data?.frais_retour) || 0;
      const detailFrais = frais > 0 ? ` (frais de retour de ${frais.toLocaleString("fr-FR")} CFA retenus)` : "";
      message.success(
        aRembourser > 0
          ? `Retour enregistré. ${aRembourser.toLocaleString("fr-FR")} CFA sont à rembourser au client${detailFrais}.`
          : `Retour enregistré, stock réintégré${detailFrais}.`,
      );
      onReturnSuccess();
      onOrderUpdated();
      setReturnModal({ visible: false, order: null });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du retour:", error);
      throw new Error(messageServeur(error, "Le retour n'a pas pu être enregistré."));
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error(t("admin.deliveries.messages.tokenError"));

      const response = await axios.get(apiVente().detail(orderId), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data) {
        const orderData: Order = {
          ...response.data,
          clientInitials: response.data.client.nom
            .split(" ")
            .map((word: string) => word.charAt(0).toUpperCase())
            .join("")
            .slice(0, 2),
          clientName: response.data.client.nom,
          quantity: response.data.quantite,
          paymentStatus: response.data.statut_paiement,
          methode_paiement: response.data.methode_paiement,
          amount: response.data.montant_total,
          date: new Date(response.data.date_commande).toLocaleDateString(
            i18n.language === "fr" ? "fr-FR" : "en-US",
          ),
          status: response.data.statut_livraison,
        };
        onShowDetails(orderData);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error);
      message.error(t("delivery.ordersTable.messages.fetchDetailsError"));
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: t("admin.table.clientName"),
      key: "client",
      fixed: "left",
      render: (_, record) => (
        <Space>
          <Tag color="green">{record.clientInitials}</Tag>
          <span className="text-sm font-medium">{record.clientName}</span>
        </Space>
      ),
    },
    {
      title: t("admin.table.quantity"),
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: t("admin.table.payment"),
      dataIndex: "paymentStatus",
      key: "paymentStatus",

      render: (status) => {
        let color = "default";
        let label = status;
        const s = status?.toLowerCase();
        if (s === "payé" || s === "paye") {
          color = "success";
          label = t("delivery.searchAndFilters.paymentPaid");
        } else if (s === "partiel") {
          color = "warning";
          label = t("delivery.searchAndFilters.paymentPartial");
        } else if (s === "en attente" || s === "non payé") {
          color = "error";
          label = t("delivery.searchAndFilters.paymentUnpaid");
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: t("admin.table.amount"),
      dataIndex: "montant_produits",
      key: "montant",

      render: (val: number) =>
        `${val.toLocaleString()} ${t("delivery.productSelection.currency")}`,
    },
    {
      title: t("admin.table.date"),
      dataIndex: "date",
      key: "date",
    },
    {
      title: t("admin.table.paidAmount"),
      dataIndex: "montant_paye",
      key: "montant_paye",

      render: (val: number) =>
        `${val.toLocaleString()} ${t("delivery.productSelection.currency")}`,
    },
    {
      title: t("admin.table.debt"),
      dataIndex: "montant_restant",
      key: "montant_restant",

      render: (val: number) =>
        `${val.toLocaleString()} ${t("delivery.productSelection.currency")}`,
    },
    {
      title: t("admin.table.oldDebt"),
      dataIndex: "dette_ancienne",
      key: "dette_ancienne",

      render: (val: number) => (
        <span
          className={val > 0 ? "text-red-600 font-medium" : "text-gray-600"}
        >
          {val.toLocaleString()} {t("delivery.productSelection.currency")}
        </span>
      ),
    },
    {
      // Montant dû au client après un retour (trop-perçu non encore remboursé).
      title: "À rembourser",
      dataIndex: "retour",
      key: "retour",

      render: (val: number, record: Order) => (
        <div className="flex flex-col">
          <span className={Number(val) > 0 ? "font-semibold text-amber-600" : "text-gray-400"}>
            {(Number(val) || 0).toLocaleString("fr-FR")} {t("delivery.productSelection.currency")}
          </span>
          {(Number(record.montant_rembourse) || 0) > 0 && (
            <span className="text-[11px] font-semibold text-emerald-600">
              Remboursé : {Number(record.montant_rembourse).toLocaleString("fr-FR")}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "État",
      dataIndex: "status",
      key: "status",

      // État de la vente (validée, retour, annulée) : le paiement a sa propre colonne.
      render: (status: string) => {
        const etat = etatVente(status);
        return (
          <Tag color={etat.couleur} className="font-bold">
            {etat.libelle}
          </Tag>
        );
      },
    },
    {
      title: t("admin.table.action"),
      key: "action",
      fixed: "right",

      render: (_, record) => {
        const aRembourser = Number(record.retour) || 0;
        const caissier = estCaissier();
        const items = [
          {
            key: "details",
            label: (
              <span style={{ color: "#3b0764", fontWeight: 600 }}>{t("admin.table.viewDetails")}</span>
            ),
            icon: <Eye size={16} style={{ color: "#3b0764" }} />,
            onClick: () => {
              fetchOrderDetails(record.id);
            },
          },
          // Ticket 80 mm pour imprimante de caisse (le même que celui du caissier).
          {
            key: "ticket",
            label: "Imprimer le ticket",
            icon: <Printer size={16} />,
            onClick: () => {
              const cle = `ticket-${record.id}`;
              message.loading({ content: "Préparation du ticket…", key: cle });
              imprimerTicketVente(record.id, caissier)
                .then(() => message.destroy(cle))
                .catch(() => message.error({ content: "Le ticket n'a pas pu être préparé.", key: cle }));
            },
          },
          // Retour et remboursement : réservés à l'admin et au manager ; modifier
          // suit le droit « Modifier une vente » (Paramètres > Accès).
          ...(caissier || !peut("ventes.modifier") ? [] : [{
            key: "edit",
            label: t("admin.table.edit"),
            icon: <Edit size={16} />,
            onClick: () =>
              navigate(`/admin/dashboard/deliverys/update/${record.id}`),
          }]),
        ];

        if (record.montant_restant > 0) {
          items.push({
            key: "payment",
            label: t("admin.table.finishPayment"),
            icon: <DollarSign size={16} />,
            onClick: () =>
              setPaymentModal({
                visible: true,
                order: record,
                amount: record.montant_restant,
              }),
          } as any);
        }

        // « Rembourser » n'apparaît que s'il reste de l'argent dû au client
        // après un retour.
        if (aRembourser > 0 && !caissier) {
          items.push({
            key: "refund",
            label: (
              <span className="font-semibold text-emerald-700">
                Rembourser {aRembourser.toLocaleString("fr-FR")} CFA
              </span>
            ),
            icon: <HandCoins size={16} className="text-emerald-700" />,
            onClick: () => setRefundModal({ visible: true, order: record }),
          } as any);
        }

        if (!caissier) items.push({
          key: "return",
          label: t("admin.table.makeReturn"),
          icon: <RotateCcw size={16} />,
          disabled: !(record.produits || []).some((p) => Number(p.quantite) > 0),
          onClick: () => setReturnModal({ visible: true, order: record }),
        } as any);

        // Caissier : annulation possible seulement pendant le délai (15 min après la vente).
        const annulable = peut("ventes.annuler") && (!caissier || !!record.annulable_jusqua);
        if (annulable) {
          items.push({
            key: "divider",
            type: "divider",
          } as any);

          items.push({
            key: "delete",
            label: caissier ? "Annuler la vente (15 min)" : "Annuler la vente",
            icon: <Ban size={16} />,
            danger: true,
            onClick: () => onDelete(record.id),
          } as any);
        }

        return (
          <Dropdown menu={{ items: items as any }} trigger={["click"]}>
            <Button
              type="text"
              icon={<MoreVertical size={20} style={{ color: "#3b0764" }} />}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="w-full h-full overflow-hidden border border-gray-100 rounded-[10px] flex flex-col bg-white">
      <Table
        columns={columns.filter(
          // « Dette ancienne » : ancienne méthode, la colonne ne sert qu'aux ventes qui en ont une.
          (c) => c.key !== "dette_ancienne" || orders.some((o) => (o.dette_ancienne ?? 0) > 0),
        )}
        dataSource={orders}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total, range) =>
            t("admin.table.paginationInfo", {
              start: range[0],
              end: range[1],
              total,
            }),
        }}
        scroll={{ x: "max-content" }}
        className="custom-antd-table"
        size="small"
      />

      {/* Payment Modal — Étape 1 : Saisie du montant */}
      <Modal
        title={
          <Space>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950 text-white">
              <DollarSign size={18} />
            </span>
            <span style={{ fontSize: "18px", fontWeight: 600 }}>
              {t("admin.deliveries.modals.payment.title")}
            </span>
          </Space>
        }
        open={paymentModal.visible}
        onOk={() => {
          setPaymentModal((prev) => ({ ...prev, visible: false }));
          setConfirmPaymentModal({
            visible: true,
            order: paymentModal.order,
            amount: paymentModal.amount,
          });
        }}
        onCancel={() =>
          setPaymentModal({ visible: false, order: null, amount: 0 })
        }
        confirmLoading={false}
        okText={`${t("admin.deliveries.flow.continue")} →`}
        cancelText={t("admin.deliveries.modals.delete.cancel")}
        okButtonProps={{
          disabled: paymentModal.amount <= 0,
          className: "rounded-lg",
          style: paymentModal.amount > 0 ? { backgroundColor: "#3b0764" } : undefined,
        }}
        cancelButtonProps={{ className: "rounded-lg" }}
        width={500}
        className="premium-modal"
      >
        <div className="py-4">
          <div className="mb-6 p-4 bg-purple-50/60 rounded-xl border border-purple-100">
            <span className="text-secondary text-xs block mb-1">
              {t("admin.deliveries.modals.return.orderLabel")} #
              {paymentModal.order?.id}
            </span>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>
              {paymentModal.order?.clientName}
            </span>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 p-3 bg-purple-50/40 border border-purple-100 rounded-xl">
              <span className="text-xs text-secondary block mb-1">
                {t("admin.deliveries.modals.payment.totalAmount")}
              </span>
              <span className="text-base font-bold">
                {paymentModal.order?.montant_total?.toLocaleString()}{" "}
                {t("delivery.productSelection.currency")}
              </span>
            </div>
            <div className="flex-1 p-3 bg-green-50/30 border border-green-100 rounded-xl">
              <span className="text-xs text-secondary block mb-1">
                {t("admin.deliveries.modals.payment.paidAmount")}
              </span>
              <span className="text-base font-bold text-green-600">
                {paymentModal.order?.montant_paye?.toLocaleString()}{" "}
                {t("delivery.productSelection.currency")}
              </span>
            </div>
          </div>

          <div className="w-full p-3 bg-red-50/30 border border-red-100 rounded-xl mb-6">
            <span className="text-xs text-secondary block mb-1">
              {t("admin.deliveries.modals.payment.remainingDebt")}
            </span>
            <span className="text-xl font-bold text-red-600">
              {paymentModal.order?.montant_restant?.toLocaleString()}{" "}
              {t("delivery.productSelection.currency")}
            </span>
          </div>

          <Divider style={{ margin: "24px 0" }} />

          <div className="mb-4">
            <label className="block font-semibold mb-2">
              {t("admin.deliveries.modals.payment.amountToCollect")}
            </label>
            <InputNumber
              className="w-full text-lg h-12 flex items-center"
              value={paymentModal.amount}
              onChange={(val) =>
                setPaymentModal((prev) => ({ ...prev, amount: val || 0 }))
              }
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                value?.replace(/\$\s?|(,*)/g, "") as unknown as number
              }
              addonAfter={t("delivery.productSelection.currency")}
              size="large"
              autoFocus
            />
          </div>

          {paymentModal.amount > 0 && (
            <div className="mt-4">
              {paymentModal.amount ===
              (paymentModal.order?.montant_restant || 0) ? (
                <Tag
                  color="success"
                  className="w-full text-center py-1 rounded-lg border-none font-medium"
                >
                  {t("admin.deliveries.modals.payment.fullPayment")}
                </Tag>
              ) : paymentModal.amount <
                (paymentModal.order?.montant_restant || 0) ? (
                <Tag
                  color="processing"
                  className="w-full text-center py-1 rounded-lg border-none font-medium"
                >
                  {t("admin.deliveries.modals.payment.partialPayment", {
                    amount: (
                      (paymentModal.order?.montant_restant || 0) -
                      paymentModal.amount
                    ).toLocaleString(),
                  })}
                </Tag>
              ) : (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span className="font-semibold text-amber-700 block mb-1">
                    {t("admin.deliveries.modals.payment.overpayment")}
                  </span>
                  <span className="text-amber-600 text-xs">
                    {t("admin.deliveries.modals.payment.overpaymentInfo", {
                      amount: (
                        paymentModal.amount -
                        (paymentModal.order?.montant_restant || 0)
                      ).toLocaleString(),
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Payment Confirmation Modal — Étape 2 : Confirmation finale */}
      <Modal
        title={
          <Space>
            <div className="p-2 bg-amber-100 rounded-lg">
              <span style={{ fontSize: 18 }}>⚠️</span>
            </div>
            <span
              style={{ fontSize: "18px", fontWeight: 600 }}
              className="text-amber-700"
            >
              {t("admin.deliveries.modals.payment.confirmTitle")}
            </span>
          </Space>
        }
        open={confirmPaymentModal.visible}
        onOk={handleCompletePayment}
        onCancel={() => {
          setConfirmPaymentModal({ visible: false, order: null, amount: 0 });
          setPaymentModal({
            visible: true,
            order: confirmPaymentModal.order,
            amount: confirmPaymentModal.amount,
          });
        }}
        confirmLoading={isSubmitting}
        okText={t("admin.deliveries.modals.payment.yesConfirm")}
        cancelText={`← ${t("admin.deliveries.modals.delete.cancel")}`}
        okButtonProps={{
          className:
            "bg-green-600 hover:bg-green-700 border-none rounded-lg h-9",
        }}
        cancelButtonProps={{ className: "rounded-lg h-9" }}
        width={450}
        className="premium-modal"
      >
        <div className="py-2">
          <div className="mb-6 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
            {t("admin.deliveries.modals.payment.confirmWarning")}
          </div>

          <div className="space-y-4 px-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-secondary text-sm">
                {t("admin.deliveries.modals.detail.clientSection")}
              </span>
              <span className="font-semibold text-sm">
                {confirmPaymentModal.order?.clientName}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-secondary text-sm">
                {t("admin.deliveries.modals.return.orderLabel")}
              </span>
              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                #{confirmPaymentModal.order?.id?.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-secondary text-sm">
                {t("admin.deliveries.modals.payment.remainingDebt")}
              </span>
              <span className="font-semibold text-red-500 text-sm">
                {confirmPaymentModal.order?.montant_restant.toLocaleString()}{" "}
                {t("delivery.productSelection.currency")}
              </span>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-green-800 text-sm">
                  {t("admin.deliveries.modals.payment.amountToCollect")}
                </span>
                <span className="font-bold text-green-700 text-xl">
                  {confirmPaymentModal.amount.toLocaleString()}{" "}
                  {t("delivery.productSelection.currency")}
                </span>
              </div>

              {confirmPaymentModal.amount > 0 &&
                confirmPaymentModal.amount <
                  (confirmPaymentModal.order?.montant_restant || 0) && (
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-green-200/50">
                    <span className="text-secondary text-xs">
                      {t("admin.deliveries.modals.payment.remainingDebt")}
                    </span>
                    <span className="font-semibold text-xs text-orange-600">
                      {(
                        (confirmPaymentModal.order?.montant_restant || 0) -
                        confirmPaymentModal.amount
                      ).toLocaleString()}{" "}
                      {t("delivery.productSelection.currency")}
                    </span>
                  </div>
                )}

              {confirmPaymentModal.amount ===
                (confirmPaymentModal.order?.montant_restant || 0) && (
                <div className="mt-2 pt-2 border-t border-green-200/50 text-center">
                  <span className="font-semibold text-green-600 text-xs uppercase tracking-wider">
                    {t("admin.deliveries.modals.payment.fullPayment")}
                  </span>
                </div>
              )}
            </div>

            {confirmPaymentModal.amount >
              (confirmPaymentModal.order?.montant_restant || 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <span className="font-semibold text-amber-700 text-xs block">
                  {t("admin.deliveries.modals.payment.overpayment")}
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-amber-600">
                    {t("admin.deliveries.modals.payment.confirmDebtCleared")}
                  </span>
                  <span className="font-semibold text-xs text-green-700">
                    ✓{" "}
                    {(
                      confirmPaymentModal.order?.montant_restant || 0
                    ).toLocaleString()}{" "}
                    {t("delivery.productSelection.currency")}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-amber-200/50">
                  <span className="text-xs text-amber-600 font-bold">
                    {t("admin.deliveries.modals.payment.confirmSurplusCredit")}
                  </span>
                  <span className="font-semibold text-sm text-amber-800">
                    {(
                      confirmPaymentModal.amount -
                      (confirmPaymentModal.order?.montant_restant || 0)
                    ).toLocaleString()}{" "}
                    {t("delivery.productSelection.currency")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Remboursement */}
      {refundModal.visible && refundModal.order && (
        <RefundModal
          order={refundModal.order}
          onConfirm={handleRefund}
          onCancel={() => {
            setRefundModal({ visible: false, order: null });
            if (refundAFaireSuivre) {
              setRefundAFaireSuivre(false);
              onOrderUpdated();
            }
          }}
        />
      )}

      {/* Return Modal */}
      {returnModal.visible && returnModal.order && (
        <ReturnModal
          order={returnModal.order}
          onConfirm={handleReturnConfirm}
          onCancel={() => setReturnModal({ visible: false, order: null })}
        />
      )}
    </div>
  );
};

export default OrdersTable;
