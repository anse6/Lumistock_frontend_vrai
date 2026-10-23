import React from 'react';
import { TabType } from '../types';
import { Search, Download, Filter, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActionBarProps {
  activeTab: TabType;
}

const ActionBar: React.FC<ActionBarProps> = ({ activeTab }) => {
  return (
    <div className="flex flex-wrap items-center justify-between mb-6">
      <div className="relative w-full md:w-auto mb-4 md:mb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher"
            className="pl-10 pr-4 py-2 bg-gray-200 rounded-md w-full md:w-80 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
        </div>
      </div>
      <div className="flex space-x-3">
        <button className="flex items-center px-4 py-2 bg-gray-200 rounded-md text-sm text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-300 transition-colors">
          <Download className="mr-2 h-4 w-4 text-gray-500" />
          Export
        </button>
        <button className="flex items-center px-4 py-2 bg-gray-200 rounded-md text-sm text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-300 transition-colors">
          <Filter className="mr-2 h-4 w-4 text-gray-500" />
          Filtre
        </button>
        {activeTab === 'produits' ? (
          <Link 
            to="/admin/dashboard/produits_approvisionnement/add_product"
            className="flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-md text-sm whitespace-nowrap cursor-pointer hover:bg-[#0F172A] transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Link>
        ) : (
           <Link 
            to="/admin/dashboard/produits_approvisionnement/productselect"
            className="flex items-center px-4 py-2 bg-[#0F172A] text-white rounded-md text-sm whitespace-nowrap cursor-pointer hover:bg-[#0F172A] transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
         approvisionner
          </Link>
        )} 
      </div>
    </div>
  );
};

export default ActionBar;


