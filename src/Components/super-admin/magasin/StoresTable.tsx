// Tableau des magasins (écrans de 1024 px et plus ; en dessous : cartes).
import React from 'react';
import { Avatar, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { Store } from './types';
import { findCountryOption } from './locationData';
import type { StoreActions } from './useStoreActions';
import { StoreActionsButton, StoreStatus } from './storeUi';
import { compterUtilisateurs } from './storeUtils';

interface StoresTableProps {
  stores: Store[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  actions: StoreActions;
}

/** Quota de la licence : « utilisés / autorisés ». */
const Quota: React.FC<{ libelle: string; utilise: number; max?: number }> = ({ libelle, utilise, max }) => (
  <div className="flex items-center justify-between gap-2 text-xs">
    <span className="text-slate-500">{libelle}</span>
    <span className={`tabular-nums ${max !== undefined && utilise >= max ? 'font-semibold text-purple-950' : 'text-slate-700'}`}>
      {utilise}/{max ?? '∞'}
    </span>
  </div>
);

/** Date de création en millisecondes (0 si absente). */
const dateCreation = (store: Store) => {
  const brut = store.created_at;
  const valeur = typeof brut === 'object' && brut !== null && '$date' in brut ? brut.$date : brut;
  const t = valeur ? new Date(valeur as string | Date).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};

const StoresTable: React.FC<StoresTableProps> = ({ stores, currentPage, setCurrentPage, itemsPerPage, actions }) => {
  const columns: ColumnsType<Store> = [
    {
      title: 'Magasin',
      key: 'magasin',
      width: 260,
      render: (_, store) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar shape="square" size={40} src={store.logo || undefined} className="shrink-0 !rounded-lg !bg-purple-100 !font-semibold !text-purple-950">
            {store.denomination?.charAt(0).toUpperCase()}
          </Avatar>
          <div className="min-w-0">
            <Link
              to={`/superadmin/dashboard/magasin/view/${store._id}`}
              className="block truncate font-semibold !text-slate-900 hover:!text-purple-800"
              title={store.denomination}
            >
              {store.denomination}
            </Link>
            <p className="truncate text-xs text-slate-500" title={store.email}>{store.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Localisation',
      key: 'lieu',
      width: 200,
      render: (_, store) => {
        const pays = findCountryOption(store.country_code);
        return (
          <div className="min-w-0 text-sm">
            <p className="truncate text-slate-800">{store.ville || '—'}{store.quartier ? ` · ${store.quartier}` : ''}</p>
            <p className="truncate text-xs text-slate-500">{pays?.flag} {store.pays || '—'}</p>
          </div>
        );
      },
    },
    {
      title: 'Activité',
      dataIndex: 'activité',
      key: 'activite',
      ellipsis: true,
      responsive: ['xxl'],
      render: (activite: string) => <span className="text-sm capitalize text-slate-700">{activite || '—'}</span>,
    },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      key: 'telephone',
      width: 150,
      render: (telephone?: string) => <span className="whitespace-nowrap text-sm text-slate-700">{telephone || '—'}</span>,
    },
    {
      title: 'Créé le',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      sorter: (a, b) => dateCreation(a) - dateCreation(b),
      render: (_, store) => {
        const t = dateCreation(store);
        return <span className="whitespace-nowrap text-sm text-slate-700">{t ? new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>;
      },
    },
    {
      title: 'Licence',
      key: 'licence',
      width: 150,
      render: (_, store) => {
        const n = compterUtilisateurs(store);
        return (
          <div className="w-[120px] space-y-0.5">
            <Quota libelle="Managers" utilise={n.managers} max={store.licence?.max_managers} />
            <Quota libelle="Gérants" utilise={n.gerants} max={store.licence?.max_livreurs} />
          </div>
        );
      },
    },
    {
      title: 'Statut',
      key: 'statut',
      width: 120,
      render: (_, store) => <StoreStatus store={store} />,
    },
    {
      title: '',
      key: 'actions',
      width: 64,
      align: 'right',
      render: (_, store) => <StoreActionsButton store={store} actions={actions} />,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={stores}
      rowKey="_id"
      tableLayout="fixed"
      // Défilement horizontal visible si l'écran est juste un peu trop étroit.
      scroll={{ x: 1000 }}
      size="middle"
      locale={{ emptyText: 'Aucun magasin ne correspond aux filtres' }}
      pagination={{
        current: currentPage,
        pageSize: itemsPerPage,
        total: stores.length,
        onChange: setCurrentPage,
        showSizeChanger: false,
        hideOnSinglePage: true,
        className: '!px-4 !py-3',
      }}
    />
  );
};

export default StoresTable;
