import React, { useState, useEffect } from 'react';
import { ETATS_VENTE } from '../../../services/ventes';
import { Search, Filter, X, Trash2, ChevronRight, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SearchAndActionsBarProps {
  onSearch: (term: string) => void;
  onFilterChange: (filterName: string, value: string) => void;
  onResetFilters: () => void;
  onOpenCorbeille?: () => void;
  filters: {
    status: string;
    paymentStatus: string;// Nouveau filtre ajouté
    minAmount: string;
    maxAmount: string;
  };
}

const SearchAndActionsBar: React.FC<SearchAndActionsBarProps> = ({
  onSearch,
  onFilterChange,
  onResetFilters,
  onOpenCorbeille,
  filters
}) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="p-4 flex flex-col gap-4 bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Barre de recherche Premium */}
        <div className="relative group flex-1 max-w-md w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-2.5 bg-gray-100/50 border-transparent rounded-xl text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
            placeholder={t('delivery.searchAndFilters.placeholder')}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Bouton Corbeille Premium */}


          {/* Bouton Filtre Premium */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-sm border ${showFilters || Object.values(filters).some(v => v !== '')
              ? 'bg-[#0F172A] border-[#0F172A] text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Filter className={`h-4 w-4 ${showFilters || Object.values(filters).some(v => v !== '') ? 'text-white' : 'text-gray-500'}`} />
            <span className="hidden sm:inline">{t('delivery.searchAndFilters.filterBtn')}</span>
            {Object.values(filters).some(v => v !== '') && (
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse ml-1" />
            )}
          </button>

          <button
            onClick={onOpenCorbeille}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl font-semibold text-sm shadow-sm hover:bg-rose-100 hover:border-rose-200 transition-all active:scale-95"
            title={t('delivery.searchAndFilters.trashTitle')}
          >
            <Trash2 className="h-4 w-4" />
            {/* <span className="hidden sm:inline">{t('delivery.searchAndFilters.trashBtn')}</span> */}
          </button>

          {/* Bouton Nouvelle Livraison Premium */}
          <Link to="/dashboard/delivery/new-delivery" className="flex-1 sm:flex-none">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white rounded-xl font-bold text-sm shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 ml-2">
              <Truck className="h-5 w-5" />
              <span>{t('delivery.searchAndFilters.startDelivery')}</span>
              <ChevronRight className="w-4 h-4 opacity-50 hidden sm:block" />
            </button>
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700">{t('delivery.searchAndFilters.advancedFilters')}</h3>
            <button
              onClick={() => {
                onResetFilters();
                setShowFilters(false);
              }}
              className="px-4 py-2 text-[#0F172A] hover:bg-gray-100 rounded-md transition-colors font-bold"
            >
              <X className="h-4 w-4 mr-1" />
              {t('delivery.searchAndFilters.reset')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.searchAndFilters.statusLabel')}</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  onFilterChange('status', e.target.value);
                  if (isMobile) setShowFilters(false);
                }}
                className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#0F172A]/20 focus:border-[#0F172A] sm:text-sm rounded-md"
              >
                <option value="">{t('delivery.searchAndFilters.allStatuses')}</option>
                {Object.entries(ETATS_VENTE).map(([valeur, { libelle }]) => (
                  <option key={valeur} value={valeur}>{libelle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.searchAndFilters.paymentLabel')}</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => {
                  onFilterChange('paymentStatus', e.target.value);
                  if (isMobile) setShowFilters(false);
                }}
                className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#0F172A]/20 focus:border-[#0F172A] sm:text-sm rounded-md"
              >
                <option value="">{t('delivery.searchAndFilters.allStatuses')}</option>
                <option value="payé">{t('delivery.searchAndFilters.paymentPaid')}</option>
                <option value="non payé">{t('delivery.searchAndFilters.paymentUnpaid')}</option>
                <option value="partiel">{t('delivery.searchAndFilters.paymentPartial')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.searchAndFilters.minAmount')}</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => onFilterChange('minAmount', e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white focus:outline-none focus:ring-[#0F172A]/20 focus:border-[#0F172A] sm:text-sm rounded-md"
                placeholder={t('delivery.searchAndFilters.minPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery.searchAndFilters.maxAmount')}</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => onFilterChange('maxAmount', e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white focus:outline-none focus:ring-[#0F172A]/20 focus:border-[#0F172A] sm:text-sm rounded-md"
                placeholder={t('delivery.searchAndFilters.maxPlaceholder')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndActionsBar;


