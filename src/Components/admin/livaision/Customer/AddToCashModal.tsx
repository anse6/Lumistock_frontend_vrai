import React, { useState } from "react";
import { Modal, InputNumber, Button, Space, Typography, App, Segmented } from "antd";
import { Wallet, CheckCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getUrlServer } from "../../../../configServer";

const { Text, Title } = Typography;

interface Client {
  _id?: string;
  client_id?: string;
  nom: string;
}

interface AddToCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: () => void;
}

const AddToCashModal: React.FC<AddToCashModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation();
  // Messages via le contexte <App> (les fonctions statiques d'antd ne s'affichent pas sous React 19).
  const { notification } = App.useApp();
  const [amount, setAmount] = useState<number | null>(null);
  // Moyen par lequel l'argent est reçu : il entre dans la bonne trésorerie (caisse, banque, mobile money).
  const [mode, setMode] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!client || amount === null || amount <= 0) {
      notification.warning({
        message: t("admin.customers.modals.addToCash.error"),
        description: t("admin.customers.modals.addToCash.errorInvalid"),
      });
      return;
    }

    setLoading(true);
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      const clientId = client.client_id || client._id;

      const response = await fetch(
        `${getUrlServer()}/clients/${clientId}/ajouter-caisse`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ montant: amount, mode_paiement: mode }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `Erreur HTTP: ${response.status}`,
        );
      }

      const msg =
        data.message ||
        t("admin.customers.modals.addToCash.successMsg", {
          amount: amount?.toLocaleString(
            i18n.language === "fr" ? "fr-FR" : "en-US",
          ),
          name: client.nom,
        });

      setServerMessage(msg);
      setSuccess(true);
      onSuccess();
    } catch (error: any) {
      console.error("Error adding to cash:", error);
      notification.error({
        message: t("admin.customers.add.validation.error"),
        description:
          error.message || t("admin.customers.modals.addToCash.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount(null);
    setMode("cash");
    setSuccess(false);
    setServerMessage(null);
    onClose();
  };

  return (
    <Modal
      title={
        !success ? (
          <Space>
            <Wallet size={24} className="text-purple-600" />
            <span className="text-xl">
              {t("admin.customers.modals.addToCash.title")}
            </span>
          </Space>
        ) : null
      }
      open={isOpen}
      onCancel={handleClose}
      width={500}
      footer={
        success
          ? [
              <Button
                key="close"
                type="primary"
                onClick={handleClose}
                size="large"
                className="bg-purple-600 hover:bg-purple-700 w-full rounded-xl"
              >
                {t("admin.customers.modals.edit.close") || "Fermer"}
              </Button>,
            ]
          : [
              <Button
                key="cancel"
                onClick={handleClose}
                disabled={loading}
                size="large"
                className="rounded-xl"
              >
                {t("admin.customers.add.cancel")}
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                className="rounded-xl"
                size="large"
              >
                {t("admin.customers.modals.addToCash.save")}
              </Button>,
            ]
      }
      centered
      closable={!loading}
    >
      <div className="py-4">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={48} className="text-purple-600" />
            </div>
            <Title level={3} className="text-purple-700 mb-2">
              {t("admin.customers.modals.addToCash.success")}
            </Title>
            <Text className="text-lg text-gray-600 max-w-xs mx-auto">
              {serverMessage}
            </Text>
          </div>
        ) : (
          <>
            <div className="mb-6 p-5 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col">
              <Text
                type="secondary"
                className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1"
              >
                {t("admin.customers.table.columns.name")}
              </Text>
              <div className="text-lg font-bold text-slate-800">
                {client?.nom}
              </div>
            </div>

            <div className="space-y-3 px-1">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <Wallet size={18} className="text-purple-500" />
                {t("admin.customers.modals.addToCash.amount")} (CFA)
              </label>
              <InputNumber
                className="w-full h-14 flex items-center text-2xl font-bold rounded-xl border-slate-200"
                style={{ width: "100%" }}
                size="large"
                placeholder="0"
                value={amount}
                onChange={(val) => setAmount(val)}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                }
                parser={(value) =>
                  value!.replace(/\s?|CFA/g, "") as unknown as number
                }
                min={1}
                autoFocus
              />
              <div className="pt-1 text-sm font-semibold text-slate-700">Argent reçu par</div>
              <Segmented
                block
                value={mode}
                onChange={(v) => setMode(String(v))}
                options={[
                  { value: "cash", label: "Espèces" },
                  { value: "om", label: "Orange Money" },
                  { value: "momo", label: "MTN MoMo" },
                  { value: "bancaire", label: "Banque" },
                ]}
              />
              <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <Info size={16} className="text-purple-500 mt-0.5" />
                <Text
                  type="secondary"
                  className="text-xs text-purple-700 leading-tight"
                >
                  {t("admin.customers.modals.addToCash.title")}.{" "}
                  {t(
                    "admin.customers.modals.withdrawFromCash.confirmDeleteMessage",
                    "Le montant sera ajouté au solde disponible du client.",
                  )}
                </Text>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AddToCashModal;
