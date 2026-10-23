import React, { useState, useEffect } from "react";
import PageTitle from "../../../PageTitle";
import { fetchLivraisonsByPaymentMethod } from "../livraisonfinal/livraisonService";
import { CreditCard, Smartphone, Banknote, User } from "lucide-react";
import { Table, Card, Select, Tag, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import images from "@/assets/no_data.png";

const { Option } = Select;

interface PaymentDelivery {
  id: string;
  client: {
    nom: string;
    telephone: string;
  };
  montant_total: number;
  statut_paiement: string;
}

interface PaymentFilteringProps {
  isTabMode?: boolean;
}

const PaymentFiltering: React.FC<PaymentFilteringProps> = ({
  isTabMode = false,
}) => {
  const { t } = useTranslation();
  const [method, setMethod] = useState<string>("cash");
  const [periode, setPeriode] = useState<string>("");
  const [data, setData] = useState<{
    total_general: number;
    livraisons: PaymentDelivery[];
  }>({ total_general: 0, livraisons: [] });
  const [loading, setLoading] = useState<boolean>(true);

  const paymentMethods = [
    {
      value: "cash",
      label: t("reports.paymentFiltering.methods.cash"),
      icon: <Banknote size={16} className="text-green-500" />,
    },
    {
      value: "om",
      label: t("reports.paymentFiltering.methods.om"),
      icon: <Smartphone size={16} className="text-orange-500" />,
    },
    {
      value: "momo",
      label: t("reports.paymentFiltering.methods.momo"),
      icon: <Smartphone size={16} className="text-yellow-500" />,
    },
    {
      value: "bancaire",
      label: t("reports.paymentFiltering.methods.bancaire"),
      icon: <CreditCard size={16} className="text-blue-500" />,
    },
  ];

  const periodes = [
    { value: "", label: t("reports.paymentFiltering.periods.all") },
    { value: "jour", label: t("reports.paymentFiltering.periods.today") },
    { value: "semaine", label: t("reports.paymentFiltering.periods.week") },
    { value: "mois", label: t("reports.paymentFiltering.periods.month") },
    { value: "annee", label: t("reports.paymentFiltering.periods.year") },
  ];

  useEffect(() => {
    loadData();
  }, [method, periode]);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchLivraisonsByPaymentMethod(method, periode);
    setData(result);
    setLoading(false);
  };

  const columns: ColumnsType<PaymentDelivery> = [
    {
      title: t("reports.paymentFiltering.table.client"),
      key: "client",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              {record.client?.nom ||
                t("reports.paymentFiltering.table.unknown")}
            </div>
            <div className="text-xs text-gray-500">
              {record.client?.telephone ||
                t("reports.paymentFiltering.table.noPhone")}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t("reports.paymentFiltering.table.totalAmount"),
      dataIndex: "montant_total",
      key: "montant_total",
      render: (amount) => (
        <span className="font-bold">{amount?.toLocaleString() || 0} CFA</span>
      ),
    },
    {
      title: t("reports.paymentFiltering.table.paymentStatus"),
      dataIndex: "statut_paiement",
      key: "statut_paiement",
      render: (status) => (
        <Tag color={status === "payé" ? "green" : "orange"}>
          {status || "none"}
        </Tag>
      ),
    },
  ];
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin />
      </div>
    );
  }

  return (
    <>
      {!isTabMode && (
        <PageTitle>{t("reports.paymentFiltering.pageTitle")}</PageTitle>
      )}

      <div
        className={`${isTabMode ? "p-0 pt-4" : "p-6"} bg-white min-h-screen`}
      >
        {isTabMode && (
          <div className="mb-6 flex flex-col items-start gap-1 print:hidden">
            <h3 className="text-xl font-bold flex items-center gap-2 m-0 text-gray-800">
              <Banknote className="text-blue-600" size={24} />
              {t("reports.tabs.paymentTracking")}
            </h3>
            <span className="text-gray-500">
              {t("reports.paymentFiltering.periods.title")}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm mb-2 font-semibold">
              {t("reports.paymentFiltering.methods.title")}
            </div>
            <Select
              value={method}
              onChange={setMethod}
              className="w-full"
              size="large"
            >
              {paymentMethods.map((m) => (
                <Option key={m.value} value={m.value}>
                  <div className="flex items-center gap-2">
                    {m.icon}
                    <span>{m.label}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Card>

          <Card className="shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm mb-2 font-semibold">
              {t("reports.paymentFiltering.periods.title")}
            </div>
            <Select
              value={periode}
              onChange={setPeriode}
              className="w-full"
              size="large"
            >
              {periodes.map((p) => (
                <Option key={p.value} value={p.value}>
                  <span>{p.label}</span>
                </Option>
              ))}
            </Select>
          </Card>

          <Card className="shadow-sm border border-gray-100 md:col-span-2 flex items-center">
            <div className="w-full">
              <div className="text-gray-500 text-sm mb-1 font-semibold">
                {t("reports.paymentFiltering.total")} {method}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900">
                  {data?.total_general !== undefined
                    ? data.total_general.toLocaleString()
                    : "0"}{" "}
                  CFA
                </span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm border-none rounded-xl overflow-hidden">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">
              {t("reports.paymentFiltering.detailsTitle")}
            </h3>
            {loading && <Spin />}
          </div>

          {data.livraisons && data.livraisons.length > 0 ? (
            <Table
              columns={columns}
              dataSource={data.livraisons}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="custom-table"
            />
          ) : (
            <div className="flex justify-center items-center py-16">
              <img
                src={images}
                alt="No Data"
                className="h-32 w-32 object-contain"
              />
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default PaymentFiltering;
