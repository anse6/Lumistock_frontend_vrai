import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CategoryCarousel from "./CategoryCarousel";
import SearchBar from "./SearchBar";
import ProductGrid from "./ProductGrid";
import { getConditioningId, type ConditioningId } from "./conditioning";
import PageTitle from "../../PageTitle";
import { getUrlServer } from "../../../configServer";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Modal,
  Select,
  Button,
  ConfigProvider,
  App,
  Divider,
  Tag,
  Badge,
} from "antd";

const APP_COLOR = "#3b1558";

interface Conditioning {
  _id: ConditioningId;
  nom: string;
  facteur: number;
  prix_conditionnement: number;
  prix_reference: number;
  economie: number;
}

interface Product {
  selectedQuantity: number;
  id: string;
  name: string;
  price: number;
  quantite_livreur: number;
  unite: string;
  image?: string;
  quantity: number;
  etat: string;
  conditionnements: Conditioning[];
  conditionconfig: { conditioningId: string; conditionedQuantity: number }[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  products: Product[];
}

interface Livreur {
  id: string;
  name: string;
  first_name: string;
}

interface ProductSelectProps {
  /** Si fourni, la page modifie cet approvisionnement au lieu d'en créer un. */
  approvisionnementId?: string;
}

const ProductSelectInner: React.FC<ProductSelectProps> = ({ approvisionnementId }) => {
  const isEdit = Boolean(approvisionnementId);
  const { t } = useTranslation();
  const { message: msg } = App.useApp();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [productQuantities, setProductQuantities] = useState<
    Record<string, { quantity: number; conditionconfig: { conditioningId: string; conditionedQuantity: number }[] }>
  >({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLivreur, setSelectedLivreur] = useState<string>("");
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // 12 = multiple de 2, 3, 4 et 6 colonnes : chaque page remplit des rangées complètes.
  const itemsPerPage = 12;

  // Revenir à la première page quand le filtre change, sinon on peut tomber
  // sur une page vide (ex. page 5 de « Tous » puis une catégorie de 3 produits).
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error(t("admin.dashboard.error"));

        const livreursRes = await fetch(`${getUrlServer()}/users/livreurs`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!livreursRes.ok) throw new Error(`Erreur HTTP: ${livreursRes.status}`);
        const livreursData = await livreursRes.json();
        setLivreurs(livreursData.livreurs || []);

        const stockRes = await fetch(`${getUrlServer()}/managers/stock_par_categorie`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!stockRes.ok) throw new Error(`Erreur HTTP: ${stockRes.status}`);
        const stockData = await stockRes.json();

        // Mode modification : charger l'approvisionnement existant. Les quantités
        // déjà remises au gérant ont été retirées du stock magasin : elles restent
        // disponibles pour cet approvisionnement (sinon un produit épuisé en
        // magasin ne pourrait plus être modifié ni réduit).
        const dejaRemis: Record<string, number> = {};
        if (approvisionnementId) {
          const approRes = await fetch(`${getUrlServer()}/approvisionnements/${approvisionnementId}`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          });
          if (!approRes.ok) throw new Error(`Approvisionnement introuvable (HTTP ${approRes.status})`);
          const appro = await approRes.json();
          setSelectedLivreur(appro.livreur_id || "");
          const quantites: Record<string, { quantity: number; conditionconfig: { conditioningId: string; conditionedQuantity: number }[] }> = {};
          (appro.produits || []).forEach((p: { produit_id: string | { $oid: string }; quantite: number }) => {
            const pid = getConditioningId(p.produit_id);
            dejaRemis[pid] = (dejaRemis[pid] || 0) + p.quantite;
            quantites[pid] = { quantity: p.quantite, conditionconfig: [] };
          });
          setSelectedProducts(Object.keys(quantites));
          setProductQuantities(quantites);
        }

        type RawProduct = { _id: string; nom: string; quantite: number; prix: number; unite: string; etat: string; image?: string; conditionnements: Conditioning[] };
        type RawCategory = { _id: string; nom: string; description: string; produits: RawProduct[] };

        const formattedCategories: Category[] = (stockData as RawCategory[]).map((cat) => ({
          id: cat._id,
          name: cat.nom,
          description: cat.description,
          products: cat.produits.map((p) => ({
            id: p._id, name: p.nom, price: p.prix, quantite_livreur: p.quantite + (dejaRemis[p._id] || 0),
            unite: p.unite, quantity: 0, etat: p.etat,
            image: p.image || undefined,
            conditionnements: p.conditionnements || [],
            conditionconfig: [], selectedQuantity: 0,
          })),
        }));

        setCategories(formattedCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.supplies.error"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvisionnementId]);

  const categoryCarouselData = [
    {
      id: "all",
      name: t("admin.supplies.allProducts"),
      count: categories.reduce((sum, cat) => sum + cat.products.length, 0),
    },
    ...categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      count: cat.products.length,
    })),
  ];

  const getFilteredProducts = () => {
    const list = selectedCategory
      ? (categories.find((c) => c.id === selectedCategory)?.products || [])
      : categories.flatMap((c) => c.products);

    return list
      .map((p) => ({
        id: p.id, name: p.name, size: p.unite, price: p.price,
        quantite_livreur: p.quantite_livreur,
        selected: selectedProducts.includes(p.id),
        image: p.image || null, etat: p.etat,
        conditionnements: p.conditionnements,
        conditionconfig: productQuantities[p.id]?.conditionconfig || [],
        quantity: productQuantities[p.id]?.quantity || 0,
      }))
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const filteredProducts = getFilteredProducts();

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    setProductQuantities((prev) => {
      if (!prev[productId]) return { ...prev, [productId]: { quantity: 1, conditionconfig: [] } };
      return prev;
    });
  };

  const handleContinueClick = () => {
    if (!selectedLivreur) { msg.warning(t("admin.supplies.select_deliverer")); return; }
    if (selectedProducts.length === 0) { msg.warning(t("admin.supplies.select_products")); return; }
    // Le serveur refuse toute quantité inférieure à 1.
    const sansQuantite = getSelectedProductsSummary().filter((p) => p.selectedQuantity < 1);
    if (sansQuantite.length > 0) {
      msg.warning(`Quantité à 0 pour : ${sansQuantite.map((p) => p.name).join(", ")}`);
      return;
    }
    setSubmitError(null);
    setShowModal(true);
  };

  const getSelectedProductsSummary = () =>
    selectedProducts.map((productId) => {
      const product = categories.flatMap((c) => c.products).find((p) => p.id === productId);
      if (!product) return null;
      const config = productQuantities[productId] || { quantity: 0, conditionconfig: [] };
      const totalQty = config.quantity + config.conditionconfig.reduce(
        (sum, c) => sum + c.conditionedQuantity * (product.conditionnements.find((cd) => getConditioningId(cd._id) === c.conditioningId)?.facteur || 1), 0
      );
      return { ...product, selectedQuantity: totalQty, conditionconfig: config.conditionconfig };
    }).filter(Boolean) as Product[];

  const handleConfirmSupply = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error(t("admin.dashboard.error"));
      const livreurObj = livreurs.find((l) => l.id === selectedLivreur);
      if (!livreurObj) throw new Error(t("admin.dashboard.error"));

      const payload = {
        livreur_id: livreurObj.id,
        produits: selectedProducts.map((productId) => {
          const product = categories.flatMap((c) => c.products).find((p) => p.id === productId);
          const config = productQuantities[productId] || { quantity: 0, conditionconfig: [] };
          const qty = config.quantity + config.conditionconfig.reduce(
            (sum, c) => sum + c.conditionedQuantity * (product?.conditionnements.find((cd) => getConditioningId(cd._id) === c.conditioningId)?.facteur || 1), 0
          );
          return { produit_id: productId, quantite: qty };
        }),
      };

      const res = await fetch(`${getUrlServer()}/approvisionnements${isEdit ? `/${approvisionnementId}` : ""}`, {
        method: isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        // Le serveur renvoie { error: "texte" } ou { error: { champ: [messages] } }.
        const detail = errData?.error ?? errData?.message;
        const texte = typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : "";
        throw new Error(texte || `Erreur HTTP: ${res.status}`);
      }

      setSubmitSuccess(true);
      msg.success(isEdit ? "Approvisionnement modifié avec succès" : t("admin.supplies.success"));
      setTimeout(() => {
        setShowModal(false);
        setTimeout(() => navigate("/admin/dashboard/produits_approvisionnements"), 800);
      }, 2000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : t("admin.supplies.error");
      setSubmitError(errMsg);
      msg.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = getSelectedProductsSummary();
  const totalAmount = summary.reduce((sum, p) => sum + p.price * p.selectedQuantity, 0);
  const livreurObj = livreurs.find((l) => l.id === selectedLivreur);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${APP_COLOR} transparent transparent transparent` }} />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{t("admin.dashboard.error")}: {error}</div>;
  }

  return (
    <>
      <PageTitle>{isEdit ? "Modifier l'approvisionnement" : t("admin.supplies.title")}</PageTitle>

      <div className="w-full bg-white min-h-screen pb-20 overflow-x-hidden">
        {/* Breadcrumb */}
        <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center gap-2 text-sm font-medium flex-wrap">
          <Link
            to="/admin/dashboard/produits_approvisionnements"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: APP_COLOR }}
          >
            <ArrowLeftOutlined className="text-xs" />
            {t("admin.products.title")}
          </Link>
          <span className="text-gray-300 font-bold">›</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
            {isEdit ? "Modifier l'approvisionnement" : t("admin.supplies.select_products")}
          </span>
        </div>

        {/* Header card */}
        <div
          className="mx-4 sm:mx-6 mb-4 p-3 sm:p-4 rounded-2xl border border-purple-100 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${APP_COLOR}09, #faf5ff)` }}
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            {/* Sélection du gérant : largeur limitée (un nom n'a pas besoin de toute la ligne) */}
            <div className="w-full sm:w-72 min-w-0">
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: APP_COLOR }}>
                <UserOutlined className="mr-1" />
                {t("admin.supplies.deliverer")} <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedLivreur || undefined}
                onChange={(val) => setSelectedLivreur(val ?? "")}
                placeholder={t("admin.supplies.select_deliverer")}
                className="w-full"
                size="large"
                showSearch
                allowClear
                optionFilterProp="label"
                options={livreurs.map((l) => ({
                  value: l.id,
                  label: `${l.first_name ?? ""} ${l.name ?? ""}`.trim(),
                }))}
                notFoundContent="Aucun gérant trouvé"
              />
            </div>

            {/* Actions */}
            <div className="flex w-full sm:w-auto flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 bg-white border border-purple-100 rounded-xl px-3 py-2 shrink-0">
                <ShoppingCartOutlined style={{ color: APP_COLOR }} />
                <Badge count={selectedProducts.length} showZero style={{ backgroundColor: APP_COLOR }} />
                <span className="text-xs text-gray-500 ml-1">{t("admin.supplies.itemsCount")}</span>
              </div>
              <Button
                type="primary"
                size="large"
                onClick={handleContinueClick}
                disabled={selectedProducts.length === 0 || !selectedLivreur}
                icon={<CheckCircleFilled />}
                className="font-bold w-full sm:w-auto min-w-0"
                style={{
                  backgroundColor: selectedProducts.length === 0 || !selectedLivreur ? '#d1d5db' : APP_COLOR,
                  borderColor: selectedProducts.length === 0 || !selectedLivreur ? '#d1d5db' : APP_COLOR,
                  color: '#ffffff',
                }}
              >
                <span className="truncate" style={{ color: '#ffffff' }}>
                  {isEdit ? "Enregistrer les modifications" : t("admin.supplies.new_supply")}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Catégories puis recherche */}
        <div className="px-4 sm:px-6">
          <CategoryCarousel
            categories={categoryCarouselData}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <span className="text-xs text-gray-500">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Grid */}
        {filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
            selectedProducts={selectedProducts}
            toggleProductSelection={toggleProductSelection}
            productQuantities={productQuantities}
            setProductQuantities={setProductQuantities}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        ) : (
          <div className="text-center py-16 text-gray-400">
            <ShoppingCartOutlined style={{ fontSize: 36, marginBottom: 8 }} />
            <p className="text-sm">{t("admin.dashboard.no_data")}</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={showModal}
        onCancel={() => { setShowModal(false); if (!submitSuccess) setSubmitError(null); }}
        title={
          <div className="flex items-center gap-2 font-bold text-base" style={{ color: APP_COLOR }}>
            <ShoppingCartOutlined />
            {isEdit ? "Confirmer la modification" : t("admin.supplies.confirm_title")}
          </div>
        }
        footer={
          submitSuccess ? null : (
            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={() => { setShowModal(false); setSubmitError(null); }} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button
                type="primary"
                loading={isSubmitting}
                onClick={handleConfirmSupply}
                style={{ backgroundColor: APP_COLOR, borderColor: APP_COLOR }}
                className="font-bold"
              >
                Confirmer
              </Button>
            </div>
          )
        }
        width={480}
        centered
        destroyOnHidden
      >
        {submitSuccess ? (
          <div className="text-center py-8">
            <CheckCircleFilled style={{ fontSize: 60, color: '#22c55e' }} />
            <p className="text-lg font-bold text-green-700 mt-3">
              {isEdit ? "Approvisionnement modifié avec succès" : t("admin.supplies.success")}
            </p>
            <p className="text-gray-400 text-sm mt-1">Redirection en cours…</p>
          </div>
        ) : (
          <>
            {/* Livreur */}
            {livreurObj && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: `${APP_COLOR}0a` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: APP_COLOR }}>
                  {livreurObj.first_name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-400">{t("admin.supplies.deliverer")}</div>
                  <div className="font-semibold text-sm text-gray-800 truncate">{livreurObj.first_name} {livreurObj.name}</div>
                </div>
              </div>
            )}

            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              {t("admin.supplies.summary")} · {summary.length} produit(s)
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {summary.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2.5 rounded-xl min-w-0"
                  style={{ backgroundColor: `${APP_COLOR}06` }}>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-gray-800 truncate">{product.name}</div>
                    <div className="text-xs text-gray-400">{product.selectedQuantity} {product.unite}</div>
                  </div>
                  <Tag color="purple" className="font-bold shrink-0 ml-2">
                    {(product.price * product.selectedQuantity).toLocaleString()} CFA
                  </Tag>
                </div>
              ))}
            </div>

            <Divider className="my-3" />

            <div className="flex justify-between items-center font-bold text-base">
              <span style={{ color: APP_COLOR }}>{t("admin.supplies.units.total")}</span>
              <span style={{ color: APP_COLOR }}>{totalAmount.toLocaleString()} {t("delivery.productSelection.currency")}</span>
            </div>

            {submitError && (
              <div className="mt-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                ⚠ {submitError}
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

const ProductSelect: React.FC<ProductSelectProps> = ({ approvisionnementId }) => (
  <ConfigProvider theme={{ token: { colorPrimary: APP_COLOR, borderRadius: 10 } }}>
    <App>
      <ProductSelectInner approvisionnementId={approvisionnementId} />
    </App>
  </ConfigProvider>
);

export default ProductSelect;
