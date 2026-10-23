import React, { useState, useEffect } from "react";
import { getUrlServer } from "../../../configServer";
import { Card, List, Progress, Typography, Spin, Badge, Space } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import logo1 from "@/assets/no_data.png";

const { Text, Title } = Typography;

interface Product {
  produit_id: string;
  nom: string;
  quantite_totale: number;
  montant_total: number;
  prix: number;
  pourcentage_quantite: number;
  pourcentage_montant: number;
}

const BestSellingProducts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBestProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("access_token");
        if (!token) throw new Error(t("admin.dashboard.error"));

        const url = `${getUrlServer()}/produits/best/managers`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok)
          throw new Error(`${t("admin.dashboard.error")}: ${response.status}`);

        const data = await response.json();
        setProducts(data.best_products.slice(0, 3)); // Limiter à 3 produits
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("admin.dashboard.error"),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBestProducts();
  }, [t]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(i18n.language === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    })
      .format(value ?? 0)
      .replace("XOF", "CFA");

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
          <TrophyOutlined style={{ color: "#faad14", fontSize: "20px" }} />
          <Title level={5} style={{ margin: 0 }}>
            {t("admin.dashboard.top_products")}
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
      {loading ? (
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
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            minHeight: "200px",
            color: "#ff4d4f",
          }}
        >
          <Text type="danger">{error}</Text>
        </div>
      ) : products.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={products}
          style={{ flexGrow: 1 }}
          renderItem={(product, index) => (
            <List.Item
              style={{
                borderBottom:
                  index === products.length - 1 ? "none" : "1px solid #f0f0f0",
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
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    borderRadius: "50%",
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
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
                      ellipsis={{ tooltip: product.nom }}
                      style={{ flex: 1, marginRight: "8px", fontSize: "15px" }}
                    >
                      {product.nom}
                    </Text>
                    <Text
                      strong
                      style={{
                        color: "#4338ca",
                        fontSize: "15px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(product.montant_total)}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#8c8c8c",
                      marginBottom: "4px",
                    }}
                  >
                    <Text type="secondary">
                      {t("admin.dashboard.sold")}:{" "}
                      <strong style={{ color: "#595959" }}>
                        {product.quantite_totale}
                      </strong>
                    </Text>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      {product.pourcentage_montant?.toFixed(1) ?? "0"}%{" "}
                      {t("admin.dashboard.of_total_revenue")}
                    </Text>
                  </div>

                  <Progress
                    percent={Number(
                      product.pourcentage_quantite?.toFixed(1) || 0,
                    )}
                    size="small"
                    strokeLinecap="round"
                    strokeColor={{
                      "0%": "#818cf8",
                      "100%": "#4f46e5",
                    }}
                    status="active"
                    style={{ margin: 0 }}
                  />
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
          <Text type="secondary">{t("admin.dashboard.no_products_sold")}</Text>
        </div>
      )}
    </Card>
  );
};

export default BestSellingProducts;
