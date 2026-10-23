// src/Components/Search/Search.tsx
import { Search } from "lucide-react";

const SearchComponent = () => {
  return (
    <div className="flex min-w-0 max-w-3xl flex-1 items-center gap-2 rounded-lg border border-white bg-gray-100 px-3 py-2 sm:px-4">
      <Search className="h-5 w-5 shrink-0 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher..."
        // Prend la place disponible sans jamais dépasser l'écran.
        className="w-full min-w-0 border-none bg-transparent text-sm outline-none"
      />
    </div>
  );
};

export default SearchComponent;



