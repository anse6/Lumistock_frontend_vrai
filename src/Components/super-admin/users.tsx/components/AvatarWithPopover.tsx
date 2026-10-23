import React from "react";
import { Avatar, Button, Popover } from "antd";
import { MailOutlined } from "@ant-design/icons";

const COLORS = [
  "#023B6A",
  "#0E7490",
  "#7C3AED",
  "#B45309",
  "#059669",
  "#C026D3",
  "#DC2626",
  "#EA580C",
];

const getColor = (name = "") => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1)
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return (parts[0][0] || "?").toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

interface AvatarWithPopoverProps {
  name: string;
  /** Facultatif : sans adresse (ex. client sans e-mail), pas de bouton d'envoi. */
  email?: string | null;
  size?: number;
}

const AvatarWithPopover: React.FC<AvatarWithPopoverProps> = ({
  name,
  email,
  size = 36,
}) => {
  const color = getColor(name);
  const initials = getInitials(name);
  const aEmail = !!email && email.trim() !== "" && email !== "—";
  const popoverContent = (
    <div className="w-[220px]">
      <div
        style={{
          backgroundColor: color,
          borderRadius: "12px 12px 0 0",
          margin: "-12px -16px 0",
          padding: 16,
        }}
        className="flex items-center gap-3"
      >
        <Avatar
          size={44}
          style={{
            backgroundColor: "#fff",
            color,
            fontWeight: 700,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>
        <div className="min-w-0">
          <p className="m-0 truncate text-[14px] font-bold text-white">
            {name}
          </p>
          {aEmail && <p className="m-0 truncate text-[11px] text-white/70">{email}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-3">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Adresse email
        </p>
        {aEmail ? (
          <>
            <a
              href={`mailto:${email}`}
              className="break-all text-[13px] font-semibold hover:underline"
              style={{ color }}
            >
              {email}
            </a>
            <Button
              type="primary"
              icon={<MailOutlined />}
              size="small"
              href={`mailto:${email}`}
              style={{ background: color, borderColor: color, marginTop: 4 }}
              block
            >
              Envoyer un email
            </Button>
          </>
        ) : (
          <p className="m-0 text-[13px] text-slate-400">Aucune adresse e-mail</p>
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="hover"
      placement="bottom"
      styles={{ body: { padding: "12px 16px 14px", borderRadius: 14 } }}
      overlayStyle={{ minWidth: 240 }}
      mouseEnterDelay={0.1}
      mouseLeaveDelay={0.15}
    >
      <Avatar
        size={size}
        style={{
          backgroundColor: color,
          color: "#fff",
          fontWeight: 700,
          fontSize: size * 0.38,
          cursor: "default",
          flexShrink: 0,
        }}
        className="transition-transform hover:scale-110"
      >
        {initials}
      </Avatar>
    </Popover>
  );
};

export default AvatarWithPopover;
