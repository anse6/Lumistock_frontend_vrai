// Éléments communs aux pages Charges et Finance : devise du magasin et thème
// (mêmes couleurs que la page Rapports).
import React, { useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import frFR from "antd/locale/fr_FR";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { currencyLabel } from "../../Components/admin/Produits/supplyPdf";
import { loadStoreForPdf } from "../../Components/admin/livaision/livraisonfinal/deliveryInvoicePdf";
import { PURPLE_950 } from "../Reports/ReportUi";
import { getFiscalite } from "./chargeService";
import type { ParametresFiscaux } from "./types";

dayjs.locale("fr");

export function useDevise() {
  const [devise, setDevise] = useState("FCFA");
  useEffect(() => {
    let actif = true;
    loadStoreForPdf()
      .then(({ store }) => actif && setDevise(currencyLabel(store.devise)))
      .catch(() => undefined);
    return () => {
      actif = false;
    };
  }, []);
  return devise;
}

export const ThemeFinance: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConfigProvider
    locale={frFR}
    theme={{
      token: { colorPrimary: PURPLE_950, borderRadius: 10 },
      components: {
        Button: { colorPrimary: PURPLE_950, colorPrimaryHover: "#581c87" },
        Tabs: { itemSelectedColor: PURPLE_950, inkBarColor: PURPLE_950, itemHoverColor: "#6b21a8" },
        Table: { headerBg: "#faf5ff", headerColor: PURPLE_950 },
      },
    }}
  >
    {children}
  </ConfigProvider>
);

/** Variation en % par rapport à la période précédente (null si pas de base). */
export const variation = (actuel: number, precedent: number) =>
  precedent ? Math.round(((actuel - precedent) / Math.abs(precedent)) * 1000) / 10 : null;

export const Variation: React.FC<{ actuel: number; precedent: number; inverse?: boolean }> = ({ actuel, precedent, inverse }) => {
  const v = variation(actuel, precedent);
  if (v === null) return <span className="text-slate-400">—</span>;
  const bon = inverse ? v <= 0 : v >= 0;
  return (
    <span className={bon ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
      {v > 0 ? "+" : ""}
      {v} %
    </span>
  );
};

let fiscaliteEnCache: Promise<ParametresFiscaux> | null = null;

/** Réglages fiscaux du magasin (taux de TVA du pays, assujettissement…), chargés une fois. */
export function useFiscalite(version = 0) {
  const [fiscalite, setFiscalite] = useState<ParametresFiscaux | null>(null);
  useEffect(() => {
    let actif = true;
    if (version) fiscaliteEnCache = null;
    if (!fiscaliteEnCache) {
      fiscaliteEnCache = getFiscalite().catch((e) => {
        fiscaliteEnCache = null;
        throw e;
      });
    }
    fiscaliteEnCache.then((f) => actif && setFiscalite(f)).catch(() => undefined);
    return () => {
      actif = false;
    };
  }, [version]);
  return fiscalite;
}

export const oublierFiscalite = () => {
  fiscaliteEnCache = null;
};

export const formatTaux = (taux: number | null | undefined) =>
  taux === null || taux === undefined ? "—" : `${taux.toLocaleString("fr-FR", { maximumFractionDigits: 3 })} %`;
