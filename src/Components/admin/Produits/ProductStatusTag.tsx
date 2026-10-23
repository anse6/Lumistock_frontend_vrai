import React from "react";
import { Tag } from "antd";
import { PauseCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface ProductStatusTagProps {
  /** true = « En stock », false = « En rupture ». */
  inStock: boolean;
}

// Pastille de statut d'un produit, partagée par la liste des produits et la
// page de détail pour que l'état s'affiche partout de la même façon.
const ProductStatusTag: React.FC<ProductStatusTagProps> = ({ inStock }) => {
  const { t } = useTranslation();
  return (
    <Tag
      icon={inStock ? <SyncOutlined spin /> : <PauseCircleOutlined />}
      style={{
        borderRadius: 999,
        padding: "2px 10px",
        fontWeight: 600,
        fontSize: 11,
        margin: 0,
        whiteSpace: "nowrap",
        backgroundColor: inStock ? "#f0fdf4" : "#fef2f2",
        color: inStock ? "#16a34a" : "#dc2626",
        borderColor: inStock ? "#bbf7d0" : "#fecaca",
      }}
    >
      {inStock
        ? t("admin.products.status.in_stock")
        : t("admin.products.status.out_of_stock")}
    </Tag>
  );
};

export default ProductStatusTag;
