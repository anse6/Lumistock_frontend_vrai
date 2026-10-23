import React, { useState, useEffect, useMemo, useCallback } from "react";
import { App, ConfigProvider, Spin, Tabs } from "antd";
import type { TabsProps } from "antd";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Users, Wallet } from "lucide-react";
import PageTitle from "../../../PageTitle";
import Header from "./Header";
import ClientTable from "./ClientTable";
import Pagination from "./Pagination";
import EditClientModal from "./EditClientModal";
import DeleteClientModal from "./DeleteClientModal";
import AddToCashModal from "./AddToCashModal";
import ReglementClientModal from "../../../Client/ReglementClientModal";
import DetteOuvertureModal from "../../../Client/DetteOuvertureModal";
import MessageClientModal from "../../../../Modules/Messagerie/MessageClientModal";
import WithdrawFromCashModal from "./WithdrawFromCashModal";
import ClientDetailDrawer from "./ClientDetailDrawer";
import CorbeilleClientDrawer from "./CorbeilleClientDrawer";
import ClientDebtAdmin from "../../clients/ClientDebtAdmin";
import { getUrlServer } from "../../../../configServer";

const PURPLE_950 = "#3b0764";

export interface Client {
  _id?: string;
  client_id?: string;
  nombre_livraisons?: number;
  montant_total?: number;
  montant_en_caisse?: number;
  /** Reste à payer cumulé de ses ventes. */
  dette?: number;
  /** Client de passage « Autres » : ni renommable ni supprimable. */
  par_defaut?: boolean;
  nom: string;
  email: string | null;
  telephone: string | null;
  quartier: string | null;
  ville: string | null;
  /** Code ISO du pays du client (CM, CI…). */
  pays?: string | null;
  photo_profil: string | null;
  created_by_name: string;
  /** Date ISO renvoyée par le serveur. */
  created_at?: string | null;
}

interface FilterState {
  ville: string;
  quartier: string;
  montant_min: number | null;
  montant_max: number | null;
  livraisons_min: number | null;
  livraisons_max: number | null;
  date_debut: string;
  date_fin: string;
}

const FILTRES_VIDES: FilterState = {
  ville: "",
  quartier: "",
  montant_min: null,
  montant_max: null,
  livraisons_min: null,
  livraisons_max: null,
  date_debut: "",
  date_fin: "",
};

/** Texte comparable : les champs vides (null) ne font plus planter la recherche. */
const txt = (v: unknown) => String(v ?? "").toLowerCase();

const dateCreation = (c: Client) => (c.created_at ? new Date(c.created_at) : null);

const ClientAdmin: React.FC = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ongletActif, setOngletActif] = useState("tous");
  const [pages, setPages] = useState<Record<string, number>>({ tous: 1, solde: 1 });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>(FILTRES_VIDES);

  // États pour les modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addToCashModalOpen, setAddToCashModalOpen] = useState(false);
  const [reglementOpen, setReglementOpen] = useState(false);
  const [detteOuvertureOpen, setDetteOuvertureOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [withdrawFromCashModalOpen, setWithdrawFromCashModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [corbeilleDrawerOpen, setCorbeilleDrawerOpen] = useState(false);

  const itemsPerPage = 10;
  const setPage = (onglet: string, page: number) => setPages((p) => ({ ...p, [onglet]: page }));

  const fetchClients = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error(t("admin.customers.add.validation.authRequired"));
        // Tous les clients du magasin, avec ventes, dette et solde du compte.
        const response = await fetch(`${getUrlServer()}/clients/manager/`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.error || data?.message || `Erreur HTTP : ${response.status}`);
        }
        setClients(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.customers.add.validation.error"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error(t("admin.customers.add.validation.authRequired"));
      const response = await fetch(`${getUrlServer()}/clients/manager/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition?.match(/filename="?([^";]+)"?/)?.[1] || "clients_export.xlsx";
      const url = window.URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success(t("admin.customers.add.messages.successExport"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t("admin.customers.add.validation.error"));
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPages({ tous: 1, solde: 1 });
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPages({ tous: 1, solde: 1 });
  };

  const clearFilters = () => {
    setFilters(FILTRES_VIDES);
    setPages({ tous: 1, solde: 1 });
  };

  const ouvrir = (setter: (v: boolean) => void) => (client: Client) => {
    setSelectedClient(client);
    setter(true);
  };

  // Recherche, filtres et tri (sur tous les clients du magasin)
  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let result = clients.filter((c) => {
      if (
        q &&
        ![c.nom, c.telephone, c.quartier, c.ville, c.email, c.client_id || c._id].some((v) => txt(v).includes(q))
      ) {
        return false;
      }
      if (filters.ville && !txt(c.ville).includes(filters.ville.toLowerCase())) return false;
      if (filters.quartier && !txt(c.quartier).includes(filters.quartier.toLowerCase())) return false;
      const montant = c.montant_total ?? 0;
      if (filters.montant_min !== null && montant < filters.montant_min) return false;
      if (filters.montant_max !== null && montant > filters.montant_max) return false;
      const nb = c.nombre_livraisons ?? 0;
      if (filters.livraisons_min !== null && nb < filters.livraisons_min) return false;
      if (filters.livraisons_max !== null && nb > filters.livraisons_max) return false;
      const date = dateCreation(c);
      if (filters.date_debut && (!date || date < new Date(`${filters.date_debut}T00:00:00`))) return false;
      if (filters.date_fin && (!date || date > new Date(`${filters.date_fin}T23:59:59`))) return false;
      return true;
    });

    if (sortColumn) {
      const valeur = (c: Client): string | number => {
        if (sortColumn === "created_at") return dateCreation(c)?.getTime() ?? 0;
        const v = c[sortColumn as keyof Client];
        return typeof v === "number" ? v : txt(v);
      };
      result = [...result].sort((a, b) => {
        const va = valeur(a);
        const vb = valeur(b);
        if (va < vb) return sortDirection === "asc" ? -1 : 1;
        if (va > vb) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [clients, searchTerm, filters, sortColumn, sortDirection]);

  const clientsAvecSolde = useMemo(
    () => filteredClients.filter((c) => (c.montant_en_caisse ?? 0) > 0),
    [filteredClients],
  );

  if (loading && clients.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center rounded-[10px] bg-white p-6">
        <Spin />
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 rounded-[10px] bg-white p-6">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => fetchClients()}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: PURPLE_950 }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const page = (onglet: string, liste: Client[]) => {
    const debut = ((pages[onglet] ?? 1) - 1) * itemsPerPage;
    return liste.slice(debut, debut + itemsPerPage);
  };

  const tableProps = {
    sortColumn,
    loading,
    sortDirection,
    handleSort,
    onEdit: ouvrir(setEditModalOpen),
    onDelete: ouvrir(setDeleteModalOpen),
    onAddToCash: ouvrir(setAddToCashModalOpen),
    onRegler: ouvrir(setReglementOpen),
    onDetteOuverture: ouvrir(setDetteOuvertureOpen),
    onWithdrawFromCash: ouvrir(setWithdrawFromCashModalOpen),
    onViewDetails: ouvrir(setDetailDrawerOpen),
    onSendMessage: ouvrir(setMessageModalOpen),
  };

  const badge = (n: number, actif: boolean) => (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${actif ? "bg-white/20 text-white" : "bg-purple-100 text-purple-950"}`}
    >
      {n}
    </span>
  );

  const tabItems: TabsProps["items"] = [
    {
      key: "tous",
      label: (
        <span className="flex items-center gap-2">
          <Users size={16} /> Tous les clients {badge(filteredClients.length, ongletActif === "tous")}
        </span>
      ),
      children: (
        <div className="relative flex h-full w-full flex-col rounded-lg">
          <Header
            onExport={handleExport}
            searchTerm={searchTerm}
            onSearch={handleSearch}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            onOpenCorbeille={() => setCorbeilleDrawerOpen(true)}
          />
          <div className="flex-1 overflow-hidden">
            <ClientTable clients={page("tous", filteredClients)} {...tableProps} hiddenColumns={["address"]} />
          </div>
          <Pagination
            totalItems={filteredClients.length}
            itemsPerPage={itemsPerPage}
            currentPage={pages.tous}
            onPageChange={(p) => setPage("tous", p)}
          />
        </div>
      ),
    },
    {
      key: "solde",
      label: (
        <span className="flex items-center gap-2">
          <Wallet size={16} /> Avec solde sur le compte {badge(clientsAvecSolde.length, ongletActif === "solde")}
        </span>
      ),
      children: (
        <div className="relative flex h-full w-full flex-col rounded-lg">
          <p className="mb-4 px-2 text-sm text-slate-500">
            Clients qui ont de l'argent sur leur compte (avance, remboursement crédité…), utilisable sur leurs
            prochains achats.
          </p>
          <div className="flex-1 overflow-hidden">
            <ClientTable
              clients={page("solde", clientsAvecSolde)}
              {...tableProps}
              hiddenColumns={["address", "montant_total", "nombre_livraisons", "dette"]}
            />
          </div>
          <Pagination
            totalItems={clientsAvecSolde.length}
            itemsPerPage={itemsPerPage}
            currentPage={pages.solde}
            onPageChange={(p) => setPage("solde", p)}
          />
        </div>
      ),
    },
    {
      key: "dettes",
      label: t("admin.customers.tabs.debts"),
      children: <ClientDebtAdmin isTabMode={true} />,
    },
  ];

  return (
    // Violet de l'application pour toute la page, fenêtres comprises (le thème
    // global impose aussi Button.colorPrimary : on le surcharge ici).
    <ConfigProvider
      theme={{
        token: { colorPrimary: PURPLE_950, colorPrimaryHover: "#581c87" },
        components: { Button: { colorPrimary: PURPLE_950, colorPrimaryHover: "#581c87" } },
      }}
    >
      <PageTitle>{t("admin.customers.title")}</PageTitle>
      <div className="h-screen w-full overflow-y-auto bg-white p-2 sm:p-6">
        <Tabs
          activeKey={ongletActif}
          onChange={setOngletActif}
          size="large"
          type="card"
          items={tabItems}
          className="clients-tabs"
        />

        <style>{`
          .clients-tabs .ant-tabs-nav::before {
            border-bottom: 2px solid #e9d5ff !important;
          }
          .clients-tabs .ant-tabs-tab {
            background-color: #faf5ff !important;
            border: 1px solid #e9d5ff !important;
            border-bottom: none !important;
            border-radius: 10px 10px 0 0 !important;
            transition: all 0.3s ease;
            padding: 12px 22px !important;
            margin-right: 6px !important;
          }
          .clients-tabs .ant-tabs-tab-btn {
            font-weight: 600 !important;
            font-size: 15px !important;
            color: #6b21a8 !important;
          }
          .clients-tabs .ant-tabs-tab:hover {
            background-color: #f3e8ff !important;
          }
          .clients-tabs .ant-tabs-tab-active {
            background-color: ${PURPLE_950} !important;
            border-color: ${PURPLE_950} !important;
            box-shadow: 0 -4px 10px -2px rgba(59, 7, 100, 0.35);
          }
          .clients-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: white !important;
          }
        `}</style>
      </div>

      <EditClientModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onClientUpdated={() => fetchClients(true)}
      />

      <DeleteClientModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onClientDeleted={() => fetchClients(true)}
      />

      <ReglementClientModal
        open={reglementOpen}
        clientId={reglementOpen ? selectedClient?._id || selectedClient?.client_id || null : null}
        clientNom={selectedClient?.nom}
        onClose={() => {
          setReglementOpen(false);
          setSelectedClient(null);
        }}
        onDone={() => fetchClients(true)}
      />

      <DetteOuvertureModal
        open={detteOuvertureOpen}
        clientId={detteOuvertureOpen ? selectedClient?._id || selectedClient?.client_id || null : null}
        clientNom={selectedClient?.nom}
        onClose={() => {
          setDetteOuvertureOpen(false);
          setSelectedClient(null);
        }}
        onDone={() => fetchClients(true)}
      />

      <AddToCashModal
        isOpen={addToCashModalOpen}
        onClose={() => {
          setAddToCashModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onSuccess={() => fetchClients(true)}
      />

      <WithdrawFromCashModal
        isOpen={withdrawFromCashModalOpen}
        onClose={() => {
          setWithdrawFromCashModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onSuccess={() => fetchClients(true)}
      />

      <MessageClientModal
        open={messageModalOpen}
        clientId={messageModalOpen ? selectedClient?._id || selectedClient?.client_id || null : null}
        onClose={() => {
          setMessageModalOpen(false);
          setSelectedClient(null);
        }}
      />

      <ClientDetailDrawer
        isOpen={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedClient(null);
        }}
        clientId={selectedClient?._id || selectedClient?.client_id || null}
        clientName={selectedClient?.nom || null}
      />

      {corbeilleDrawerOpen && (
        <CorbeilleClientDrawer
          onClose={() => setCorbeilleDrawerOpen(false)}
          onRestoreSuccess={() => fetchClients(true)}
        />
      )}
    </ConfigProvider>
  );
};

export default ClientAdmin;
