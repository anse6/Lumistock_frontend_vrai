import React from 'react';
import { Button, Popover, Select, Segmented, Typography } from 'antd';
import { AppstoreOutlined, FilterOutlined, ReloadOutlined, TableOutlined } from '@ant-design/icons';

type ViewMode = 'table' | 'cards';

interface UserFiltersProps {
  roleOptions: Array<{ value: string; label: string }>;
  storeOptions: Array<{ value: string; label: string }>;
  roleFilter?: string;
  storeFilter?: string;
  statusFilter?: 'active' | 'inactive';
  setRoleFilter: (value?: string) => void;
  setStoreFilter: (value?: string) => void;
  setStatusFilter: (value?: 'active' | 'inactive') => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  /** Masqué sur petit écran, où seules les cartes sont lisibles. */
  showViewToggle?: boolean;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  roleOptions,
  storeOptions,
  roleFilter,
  storeFilter,
  statusFilter,
  setRoleFilter,
  setStoreFilter,
  setStatusFilter,
  onReset,
  hasActiveFilters,
  resultCount,
  viewMode,
  setViewMode,
  showViewToggle = true,
}) => {
  const activeFilterCount = Number(Boolean(roleFilter)) + Number(Boolean(storeFilter)) + Number(Boolean(statusFilter));

  const filterPopup = (
    <div className="grid w-[min(360px,calc(100vw-2rem))] grid-cols-1 gap-3">
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder="Tous les rôles"
        value={roleFilter}
        onChange={setRoleFilter}
        options={roleOptions}
        className="h-10 w-full"
      />
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder="Tous les magasins"
        value={storeFilter}
        onChange={setStoreFilter}
        options={storeOptions}
        className="h-10 w-full"
      />
      <Select
        allowClear
        placeholder="Tous les statuts"
        value={statusFilter}
        onChange={setStatusFilter}
        options={[{ value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }]}
        className="h-10 w-full"
      />
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography.Text strong className="!text-black">
          {resultCount} utilisateur{resultCount !== 1 ? 's' : ''}
        </Typography.Text>

        <div className="flex flex-wrap items-center gap-2">
          <Popover content={filterPopup} title="Filtrer les utilisateurs" trigger="click" placement="bottomRight">
            <Button
              icon={<FilterOutlined />}
              aria-label="Ouvrir les filtres utilisateurs"
              className={`h-10 border-purple-200 text-purple-900 hover:!border-purple-900 hover:!text-purple-900 ${activeFilterCount ? '!border-purple-900 !bg-purple-50' : ''}`}
            >
              Filtres{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
          </Popover>
          {showViewToggle && <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            options={[
              { value: 'table', icon: <TableOutlined />, label: 'Tableau' },
              { value: 'cards', icon: <AppstoreOutlined />, label: 'Cartes' },
            ]}
          />}
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={onReset}
            disabled={!hasActiveFilters}
            aria-label="Réinitialiser les filtres utilisateurs"
            className="h-10 !px-2 text-purple-900 hover:!bg-purple-50 hover:!text-purple-900"
          >
            <span className="hidden sm:inline">Réinitialiser</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
