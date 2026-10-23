import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Search, Trash2, X } from "lucide-react";
import { App, Button, ConfigProvider, Drawer, Empty, Modal, Spin, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getUrlServer } from "../../../../configServer";
import { invoiceReference } from "./deliveryInvoicePdf";
import type { Order } from "./types";

const PURPLE_950 = "#3b0764"; // Tailwind purple-950
const PURPLE_900 = "#581c87"; // Tailwind purple-900

interface CorbeilleModalProps {
  onClose: () => void;
  onRestoreSuccess: () => void;
}

type VenteAnnulee = Order & { _id?: string | { $oid: string } };

const idVente = (v: VenteAnnulee): string =>
  v.id || (typeof v._id === "object" ? v._id.$oid : v._id) || "";

const fmt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("fr-FR")} CFA`;

/** Dates UTC du serveur enregistrées sans fuseau. */
const dateLocale = (iso?: string | null) =>
  iso ? dayjs(/Z$|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`) : null;

const messageServeur = (error: unknown, defaut: string): string => {
  const data = axios.isAxiosError(error) ? error.response?.data : undefined;
  const detail = data?.error ?? data?.message;
  return typeof detail === "string" ? detail : defaut;
};

// Ventes annulées : restauration (reprend le stock) ou suppression définitive.
const CorbeilleModal: React.FC<CorbeilleModalProps> = ({ onClose, onRestoreSuccess }) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [ventes, setVentes] = useState<VenteAnnulee[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<VenteAnnulee | null>(null);
  const [aRestaurer, setARestaurer] = useState<VenteAnnulee | null>(null);
  const [largeur, setLargeur] = useState(() => Math.min(1000, window.innerWidth));

  useEffect(() => {
    const surRedimension = () => setLargeur(Math.min(1000, window.innerWidth));
    window.addEventListener("resize", surRedimension);
    return () => window.removeEventListener("resize", surRedimension);
  }, []);

  const entetes = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token") || localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${getUrlServer()}/livraisons/corbeille`, { headers: entetes() });
        setVentes(res.data || []);
      } catch (error) {
        console.error("Erreur lors du chargement de la corbeille:", error);
        message.error("Impossible de charger les ventes annulées.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return ventes;
    return ventes.filter((v) =>
      [idVente(v), invoiceReference(idVente(v)), v.client?.nom, v.nom_livreur, v.annulation?.motif, v.annulation?.par_nom]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q)),
    );
  }, [ventes, recherche]);

  const retirer = (id: string) => setVentes((prev) => prev.filter((v) => idVente(v) !== id));

  const restaurer = async (vente: VenteAnnulee) => {
    const id = idVente(vente);
    setARestaurer(null);
    setRestoringId(id);
    try {
      const res = await axios.post(`${getUrlServer()}/livraisons/corbeille/${id}/restaurer`, {}, { headers: entetes() });
      message.success(res.data?.message || t("admin.deliveries.modals.corbeille.successRestore"));
      retirer(id);
      onRestoreSuccess();
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      message.error(messageServeur(error, t("admin.deliveries.modals.corbeille.failRestore")));
    } finally {
      setRestoringId(null);
    }
  };

  const supprimerDefinitivement = async () => {
    if (!aSupprimer) return;
    const id = idVente(aSupprimer);
    setASupprimer(null);
    setDeletingId(id);
    try {
      await axios.delete(`${getUrlServer()}/livraisons/corbeille/${id}/definitive`, { headers: entetes() });
      message.success(t("admin.deliveries.modals.corbeille.successDeleteDefinitive"));
      retirer(id);
    } catch (error) {
      console.error("Erreur lors de la suppression définitive:", error);
      message.error(messageServeur(error, t("admin.deliveries.modals.corbeille.failDeleteDefinitive")));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<VenteAnnulee> = [
    {
      title: "Vente",
      key: "vente",
      width: 150,
      render: (_, v) => (
        <div className="flex flex-col">
          <span className="font-semibold text-purple-950">{invoiceReference(idVente(v))}</span>
          <span className="text-xs text-gray-500">
            {v.date_commande ? dayjs(v.date_commande).format("DD/MM/YYYY HH:mm") : "—"}
          </span>
        </div>
      ),
    },
    {
      title: "Client",
      key: "client",
      render: (_, v) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{v.client?.nom || "Client de passage"}</span>
          <span className="text-xs text-gray-500">{v.nom_livreur ? `par ${v.nom_livreur.trim()}` : "Vendeur non renseigné"}</span>
        </div>
      ),
    },
    {
      title: "Montant",
      key: "montant",
      align: "right",
      render: (_, v) => (
        <div className="flex flex-col items-end">
          <span className="font-semibold text-purple-950">{fmt(v.montant_total)}</span>
          <span className="text-xs text-gray-500">payé {fmt(v.montant_paye)}</span>
        </div>
      ),
    },
    {
      title: "Annulation",
      key: "annulation",
      render: (_, v) => {
        const quand = dateLocale(v.annulation?.date || v.deleted_at);
        const a = v.annulation;
        return (
          <div className="flex max-w-[230px] flex-col text-xs">
            <span className="font-medium text-gray-700">
              {quand ? quand.format("DD/MM/YYYY HH:mm") : "—"}
              {a?.par_nom ? ` · ${a.par_nom}` : ""}
            </span>
            {a?.motif && <span className="truncate italic text-gray-500" title={a.motif}>« {a.motif} »</span>}
            {a && a.montant_rendu > 0 && (
              <span className="font-semibold text-emerald-700">
                {fmt(a.montant_rendu)} rendus · {a.mode_libelle || a.mode}
                {a.reference ? ` · Réf. ${a.reference}` : ""}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 120,
      render: (_, v) => {
        const id = idVente(v);
        const occupe = restoringId === id || deletingId === id;
        return (
          <div className="flex justify-end gap-2">
            <Tooltip title="Restaurer la vente (les articles sont repris du stock)">
              <Button
                type="primary"
                size="small"
                icon={<RefreshCw className={`h-4 w-4 ${restoringId === id ? "animate-spin" : ""}`} />}
                onClick={() => setARestaurer(v)}
                disabled={occupe}
              />
            </Tooltip>
            <Tooltip title="Supprimer définitivement">
              <Button
                danger
                type="primary"
                size="small"
                icon={deletingId === id ? <Spin size="small" /> : <Trash2 className="h-4 w-4" />}
                onClick={() => setASupprimer(v)}
                disabled={occupe}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const totalAnnule = filtrees.reduce((s, v) => s + (Number(v.montant_total) || 0), 0);

  return (
    // Couleur de l'application (purple-950) ; la suppression définitive reste rouge.
    <ConfigProvider
      theme={{
        token: { colorPrimary: PURPLE_950, colorPrimaryHover: PURPLE_900 },
        components: { Button: { colorPrimary: PURPLE_950, colorPrimaryHover: PURPLE_900 } },
      }}
    >
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Trash2 className="h-6 w-6 text-purple-950" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-950">Ventes annulées</h2>
              <p className="text-sm font-normal text-gray-500">
                Restaurez une vente annulée par erreur, ou supprimez-la définitivement.
              </p>
            </div>
          </div>
        }
        placement="right"
        width={largeur}
        onClose={onClose}
        open
        closeIcon={<X className="h-5 w-5" />}
        footer={
          <div className="flex justify-end">
            <Button onClick={onClose} size="large" className="rounded-lg">
              {t("admin.deliveries.modals.corbeille.close")}
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spin size="large" />
          </div>
        ) : ventes.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span className="text-lg text-gray-500">Aucune vente annulée.</span>}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher : client, vendeur, motif, n° de vente…"
                  className="h-10 w-full rounded-xl border border-purple-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-purple-950 focus:ring-2 focus:ring-purple-950/20"
                />
              </div>
              <div className="flex gap-2 text-sm">
                <span className="rounded-lg bg-purple-50 px-3 py-1.5 font-semibold text-purple-950">
                  {filtrees.length} vente{filtrees.length > 1 ? "s" : ""}
                </span>
                <span className="rounded-lg bg-purple-50 px-3 py-1.5 font-semibold text-purple-950">{fmt(totalAnnule)}</span>
              </div>
            </div>
            <Table
              dataSource={filtrees}
              columns={columns}
              rowKey={idVente}
              size="middle"
              scroll={{ x: 760 }}
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              locale={{ emptyText: "Aucune vente ne correspond à la recherche." }}
              className="overflow-hidden rounded-lg border border-gray-100 font-sans shadow-sm"
            />
          </div>
        )}

        {/* Confirmation de restauration */}
        <Modal
          open={!!aRestaurer}
          onCancel={() => setARestaurer(null)}
          centered
          footer={null}
          width={460}
          title={<span className="font-bold text-purple-950">Restaurer la vente ?</span>}
        >
          {aRestaurer && (
            <div className="space-y-3 pt-1 text-sm text-gray-600">
              <p>
                La vente <b className="text-purple-950">{invoiceReference(idVente(aRestaurer))}</b> de{" "}
                <b>{aRestaurer.client?.nom || "Client de passage"}</b> ({fmt(aRestaurer.montant_total)}) redevient active.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Ses articles sont repris du stock.</li>
                {aRestaurer.annulation?.mode === "credit_client" && aRestaurer.annulation.montant_rendu > 0 && (
                  <li>{fmt(aRestaurer.annulation.montant_rendu)} sont repris du compte du client.</li>
                )}
                {aRestaurer.annulation && aRestaurer.annulation.montant_rendu > 0 && aRestaurer.annulation.mode !== "credit_client" && (
                  <li>
                    {fmt(aRestaurer.annulation.montant_rendu)} avaient été rendus au client ({aRestaurer.annulation.mode_libelle}) : pensez à les
                    récupérer.
                  </li>
                )}
              </ul>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setARestaurer(null)}
                  className="rounded-xl border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-950 hover:bg-purple-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => restaurer(aRestaurer)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                  style={{ backgroundColor: PURPLE_950 }}
                >
                  <RefreshCw className="h-4 w-4" /> Restaurer
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Confirmation de suppression définitive */}
        <Modal
          open={!!aSupprimer}
          onCancel={() => setASupprimer(null)}
          centered
          footer={null}
          width={460}
          title={
            <span className="flex items-center gap-2 font-bold text-red-700">
              <AlertTriangle className="h-5 w-5" /> Supprimer définitivement ?
            </span>
          }
        >
          {aSupprimer && (
            <div className="space-y-3 pt-1 text-sm text-gray-600">
              <p>
                La vente <b className="text-purple-950">{invoiceReference(idVente(aSupprimer))}</b> de{" "}
                <b>{aSupprimer.client?.nom || "Client de passage"}</b> ({fmt(aSupprimer.montant_total)}) sera effacée.
              </p>
              <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">
                Cette action est irréversible : la vente ne pourra plus être restaurée. Les articles sont déjà revenus en
                stock à l'annulation ; pour une vente de gérant, ils passent de son stock au stock du magasin.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setASupprimer(null)}
                  className="rounded-xl border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-950 hover:bg-purple-50"
                >
                  Garder
                </button>
                <button
                  type="button"
                  onClick={supprimerDefinitivement}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" /> Supprimer définitivement
                </button>
              </div>
            </div>
          )}
        </Modal>
      </Drawer>
    </ConfigProvider>
  );
};

export default CorbeilleModal;
