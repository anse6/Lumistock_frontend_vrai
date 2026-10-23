// Choix de la langue du site public, mémorisé comme dans le reste de l'application.
import React from "react";
import { Dropdown } from "antd";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUES, langueDe } from "../../../langues";
import { changerLangue } from "../../../i18n";

const LangueSwitch: React.FC = () => {
  const { i18n } = useTranslation();
  const actuelle = langueDe(i18n.language);
  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      menu={{
        selectedKeys: [actuelle.code],
        onClick: ({ key }) => changerLangue(key),
        items: LANGUES.map((l) => ({
          key: l.code,
          label: (
            <span lang={l.code} className="flex min-w-32 items-center justify-between gap-3">
              {l.nom}
              {l.code === actuelle.code && <Check size={14} />}
            </span>
          ),
        })),
      }}
    >
      <button
        type="button"
        aria-label="Langue / Language"
        className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-trait bg-white px-2.5 text-xs font-semibold uppercase text-attenue transition-colors duration-150 hover:bg-fond hover:text-encre focus-visible:outline-2 focus-visible:outline-marque"
      >
        <Globe size={14} />
        {actuelle.code}
      </button>
    </Dropdown>
  );
};

export default LangueSwitch;
