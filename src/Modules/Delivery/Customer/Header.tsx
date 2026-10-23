import { Search, Filter, X, UserPlus, ChevronRight, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

interface HeaderProps {
  onExport: () => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

const Header = ({
  onExport,
  searchTerm,
  onSearch,
  filters,
  onFilterChange,
  onClearFilters
}: HeaderProps) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowFilters(false);
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== '' && value !== null
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Première ligne - Recherche et boutons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        {/* Barre de recherche */}
        <div className="relative group flex-1 max-w-md w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-2.5 bg-gray-100/50 border-transparent rounded-xl text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
            placeholder={t('admin.customers.header.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Boutons */}
        <div className="w-full sm:w-auto flex items-center gap-3">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
          >
            <FileDown className="h-4 w-4 text-blue-600" />
            <span>{t('admin.customers.header.export', { defaultValue: 'Exporter' })}</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-sm border ${hasActiveFilters || showFilters
              ? 'bg-[#0F172A] border-[#0F172A] text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Filter className={`h-4 w-4 ${hasActiveFilters || showFilters ? 'text-white' : 'text-gray-500'}`} />
            <span>{t('admin.customers.header.filter')}</span>
            {hasActiveFilters && (
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>

          <Link 
            to="/dashboard/clients/add-clients"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white rounded-xl font-bold text-sm shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 ml-2"
          >
            <UserPlus className="h-5 w-5" />
            <span className="hidden sm:inline">{t('admin.customers.header.addClient')}</span>
            <ChevronRight className="w-4 h-4 opacity-50 hidden sm:block" />
          </Link>
        </div>
      </div>

      {/* Panel de filtres */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">{t('admin.customers.header.advancedFilters')}</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtres de localisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.header.city')}
                </label>
                <input
                  type="text"
                  value={filters.ville}
                  onChange={(e) => onFilterChange({ ville: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]"
                  placeholder={t('admin.customers.header.cityPlaceholder', { defaultValue: 'Ex: Yaoundé' })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.header.district')}
                </label>
                <input
                  type="text"
                  value={filters.quartier}
                  onChange={(e) => onFilterChange({ quartier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]"
                  placeholder={t('admin.customers.header.districtPlaceholder', { defaultValue: 'Ex: Bastos' })}
                />
              </div>

              {/* Filtres de montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.header.minAmount')}
                </label>
                <input
                  type="number"
                  value={filters.montant_min || ''}
                  onChange={(e) => onFilterChange({
                    montant_min: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.header.maxAmount')}
                </label>
                <input
                  type="number"
                  value={filters.montant_max || ''}
                  onChange={(e) => onFilterChange({
                    montant_max: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]"
                  placeholder="1000000"
                />
              </div>

              {/* Filtres de livraisons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.header.minDeliveries')}
                </label>
                <input
                  type="number"
                  value={filters.livraisons_min || ''}
                  onChange={(e) => onFilterChange({
                    livraisons_min: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.header.maxDeliveries')}
                </label>
                <input
                  type="number"
                  value={filters.livraisons_max || ''}
                  onChange={(e) => onFilterChange({
                    livraisons_max: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                  placeholder="100"
                />
              </div>

              {/* Filtres de dates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.header.startDate')}
                </label>
                <input
                  type="date"
                  value={filters.date_debut}
                  onChange={(e) => onFilterChange({ date_debut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.customers.header.endDate')}
                </label>
                <input
                  type="date"
                  value={filters.date_fin}
                  onChange={(e) => onFilterChange({ date_fin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {t('admin.customers.header.clearFilters')}
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-[#0F172A] text-white text-sm rounded-md hover:bg-[#0F172A]"
              >
                {t('admin.customers.header.apply')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Header;


