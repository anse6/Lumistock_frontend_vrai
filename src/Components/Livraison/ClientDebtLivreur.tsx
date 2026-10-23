import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getUrlServer } from '../../../configServer';
import PageTitle from '../PageTitle';
import DebtLivreurTable from './DebtLivreurTable';

interface ClientDebt {
  client_id: string;
  nom: string;
  telephone: string;
  ville: string;
  quartier: string;
  nombre_livraisons: number;
  montant_total: number;
  montant_paye: number;
  dette: number;
}

interface ClientDebtLivreurProps {
  isTabMode?: boolean;
}

const ClientDebtLivreur: React.FC<ClientDebtLivreurProps> = ({ isTabMode = false }) => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<ClientDebt[]>([]);
  const [filteredData, setFilteredData] = useState<ClientDebt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedVille, setSelectedVille] = useState('');

  useEffect(() => {
    fetchClientDebts();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchText, selectedVille, data]);

  const fetchClientDebts = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new Error(t('admin.customers.add.validation.authRequired'));

      const response = await axios.get(
        `${getUrlServer()}/clients/debt/livreur/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      setData(response.data);
      setFilteredData(response.data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des dettes clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...data];

    if (searchText) {
      filtered = filtered.filter(item =>
        item.nom.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedVille) {
      filtered = filtered.filter(item => item.ville === selectedVille);
    }

    setFilteredData(filtered);
  };


  const villes = Array.from(new Set(data.map(item => item.ville))).filter(Boolean);

  const totalDette = filteredData.reduce((sum, item) => sum + item.dette, 0);
  const nombreClients = filteredData.length;
  const detteMoyenne = nombreClients > 0 ? totalDette / nombreClients : 0;

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <p className="text-lg text-gray-700">{t('login.loading')}</p>
      </div>
    );
  }

  return (
    <>
      {!isTabMode && <PageTitle>{t('admin.customers.debt.pageTitle')}</PageTitle>}

      <div className={`w-full h-min-screen bg-white font-['Laura'] ${!isTabMode ? 'p-2 sm:p-6' : ''}`}>
        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-2 sm:p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-[10px] sm:text-xs text-red-600 font-medium uppercase">{t('admin.customers.debt.stats.totalDebt')}</p>
            <p className="text-lg sm:text-2xl font-bold text-red-700 mt-1">
              {totalDette.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} <span className="text-xs sm:text-sm">FCFA</span>
            </p>
          </div>
          <div className="p-2 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-[10px] sm:text-xs text-blue-600 font-medium uppercase">{t('admin.customers.debt.stats.debtorsCount')}</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-700 mt-1">{nombreClients}</p>
          </div>
          <div className="p-2 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-[10px] sm:text-xs text-yellow-600 font-medium uppercase">{t('admin.customers.debt.stats.averageDebt')}</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-700 mt-1">
              {detteMoyenne.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 0 })} <span className="text-xs sm:text-sm">FCFA</span>
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-gray-50 p-2 sm:p-4 rounded-lg mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <input
              type="text"
              placeholder={t('admin.customers.debt.filters.searchPlaceholder')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
            />
            <select
              value={selectedVille}
              onChange={(e) => setSelectedVille(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
            >
              <option value="">{t('admin.customers.debt.filters.allCities')}</option>
              {villes.map(ville => (
                <option key={ville} value={ville}>{ville}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <DebtLivreurTable data={filteredData} refreshData={fetchClientDebts} />
      </div>
    </>
  );
};

export default ClientDebtLivreur;
