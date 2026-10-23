// Page Rapports : ventes, encaissements, journal des mouvements, mouvement de
// stock annuel et inventaire. Chaque rapport a ses filtres, s'imprime et se
// télécharge (PDF avec l'en-tête des documents, ou Excel).
// Un livreur ou un gérant ne voit que ses ventes et ses encaissements.
import React, { useEffect, useState } from "react";
import { useOngletUrl } from "../../hooks/useOngletUrl";
import { ConfigProvider, Tabs } from "antd";
import { BarChart3, CalendarRange, ArrowLeftRight, ClipboardList, Receipt, Wallet } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { useTranslation } from "react-i18next";
import PageTitle from "../../Components/PageTitle";
import { currencyLabel } from "../../Components/admin/Produits/supplyPdf";
import { loadStoreForPdf } from "../../Components/admin/livaision/livraisonfinal/deliveryInvoicePdf";
import { PURPLE_950 } from "./ReportUi";
import SalesReport from "./SalesReport";
import CashReport from "./CashReport";
import MovementsReport from "./MovementsReport";
import AnnualStockReport from "./AnnualStockReport";
import InventoryReport from "./InventoryReport";

dayjs.locale("fr");

const CLE_ONGLET = "rapports_onglet";


const DeliveryReportPage: React.FC = () => {
  const { t } = useTranslation();
  const role = (() => {
    try {
      return localStorage.getItem("role") || "";
    } catch {
      return "";
    }
  })();
  const estLivreur = role === "livreur" || role === "gerant";
  const [devise, setDevise] = useState("FCFA");
  // Onglet relié à l'adresse (?onglet=inventaire) : le menu latéral ouvre le rapport voulu.
  const [onglet, changerOnglet] = useOngletUrl(
    estLivreur ? ["ventes", "encaissements"] : ["ventes", "encaissements", "mouvements", "annuel", "inventaire"],
    "ventes",
    CLE_ONGLET,
  );

  useEffect(() => {
    let actif = true;
    loadStoreForPdf().then(({ store }) => actif && setDevise(currencyLabel(store.devise)));
    return () => {
      actif = false;
    };
  }, []);


  const libelle = (icone: React.ReactNode, texte: string) => (
    <span className="flex items-center gap-2">
      {icone}
      {texte}
    </span>
  );
  const onglets = [
    { key: "ventes", label: libelle(<Receipt size={16} />, "Ventes"), children: <SalesReport devise={devise} estLivreur={estLivreur} /> },
    { key: "encaissements", label: libelle(<Wallet size={16} />, "Encaissements"), children: <CashReport devise={devise} /> },
    ...(estLivreur
      ? []
      : [
          {
            key: "mouvements",
            label: libelle(<ArrowLeftRight size={16} />, "Mouvements de stock"),
            children: <MovementsReport devise={devise} />,
          },
          {
            key: "annuel",
            label: libelle(<CalendarRange size={16} />, "Mouvement annuel"),
            children: <AnnualStockReport devise={devise} />,
          },
          { key: "inventaire", label: libelle(<ClipboardList size={16} />, "Inventaire"), children: <InventoryReport devise={devise} /> },
        ]),
  ];
  const actif = onglets.some((o) => o.key === onglet) ? onglet : "ventes";

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: PURPLE_950, borderRadius: 10 },
        components: {
          Button: { colorPrimary: PURPLE_950, colorPrimaryHover: "#581c87" },
          Tabs: { itemSelectedColor: PURPLE_950, inkBarColor: PURPLE_950, itemHoverColor: "#6b21a8" },
          Table: { headerBg: "#faf5ff", headerColor: PURPLE_950 },
        },
      }}
    >
      <PageTitle>{t("reports.pageTitle")}</PageTitle>
      <div className="min-h-screen bg-white p-2 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-purple-950/25"
            style={{ backgroundColor: PURPLE_950 }}
          >
            <BarChart3 size={22} />
          </span>
          <div>
            <h1 className="m-0 text-xl font-bold text-purple-950">Rapports</h1>
            <p className="m-0 text-sm text-slate-500">
              {estLivreur
                ? "Vos ventes et vos encaissements, à imprimer ou télécharger."
                : "Ventes, encaissements et stock : filtrez, imprimez ou téléchargez chaque rapport."}
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-purple-100 bg-white p-3 shadow-sm sm:p-5">
          <Tabs activeKey={actif} onChange={changerOnglet} items={onglets} className="rapports-onglets" destroyOnHidden />
        </div>
      </div>
      <style>{`
        .rapports-onglets .ant-tabs-nav { margin-bottom: 20px; }
        .rapports-onglets .ant-tabs-tab { padding: 10px 4px; font-weight: 600; }
        .rapports-onglets .ant-tabs-tab:not(.ant-tabs-tab-active) .ant-tabs-tab-btn { color: #64748b; }
      `}</style>
    </ConfigProvider>
  );
};

export default DeliveryReportPage;
