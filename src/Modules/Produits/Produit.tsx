import React, { useEffect, useState, useMemo } from 'react';
import PageTitle from '../../Components/PageTitle';
import SearchAndActionsBar from './SearchAndActionsBar';
import ProductsTable from './ProductsTable';
import { Package, Banknote } from 'lucide-react';
import { Product } from './types';
import { fetchProducts } from './productService';
import { Skeleton, Typography, Empty, Space } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface FilterOptions {
  category?: string;
  priceRange?: { min: number; max: number };
  inStock?: boolean;
}

const ProductsInventory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const stats = useMemo(() => {
    const totalQty = products.reduce((acc, p) => acc + (p.quantityRemaining || 0), 0);
    const totalVal = products.reduce((acc, p) => {
      const price = typeof p.price === 'string' ? parseFloat(p.price.replace(/[^\d.]/g, '')) : p.price;
      return acc + (price * (p.quantityRemaining || 0));
    }, 0);
    return { totalQty, totalVal };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    if (filters.category) {
      result = result.filter(p => p.category === filters.category);
    }

    if (filters.inStock !== undefined) {
      result = result.filter(p => filters.inStock ? p.quantityRemaining > 0 : p.quantityRemaining === 0);
    }

    return result;
  }, [products, searchTerm, filters]);

  return (
    <>
      <PageTitle>{t('inventory.pageTitle')}</PageTitle>

      <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-screen font-['Laura']">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-base text-blue-600 font-medium mb-1">{t('inventory.stats.totalQuantity')}</p>
              <h4 className="text-2xl font-bold text-blue-900">
                {stats.totalQty.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} {t('inventory.stats.articles')}
              </h4>
              <p className="text-xs text-blue-500 mt-1">{products.length} {t('inventory.stats.references')}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-base text-emerald-600 font-medium mb-1">{t('inventory.stats.totalValue')}</p>
              <h4 className="text-2xl font-bold text-emerald-900">
                {stats.totalVal.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} FCFA
              </h4>
              <p className="text-xs text-emerald-500 mt-1">{t('inventory.stats.valuationDesc')}</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <Banknote className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="mb-6">
          <SearchAndActionsBar
            onSearch={setSearchTerm}
            onFilterToggle={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            searchTerm={searchTerm}
            onFilterApply={setFilters}
            onFilterReset={() => { setFilters({}); setSearchTerm(''); }}
            filters={filters}
            products={products}
          />
        </div>

        {/* Data Content */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          {loading ? (
            <div className="p-8">
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          ) : filteredProducts.length > 0 ? (
            <ProductsTable products={filteredProducts} loading={loading} onRefresh={loadProducts} />
          ) : (
            <div className="py-20 text-center">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical">
                    <Text type="secondary" className="text-lg font-medium">{t('inventory.table.noData')}</Text>
                    <Text type="secondary">{t('inventory.table.adjustFilters')}</Text>
                  </Space>
                }
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductsInventory;
