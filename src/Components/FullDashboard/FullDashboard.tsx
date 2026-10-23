import BestSellingProducts from "./BestSellingProducts";
import TopClients from "./TopClients";
import RecentDeliveries from "./RecentDeliveries";
import RevenueChart from "./RevenueChart";
import PaymentStatsChart from "./PaymentStatsChart";
import RevenueChartretours from "../admin/Diagramme/RevenueChartretour";
import TopDebtors from "../admin/FullDashboard/TopDebtors";
import ClientDebtStatsChart from "../admin/Diagramme/ClientDebtStatsChart";

const FullDashboard = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:-translate-y-10">
      {/* MOBILE : Affichage vertical */}
      <div className="block md:hidden -translate-y-12">
        <div className="grid grid-cols-2 gap-2 mb-4 items-stretch">
          <div className="w-full min-w-0 h-full">
            <PaymentStatsChart />
          </div>
          <div className="w-full min-w-0 h-full">
            <TopClients />
          </div>
          <div className="w-full min-w-0 h-full">
            <BestSellingProducts />
          </div>
          <div className="w-full min-w-0 h-full">
            <div className="w-full h-full font-lora bg-white rounded-lg p-2 shadow-sm">
              <TopDebtors />
            </div>
          </div>
        </div>

        <div className="w-full min-w-0 mb-4">
          <RevenueChart />
        </div>
        <div className="w-full min-w-0 mb-4">
          <RevenueChartretours hideLivreurSelect={true} />
        </div>

        <div className="mb-6 translate-y-2">
          <ClientDebtStatsChart />
        </div>

        <div className="mb-6 translate-y-2">
          <RecentDeliveries />
        </div>
      </div>

      {/* TABLETTE ET DESKTOP */}
      <div className="hidden md:block">
        {/* Première ligne : RevenueChart + Remboursement côte à côte */}
        <div className="grid grid-cols-2 gap-4 lg:gap-6 mb-4">
          <div className="w-full min-w-0">
            <RevenueChart />
          </div>
          <div className="w-full min-w-0">
            <RevenueChartretours hideLivreurSelect={true} />
          </div>
        </div>

        {/* Ligne pour PaymentStatsChart */}
        <div className="w-full min-w-0 mb-4">
          <PaymentStatsChart />
        </div>

        {/* Deuxième ligne : BestSellingProducts + TopClients + TopDebtors */}
        <div className="grid grid-cols-3 gap-4 lg:gap-6 mb-4">
          <div className="w-full min-w-0">
            <BestSellingProducts />
          </div>
          <div className="w-full min-w-0">
            <TopClients />
          </div>
          <div className="w-full min-w-0">
            <TopDebtors />
          </div>
        </div>

        <div className="mb-6 translate-y-5">
          <ClientDebtStatsChart />
        </div>
        <div className="mb-6 translate-y-5">
          <RecentDeliveries />
        </div>
      </div>
    </div>
  );
};

export default FullDashboard;
