import { Search, Filter, X, Trash2, UserPlus, ChevronRight, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'antd';

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
  onOpenCorbeille: () => void;
}

const Header = ({ 
  onExport, 
  searchTerm, 
  onSearch, 
  filters, 
  onFilterChange, 
  onClearFilters,
  onOpenCorbeille
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Barre de recherche */}
        <div className="relative w-full sm:w-72 lg:w-60 2xl:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#3b0764] transition-colors" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-purple-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b0764]/20 focus:border-[#3b0764] transition-all duration-300 text-sm"
            placeholder={t('admin.customers.header.searchPlaceholder')}
          />
        </div>

        {/* Boutons d'action */}
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2.5">
          <Tooltip title="Exporter la liste des clients (Excel)">
            <button
              onClick={onExport}
              className="group flex items-center gap-2 px-4 py-2.5 text-[#3b0764] bg-white hover:bg-purple-50 rounded-xl transition-all duration-200 shadow-sm border border-purple-200 font-semibold text-sm"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter Excel</span>
            </button>
          </Tooltip>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm shadow-sm border ${
              showFilters || hasActiveFilters
              ? 'bg-[#3b0764] text-white border-[#3b0764]' 
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className={`h-4 w-4 ${showFilters || hasActiveFilters ? 'text-white' : 'text-gray-500'}`} />
            <span className="hidden sm:inline">{t('admin.customers.header.filter')}</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-white text-[#3b0764] rounded-full font-bold">
                {Object.values(filters).filter(v => v !== '' && v !== null).length}
              </span>
            )}
          </button>

          
          <Tooltip title="Voir les clients supprimés (restaurables)">
            <button
              onClick={onOpenCorbeille}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200 group font-medium text-sm"
            >
              <span className="hidden 2xl:inline">Clients supprimés</span>
              <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </Tooltip>
          
          <Link 
            to="/admin/dashboard/customers/addusers"
            // Couleur en style direct : le style global d'antd sur les liens <a>
            // écrase les classes bg-*.
            style={{ backgroundColor: '#3b0764', color: '#fff' }}
            className="flex items-center gap-2 px-5 py-2.5 !text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-950/20 hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
          >
            <UserPlus className="h-5 w-5" />
            <span className="hidden sm:inline">{t('admin.customers.header.addClient')}</span>
            <ChevronRight className="w-4 h-4 opacity-50 hidden sm:block" />
          </Link>
        </div>
      </div>

      {/* Panel de filtres */}
      {showFilters && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-purple-950">{t('admin.customers.header.advancedFilters')}</h3>
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
                <label className="block text-xs font-semibold text-purple-950 mb-1.5 uppercase tracking-wider">
                  {t('admin.customers.header.city')}
                </label>
                <input
                  type="text"
                  value={filters.ville}
                  onChange={(e) => onFilterChange({ ville: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b0764]/20"
                  placeholder="Ex: Yaoundé"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-950 mb-1.5 uppercase tracking-wider">
                  {t('admin.customers.header.district')}
                </label>
                <input
                  type="text"
                  value={filters.quartier}
                  onChange={(e) => onFilterChange({ quartier: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b0764]/20"
                  placeholder="Ex: Bastos"
                />
              </div>

              {/* Filtres de montant */}
              <div>
                <label className="block text-xs font-semibold text-purple-950 mb-1.5 uppercase tracking-wider">
                  {t('admin.customers.header.minAmount')}
                </label>
                <input
                  type="number"
                  value={filters.montant_min || ''}
                  onChange={(e) => onFilterChange({ 
                    montant_min: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b0764]/20"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-950 mb-1.5 uppercase tracking-wider">
                  {t('admin.customers.header.maxAmount')}
                </label>
                <input
                  type="number"
                  value={filters.montant_max || ''}
                  onChange={(e) => onFilterChange({ 
                    montant_max: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b0764]/20"
                  placeholder="1000000"
                />
              </div>

              {/* Filtres de livraisons */}
              <div>
                <label className="block text-xs font-semibold text-purple-950 mb-1.5 uppercase tracking-wider">
                  {t('admin.customers.header.minDeliveries')}
                </label>
                <input
                  type="number"
                  value={filters.livraisons_min || ''}
                  onChange={(e) => onFilterChange({ 
                    livraisons_min: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b0764]/20"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-950 mb-1.5 uppercase tracking-wider">
                  {t('admin.customers.header.maxDeliveries')}
                </label>
                <input
                  type="number"
                  value={filters.livraisons_max || ''}
                  onChange={(e) => onFilterChange({ 
                    livraisons_max: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b0764]/20"
                  placeholder="100"
                />
              </div>

              {/* Filtres de dates */}
              <div>
                <label className="block text-xs font-semibold text-purple-950 mb-1.5 uppercase tracking-wider">
                  {t('admin.customers.header.startDate')}
                </label>
                <input
                  type="date"
                  value={filters.date_debut}
                  onChange={(e) => onFilterChange({ date_debut: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b0764]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-950 mb-1.5 uppercase tracking-wider">
                  {t('admin.customers.header.endDate')}
                </label>
                <input
                  type="date"
                  value={filters.date_fin}
                  onChange={(e) => onFilterChange({ date_fin: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b0764]/20"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-purple-200">
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
                className="px-4 py-2 bg-[#3b0764] text-white text-sm rounded-md hover:bg-[#3b0764]"
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


