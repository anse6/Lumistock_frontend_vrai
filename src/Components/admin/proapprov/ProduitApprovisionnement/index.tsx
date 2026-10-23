import React, { useState } from 'react';
import { TabType, Produit, Approvisionnement } from '../types';
import TabsNavigation from './TabsNavigation';
import ActionBar from './ActionBar';
import ProduitTable from './ProduitTable';
import ApprovisionnementTable from './ApprovisionnementTable';
import Pagination from './Pagination';

interface ProduitApprovisionnementProps {
  produits: Produit[];
  approvisionnements: Approvisionnement[];
}

const ProduitApprovisionnement: React.FC<ProduitApprovisionnementProps> = ({ 
  produits, 
  approvisionnements 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('produits');  

  return (
    <div className="min-h-screen bg-gray-50 rounded-[10px]">
      <div className="max-w-[1440px] mx-auto min-h-[1024px] bg-white rounded-[10px]">
        <TabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="p-6">
          <ActionBar activeTab={activeTab} />
          
          <div className="overflow-x-auto">
            {activeTab === 'produits' ? (
              <ProduitTable produits={produits} />
            ) : (
              <ApprovisionnementTable approvisionnements={approvisionnements} />
            )}
          </div>
          
          <Pagination />
        </div>
      </div>
    </div>
  );
};

export default ProduitApprovisionnement;


