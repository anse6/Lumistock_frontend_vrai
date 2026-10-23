import React, { useEffect, useState } from 'react';
import PageTitle from '../../../../Components/PageTitle';
import SearchAndActionsBar from './SearchAndActionsBar';
import ClientsTable from './ClientsTable';
import { Client } from './types';
import { fetchClientsByLivreur } from './clientService';
import Pagination from './Pagination';

interface FilterOptions {
  quartier?: string;
  ville?: string;
  commandeRange?: { min: number; max: number };
  montantRange?: { min: number; max: number };
}

const ClientsPage: React.FC = () => {
  const [clientsData, setClientsData] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await fetchClientsByLivreur();
        setClientsData(data);
        setFilteredClients(data);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  // Effet pour appliquer la recherche et les filtres
  useEffect(() => {
    let result = [...clientsData];

    // Appliquer la recherche
    if (searchQuery) {
      result = result.filter(client =>
        client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Appliquer les filtres
    if (filters.quartier) {
      result = result.filter(client => 
        client.location?.toLowerCase().includes(filters.quartier!.toLowerCase())
      );
    }

    if (filters.ville) {
      result = result.filter(client => 
        client.location?.toLowerCase().includes(filters.ville!.toLowerCase())
      );
    }

    if (filters.commandeRange) {
      result = result.filter(client => 
        client.command >= filters.commandeRange!.min && 
        client.command <= filters.commandeRange!.max
      );
    }

    if (filters.montantRange) {
      result = result.filter(client => {
        // Extraire le montant numérique de la chaîne "X cfa"
        const montant = parseInt(client.amount.replace(/[^\d]/g, ''));
        return montant >= filters.montantRange!.min && 
               montant <= filters.montantRange!.max;
      });
    }

    setFilteredClients(result);
  }, [clientsData, searchQuery, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterApply = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleFilterReset = () => {
    setFilters({});
    setSearchQuery('');
    setShowFilters(false);
  };

  // Extraire les données uniques pour les filtres
  const getUniqueQuartiers = () => {
    const quartiers = clientsData.map(client => {
      const parts = client.location?.split(', ');
      return parts?.[0] || '';
    }).filter(Boolean);
    return Array.from(new Set(quartiers));
  };




  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

  const getUniqueVilles = () => {
    const villes = clientsData.map(client => {
      const parts = client.location?.split(', ');
      return parts?.[1] || '';
    }).filter(Boolean);
    return Array.from(new Set(villes));
  };

  const getCommandeRange = () => {
    const commandes = clientsData.map(c => c.command).filter(c => c !== undefined);
    return {
      min: commandes.length > 0 ? Math.min(...commandes) : 0,
      max: commandes.length > 0 ? Math.max(...commandes) : 100
    };
  };

  const getMontantRange = () => {
    const montants = clientsData.map(c => {
      return parseInt(c.amount.replace(/[^\d]/g, ''));
    }).filter(m => !isNaN(m));
    return {
      min: montants.length > 0 ? Math.min(...montants) : 0,
      max: montants.length > 0 ? Math.max(...montants) : 1000000
    };
  };
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <PageTitle>Clients</PageTitle>
      <div className="p-4 bg-white h-screen w-full pb-15 font-['Lora']">
        <div className="bg-white rounded-lg">
          <SearchAndActionsBar 
            onSearch={handleSearch}
            onFilterToggle={handleFilterToggle}
            showFilters={showFilters}
            searchQuery={searchQuery}
            onFilterApply={handleFilterApply}
            onFilterReset={handleFilterReset}
            filters={filters}
            quartiers={getUniqueQuartiers()}
            villes={getUniqueVilles()}
            commandeRange={getCommandeRange()}
            montantRange={getMontantRange()}
          />
          
          <ClientsTable 
          clients={paginatedClients} 
            loading={loading}
            showNoData={!loading && filteredClients.length === 0}
          />


        </div>
        <Pagination 
      totalItems={filteredClients.length}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      itemsPerPage={itemsPerPage}
    />

      </div>
    </>
  );
};

export default ClientsPage;


