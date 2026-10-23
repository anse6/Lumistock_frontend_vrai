// Fonctions et constantes partagées par les onglets de la page Paramètres.
import { formatPhoneNumberIntl } from "react-phone-number-input";
import dayjs from "dayjs";

export const APP_COLOR = "#3b1558";

export const getApiError = (data: unknown, fallback: string) => {
  const d = data as { message?: string; error?: string; errors?: Record<string, string[]> } | null;
  if (d?.message) return d.message;
  if (typeof d?.error === "string") return d.error;
  const premier = d?.errors && Object.values(d.errors)[0];
  return (Array.isArray(premier) && premier[0]) || fallback;
};

/** Numéro international lisible, quel que soit le pays (+237 6 90 12 34 56). */
export const formatPhone = (telephone?: string) => {
  if (!telephone) return "";
  return formatPhoneNumberIntl(telephone) || telephone;
};

export const formatDate = (value?: string | { $date?: string }) => {
  const raw = typeof value === "string" ? value : value?.$date;
  if (!raw) return "";
  const date = dayjs(raw);
  return date.isValid()
    ? date.toDate().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "";
};

export const carte = "!rounded-2xl !border !border-purple-100/70 !shadow-sm [&_.ant-card-body]:!p-4 sm:[&_.ant-card-body]:!p-6";
