import React from 'react';
import { Button, Divider } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, InboxOutlined, PoweroffOutlined } from '@ant-design/icons';
import { Store } from './types';
import { useNavigate } from 'react-router-dom';

interface ActionMenuProps {
  store: Store;
  onClose: () => void;
  onDelete: (store: Store) => void;
  onDeletePermanently: (store: Store) => void;
  onToggleStatus: (store: Store) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ store, onClose, onDelete, onDeletePermanently, onToggleStatus }) => {
  const navigate = useNavigate();

  return (
    <div className="w-64 rounded-xl border border-purple-100 bg-white p-2 shadow-xl">
      <div className="flex flex-col gap-1">
        <Button type="text" icon={<EyeOutlined />} className="!justify-start !text-slate-700 hover:!bg-purple-50 hover:!text-purple-900"
          onClick={() => {
            navigate(`/superadmin/dashboard/magasin/view/${store._id}`);
            onClose();
          }}
        >Voir les détails</Button>
        {!store.is_archived && (
          <Button type="text" icon={<EditOutlined />} className="!justify-start !text-slate-700 hover:!bg-purple-50 hover:!text-purple-900"
            onClick={() => {
              navigate(`/superadmin/dashboard/magasin/update/${store._id}`);
              onClose();
            }}
          >Modifier</Button>
        )}
        <Divider className="!my-1" />
        {store.is_archived ? (
          <Button type="text" danger icon={<DeleteOutlined />} className="!h-auto !w-full !justify-start !whitespace-normal !py-2 !text-left leading-5 hover:!bg-red-50"
            onClick={() => {
              onDeletePermanently(store);
              onClose();
            }}
          >Supprimer définitivement</Button>
        ) : (
          <>
            <Button type="text" icon={<PoweroffOutlined />} className="!justify-start !text-purple-900 hover:!bg-purple-50 hover:!text-purple-900"
              onClick={() => {
                onToggleStatus(store);
                onClose();
              }}
            >{store.is_active ? 'Désactiver' : 'Activer'}</Button>
            <Button type="text" danger icon={<InboxOutlined />} className="!justify-start hover:!bg-red-50"
              onClick={() => {
                onDelete(store);
                onClose();
              }}
            >Archiver</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionMenu;


