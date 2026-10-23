// Page Messages : relances et informations aux clients par SMS et par email.
// L'administrateur règle les canaux et les modèles ; l'administrateur et le
// manager envoient les messages et suivent l'historique.
import React, { useCallback, useEffect, useState } from "react";
import { useOngletUrl } from "../../hooks/useOngletUrl";
import { App, Result, Spin, Tabs } from "antd";
import { MessageSquare } from "lucide-react";
import { ThemeFinance, useDevise } from "../Charges/financeUi";
import { EnteteRapport } from "../Reports/ReportUi";
import EnvoiMessages from "./EnvoiMessages";
import HistoriqueMessages from "./HistoriqueMessages";
import PlanificationMessages from "./PlanificationMessages";
import ParametresMessagerie from "./ParametresMessagerie";
import { getConfig, messageErreur, type ConfigMessagerie } from "./messagerieService";
import useCompteConnecte from "../../hooks/useCompteConnecte";

const MessageriePage: React.FC = () => {
  const { message } = App.useApp();
  const devise = useDevise();
  // Droit « Paramètres de la messagerie » (Paramètres > Accès).
  const estAdmin = useCompteConnecte().peut("messagerie.parametres");
  const [config, setConfig] = useState<ConfigMessagerie | null>(null);
  const [erreur, setErreur] = useState("");
  // Onglet relié à l'adresse (?onglet=historique) : le menu latéral ouvre l'onglet voulu.
  const [onglet, setOnglet] = useOngletUrl(
    estAdmin ? ["envoyer", "planification", "historique", "parametres"] : ["envoyer", "planification", "historique"],
    "envoyer",
  );
  const [rafraichir, setRafraichir] = useState(0);

  const charger = useCallback(async () => {
    try {
      setConfig(await getConfig());
      setErreur("");
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de charger la messagerie."));
      message.error(messageErreur(err, "Impossible de charger la messagerie."));
    }
  }, [message]);

  useEffect(() => {
    charger();
  }, [charger]);

  return (
    <ThemeFinance>
      {/* Fond blanc sur toute la zone de contenu (le layout admin est gris, avec une marge de p-6). */}
      <div className="-m-6 min-h-[calc(100%+3rem)] bg-white p-4 lg:p-6">
        <EnteteRapport
          icone={<MessageSquare size={22} />}
          titre="Messages aux clients"
          description="Rappels de dette, information sur les soldes et messages de fidélité, par SMS ou par email : maintenant, à une date choisie ou automatiquement."
        />
        {erreur && !config ? (
          <Result status="warning" title={erreur} />
        ) : !config ? (
          <div className="flex justify-center py-20"><Spin size="large" /></div>
        ) : (
          <Tabs
            activeKey={onglet}
            onChange={setOnglet}
            items={[
              {
                key: "envoyer",
                label: "Envoyer",
                children: (
                  <EnvoiMessages
                    key={JSON.stringify(config.parametres.canaux)}
                    config={config}
                    devise={devise}
                    onEnvoye={(programme) => {
                      setRafraichir((n) => n + 1);
                      setOnglet(programme ? "planification" : "historique");
                      charger();
                    }}
                  />
                ),
              },
              {
                key: "planification",
                label: "Automatique et programmés",
                children: (
                  <PlanificationMessages
                    config={config}
                    devise={devise}
                    rafraichir={rafraichir}
                    onCampagne={() => {
                      setRafraichir((n) => n + 1);
                      setOnglet("historique");
                    }}
                  />
                ),
              },
              {
                key: "historique",
                label: "Historique",
                children: (
                  <HistoriqueMessages
                    rafraichir={rafraichir}
                    plage={config.parametres.options}
                    onProgramme={() => {
                      setRafraichir((n) => n + 1);
                      setOnglet("planification");
                    }}
                  />
                ),
              },
              ...(estAdmin
                ? [{
                    key: "parametres",
                    label: "Paramètres et modèles",
                    children: (
                      <ParametresMessagerie
                        config={config}
                        onEnregistre={(parametres) => setConfig((c) => (c ? { ...c, parametres } : c))}
                      />
                    ),
                  }]
                : []),
            ]}
          />
        )}
      </div>
    </ThemeFinance>
  );
};

export default MessageriePage;
