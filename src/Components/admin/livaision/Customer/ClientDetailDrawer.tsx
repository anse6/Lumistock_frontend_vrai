import React, { useState, useEffect } from "react";
import SituationClient from "../../../Client/SituationClient";
import { etatVente } from "../../../../services/ventes";
import { Drawer, Table, Tag, Spin, Empty, Image } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  CreditCard,
  Globe2,
  Hash,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ReceiptText,
  ShoppingBag,
  User,
  UserCheck,
  Wallet,
} from "lucide-react";
import { getUrlServer } from "../../../../configServer";
// Même avatar à initiales que la liste des utilisateurs (super-admin).
import AvatarWithPopover from "../../../super-admin/users.tsx/components/AvatarWithPopover";
import { Drapeau, nomPays, NumeroAvecDrapeau } from "../livraisonfinal/TelephoneInternational";

const PURPLE_950 = "#3b0764";
const fmt = (n?: number | null) => `${Math.round(Number(n) || 0).toLocaleString("fr-FR")} CFA`;
const dateLongue = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
const vide = (v?: string | null) => !v || !v.trim() || v.trim().toUpperCase() === "N/A";

interface Product {
  produit_id: string | { $oid: string };
  nom: string;
  quantite: number;
  prix: number;
}

interface Delivery {
  id: string;
  nom_livreur: string;
  produits: Product[];
  montant_total: number;
  montant_paye: number;
  montant_restant?: number;
  statut_paiement: string;
  statut_livraison: string;
  etat?: string;
  methode_paiement: string;
  date_commande: string;
}

interface FicheClient {
  _id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  pays?: string | null;
  ville: string | null;
  quartier: string | null;
  adresse?: string | null;
  photo_profil?: string | null;
  montant_en_caisse: number;
  dette?: number;
  created_at?: string | null;
  created_by_nom?: string | null;
  par_defaut?: boolean;
}

interface ClientDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  clientName: string | null;
}

// Ligne « libellé : valeur » de la carte d'informations.
const Info: React.FC<{ icone: React.ReactNode; libelle: string; children: React.ReactNode }> = ({ icone, libelle, children }) => (
  <div className="flex items-start gap-3 py-2.5">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-950">{icone}</span>
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{libelle}</div>
      <div className="break-words text-sm font-medium text-slate-800">{children}</div>
    </div>
  </div>
);

const Carte: React.FC<{ titre: string; icone: React.ReactNode; children: React.ReactNode }> = ({ titre, icone, children }) => (
  <section className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
    <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-purple-950">
      {icone} {titre}
    </h3>
    {children}
  </section>
);

// Fiche complète du client (identité, argent, coordonnées, activité),
// puis l'historique de ses ventes.
const ClientDetailDrawer: React.FC<ClientDetailDrawerProps> = ({ isOpen, onClose, clientId, clientName }) => {
  const { t } = useTranslation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [fiche, setFiche] = useState<FicheClient | null>(null);
  const [largeur, setLargeur] = useState(() => Math.min(760, window.innerWidth));

  useEffect(() => {
    const surRedimension = () => setLargeur(Math.min(760, window.innerWidth));
    window.addEventListener("resize", surRedimension);
    return () => window.removeEventListener("resize", surRedimension);
  }, []);

  useEffect(() => {
    if (!isOpen || !clientId) return;
    let actif = true;
    (async () => {
      setLoading(true);
      setFiche(null);
      setDeliveries([]);
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
        const [repVentes, repFiche] = await Promise.all([
          fetch(`${getUrlServer()}/clients/${clientId}/livraisons`, { headers }),
          fetch(`${getUrlServer()}/clients/${clientId}`, { headers }),
        ]);
        const ventes = await repVentes.json().catch(() => []);
        const donnees = await repFiche.json().catch(() => null);
        if (!actif) return;
        setDeliveries(repVentes.ok && Array.isArray(ventes) ? ventes : []);
        setFiche(repFiche.ok ? donnees : null);
      } catch (error) {
        console.error("Détail du client :", error);
      } finally {
        if (actif) setLoading(false);
      }
    })();
    return () => {
      actif = false;
    };
  }, [isOpen, clientId]);

  // Activité calculée sur ses ventes
  const totalAchete = deliveries.reduce((s, d) => s + (Number(d.montant_total) || 0), 0);
  const totalPaye = deliveries.reduce((s, d) => s + (Number(d.montant_paye) || 0), 0);
  const dates = deliveries.map((d) => d.date_commande).filter(Boolean).sort();
  const panierMoyen = deliveries.length ? totalAchete / deliveries.length : 0;

  const nom = fiche?.nom || clientName || "";
  const photo = fiche?.photo_profil ? `${getUrlServer()}/uploads/images/${fiche.photo_profil}` : null;
  const quartierAdresse = [fiche?.quartier, fiche?.adresse].filter((v) => !vide(v)).join(" · ");

  const columns: ColumnsType<Delivery> = [
    {
      title: t("admin.customers.details.date"),
      dataIndex: "date_commande",
      key: "date",
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{new Date(date).toLocaleDateString("fr-FR")}</span>
          <span className="text-xs text-slate-400">
            {new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ),
    },
    {
      title: t("admin.customers.details.products"),
      dataIndex: "produits",
      key: "produits",
      render: (produits: Product[]) => (
        <div className="flex flex-col gap-1">
          {/* Les articles entièrement retournés (×0) ne sont plus listés. */}
          {(produits || []).filter((p) => (Number(p.quantite) || 0) > 0).map((p, i) => (
            <Tag key={i} color="purple" className="m-0 w-fit">
              {p.nom} (×{p.quantite})
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: t("admin.customers.details.amount"),
      dataIndex: "montant_total",
      key: "montant",
      align: "right",
      render: (montant: number, record) => (
        <div className="flex flex-col items-end">
          <span className="font-bold text-purple-950">{fmt(montant)}</span>
          {(Number(record.montant_restant) || 0) > 0 && (
            <span className="text-xs font-semibold text-amber-600">reste {fmt(record.montant_restant)}</span>
          )}
        </div>
      ),
    },
    {
      title: t("admin.customers.details.status"),
      key: "status",
      render: (_, record) => {
        const partiel = record.statut_paiement?.startsWith("partiel");
        return (
          <div className="flex flex-col gap-1">
            <Tag color={etatVente(record.etat).couleur} className="m-0 w-fit">
              {etatVente(record.etat).libelle}
            </Tag>
            {/* « Partiellement payé » s'affichait comme « Non payé ». */}
            <Tag color={record.statut_paiement === "payé" ? "green" : partiel ? "orange" : "red"} className="m-0 w-fit">
              {record.statut_paiement === "payé" ? t("admin.customers.details.paid") : partiel ? "Partiel" : t("admin.customers.details.unpaid")}
            </Tag>
          </div>
        );
      },
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ backgroundColor: PURPLE_950 }}>
            <User size={18} />
          </span>
          <span className="text-lg font-bold text-purple-950">{t("admin.customers.details.title")}</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={largeur}
      styles={{ body: { backgroundColor: "#faf5ff", padding: 16 } }}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Ce que le client doit (dette d'avant Lumistock + ventes impayées) */}
          {!fiche?.par_defaut && (
            <SituationClient
              clientId={clientId}
              clientNom={nom}
              // Le tiroir sert aussi au gérant : il saisit une dette d'ouverture, sans la modifier.
            />
          )}
          {/* 1. Identité */}
          <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              {photo ? (
                <Image
                  src={photo}
                  width={72}
                  height={72}
                  className="rounded-full object-cover"
                  style={{ borderRadius: "9999px", objectFit: "cover" }}
                />
              ) : (
                <AvatarWithPopover name={nom} email={fiche?.email} size={72} />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-extrabold text-purple-950">{nom}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {fiche?.par_defaut && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      Client de passage
                    </span>
                  )}
                  {fiche?.pays && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-950">
                      <Drapeau code={fiche.pays} /> {nomPays(fiche.pays)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-900">
                    <CalendarDays size={12} /> Client depuis le {dateLongue(fiche?.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Argent */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl px-4 py-3 text-white shadow-sm" style={{ backgroundColor: PURPLE_950 }}>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-purple-200">
                <Wallet size={13} /> Solde du compte
              </div>
              <div className="mt-0.5 text-lg font-extrabold">{fmt(fiche?.montant_en_caisse)}</div>
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 shadow-sm ${(fiche?.dette ?? 0) > 0 ? "border-amber-200 bg-amber-50" : "border-purple-100 bg-white"}`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <AlertCircle size={13} /> Dette
              </div>
              <div className={`mt-0.5 text-lg font-extrabold ${(fiche?.dette ?? 0) > 0 ? "text-amber-600" : "text-slate-400"}`}>
                {fmt(fiche?.dette)}
              </div>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <ShoppingBag size={13} /> Total acheté
              </div>
              <div className="mt-0.5 text-lg font-extrabold text-purple-950">{fmt(totalAchete)}</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <CreditCard size={13} /> Total payé
              </div>
              <div className="mt-0.5 text-lg font-extrabold text-emerald-700">{fmt(totalPaye)}</div>
            </div>
          </div>

          {/* 3. Coordonnées et 4. Activité */}
          <div className="grid gap-4 md:grid-cols-2">
            <Carte titre="Coordonnées" icone={<Phone size={16} />}>
              <div className="divide-y divide-purple-50">
                <Info icone={<Phone size={15} />} libelle="Téléphone">
                  <NumeroAvecDrapeau numero={fiche?.telephone} />
                </Info>
                <Info icone={<Mail size={15} />} libelle="Adresse e-mail">
                  {fiche?.email ? (
                    <a href={`mailto:${fiche.email}`} className="hover:underline" style={{ color: PURPLE_950 }}>
                      {fiche.email}
                    </a>
                  ) : (
                    <span className="text-slate-400">Non renseignée</span>
                  )}
                </Info>
                <Info icone={<Globe2 size={15} />} libelle="Pays">
                  {fiche?.pays ? (
                    <span className="inline-flex items-center gap-2">
                      <Drapeau code={fiche.pays} /> {nomPays(fiche.pays)}
                    </span>
                  ) : (
                    <span className="text-slate-400">Non renseigné</span>
                  )}
                </Info>
                <Info icone={<MapPin size={15} />} libelle="Ville">
                  {vide(fiche?.ville) ? <span className="text-slate-400">Non renseignée</span> : fiche?.ville}
                </Info>
                <Info icone={<Navigation size={15} />} libelle="Quartier · adresse">
                  {quartierAdresse ? (
                    quartierAdresse
                  ) : (
                    <span className="text-slate-400">Non renseigné</span>
                  )}
                </Info>
              </div>
            </Carte>

            <Carte titre="Activité" icone={<ReceiptText size={16} />}>
              <div className="divide-y divide-purple-50">
                <Info icone={<ShoppingBag size={15} />} libelle="Nombre d'achats">
                  {deliveries.length}
                </Info>
                <Info icone={<ReceiptText size={15} />} libelle="Panier moyen">
                  {deliveries.length ? fmt(panierMoyen) : <span className="text-slate-400">—</span>}
                </Info>
                <Info icone={<Clock size={15} />} libelle="Premier et dernier achat">
                  {dates.length ? (
                    `${dateLongue(dates[0])} → ${dateLongue(dates[dates.length - 1])}`
                  ) : (
                    <span className="text-slate-400">Aucun achat</span>
                  )}
                </Info>
                <Info icone={<UserCheck size={15} />} libelle="Enregistré par">
                  {fiche?.created_by_nom || <span className="text-slate-400">Création automatique</span>}
                </Info>
                <Info icone={<Hash size={15} />} libelle="Identifiant">
                  <span className="font-mono text-xs text-slate-500">{fiche?._id || clientId}</span>
                </Info>
              </div>
            </Carte>
          </div>

          {/* 5. Historique des ventes */}
          <section className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-purple-950">
                <ShoppingBag size={16} /> {t("admin.customers.details.history")}
              </h3>
              <Tag color="purple" className="m-0">
                {deliveries.length} {t("admin.customers.details.total")}
              </Tag>
            </div>
            {deliveries.length > 0 ? (
              <Table
                dataSource={deliveries}
                columns={columns}
                pagination={{ pageSize: 5, hideOnSinglePage: true }}
                rowKey="id"
                size="middle"
                scroll={{ x: 560 }}
              />
            ) : (
              <Empty description={t("admin.customers.details.noDeliveries")} />
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
};

export default ClientDetailDrawer;
