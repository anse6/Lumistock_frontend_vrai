import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="px-0 sm:px-0 w-full sm:w-140 mb-6">
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="text-gray-400 size-4 md:size-5" />
        </div>

        <input
            type="text"
            placeholder="Rechercher"
            className="w-full h-10 pl-8 pr-4 border border-white bg-gray-100 rounded-l-lg
                      md:h-15 md:pl-10 md:text-base text-sm
                      focus:outline-none focus:border-white hover:border-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />


        <button className="h-10 px-4 text-white bg-[#0F172A] rounded-r-lg md:h-15 md:px-6
                          flex-shrink-0 hover:bg-[#0F172A] transition-colors">
          <Search className="size-4 md:size-5" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;


