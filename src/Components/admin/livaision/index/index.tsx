import React, { useState, useEffect, useCallback, useMemo } from "react";
import SearchAndActionsBar, { DeliveryFilters } from "../livraisonfinal/SearchAndActionsBar";
import { generateDeliveriesReportPdf } from "../livraisonfinal/deliveriesReportPdf";
import OrdersTable from "../livraisonfinal/OrdersTable";
import Pagination from "../livraisonfinal/Pagination";
import CancelDeliveryModal from "../livraisonfinal/CancelDeliveryModal";
import DeliveryDetailsModal from "../livraisonfinal/DeliveryDetailsModal";
import CorbeilleModal from "../livraisonfinal/CorbeilleModal";
import { Order } from "../livraisonfinal/types";
import PageTitle from "../../../PageTitle";
import PerformanceVendeurs, { LIBELLES_ROLES } from "./PerformanceVendeurs";
import { estCaissier } from "../venteRole";
import TicketApresVente from "../../../../Modules/Caisse/TicketApresVente";
import { fetchLivraisons } from "../livraisonfinal/livraisonService";
import {
  Spin,
  Card,
  Statistic,
  Row,
  Col,
  Segmented,
  Typography,
  DatePicker,
  App,
} from "antd";
import { Package, BarChart3 } from "lucide-react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import advancedFormat from "dayjs/plugin/advancedFormat";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import images from "@/assets/no_data.png";
import weekday from "dayjs/plugin/weekday";

dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(weekday);

const { Text } = Typography;

const ITEMS_PER_PAGE = 10;

const OrderTable: React.FC = () => {
  const { t, i18n } = useTranslation();
  const caissier = estCaissier();
  const { message } = App.useApp();
  const [exportingPdf, setExportingPdf] = useState(false);

  // Set dayjs locale dynamically based on i18n language
  useEffect(() => {
    dayjs.locale(i18n.language);
  }, [i18n.language]);

  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCorbeilleModal, setShowCorbeilleModal] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  // Mêmes filtres que la liste, sauf le vendeur : base du tableau « Ventes par vendeur ».
  const [ordersTousVendeurs, setOrdersTousVendeurs] = useState<Order[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<
    "jour" | "semaine" | "mois" | "all"
  >("all");
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccessMessage = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  }, []);

  const reloadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLivraisons();
      const transformedOrders: Order[] = data.map((livraison: any) => {
        const nom = livraison?.client?.nom || "";
        const prenom = livraison?.client?.prenom || "";
        const initials =
          (nom[0]?.toUpperCase() || "") + (prenom[0]?.toUpperCase() || "");

        return {
          id: livraison.id,
          livraison_id: livraison.livraison_id ?? livraison.id ?? "",
          clientInitials: initials || "??",
          clientName: `${nom} ${prenom}`.trim(),
          quantity:
            livraison.produits?.reduce(
              (total: number, p: { quantite?: number }) =>
                total + (p.quantite || 0),
              0,
            ) || 0,
          paymentStatus: livraison.statut_paiement,
          amount: livraison.montant_total || 0,
          montant_total: livraison.montant_total || 0,
          montant_produits: livraison.montant_produits || 0,
          montant_restant: livraison.montant_restant ?? 0,
          montant_paye: livraison.montant_paye ?? 0,
          date: livraison.date_commande
            ? new Date(livraison.date_commande).toLocaleDateString(
                i18n.language === "fr" ? "fr-FR" : "en-US",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              )
            : "",
          status: livraison.etat || (livraison.annulee ? "annulee" : "validee"),
          etat: livraison.etat || (livraison.annulee ? "annulee" : "validee"),
          abandon_reste: livraison.abandon_reste ?? null,
          abandon_en_attente: !!livraison.abandon_en_attente,
          produits: livraison.produits || [],
          adresse: livraison.adresse_livraison || "",
          telephone: livraison.client?.telephone || "",
          notes: livraison.notes || "",
          dette_ancienne: livraison.dette_ancienne ?? 0,
          relicat: livraison.relicat ?? 0,
          ristourne: livraison.ristourne ?? 0,
          montant_brut: livraison.montant_brut ?? livraison.montant_produits ?? 0,
          reductions: livraison.reductions ?? [],
          total_reductions: livraison.total_reductions ?? 0,
          livreur_id: livraison.livreur_id ?? "",
          vendeur_role: livraison.vendeur_role === "livreur" ? "gerant" : livraison.vendeur_role ?? "",
          annulable_jusqua: livraison.annulable_jusqua ?? null,
          email: livraison.client?.email || "",
          nom_livreur: livraison.nom_livreur ?? "",
          retour: Number(livraison.retour) || 0,
          have_retour: !!livraison.have_retour,
          montant_rembourse: Number(livraison.montant_rembourse) || 0,
          montant_deduit_caisse: Number(livraison.montant_deduit_caisse) || 0,
          client: livraison.client ?? {},
          raw_date: livraison.date_commande
            ? new Date(livraison.date_commande)
            : null,
        };
      });
      setOrders(transformedOrders);
      setFilteredOrders(transformedOrders);
    } catch (err) {
      console.error("Erreur de chargement des livraisons:", err);
      setError(t("admin.deliveries.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [i18n.language, t]);

  const handleOrderUpdate = useCallback(async () => {
    await reloadOrders();
    setActiveMenu(null);
  }, [reloadOrders]);

  const [filters, setFilters] = useState<DeliveryFilters>({
    status: "",
    paymentStatus: "",
    minAmount: "",
    maxAmount: "",
    livreur: "",
    roleVendeur: "",
    retours: "",
    dateRange: null,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, orders, statsPeriod, selectedDate]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedOrders(filteredOrders.slice(startIndex, endIndex));
  }, [currentPage, filteredOrders]);

  const applyFilters = () => {
    let result = [...orders];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(lowerTerm) ||
          order.clientName.toLowerCase().includes(lowerTerm) ||
          (order.telephone?.includes(searchTerm) ?? false),
      );
    }

    if (filters.status) {
      result = result.filter(
        (order) => order.status.toLowerCase() === filters.status.toLowerCase(),
      );
    }
    if (filters.paymentStatus) {
      // « payé » / « partiellement payé » / « non payé » : on compare le début,
      // sinon « partiel » ne trouvait jamais « partiellement payé ».
      const prefixe = { "payé": "pay", partiel: "partiel", "non payé": "non" }[filters.paymentStatus] ?? filters.paymentStatus;
      result = result.filter((order) =>
        (order.paymentStatus || "").toLowerCase().startsWith(prefixe),
      );
    }
    if (filters.roleVendeur) {
      result = result.filter((order) => order.vendeur_role === filters.roleVendeur);
    }
    if (filters.retours) {
      result = result.filter((order) =>
        filters.retours === "a_rembourser"
          ? (Number(order.retour) || 0) > 0
          : filters.retours === "rembourse"
            ? (Number(order.montant_rembourse) || 0) > 0
            : !!order.have_retour,
      );
    }
    if (filters.minAmount) {
      result = result.filter(
        (order) => order.amount >= Number(filters.minAmount),
      );
    }
    if (filters.maxAmount) {
      result = result.filter(
        (order) => order.amount <= Number(filters.maxAmount),
      );
    }

    // Unified Date Filtering
    if (statsPeriod !== "all" && selectedDate) {
      const start = selectedDate.startOf(
        statsPeriod === "jour"
          ? "day"
          : statsPeriod === "semaine"
            ? "week"
            : "month",
      );
      const end = selectedDate.endOf(
        statsPeriod === "jour"
          ? "day"
          : statsPeriod === "semaine"
            ? "week"
            : "month",
      );

      result = result.filter((order) => {
        if (!order.raw_date) return false;
        const orderDate = dayjs(order.raw_date);
        return (
          orderDate.isSame(start, "day") ||
          (orderDate.isAfter(start) && orderDate.isBefore(end))
        );
      });
    } else if (
      statsPeriod === "all" &&
      filters.dateRange?.[0] &&
      filters.dateRange?.[1]
    ) {
      const start = filters.dateRange[0].startOf("day");
      const end = filters.dateRange[1].endOf("day");
      result = result.filter((order) => {
        if (!order.raw_date) return false;
        const orderDate = dayjs(order.raw_date);
        return (
          orderDate.isAfter(start.subtract(1, "second")) &&
          orderDate.isBefore(end.add(1, "second"))
        );
      });
    }

    setOrdersTousVendeurs(result);
    if (filters.livreur) {
      result = result.filter((order) => order.livreur_id === filters.livreur);
    }
    setFilteredOrders(result);
    setCurrentPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filterName: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      paymentStatus: "",
      minAmount: "",
      maxAmount: "",
      livreur: "",
      roleVendeur: "",
      retours: "",
      dateRange: null,
    });
    setSearchTerm("");
    setStatsPeriod("all");
  };

  // Vendeurs présents dans la liste, pour le filtre « Vendeur » (par identifiant : deux homonymes restent distincts).
  const vendeurs = useMemo(() => {
    const parId = new Map<string, string>();
    orders.forEach((o) => {
      if (o.livreur_id && !parId.has(o.livreur_id)) {
        const role = LIBELLES_ROLES[o.vendeur_role || ""];
        parId.set(o.livreur_id, `${(o.nom_livreur || "").trim() || "Vendeur supprimé"}${role ? ` (${role})` : ""}`);
      }
    });
    return [...parId.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [orders]);

  // Export PDF : exactement les ventes affichées (recherche, période et filtres compris).
  const handleExportPdf = async () => {
    if (filteredOrders.length === 0) {
      message.warning("Aucune vente à exporter avec les filtres actuels.");
      return;
    }
    const periodes: Record<string, string> = { jour: "D MMMM YYYY", semaine: "[semaine du] D MMMM YYYY", mois: "MMMM YYYY" };
    const libellesPaiement: Record<string, string> = { "payé": "payées", partiel: "partiellement payées", "non payé": "non payées" };
    const libellesRetours: Record<string, string> = { avec_retour: "avec retour", a_rembourser: "client à rembourser", rembourse: "déjà remboursées" };
    const filtres = [
      searchTerm.trim() ? `recherche « ${searchTerm.trim()} »` : "",
      statsPeriod !== "all" && selectedDate
        ? (statsPeriod === "semaine" ? selectedDate.startOf("week") : selectedDate).format(periodes[statsPeriod])
        : "",
      filters.dateRange?.[0] && filters.dateRange?.[1]
        ? `du ${filters.dateRange[0].format("DD/MM/YYYY")} au ${filters.dateRange[1].format("DD/MM/YYYY")}`
        : "",
      filters.paymentStatus ? libellesPaiement[filters.paymentStatus] : "",
      filters.status ? `statut ${filters.status}` : "",
      filters.livreur ? `vendeur ${vendeurs.find((v) => v.value === filters.livreur)?.label ?? ""}` : "",
      filters.roleVendeur ? `rôle ${LIBELLES_ROLES[filters.roleVendeur] ?? filters.roleVendeur}` : "",
      filters.retours ? libellesRetours[filters.retours] : "",
      filters.minAmount ? `montant ≥ ${filters.minAmount}` : "",
      filters.maxAmount ? `montant ≤ ${filters.maxAmount}` : "",
    ].filter(Boolean).join(", ");
    setExportingPdf(true);
    try {
      await generateDeliveriesReportPdf(filteredOrders, { filtres: filtres || undefined });
      message.success(`PDF généré : ${filteredOrders.length} vente${filteredOrders.length > 1 ? "s" : ""}.`);
    } catch (error) {
      console.error("Export PDF des ventes :", error);
      message.error("Impossible de générer le PDF des ventes.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStats = useCallback(() => {
    const totalProducts = filteredOrders.reduce(
      (sum, order) => sum + order.quantity,
      0,
    );
    const totalItemsValue = filteredOrders.reduce(
      (sum, order) => sum + (order.montant_produits || 0),
      0,
    );

    return { totalProducts, totalItemsValue };
  }, [filteredOrders]);

  const stats = getStats();

  const handleMenuToggle = (index: number) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  const handleDelete = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const handleShowDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const removeOrderFromState = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId),
    );
    setFilteredOrders((prevFiltered) =>
      prevFiltered.filter((order) => order.id !== orderId),
    );
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    setSelectedOrderId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedOrderId(null);
  };

  // Écran de chargement au premier affichage seulement : un rechargement
  // (après remboursement, restauration…) ne doit pas démonter les fenêtres ouvertes.
  if (loading && orders.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Messages de succès/erreur */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
            {successMessage}
          </div>
        </div>
      )}

      <PageTitle>{caissier ? "Mes ventes" : t("sidebar.delivery")}</PageTitle>
      {caissier && <TicketApresVente />}
      <div
        className="w-full h-screen p-6 bg-white overflow-y-auto hide-scroll"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
        {/* Stats Section */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            {/* 🔵 GAUCHE : TITRE + INFOS */}
            <div className="flex flex-col gap-2">
              <Text strong className="text-xl text-slate-800 tracking-tight">
                {t("admin.deliveries.stats.title")}
              </Text>

              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <Text className="text-[12px] font-bold text-blue-600 uppercase tracking-widest">
                  {t("admin.deliveries.stats.showAllHistory")}
                </Text>
              </div>
            </div>

            {/* 🟢 DROITE : FILTRES */}
            <div className="flex flex-col items-end gap-3">
              <Segmented
                options={[
                  { label: t("delivery.periods.day"), value: "jour" },
                  { label: t("delivery.periods.week"), value: "semaine" },
                  { label: t("delivery.periods.month"), value: "mois" },
                  { label: t("delivery.periods.all"), value: "all" },
                ]}
                value={statsPeriod}
                onChange={(value) => setStatsPeriod(value as any)}
                className="bg-slate-100 p-1 rounded-xl"
              />

              {statsPeriod !== "all" && (
                <div className="flex items-center gap-3">
                  <DatePicker
                    picker={
                      statsPeriod === "semaine"
                        ? "week"
                        : statsPeriod === "mois"
                          ? "month"
                          : undefined
                    }
                    className="h-11 rounded-xl bg-white border-slate-200 shadow-sm hover:border-blue-400 w-64"
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    format={
                      statsPeriod === "semaine"
                        ? "Week WW - YYYY"
                        : statsPeriod === "mois"
                          ? "MMMM YYYY"
                          : "DD MMMM YYYY"
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <Row gutter={[16, 16]}>
            {/* Couleurs en style direct : le fond des Card antd écrase les classes bg-*. */}
            <Col xs={24} sm={12}>
              <Card
                className="shadow-sm"
                style={{ backgroundColor: "#faf5ff", borderColor: "#e9d5ff" }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-purple-950/20"
                    style={{ backgroundColor: "#3b0764" }}
                  >
                    <Package className="h-6 w-6" />
                  </span>
                  <Statistic
                    title={
                      <span className="font-semibold text-purple-900">
                        {t("delivery.stats.articlesDelivered")}
                      </span>
                    }
                    value={stats.totalProducts}
                    formatter={(v) => Number(v).toLocaleString("fr-FR")}
                    valueStyle={{ color: "#3b0764", fontWeight: 800 }}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card
                className="shadow-sm"
                style={{ backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                    <BarChart3 className="h-6 w-6" />
                  </span>
                  <Statistic
                    title={
                      <span className="font-semibold text-emerald-800">
                        {t("admin.deliveries.stats.productValue")}
                      </span>
                    }
                    value={stats.totalItemsValue}
                    formatter={(v) => Number(v).toLocaleString("fr-FR")}
                    suffix={<span className="text-base font-bold">{t("delivery.productSelection.currency").toUpperCase()}</span>}
                    valueStyle={{ color: "#047857", fontWeight: 800 }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Un caissier ne voit que ses ventes : pas de comparaison entre vendeurs. */}
        {!caissier && (
          <PerformanceVendeurs
            orders={ordersTousVendeurs}
            vendeurActif={filters.livreur}
            onChoisir={(id) => handleFilterChange("livreur", id)}
          />
        )}

        <div className="w-full h-full bg-red rounded-lg relative flex flex-col">
          <SearchAndActionsBar
            searchTerm={searchTerm}
            onExportPdf={handleExportPdf}
            exportingPdf={exportingPdf}
            vendeurs={vendeurs}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onResetFilters={resetFilters}
            onStatsPeriodChange={setStatsPeriod}
            onOpenCorbeille={caissier ? undefined : () => setShowCorbeilleModal(true)}
            filters={filters}
          />
          <div className="flex-1 overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-16">
                <img
                  src={images}
                  alt="No Data"
                  className="h-32 w-32 object-contain mb-3 opacity-80"
                />
                <span className="text-gray-400 text-sm">
                  {t("delivery.noOrders")}
                </span>
              </div>
            ) : (
              <OrdersTable
                orders={displayedOrders}
                activeMenu={activeMenu}
                onMenuToggle={handleMenuToggle}
                onDelete={handleDelete}
                onShowDetails={handleShowDetails}
                onCompletePayment={handleOrderUpdate as any}
                onReturnSuccess={handleOrderUpdate}
                onOrderUpdated={handleOrderUpdate}
              />
            )}
          </div>
          {filteredOrders.length > 0 && (
            <Pagination
              totalItems={filteredOrders.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {showDeleteModal && orders.find((o) => o.id === selectedOrderId) && (
        <CancelDeliveryModal
          order={orders.find((o) => o.id === selectedOrderId)!}
          onCancel={cancelDelete}
          onCancelled={(deletedOrderId, message) => {
            removeOrderFromState(deletedOrderId);
            handleOrderUpdate();
            showSuccessMessage(message);
            confirmDelete();
          }}
        />
      )}

      {showDetailsModal && (
        <DeliveryDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          onChanged={handleOrderUpdate}
        />
      )}

      {showCorbeilleModal && (
        <CorbeilleModal
          onClose={() => setShowCorbeilleModal(false)}
          onRestoreSuccess={() => {
            reloadOrders();
          }}
        />
      )}
    </>
  );
};

export default OrderTable;
