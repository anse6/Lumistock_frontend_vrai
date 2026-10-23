// Onglet « Accès » : ce que chaque rôle peut faire dans le magasin.
// L'admin active ou retire un droit d'un clic ; le serveur applique le choix
// immédiatement (routes protégées par permission_requise). Le manager consulte.
import React, { useCallback, useEffect, useState } from "react";
import { Alert, App, Button, Card, Skeleton, Switch, Tag, Tooltip } from "antd";
import { LockOutlined, ReloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { getUrlServer } from "../../../configServer";
import { EVENEMENT_DROITS } from "../../../hooks/useCompteConnecte";
import { SectionTitle } from "./elements";
import { carte, getApiError } from "./outils";

interface EtatRole {
  actif: boolean;
  modifiable: boolean;
  defaut: boolean;
}

interface Droit {
  cle: string;
  groupe: string;
  libelle: string;
  description: string;
  roles: Record<string, EtatRole>;
}

interface Configuration {
  groupes: { cle: string; libelle: string }[];
  roles: { cle: string; libelle: string }[];
  droits: Droit[];
  personnalise: boolean;
  modifiable: boolean;
}

const appel = async (methode: "GET" | "PUT" | "DELETE", corps?: unknown): Promise<Configuration & { message?: string }> => {
  const r = await fetch(`${getUrlServer()}/magasin/permissions`, {
    method: methode,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      ...(corps ? { "Content-Type": "application/json" } : {}),
    },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(getApiError(data, "Impossible de charger les droits d'accès."));
  return data;
};

const GestionAcces: React.FC = () => {
  const { message, modal } = App.useApp();
  const [config, setConfig] = useState<Configuration | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

  const charger = useCallback(() => {
    setErreur(null);
    appel("GET").then(setConfig).catch((e) => setErreur(e.message));
  }, []);

  useEffect(charger, [charger]);

  const appliquer = (nouvelle: Configuration) => {
    setConfig(nouvelle);
    window.dispatchEvent(new Event(EVENEMENT_DROITS));
  };

  const basculer = async (droit: Droit, role: string, actif: boolean) => {
    const cle = `${droit.cle}:${role}`;
    setEnCours(cle);
    try {
      appliquer(await appel("PUT", { droits: { [droit.cle]: { [role]: actif } } }));
      const libelleRole = config?.roles.find((r) => r.cle === role)?.libelle || role;
      message.success(`${libelleRole} : « ${droit.libelle} » ${actif ? "activé" : "retiré"}.`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  };

  const reinitialiser = () =>
    modal.confirm({
      title: "Rétablir les droits par défaut ?",
      content: "Tous les rôles retrouvent les droits d'origine de Lumistock. Vos réglages actuels seront perdus.",
      okText: "Rétablir",
      cancelText: "Annuler",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          appliquer(await appel("DELETE"));
          message.success("Droits par défaut rétablis.");
        } catch (e) {
          message.error(e instanceof Error ? e.message : "Une erreur est survenue.");
        }
      },
    });

  if (erreur) {
    return (
      <Alert type="error" showIcon message="Droits d'accès indisponibles" description={erreur}
             action={<Button onClick={charger}>Réessayer</Button>} />
    );
  }
  if (!config) return <Skeleton active paragraph={{ rows: 8 }} />;

  const modifiable = config.modifiable;

  return (
    <div className="flex flex-col gap-5">
      <Card variant="borderless" className={carte}>
        <SectionTitle
          icon={<SafetyCertificateOutlined />}
          title="Accès par rôle"
          description="Choisissez ce que chaque rôle peut faire dans votre magasin."
          extra={
            modifiable && config.personnalise && (
              <Button icon={<ReloadOutlined />} onClick={reinitialiser}>
                Rétablir les droits par défaut
              </Button>
            )
          }
        />
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li>• L'<b>administrateur</b> a toujours tous les droits : il ne peut pas se bloquer lui-même.</li>
          <li>• Un changement s'applique <b>immédiatement</b> ; la personne concernée voit ses boutons changer au prochain chargement de page.</li>
          <li>
            • <LockOutlined className="text-slate-400" /> signifie que ce rôle n'a pas d'écran pour cette action :
            elle ne se règle donc pas pour lui.
          </li>
        </ul>
        {!modifiable && (
          <Alert className="!mt-4" type="info" showIcon
                 message="Consultation seule : seul l'administrateur du magasin peut changer les droits." />
        )}
      </Card>

      {config.groupes.map((groupe) => {
        const droits = config.droits.filter((d) => d.groupe === groupe.cle);
        if (!droits.length) return null;
        return (
          <Card key={groupe.cle} variant="borderless" className={carte}>
            <h3 className="mb-3 text-base font-bold text-purple-950">{groupe.libelle}</h3>
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-1 py-2 font-semibold">Action</th>
                    <th className="w-24 px-2 py-2 text-center font-semibold">Admin</th>
                    {config.roles.map((r) => (
                      <th key={r.cle} className="w-24 px-2 py-2 text-center font-semibold">{r.libelle}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {droits.map((droit) => (
                    <tr key={droit.cle} className="align-top">
                      <td className="px-1 py-3 pr-4">
                        <div className="font-medium text-slate-800">{droit.libelle}</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{droit.description}</div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <Tag className="!m-0 !rounded-full !border-purple-200 !bg-purple-50 !text-[11px] !text-purple-900">
                          Toujours
                        </Tag>
                      </td>
                      {config.roles.map((r) => {
                        const etat = droit.roles[r.cle];
                        if (!etat?.modifiable) {
                          return (
                            <td key={r.cle} className="px-2 py-3 text-center">
                              <Tooltip title={`Pas d'écran pour le rôle ${r.libelle} : non réglable.`}>
                                <LockOutlined className="text-slate-300" aria-label="Non réglable" />
                              </Tooltip>
                            </td>
                          );
                        }
                        const change = etat.actif !== etat.defaut;
                        return (
                          <td key={r.cle} className="px-2 py-3 text-center">
                            <Switch
                              size="small"
                              checked={etat.actif}
                              disabled={!modifiable || (enCours !== null && enCours !== `${droit.cle}:${r.cle}`)}
                              loading={enCours === `${droit.cle}:${r.cle}`}
                              onChange={(v) => basculer(droit, r.cle, v)}
                              aria-label={`${droit.libelle} — ${r.libelle}`}
                            />
                            {change && (
                              <Tooltip title={`Par défaut : ${etat.defaut ? "activé" : "désactivé"}`}>
                                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                                  modifié
                                </div>
                              </Tooltip>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default GestionAcces;
