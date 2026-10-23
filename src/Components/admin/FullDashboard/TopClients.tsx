import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getUrlServer } from "../../../configServer";
import { Card, List, Typography, Spin, Badge, Space, Avatar } from "antd";
import { CrownOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import logo1 from "@/assets/no_data.png";

const { Text, Title } = Typography;
const API_URL = getUrlServer();

type Client = {
  id: string;
  name: string;
  initials: string;
  purchaseAmount: string;
  value: number; // number of deliveries
  avatarColor: string;
  montant_brut: number;
};

const avatarColors = [
  "#f9f0ff", // purple light
  "#f6ffed", // green light
  "#fff1f0", // red light
  "#e6f7ff", // blue light
  "#f5f5f5", // gray light
];

const avatarTextColors = [
  "#531dab",
  "#389e0d",
  "#cf1322",
  "#0958d9",
  "#595959",
];

// Génération des initiales
const generateInitials = (name?: string): string => {
  if (!name || typeof name !== "string") return "??";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.trim().slice(0, 2).toUpperCase();
};

const TopClients: React.FC = () => {
  const { t, i18n } = useTranslation();
  const fetchTopClients = async (): Promise<Client[]> => {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error(t("admin.dashboard.error"));

    const response = await axios.get(`${API_URL}/clients/best/managers/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    return response.data.map(
      (
        item: {
          client_id: string;
          nom?: string;
          montant_total: number;
          nombre_livraisons: number;
        },
        index: number,
      ) => ({
        id: item.client_id,
        name: item.nom ?? "Inconnu",
        initials: generateInitials(item.nom),
        purchaseAmount: new Intl.NumberFormat(
          i18n.language === "fr" ? "fr-FR" : "en-US",
          {
            style: "currency",
            currency: "XOF",
            maximumFractionDigits: 0,
          },
        )
          .format(item.montant_total ?? 0)
          .replace("XOF", "CFA"),
        value: item.nombre_livraisons,
        avatarColor: avatarColors[index % avatarColors.length],
        textColor: avatarTextColors[index % avatarTextColors.length],
        montant_brut: item.montant_total,
      }),
    );
  };

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery<Client[]>({
    queryKey: ["topClients"],
    queryFn: fetchTopClients,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Helper pour les couleurs du top 3
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
          <CrownOutlined style={{ color: "#eb2f96", fontSize: "20px" }} />
          <Title level={5} style={{ margin: 0 }}>
            {t("admin.dashboard.top_clients")}
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
      ) : clients && clients.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={clients.slice(0, 4)} // Top 4
          style={{ flexGrow: 1 }}
          renderItem={(client, index) => (
            <List.Item
              style={{
                borderBottom:
                  index === 3 || index === clients.length - 1
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
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    borderRadius: "50%",
                    position: "absolute",
                    top: "-6px",
                    left: "-6px",
                    zIndex: 10,
                  }}
                >
                  <Avatar
                    size={46}
                    style={{
                      backgroundColor: (client as any).avatarColor,
                      color: (client as any).textColor,
                      fontWeight: "bold",
                      fontSize: "16px",
                      border: `1px solid ${(client as any).textColor}33`,
                    }}
                  >
                    {client.initials}
                  </Avatar>
                </Badge>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    marginLeft: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "4px",
                    }}
                  >
                    <Text
                      strong
                      ellipsis={{ tooltip: client.name }}
                      style={{ flex: 1, marginRight: "8px", fontSize: "15px" }}
                    >
                      {client.name}
                    </Text>
                    <Text
                      strong
                      style={{
                        color: "#eb2f96",
                        fontSize: "15px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {client.purchaseAmount}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#8c8c8c",
                    }}
                  >
                    <Text type="secondary">
                      {t("sidebar.delivery")}s:{" "}
                      <strong style={{ color: "#595959" }}>
                        {client.value}
                      </strong>
                    </Text>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      {t("admin.dashboard.table.amount")}
                    </Text>
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
          <img src={logo1} alt="Logo" className="w-16 h-16" />
          <Text type="secondary">{t("admin.dashboard.no_data")}</Text>
        </div>
      )}
    </Card>
  );
};

export default TopClients;
