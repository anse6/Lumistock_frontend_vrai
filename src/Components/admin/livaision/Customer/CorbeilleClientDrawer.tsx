import React, { useState, useEffect } from "react";
import { X, RefreshCw, Trash2, User } from "lucide-react";
import { Spin, Table, Button, Empty, Drawer, Avatar, App } from "antd";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getUrlServer } from "../../../../configServer";
import useCompteConnecte from "../../../../hooks/useCompteConnecte";

interface CorbeilleClientDrawerProps {
  onClose: () => void;
  onRestoreSuccess: () => void;
}

const CorbeilleClientDrawer: React.FC<CorbeilleClientDrawerProps> = ({
  onClose,
  onRestoreSuccess,
}) => {
  const { peut } = useCompteConnecte();
  const autorise = peut("clients.supprimer");
  const { t } = useTranslation();
  // Messages via le contexte <App> (les fonctions statiques d'antd ne s'affichent pas sous React 19).
  const { message } = App.useApp();
  const [deletedClients, setDeletedClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchCorbeille = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${getUrlServer()}/clients/corbeille`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setDeletedClients(res.data || []);
    } catch (error) {
      console.error(
        "Erreur lors du chargement de la corbeille clients:",
        error,
      );
      message.error(
        t("admin.customers.trash.failed", {
          defaultValue: "Impossible de charger la corbeille des clients.",
        }),
      );
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
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${getUrlServer()}/clients/corbeille/${id}/restaurer`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      message.success(
        t("admin.customers.modals.restore.success", {
          defaultValue: "Client restauré avec succès",
        }),
      );
      setDeletedClients((prev) =>
        prev.filter((item) => (item._id || item.id) !== id),
      );
      onRestoreSuccess();
    } catch (error: any) {
      console.error("Erreur lors de la restauration:", error);
      message.error(
        error.response?.data?.error ||
          t("admin.customers.trash.failed", {
            defaultValue: "Échec de la restauration.",
          }),
      );
    } finally {
      setRestoringId(null);
    }
  };

  const columns = [
    {
      title: t("admin.customers.trash.client"),
      key: "client",
      render: (_text: any, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={
              record.photo_profil
                ? `${getUrlServer()}/uploads/images/${record.photo_profil}`
                : null
            }
            icon={<User />}
            className="bg-gray-200"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-[#3b0764]">{record.nom}</span>
            <span className="text-xs text-gray-500">{record.telephone}</span>
          </div>
        </div>
      ),
    },
    {
      title: t("admin.customers.trash.location"),
      key: "location",
      render: (_text: any, record: any) => (
        <span className="text-sm text-gray-600">
          {record.ville}, {record.quartier}
        </span>
      ),
    },
    {
      title: t("admin.customers.table.action"),
      key: "action",
      render: (_: any, record: any) => {
        const id = record._id || record.id;
        const isRestoring = restoringId === id;
        return (
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
            disabled={!autorise || isRestoring}
          >
            {t("admin.customers.trash.restore")}
          </Button>
        );
      },
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Trash2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t("admin.customers.trash.title")}
            </h2>
            <p className="text-sm text-gray-500 font-normal">
              {t("admin.customers.trash.description")}
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
            {t("admin.customers.modals.edit.close")}
          </Button>
        </div>
      }
    >
      <div className="w-full h-full">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : deletedClients.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-500 text-lg">
                  {t("admin.customers.trash.empty")}
                </span>
              }
            />
          </div>
        ) : (
          <Table
            dataSource={deletedClients}
            columns={columns}
            rowKey={(record) => record._id || record.id}
            pagination={{ pageSize: 8 }}
            className="font-sans shadow-sm rounded-lg overflow-hidden border border-gray-100"
          />
        )}
      </div>
    </Drawer>
  );
};

export default CorbeilleClientDrawer;
