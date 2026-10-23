// src/Components/Search/Search.tsx
import { Search } from "lucide-react";

const SearchComponent = () => {
  return (
    // Largeur flexible (au plus 800px) : une largeur fixe poussait les icônes
    // de droite hors de l'écran sur les écrans entre 1024 et ~1300px.
    <div className="flex w-full max-w-[800px] min-w-0 items-center space-x-2 border bg-gray-100 border-white rounded-lg px-4 py-2">
      <Search className="text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Rechercher..."
        className="
          border-none outline-none bg-transparent text-sm 
          w-full min-w-0
        "
      />
    </div>
  );
};

export default SearchComponent;



