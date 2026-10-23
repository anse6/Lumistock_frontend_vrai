import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { App, ConfigProvider, Input, Spin } from "antd";
import { ArrowLeftOutlined, BarcodeOutlined } from "@ant-design/icons";
import { ShoppingCart, ArrowRight } from "lucide-react";

import CategoryCarousel from "../../approvisonnement/CategoryCarousel";
import SearchBar from "../../approvisonnement/SearchBar";
import ProductGrid from "../newdelivery/ProductGrid";
import { useProductSelection } from "../selectionproduct/Clients/api/useProductStore";
import PageTitle from "../../../PageTitle";
import images from "@/assets/no_data.png";
import { apiVente, cheminsVente, estCaissier } from "../venteRole";
import { useContexteCaisse } from "../../../../Modules/Caisse/hooks";
import OuvertureCaisse from "../../../../Modules/Caisse/pos/OuvertureCaisse";
import { useScanVente } from "../scanVente";
import IndicateurLecteur from "../../../../Modules/CodeBarre/IndicateurLecteur";
import AssocierCodeModal from "../../../../Modules/CodeBarre/AssocierCodeModal";
import { variantesSaisie } from "../../../../Modules/CodeBarre/detecteur";

const PURPLE_950 = "#3b0764";

export interface Conditioning {
  // Texte (API actuelle) ou { $oid } (ancienne API Mongo).
  _id: string | { $oid: string };
  nom: string;
  facteur: number;
  prix_conditionnement: number;
  prix_reference: number;
  economie: number;
}

interface Product {
  _id: string;
  nom: string;
  prix: number;
  quantite_magasin: number;
  unite: string;
  image?: string;
  conditionnements?: Conditioning[];
}

interface Category {
  _id: string;
  nom: string;
  produits: Product[];
}

const fetchCategories = async (sessionExpired: string, fetchError: string): Promise<Category[]> => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No authentication token found");
  const response = await fetch(apiVente().stock, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(response.status === 401 ? sessionExpired : fetchError);
  return response.json();
};

// Étape 1 de la vente : choix des produits (les quantités se règlent à l'étape 2).
const ProductSelectionInner: React.FC = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState("");
  const itemsPerPage = 12;

  const { syncSelectedProductsWithIds, selectedProducts: panier, _hasHydrated } = useProductSelection();
  // Caissier : on ne vend que caisse ouverte.
  const caissier = estCaissier();
  const chemins = cheminsVente();
  const { data: ctxCaisse, isLoading: chargementCaisse } = useContexteCaisse(caissier);
  // Sélection locale, initialisée avec le panier en cours (retour depuis l'étape 2).
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [initialise, setInitialise] = useState(false);
  useEffect(() => {
    if (_hasHydrated && !initialise) {
      setSelectedProducts(panier.map((p) => p.id));
      setInitialise(true);
    }
  }, [_hasHydrated, initialise, panier]);

  const sessionExpired = t("admin.deliveries.new.sessionExpired");
  const { data: categoriesData, isLoading, error } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(sessionExpired, t("admin.deliveries.new.fetchingCategoriesError")),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (error?.message === "No authentication token found" || error?.message === sessionExpired) {
      localStorage.removeItem("access_token");
      navigate("/login");
    }
  }, [error, sessionExpired, navigate]);

  // Revenir en page 1 quand le filtre change (sinon page vide possible).
  useEffect(() => setCurrentPage(1), [selectedCategory, searchQuery]);

  const categories = useMemo(
    () =>
      categoriesData
        ? [
            { id: "all", name: t("admin.deliveries.new.allProducts"), count: categoriesData.reduce((s, c) => s + c.produits.length, 0) },
            ...categoriesData.map((c) => ({ id: c._id, name: c.nom, count: c.produits.length })),
          ]
        : [],
    [categoriesData, t],
  );

  const filteredProducts = useMemo(() => {
    if (!categoriesData) return [];
    const source = selectedCategory
      ? categoriesData.filter((c) => c._id === selectedCategory)
      : categoriesData;
    const query = searchQuery.trim().toLowerCase();
    return source
      .flatMap((cat) =>
        cat.produits.map((p) => ({
          id: p._id,
          name: p.nom,
          size: p.unite,
          price: p.prix,
          quantite_magasin: p.quantite_magasin,
          selected: selectedProducts.includes(p._id),
          image: p.image || null,
          conditionnements: p.conditionnements || [],
        })),
      )
      .filter((p) => !query || p.name.toLowerCase().includes(query));
  }, [categoriesData, selectedCategory, searchQuery, selectedProducts]);

  const toggleProductSelection = (productId: string) =>
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );

  const handleContinue = () => {
    if (selectedProducts.length === 0) {
      message.warning("Sélectionnez au moins un produit.");
      return;
    }
    // Le panier suit exactement la sélection : les produits décochés en sortent.
    syncSelectedProductsWithIds(selectedProducts);
    navigate("clientselection");
  };

  // Lecteur de code-barres : l'article scanné entre dans la vente (étape 2) avec
  // la quantité 1, ou +1 s'il y est déjà ; on passe alors directement à l'étape 2.
  // Les produits cochés à la main avant le scan sont gardés.
  // Articles déjà ajoutés par scan : la synchronisation ne doit pas les retirer
  // si un deuxième scan arrive avant le changement de page.
  const ajoutesParScan = useRef(new Set<string>());
  const scan = useScanVente({
    avantAjout: () => syncSelectedProductsWithIds([...new Set([...selectedProducts, ...ajoutesParScan.current])]),
    apresAjout: (id) => {
      ajoutesParScan.current.add(id);
      navigate(chemins.finale);
    },
    actif: !caissier || !!ctxCaisse?.session,
  });

  const saisirCode = () => {
    const variantes = variantesSaisie(barcodeInput);
    setBarcodeInput("");
    if (variantes.length) scan.traiterScan({ code: variantes[0], variantes });
  };

  if (caissier && !chargementCaisse && ctxCaisse && !ctxCaisse.session) {
    return (
      <>
        <PageTitle>Nouvelle vente</PageTitle>
        <OuvertureCaisse nom={ctxCaisse.caissier.nom} />
      </>
    );
  }

  if (isLoading || !_hasHydrated || (caissier && chargementCaisse)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error && error.message !== "No authentication token found" && error.message !== sessionExpired) {
    return <div className="py-8 text-center text-red-500">Erreur : {error.message}</div>;
  }

  return (
    <>
      <PageTitle>Nouvelle vente</PageTitle>
      <div className="w-full min-h-screen bg-white pb-16">
        {/* Fil d'Ariane */}
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 text-sm font-medium sm:px-6">
          <Link
            to={chemins.liste}
            style={{ backgroundColor: "#3b0764" }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold !text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <ArrowLeftOutlined className="text-xs" />
            {chemins.libelleListe ?? t("sidebar.delivery")}
          </Link>
          <span className="font-bold text-gray-300">›</span>
          <span className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs text-gray-500">Nouvelle vente</span>
        </div>

        {/* En-tête */}
        <div className="mx-4 mb-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm sm:mx-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900/70">Étape 1 sur 2</div>
              <h1 className="text-lg font-bold text-purple-950">Choisissez les produits à vendre</h1>
              <p className="text-xs text-slate-500">Les quantités, le client et le paiement se règlent à l'étape suivante.</p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2">
                <ShoppingCart size={16} className="text-purple-950" />
                <span className="rounded-full bg-purple-950 px-2 py-px text-xs font-bold text-white">{selectedProducts.length}</span>
                <span className="text-xs text-slate-500">produit{selectedProducts.length > 1 ? "s" : ""}</span>
              </div>
              <button
                type="button"
                onClick={handleContinue}
                disabled={selectedProducts.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-950 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-950/20 transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:flex-none"
              >
                Continuer <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1" data-saisie-code-barre>
              <Input
                size="large"
                placeholder="Scannez un article, ou tapez son code-barre puis Entrée"
                prefix={<BarcodeOutlined className="text-purple-950" />}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault();
                  saisirCode();
                }}
                className="rounded-xl"
                allowClear
              />
            </div>
            <IndicateurLecteur />
          </div>

          <CategoryCarousel
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <span className="text-xs text-gray-500">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <ProductGrid
              products={filteredProducts}
              selectedProducts={selectedProducts}
              toggleProductSelection={toggleProductSelection}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <img src={images} alt="" className="mb-3 h-32 w-32 object-contain opacity-80" />
              <span className="text-sm text-gray-400">Aucun produit ne correspond à votre recherche.</span>
            </div>
          )}
        </div>
      </div>
      <AssocierCodeModal code={scan.codeInconnu} onFermer={scan.fermerCodeInconnu} onAssocie={scan.ajouterProduit} />
    </>
  );
};

const ProductSelection: React.FC = () => (
  <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}>
    <App>
      <ProductSelectionInner />
    </App>
  </ConfigProvider>
);

export default ProductSelection;
