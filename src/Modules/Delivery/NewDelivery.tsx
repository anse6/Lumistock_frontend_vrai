import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageTitle from '../../Components/PageTitle';
import CategoryCarousel from '../../Components/componentproduitselection/CategoryCarousel';
import SearchBar from '../../Components/componentproduitselection/SearchBar';
import ProductGrid from '../../Components/componentproduitselection/ProductGrid';
import { useProductSelection } from '../../Components/componentproduitselection/stores/useProductStore';
import { getUrlServer } from '../../configServer';
import images from '@/assets/no_data.png';
import { useTranslation } from 'react-i18next';
import { Input, message } from 'antd';
import { BarcodeOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_URL = getUrlServer();

export interface Conditioning {
  _id: {
    $oid: string;
  };
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
  quantite_livreur: number;
  unite: string;
  image?: string;
  conditionnements?: Conditioning[];
}

interface Category {
  _id: string;
  nom: string;
  produits: Product[];
}

const fetchCategories = async (): Promise<Category[]> => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}/livreurs/stock_par_categorie`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    throw new Error('Erreur lors de la récupération des catégories');
  }

  return response.json();
};

const ProductSelection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [_isScanning, setIsScanning] = useState(false);

  const { addSelectedProductsFromIds, setUpdateStockFn, selectedProducts: storedSelectedProducts } = useProductSelection();

  useEffect(() => {
    const storedIds = storedSelectedProducts.map(p => p.id);
    setSelectedProducts(storedIds);
  }, [storedSelectedProducts]);

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError
  } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const response = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBarcodeMode(response.data.barcode_mode || false);
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };
    fetchUserInfo();
  }, []);

  const updateProductStock = async (productId: string, newQuantity: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token');

    try {
      const response = await fetch(`${API_URL}/produits/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantite_livreur: newQuantity })
      });

      if (!response.ok) throw new Error('Failed to update stock');

      queryClient.setQueryData(['categories'], (oldData: Category[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(category => ({
          ...category,
          produits: category.produits.map(produit =>
            produit._id === productId
              ? { ...produit, quantite_livreur: newQuantity }
              : produit
          )
        }));
      });
    } catch (error) {
      console.error("Error updating product stock:", error);
      throw error;
    }
  };

  useEffect(() => {
    setUpdateStockFn(updateProductStock);
  }, [setUpdateStockFn]);

  if (categoriesError?.message === 'No authentication token found' || categoriesError?.message === 'Session expirée, veuillez vous reconnecter') {
    localStorage.removeItem('access_token');
    navigate('/login');
  }

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories = categoriesData
    ? [
      {
        id: 'all',
        name: t('delivery.newDelivery.allProducts'),
        count: categoriesData.reduce(
          (sum, cat) =>
            sum + cat.produits.reduce((pSum, p) => pSum + p.quantite_livreur, 0),
          0
        )
      },
      ...categoriesData.map((category) => ({
        id: category._id,
        name: category.nom,
        count: category.produits.reduce((sum, produit) => sum + produit.quantite_livreur, 0)
      }))
    ]
    : [];

  const products = categoriesData
    ? selectedCategory
      ? categoriesData
        .find((cat) => cat._id === selectedCategory)
        ?.produits.map((p) => ({
          id: p._id,
          name: p.nom,
          size: p.unite,
          price: p.prix,
          quantite_livreur: p.quantite_livreur,
          selected: selectedProducts.includes(p._id),
          category: selectedCategory,
          image: p.image || null,
          conditionnements: p.conditionnements || [],
        })) || []
      : categoriesData.flatMap((cat) =>
        cat.produits.map((p) => ({
          id: p._id,
          name: p.nom,
          size: p.unite,
          price: p.prix,
          quantite_livreur: p.quantite_livreur,
          selected: selectedProducts.includes(p._id),
          category: cat._id,
          image: p.image || null,
          conditionnements: p.conditionnements || [],
        }))
      )
    : [];

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleContinueClick = () => {
    addSelectedProductsFromIds(selectedProducts);
    navigate('client-selection', { state: { selectedProducts } });
  };

  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;
    setIsScanning(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/produits/code-barre/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const product = response.data;
      if (product && product._id) {
        if (!selectedProducts.includes(product._id)) {
          setSelectedProducts(prev => [...prev, product._id]);
          message.success(`${product.nom} ajouté !`);
        } else {
          message.info(`${product.nom} est déjà sélectionné`);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        message.error("Produit non trouvé");
      } else {
        message.error("Erreur lors du scan");
      }
    } finally {
      setIsScanning(false);
      setBarcodeInput('');
    }
  };

  if (isCategoriesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0F172A]"></div>
      </div>
    );
  }

  if (categoriesError && categoriesError.message !== 'No authentication token found') {
    return (
      <div className="text-center py-8 text-red-500">
        {t('delivery.newDelivery.error')} {categoriesError.message === 'Erreur lors de la récupération des catégories' ? t('delivery.newDelivery.errorFetch') : categoriesError.message === 'Session expirée, veuillez vous reconnecter' ? t('delivery.newDelivery.sessionExpired') : categoriesError.message}
      </div>
    );
  }

  return (
    <>
      <PageTitle>{t('delivery.newDelivery.title')}</PageTitle>
      <div className="w-full p-4 sm:p-6 bg-white min-h-screen pb-15">
        <div className="text-[#0F172A] mb-4 sm:mb-2 font-bold">
          <nav className="text-xs sm:text-sm">
            <Link to="/dashboard/delivery" className="hover:opacity-80 transition-opacity">
              {t('delivery.newDelivery.breadcrumbDelivery')}
            </Link>{' '}
            &gt; <span className="text-gray-400 font-medium">{t('delivery.newDelivery.breadcrumbSelect')}</span>
          </nav>
        </div>
        <PageTitle>{t('delivery.newDelivery.subtitle')}</PageTitle>
        <div className="mx-4 sm:mx-0">
          <CategoryCarousel
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {barcodeMode && (
          <div className="mx-4 sm:mx-0 mt-4 mb-2">
            <Input
              size="large"
              placeholder={t('delivery.newDelivery.scanPlaceholder')}
              prefix={<BarcodeOutlined className="text-gray-400" />}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onPressEnter={() => handleBarcodeScan(barcodeInput)}
              autoFocus
              className="rounded-xl shadow-sm border-indigo-200 focus:border-indigo-500"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mt-6 mb-6 px-2 sm:px-0 mr-12">
          <div className="w-full sm:flex-1">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
          <div className="text-[#0F172A] text-sm text-center sm:text-left sm:flex-1 -translate-y-2 font-bold">
            {t('delivery.newDelivery.itemsSelected', { count: selectedProducts.length })}
          </div>
          <div className="w-full sm:w-auto">
            <button
              onClick={handleContinueClick}
              className="block w-full sm:w-auto bg-[#0F172A] hover:bg-[#1E293B] text-white text-center px-9 py-2 rounded-lg transition-all duration-200 -translate-y-2 font-bold shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedProducts.length === 0}
            >
              {t('delivery.newDelivery.continueBtn')}
            </button>
          </div>
        </div>
        <div className="w-full overflow-x-hidden">
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
            <div className="flex flex-col justify-center items-center py-16">
              <img
                src={images}
                alt="No Data"
                className="h-32 w-32 object-contain mb-3 opacity-80"
              />
              <span className="text-gray-400 text-sm">
                {t('delivery.newDelivery.noProductSelected')}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductSelection;



