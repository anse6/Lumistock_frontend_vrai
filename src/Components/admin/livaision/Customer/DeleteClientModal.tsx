import React, { useState, useEffect } from "react";
import { App, ConfigProvider, Modal } from "antd";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getUrlServer } from "../../../../configServer";
import type { Client } from "./client";

interface DeleteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onClientDeleted: () => void;
}

const fmt = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR")} CFA`;

// Mise à la corbeille d'un client (restaurable). Le serveur refuse si de
// l'argent est encore en jeu : on l'annonce avant même de cliquer.
const DeleteClientModal: React.FC<DeleteClientModalProps> = ({ isOpen, onClose, client, onClientDeleted }) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [client]);

  if (!client) return null;
  const solde = client.montant_en_caisse ?? 0;
  const dette = client.dette ?? 0;
  const blocage =
    solde > 0
      ? `Ce client a encore ${fmt(solde)} sur son compte : retirez-les avant de le supprimer.`
      : dette > 0
        ? `Ce client doit encore ${fmt(dette)} : sa dette disparaîtrait des listes s'il était supprimé.`
        : null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error(t("admin.customers.add.validation.authRequired"));
      const response = await fetch(`${getUrlServer()}/clients/${client.client_id || client._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || `Erreur HTTP : ${response.status}`);
      message.success(data.message || t("admin.customers.modals.delete.successMsg", { name: client.nom }));
      onClientDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.customers.add.validation.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#3b0764", borderRadius: 10 } }}>
      <Modal
        open={isOpen}
        onCancel={loading ? undefined : onClose}
        centered
        width={460}
        footer={null}
        title={
          <span className="flex items-center gap-2 font-bold text-red-700">
            <AlertTriangle size={18} /> {t("admin.customers.modals.delete.title")}
          </span>
        }
      >
        <div className="space-y-3 pt-1 text-sm text-slate-600">
          <p>
            Le client <b className="text-purple-950">{client.nom}</b> sera mis à la corbeille.
          </p>
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <RotateCcw size={14} className="mt-0.5 shrink-0" />
            Vous pourrez le restaurer depuis la corbeille. Ses ventes restent enregistrées.
          </p>

          {blocage && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">{blocage}</div>
          )}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-950 hover:bg-purple-50 disabled:opacity-50"
            >
              Garder
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || !!blocage}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Trash2 size={15} />
              )}
              {loading ? t("admin.customers.modals.delete.deleting") : "Mettre à la corbeille"}
            </button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default DeleteClientModal;
