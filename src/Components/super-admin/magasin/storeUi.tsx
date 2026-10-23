// Éléments communs au tableau et aux cartes des magasins.
import React from 'react';
import { Button, Dropdown } from 'antd';
import { InboxOutlined, SyncOutlined } from '@ant-design/icons';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';
import type { StoreActions } from './useStoreActions';
import { Store } from './types';

/** Statut (magasin ou compte) : pastille + libellé (jamais la couleur seule). */
export const StoreStatus: React.FC<{ store: Pick<Store, 'is_active' | 'is_archived'> }> = ({ store }) => {
  const style = store.is_archived
    ? { libelle: 'Archivé', classes: 'border-purple-200 bg-purple-50 text-purple-900', icone: <InboxOutlined /> }
    : store.is_active
      ? { libelle: 'Actif', classes: 'border-green-200 bg-green-50 text-green-700', icone: <SyncOutlined spin /> }
      : { libelle: 'Désactivé', classes: 'border-red-200 bg-red-50 text-red-700', icone: <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.classes}`}>
      {style.icone}
      {style.libelle}
    </span>
  );
};

/** Bouton « ⋮ » qui ouvre le menu d'actions du magasin. */
export const StoreActionsButton: React.FC<{ store: Store; actions: StoreActions }> = ({ store, actions }) => (
  <Dropdown
    trigger={['click']}
    placement="bottomRight"
    dropdownRender={() => (
      <ActionMenu
        store={store}
        onClose={() => {}}
        onDelete={actions.archiver}
        onDeletePermanently={actions.supprimer}
        onToggleStatus={actions.basculer}
      />
    )}
  >
    <Button
      type="text"
      shape="circle"
      aria-label={`Actions pour ${store.denomination}`}
      icon={<MoreVertical className="h-4 w-4 text-purple-900" />}
      className="hover:!bg-purple-50"
    />
  </Dropdown>
);
