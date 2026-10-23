import { Search, Download, Filter, Plus  } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <div className="p-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
      <div className="relative w-full sm:w-80">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 bg-gray-200 rounded-lg text-sm border border-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          placeholder="Rechercher"
        />
      </div>
      <div className="flex space-x-3">
        <button className="flex items-center px-4 py-2 bg-gray-200 rounded-lg text-sm text-gray-700 whitespace-nowrap cursor-pointer">
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
        <button className="flex items-center px-4 py-2 bg-gray-200 rounded-lg text-sm text-gray-700 whitespace-nowrap cursor-pointer">
          <Filter className="h-4 w-4 mr-2" />
          Filtre
        </button>
        <Link to="/admin/dashboard/users/addusers"
       className="flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-lg text-sm hover:bg-[#0F172A] whitespace-nowrap cursor-pointer">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un utilisater 
        </Link>
      </div>
    </div>
  );
};

export default Header;



