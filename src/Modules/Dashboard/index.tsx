import { useRef } from "react";
import DashboardStats from "../../Components/Livraison/DashboardStats/DashboardStats";
import FullDashboard from "../../Components/FullDashboard/FullDashboard";
import PageTitle from "../../Components/PageTitle";
import { ChevronDown } from "lucide-react";
import Globalmulti from "@/Components/admin/FullDashboard/Globalmulti";
import { useTranslation } from "react-i18next";
import AIInsightsBar from "../../Components/admin/AIInsights/AIInsightsBar";

const Adminsdashboard = () => {
  const { t } = useTranslation();
  const fullDashboardRef = useRef<HTMLDivElement>(null);

  const scrollToFullDashboard = () => {
    if (fullDashboardRef.current) {
      const offsetTop = fullDashboardRef.current.offsetTop;
      window.scrollTo({
        top: offsetTop + 850, // 💡 scroll plus bas (ajuste cette valeur selon ton besoin)
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <PageTitle>{t("admin.dashboard.title")}</PageTitle>

      {/* Flèche visible uniquement sur mobile */}
      <div className="fixed top-5 right-5 z-50 md:hidden ">
        <button
          onClick={scrollToFullDashboard}
          className="bg-white shadow-lg p-2 rounded-full hover:bg-gray-100 transition translate-y-148"
          aria-label={t("admin.dashboard.scroll_down")}
        >
          <ChevronDown size={24} className="text-[#1E293B] animate-bounce" />
        </button>
      </div>

      <div className="mt-6 w-full px-2 sm:px-4 md:px-6">
        <AIInsightsBar />
        <div className="w-full">
          <DashboardStats />
        </div>
        <div className="-translate-y-5">
          <Globalmulti />
        </div>

        <div ref={fullDashboardRef} className="w-full mt-10 sm:mt-16 md:mt-8">
          <FullDashboard />
        </div>
      </div>
    </>
  );
};

export default Adminsdashboard;
