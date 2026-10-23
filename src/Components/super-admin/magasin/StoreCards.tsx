// Magasins en cartes : vue par défaut sur mobile et tablette.
import React from 'react';
import { EnvironmentOutlined, EyeOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Avatar, Button, Empty, Pagination } from 'antd';
import { useNavigate } from 'react-router-dom';
import { findCountryOption } from './locationData';
import { Store } from './types';
import type { StoreActions } from './useStoreActions';
import { StoreActionsButton, StoreStatus } from './storeUi';
import { compterUtilisateurs } from './storeUtils';

interface StoreCardsProps {
  stores: Store[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  actions: StoreActions;
}

const StoreCards: React.FC<StoreCardsProps> = ({ stores, currentPage, setCurrentPage, itemsPerPage, actions }) => {
  const navigate = useNavigate();
  const pageStores = stores.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!stores.length) return <Empty description="Aucun magasin ne correspond aux filtres" className="py-16" />;

  return (
    <div className="p-3 sm:p-4 md:p-5">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pageStores.map((store) => {
          const pays = findCountryOption(store.country_code);
          const n = compterUtilisateurs(store);
          return (
            <article key={store._id} className="flex min-w-0 flex-col rounded-xl border border-purple-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <Avatar shape="square" size={46} src={store.logo || undefined} className="shrink-0 !rounded-lg !bg-purple-100 !font-semibold !text-purple-950">
                  {store.denomination?.charAt(0).toUpperCase()}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900" title={store.denomination}>{store.denomination}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <StoreStatus store={store} />
                    {store.activité && <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">{store.activité}</span>}
                  </div>
                </div>
                <StoreActionsButton store={store} actions={actions} />
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex min-w-0 items-center gap-2">
                  <EnvironmentOutlined className="shrink-0 text-purple-800" />
                  <span className="truncate">{pays?.flag} {store.ville || 'Ville non renseignée'}{store.quartier ? ` · ${store.quartier}` : ''}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <MailOutlined className="shrink-0 text-purple-800" />
                  <span className="truncate">{store.email || 'Email non renseigné'}</span>
                </div>
                {store.telephone && (
                  <div className="flex items-center gap-2"><PhoneOutlined className="shrink-0 text-purple-800" /> {store.telephone}</div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                <div>
                  <p className="text-slate-500">Managers</p>
                  <p className="font-semibold text-slate-900">{n.managers} / {store.licence?.max_managers ?? '∞'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Gérants</p>
                  <p className="font-semibold text-slate-900">{n.gerants} / {store.licence?.max_livreurs ?? '∞'}</p>
                </div>
              </div>

              <Button
                icon={<EyeOutlined />}
                onClick={() => navigate(`/superadmin/dashboard/magasin/view/${store._id}`)}
                className="mt-4 h-10 border-purple-200 text-purple-900 hover:!border-purple-900 hover:!text-purple-950"
              >
                Voir le magasin
              </Button>
            </article>
          );
        })}
      </div>
      {stores.length > itemsPerPage && (
        <div className="mt-5 flex justify-center sm:justify-end">
          <Pagination simple current={currentPage} pageSize={itemsPerPage} total={stores.length} showSizeChanger={false} onChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
};

export default StoreCards;
