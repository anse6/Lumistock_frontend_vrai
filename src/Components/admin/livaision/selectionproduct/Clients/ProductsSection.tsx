import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProductItem } from "./ProductItem";
import { useProductStore } from "./api/useProductStore";
import images from "@/assets/no_data.png";
import { Spin } from "antd";
import { useDernierScan } from "../../scanVente";

// Ligne qui vient d'être ajoutée par un scan : elle vient à l'écran et s'illumine.
const LigneScannee: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { id: dernierId, tic } = useDernierScan();
  const ref = useRef<HTMLDivElement>(null);
  const [allume, setAllume] = useState(false);
  useEffect(() => {
    if (dernierId !== id || !tic) return;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setAllume(true);
    const minuteur = window.setTimeout(() => setAllume(false), 1200);
    return () => window.clearTimeout(minuteur);
  }, [dernierId, tic, id]);
  return (
    <div
      ref={ref}
      className={`rounded-2xl transition-shadow duration-300 ${allume ? "shadow-[0_0_0_3px_rgba(16,185,129,0.55)]" : ""}`}
    >
      {children}
    </div>
  );
};

export const ProductsSection: React.FC = () => {
  const { t } = useTranslation();
  const selectedProducts = useProductStore((state) => state.selectedProducts);
  const hasHydrated = useProductStore((state) => state._hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin />
      </div>
    );
  }

  if (selectedProducts.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <img
          src={images}
          alt="No Data"
          className="h-32 w-32 object-contain mb-3 opacity-80"
        />
        <span className="text-gray-400 text-sm">
          {t("admin.deliveries.new.noSelectedProducts")}
        </span>
        <p className="text-sm text-gray-400 mt-1">
          {t("admin.deliveries.actions.validation.selectProduct")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      {selectedProducts.map((product) => (
        <LigneScannee key={product.id} id={product.id}>
          <ProductItem
            id={product.id}
            image={product.image ?? null}
            title={product.name}
            price={product.price}
            quantity={product.quantity}
            total={product.total}
            quantite_magasin_initiale={product.quantite_magasin_initiale}
            conditionnements={product.conditionnements}
            conditionconfig={product.conditionconfig}
          />
        </LigneScannee>
      ))}
    </div>
  );
};
