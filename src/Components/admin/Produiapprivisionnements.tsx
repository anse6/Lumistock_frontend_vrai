import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Filter,
  Plus,
  X,
  Package,
  Banknote,
  Trash2,
  FileSpreadsheet,
  FileDown,
  FileUp,
  ChevronRight,
  PackageX,
  ScanBarcode,
} from "lucide-react";
import { Spin, Popover, Tooltip, App } from "antd";
import { useTranslation } from "react-i18next";
import ProductTable, { type AvarieResume } from "./Produits/ProductTable";
import SupplyTable from "./Produits/SupplyTable";
import DeleteModal from "./Produits/DeleteModal";
import SupplyModal from "./Produits/SupplyModal";
import CorbeilleProductDrawer from "./Produits/CorbeilleProductDrawer";
import useCompteConnecte from "../../hooks/useCompteConnecte";
import CorbeilleSupplyDrawer from "./Produits/CorbeilleSupplyDrawer";
import { generateSuppliesReportPdf } from "./Produits/suppliesReportPdf";
import type { SupplyPdfData, SupplyPdfStore } from "./Produits/supplyPdf";
import { Link } from "react-router-dom";
import { useOngletUrl } from "../../hooks/useOngletUrl";
import PageTitle from "../PageTitle";
import { getUrlServer } from "../../configServer";
import axios from "axios";

interface Product {
  id: string;
  image: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  remainingQuantity: number;
  price: number;
  purchasePrice: number;
  status: "in_stock" | "out_of_stock";
  seuil_alerte: number;
  fournisseur_id?: string;
  avarie: AvarieResume | null;
  estSolde: boolean;
}

interface Supply {
  id: string;
  deliverer: string;
  quantity: number;
  amount: string;
  amountValue: number;
  date: string;
  /** Date ISO d'origine : sert aux filtres (la date affichée est déjà formatée). */
  createdAt: string;
  stockTotal: number;
  fournisseur_id?: string;
}

interface Fournisseur {
  _id: string;
  nom: string;
}

const Produiapprivisionnements: React.FC = () => {
  const { t, i18n } = useTranslation();
  // Onglet relié à l'adresse (?onglet=approvisionnements) : le menu latéral ouvre l'onglet voulu.
  const [ongletUrl, changerOngletUrl] = useOngletUrl(["produits", "approvisionnements"], "produits");
  const activeTab: "products" | "supply" = ongletUrl === "approvisionnements" ? "supply" : "products";
  const setActiveTab = useCallback(
    (tab: "products" | "supply") => changerOngletUrl(tab === "supply" ? "approvisionnements" : "produits"),
    [changerOngletUrl],
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showCorbeilleDrawer, setShowCorbeilleDrawer] = useState(false);
  const [showSupplyCorbeilleDrawer, setShowSupplyCorbeilleDrawer] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedItemName, setSelectedItemName] = useState<string>("");
  const [supplyName, setSupplyName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  // Données complètes renvoyées par l'API (produits, gérant, auteur…), pour l'export PDF.
  const [supplyDetailsById, setSupplyDetailsById] = useState<Record<string, SupplyPdfData>>({});
  const [isExportingSuppliesPdf, setIsExportingSuppliesPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supplyLoading, setSupplyLoading] = useState(false);
  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "admin";
  const { peut } = useCompteConnecte();

  const [searchTerm, setSearchTerm] = useState("");
  // const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  // Vue « Avaries » : n'affiche que les produits ayant au moins une avarie déclarée.
  const [showAvaries, setShowAvaries] = useState(false);

  const [productStatusFilter, setProductStatusFilter] = useState<string>("all");
  const [productCategoryFilter, setProductCategoryFilter] =
    useState<string>("all");

  const [supplyDateFilter, setSupplyDateFilter] = useState<string>("all");
  const [supplyAmountFilter, setSupplyAmountFilter] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  const [productAlertFilter, setProductAlertFilter] = useState<string>("all");
  const [productSupplierFilter, setProductSupplierFilter] = useState<string>("all");
  const [supplySupplierFilter, setSupplySupplierFilter] = useState<string>("all");
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);

  const fileImportInputRef = useRef<HTMLInputElement>(null);

  const { message: msg } = App.useApp();
  
  const showSuccessMessage = (messageText: string, isImportExport = false) => {
    msg.success({
      content: messageText,
      duration: isImportExport ? 5 : 3,
    });
  };

  const showErrorMessage = (messageText: string) => {
    msg.error(messageText);
  };

  const fetchApprovisionnements = useCallback(async (token: string) => {
    setSupplyLoading(true);
    try {
      const response = await fetch(`${getUrlServer()}/approvisionnements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP approvisionnements: ${response.status}`);
      }

      const data = await response.json();

      interface ApiSupply {
        id: string;
        first_name?: string;
        last_name?: string;
        quantite: number;
        montant?: number;
        created_at: string;
        quantite_stock_total: number;
      }

      const formattedSupplies: Supply[] = data.map((item: ApiSupply) => ({
        id: item.id,
        deliverer:
          `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() ||
          t("admin.dashboard.no_data"),
        quantity: item.quantite,
        amountValue: item.montant || 0,
        amount: `${(item.montant ?? 0).toLocaleString(i18n.language === "fr" ? "fr-FR" : "en-US")} ${t("delivery.productSelection.currency")}`,
        date: new Date(item.created_at).toLocaleDateString(
          i18n.language === "fr" ? "fr-FR" : "en-US",
        ),
        createdAt: item.created_at,
        stockTotal: item.quantite_stock_total || 0,
        fournisseur_id: (item as any).fournisseur_id,
      }));

      setSupplies(formattedSupplies);
      setSupplyDetailsById(
        Object.fromEntries((data as SupplyPdfData[]).map((item) => [item.id, item])),
      );
    } catch (err) {
      console.error("Erreur approvisionnements:", err);
    } finally {
      setSupplyLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${getUrlServer()}/produits`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP produits: ${response.status}`);
      }

      const productsData = await response.json();

      const formattedProduits: Product[] = productsData.map(
        (produit: {
          _id: string;
          nom: string;
          description: string;
          categorie_nom: string;
          quantite_initiale: number;
          quantite: number;
          prix: number;
          prix_achat?: number;
          etat: string;
          image?: string;
        }) => ({
          id: produit._id,
          name: produit.nom,
          description: produit.description,
          category: produit.categorie_nom,
          quantity: produit.quantite_initiale,
          remainingQuantity: produit.quantite,
          price: produit.prix,
          purchasePrice: produit.prix_achat || 0,
          status:
            produit.etat === "en stock" || produit.etat === "En stock"
              ? "in_stock"
              : "out_of_stock",
          image: produit.image
            ? `${getUrlServer()}/uploads/images/${produit.image}`
            : "/api/placeholder/50/50",
          seuil_alerte: (produit as any).seuil_alerte || 0,
          fournisseur_id: (produit as any).fournisseur_id,
          avarie: (produit as any).avarie ?? null,
          estSolde: Boolean((produit as any).est_solde),
        }),
      );

      setProducts(formattedProduits);
    } catch (err) {
      showErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error(t("admin.dashboard.error"));
        }

        // Fetch fournisseurs
        try {
          const resFourn = await fetch(`${getUrlServer()}/fournisseurs`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resFourn.ok) {
            setFournisseurs(await resFourn.json());
          }
        } catch (e) {}

        await fetchProducts(token);

        if (activeTab === "supply") {
          await fetchApprovisionnements(token);
        }
      } catch (err) {
        showErrorMessage(
          err instanceof Error ? err.message : "Erreur inconnue",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, fetchProducts, fetchApprovisionnements]);

  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        productStatusFilter === "all" ||
        (productStatusFilter === "stock" && product.status === "in_stock") ||
        (productStatusFilter === "rupture" &&
          product.status === "out_of_stock");

      const matchesCategory =
        productCategoryFilter === "all" ||
        product.category === productCategoryFilter;

      const matchesAlert = 
        productAlertFilter === "all" ||
        (productAlertFilter === "critical" && product.remainingQuantity <= product.seuil_alerte) ||
        (productAlertFilter === "normal" && product.remainingQuantity > product.seuil_alerte);

      const matchesSupplier = 
        productSupplierFilter === "all" || 
        product.fournisseur_id === productSupplierFilter;

      const matchesAvarie = !showAvaries || Boolean(product.avarie);

      return matchesSearch && matchesStatus && matchesCategory && matchesAlert && matchesSupplier && matchesAvarie;
    });
  }, [products, searchTerm, productStatusFilter, productCategoryFilter, productAlertFilter, productSupplierFilter, showAvaries]);

  const nombreProduitsAvaries = React.useMemo(
    () => products.filter((product) => product.avarie).length,
    [products],
  );

  const getWeekNumber = useCallback((d: Date) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((date.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      )
    );
  }, []);

  const filteredSupplies = React.useMemo(() => {
    return supplies.filter((supply) => {
      const matchesSearch =
        supply.deliverer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supply.amount.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supply.date.toLowerCase().includes(searchTerm.toLowerCase());

      const now = new Date();
      // Date ISO d'origine : « 14/10/2026 » (date affichée) n'est pas lisible par Date.
      const supplyDate = new Date(supply.createdAt);

      let matchesDate = true;
      if (supplyDateFilter === "today") {
        matchesDate =
          supplyDate.getDate() === now.getDate() &&
          supplyDate.getMonth() === now.getMonth() &&
          supplyDate.getFullYear() === now.getFullYear();
      } else if (supplyDateFilter === "week") {
        matchesDate =
          getWeekNumber(supplyDate) === getWeekNumber(now) &&
          supplyDate.getFullYear() === now.getFullYear();
      } else if (supplyDateFilter === "month") {
        matchesDate =
          supplyDate.getMonth() === now.getMonth() &&
          supplyDate.getFullYear() === now.getFullYear();
      }

      const amountValue = parseFloat(supply.amount.replace(/[^0-9.]/g, ""));
      let matchesAmount = true;

      if (supplyAmountFilter === "low") {
        matchesAmount = amountValue < 100000;
      } else if (supplyAmountFilter === "medium") {
        matchesAmount = amountValue >= 100000 && amountValue <= 500000;
      } else if (supplyAmountFilter === "high") {
        matchesAmount = amountValue > 500000;
      }

      if (minAmount !== "" && maxAmount !== "") {
        const min = parseFloat(minAmount);
        const max = parseFloat(maxAmount);
        if (!isNaN(min) && !isNaN(max)) {
          matchesAmount = amountValue >= min && amountValue <= max;
        }
      }

      const matchesSupplier = 
        supplySupplierFilter === "all" || 
        supply.fournisseur_id === supplySupplierFilter;

      return matchesSearch && matchesDate && matchesAmount && matchesSupplier;
    });
  }, [
    supplies,
    searchTerm,
    supplyDateFilter,
    supplyAmountFilter,
    minAmount,
    maxAmount,
    supplySupplierFilter,
    getWeekNumber,
  ]);

  const productCategories = React.useMemo(
    () => [...new Set(products.map((p) => p.category))],
    [products],
  );

  const totalPurchaseValue = React.useMemo(() => {
    return products.reduce((acc, product) => {
      return acc + (product.purchasePrice || 0) * product.remainingQuantity;
    }, 0);
  }, [products]);

  const totalSaleValue = React.useMemo(() => {
    return products.reduce((acc, product) => {
      const price = product.price || 0;
      return acc + price * product.remainingQuantity;
    }, 0);
  }, [products]);

  const totalProductsCount = React.useMemo(() => {
    return products.reduce(
      (acc, product) => acc + product.remainingQuantity,
      0,
    );
  }, [products]);

  const totalSuppliedQuantity = React.useMemo(() => {
    return supplies.reduce((acc, supply) => acc + supply.quantity, 0);
  }, [supplies]);

  const totalSuppliedAmount = React.useMemo(() => {
    return supplies.reduce((acc, supply) => acc + (supply.amountValue || 0), 0);
  }, [supplies]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    if (activeTab === "products") {
      setProductStatusFilter("all");
      setProductCategoryFilter("all");
      setProductAlertFilter("all");
      setProductSupplierFilter("all");
    } else {
      setSupplyDateFilter("all");
      setSupplyAmountFilter("all");
      setSupplySupplierFilter("all");
      setMinAmount("");
      setMaxAmount("");
    }
    // setCurrentPage(1);
  }, [activeTab]);

  // Export PDF des produits approvisionnés : exporte exactement les
  // approvisionnements affichés (recherche et filtres compris).
  const handleExportSuppliesPdf = useCallback(async () => {
    const selection = filteredSupplies
      .map((supply) => supplyDetailsById[supply.id])
      .filter(Boolean);
    if (selection.length === 0) {
      msg.warning("Aucun approvisionnement à exporter avec les filtres actuels.");
      return;
    }

    const filtres = [
      searchTerm ? `recherche « ${searchTerm} »` : "",
      { today: "aujourd'hui", week: "cette semaine", month: "ce mois-ci" }[supplyDateFilter] ?? "",
      { low: "montant < 100 000", medium: "montant entre 100 000 et 500 000", high: "montant > 500 000" }[supplyAmountFilter] ?? "",
      minAmount !== "" && maxAmount !== "" ? `montant de ${minAmount} à ${maxAmount}` : "",
      supplySupplierFilter !== "all"
        ? `fournisseur ${fournisseurs.find((f) => f._id === supplySupplierFilter)?.nom ?? ""}`.trim()
        : "",
    ].filter(Boolean).join(", ");

    setIsExportingSuppliesPdf(true);
    try {
      const token = localStorage.getItem("access_token");
      const storeRes = await fetch(`${getUrlServer()}/magasin/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const storeData = storeRes.ok ? await storeRes.json() : null;
      const store: SupplyPdfStore = storeData?.magasin || {
        denomination: localStorage.getItem("denomination_magasin") || undefined,
      };
      await generateSuppliesReportPdf(
        selection,
        store,
        store.logo || localStorage.getItem("logo_magasin"),
        { filtres: filtres || undefined },
      );
      msg.success(`PDF généré : ${selection.length} approvisionnement${selection.length > 1 ? "s" : ""}.`);
    } catch (error) {
      console.error("Erreur d'export PDF des approvisionnements :", error);
      msg.error("Impossible de générer le PDF des approvisionnements.");
    } finally {
      setIsExportingSuppliesPdf(false);
    }
  }, [
    filteredSupplies, supplyDetailsById, searchTerm, supplyDateFilter, supplyAmountFilter,
    minAmount, maxAmount, supplySupplierFilter, fournisseurs, msg,
  ]);

  const handleExport = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Non authentifié");
      }

      const response = await fetch(`${getUrlServer()}/produits/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const contentDisposition = response.headers.get("content-disposition");
      let filename = "produits_export.xlsx";

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
      showSuccessMessage(t("admin.dashboard.success"), true);
    } catch (err) {
      console.error("Erreur lors de l'export:", err);
      showErrorMessage(
        err instanceof Error ? err.message : "Erreur lors de l'export",
      );
    }
  }, []);

  const handleImportClick = () => {
    fileImportInputRef.current?.click();
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      showErrorMessage("Aucun fichier sélectionné pour l'importation.");
      return;
    }

    const formData = new FormData();
    formData.append("fichier", file);

    const token = localStorage.getItem("access_token");
    if (!token) {
      showErrorMessage("Non authentifié. Veuillez vous reconnecter.");
      return;
    }

    try {
      showSuccessMessage("Importation en cours...", true);

      const response = await axios.post(
        `${getUrlServer()}/produits/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        const crees = response.data?.produits_crees?.length || 0;
        const ignores = response.data?.produits_ignores?.length || 0;
        showSuccessMessage(
          ignores
            ? `${crees} produit(s) importé(s), ${ignores} déjà présent(s) ignoré(s).`
            : t("admin.dashboard.success"),
          true,
        );
        await fetchProducts(token);
      } else {
        showErrorMessage(
          `Une erreur est survenue au moment de l'importation : ${response.statusText || "Erreur inconnue"}`,
        );
      }
    } catch (err: any) {
      console.error("Erreur lors de l'importation:", err);
      if (err.response) {
        showErrorMessage(
          "Une erreur est survenue lors de l'importation. Veuillez vous assurer que les noms des colonnes sont corrects et conformes au format attendu.",
        );
      } else if (err.request) {
        showErrorMessage(
          "Erreur réseau: Pas de réponse du serveur. Vérifiez votre connexion ou l'URL du serveur.",
        );
      } else {
        showErrorMessage(`Erreur: ${err.message}`);
      }
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleEditClick = useCallback(
    (productId: string) => {
      const productToEdit = products.find((p) => p.id === productId);
      if (productToEdit) {
        fetchProducts(productId);
      }
    },
    [products, fetchProducts],
  );

  const handleDeleteProduct = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token || !selectedItem) {
        throw new Error("Non authentifié ou produit non sélectionné");
      }

      const response = await fetch(
        `${getUrlServer()}/produits/${selectedItem}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `Erreur HTTP: ${response.status}`);
      }

      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== selectedItem),
      );
      setShowDeleteModal(false);
      setSelectedItem("");
      showSuccessMessage(data.message || t("admin.dashboard.success"));
    } catch (err: any) {
      console.error("Erreur lors de la suppression du produit:", err);
      showErrorMessage(
        err.response?.data?.message || err.message || "Erreur lors de la suppression du produit"
      );
    }
  }, [selectedItem]);

  const handleSupplyDeleted = useCallback((deletedSupplyId: string) => {
    setSupplies((prevSupplies) =>
      prevSupplies.filter((s) => s.id !== deletedSupplyId),
    );
    showSuccessMessage(t("admin.dashboard.success"));
  }, []);

  const handleActionClick = useCallback(
    (action: string, itemId: string) => {
      setSelectedItem(itemId);
      const prod = products.find((p) => p.id === itemId);
      if (prod) setSelectedItemName(prod.name);

      if (action === "delete") {
        setShowDeleteModal(true);
      } else if (action === "supply") {
        setShowSupplyModal(true);
      } else if (action === "edit") {
        handleEditClick(itemId);
      } else if (action === "details") {
        console.log("Afficher détails pour:", itemId);
      }
    },
    [handleEditClick, products],
  );

  const handleSupplyConfirm = useCallback(
    async (quantity: number, amount: number, fournisseurId?: string) => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token || !selectedItem) {
          throw new Error("Non authentifié ou produit non sélectionné");
        }

        const body: Record<string, any> = {
          produit_id: selectedItem,
          quantite: quantity,
          montant: amount,
          first_name: supplyName,
        };
        if (fournisseurId) body.fournisseur_id = fournisseurId;

        const response = await fetch(`${getUrlServer()}/approvisionnements`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        if (token) {
          await Promise.all([
            fetchApprovisionnements(token),
            fetchProducts(token),
          ]);
        }

        setShowSupplyModal(false);
        setSelectedItem("");
        setSelectedItemName("");
        setSupplyName("");
        showSuccessMessage(t("admin.dashboard.success"));
      } catch (err) {
        console.error("Erreur lors de l'approvisionnement:", err);
        showErrorMessage(
          err instanceof Error
            ? err.message
            : "Erreur lors de l'approvisionnement",
        );
      }
    },
    [selectedItem, supplyName, fetchApprovisionnements, fetchProducts],
  );

  const handleTabChange = useCallback(
    (tab: "products" | "supply") => {
      setActiveTab(tab);
      // setCurrentPage(1);
      resetFilters();
      setShowFilters(false);
    },
    [resetFilters, setActiveTab],
  );

  if (loading && activeTab === "products") {
    return (
      <div className="flex justify-center items-center ">
        <Spin />
      </div>
    );
  }

  if (supplyLoading && activeTab === "supply") {
    return (
      <div className="flex justify-center items-center ">
        <Spin />
      </div>
    );
  }

  return (
    <>
      <PageTitle>{t("admin.products.title")}</PageTitle>

      <div className="w-full p-4 sm:p-6 bg-white">
        {activeTab === "products" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Carte 1 — Violet principale */}
            <div className="bg-white p-5 rounded-2xl border-2 border-purple-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-bl-full opacity-60"></div>
              <div className="relative z-10">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                  {t("admin.products.total_products")} (Stock)
                </p>
                <h4 className="text-2xl font-bold text-purple-950">
                  {totalProductsCount.toLocaleString(
                    i18n.language === "fr" ? "fr-FR" : "en-US",
                  )}{" "}
                  {t("delivery.detailsModal.printUnit")}s
                </h4>
                <p className="text-xs text-purple-900/60 mt-1 font-medium">
                  {products.length} {t("admin.products.different_references")}
                </p>
              </div>
              <div className="bg-purple-950 p-3 rounded-xl relative z-10">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>

            {isAdmin && (
              /* Carte 2 — Rose bordeaux */
              <div className="bg-white p-5 rounded-2xl border-2 border-rose-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-50 to-transparent rounded-bl-full opacity-60"></div>
                <div className="relative z-10">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                    {t("admin.products.purchase_value")}
                  </p>
                  <h4 className="text-2xl font-bold text-rose-800">
                    {totalPurchaseValue.toLocaleString(
                      i18n.language === "fr" ? "fr-FR" : "en-US",
                    )}{" "}
                    {t("delivery.productSelection.currency")}
                  </h4>
                  <p className="text-xs text-rose-700/70 mt-1 font-medium">
                    {t("admin.products.purchase_price")}
                  </p>
                </div>
                <div className="bg-rose-700 p-3 rounded-xl relative z-10">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            {/* Carte 3 — Indigo */}
            <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full opacity-60"></div>
              <div className="relative z-10">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                  {t("admin.products.sale_value")}
                </p>
                <h4 className="text-2xl font-bold text-indigo-800">
                  {totalSaleValue.toLocaleString(
                    i18n.language === "fr" ? "fr-FR" : "en-US",
                  )}{" "}
                  {t("delivery.productSelection.currency")}
                </h4>
                <p className="text-xs text-indigo-700/70 mt-1 font-medium">
                  {t("admin.products.unit_price")}
                </p>
              </div>
              <div className="bg-indigo-700 p-3 rounded-xl relative z-10">
                <Banknote className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white p-5 rounded-2xl border-2 border-purple-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-bl-full opacity-60"></div>
              <div className="relative z-10">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                  {t("admin.supplies.total_quantity")}
                </p>
                <h4 className="text-2xl font-bold text-purple-950">
                  {totalSuppliedQuantity.toLocaleString(
                    i18n.language === "fr" ? "fr-FR" : "en-US",
                  )}{" "}
                  {t("delivery.detailsModal.printUnit")}s
                </h4>
                <p className="text-xs text-purple-900/60 mt-1 font-medium">
                  {t("admin.supplies.items_entered")}
                </p>
              </div>
              <div className="bg-purple-950 p-3 rounded-xl relative z-10">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-rose-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-50 to-transparent rounded-bl-full opacity-60"></div>
              <div className="relative z-10">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                  {t("admin.supplies.total_amount")}
                </p>
                <h4 className="text-2xl font-bold text-rose-800">
                  {totalSuppliedAmount.toLocaleString(
                    i18n.language === "fr" ? "fr-FR" : "en-US",
                  )}{" "}
                  {t("delivery.productSelection.currency")}
                </h4>
                <p className="text-xs text-rose-700/70 mt-1 font-medium">
                  {t("admin.supplies.budget_invested")}
                </p>
              </div>
              <div className="bg-rose-700 p-3 rounded-xl relative z-10">
                <Banknote className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => handleTabChange("products")}
              className={`px-6 py-2.5 font-semibold text-sm rounded-lg transition-all duration-200 ${
                activeTab === "products"
                  ? "bg-purple-950 text-white shadow-md shadow-purple-950/30"
                  : "bg-white text-gray-500 border border-gray-200 hover:text-purple-950 hover:border-purple-200"
              }`}
            >
              {t("admin.products.title")}
            </button>
            <button
              onClick={() => handleTabChange("supply")}
              className={`px-6 py-2.5 font-semibold text-sm rounded-lg transition-all duration-200 ${
                activeTab === "supply"
                  ? "bg-purple-950 text-white shadow-md shadow-purple-950/30"
                  : "bg-white text-gray-500 border border-gray-200 hover:text-purple-950 hover:border-purple-200"
              }`}
            >
              {t("admin.supplies.title")}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t("admin.products.search_placeholder")}
                value={searchTerm}
                onChange={handleSearch}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 border border-purple-100 bg-purple-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b1558]/30 focus:border-[#3b1558] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileImportInputRef}
              onChange={handleFileImport}
              accept=".xlsx, .xls"
              className="hidden"
            />

            {activeTab === "products" && (
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                {peut("produits.importer") && (
                <Popover
                  title={
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />{" "}
                      Format du fichier Excel
                    </span>
                  }
                  content={
                    <div className="text-sm max-w-xs p-1">
                      <p className="text-gray-600 mb-3 text-xs leading-relaxed">
                        Le fichier doit contenir les colonnes suivantes pour une
                        importation réussie :
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[
                          "Nom du produit",
                          "Description",
                          "Catégorie",
                          "Quantité initiale",
                          "Prix",
                          "Prix d'achat",
                        ].map((col, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-gray-50 p-1.5 rounded border border-gray-100"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[11px] font-medium text-gray-700">
                              {col}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                        <div className="text-amber-500 text-xs font-bold mt-0.5">
                          !
                        </div>
                        <p className="text-[10px] text-amber-700 leading-tight">
                          Assurez-vous que les en-têtes correspondent exactement
                          à ces noms.
                        </p>
                      </div>
                    </div>
                  }
                  placement="bottomRight"
                  trigger="hover"
                >
                  <button
                    onClick={handleImportClick}
                    className="group flex items-center gap-2 px-4 py-2 text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg transition-all duration-200 shadow-sm border border-emerald-200 font-semibold text-sm"
                  >
                    <div className="p-1 rounded bg-emerald-100/70 group-hover:bg-emerald-100 transition-colors">
                      <FileUp className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:inline">Importer Excel</span>
                  </button>
                </Popover>
                )}

                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                <Tooltip title="Télécharger la liste actuelle en format Excel">
                  <button
                    onClick={handleExport}
                    className="group flex items-center gap-2 px-4 py-2 text-[#3b1558] bg-white hover:bg-purple-50 rounded-lg transition-all duration-200 shadow-sm border border-purple-200 font-semibold text-sm"
                  >
                    <div className="p-1 rounded bg-purple-100/50 group-hover:bg-purple-100 transition-colors">
                      <FileDown className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:inline">Exporter Excel</span>
                  </button>
                </Tooltip>
              </div>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm shadow-sm border ${
                showFilters
                  ? "bg-[#3b1558] text-white border-[#3b1558] shadow-md shadow-[#3b1558]/20"
                  : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
              }`}
            >
              <Filter
                className={`w-4 h-4 ${showFilters ? "text-white" : "text-gray-500"}`}
              />
              <span className="hidden sm:inline">
                {t("admin.products.filters")}
              </span>
            </button>

            {activeTab === "products" && (
              <Tooltip
                title={
                  showAvaries
                    ? "Afficher tous les produits"
                    : "Afficher uniquement les produits signalés en avarie"
                }
              >
                <button
                  onClick={() => setShowAvaries((current) => !current)}
                  aria-pressed={showAvaries}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm shadow-sm border ${
                    showAvaries
                      ? "bg-purple-950 text-white border-purple-950 shadow-md shadow-purple-950/20"
                      : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  <PackageX
                    className={`w-4 h-4 ${showAvaries ? "text-white" : "text-purple-950"}`}
                  />
                  <span className="hidden sm:inline">Avaries</span>
                  {nombreProduitsAvaries > 0 && (
                    <span
                      className={`min-w-5 rounded-full px-1.5 text-center text-xs font-bold ${
                        showAvaries ? "bg-white text-purple-950" : "bg-purple-950 text-white"
                      }`}
                    >
                      {nombreProduitsAvaries}
                    </span>
                  )}
                </button>
              </Tooltip>
            )}

            <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

            {activeTab === "products" ? (
              <div className="flex items-center gap-2">
                <Tooltip title="Voir les produits supprimés">
                  <button
                    onClick={() => setShowCorbeilleDrawer(true)}
                    aria-label="Produits supprimés"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200 group font-medium text-sm"
                  >
                    <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </Tooltip>

                {peut("produits.modifier") && (
                  <Tooltip title="Associer les codes-barres des emballages et imprimer les étiquettes">
                    <Link
                      to="codes-barres"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white !text-[#3b1558] rounded-xl hover:bg-purple-50 transition-all duration-200 border border-purple-200 font-semibold text-sm"
                    >
                      <ScanBarcode className="h-5 w-5" />
                      <span className="hidden sm:inline">Codes-barres</span>
                    </Link>
                  </Tooltip>
                )}

                {peut("produits.creer") && (
                  <Link
                    to="add_product"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3b1558] to-[#5b2286] !text-white rounded-xl font-bold text-sm shadow-lg shadow-[#3b1558]/20 hover:shadow-xl hover:shadow-[#3b1558]/30 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline !text-white">
                      {t("admin.products.create_btn")}
                    </span>
                    <span className="sm:hidden">
                      {t("delivery.productSelection.prev")}
                    </span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Tooltip title="Télécharger en PDF les produits des approvisionnements affichés (filtres compris)">
                  <button
                    onClick={handleExportSuppliesPdf}
                    disabled={isExportingSuppliesPdf}
                    className="group flex items-center gap-2 px-4 py-2.5 text-[#3b1558] bg-white hover:bg-purple-50 rounded-xl transition-all duration-200 shadow-sm border border-purple-200 font-semibold text-sm disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isExportingSuppliesPdf ? (
                      <Spin size="small" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Exporter PDF</span>
                  </button>
                </Tooltip>

                <Tooltip title="Voir les approvisionnements supprimés">
                  <button
                    onClick={() => setShowSupplyCorbeilleDrawer(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200 group font-medium text-sm"
                  >
                    <span className="hidden sm:inline">Approvisionnements supprimés</span>
                    <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </Tooltip>

                {peut("stock.approvisionner") && (
                <Link
                  to="/admin/dashboard/produits_approvisionnements/productselect"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3b1558] to-[#5b2286] !text-white rounded-xl font-bold text-sm shadow-lg shadow-[#3b1558]/20 hover:shadow-xl hover:shadow-[#3b1558]/30 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                >
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline !text-white">
                    {t("admin.supplies.new_supply")}
                  </span>
                  <span className="sm:hidden">
                    {t("delivery.productSelection.prev")}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-50 hidden sm:block" />
                </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="bg-purple-50 p-5 rounded-2xl mb-6 border border-purple-100 shadow-inner animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[#3b1558] flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {t("admin.products.filters")}
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-rose-500 bg-white p-1 rounded-full border border-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeTab === "products" ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3b1558] mb-1.5 uppercase tracking-wider">
                    {t("admin.products.status.all")}
                  </label>
                  <select
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                    className="w-full p-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#3b1558]/20 outline-none text-sm font-medium text-gray-700"
                  >
                    <option value="all">
                      {t("admin.products.status.all")}
                    </option>
                    <option value="stock">
                      {t("admin.products.status.in_stock")}
                    </option>
                    <option value="rupture">
                      {t("admin.products.status.out_of_stock")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3b1558] mb-1.5 uppercase tracking-wider">
                    {t("admin.products.category")}
                  </label>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full p-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#3b1558]/20 outline-none text-sm font-medium text-gray-700"
                  >
                    <option value="all">
                      {t("admin.products.categories.all")}
                    </option>
                    {productCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3b1558] mb-1.5 uppercase tracking-wider">
                    Niveau de stock
                  </label>
                  <select
                    value={productAlertFilter}
                    onChange={(e) => setProductAlertFilter(e.target.value)}
                    className="w-full p-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#3b1558]/20 outline-none text-sm font-medium text-gray-700"
                  >
                    <option value="all">Tous les niveaux</option>
                    <option value="critical">Stock Critique (≤ seuil)</option>
                    <option value="normal">Stock Normal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3b1558] mb-1.5 uppercase tracking-wider">
                    Fournisseur
                  </label>
                  <select
                    value={productSupplierFilter}
                    onChange={(e) => setProductSupplierFilter(e.target.value)}
                    className="w-full p-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#3b1558]/20 outline-none text-sm font-medium text-gray-700"
                  >
                    <option value="all">Tous les fournisseurs</option>
                    {fournisseurs.map((fournisseur) => (
                      <option key={fournisseur._id} value={fournisseur._id}>
                        {fournisseur.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3b1558] mb-1.5 uppercase tracking-wider">
                    {t("delivery.ordersTable.date")}
                  </label>
                  <select
                    value={supplyDateFilter}
                    onChange={(e) => setSupplyDateFilter(e.target.value)}
                    className="w-full p-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#3b1558]/20 outline-none text-sm font-medium text-gray-700"
                  >
                    <option value="all">{t("delivery.periods.all")}</option>
                    <option value="today">{t("delivery.periods.day")}</option>
                    <option value="week">{t("delivery.periods.week")}</option>
                    <option value="month">{t("delivery.periods.month")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3b1558] mb-1.5 uppercase tracking-wider">
                    {t("delivery.ordersTable.amount")}
                  </label>
                  <select
                    value={supplyAmountFilter}
                    onChange={(e) => setSupplyAmountFilter(e.target.value)}
                    className="w-full p-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#3b1558]/20 outline-none text-sm font-medium text-gray-700"
                  >
                    <option value="all">
                      {t("delivery.searchAndFilters.allStatuses")}
                    </option>
                    <option value="low">
                      {t("admin.supplies.filters.less_than_100k")}{" "}
                      {t("delivery.productSelection.currency")}
                    </option>
                    <option value="medium">
                      {t("admin.supplies.filters.between_100k_500k")}{" "}
                      {t("delivery.productSelection.currency")}
                    </option>
                    <option value="high">
                      {t("admin.supplies.filters.more_than_500k")}{" "}
                      {t("delivery.productSelection.currency")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3b1558] mb-1.5 uppercase tracking-wider">
                    Fournisseur
                  </label>
                  <select
                    value={supplySupplierFilter}
                    onChange={(e) => setSupplySupplierFilter(e.target.value)}
                    className="w-full p-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#3b1558]/20 outline-none text-sm font-medium text-gray-700"
                  >
                    <option value="all">Tous les fournisseurs</option>
                    {fournisseurs.map((fournisseur) => (
                      <option key={fournisseur._id} value={fournisseur._id}>
                        {fournisseur.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#3b1558] mb-1.5 uppercase tracking-wider">
                      Montant min
                    </label>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full p-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#3b1558]/20 outline-none text-sm font-medium text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3b1558] mb-1.5 uppercase tracking-wider">
                      Montant max
                    </label>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full p-2 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#3b1558]/20 outline-none text-sm font-medium text-gray-700"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 bg-white text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-5 py-2.5 bg-[#3b1558] text-white font-semibold rounded-xl text-sm hover:bg-[#5b2286] transition-colors shadow-md shadow-[#3b1558]/20"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        )}

        <div className="w-full">
          {activeTab === "products" ? (
            <ProductTable
              products={filteredProducts}
              onActionClick={handleActionClick}
              isAdmin={isAdmin}
              showAvaries={showAvaries}
              onProvisionSuccess={() => {
                const token = localStorage.getItem("access_token");
                if (token) fetchProducts(token);
              }}
            />
          ) : (
            <SupplyTable
              supplies={filteredSupplies}
              onActionClick={handleActionClick}
              onSupplyDeleted={handleSupplyDeleted}
            />
          )}
        </div>
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteProduct}
        />

        <SupplyModal
          isOpen={showSupplyModal}
          onClose={() => setShowSupplyModal(false)}
          onConfirm={handleSupplyConfirm}
          productId={selectedItem}
          productName={selectedItemName}
          supplyName={supplyName}
          setSupplyName={setSupplyName}
        />

        {showCorbeilleDrawer && (
          <CorbeilleProductDrawer
            onClose={() => setShowCorbeilleDrawer(false)}
            onRestoreSuccess={() => {
              const token = localStorage.getItem("access_token");
              if (token) fetchProducts(token);
            }}
          />
        )}

        <style>{`
          /* Premium Tabs Styling */
          .custom-tabs .ant-tabs-nav::before {
            border-bottom: 2px solid #e2e8f0 !important;
          }
          .custom-tabs .ant-tabs-tab {
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-bottom: none !important;
            border-radius: 10px 10px 0 0 !important;
            transition: all 0.3s ease;
            padding: 12px 28px !important;
            margin-right: 6px !important;
          }
          .custom-tabs .ant-tabs-tab-btn {
            font-weight: 600 !important;
            font-size: 15px !important;
            color: #64748b !important;
          }
          .custom-tabs .ant-tabs-tab:hover {
            background-color: #f1f5f9 !important;
          }
          .custom-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
            color: #060c15ff !important;
          }
          .custom-tabs .ant-tabs-tab-active {
            background-color: #060c15ff !important;
            border-color: #060c15ff !important;
            box-shadow: 0 -4px 6px -1px rgba(6, 12, 21, 0.2);
          }
          .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: white !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
        `}</style>
      </div>

      {showSupplyCorbeilleDrawer && (
        <CorbeilleSupplyDrawer
          onClose={() => setShowSupplyCorbeilleDrawer(false)}
          onRestoreSuccess={() => {
            const token = localStorage.getItem("access_token");
            if (token) {
              fetchApprovisionnements(token);
            }
          }}
        />
      )}
    </>
  );
};

export default Produiapprivisionnements;
