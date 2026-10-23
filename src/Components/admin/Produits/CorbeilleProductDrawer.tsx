import React, { useState, useEffect } from "react";
import { X, RefreshCw, Trash2 } from "lucide-react";
import { Spin, Table, Button, Empty, message, Drawer, Modal, ConfigProvider } from "antd";
import axios from "axios";
import { getUrlServer } from "../../../configServer";
import { useTranslation } from "react-i18next";
import useCompteConnecte from "../../../hooks/useCompteConnecte";

const PURPLE_950 = "#3b0764"; // Tailwind purple-950
const PURPLE_900 = "#581c87"; // Tailwind purple-900

interface CorbeilleProductDrawerProps {
  onClose: () => void;
  onRestoreSuccess: () => void;
}

const CorbeilleProductDrawer: React.FC<CorbeilleProductDrawerProps> = ({
  onClose,
  onRestoreSuccess,
}) => {
  const { peut } = useCompteConnecte();
  const autorise = peut("produits.supprimer");
  const { t, i18n } = useTranslation();
  const [deletedProducts, setDeletedProducts] = useState<any[]>([]);
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
      const res = await axios.get(`${getUrlServer()}/produits/corbeille`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setDeletedProducts(res.data || []);
    } catch (error) {
      console.error(
        "Erreur lors du chargement de la corbeille produits:",
        error,
      );
      message.error(t("admin.products.corbeille.messages.loadError"));
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
        `${getUrlServer()}/produits/corbeille/${id}/restaurer`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      message.success(t("admin.products.corbeille.messages.restoreSuccess"));
      setDeletedProducts((prev) =>
        prev.filter((item) => {
          const itemId = item.id || (item._id?.$oid ? item._id.$oid : item._id);
          return itemId !== id;
        }),
      );
      onRestoreSuccess();
    } catch (error: any) {
      console.error("Erreur lors de la restauration:", error);
      message.error(
        error.response?.data?.error ||
          t("admin.products.corbeille.messages.restoreError"),
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
      const url = `${getUrlServer()}/produits/corbeille/${id}/definitive`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        message.success(t("admin.products.corbeille.successDeleteDefinitive"));
        setDeletedProducts((prev) =>
          prev.filter((item) => {
            const itemId =
              item.id || (item._id?.$oid ? item._id.$oid : item._id);
            return itemId !== id;
          }),
        );
      } else {
        message.error(
          result.error || t("admin.products.corbeille.failDeleteDefinitive"),
        );
      }
    } catch (error: any) {
      console.error("Erreur lors de la suppression définitive:", error);
      message.error(t("admin.products.corbeille.failDeleteDefinitive"));
    } finally {
      setDeletingId(null);
      setIdToDelete(null);
    }
  };

  const columns = [
    {
      title: t("admin.products.corbeille.table.product"),
      key: "produit",
      render: (_text: any, record: any) => (
        <div className="flex items-center gap-3">
          {record.image ? (
            <img
              src={`${getUrlServer()}/uploads/images/${record.image}`}
              alt={record.nom}
              className="w-10 h-10 object-cover rounded-md"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
              <span className="text-xs text-gray-400">N/A</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-purple-950">{record.nom}</span>
            <span className="text-xs text-gray-500">
              {record.categorie_nom || record.categorie?.nom}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: t("admin.products.corbeille.table.quantity"),
      dataIndex: "quantite",
      key: "quantite",
      render: (val: number) => (
        <span className="font-medium text-gray-700">{val || 0}</span>
      ),
    },
    {
      title: t("admin.products.corbeille.table.price"),
      dataIndex: "prix",
      key: "prix",
      render: (val: number) => (
        <span className="font-semibold text-purple-950">
          {val?.toLocaleString(i18n.language === "fr" ? "fr-FR" : "en-US")}{" "}
          {t("delivery.productSelection.currency") || "CFA"}
        </span>
      ),
    },
    {
      title: t("admin.products.corbeille.table.action"),
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
              disabled={!autorise || isRestoring || isDeleting}
            >
              {t("admin.products.corbeille.restore")}
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
              disabled={!autorise || isRestoring || isDeleting}
            >
              {t("admin.products.corbeille.deleteDefinitive")}
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
              {t("admin.products.corbeille.title")}
            </h2>
            <p className="text-sm text-gray-500 font-normal">
              {t("admin.products.corbeille.subtitle")}
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
        ) : deletedProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-500 text-lg">
                  {t("admin.products.corbeille.empty")}
                </span>
              }
            />
          </div>
        ) : (
          <Table
            dataSource={deletedProducts}
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
        title={t("admin.products.corbeille.confirmDeleteTitle")}
        open={deleteModalVisible}
        onOk={confirmDeleteDefinitive}
        onCancel={() => setDeleteModalVisible(false)}
        okText={t("admin.products.corbeille.deleteDefinitive")}
        cancelText={t("admin.products.corbeille.close") || "Fermer"}
        okButtonProps={{ danger: true }}
        centered
      >
        <p>{t("admin.products.corbeille.confirmDeleteMessage")}</p>
      </Modal>
    </Drawer>
    </ConfigProvider>
  );
};

export default CorbeilleProductDrawer;
