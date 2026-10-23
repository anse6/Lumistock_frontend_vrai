import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Upload } from 'lucide-react';
import { getUrlServer } from './../../../../configServer'; // Assurez-vous que le chemin est correct

interface FilterOptions {
  quartier?: string;
  ville?: string;
  commandeRange?: { min: number; max: number };
  montantRange?: { min: number; max: number };
}

interface SearchAndActionsBarProps {
  onSearch: (query: string) => void;
  onFilterToggle: () => void;
  showFilters: boolean;
  searchQuery: string;
  onFilterApply: (filters: FilterOptions) => void;
  onFilterReset: () => void;
  filters: FilterOptions;
  quartiers: string[];
  villes: string[];
  commandeRange: { min: number; max: number };
  montantRange: { min: number; max: number };
}

const SearchAndActionsBar: React.FC<SearchAndActionsBarProps> = ({
  onSearch,
  onFilterToggle,
  showFilters,
  searchQuery,
  onFilterApply,
  onFilterReset,
  filters,
  quartiers,
  villes,
  commandeRange,
  montantRange
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string | { min: number; max: number } | undefined
  ) => {
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

  const handleExportClients = async () => {
    try {
      setIsExporting(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Construire les paramètres de filtre pour l'export
      const exportFilters = {
        ...(localFilters.quartier && { quartier: localFilters.quartier }),
        ...(localFilters.ville && { ville: localFilters.ville }),
        ...(localFilters.commandeRange && { 
          minCommandes: localFilters.commandeRange.min,
          maxCommandes: localFilters.commandeRange.max
        }),
        ...(localFilters.montantRange && { 
          minMontant: localFilters.montantRange.min,
          maxMontant: localFilters.montantRange.max
        }),
        ...(localSearchQuery && { search: localSearchQuery })
      };

      const queryParams = new URLSearchParams(exportFilters as Record<string, string>).toString();
      const url = `${getUrlServer()}/clients/manager/export?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'exportation des clients');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'clients_export.xlsx';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      link.remove();

    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      alert('Une erreur est survenue lors de l\'exportation des clients');
    } finally {
      setIsExporting(false);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && 
    !(typeof value === 'object' && Object.keys(value).length === 0)
  ).length;

  return (
    <div className="p-4">
      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full -ml-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={localSearchQuery}
            onChange={handleSearchChange}
            className="
              w-full sm:w-64 pl-10 pr-4 py-2 border border-white bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-transparent
            "
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
          <button     
                                disabled={isExporting}
                                onClick={ handleExportClients}
                                className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2 text-gray-600 bg-gray-200 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors text-sm"
                              >
                                <Upload className="w-4 h-4" />
                                <span className="hidden sm:inline">Export</span>
                              </button>
          
          <button 
            onClick={onFilterToggle}
            className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm relative ${
              showFilters ? 'bg-blue-100 text-[#0F172A]' : 'bg-gray-100'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className='cursor-pointer'>Filtre</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center cursor-pointer">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
            <button
              onClick={onFilterToggle}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Filtre par quartier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quartier
              </label>
              <select
                value={localFilters.quartier || ''}
                onChange={(e) => handleFilterChange('quartier', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
              >
                <option value="">Tous les quartiers</option>
                {quartiers.map(quartier => (
                  <option key={quartier} value={quartier}>
                    {quartier}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par ville */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <select
                value={localFilters.ville || ''}
                onChange={(e) => handleFilterChange('ville', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
              >
                <option value="">Toutes les villes</option>
                {villes.map(ville => (
                  <option key={ville} value={ville}>
                    {ville}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par nombre de commandes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de commandes
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.commandeRange?.min || ''}
                  onChange={(e) => {
                    const min = e.target.value ? Number(e.target.value) : undefined;
                    handleFilterChange('commandeRange', {
                      min: min || commandeRange.min,
                      max: localFilters.commandeRange?.max || commandeRange.max
                    });
                  }}
                  className="w-full px-2 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 text-xs"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.commandeRange?.max || ''}
                  onChange={(e) => {
                    const max = e.target.value ? Number(e.target.value) : undefined;
                    handleFilterChange('commandeRange', {
                      min: localFilters.commandeRange?.min || commandeRange.min,
                      max: max || commandeRange.max
                    });
                  }}
                  className="w-full px-2 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 text-xs"
                />
              </div>
            </div>

            {/* Filtre par montant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (CFA)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.montantRange?.min || ''}
                  onChange={(e) => {
                    const min = e.target.value ? Number(e.target.value) : undefined;
                    handleFilterChange('montantRange', {
                      min: min || montantRange.min,
                      max: localFilters.montantRange?.max || montantRange.max
                    });
                  }}
                  className="w-full px-2 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 text-xs"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.montantRange?.max || ''}
                  onChange={(e) => {
                    const max = e.target.value ? Number(e.target.value) : undefined;
                    handleFilterChange('montantRange', {
                      min: localFilters.montantRange?.min || montantRange.min,
                      max: max || montantRange.max
                    });
                  }}
                  className="w-full px-2 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 cursor-pointer"
            >
              Réinitialiser
            </button>
            <button 
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-[#0F172A] text-white rounded-md hover:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 cursor-pointer"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndActionsBar;


