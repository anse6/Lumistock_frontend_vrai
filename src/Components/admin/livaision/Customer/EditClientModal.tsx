import React, { useState, useEffect } from "react";
import { App, ConfigProvider, Input, Modal } from "antd";
import { Mail, UserPen, Wallet } from "lucide-react";
import type { CountryCode } from "libphonenumber-js";
import { useTranslation } from "react-i18next";
import { getUrlServer } from "../../../../configServer";
import type { Client } from "./client";
import TelephoneInternational, {
  decouperNumero,
  Drapeau,
  nomPays,
  numeroInternational,
  numeroValide,
  versInternational,
} from "../livraisonfinal/TelephoneInternational";
import VilleQuartier from "./VilleQuartier";

const PURPLE_950 = "#3b0764";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onClientUpdated: () => void;
}

const VIDE = { nom: "", email: "", ville: "", quartier: "" };
const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Modification des coordonnées d'un client. Le solde du compte ne se modifie
// pas ici (il passe par « Ajouter au compte » / « Retirer du compte »).
const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, onClose, client, onClientUpdated }) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [formData, setFormData] = useState(VIDE);
  const [telephone, setTelephone] = useState<{ pays: CountryCode; chiffres: string }>({ pays: "CM", chiffres: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom ?? "",
        email: client.email ?? "",
        ville: client.ville ?? "",
        quartier: client.quartier ?? "",
      });
      // Ancien numéro (9 chiffres) ou international : découpé en pays + numéro.
      // Sans numéro, le pays enregistré du client (ou le Cameroun) est proposé.
      const international = versInternational(client.telephone);
      setTelephone(
        international
          ? decouperNumero(international)
          : { pays: ((client.pays as CountryCode) || "CM"), chiffres: "" },
      );
      setError(null);
    }
  }, [client]);

  const changerTelephone = (p: CountryCode, chiffres: string) => {
    // Autre pays : la ville et le quartier saisis n'y appartiennent plus.
    if (p !== telephone.pays) setFormData((prev) => ({ ...prev, ville: "", quartier: "" }));
    setTelephone({ pays: p, chiffres });
  };

  const changer = (champ: keyof typeof VIDE) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [champ]: e.target.value }));

  const handleSubmit = async () => {
    if (!client) return;
    if (!formData.nom.trim()) return setError("Le nom du client est obligatoire.");
    if (formData.email.trim() && !EMAIL_VALIDE.test(formData.email.trim())) {
      return setError("L'adresse e-mail n'est pas valide.");
    }
    if (telephone.chiffres && !numeroValide(telephone.pays, telephone.chiffres)) {
      return setError("Le numéro de téléphone n'est pas valide pour le pays choisi.");
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error(t("admin.customers.add.validation.authRequired"));
      const response = await fetch(`${getUrlServer()}/clients/${client.client_id || client._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom.trim(),
          telephone: telephone.chiffres ? numeroInternational(telephone.pays, telephone.chiffres) : "",
          email: formData.email.trim(),
          ville: formData.ville.trim(),
          quartier: formData.quartier.trim(),
          pays: telephone.pays, // le pays du client est celui de son numéro
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || `Erreur HTTP : ${response.status}`);
      message.success(t("admin.customers.modals.edit.successMsg", { name: formData.nom.trim() }));
      onClientUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.customers.add.validation.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;
  const solde = client.montant_en_caisse ?? 0;

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}>
      <Modal
        open={isOpen}
        onCancel={loading ? undefined : onClose}
        centered
        width={520}
        footer={null}
        title={
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: PURPLE_950 }}>
              <UserPen size={18} />
            </span>
            <div>
              <div className="text-base font-bold text-purple-950">{t("admin.customers.modals.edit.title")}</div>
              <div className="text-xs font-normal text-slate-500">{client.nom}</div>
            </div>
          </div>
        }
      >
        <div className="space-y-3 pt-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("admin.customers.add.fullName")} <span className="text-red-500">*</span>
            </span>
            <Input
              size="large"
              value={formData.nom}
              onChange={changer("nom")}
              disabled={client.par_defaut}
              maxLength={100}
            />
            {client.par_defaut && (
              <span className="mt-1 block text-xs text-slate-400">Le client de passage « Autres » garde son nom.</span>
            )}
          </label>
          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("admin.customers.add.phone")}
            </span>
            <TelephoneInternational
              pays={telephone.pays}
              chiffres={telephone.chiffres}
              onChange={changerTelephone}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500">Le pays choisi ici est aussi celui du client.</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("admin.customers.add.email")}
            </span>
            <Input size="large" prefix={<Mail size={14} className="text-purple-400" />} value={formData.email} onChange={changer("email")} type="email" maxLength={120} />
          </label>
          <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm">
            <Drapeau code={telephone.pays} />
            <span className="font-semibold text-purple-950">{nomPays(telephone.pays)}</span>
          </div>
          <VilleQuartier
            pays={telephone.pays}
            ville={formData.ville}
            quartier={formData.quartier}
            onChange={({ ville, quartier }) => setFormData((prev) => ({ ...prev, ville, quartier }))}
            disabled={loading}
          />

          <div className="flex items-center justify-between rounded-xl bg-purple-50 px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2 font-semibold text-purple-950">
              <Wallet size={15} /> Solde du compte client
            </span>
            <span className="font-bold text-purple-950">{Math.round(solde).toLocaleString("fr-FR")} CFA</span>
          </div>
          <p className="-mt-1 text-xs text-slate-500">
            Pour changer le solde, utilisez « Ajouter au compte » ou « Retirer du compte » dans le menu du client.
          </p>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-950 hover:bg-purple-50 disabled:opacity-50"
            >
              {t("admin.customers.add.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-950/20 hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: PURPLE_950 }}
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {loading ? t("admin.customers.modals.edit.submitting") : t("admin.customers.modals.edit.update")}
            </button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default EditClientModal;
