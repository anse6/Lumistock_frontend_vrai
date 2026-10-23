import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { Tabs } from "antd";
import type { TabsProps } from "antd";
import Header from "./Header";
import ClientTable from "./ClientTable";
import ReglementClientModal from "../../../Components/Client/ReglementClientModal";
import DetteOuvertureModal from "../../../Components/Client/DetteOuvertureModal";
import Pagination from "./Pagination";
import EditClientModal from "./EditClientModal";
import DeleteClientModal from "./DeleteClientModal";
import { getUrlServer } from "./../../../../configServer";
import PageTitle from "../../../Components/PageTitle";
import ClientDebtLivreur from "../../../Components/Livraison/ClientDebtLivreur";
import ClientDetailDrawer from "../../../Components/admin/livaision/Customer/ClientDetailDrawer";

interface Client {
  client_id: string;
  nombre_livraisons: number;
  montant_total: number;
  nom: string;
  telephone: string;
  quartier: string;
  ville: string;
  photo_profil: string;
  created_at: {
    $date: string;
  };
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

const ClientLivreur: React.FC = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    ville: "",
    quartier: "",
    montant_min: null,
    montant_max: null,
    livraisons_min: null,
    livraisons_max: null,
    date_debut: "",
    date_fin: "",
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // États pour les modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reglementOpen, setReglementOpen] = useState(false);
  const [detteOuvertureOpen, setDetteOuvertureOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  const itemsPerPage = 10;

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error(t("admin.customers.add.validation.authRequired"));
      }

      const response = await fetch(`${getUrlServer()}/clients/manager/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const contentDisposition = response.headers.get("content-disposition");
      let filename = "clients_export.xlsx";

      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="?(.+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccessMessage(t("admin.customers.add.messages.successExport"));
    } catch (err) {
      console.error("Erreur lors de l'export:", err);
      showErrorMessage(
        err instanceof Error
          ? err.message
          : t("admin.customers.add.messages.errorExport"),
      );
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
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      ville: "",
      quartier: "",
      montant_min: null,
      montant_max: null,
      livraisons_min: null,
      livraisons_max: null,
      date_debut: "",
      date_fin: "",
    });
    setCurrentPage(1);
  };

  // Gestionnaires pour les modals
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setDeleteModalOpen(true);
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setDetailDrawerOpen(true);
  };

  const handleClientUpdated = () => {
    // Recharger la liste des clients après modification
    fetchClients();
  };

  const handleClientDeleted = () => {
    // Recharger la liste des clients après suppression
    fetchClients();
  };

  // Fonction de recherche et filtrage
  useEffect(() => {
    let result = [...clients];

    // Recherche
    if (searchTerm) {
      result = result.filter(
        (client) =>
          client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.telephone.includes(searchTerm) ||
          client.quartier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.client_id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtres
    if (filters.ville) {
      result = result.filter((client) =>
        client.ville.toLowerCase().includes(filters.ville.toLowerCase()),
      );
    }

    if (filters.quartier) {
      result = result.filter((client) =>
        client.quartier.toLowerCase().includes(filters.quartier.toLowerCase()),
      );
    }

    if (filters.montant_min !== null) {
      result = result.filter(
        (client) => client.montant_total >= filters.montant_min!,
      );
    }

    if (filters.montant_max !== null) {
      result = result.filter(
        (client) => client.montant_total <= filters.montant_max!,
      );
    }

    if (filters.livraisons_min !== null) {
      result = result.filter(
        (client) => client.nombre_livraisons >= filters.livraisons_min!,
      );
    }

    if (filters.livraisons_max !== null) {
      result = result.filter(
        (client) => client.nombre_livraisons <= filters.livraisons_max!,
      );
    }

    if (filters.date_debut) {
      result = result.filter((client) => {
        const clientDate = new Date(client.created_at.$date);
        const filterDate = new Date(filters.date_debut);
        return clientDate >= filterDate;
      });
    }

    if (filters.date_fin) {
      result = result.filter((client) => {
        const clientDate = new Date(client.created_at.$date);
        const filterDate = new Date(filters.date_fin);
        return clientDate <= filterDate;
      });
    }

    // Tri
    if (sortColumn) {
      result.sort((a, b) => {
        let aValue: string | number | Date | undefined = a[
          sortColumn as keyof Client
        ] as string | number | Date | undefined;
        let bValue: string | number | Date | undefined = b[
          sortColumn as keyof Client
        ] as string | number | Date | undefined;

        if (sortColumn === "created_at") {
          aValue = new Date(a.created_at.$date);
          bValue = new Date(b.created_at.$date);
        }

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = (typeof bValue === "string" ? bValue : "").toLowerCase();
        }

        // Provide default values if undefined
        if (aValue === undefined) aValue = "";
        if (bValue === undefined) bValue = "";

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredClients(result);
  }, [clients, searchTerm, filters, sortColumn, sortDirection]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token"); ///clients/livreur/
      if (!token) {
        throw new Error(t("admin.customers.add.validation.authRequired"));
      }

      const response = await fetch(`${getUrlServer()}/clients/livreur/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("admin.customers.add.validation.error"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen rounded-[10px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F172A]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen rounded-[10px] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: t("admin.customers.tabs.active"),
      children: (
        <div className="w-full h-full bg-red rounded-lg relative flex flex-col">
          <Header
            onExport={handleExport}
            searchTerm={searchTerm}
            onSearch={handleSearch}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />

          <div className="flex-1 overflow-hidden">
            <ClientTable
              clients={paginatedClients}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              handleSort={handleSort}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
              onViewDetails={handleViewDetails}
              onRegler={(c) => { setSelectedClient(c); setReglementOpen(true); }}
              onDetteOuverture={(c) => { setSelectedClient(c); setDetteOuvertureOpen(true); }}
            />
          </div>

          <Pagination
            totalItems={filteredClients.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      ),
    },
    {
      key: "2",
      label: t("admin.customers.tabs.debts"),
      children: <ClientDebtLivreur isTabMode={true} />,
    },
  ];

  return (
    <>
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}
      <PageTitle>{t("admin.customers.title")}</PageTitle>
      <div className="w-full h-screen p-2 sm:p-6 bg-white overflow-y-auto">
        <Tabs
          defaultActiveKey="1"
          size="large"
          type="card"
          items={tabItems}
          className="clients-tabs"
        />

        <style>{`
          /* Premium Tabs Styling */
          .clients-tabs .ant-tabs-nav::before {
            border-bottom: 2px solid #e2e8f0 !important;
          }
          .clients-tabs .ant-tabs-tab {
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-bottom: none !important;
            border-radius: 10px 10px 0 0 !important;
            transition: all 0.3s ease;
            padding: 12px 28px !important;
            margin-right: 6px !important;
          }
          .clients-tabs .ant-tabs-tab-btn {
            font-weight: 600 !important;
            font-size: 15px !important;
            color: #64748b !important;
          }
          .clients-tabs .ant-tabs-tab:hover {
            background-color: #f1f5f9 !important;
          }
          .clients-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
            color: #060c15ff !important;
          }
          .clients-tabs .ant-tabs-tab-active {
            background-color: #060c15ff !important;
            border-color: #060c15ff !important;
            box-shadow: 0 -4px 6px -1px rgba(59, 130, 246, 0.2);
          }
          .clients-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: white !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
        `}</style>
      </div>

      {/* Modals */}
      <EditClientModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
      />

      {/* Un gérant encaisse sur ses propres ventes ; il peut saisir une dette
          d'avant Lumistock, pas la modifier ensuite. */}
      <ReglementClientModal
        open={reglementOpen}
        clientId={reglementOpen ? selectedClient?.client_id || null : null}
        clientNom={selectedClient?.nom}
        onClose={() => {
          setReglementOpen(false);
          setSelectedClient(null);
        }}
        onDone={() => fetchClients()}
      />

      <DetteOuvertureModal
        open={detteOuvertureOpen}
        clientId={detteOuvertureOpen ? selectedClient?.client_id || null : null}
        clientNom={selectedClient?.nom}
        onClose={() => {
          setDetteOuvertureOpen(false);
          setSelectedClient(null);
        }}
        onDone={() => fetchClients()}
      />

      <DeleteClientModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onClientDeleted={handleClientDeleted}
      />

      <ClientDetailDrawer
        isOpen={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedClient(null);
        }}
        clientId={selectedClient?.client_id || null}
        clientName={selectedClient?.nom || null}
      />
    </>
  );
};

export default ClientLivreur;
