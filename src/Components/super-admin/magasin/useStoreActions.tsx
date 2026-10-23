// Actions sur un magasin (activer/désactiver, archiver, supprimer définitivement)
// avec leurs fenêtres de confirmation. Partagé par le tableau et les cartes.
import React, { useState } from 'react';
import { App as AntdApp, Modal } from 'antd';
import axios from 'axios';
import { getUrlServer } from '../../../configServer';
import { Store } from './types';

type Action = 'toggle' | 'archive' | 'delete';

const entetes = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

const messageErreur = (err: unknown, defaut: string) =>
  (axios.isAxiosError(err) && (err.response?.data?.message || err.response?.data?.error)) || defaut;

export const useStoreActions = (setStores: React.Dispatch<React.SetStateAction<Store[]>>) => {
  const { message } = AntdApp.useApp();
  const [cible, setCible] = useState<{ store: Store; action: Action } | null>(null);
  const [enCours, setEnCours] = useState(false);

  const fermer = () => !enCours && setCible(null);

  const confirmer = async () => {
    if (!cible) return;
    const { store, action } = cible;
    setEnCours(true);
    try {
      if (action === 'toggle') {
        const { data } = await axios.put(`${getUrlServer()}/magasin/${store._id}/toggle-status`, {}, entetes());
        setStores((prev) => prev.map((s) => (s._id === store._id ? { ...s, is_active: !s.is_active } : s)));
        message.success(data?.message || (store.is_active ? 'Magasin désactivé.' : 'Magasin activé.'));
      } else if (action === 'archive') {
        const { data } = await axios.delete(`${getUrlServer()}/magasin/delete/${store._id}`, entetes());
        setStores((prev) => prev.map((s) => (s._id === store._id ? { ...s, is_active: false, is_archived: true } : s)));
        message.success(data?.message || 'Magasin archivé.');
      } else {
        const { data } = await axios.delete(`${getUrlServer()}/magasin/delete/${store._id}/permanent`, entetes());
        setStores((prev) => prev.filter((s) => s._id !== store._id));
        message.success(data?.message || 'Magasin supprimé définitivement.');
      }
      setCible(null);
    } catch (err) {
      message.error(messageErreur(err, "L'opération a échoué. Réessayez."));
    } finally {
      setEnCours(false);
    }
  };

  const store = cible?.store;
  const textes: Record<Action, { titre: string; bouton: string; danger: boolean; corps: React.ReactNode }> = {
    toggle: {
      titre: store?.is_active ? 'Désactiver le magasin' : 'Activer le magasin',
      bouton: store?.is_active ? 'Désactiver' : 'Activer',
      danger: Boolean(store?.is_active),
      corps: store?.is_active ? (
        <>Les utilisateurs de <strong>{store?.denomination}</strong> ne pourront plus se connecter tant que le magasin est désactivé.</>
      ) : (
        <>Les utilisateurs de <strong>{store?.denomination}</strong> pourront de nouveau se connecter.</>
      ),
    },
    archive: {
      titre: 'Archiver le magasin',
      bouton: 'Archiver',
      danger: true,
      corps: <>Le magasin <strong>{store?.denomination}</strong> sera désactivé et rangé dans les archives, où il reste consultable.</>,
    },
    delete: {
      titre: 'Supprimer définitivement',
      bouton: 'Supprimer définitivement',
      danger: true,
      corps: <>Le magasin <strong>{store?.denomination}</strong> et ses données seront supprimés. Cette action est irréversible.</>,
    },
  };
  const texte = cible ? textes[cible.action] : null;

  const modale = (
    <Modal
      title={texte?.titre}
      open={Boolean(cible)}
      onOk={confirmer}
      onCancel={fermer}
      confirmLoading={enCours}
      okText={texte?.bouton}
      cancelText="Annuler"
      okButtonProps={texte?.danger ? { danger: true } : { className: '!bg-purple-950 hover:!bg-purple-900' }}
    >
      <p className="py-3 text-slate-600">{texte?.corps}</p>
    </Modal>
  );

  return {
    modale,
    basculer: (s: Store) => setCible({ store: s, action: 'toggle' }),
    archiver: (s: Store) => setCible({ store: s, action: 'archive' }),
    supprimer: (s: Store) => setCible({ store: s, action: 'delete' }),
  };
};

export type StoreActions = Omit<ReturnType<typeof useStoreActions>, 'modale'>;
