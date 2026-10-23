import React from 'react';
import { TabType } from  '../types';
interface TabsNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const TabsNavigation: React.FC<TabsNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-gray-200">
      <div className="flex">
        <button
          className={`py-3 px-8 font-medium text-sm ${activeTab === 'produits' ? 'bg-slate-100 text-[#0F172A]' : 'text-gray-600'}`}
          onClick={() => setActiveTab('produits')}
        >
          Mes produits
        </button>
        <button
          className={`py-3 px-8 font-medium text-sm ${activeTab === 'approvisionnement' ? 'bg-slate-100 text-[#0F172A]' : 'text-gray-600'}`}
          onClick={() => setActiveTab('approvisionnement')}
        >
          Approvisionnement
        </button>
      </div>
    </div>
  );
};

export default TabsNavigation;


