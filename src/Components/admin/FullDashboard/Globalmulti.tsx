import { useState } from "react";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import MultiLineChart from "../../component/MultiLineChart";
import { getUrlServer } from "../../../configServer";
import { Spin, Alert } from "antd";
import { useTranslation } from "react-i18next";

interface LossDetails {
  returns_value: number;
  ristournes_value: number;
  returns_count: number;
}

interface Debtor {
  name: string;
  debt: number;
}

interface EvolutionData {
  month: string;
  revenue: number;
  unpaid: number;
  risk_ratio: number;
  health_status: string;
  loss_details: LossDetails;
  top_debtors: Debtor[];
  cumulative_debt: number;
}

interface GlobalStats {
  total_revenue: number;
  total_unpaid: number;
  total_returns_loss: number;
  global_risk_ratio: number;
}

interface RiskStatsResponse {
  year: number;
  evolution: EvolutionData[];
  global_stats: GlobalStats;
}

function Globalmulti() {
  const { t } = useTranslation();
  const [currentYear, setCurrentYear] = useState(dayjs().year());

  const fetchRiskStats = async (year: number): Promise<RiskStatsResponse> => {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error(t("admin.dashboard.error"));

    const response = await axios.get(
      `${getUrlServer()}/dashboard/managers/stats/evolution-risque`,
      {
        params: { year },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["riskStats", currentYear],
    queryFn: () => fetchRiskStats(currentYear),
  });

  // Transformation des données pour le graphique
  const transformedData = {
    year: currentYear,
    month_data: (data?.evolution || []).map((item) => ({
      month: item.month,
      revenue: item.revenue,
      unpaid: item.unpaid,
      risk_ratio: item.risk_ratio,
    })),
  };

  const lineConfigs = [
    {
      key: "revenue",
      name: t("admin.dashboard.revenue_title", {
        defaultValue: "Chiffre d’affaires",
      }),
      color: "#3b82f6",
    },
    {
      key: "unpaid",
      name: t("admin.dashboard.stats.unpaid", { defaultValue: "Impayés" }),
      color: "#f43f5e",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[450px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[450px]">
        <Alert
          message={t("admin.dashboard.error")}
          description={
            error instanceof Error ? error.message : t("admin.dashboard.error")
          }
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white shadow-sm rounded-2xl font-['Inter'] min-h-[400px] border border-slate-100 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight m-0">
            {t("admin.dashboard.risk_evolution", {
              defaultValue: "Évolution Performance & Risque",
            })}
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Analyse annuelle des revenus et impayés
          </p>
        </div>

        {/* Résumé rapide (Stats Globales) */}
        {data?.global_stats && (
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {t("admin.dashboard.risk_ratio", {
                  defaultValue: "Risque Global",
                })}
              </span>
              <span
                className={`text-sm font-black ${data.global_stats.global_risk_ratio > 50 ? "text-rose-600" : "text-emerald-600"}`}
              >
                {data.global_stats.global_risk_ratio}%
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {t("admin.dashboard.stats.total", { defaultValue: "Total CA" })}
              </span>
              <span className="text-sm font-black text-slate-900">
                {data.global_stats.total_revenue.toLocaleString()} CFA
              </span>
            </div>
          </div>
        )}
      </div>

      <MultiLineChart
        value={currentYear}
        onChange={setCurrentYear}
        data={transformedData}
        lineConfigs={lineConfigs}
      />

      {/* Légende Premium */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-50 pt-6">
        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
            Impact Retours
          </p>
          <p className="text-lg font-black text-blue-900">
            {data?.global_stats.total_returns_loss.toLocaleString()} CFA
          </p>
        </div>
        <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/50">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">
            Impayés Cumulés
          </p>
          <p className="text-lg font-black text-rose-900">
            {data?.global_stats.total_unpaid.toLocaleString()} CFA
          </p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            Période
          </p>
          <p className="text-lg font-black text-slate-900">{currentYear}</p>
        </div>
      </div>
    </div>
  );
}

export default Globalmulti;
