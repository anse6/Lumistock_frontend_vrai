// Petits éléments partagés par les onglets de la page Paramètres.
import React from "react";
import { Tag, Typography } from "antd";

const { Title, Text } = Typography;

const STYLE_ROLE: Record<string, string> = {
  admin: "!border-purple-200 !bg-purple-50 !text-purple-900",
  manager: "!border-blue-200 !bg-blue-50 !text-blue-800",
  gerant: "!border-amber-200 !bg-amber-50 !text-amber-800",
  livreur: "!border-amber-200 !bg-amber-50 !text-amber-800",
  caissier: "!border-emerald-200 !bg-emerald-50 !text-emerald-800",
};

export const RoleTag: React.FC<{ role?: string; libelle: string }> = ({ role, libelle }) => (
  <Tag
    className={`!m-0 !rounded-full !px-3 !py-0.5 !text-[11px] !font-semibold ${
      STYLE_ROLE[role || ""] || "!border-slate-200 !bg-slate-50 !text-slate-700"
    }`}
  >
    {libelle}
  </Tag>
);

export const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  extra?: React.ReactNode;
}> = ({ icon, title, description, extra }) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-800">
        {icon}
      </div>
      <div className="min-w-0">
        <Title level={4} className="!mb-0 !text-[17px] !font-bold !text-slate-900">
          {title}
        </Title>
        {description && <Text className="text-xs text-slate-500">{description}</Text>}
      </div>
    </div>
    {extra}
  </div>
);

export const DetailItem: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({
  label,
  value,
  className = "",
}) => (
  <div className={`min-w-0 ${className}`}>
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
    <div className="break-words text-sm font-medium text-slate-800">
      {value || <span className="font-normal text-slate-400">Non renseigné</span>}
    </div>
  </div>
);
