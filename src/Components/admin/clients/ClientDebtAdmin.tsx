import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { getUrlServer } from "../../../configServer";
import PageTitle from "../../PageTitle";
import DebtTable from "./DebtTable";
import {
  Spin,
  Card,
  Row,
  Col,
  Input,
  Select,
  Breadcrumb,
  Typography,
  App,
} from "antd";
import {
  DollarOutlined,
  SearchOutlined,
  FilterOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Users, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { Option } = Select;

interface ClientDebtData {
  client_id: string;
  nom: string;
  telephone: string;
  ville: string;
  quartier: string;
  nombre_livraisons: number;
  montant_total: number;
  montant_paye: number;
  dette: number;
  livreur_id: string;
  livreur_nom: string;
  livreur_prenom: string;
}

interface ClientDebtAdminProps {
  isTabMode?: boolean;
}

const ClientDebtAdmin: React.FC<ClientDebtAdminProps> = ({
  isTabMode = false,
}) => {
  const { notification } = App.useApp();
  const { t } = useTranslation();
  const [data, setData] = useState<ClientDebtData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedVille, setSelectedVille] = useState<string | undefined>(
    undefined,
  );
  const [selectedLivreur, setSelectedLivreur] = useState<string | undefined>(
    undefined,
  );

  const fetchClientDebts = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) throw new Error("Token non trouvé");

      const response = await axios.get(
        `${getUrlServer()}/clients/debt/manager/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setData(response.data);
    } catch (error: any) {
      console.error("Erreur lors du chargement des dettes clients:", error);
      notification.error({
        message: t("admin.customers.debt.messages.loadErrorTitle"),
        description: t("admin.customers.debt.messages.loadErrorDesc"),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDebts();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = item.nom
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesVille = !selectedVille || item.ville === selectedVille;
      const matchesLivreur =
        !selectedLivreur || item.livreur_id === selectedLivreur;
      return matchesSearch && matchesVille && matchesLivreur;
    });
  }, [data, searchText, selectedVille, selectedLivreur]);

  const villes = useMemo(
    () => Array.from(new Set(data.map((item) => item.ville))).filter(Boolean),
    [data],
  );
  const livreurs = useMemo(() => {
    const uniqueLivreurs = new Map();
    data.forEach((item) => {
      if (item.livreur_id && !uniqueLivreurs.has(item.livreur_id)) {
        uniqueLivreurs.set(
          item.livreur_id,
          `${item.livreur_nom} ${item.livreur_prenom}`,
        );
      }
    });
    return Array.from(uniqueLivreurs.entries()).map(([id, nom]) => ({
      id,
      nom,
    }));
  }, [data]);

  const totalDette = filteredData.reduce((sum, item) => sum + item.dette, 0);
  const nombreClients = filteredData.length;

  if (loading && data.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <Spin size="large" tip={t("admin.customers.debt.modal.loading")} />
      </div>
    );
  }

  return (
    <>
      {!isTabMode && (
        <PageTitle>{t("admin.customers.debt.pageTitle")}</PageTitle>
      )}

      <div
        className={`${isTabMode ? "p-0 pt-4" : "p-4 sm:p-6"} bg-white min-h-screen`}
      >
        {!isTabMode && (
          <div className="mb-6">
            <Breadcrumb
              items={[
                {
                  title: (
                    <Link to="/admin/dashboard">
                      {t("admin.customers.debt.breadcrumb.0")}
                    </Link>
                  ),
                },
                { title: t("admin.customers.debt.breadcrumb.1") },
              ]}
            />
          </div>
        )}

        {!isTabMode && (
          <div className="mb-8">
            <Title level={2} className="!mb-1 flex items-center gap-3">
              <DollarOutlined className="text-red-600" />
              {t("admin.customers.debt.header.title")}
            </Title>
            <Text type="secondary">
              {t("admin.customers.debt.header.subtitle")}
            </Text>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-red-50 p-5 rounded-xl border border-red-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm text-red-600 font-medium mb-1">
                {t("admin.customers.debt.stats.totalDebt")}
              </p>
              <h4 className="text-2xl font-bold text-red-900">
                {totalDette.toLocaleString("fr-FR")} FCFA
              </h4>
              <p className="text-xs text-red-500 mt-1">
                {t("admin.customers.debt.stats.totalDebtDesc")}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Banknote className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm text-purple-600 font-medium mb-1">
                {t("admin.customers.debt.stats.debtorsCount")}
              </p>
              <h4 className="text-2xl font-bold text-purple-900">
                {nombreClients.toLocaleString("fr-FR")}{" "}
                {t("admin.customers.debt.stats.clients")}
              </h4>
              <p className="text-xs text-purple-500 mt-1">
                {t("admin.customers.debt.stats.debtorsCountDesc")}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filtres Bar */}
        <Card className="mb-8 group">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Input
                placeholder={t(
                  "admin.customers.debt.filters.searchPlaceholder",
                )}
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="large"
                className="rounded-xl border-gray-200"
              />
            </Col>
            <Col xs={12} md={8}>
              <Select
                placeholder={t("admin.customers.debt.filters.allCities")}
                className="w-full rounded-xl"
                size="large"
                allowClear
                suffixIcon={<EnvironmentOutlined />}
                value={selectedVille}
                onChange={setSelectedVille}
              >
                {villes.map((ville) => (
                  <Option key={ville} value={ville}>
                    {ville}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={8}>
              <Select
                placeholder={t(
                  "admin.customers.debt.filters.allDeliveryPersons",
                )}
                className="w-full rounded-xl"
                size="large"
                allowClear
                suffixIcon={<FilterOutlined />}
                value={selectedLivreur}
                onChange={setSelectedLivreur}
              >
                {livreurs.map((livreur) => (
                  <Option key={livreur.id} value={livreur.id}>
                    {livreur.nom}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Content Section */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <Spin size="large" />
            </div>
          )}

          <Card className="rounded-2xl overflow-hidden p-0 bg-transparent">
            <div className="flex items-center justify-between mb-4 px-2">
              <Title level={4} className="!mb-0">
                {t("admin.customers.debt.table.listTitle")}
              </Title>
              <Text type="secondary">
                {filteredData.length}{" "}
                {t("admin.customers.debt.table.resultsFound")}
              </Text>
            </div>
            <DebtTable data={filteredData} refreshData={fetchClientDebts} />
          </Card>
        </div>
      </div>
    </>
  );
};

export default ClientDebtAdmin;
