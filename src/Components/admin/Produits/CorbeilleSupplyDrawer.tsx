import React, { useState, useEffect } from "react";
import { X, RefreshCw, Trash2 } from "lucide-react";
import { Spin, Table, Button, Empty, message, Drawer, Tag, Modal, ConfigProvider } from "antd";
import axios from "axios";
import { getUrlServer } from "../../../configServer";
import { useTranslation } from "react-i18next";

const PURPLE_950 = "#3b0764"; // Tailwind purple-950
const PURPLE_900 = "#581c87"; // Tailwind purple-900

interface CorbeilleSupplyDrawerProps {
  onClose: () => void;
  onRestoreSuccess: () => void;
}

const CorbeilleSupplyDrawer: React.FC<CorbeilleSupplyDrawerProps> = ({
  onClose,
  onRestoreSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const [deletedSupplies, setDeletedSupplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const fetchCorbeille = async () => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await axios.get(
        `${getUrlServer()}/approvisionnements/corbeille`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      setDeletedSupplies(res.data || []);
    } catch (error) {
      console.error(
        "Erreur lors du chargement de la corbeille approvisionnements:",
        error,
      );
      message.error(t("admin.supplies.corbeille.messages.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorbeille();
  }, []);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      await axios.post(
        `${getUrlServer()}/approvisionnements/corbeille/${id}/restaurer`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      message.success(t("admin.supplies.corbeille.messages.restoreSuccess"));
      setDeletedSupplies((prev) =>
        prev.filter((item) => {
          const itemId = item.id || (item._id?.$oid ? item._id.$oid : item._id);
          return itemId !== id;
        }),
      );
      onRestoreSuccess();
    } catch (error: any) {
      console.error("Erreur lors de la restauration:", error);
      message.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("admin.supplies.corbeille.messages.restoreError"),
      );
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteDefinitive = (id: string) => {
    if (!id) return;
    setIdToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDeleteDefinitive = async () => {
    if (!idToDelete) return;
    const id = idToDelete;

    setDeletingId(id);
    setDeleteModalVisible(false);

    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      const url = `${getUrlServer()}/approvisionnements/corbeille/${id}/definitive`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        message.success(t("admin.supplies.corbeille.successDeleteDefinitive"));
        setDeletedSupplies((prev) =>
          prev.filter((item) => {
            const itemId =
              item.id || (item._id?.$oid ? item._id.$oid : item._id);
            return itemId !== id;
          }),
        );
      } else {
        message.error(
          result.error || t("admin.supplies.corbeille.failDeleteDefinitive"),
        );
      }
    } catch (error: any) {
      console.error("Erreur lors de la suppression définitive:", error);
      message.error(t("admin.supplies.corbeille.failDeleteDefinitive"));
    } finally {
      setDeletingId(null);
      setIdToDelete(null);
    }
  };

  const columns = [
    {
      title: t("admin.supplies.table.columns.deliverer") || "Livreur",
      key: "deliverer",
      render: (_text: any, record: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-purple-950">
            {record.first_name || "N/A"} {record.last_name || ""}
          </span>
          <span className="text-xs text-gray-500">
            ID: {record.id || (record._id?.$oid ? record._id.$oid : record._id)}
          </span>
        </div>
      ),
    },
    {
      title: t("admin.supplies.table.columns.quantity") || "Quantité",
      dataIndex: "quantite",
      key: "quantite",
      render: (val: number) => <Tag color="blue">{val || 0}</Tag>,
    },
    {
      title: t("admin.supplies.table.columns.amount") || "Montant",
      dataIndex: "montant",
      key: "montant",
      render: (val: number) => (
        <span className="font-semibold text-purple-950">
          {(val || 0).toLocaleString(
            i18n.language === "fr" ? "fr-FR" : "en-US",
          )}{" "}
          {t("delivery.productSelection.currency") || "CFA"}
        </span>
      ),
    },
    {
      title: t("admin.supplies.table.columns.date") || "Date",
      dataIndex: "created_at",
      key: "date",
      render: (val: string) => (
        <span className="text-sm text-gray-600">
          {val
            ? new Date(val).toLocaleDateString(
                i18n.language === "fr" ? "fr-FR" : "en-US",
              )
            : "N/A"}
        </span>
      ),
    },
    {
      title: t("admin.supplies.table.columns.action") || "Action",
      key: "action",
      render: (_: any, record: any) => {
        const id =
          record.id || (record._id?.$oid ? record._id.$oid : record._id);
        const isRestoring = restoringId === id;
        const isDeleting = deletingId === id;
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              type="primary"
              icon={
                isRestoring ? (
                  <RefreshCw className="animate-spin h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )
              }
              size="small"
              className="flex items-center"
              onClick={() => handleRestore(id)}
              disabled={isRestoring || isDeleting}
            >
              {t("admin.supplies.corbeille.restore")}
            </Button>
            <Button
              danger
              type="primary"
              icon={
                isDeleting ? (
                  <Spin size="small" className="text-white" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )
              }
              size="small"
              className="flex items-center"
              onClick={() => handleDeleteDefinitive(id)}
              disabled={isRestoring || isDeleting}
            >
              {t("admin.supplies.corbeille.deleteDefinitive")}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    // Couleur de l'application (purple-950) pour les boutons principaux,
    // la pagination et les indicateurs ; la suppression définitive reste rouge.
    // (le thème global fixe aussi Button.colorPrimary : on le surcharge ici)
    <ConfigProvider
      theme={{
        token: { colorPrimary: PURPLE_950, colorPrimaryHover: PURPLE_900 },
        components: { Button: { colorPrimary: PURPLE_950, colorPrimaryHover: PURPLE_900 } },
      }}
    >
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Trash2 className="h-6 w-6 text-purple-950" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-purple-950">
              {t("admin.supplies.corbeille.title")}
            </h2>
            <p className="text-sm text-gray-500 font-normal">
              {t("admin.supplies.corbeille.subtitle")}
            </p>
          </div>
        </div>
      }
      placement="right"
      width={720}
      onClose={onClose}
      open={true}
      closeIcon={<X className="h-5 w-5" />}
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose} size="large" className="rounded-lg">
            {t("admin.products.delete_modal.close_btn") || "Fermer"}
          </Button>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto w-full h-full">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : deletedSupplies.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-500 text-lg">
                  {t("admin.supplies.corbeille.empty")}
                </span>
              }
            />
          </div>
        ) : (
          <Table
            dataSource={deletedSupplies}
            columns={columns}
            rowKey={(record) =>
              record.id || (record._id?.$oid ? record._id.$oid : record._id)
            }
            pagination={{ pageSize: 8 }}
            className="font-sans shadow-sm rounded-lg overflow-hidden border border-gray-100"
          />
        )}
      </div>

      <Modal
        title={t("admin.supplies.corbeille.confirmDeleteTitle")}
        open={deleteModalVisible}
        onOk={confirmDeleteDefinitive}
        onCancel={() => setDeleteModalVisible(false)}
        okText={t("admin.supplies.corbeille.deleteDefinitive")}
        cancelText={t("admin.supplies.corbeille.close") || "Fermer"}
        okButtonProps={{ danger: true }}
        centered
      >
        <p>{t("admin.supplies.corbeille.confirmDeleteMessage")}</p>
      </Modal>
    </Drawer>
    </ConfigProvider>
  );
};

export default CorbeilleSupplyDrawer;
