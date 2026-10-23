// SearchAndActionsBar.tsx
import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, FileDown } from 'lucide-react';
import { Product } from './types';
import { getUrlServer } from '../../configServer';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';

interface FilterOptions {
  category?: string;
  priceRange?: { min: number; max: number };
  inStock?: boolean;
}

interface SearchAndActionsBarProps {
  onSearch: (term: string) => void;
  onFilterToggle: () => void;
  showFilters: boolean;
  searchTerm: string;
  onFilterApply: (filters: FilterOptions) => void;
  onFilterReset: () => void;
  filters: FilterOptions;
  products: Product[];
}

const SearchAndActionsBar: React.FC<SearchAndActionsBarProps> = ({
  onSearch,
  onFilterToggle,
  showFilters,
  searchTerm,
  onFilterApply,
  onFilterReset,
  filters,
  products
}) => {
  const { t } = useTranslation();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [isExporting, setIsExporting] = useState(false);

  // Obtenir les catégories uniques des produits
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    onFilterApply(localFilters);
  };

  const handleResetFilters = () => {
    setLocalFilters({});
    onFilterReset();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error(t('admin.customers.add.validation.tokenMissing'));
      }

      const response = await fetch(`${getUrlServer()}/produits/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t('inventory.filters.exportError'));
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'produits_export.xlsx';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error: any) {
      console.error('Erreur lors de l\'exportation:', error);
      message.error(error.message || t('inventory.filters.exportErrorGeneric'));
    } finally {
      setIsExporting(false);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(value =>
    value !== undefined && value !== '' &&
    !(typeof value === 'object' && Object.keys(value).length === 0)
  ).length;

  return (
    <div className="p-4 bg-white">
      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Barre de recherche Premium */}
        <div className="relative group flex-1 max-w-md w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-2.5 bg-gray-100/50 border-transparent rounded-xl text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
            placeholder={t('inventory.filters.search')}
            value={localSearchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Bouton Export Premium */}
          <button
            disabled={isExporting}
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50"
          >
            <FileDown className={`h-4 w-4 ${isExporting ? 'animate-bounce' : 'text-blue-600'}`} />
            <span>{isExporting ? t('common.loading') : t('inventory.filters.export')}</span>
          </button>

          {/* Bouton Filtre Premium */}
          <button
            onClick={onFilterToggle}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-sm border ${
              showFilters || activeFiltersCount > 0
                ? 'bg-[#0F172A] border-[#0F172A] text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className={`h-4 w-4 ${showFilters || activeFiltersCount > 0 ? 'text-white' : 'text-gray-500'}`} />
            <span>{t('inventory.filters.filter')}</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{t('inventory.filters.title')}</h3>
            <button
              onClick={onFilterToggle}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Filtre par catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.filters.category')}
              </label>
              <select
                value={localFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
              >
                <option value="">{t('inventory.filters.allCategories')}</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.filters.availability')}
              </label>
              <select
                value={localFilters.inStock === undefined ? 'all' : localFilters.inStock ? 'true' : 'false'}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange('inStock',
                    value === 'all' ? undefined : value === 'true'
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
              >
                <option value="all">{t('inventory.filters.allProducts')}</option>
                <option value="true">{t('inventory.filters.inStock')}</option>
                <option value="false">{t('inventory.filters.outOfStock')}</option>
              </select>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A]"
            >
              {t('inventory.filters.reset')}
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 font-bold shadow-md transition-all active:scale-95"
            >
              {t('inventory.filters.apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndActionsBar;


