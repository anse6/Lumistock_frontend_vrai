import React, { useEffect, useState, useCallback } from "react";
import {
  ConfigProvider,
  Spin,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Tabs,
  Table,
  Statistic,
  Descriptions,
  Image,
  Button,
  App,
  Divider,
  Empty,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingOutlined,
  ContainerOutlined,
  ClockCircleOutlined,
  UserOutlined,
  WarningOutlined,
  BarcodeOutlined,
  CalendarOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getUrlServer } from "../../../../configServer";
import PageTitle from "../../../PageTitle";
import defaultimage from "./../../../../Modules/Delivery/images/riz.png";
import axios from "axios";
import ProductStatusTag from "../../Produits/ProductStatusTag";
import AvatarWithPopover from "../../../super-admin/users.tsx/components/AvatarWithPopover";

const { Title, Text, Paragraph } = Typography;

const APP_COLOR = "#3b1558";

interface Conditionnement {
  nom: string;
  facteur: number;
  prix_conditionnement: number;
}

interface MouvementStock {
  users_id?: string;
  type: string;
  quantite: number;
  date: string | { $date: string };
  acteur?: { admin_id?: string; admin_nom?: string };
  conditionnement?: Conditionnement;
}

interface Produit {
  _id: string;
  nom: string;
  description: string;
  image: string;
  prix: number;
  prix_achat?: number;
  unite: string;
  quantite: number;
  quantite_initiale: number;
  etat: string;
  categorie_id: string;
  magasin_id: string;
  fournisseur_id?: string;
  date_peremption?: string;
  seuil_alerte?: number;
  reference_fournisseur?: string;
  code_barre?: string;
  mouvements_stock: MouvementStock[];
  conditionnements: Conditionnement[];
  created_at: string | { $date: string };
}

interface Magasin {
  _id: string;
  denomination: string;
}

interface Categorie {
  _id: string;
  nom: string;
}

interface Fournisseur {
  _id: string;
  nom: string;
}

interface User {
  _id: string;
  name: string;
  first_name?: string;
  email?: string;
}

const ProductDetailAdmin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notification } = App.useApp();

  const [produit, setProduit] = useState<Produit | null>(null);
  const [magasin, setMagasin] = useState<Magasin | null>(null);
  const [categorie, setCategorie] = useState<Categorie | null>(null);
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);

  const extractDate = (dateValue: string | { $date: string }): string => {
    if (typeof dateValue === "string") return dateValue;
    return dateValue?.$date || "";
  };

  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return defaultimage;
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("uploads")
      ? imagePath
      : `uploads/images/${imagePath}`;
    return `${getUrlServer()}/${cleanPath}`;
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const prodRes = await axios.get(`${getUrlServer()}/produits/${id}`, {
        headers,
      });
      const data = prodRes.data;
      setProduit(data);

      const promises = [];
      if (data.magasin_id) {
        promises.push(
          axios
            .get(`${getUrlServer()}/magasin/${data.magasin_id}`, { headers })
            .then((res) => setMagasin(res.data.magasin || res.data))
            .catch(() => {}),
        );
      }
      if (data.categorie_id) {
        promises.push(
          axios
            .get(`${getUrlServer()}/categorie/${data.categorie_id}`, {
              headers,
            })
            .then((res) => setCategorie(res.data.categorie || res.data))
            .catch(() => {}),
        );
      }
      if (data.fournisseur_id) {
        promises.push(
          axios
            .get(`${getUrlServer()}/fournisseurs`, { headers })
            .then((res) => {
               const list = res.data;
               const f = list.find((item: any) => item._id === data.fournisseur_id || item.id === data.fournisseur_id);
               if (f) setFournisseur(f);
            })
            .catch(() => {}),
        );
      }

      if (data.mouvements_stock?.length > 0) {
        const actorIds = [
          ...new Set(
            data.mouvements_stock
              .map((m: any) => m.acteur?.admin_id)
              .filter(Boolean),
          ),
        ];
        actorIds.forEach((uid: any) => {
          promises.push(
            axios
              .get(`${getUrlServer()}/users/${uid}`, { headers })
              .then((res) => {
                const u = res.data.user || res.data;
                setUsers((prev) => ({ ...prev, [uid]: u }));
              })
              .catch(() => {}),
          );
        });
      }

      await Promise.all(promises);
    } catch (_err) {
      notification.error({
        message: "Erreur",
        description: "Impossible de charger les détails de l'article",
      });
    } finally {
      setLoading(false);
    }
  }, [id, notification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" tip="Chargement de l'article..." />
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="p-8">
        <Empty description="Aucune donnée" />
        <div className="text-center mt-4">
          <Button onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{new Date(extractDate(date)).toLocaleDateString()}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {new Date(extractDate(date)).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Space>
      ),
    },
    {
      title: "Mouvement",
      key: "mouvement",
      render: (record: MouvementStock) => {
        const isEntry =
          record.type.toLowerCase().includes("approv") || record.quantite > 0;
        return (
          <Tag
            icon={isEntry ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            color={isEntry ? "success" : "error"}
          >
            {record.type.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
      render: (qty: number, record: MouvementStock) => (
        <Text strong className={qty >= 0 ? "text-green-600" : "text-red-600"}>
          {qty >= 0 ? "+" : ""}
          {qty} {produit.unite}
          {record.conditionnement && (
            <div
              style={{ fontSize: "11px", fontWeight: "normal", color: "gray" }}
            >
              ({record.conditionnement.nom})
            </div>
          )}
        </Text>
      ),
    },
    {
      title: "Acteur",
      key: "acteur",
      render: (record: MouvementStock) => {
        const user = users[record.acteur?.admin_id || ""];
        // Nom complet si l'utilisateur a pu être chargé, sinon le nom
        // enregistré dans le mouvement ; « Système » s'il n'y a pas d'acteur.
        const nom =
          (user ? `${user.first_name || ""} ${user.name || ""}`.trim() : "") ||
          record.acteur?.admin_nom ||
          "";
        if (!nom) {
          return (
            <Space>
              <UserOutlined style={{ color: APP_COLOR }} />
              <Text type="secondary">Système</Text>
            </Space>
          );
        }
        return (
          <Space>
            <AvatarWithPopover name={nom} email={user?.email || "—"} size={32} />
            <Text>{nom}</Text>
          </Space>
        );
      },
    },
  ];

  const stockCritical = produit.seuil_alerte !== undefined && produit.seuil_alerte !== null && produit.quantite <= produit.seuil_alerte;

  return (
    <ConfigProvider theme={{ token: { colorPrimary: APP_COLOR, borderRadius: 8 } }}>
      <>
        <PageTitle>
          {produit.nom} - Détails
        </PageTitle>
        <div className="p-4 sm:p-6 bg-white min-h-screen">
          <div className="mb-6 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
            <Link
              to="/admin/dashboard/produits_approvisionnements"
              className="transition-all duration-200 flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm !text-white hover:!text-white hover:opacity-90"
              style={{ backgroundColor: APP_COLOR }}
            >
              <ArrowLeftOutlined className="text-xs" />
              Articles
            </Link>
            <span style={{ color: APP_COLOR }} className="font-bold px-1 opacity-50">{">"}</span>
            <span className="!text-white px-3 py-1.5 rounded-lg shadow-sm" style={{ backgroundColor: APP_COLOR }}>
              {produit.nom}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <Title level={2} style={{ marginBottom: 4 }} className="flex items-center gap-3">
                {produit.nom}
                {stockCritical && (
                  <Tag color="error" icon={<WarningOutlined />} className="ml-2">
                    Stock Faible
                  </Tag>
                )}
              </Title>
              <Space split={<Divider type="vertical" />}>
                <Text type="secondary">
                  <ShoppingOutlined />{" "}
                  {categorie?.nom || "Non catégorisé"}
                </Text>
                <Text type="secondary">
                  <ClockCircleOutlined /> Créé le{" "}
                  {new Date(extractDate(produit.created_at)).toLocaleDateString()}
                </Text>
              </Space>
            </div>
            <Space>
              <Button className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300 !border-none" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                Retour
              </Button>
              <Button
                type="primary"
                style={{ backgroundColor: APP_COLOR }}
                onClick={() =>
                  navigate(`/admin/dashboard/produits_approvisionnements/modifier/${id}`)
                }
              >
                Modifier
              </Button>
            </Space>
          </div>

          <Row gutter={[24, 24]}>
            {/* Main Info */}
            <Col xs={24} lg={8}>
              <Card className="overflow-hidden border-0 shadow-sm">
                <div className="p-2 bg-purple-50 rounded-xl mb-6">
                  <Image
                    src={getImageUrl(produit.image)}
                    fallback={defaultimage}
                    className="w-full aspect-square object-contain rounded-lg"
                    preview={{
                      mask: (
                        <div className="flex items-center gap-2">
                          <InfoCircleOutlined /> Aperçu
                        </div>
                      ),
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <Statistic
                    title="Prix de vente"
                    value={produit.prix}
                    valueStyle={{ color: APP_COLOR, fontWeight: "bold" }}
                  />
                  {produit.prix_achat !== undefined && (
                    <>
                      <Divider style={{ margin: "12px 0" }} />
                      <Statistic
                        title="Prix d'achat"
                        value={produit.prix_achat}
                        valueStyle={{ fontSize: "1.2rem", color: "#6b7280" }}
                      />
                    </>
                  )}
                  <Divider style={{ margin: "12px 0" }} />
                  <Statistic
                    title="Valeur du stock"
                    value={produit.prix * produit.quantite}
                    valueStyle={{ fontSize: "1.2rem", fontWeight: "bold" }}
                  />
                </div>
              </Card>
            </Col>

            {/* Details & History Tabs */}
            <Col xs={24} lg={16}>
              <Card className="border-0 h-full shadow-sm">
                <Tabs
                  defaultActiveKey="1"
                  size="large"
                  items={[
                    {
                      key: "1",
                      label: (
                        <span>
                          <InfoCircleOutlined /> Détails de l'Article
                        </span>
                      ),
                      children: (
                        <div className="py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <Descriptions
                            bordered
                            column={{ xxl: 2, xl: 2, lg: 1, md: 1, sm: 1, xs: 1 }}
                          >
                            <Descriptions.Item label={<><BarcodeOutlined /> Code / ID</>}>
                              {produit.code_barre || produit._id}
                            </Descriptions.Item>
                            <Descriptions.Item label="État">
                              <ProductStatusTag
                                inStock={produit.etat?.toLowerCase() === "en stock"}
                              />
                            </Descriptions.Item>
                            
                            <Descriptions.Item label={<><BankOutlined /> Magasin</>}>
                              {magasin?.denomination || "N/A"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Fournisseur">
                              {fournisseur?.nom || "Non renseigné"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Unité de mesure">
                              <Tag color="purple">{produit.unite}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Réf. Fournisseur">
                              {produit.reference_fournisseur || "N/A"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Stock actuel">
                              <Text strong className={produit.quantite > 0 ? "text-green-600" : "text-red-600"}>
                                {produit.quantite} {produit.unite}
                              </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Seuil d'alerte">
                              <Text strong className={stockCritical ? "text-red-500" : ""}>
                                {produit.seuil_alerte !== undefined && produit.seuil_alerte !== null ? produit.seuil_alerte : "Non défini"}
                              </Text>
                            </Descriptions.Item>
                            
                            {produit.date_peremption && (
                              <Descriptions.Item label={<><CalendarOutlined /> Date de péremption</>} span={2}>
                                <Tag color="warning" className="text-sm px-2 py-1">
                                  {new Date(produit.date_peremption).toLocaleDateString()}
                                </Tag>
                              </Descriptions.Item>
                            )}
                          </Descriptions>

                          <div className="mt-8">
                            <Title level={4}>
                              <ContainerOutlined /> Description
                            </Title>
                            <Paragraph className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                              {produit.description || "Aucune description renseignée."}
                            </Paragraph>
                          </div>

                          {produit.conditionnements?.length > 0 && (
                            <div className="mt-8">
                              <Title level={4}>
                                <ShoppingOutlined /> Conditionnements
                              </Title>
                              <Row gutter={[16, 16]}>
                                {produit.conditionnements.map((c, i) => (
                                  <Col xs={24} sm={12} key={i}>
                                    <Card
                                      size="small"
                                      className="bg-purple-50 border-purple-100"
                                    >
                                      <div className="flex justify-between items-center">
                                        <Text strong style={{ color: APP_COLOR }}>{c.nom}</Text>
                                        <Tag color="purple">
                                          {c.facteur} {produit.unite}
                                        </Tag>
                                      </div>
                                      <div className="mt-2 flex justify-between items-center">
                                        <Text type="secondary">Prix unitaire:</Text>
                                        <Text strong style={{ color: APP_COLOR }}>
                                          {c.prix_conditionnement?.toLocaleString() || "N/A"}
                                        </Text>
                                      </div>
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "2",
                      label: (
                        <span>
                          <HistoryOutlined /> Historique des stocks
                        </span>
                      ),
                      children: (
                        <div className="py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <Table
                            dataSource={produit.mouvements_stock?.sort(
                              (a, b) =>
                                new Date(extractDate(b.date)).getTime() -
                                new Date(extractDate(a.date)).getTime(),
                            )}
                            columns={columns}
                            pagination={{ pageSize: 5 }}
                            rowKey={(_, index) => index?.toString() || ""}
                            scroll={{ x: "max-content" }}
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </>
    </ConfigProvider>
  );
};

export default ProductDetailAdmin;
