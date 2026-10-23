import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUrlServer } from "../../../configServer";
import {
  Table,
  Tag,
  Button,
  Dropdown,
  Modal,
  message,
  Space,
  Typography,
  Drawer,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import images from "@/assets/no_data.png";
import { MoreVertical, Eye, Trash2, X, Edit, Download, UserCheck, Truck } from "lucide-react";
import { ConfigProvider } from "antd";
import {
  generateSupplyPdf,
  supplyReference,
  type SupplyPdfData,
  type SupplyPdfStore,
} from "./supplyPdf";

const APP_COLOR = "#3b1558";

const { Text, Title } = Typography;

interface Supply {
  id: string;
  deliverer: string;
  quantity: number;
  amount: string;
  date: string;
  stockTotal: number;
}

interface SupplyTableProps {
  supplies: Supply[];
  onActionClick?: (action: string, itemId: string) => void;
  onSupplyDeleted?: (itemId: string) => void;
}

interface SupplyDetails extends SupplyPdfData {
  first_name: string;
  last_name: string;
  quantite_stock_total: number;
  produits: Array<{
    produit_id: string;
    quantite: number;
    nom: string;
    unite?: string;
    prix: number;
    prix_achat?: number;
    quantite_livreur: number;
  }>;
}

const SupplyTable: React.FC<SupplyTableProps> = ({
  supplies,
  onSupplyDeleted,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [supplyDetails, setSupplyDetails] = useState<SupplyDetails | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoading] = useState<boolean>(false);

  // States for the new Delete Modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const handleDeleteSupply = async () => {
    if (!idToDelete) return;
    const itemId = idToDelete;

    setIsDeleting(itemId);
    setDeleteModalVisible(false);

    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) throw new Error(t("admin.supplies.messages.not_auth"));

      const response = await fetch(
        `${getUrlServer()}/approvisionnements/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `${t("common.error")} HTTP: ${response.status}`,
        );
      }

      message.success(t("admin.supplies.messages.delete_success"));
      if (onSupplyDeleted) onSupplyDeleted(itemId);
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : t("admin.supplies.messages.delete_error"),
      );
    } finally {
      setIsDeleting(null);
      setIdToDelete(null);
      // Removed setIsLoading(true) here as it was likely a bug
    }
  };

  const showDeleteConfirm = (id: string) => {
    setIdToDelete(id);
    setDeleteModalVisible(true);
  };

  const fetchSupplyDetails = async (itemId: string) => {
    setDetailsLoading(true);
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) throw new Error(t("admin.supplies.messages.not_auth"));

      const response = await fetch(
        `${getUrlServer()}/approvisionnements/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok)
        throw new Error(`${t("common.error")} HTTP: ${response.status}`);

      const data = await response.json();
      const details = Array.isArray(data) ? data[0] : data;
      setSupplyDetails(details);
      setShowDetailsDrawer(true);
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : t("admin.supplies.messages.load_error"),
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!supplyDetails) {
      message.warning(
        t("admin.supplies.messages.no_details", "Aucun détail disponible pour la facture"),
      );
      return;
    }

    setIsGeneratingPDF(true);
    const hideMessage = message.loading(
      t("admin.supplies.messages.generating_pdf", "Génération du bon en cours..."),
      0,
    );
    try {
      // Informations officielles de l'entreprise (nom, forme juridique,
      // immatriculation, téléphone, logo…) lues depuis le profil du magasin.
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const storeRes = await fetch(`${getUrlServer()}/magasin/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const storeData = storeRes.ok ? await storeRes.json() : null;
      const store: SupplyPdfStore = storeData?.magasin || {
        denomination: localStorage.getItem("denomination_magasin") || undefined,
      };
      const logoUrl = store.logo || localStorage.getItem("logo_magasin") || null;

      await generateSupplyPdf(supplyDetails, store, logoUrl);
      message.success(t("admin.supplies.messages.pdf_success", "Bon d'approvisionnement téléchargé"));
    } catch (error) {
      console.error("Erreur de génération du PDF :", error);
      message.error(t("admin.supplies.messages.pdf_error", "Erreur lors de la génération du document"));
    } finally {
      setIsGeneratingPDF(false);
      hideMessage();
    }
  };

  const columns: ColumnsType<Supply> = [
    {
      title: t("admin.supplies.table.columns.id"),
      dataIndex: "id",
      key: "id",
      width: 120,
      ellipsis: true,
    },
    {
      title: t("admin.supplies.table.columns.deliverer"),
      dataIndex: "deliverer",
      key: "deliverer",
      width: 200,
    },
    {
      title: t("admin.supplies.table.columns.quantity"),
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity,
    },
    // {
    //   title: t('admin.supplies.table.columns.stock_total'),
    //   dataIndex: 'stockTotal',
    //   key: 'stockTotal',
    //   width: 120,
    //   sorter: (a, b) => a.stockTotal - b.stockTotal,
    // },
    {
      title: t("admin.supplies.table.columns.amount"),
      dataIndex: "amount",
      key: "amount",
      width: 120,
    },
    {
      title: t("admin.supplies.table.columns.date"),
      dataIndex: "date",
      key: "date",
      width: 120,
    },
    {
      title: t("admin.supplies.table.columns.action"),
      key: "action",
      fixed: "right",
      width: 80,
      render: (_, record) => {
        const items = [
          {
            key: "details",
            label: t("admin.supplies.table.actions.details"),
            icon: <Eye size={16} />,
            onClick: () => fetchSupplyDetails(record.id),
          },
          {
            key: "edit",
            label: t("admin.supplies.table.actions.edit", "Modifier"),
            icon: <Edit size={16} className="text-blue-500" />,
            onClick: () =>
              navigate(
                `/admin/dashboard/produits_approvisionnements/edit_approv/${record.id}`,
              ),
          },
          {
            key: "delete",
            label: t("admin.supplies.table.actions.delete"),
            icon: <Trash2 size={16} />,
            onClick: () => showDeleteConfirm(record.id),
            danger: true,
          },
        ];

        return (
          <Dropdown menu={{ items: items as any }} trigger={["click"]}>
            <Button
              type="text"
              icon={<MoreVertical size={20} className="text-gray-500" />}
              loading={isDeleting === record.id}
            />
          </Dropdown>
        );
      },
    },
  ];

  const detailColumns: ColumnsType<any> = [
    {
      title: t("admin.supplies.details.columns.product"),
      dataIndex: "nom",
      key: "nom",
      render: (text) => (
        <Space>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: APP_COLOR }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: t("admin.supplies.details.columns.qty_supply"),
      dataIndex: "quantite",
      key: "quantite",
      align: "center",
      render: (val) => (
        <Tag color="purple">
          {val.toLocaleString(i18n.language === "fr" ? "fr-FR" : "en-US")}
        </Tag>
      ),
    },
    {
      title: t("admin.supplies.details.columns.stock_deliverer"),
      dataIndex: "quantite_livreur",
      key: "quantite_livreur",
      align: "center",
      render: (val) => (
        <Tag>
          {(val ?? 0).toLocaleString(
            i18n.language === "fr" ? "fr-FR" : "en-US",
          )}
        </Tag>
      ),
    },
    {
      title: t("admin.supplies.details.columns.price_purchase"),
      dataIndex: "prix_achat",
      key: "prix_achat",
      align: "right",
      render: (val) => (
        <Text className="whitespace-nowrap">
          {(val ?? 0).toLocaleString(
            i18n.language === "fr" ? "fr-FR" : "en-US",
          )}{" "}
          {t("delivery.productSelection.currency")}
        </Text>
      ),
    },
    {
      title: t("admin.supplies.details.columns.price_sale"),
      dataIndex: "prix",
      key: "prix",
      align: "right",
      render: (val) => (
        <Text className="whitespace-nowrap">
          {(val ?? 0).toLocaleString(
            i18n.language === "fr" ? "fr-FR" : "en-US",
          )}{" "}
          {t("delivery.productSelection.currency")}
        </Text>
      ),
    },
    {
      title: t("admin.supplies.details.columns.total"),
      key: "total",
      align: "right",
      render: (_, record) => (
        <Text strong className="whitespace-nowrap">
          {(record.quantite * record.prix).toLocaleString(
            i18n.language === "fr" ? "fr-FR" : "en-US",
          )}{" "}
          {t("delivery.productSelection.currency")}
        </Text>
      ),
    },
  ];

  return (
    <div className="bg-white p-4">
      {/* Couleur de l'application pour le panneau de détails et ses boutons */}
      <ConfigProvider
        theme={{
          token: { colorPrimary: APP_COLOR },
          components: { Button: { colorPrimary: APP_COLOR, colorPrimaryHover: "#5b2286" } },
        }}
      >
      <Table
        columns={columns}
        dataSource={supplies}
        rowKey="id"
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10 }}
        className="custom-antd-table border border-gray-100 rounded-lg overflow-hidden"
        loading={isLoading}
        locale={{
          emptyText: (
            <div className="flex flex-col justify-center items-center py-16">
              <img
                src={images}
                alt="No Data"
                className="h-32 w-32 object-contain mb-3 opacity-80"
              />
              <span className="text-gray-400 text-sm">
                {t("admin.supplies.table.empty.title")}
              </span>
              <p className="text-sm text-gray-400 mt-1">
                {t("admin.supplies.table.empty.subtitle")}
              </p>
            </div>
          ),
        }}
      />

      <Drawer
        title={
          <div className="flex flex-col">
            <span className="text-white text-lg font-semibold">
              {t("admin.supplies.details.title")}
            </span>
            <span className="text-purple-100 text-xs font-normal">
              {t("admin.supplies.details.reference")}{" "}
              {supplyDetails ? supplyReference(supplyDetails.id) : ""}
            </span>
          </div>
        }
        placement="right"
        width={window.innerWidth > 900 ? 850 : "100%"}
        onClose={() => setShowDetailsDrawer(false)}
        open={showDetailsDrawer}
        loading={detailsLoading}
        styles={{
          header: {
            background: `linear-gradient(to right, ${APP_COLOR}, #5b2286)`,
            padding: "20px 24px",
            borderBottom: "none",
          },
          body: {
            padding: "0",
          },
          mask: {
            backdropFilter: "blur(4px)",
          },
        }}
        closeIcon={<X className="text-white hover:text-gray-200" size={20} />}
        footer={
          <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
            <Button
              type="primary"
              icon={<Download size={18} />}
              onClick={handleDownloadInvoice}
              loading={isGeneratingPDF}
              size="large"
            >
              Télécharger le bon (PDF)
            </Button>
            <Button onClick={() => setShowDetailsDrawer(false)} size="large">
              {t("admin.products.delete_modal.close_btn")}
            </Button>
          </div>
        }
      >
        {supplyDetails && (
          <div className="p-6 space-y-8">
            {/* Les deux parties de l'approvisionnement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { titre: "Approvisionné par", icone: <Truck size={18} />, personne: supplyDetails.approvisionne_par },
                {
                  titre: "Reçu par",
                  icone: <UserCheck size={18} />,
                  personne: supplyDetails.livreur || {
                    nom_complet: `${supplyDetails.first_name} ${supplyDetails.last_name}`.trim(),
                    role: "Gérant",
                  },
                },
              ].map(({ titre, icone, personne }) => (
                <div key={titre} className="flex gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: APP_COLOR }}>
                    {icone}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-purple-900/70">{titre}</div>
                    <div className="truncate font-semibold text-slate-800">{personne?.nom_complet || "Non renseigné"}</div>
                    <div className="truncate text-xs text-slate-500">
                      {[personne?.role, personne?.telephone, personne?.email].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {supplyDetails.modifie_par && supplyDetails.updated_at && (
              <div className="-mt-5 text-xs text-slate-500">
                Modifié par {supplyDetails.modifie_par.nom_complet} le{" "}
                {new Date(supplyDetails.updated_at).toLocaleString(i18n.language === "fr" ? "fr-FR" : "en-US")}
              </div>
            )}

            <div className="bg-purple-50/40 rounded-xl p-6 border border-purple-100 transition-all hover:shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <Text
                    type="secondary"
                    className="text-xs uppercase tracking-widest font-bold"
                  >
                    {t("admin.supplies.details.magasinier")}
                  </Text>
                  <div>
                    <Text strong className="text-base text-slate-800">
                      {supplyDetails.first_name} {supplyDetails.last_name}
                    </Text>
                  </div>
                </div>
                <div className="space-y-2">
                  <Text
                    type="secondary"
                    className="text-xs uppercase tracking-widest font-bold"
                  >
                    {t("admin.supplies.details.total_amount")}
                  </Text>
                  <div>
                    <Text className="text-2xl font-black" style={{ color: APP_COLOR }}>
                      {(supplyDetails.montant ?? 0).toLocaleString(
                        i18n.language === "fr" ? "fr-FR" : "en-US",
                      )}{" "}
                      {t("delivery.productSelection.currency")}
                    </Text>
                  </div>
                </div>
                <div className="space-y-2">
                  <Text
                    type="secondary"
                    className="text-xs uppercase tracking-widest font-bold"
                  >
                    {t("admin.supplies.details.qty_supplied")}
                  </Text>
                  <div>
                    <Text strong className="text-xl text-slate-700">
                      {supplyDetails.quantite}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        {supplyDetails.quantite > 1
                          ? t("admin.supplies.details.items_plural")
                          : t("admin.supplies.details.items_singular")}
                      </span>
                    </Text>
                  </div>
                </div>
                <div className="space-y-2">
                  <Text
                    type="secondary"
                    className="text-xs uppercase tracking-widest font-bold"
                  >
                    {t("admin.supplies.details.stock_total_label")}
                  </Text>
                  <div>
                    <Text strong className="text-xl" style={{ color: APP_COLOR }}>
                      {(supplyDetails.quantite_stock_total ?? 0).toLocaleString(
                        i18n.language === "fr" ? "fr-FR" : "en-US",
                      )}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        {t("admin.supplies.details.items_plural")}
                      </span>
                    </Text>
                  </div>
                </div>
              </div>

              <Divider className="my-6" />

              <div className="flex flex-col">
                <Text
                  type="secondary"
                  className="text-xs uppercase tracking-widest font-bold mb-2"
                >
                  {t("admin.supplies.details.date_label")}
                </Text>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: APP_COLOR }}></div>
                  <Text className="text-slate-700 font-medium">
                    {new Date(supplyDetails.created_at).toLocaleDateString(
                      i18n.language === "fr" ? "fr-FR" : "en-US",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </Text>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Title level={4} className="!m-0 text-slate-800">
                  {t("admin.supplies.details.product_details_title", {
                    count: supplyDetails.produits.length,
                  })}
                </Title>
              </div>
              <Table
                columns={detailColumns}
                dataSource={supplyDetails.produits}
                pagination={false}
                size="middle"
                rowKey={(_, index) => index || ""}
                className="custom-details-table border border-gray-100 rounded-xl overflow-hidden shadow-sm"
              />
            </div>

            <div
              className="rounded-xl p-8 shadow-xl overflow-hidden relative"
              style={{ background: `linear-gradient(135deg, ${APP_COLOR}, #5b2286)` }}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Eye size={120} className="text-white" />
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                <div className="text-center md:text-left">
                  <Title level={4} className="!m-0 !text-white opacity-90">
                    {t("admin.supplies.details.summary")}
                  </Title>
                  <Text className="!text-white !font-medium !text-base">
                    {supplyDetails.produits.length}{" "}
                    {i18n.language === "fr" ? "produit" : "product"}
                    {supplyDetails.produits.length > 1 ? "s" : ""} •{" "}
                    {supplyDetails.quantite.toLocaleString(
                      i18n.language === "fr" ? "fr-FR" : "en-US",
                    )}{" "}
                    {supplyDetails.quantite > 1
                      ? t("admin.supplies.details.items_plural")
                      : t("admin.supplies.details.items_singular")}
                  </Text>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-sm text-purple-200 uppercase tracking-widest font-bold mb-1">
                    {t("admin.supplies.details.total_amount")}
                  </div>
                  <div className="text-3xl font-black text-white drop-shadow-sm">
                    {(supplyDetails.montant ?? 0).toLocaleString(
                      i18n.language === "fr" ? "fr-FR" : "en-US",
                    )}{" "}
                    <span className="text-xl">CFA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
      </ConfigProvider>

      <Modal
        title={t("admin.supplies.confirm_delete.title")}
        open={deleteModalVisible}
        onOk={handleDeleteSupply}
        onCancel={() => setDeleteModalVisible(false)}
        okText={t("admin.supplies.table.actions.delete")}
        cancelText={t("delivery.deliveryConfig.formActionCancel")}
        okButtonProps={{ danger: true, loading: !!isDeleting }}
        centered
      >
        <p>{t("admin.supplies.confirm_delete.content")}</p>
      </Modal>
    </div>
  );
};

export default SupplyTable;
