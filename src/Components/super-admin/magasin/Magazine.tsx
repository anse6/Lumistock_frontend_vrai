// Liste des magasins de la plateforme (super-admin).
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Alert, Grid, Input, Skeleton } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Plus } from 'lucide-react';
import StoresTable from './StoresTable';
import StoreCards from './StoreCards';
import StoreFilters from './StoreFilters';
import { Store } from './types';
import { getUrlServer } from '../../../configServer';
import { useStoreActions } from './useStoreActions';

const PAR_PAGE = 10;

const StoreManagement: React.FC = () => {
  const screens = Grid.useBreakpoint();
  // Sous 1200 px, le tableau (8 colonnes) n'a pas la place : cartes uniquement.
  const petitEcran = !screens.xl;

  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | undefined>();
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const actions = useStoreActions(setStores);

  useEffect(() => {
    const controller = new AbortController();
    axios
      .get(`${getUrlServer()}/magasin/all`, {
        params: { include_archived: true },
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        signal: controller.signal,
      })
      .then(({ data }) => setStores(Array.isArray(data.magasins) ? data.magasins : []))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError((axios.isAxiosError(err) && err.response?.data?.message) || 'Impossible de charger les magasins.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const countryOptions = useMemo(() => Array.from(
    new Map(
      stores
        .filter((store) => store.country_code || store.pays)
        .map((store) => [store.country_code || store.pays, {
          value: store.country_code || store.pays,
          label: store.pays || store.country_code || 'Pays non renseigné',
        }])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label, 'fr')), [stores]);

  const filteredStores = useMemo(() => stores.filter((store) => {
    const search = searchTerm.trim().toLocaleLowerCase('fr');
    const matchesSearch = !search || [store.denomination, store.email, store.ville, store.quartier, store.pays, store.telephone]
      .some((value) => value?.toLocaleLowerCase('fr').includes(search));
    const matchesCountry = !countryFilter || (store.country_code || store.pays) === countryFilter;
    const matchesArchiveView = showArchived ? store.is_archived : !store.is_archived;
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? store.is_active : !store.is_active);
    return matchesArchiveView && matchesSearch && matchesCountry && matchesStatus;
  }), [stores, searchTerm, countryFilter, statusFilter, showArchived]);

  const resume = useMemo(() => {
    const nonArchives = stores.filter((s) => !s.is_archived);
    const actifs = nonArchives.filter((s) => s.is_active).length;
    return [
      { libelle: 'Magasins', valeur: nonArchives.length },
      { libelle: 'Actifs', valeur: actifs },
      { libelle: 'Désactivés', valeur: nonArchives.length - actifs },
      { libelle: 'Archivés', valeur: stores.length - nonArchives.length },
    ];
  }, [stores]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, countryFilter, statusFilter, showArchived]);

  const resetFilters = () => {
    setSearchTerm('');
    setCountryFilter(undefined);
    setStatusFilter(undefined);
    setShowArchived(false);
  };

  const afficherTableau = viewMode === 'table' && !petitEcran;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-4">
      {/* En-tête de page */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-purple-950">Magasins</h1>
          <p className="mt-1 text-sm text-slate-500">Établissements de la plateforme, leurs accès et leur licence.</p>
        </div>
        <Link
          to="/superadmin/dashboard/magasin/add_magasin"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl !bg-purple-950 px-4 text-sm font-semibold !text-white shadow-sm transition-colors hover:!bg-purple-900"
        >
          <Plus size={18} /> Ouvrir un magasin
        </Link>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {resume.map((item) => (
          <div key={item.libelle} className="min-w-0 rounded-xl border border-purple-100/70 bg-white px-3 py-2.5 shadow-sm">
            <p className="truncate text-xs text-slate-500">{item.libelle}</p>
            <p className="text-xl font-bold text-purple-950">{isLoading ? '…' : item.valeur}</p>
          </div>
        ))}
      </div>

      <div className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="shrink-0 whitespace-nowrap text-base font-semibold text-slate-900">{showArchived ? 'Magasins archivés' : 'Liste des magasins'}</h2>
            <Input
              allowClear
              prefix={<SearchOutlined className="text-purple-700" />}
              placeholder="Rechercher (nom, ville, email…)"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 w-full min-w-0 md:w-80"
            />
          </div>
          <StoreFilters
            countryOptions={countryOptions}
            countryFilter={countryFilter}
            statusFilter={statusFilter}
            setCountryFilter={setCountryFilter}
            setStatusFilter={setStatusFilter}
            onReset={resetFilters}
            hasActiveFilters={Boolean(searchTerm || countryFilter || statusFilter || showArchived)}
            resultCount={filteredStores.length}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showViewToggle={!petitEcran}
            showArchived={showArchived}
            onToggleArchived={() => {
              setShowArchived((current) => !current);
              setStatusFilter(undefined);
            }}
          />
        </div>

        <div className="min-w-0 overflow-hidden rounded-b-2xl border-t border-purple-100">
          {error ? (
            <div className="p-4"><Alert type="error" showIcon message="Impossible de charger les magasins" description={error} /></div>
          ) : isLoading ? (
            <div className="p-4"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
          ) : afficherTableau ? (
            <StoresTable stores={filteredStores} currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={PAR_PAGE} actions={actions} />
          ) : (
            <StoreCards stores={filteredStores} currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={PAR_PAGE} actions={actions} />
          )}
        </div>
      </div>

      {actions.modale}
    </div>
  );
};

export default StoreManagement;
