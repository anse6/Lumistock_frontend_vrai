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
  Progress,
} from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import logo1 from "@/assets/no_data.png";

const { Text, Title } = Typography;
const API_URL = getUrlServer();

type Debtor = {
  client_id: string;
  nom: string;
  telephone: string;
  ville: string;
  quartier: string;
  nombre_livraisons: number;
  montant_total: number;
  montant_paye: number;
  dette: number;

  // Custom UI fields
  initials: string;
  avatarColor: string;
  textColor: string;
};

const avatarColors = [
  "#fff1f0", // red light
  "#fff2e8", // orange light
  "#fffbe6", // yellow light
  "#f9f0ff", // purple light
  "#f5f5f5", // gray light
];

const avatarTextColors = [
  "#cf1322", // red
  "#d4380d", // orange
  "#d48806", // gold
  "#531dab", // purple
  "#595959", // gray
];

// Génération des initiales
const generateInitials = (name?: string): string => {
  if (!name || typeof name !== "string") return "??";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.trim().slice(0, 2).toUpperCase();
};

const TopDebtors: React.FC = () => {
  const { t, i18n } = useTranslation();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(i18n.language === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    })
      .format(value ?? 0)
      .replace("XOF", "CFA");

  const fetchTopDebtors = async (): Promise<Debtor[]> => {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error(t("admin.dashboard.error"));

    const response = await axios.get(`${API_URL}/clients/debt/top5/manager/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    return response.data.map((item: any, index: number) => ({
      ...item,
      nom: item.nom ?? "Inconnu",
      initials: generateInitials(item.nom),
      avatarColor: avatarColors[index % avatarColors.length],
      textColor: avatarTextColors[index % avatarTextColors.length],
    }));
  };

  const {
    data: debtors,
    isLoading,
    error,
  } = useQuery<Debtor[]>({
    queryKey: ["topDebtors"],
    queryFn: fetchTopDebtors,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Helper pour les couleurs du top
  const getBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return "#cf1322"; // Rouge le plus fort (1er)
      case 1:
        return "#d4380d"; // Orange sombre (2e)
      case 2:
        return "#d48806"; // Orange (3e)
      default:
        return "#bfbfbf"; // Gris pour les autres
    }
  };

  const getBadgeTextColor = () => "#fff";

  return (
    <Card
      title={
        <Space align="center">
          <WarningOutlined style={{ color: "#cf1322", fontSize: "20px" }} />
          <Title level={5} style={{ margin: 0 }}>
            {t("admin.dashboard.top_debtors")}
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
          <Text
            type="danger"
            style={{ marginBottom: "8px", textAlign: "center" }}
          >
            {error instanceof Error
              ? error.message
              : t("admin.dashboard.error")}
          </Text>
          <a onClick={() => window.location.reload()}>
            {t("admin.dashboard.retry")}
          </a>
        </div>
      ) : debtors && debtors.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={debtors.slice(0, 5)} // Top 5
          style={{ flexGrow: 1 }}
          renderItem={(debtor, index) => {
            // Calcul du pourcentage de non-paiement par rapport au total dû (Dette / Montant Total)
            const debtPercentage =
              debtor.montant_total > 0
                ? Math.min((debtor.dette / debtor.montant_total) * 100, 100)
                : 0;

            return (
              <List.Item
                style={{
                  borderBottom:
                    index === debtors.length - 1 ? "none" : "1px solid #f0f0f0",
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
                      color: getBadgeTextColor(),
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
                        backgroundColor: debtor.avatarColor,
                        color: debtor.textColor,
                        fontWeight: "bold",
                        fontSize: "16px",
                        border: `1px solid ${debtor.textColor}33`,
                      }}
                    >
                      {debtor.initials}
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
                        marginBottom: "2px",
                      }}
                    >
                      <Text
                        strong
                        ellipsis={{ tooltip: debtor.nom }}
                        style={{
                          flex: 1,
                          marginRight: "8px",
                          fontSize: "15px",
                        }}
                      >
                        {debtor.nom}
                      </Text>
                      <Text
                        strong
                        style={{
                          color: "#cf1322",
                          fontSize: "15px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(debtor.dette)}
                      </Text>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        color: "#8c8c8c",
                        marginBottom: "2px",
                      }}
                    >
                      <Text
                        type="secondary"
                        ellipsis
                        style={{ maxWidth: "60%" }}
                      >
                        {debtor.quartier}, {debtor.ville}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        {t("delivery.ordersTable.remainingToPay")}
                      </Text>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Progress
                        percent={Number(debtPercentage.toFixed(1))}
                        size="small"
                        strokeLinecap="round"
                        strokeColor={{
                          "0%": "#ffa39e",
                          "100%": "#cf1322",
                        }}
                        status="active"
                        style={{ margin: 0, flex: 1 }}
                        showInfo={false}
                      />
                      <Text
                        style={{
                          fontSize: "10px",
                          color: "#8c8c8c",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t("admin.dashboard.out_of")}{" "}
                        {formatCurrency(debtor.montant_total)}
                      </Text>
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
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

export default TopDebtors;
