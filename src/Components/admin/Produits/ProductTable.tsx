import React, { useEffect, useMemo, useState } from "react";
import {
  MoreVertical,
  AlertTriangle,
  Box,
} from "lucide-react";
import { Link } from "react-router-dom";
import defaultImage from "./../../../Modules/Delivery/images/riz.png";
import { getUrlServer } from "../../../configServer";
import ExpiredProductModal from "./ExpiredProductModal";
import SoldeAvarieModal from "./SoldeAvarieModal";
import ProductStatusTag from "./ProductStatusTag";
import InlineSupplierForm from "../proapprov/product/parts/InlineSupplierForm";
import {
  Table,
  Tag,
  Button,
  Dropdown,
  Modal,
  InputNumber,
  Avatar,
  message,
  Tooltip,
  Form,
  Input,
  Select,
  Divider,
  ConfigProvider,
  Spin,
} from "antd";
import {
  PlusOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  InboxOutlined,
  DeleteOutlined,
  CheckSquareOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { api, messageErreur } from "../../../api/client";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import images from "@/assets/no_data.png";
import axios from "axios";
import useCompteConnecte from "../../../hooks/useCompteConnecte";
import { useQueryClient } from "@tanstack/react-query";
import ApercuCout from "../../../Modules/Valorisation/ApercuCout";
import SaisieNumeros from "../../../Modules/NumerosSerie/SaisieNumeros";
import { cleValorisation } from "../../../Modules/Valorisation/api";

const APP_COLOR = "#3b1558";
const APP_COLOR_LIGHT = "#f5f0fa";
const { Option } = Select;

export interface AvarieResume {
  quantite_totale: number;
  nombre: number;
  derniere_date?: string;
  dernier_type?: string;
  derniere_description?: string | null;
  /** Unités avariées (hors vols) pas encore mises en solde. */
  quantite_soldable?: number;
  quantite_mise_en_solde?: number;
  contient_perimes?: boolean;
  produit_solde_id?: string | null;
}

interface Product {
  id: string;
  image: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  remainingQuantity: number;
  price: number;
  purchasePrice: number;
  lastPurchasePrice?: number;
  suiviSerie?: boolean;
  status: "in_stock" | "out_of_stock";
  avarie?: AvarieResume | null;
  /** Produit créé par la mise en solde d'unités avariées. */
  estSolde?: boolean;
}

// Libellés des motifs proposés dans ExpiredProductModal.
const MOTIFS_AVARIE: Record<string, string> = {
  perime: "Article périmé",
  casse: "Casse / bris",
  vol: "Vol / perte",
  deteriore: "Détérioration / avarie",
  autre: "Autre motif",
};

interface Fournisseur {
  _id: string;
  nom: string;
  ville?: string;
}

interface ProductTableProps {
  products: Product[];
  onActionClick: (action: string, itemId: string) => void;
  onProvisionSuccess?: () => void;
  isAdmin: boolean;
  /** Affiche la colonne de détail des avaries (vue « Avaries »). */
  showAvaries?: boolean;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onActionClick,
  onProvisionSuccess,
  isAdmin,
  showAvaries = false,
}) => {
  const { peut } = useCompteConnecte();
  const { t, i18n } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const quantiteSaisie = Form.useWatch("quantity", form);
  const prixSaisi = Form.useWatch("prix_achat", form);
  const [modal, modalContextHolder] = Modal.useModal();

  // Sélection par cases à cocher, pour mettre plusieurs articles à la
  // corbeille d'un coup. Réservée à qui a le droit de supprimer.
  const peutSupprimer = peut("produits.supprimer");
  const [selection, setSelection] = useState<React.Key[]>([]);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const idsVisibles = useMemo(() => products.map((p) => p.id), [products]);

  // Un filtre ou un rechargement retire de la sélection les articles qui ne
  // sont plus affichés : on ne supprime jamais un article qu'on ne voit pas.
  useEffect(() => {
    setSelection((avant) => {
      const visibles = new Set(idsVisibles);
      const gardes = avant.filter((id) => visibles.has(String(id)));
      return gardes.length === avant.length ? avant : gardes;
    });
  }, [idsVisibles]);

  const toutSelectionne = idsVisibles.length > 0 && selection.length === idsVisibles.length;

  const supprimerSelection = () => {
    const ids = selection.map(String);
    if (!ids.length) return;
    const noms = products.filter((p) => ids.includes(p.id)).map((p) => p.name);
    modal.confirm({
      title: ids.length === 1 ? "Supprimer 1 article ?" : `Supprimer ${ids.length} articles ?`,
      icon: <DeleteOutlined style={{ color: "#dc2626" }} />,
      content: (
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            {ids.length === 1
              ? "Cet article sera mis à la corbeille. Vous pourrez le restaurer depuis « Articles supprimés »."
              : "Ces articles seront mis à la corbeille. Vous pourrez les restaurer depuis « Articles supprimés »."}
          </p>
          <ul className="max-h-40 overflow-y-auto list-disc pl-5 text-gray-700">
            {noms.slice(0, 20).map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
          {noms.length > 20 && <p className="mt-1 text-gray-400">… et {noms.length - 20} autre(s)</p>}
        </div>
      ),
      okText: "Supprimer",
      okButtonProps: { danger: true },
      cancelText: "Annuler",
      onOk: async () => {
        setSuppressionEnCours(true);
        try {
          const { data } = await api.post("/produits/supprimer-plusieurs", { ids });
          messageApi.success(data.message || `${ids.length} article(s) mis à la corbeille.`);
          setSelection([]);
          onProvisionSuccess?.();
        } catch (err) {
          messageApi.error(messageErreur(err, "La suppression n'a pas pu être faite."));
          onProvisionSuccess?.(); // liste peut-être périmée : on la recharge
        } finally {
          setSuppressionEnCours(false);
        }
      },
    });
  };

  // Provision modal state
  const [showProvisionModal, setShowProvisionModal] = useState<boolean>(false);
  const [selectedProductForProvision, setSelectedProductForProvision] =
    useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fournisseurs state
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);
  const [previousFournisseur, setPreviousFournisseur] =
    useState<Fournisseur | null>(null);
  const [loadingPreviousFournisseur, setLoadingPreviousFournisseur] =
    useState(false);

  // Inline new fournisseur
  const [showNewFournisseur, setShowNewFournisseur] = useState(false);
  const [, setNewFournisseurNom] = useState("");
  const [, setNewFournisseurVille] = useState("");

  // Avarie modal state
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    currentStock: number;
    suiviSerie?: boolean;
  } | null>(null);

  // Mise en solde des unités avariées
  const [produitASolder, setProduitASolder] = useState<Product | null>(null);

  const getImageSrc = (imageUrl: string) => {
    if (imageUrl && imageUrl.trim() !== "") {
      if (imageUrl.startsWith("http")) return imageUrl;
      const cleanedPath = imageUrl.replace(/^\/?uploads/i, "uploads");
      return `${getUrlServer()}/${cleanedPath}`;
    }
    return defaultImage;
  };

  const fetchFournisseurs = async () => {
    setLoadingFournisseurs(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${getUrlServer()}/fournisseurs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFournisseurs(res.data);
    } catch (err) {
      console.error("Erreur fournisseurs:", err);
    } finally {
      setLoadingFournisseurs(false);
    }
  };

  const fetchPreviousFournisseur = async (productId: string) => {
    setLoadingPreviousFournisseur(true);
    setPreviousFournisseur(null);
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${getUrlServer()}/produits/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prod = res.data;
      if (prod.fournisseur_id) {
        // Trouver dans la liste
        const found = fournisseurs.find(
          (f) =>
            f._id === prod.fournisseur_id ||
            f._id === String(prod.fournisseur_id),
        );
        if (found) {
          setPreviousFournisseur(found);
          form.setFieldsValue({ fournisseur_id: found._id });
        } else {
          // Fetch direct
          try {
            const fRes = await axios.get(
              `${getUrlServer()}/fournisseurs/${prod.fournisseur_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            setPreviousFournisseur(fRes.data);
            form.setFieldsValue({ fournisseur_id: fRes.data._id });
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error("Erreur chargement article:", err);
    } finally {
      setLoadingPreviousFournisseur(false);
    }
  };

  const handleProvisionClick = async (product: Product) => {
    setSelectedProductForProvision(product);
    setShowNewFournisseur(false);
    setNewFournisseurNom("");
    setNewFournisseurVille("");
    form.resetFields();
    // Dernier prix payé pré-rempli : il suffit de le corriger si le
    // fournisseur a changé de prix pour ce lot. (Le coût d'achat de l'article,
    // lui, est calculé selon la méthode du magasin.)
    form.setFieldsValue({ prix_achat: product.lastPurchasePrice ?? product.purchasePrice ?? 0 });
    setShowProvisionModal(true);

    // Load fournisseurs list first, then fetch previous supplier
    await fetchFournisseurs();
    await fetchPreviousFournisseur(product.id);
  };


  const handleProvisionSubmit = async () => {
    try {
      const values = await form.validateFields();
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        messageApi.error(t("admin.products.messages.auth_required"));
        return;
      }
      if (!selectedProductForProvision) return;

      setIsLoading(true);

      const body: Record<string, any> = {
        quantite: values.quantity,
      };
      if (values.fournisseur_id) body.fournisseur_id = values.fournisseur_id;
      if (values.montant) body.montant = values.montant;
      // Prix d'achat de ce lot : sert au calcul du coût (CMUP / FIFO / LIFO).
      if (values.prix_achat !== undefined && values.prix_achat !== null) body.prix_achat = values.prix_achat;
      if (values.note) body.note = values.note;
      if (selectedProductForProvision.suiviSerie) body.numeros_serie = values.numeros_serie || [];
      if (values.livreur) body.first_name = values.livreur;

      const response = await fetch(
        `${getUrlServer()}/produits/${selectedProductForProvision.id}/approvisionner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        messageApi.success(t("admin.products.messages.success_provision"));
        queryClient.invalidateQueries({ queryKey: cleValorisation(selectedProductForProvision.id) });
        onProvisionSuccess?.();
        setShowProvisionModal(false);
        setSelectedProductForProvision(null);
        form.resetFields();
      } else {
        const errorData = await response.json();
        messageApi.error(
          errorData.error ||
            errorData.message ||
            t("admin.products.messages.error_unknown"),
        );
      }
    } catch (err) {
      if ((err as any)?.errorFields) return;
      console.error("Erreur approvisionnement:", err);
      messageApi.error(t("admin.products.messages.error_server"));
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnsType<Product> = [
    // {
    //   title: t("admin.products.table.columns.alert"),
    //   key: "alert",
    //   width: 120,
    //   render: (_: unknown, record: Product) =>
    //     record.remainingQuantity < 30 ? (
    //       <Tooltip title={t("admin.products.table.alerts.low_stock_title")}>
    //         <Tag color="error" icon={<AlertTriangle size={14} />}>
    //           {t("admin.products.table.alerts.low_stock_tag")}
    //         </Tag>
    //       </Tooltip>
    //     ) : (
    //       <Tooltip title={t("admin.products.table.alerts.ok_stock_title")}>
    //         <Tag color="success" icon={<CheckCircle size={14} />}>
    //           {t("admin.products.table.alerts.ok_stock_tag")}
    //         </Tag>
    //       </Tooltip>
    //     ),
    // },
    {
      title: t("admin.products.table.columns.image"),
      dataIndex: "image",
      key: "image",
      width: 80,
      render: (image: string) => (
        <Avatar
          src={getImageSrc(image)}
          shape="square"
          size={40}
          icon={<Box />}
          onError={() => true}
        />
      ),
    },
    {
      title: t("admin.products.table.columns.name"),
      dataIndex: "name",
      key: "name",
      width: 180,
      ellipsis: true,
      render: (name: string, record: Product) =>
        record.estSolde ? (
          <Tooltip title="Unités avariées remises en vente à prix réduit">
            <span>
              {name}{" "}
              <Tag className="!ml-1 !rounded-full !border-amber-200 !bg-amber-50 !text-amber-700">Soldé</Tag>
            </span>
          </Tooltip>
        ) : record.suiviSerie ? (
          <Tooltip title="Suivi par numéro de série : chaque unité est désignée à la vente">
            <span>
              {name}{" "}
              <Tag className="!ml-1 !rounded-full !border-purple-200 !bg-purple-50 !text-purple-800">N° de série</Tag>
            </span>
          </Tooltip>
        ) : (
          name
        ),
    },
    {
      title: t("admin.products.table.columns.description"),
      dataIndex: "description",
      key: "description",
      width: 180,
      ellipsis: true,
    },
    {
      title: t("admin.products.table.columns.category"),
      dataIndex: "category",
      key: "category",
      width: 130,
    },
    {
      title: t("admin.products.table.columns.remaining"),
      dataIndex: "remainingQuantity",
      key: "remainingQuantity",
      width: 100,
      sorter: (a: Product, b: Product) =>
        a.remainingQuantity - b.remainingQuantity,
    },
    {
      title: t("admin.products.table.columns.price_purchase"),
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      width: 140,
      render: (val: number) =>
        `${(val ?? 0).toLocaleString(i18n.language === "fr" ? "fr-FR" : "en-US")} ${t("delivery.productSelection.currency")}`,
    },
    {
      title: t("admin.products.table.columns.price_sale"),
      dataIndex: "price",
      key: "price",
      width: 140,
      render: (val: number) =>
        `${(val ?? 0).toLocaleString(i18n.language === "fr" ? "fr-FR" : "en-US")} ${t("delivery.productSelection.currency")}`,
    },
    {
      title: t("admin.products.table.columns.status"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => (
        <ProductStatusTag inStock={status === "in_stock"} />
      ),
    },
    ...(showAvaries
      ? [
          {
            title: "Avarie",
            key: "avarie",
            width: 220,
            sorter: (a: Product, b: Product) =>
              (a.avarie?.quantite_totale ?? 0) - (b.avarie?.quantite_totale ?? 0),
            render: (_: unknown, record: Product) => {
              const avarie = record.avarie;
              if (!avarie) return <span className="text-gray-400">—</span>;
              const date = avarie.derniere_date
                ? new Date(avarie.derniere_date).toLocaleDateString(
                    i18n.language === "fr" ? "fr-FR" : "en-US",
                  )
                : null;
              return (
                <Tooltip
                  title={
                    avarie.derniere_description
                      ? `Dernière déclaration : ${avarie.derniere_description}`
                      : undefined
                  }
                >
                  <div className="flex flex-col gap-1">
                    <Tag
                      icon={<AlertTriangle size={12} className="mr-1 inline" />}
                      className="!m-0 w-fit !rounded-full !border-purple-200 !bg-purple-50 !px-2 !font-semibold !text-purple-950"
                    >
                      {avarie.quantite_totale} retiré{avarie.quantite_totale > 1 ? "s" : ""}
                      {avarie.nombre > 1 ? ` · ${avarie.nombre} déclarations` : ""}
                    </Tag>
                    <span className="text-xs text-gray-500">
                      {MOTIFS_AVARIE[avarie.dernier_type ?? ""] ?? avarie.dernier_type}
                      {date ? ` · ${date}` : ""}
                    </span>
                    {(avarie.quantite_mise_en_solde ?? 0) > 0 || (avarie.quantite_soldable ?? 0) > 0 ? (
                      <span className="text-xs text-gray-500">
                        {(avarie.quantite_mise_en_solde ?? 0) > 0 &&
                          `${avarie.quantite_mise_en_solde} en solde`}
                        {(avarie.quantite_mise_en_solde ?? 0) > 0 && (avarie.quantite_soldable ?? 0) > 0 && " · "}
                        {(avarie.quantite_soldable ?? 0) > 0 && (
                          <span className="font-semibold text-amber-700">
                            {avarie.quantite_soldable} à solder
                          </span>
                        )}
                      </span>
                    ) : null}
                  </div>
                </Tooltip>
              );
            },
          },
        ]
      : []),
    {
      title: t("admin.products.table.columns.action"),
      key: "action",
      width: 70,
      fixed: "right" as const,
      render: (_: unknown, record: Product) => {
        const allItems = [
          peut("produits.modifier") && {
            key: "edit",
            label: (
              <Link
                to={`/admin/dashboard/produits_approvisionnements/edit/${record.id}`}
              >
                {t("admin.products.table.actions.edit")}
              </Link>
            ),
          },
          {
            key: "details",
            label: (
              <Link
                to={`/admin/dashboard/produits_approvisionnements/add_product/productdetail/${record.id}`}
              >
                {t("admin.products.table.actions.details")}
              </Link>
            ),
          },
          peut("stock.avaries") && {
            key: "expired",
            label: t("admin.products.table.actions.expired"),
            onClick: () => {
              setSelectedProduct({
                id: record.id,
                name: record.name,
                currentStock: record.remainingQuantity,
                suiviSerie: record.suiviSerie,
              });
              setShowExpiredModal(true);
            },
            danger: true,
          },
          peut("stock.soldes") &&
            (record.avarie?.quantite_soldable ?? 0) > 0 && {
              key: "solder",
              label: "Mettre en solde",
              onClick: () => setProduitASolder(record),
            },
          peut("stock.approvisionner") && {
            key: "provision",
            label: t("admin.products.table.actions.provision"),
            onClick: () => handleProvisionClick(record),
          },
          peut("produits.supprimer") && {
            key: "delete",
            label: t("admin.products.table.actions.delete"),
            onClick: () => onActionClick("delete", record.id),
            danger: true,
          },
        ];

        // Dans la vue « Avaries », seules les actions liées à l'avarie restent :
        // consulter le détail (historique), déclarer une avarie ou solder.
        const disponibles = allItems.filter((item) => !!item) as Exclude<(typeof allItems)[number], false>[];
        const items = showAvaries
          ? disponibles.filter((item) => ["details", "expired", "solder"].includes(String(item.key)))
          : disponibles;

        return (
          <Dropdown menu={{ items: items as any }} trigger={["click"]}>
            <Button
              type="text"
              icon={<MoreVertical size={20} className="text-gray-500" />}
            />
          </Dropdown>
        );
      },
    },
  ].filter((col) => isAdmin || col.key !== "purchasePrice");

  return (
    <ConfigProvider
      theme={{ token: { colorPrimary: APP_COLOR, borderRadius: 8 } }}
    >
      {contextHolder}
      {modalContextHolder}
      <div className="bg-white w-full" style={{ minHeight: 620 }}>
        {peutSupprimer && products.length > 0 && (
          <div
            className={`mb-3 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              selection.length ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"
            }`}
          >
            <span className={selection.length ? "font-semibold text-red-800" : "text-gray-500"}>
              {selection.length
                ? `${selection.length} article(s) sélectionné(s) sur ${idsVisibles.length}`
                : "Cochez des articles pour les supprimer en une fois."}
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              {!toutSelectionne && (
                <Button size="small" icon={<CheckSquareOutlined />} onClick={() => setSelection(idsVisibles)}>
                  {`Tout sélectionner (${idsVisibles.length})`}
                </Button>
              )}
              {selection.length > 0 && (
                <>
                  <Button size="small" icon={<CloseOutlined />} onClick={() => setSelection([])}>
                    Tout désélectionner
                  </Button>
                  <Button
                    size="small"
                    danger
                    type="primary"
                    icon={<DeleteOutlined />}
                    loading={suppressionEnCours}
                    onClick={supprimerSelection}
                  >
                    Supprimer la sélection
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        <Table
          columns={columns}
          dataSource={products}
          rowSelection={
            peutSupprimer
              ? {
                  selectedRowKeys: selection,
                  onChange: (cles) => setSelection(cles),
                  preserveSelectedRowKeys: true,
                  selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
                }
              : undefined
          }
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} sur ${total} articles`,
          }}
          className="custom-antd-table border border-gray-100 rounded-lg overflow-hidden"
          locale={{
            emptyText: (
              <div className="flex flex-col justify-center items-center py-16">
                <img
                  src={images}
                  alt="No Data"
                  className="h-32 w-32 object-contain mb-3 opacity-80"
                />
                <span className="text-gray-400 text-sm">
                  {t("admin.products.table.empty.title")}
                </span>
                <p className="text-sm text-gray-400 mt-1">
                  {t("admin.products.table.empty.subtitle")}
                </p>
              </div>
            ),
          }}
        />

        {/* Modal Approvisionner */}
        <Modal
          open={showProvisionModal}
          onCancel={() => {
            setShowProvisionModal(false);
            setSelectedProductForProvision(null);
            setShowNewFournisseur(false);
            form.resetFields();
          }}
          onOk={handleProvisionSubmit}
          confirmLoading={isLoading}
          title={
            <div className="flex items-center gap-3 pt-1 pb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: APP_COLOR_LIGHT }}
              >
                <ShoppingCartOutlined
                  style={{ color: APP_COLOR, fontSize: 20 }}
                />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base mb-0">
                  Approvisionner l'article
                </p>
                {selectedProductForProvision && (
                  <p className="text-xs text-gray-400 font-normal mb-0">
                    {selectedProductForProvision.name} · Stock actuel :{" "}
                    <span
                      className="font-semibold"
                      style={{ color: APP_COLOR }}
                    >
                      {selectedProductForProvision.remainingQuantity}
                    </span>
                  </p>
                )}
              </div>
            </div>
          }
          okText="Confirmer l'approvisionnement"
          cancelText="Annuler"
          okButtonProps={{
            style: { backgroundColor: APP_COLOR, borderColor: APP_COLOR },
            className: "font-semibold h-9",
          }}
          cancelButtonProps={{
            className:
              "!bg-gray-100 !text-gray-700 !border-none font-semibold h-9 hover:!bg-gray-200",
          }}
          width={560}
          destroyOnClose
        >
          <div className="pt-3 pb-1">
            {/* Encart article */}
            {selectedProductForProvision && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                style={{ backgroundColor: APP_COLOR_LIGHT }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${APP_COLOR}20` }}
                >
                  <InboxOutlined style={{ color: APP_COLOR, fontSize: 18 }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0">
                    Article à approvisionner
                  </p>
                  <p className="font-semibold text-gray-800 mb-0 text-sm">
                    {selectedProductForProvision.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0">Stock actuel</p>
                  <p className="font-bold mb-0" style={{ color: APP_COLOR }}>
                    {selectedProductForProvision.remainingQuantity}
                  </p>
                </div>
              </div>
            )}

            <Form form={form} layout="vertical" requiredMark={false}>
              {/* Fournisseur */}
              <Form.Item
                name="fournisseur_id"
                label={
                  <span className="font-semibold text-gray-700 text-sm">
                    Fournisseur{" "}
                    <span className="text-red-500 font-bold">*</span>
                    {previousFournisseur && (
                      <span
                        className="text-xs font-normal ml-2 px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: APP_COLOR_LIGHT,
                          color: APP_COLOR,
                        }}
                      >
                        Précédent : {previousFournisseur.nom}
                      </span>
                    )}
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: "Veuillez sélectionner un fournisseur",
                  },
                ]}
                className="!mb-2"
              >
                <Select
                  placeholder={
                    loadingPreviousFournisseur
                      ? "Chargement..."
                      : "Sélectionner ou changer de fournisseur"
                  }
                  showSearch
                  optionFilterProp="children"
                  loading={loadingFournisseurs || loadingPreviousFournisseur}
                  suffixIcon={
                    loadingPreviousFournisseur ? (
                      <Spin size="small" />
                    ) : (
                      <UserOutlined className="text-gray-400" />
                    )
                  }
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "8px 0" }} />
                      <Button
                        type="text"
                        block
                        icon={<PlusOutlined />}
                        style={{ color: APP_COLOR }}
                        className="font-medium"
                        onClick={() => {
                          setShowNewFournisseur(!showNewFournisseur);
                          const el = document.activeElement as HTMLElement;
                          if (el) el.blur();
                        }}
                      >
                        Nouveau fournisseur
                      </Button>
                    </>
                  )}
                >
                  {fournisseurs.map((f) => (
                    <Option key={f._id} value={f._id}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{f.nom}</span>
                        {f.ville && (
                          <span className="text-gray-400 text-xs">
                            {f.ville}
                          </span>
                        )}
                        {previousFournisseur?._id === f._id && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded ml-2"
                            style={{
                              backgroundColor: APP_COLOR_LIGHT,
                              color: APP_COLOR,
                            }}
                          >
                            Précédent
                          </span>
                        )}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Inline nouveau fournisseur */}
              {showNewFournisseur && (
                <InlineSupplierForm
                  appColor={APP_COLOR}
                  onCancel={() => setShowNewFournisseur(false)}
                  onSuccess={async (newId) => {
                    await fetchFournisseurs();
                    form.setFieldsValue({ fournisseur_id: newId });
                    setShowNewFournisseur(false);
                  }}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Quantité */}
                <Form.Item
                  name="quantity"
                  label={
                    <span className="font-semibold text-gray-700 text-sm">
                      Quantité reçue{" "}
                      <span className="text-red-500 font-bold">*</span>
                    </span>
                  }
                  rules={[
                    { required: true, message: "Requis" },
                    { type: "number", min: 1, message: "Minimum 1" },
                  ]}
                  className="!mb-3"
                >
                  <InputNumber
                    min={1}
                    placeholder="Ex: 50"
                    className="w-full"
                    style={{ width: "100%" }}
                    autoFocus
                  />
                </Form.Item>

                {/* Prix d'achat unitaire du lot */}
                <Form.Item
                  name="prix_achat"
                  label={
                    <span className="font-semibold text-gray-700 text-sm">
                      Prix d'achat de ce lot
                    </span>
                  }
                  tooltip="Prix unitaire payé au fournisseur pour ce lot, pré-rempli avec le dernier prix payé. Le coût d'achat de l'article est ensuite recalculé selon la méthode du magasin (CMUP, FIFO ou LIFO)."
                  className="!mb-3"
                >
                  <InputNumber
                    min={0}
                    placeholder={`Dernier prix : ${(selectedProductForProvision?.lastPurchasePrice ?? selectedProductForProvision?.purchasePrice ?? 0).toLocaleString("fr-FR")}`}
                    className="w-full"
                    style={{ width: "100%" }}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                    }
                    parser={(value) => value!.replace(/\s?/g, "") as any}
                  />
                </Form.Item>

                {/* Montant */}
                <Form.Item
                  name="montant"
                  label={
                    <span className="font-semibold text-gray-700 text-sm">
                      Montant payé{" "}
                      <span className="text-gray-400 text-xs font-normal">
                        (optionnel)
                      </span>
                    </span>
                  }
                  className="!mb-3"
                >
                  <InputNumber
                    min={0}
                    placeholder="0"
                    className="w-full"
                    style={{ width: "100%" }}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                    }
                    parser={(value) => value!.replace(/\s?/g, "") as any}
                  />
                </Form.Item>
              </div>

              {selectedProductForProvision?.suiviSerie && (
                <Form.Item
                  name="numeros_serie"
                  label={<span className="font-semibold text-gray-700 text-sm">Numéros de série reçus <span className="text-red-500 font-bold">*</span></span>}
                  rules={[{
                    validator: (_, v: string[] = []) => v.length === (Number(quantiteSaisie) || 0) && v.length > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error(`Saisissez ${Number(quantiteSaisie) || 0} numéro(s) : un par unité reçue.`)),
                  }]}
                  className="!mb-3"
                >
                  <SaisieNumeros attendu={Number(quantiteSaisie) || 0} />
                </Form.Item>
              )}

              {selectedProductForProvision && isAdmin && (
                <ApercuCout
                  articleId={selectedProductForProvision.id}
                  quantite={quantiteSaisie}
                  prix={prixSaisi}
                  devise={t("delivery.productSelection.currency")}
                />
              )}

              {/* Livreur */}
              <Form.Item
                name="livreur"
                label={
                  <span className="font-semibold text-gray-700 text-sm">
                    Nom du livreur{" "}
                    <span className="text-gray-400 text-xs font-normal">
                      (optionnel)
                    </span>
                  </span>
                }
                className="!mb-3"
              >
                <Input
                  placeholder="Nom de la personne qui livre..."
                  prefix={<UserOutlined className="text-gray-400" />}
                />
              </Form.Item>

              {/* Note */}
              <Form.Item
                name="note"
                label={
                  <span className="font-semibold text-gray-700 text-sm">
                    Note{" "}
                    <span className="text-gray-400 text-xs font-normal">
                      (optionnel)
                    </span>
                  </span>
                }
                className="!mb-1"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Remarques, numéro de bon de livraison..."
                  className="resize-none"
                />
              </Form.Item>
            </Form>

            {/* Légende */}
            <div className="mt-2 px-1 flex items-center gap-1 text-xs text-gray-400">
              <span className="text-red-500 font-bold">*</span>
              <span>Champ obligatoire · Les autres champs sont optionnels</span>
            </div>
          </div>
        </Modal>

        {selectedProduct && (
          <ExpiredProductModal
            isOpen={showExpiredModal}
            onClose={() => {
              setShowExpiredModal(false);
              setSelectedProduct(null);
            }}
            onSuccess={onProvisionSuccess || (() => {})}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            currentStock={selectedProduct.currentStock}
            suiviSerie={selectedProduct.suiviSerie}
          />
        )}

        {produitASolder && (
          <SoldeAvarieModal
            isOpen
            onClose={() => setProduitASolder(null)}
            onSuccess={onProvisionSuccess || (() => {})}
            productId={produitASolder.id}
            productName={produitASolder.name}
            price={produitASolder.price}
            soldable={produitASolder.avarie?.quantite_soldable ?? 0}
            contientPerimes={produitASolder.avarie?.contient_perimes}
          />
        )}
      </div>
    </ConfigProvider>
  );
};

export default ProductTable;
