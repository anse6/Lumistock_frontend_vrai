import React, { useEffect, useState } from 'react';
import { Popconfirm, Tag, message as antMessage } from 'antd';
import { CheckCircleOutlined, PauseCircleOutlined, LoadingOutlined, SyncOutlined } from '@ant-design/icons';
import { useActivateUserMutation, useDeactivateUserMutation } from '../../../../services/api/usersApi';

const USER_STATUS_CONFIG = {
  active: {
    bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Actif', icon: <SyncOutlined spin />,
  },
  inactive: {
    bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Inactif', icon: <PauseCircleOutlined />,
  },
  updating: {
    bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Mise à jour…', icon: <LoadingOutlined spin />,
  },
};

interface StatusToggleProps {
  userId: string;
  initialStatus?: boolean;
  onStatusChange?: (isActive: boolean) => void;
}

const StatusToggle: React.FC<StatusToggleProps> = ({ userId, initialStatus = true, onStatusChange }) => {
  const [localActive, setLocalActive] = useState(initialStatus);
  const [activate, { isLoading: activating }] = useActivateUserMutation();
  const [deactivate, { isLoading: deactivating }] = useDeactivateUserMutation();
  const loading = activating || deactivating;

  useEffect(() => setLocalActive(initialStatus), [initialStatus]);

  const handleConfirm = async () => {
    try {
      const nextStatus = !localActive;
      const response = localActive
        ? await deactivate(userId).unwrap()
        : await activate(userId).unwrap();
      setLocalActive(nextStatus);
      onStatusChange?.(nextStatus);
      antMessage.success(response.message || (nextStatus ? 'Compte activé avec succès.' : 'Compte désactivé avec succès.'));
    } catch (error) {
      antMessage.error(error instanceof Error ? error.message : 'Erreur lors du changement de statut.');
    }
  };

  const config = loading
    ? USER_STATUS_CONFIG.updating
    : localActive ? USER_STATUS_CONFIG.active : USER_STATUS_CONFIG.inactive;
  const nextLabel = localActive ? USER_STATUS_CONFIG.inactive.label : USER_STATUS_CONFIG.active.label;

  const tag = (
    <Tag
      icon={config.icon}
      style={{
        cursor: loading ? 'wait' : 'pointer',
        borderRadius: 999,
        padding: '2px 10px',
        fontWeight: 600,
        userSelect: 'none',
        margin: 0,
        fontSize: 11,
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </Tag>
  );

  if (loading) return tag;

  return (
    <Popconfirm
      title={<span className="font-semibold text-[13px]">Modifier le statut de l’utilisateur ?</span>}
      description={<span className="text-[12px] text-slate-500">Définir le compte comme <strong>{nextLabel}</strong> ?</span>}
      onConfirm={handleConfirm}
      okText={`→ ${nextLabel}`}
      cancelText="Annuler"
      okButtonProps={{ danger: localActive, style: !localActive ? { background: '#6b21a8', borderColor: '#6b21a8' } : {} }}
      placement="top"
      icon={localActive ? <PauseCircleOutlined style={{ color: '#DC2626' }} /> : <CheckCircleOutlined style={{ color: '#059669' }} />}
    >
      {tag}
    </Popconfirm>
  );
};

export default StatusToggle;
