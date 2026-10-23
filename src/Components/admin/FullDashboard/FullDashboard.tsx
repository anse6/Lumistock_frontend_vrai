import BestSellingProducts from "./BestSellingProducts";
import TopClients from "./TopClients";
import TopDebtors from "./TopDebtors";
import TopFournisseurs from "./TopFournisseurs";
import RecentDeliveries from "./RecentDeliveries";
import RevenueChart from "../Diagramme/RevenueChart";
import { PaymentStatsChart } from "../Diagramme/PaymentStatsChart";

import RevenueChartretours from "../Diagramme/RevenueChartretour";
import ClientDebtStatsChart from "../Diagramme/ClientDebtStatsChart";

const FullDashboard = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 xl:gap-8 items-stretch">
        {/* 1. FINANCIALS */}
        <div className="md:col-span-1 lg:col-span-3 min-w-0">
          <RevenueChart />
        </div>

        <div className="md:col-span-1 lg:col-span-3 min-w-0">
          <RevenueChartretours />
        </div>

        {/* 2. PERFORMANCE */}
        <div className="md:col-span-1 lg:col-span-2 min-w-0 h-full">
          <BestSellingProducts />
        </div>

        <div className="md:col-span-1 lg:col-span-2 min-w-0 h-full">
          <TopClients />
        </div>

        <div className="md:col-span-1 lg:col-span-2 min-w-0 h-full">
          <TopFournisseurs />
        </div>

        {/* 3. RANKINGS */}
        <div className="md:col-span-1 lg:col-span-2 min-w-0 h-full">
          <TopDebtors />
        </div>

        <div className="md:col-span-2 lg:col-span-4 min-w-0">
          <ClientDebtStatsChart />
        </div>

        {/* 4. ANALYTICS */}
        <div className="md:col-span-1 lg:col-span-3 min-w-0">
          <PaymentStatsChart />
        </div>

        <div className="md:col-span-1 lg:col-span-3 min-w-0">
          <RecentDeliveries />
        </div>
      </div>
    </div>
  );
};

export default FullDashboard;
