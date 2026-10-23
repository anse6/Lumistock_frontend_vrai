// Fenêtre « Se déconnecter ? » commune à toute l'application.
// Les boutons Déconnexion appellent demanderDeconnexion() ; la fenêtre, montée une
// seule fois dans App.tsx, confirme puis appelle l'API (POST /auth/logout, et
// POST /auth/logout_all si l'utilisateur ferme aussi ses autres appareils).
import React, { useState } from "react";
import { Checkbox, Modal } from "antd";
import { LogOut } from "lucide-react";
import { create } from "zustand";
import { useTranslation } from "react-i18next";
import { deconnecter } from "./services/session";

const useDemande = create<{ redirection: string | null; demander: (r: string) => void; fermer: () => void }>((set) => ({
  redirection: null,
  demander: (redirection) => set({ redirection }),
  fermer: () => set({ redirection: null }),
}));

/** Ouvre la fenêtre de confirmation ; redirection = page affichée après la déconnexion. */
export const demanderDeconnexion = (redirection = "/login") => useDemande.getState().demander(redirection);

const ConfirmationDeconnexion: React.FC = () => {
  const { t } = useTranslation();
  const { redirection, fermer } = useDemande();
  const [partout, setPartout] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const confirmer = async () => {
    if (!redirection) return;
    setEnCours(true);
    // deconnecter() quitte la page : pas besoin de remettre enCours à false.
    await deconnecter(redirection, { partout });
  };

  return (
    <Modal
      open={!!redirection}
      onCancel={() => !enCours && fermer()}
      onOk={confirmer}
      okText={t("logout_confirm.confirmer")}
      cancelText={t("logout_confirm.annuler")}
      okButtonProps={{ danger: true, loading: enCours, icon: <LogOut size={15} /> }}
      cancelButtonProps={{ disabled: enCours }}
      closable={!enCours}
      maskClosable={!enCours}
      centered
      width={420}
      afterClose={() => setPartout(false)}
      title={
        <span className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
            <LogOut size={18} />
          </span>
          {t("logout_confirm.titre")}
        </span>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        {t("logout_confirm.texte")}
      </p>
      <Checkbox checked={partout} onChange={(e) => setPartout(e.target.checked)} disabled={enCours}>
        {t("logout_confirm.partout")}
      </Checkbox>
    </Modal>
  );
};

export default ConfirmationDeconnexion;
