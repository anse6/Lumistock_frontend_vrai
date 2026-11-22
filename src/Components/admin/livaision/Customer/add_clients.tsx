// Page Clients › Nouveau client. Le formulaire lui-même (FormulaireClient) est
// partagé avec l'étape « Client » d'une vente.
import React, { useEffect } from "react";
import { App, ConfigProvider } from "antd";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import PageTitle from "../../../PageTitle";
import FormulaireClient, { PURPLE_950 } from "./FormulaireClient";

interface AddClientProps {
  onCancel: () => void;
}

const AddClient: React.FC<AddClientProps> = ({ onCancel }) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      message.error(t("admin.customers.add.validation.authRequired"));
      navigate("/login");
    }
  }, [navigate, t, message]);

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: PURPLE_950, borderRadius: 10 },
        components: { Button: { colorPrimary: PURPLE_950 } },
      }}
    >
      <PageTitle>{t("admin.customers.title")}</PageTitle>
      <div className="min-h-screen w-full bg-white p-4 pb-16 sm:p-6">
        {/* Fil d'Ariane */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-medium">
          <Link
            to="/admin/dashboard/customers"
            style={{ backgroundColor: PURPLE_950 }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold !text-white shadow-sm hover:opacity-90"
          >
            <ArrowLeft size={14} />
            {t("admin.customers.title")}
          </Link>
          <span className="font-bold text-gray-300">›</span>
          <span className="rounded-xl bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-950">Nouveau client</span>
        </div>

        {/* En-tête */}
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-purple-950/20" style={{ backgroundColor: PURPLE_950 }}>
            <UserPlus size={22} />
          </span>
          <div>
            <h1 className="text-lg font-bold text-purple-950">{t("admin.customers.add.title")}</h1>
            <p className="text-xs text-slate-500">
              Seul le nom est obligatoire. Le numéro de téléphone identifie le client : il ne peut appartenir qu'à un seul
              client du magasin.
            </p>
          </div>
        </div>

        <FormulaireClient onCree={() => navigate("/admin/dashboard/customers")} onAnnuler={onCancel} />
      </div>
    </ConfigProvider>
  );
};

export default AddClient;
