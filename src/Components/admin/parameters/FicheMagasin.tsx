// Onglet « Magasin » : fiche complète de l'entreprise, licence et équipe.
// L'admin la modifie ; le manager la consulte seulement.
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, App, Button, Card, Divider, Typography } from "antd";
import {
  BankOutlined,
  CopyOutlined,
  EditOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { MagasinConnecte, Permission } from "../../../hooks/useCompteConnecte";
import { LIBELLES_ROLE } from "../../../hooks/useCompteConnecte";
import { DetailItem, RoleTag, SectionTitle } from "./elements";
import { carte, formatDate, formatPhone } from "./outils";
import ModifierMagasinModal from "./ModifierMagasinModal";
import { StoreStatus } from "../../super-admin/magasin/storeUi";

const { Text } = Typography;

interface Props {
  magasin: MagasinConnecte;
  peut: (permission: Permission) => boolean;
  onSaved: () => void;
}

const FicheMagasin: React.FC<Props> = ({ magasin, peut, onSaved }) => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [edition, setEdition] = useState(false);
  const modifiable = peut("magasin.modifier");

  const membres = useMemo(() => magasin.utilisateurs || [], [magasin]);
  const quotas = useMemo(() => {
    const actifs = membres.filter((u) => u.is_active !== false);
    const compter = (...roles: string[]) => actifs.filter((u) => roles.includes(u.role)).length;
    return [
      { libelle: "Managers", utilises: compter("manager"), max: magasin.licence?.max_managers ?? 0 },
      { libelle: "Gérants", utilises: compter("gerant", "livreur"), max: magasin.licence?.max_livreurs ?? 0 },
      { libelle: "Caissiers", utilises: compter("caissier"), max: magasin.licence?.max_caissiers ?? 2 },
    ];
  }, [membres, magasin.licence]);

  const adresse = [magasin.adresse_ligne_1, magasin.adresse_ligne_2, magasin.quartier, magasin.code_postal, magasin.ville, magasin.pays]
    .filter(Boolean)
    .join(", ");
  const site = magasin.site_web ? (magasin.site_web.startsWith("http") ? magasin.site_web : `https://${magasin.site_web}`) : "";

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        {!modifiable && (
          <Alert
            type="info"
            showIcon
            message="Consultation seule"
            description="L'administrateur ne vous a pas donné le droit de modifier ces informations (Paramètres > Accès)."
          />
        )}

        <Card variant="borderless" className={carte}>
          <SectionTitle
            icon={<BankOutlined />}
            title="Identité de l'entreprise"
            description="Ces informations apparaissent sur vos factures et reçus"
            extra={
              modifiable && (
                <Button type="primary" icon={<EditOutlined />} onClick={() => setEdition(true)}>
                  Modifier le magasin
                </Button>
              )
            }
          />
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <DetailItem label="Dénomination" value={magasin.denomination} />
            <DetailItem label="Raison sociale" value={magasin.raison_sociale} />
            <DetailItem label="Forme juridique" value={magasin.forme_juridique} />
            <DetailItem label="Activité" value={magasin.activité} />
            <DetailItem label="Email" value={magasin.email} />
            <DetailItem label="Téléphone" value={formatPhone(magasin.telephone)} />
            <DetailItem
              label="Site web"
              value={
                site && (
                  <a href={site} target="_blank" rel="noopener noreferrer" className="text-purple-800 hover:underline">
                    {magasin.site_web}
                  </a>
                )
              }
            />
            <DetailItem label="Devise" value={magasin.devise} />
          </div>
        </Card>

        <Card variant="borderless" className={carte}>
          <SectionTitle icon={<EnvironmentOutlined />} title="Adresse" description="Localisation officielle du magasin" />
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <DetailItem label="Pays" value={magasin.pays && `${magasin.pays}${magasin.country_code ? ` (${magasin.country_code})` : ""}`} />
            <DetailItem label="Ville" value={magasin.ville} />
            <DetailItem label="Quartier" value={magasin.quartier} />
            <DetailItem label="Code postal" value={magasin.code_postal} />
            <DetailItem label="Adresse ligne 1" value={magasin.adresse_ligne_1} />
            <DetailItem label="Adresse ligne 2" value={magasin.adresse_ligne_2} />
            <DetailItem label="Adresse complète" value={adresse} className="sm:col-span-2" />
          </div>
        </Card>

        <Card variant="borderless" className={carte}>
          <SectionTitle icon={<IdcardOutlined />} title="Informations légales" description="Immatriculation et fiscalité" />
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <DetailItem label="N° d'immatriculation" value={magasin.numero_immatriculation} />
            <DetailItem label="N° fiscal" value={magasin.numero_fiscal} />
          </div>
        </Card>
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        <Card variant="borderless" className="!rounded-2xl !border !border-purple-200 !bg-purple-50/60 !shadow-none">
          <SectionTitle icon={<SafetyCertificateOutlined />} title="Licence" description="Comptes actifs / autorisés" />
          <div className="space-y-3">
            {quotas.map((q) => {
              const plein = q.max > 0 && q.utilises >= q.max;
              return (
                <div key={q.libelle} className="rounded-xl bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">{q.libelle}</span>
                    <span className="text-sm tabular-nums text-slate-500">
                      <strong className="text-lg text-slate-900">{q.utilises}</strong> / {q.max}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-purple-100/70">
                    <div
                      className={`h-full rounded-full ${plein ? "bg-amber-500" : "bg-purple-800"}`}
                      style={{ width: `${q.max ? Math.min((q.utilises / q.max) * 100, 100) : 0}%` }}
                    />
                  </div>
                  {plein && <p className="mt-1.5 text-[11px] font-medium text-amber-700">Limite atteinte</p>}
                </div>
              );
            })}
          </div>
          <Text className="mt-3 block text-xs text-slate-500">
            Pour augmenter ces limites, contactez l'équipe Lumistock.
          </Text>
        </Card>

        <Card variant="borderless" className={carte}>
          <SectionTitle
            icon={<TeamOutlined />}
            title="Équipe"
            description={`${membres.length} compte${membres.length > 1 ? "s" : ""} dans ce magasin`}
          />
          <ul className="divide-y divide-slate-100">
            {membres.map((m) => (
              <li key={m._id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 capitalize">
                    {`${m.first_name || ""} ${m.name || ""}`.trim() || m.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {m.is_active === false ? "Désactivé" : m.email}
                  </p>
                </div>
                <RoleTag role={m.role} libelle={LIBELLES_ROLE[m.role] || m.role} />
              </li>
            ))}
          </ul>
          {peut("equipe.gerer") && (
            <Button block className="!mt-3" onClick={() => navigate("/admin/dashboard/users")}>
              Gérer l'équipe
            </Button>
          )}
        </Card>

        <Card variant="borderless" className={carte}>
          <div className="space-y-4">
            <DetailItem label="Statut du magasin" value={<StoreStatus store={{ is_active: magasin.is_active !== false }} />} />
            <Divider className="!my-0 !border-slate-100" />
            <DetailItem label="Client Lumistock depuis" value={formatDate(magasin.created_at)} />
            <Divider className="!my-0 !border-slate-100" />
            <DetailItem
              label="Identifiant du magasin"
              value={
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="break-all">{magasin._id}</span>
                  <Button
                    type="text"
                    size="small"
                    aria-label="Copier l'identifiant"
                    icon={<CopyOutlined />}
                    className="!text-purple-800"
                    onClick={() => {
                      navigator.clipboard?.writeText(magasin._id);
                      message.success("Identifiant copié");
                    }}
                  />
                </span>
              }
            />
          </div>
        </Card>
      </aside>

      {modifiable && (
        <ModifierMagasinModal
          open={edition}
          magasin={magasin}
          onClose={() => setEdition(false)}
          onSaved={() => {
            setEdition(false);
            onSaved();
          }}
        />
      )}
    </div>
  );
};

export default FicheMagasin;
