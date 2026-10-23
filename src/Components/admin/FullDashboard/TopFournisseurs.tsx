import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getUrlServer } from "../../../configServer";
import {
  Card,
  List,
  Typography,
  Spin,
  Badge,
  Space,
  Avatar,
  Tooltip,
} from "antd";
import {
  ShopOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import logo1 from "@/assets/no_data.png";

const { Text, Title } = Typography;
const API_URL = getUrlServer();

interface Fournisseur {
  fournisseur_id: string;
  nom: string;
  ville: string;
  telephone: string;
  total_valeur: number;
  nombre_produits: number;
  quantite_totale: number;

  // Custom UI fields
  initials: string;
  avatarColor: string;
  textColor: string;
}

const avatarColors = [
  "#e6f7ff", // blue light
  "#f6ffed", // green light
  "#f9f0ff", // purple light
  "#fff7e6", // orange light
  "#fcffe6", // lime light
];

const avatarTextColors = [
  "#0958d9", // blue
  "#389e0d", // green
  "#531dab", // purple
  "#d46b08", // orange
  "#7cb305", // lime
];

const generateInitials = (name?: string): string => {
  if (!name || typeof name !== "string") return "??";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase()
    : name.trim().slice(0, 2).toUpperCase();
};

const TopFournisseurs: React.FC = () => {
  const { t, i18n } = useTranslation();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(i18n.language === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    })
      .format(value ?? 0)
      .replace("XOF", "CFA");

  const fetchTopFournisseurs = async (): Promise<Fournisseur[]> => {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error(t("admin.dashboard.error"));

    const response = await axios.get(`${API_URL}/fournisseurs/top-5`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    return response.data.map((item: any, index: number) => ({
      ...item,
      initials: generateInitials(item.nom),
      avatarColor: avatarColors[index % avatarColors.length],
      textColor: avatarTextColors[index % avatarTextColors.length],
    }));
  };

  const {
    data: fournisseurs,
    isLoading,
    error,
  } = useQuery<Fournisseur[]>({
    queryKey: ["topFournisseurs"],
    queryFn: fetchTopFournisseurs,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const getBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return "#faad14"; // Or
      case 1:
        return "#bfbfbf"; // Argent
      case 2:
        return "#d46b08"; // Bronze
      default:
        return "#f0f0f0"; // Défaut
    }
  };

  const getBadgeTextColor = (index: number) => (index > 2 ? "#595959" : "#fff");

  return (
    <Card
      title={
        <Space align="center">
          <ShopOutlined style={{ color: "#1890ff", fontSize: "20px" }} />
          <Title level={5} style={{ margin: 0 }}>
            {t("admin.dashboard.top_suppliers")}
          </Title>
        </Space>
      }
      style={{
        height: "100%",
        borderRadius: "12px",
        border: "1px solid #f0f0f0",
      }}
      bodyStyle={{
        padding: "0 20px 20px 20px",
        display: "flex",
        flexDirection: "column",
      }}
      hoverable
    >
      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            minHeight: "200px",
          }}
        >
          <Spin size="large" tip={t("admin.dashboard.loading")} />
        </div>
      ) : error ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            minHeight: "200px",
            color: "#ff4d4f",
          }}
        >
          <Text type="danger" style={{ marginBottom: "8px" }}>
            {error instanceof Error
              ? error.message
              : t("admin.dashboard.error")}
          </Text>
          <a onClick={() => window.location.reload()}>
            {t("admin.dashboard.retry")}
          </a>
        </div>
      ) : fournisseurs && fournisseurs.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={fournisseurs}
          renderItem={(fournisseur, index) => (
            <List.Item
              style={{
                borderBottom:
                  index === fournisseurs.length - 1
                    ? "none"
                    : "1px solid #f0f0f0",
                padding: "16px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <Badge
                  count={index + 1}
                  style={{
                    backgroundColor: getBadgeColor(index),
                    color: getBadgeTextColor(index),
                    fontWeight: "bold",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    width: "24px",
                    height: "24px",
                    lineHeight: "24px",
                    borderRadius: "50%",
                    position: "absolute",
                    top: "-4px",
                    left: "-4px",
                    zIndex: 2,
                    fontSize: "11px",
                  }}
                >
                  <Avatar
                    size={48}
                    style={{
                      backgroundColor: fournisseur.avatarColor,
                      color: fournisseur.textColor,
                      fontWeight: "bold",
                      fontSize: "18px",
                      border: `1px solid ${fournisseur.textColor}22`,
                    }}
                  >
                    {fournisseur.initials}
                  </Avatar>
                </Badge>

                <div style={{ flex: 1, minWidth: 0, marginLeft: "4px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text
                      strong
                      ellipsis={{ tooltip: fournisseur.nom }}
                      style={{ fontSize: "15px" }}
                    >
                      {fournisseur.nom}
                    </Text>
                    <Text
                      strong
                      style={{
                        color: "#1890ff",
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(fournisseur.total_valeur)}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#8c8c8c",
                    }}
                  >
                    <Tooltip title={t("admin.dashboard.tooltips.location")}>
                      <Space size={4}>
                        <EnvironmentOutlined style={{ fontSize: "10px" }} />
                        <Text type="secondary">{fournisseur.ville}</Text>
                      </Space>
                    </Tooltip>
                    <Tooltip
                      title={t("admin.dashboard.tooltips.supplier_products")}
                    >
                      <Text type="secondary">
                        🛒 <strong>{fournisseur.nombre_produits}</strong>{" "}
                        {t("admin.dashboard.ref")}
                      </Text>
                    </Tooltip>
                  </div>

                  <div style={{ marginTop: "4px" }}>
                    <Space size={4}>
                      <PhoneOutlined
                        style={{ fontSize: "10px", color: "#8c8c8c" }}
                      />
                      <Text style={{ fontSize: "11px", color: "#8c8c8c" }}>
                        {fournisseur.telephone}
                      </Text>
                    </Space>
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "200px",
          }}
        >
          <img src={logo1} alt="No data" className="w-16 h-16 opacity-50" />
          <Text type="secondary">{t("admin.dashboard.no_data")}</Text>
        </div>
      )}
    </Card>
  );
};

export default TopFournisseurs;
