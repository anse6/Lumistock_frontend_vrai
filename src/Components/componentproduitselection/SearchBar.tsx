import React from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full sm:max-w-xl mb-8">
      <div className="relative group flex items-center">
        {/* Icône de recherche Premium */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
          <Search className="text-slate-400 size-5 group-focus-within:text-blue-500 transition-colors" />
        </div>

        <input
          type="text"
          placeholder={t('delivery.productSelection.searchPlaceholder', { defaultValue: 'Rechercher un produit...' })}
          className="w-full h-12 md:h-14 pl-12 pr-4 bg-gray-100/50 border-transparent rounded-2xl text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Bouton de recherche Premium (Optionnel visuellement mais fonctionnel) */}
        <button className="absolute right-2 h-9 md:h-10 px-4 bg-slate-900 text-white rounded-xl flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-md">
          <span className="hidden sm:inline text-sm font-bold">{t('common.search', { defaultValue: 'Chercher' })}</span>
          <Search className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;


