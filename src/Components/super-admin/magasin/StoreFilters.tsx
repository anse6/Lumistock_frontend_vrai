import React from 'react';
import { AppstoreOutlined, FilterOutlined, InboxOutlined, ReloadOutlined, TableOutlined } from '@ant-design/icons';
import { Button, Popover, Segmented, Select, Tooltip, Typography } from 'antd';

type ViewMode = 'table' | 'cards';

interface StoreFiltersProps {
  countryOptions: Array<{ value: string; label: string }>;
  countryFilter?: string;
  statusFilter?: 'active' | 'inactive';
  setCountryFilter: (value?: string) => void;
  setStatusFilter: (value?: 'active' | 'inactive') => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  /** Masqué sur petit écran, où seules les cartes sont lisibles. */
  showViewToggle?: boolean;
}

const StoreFilters: React.FC<StoreFiltersProps> = ({
  countryOptions, countryFilter, statusFilter,
  setCountryFilter, setStatusFilter,
  onReset, hasActiveFilters, resultCount, viewMode, setViewMode, showArchived, onToggleArchived, showViewToggle = true,
}) => {
  const activeFilterCount = Number(Boolean(countryFilter)) + Number(Boolean(statusFilter));
  const statusOptions = [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
  ];

  const filterPopup = (
    <div className="grid w-[min(360px,calc(100vw-2rem))] grid-cols-1 gap-3">
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder="Tous les pays"
        value={countryFilter}
        onChange={setCountryFilter}
        options={countryOptions}
        className="h-10 w-full"
      />
      <Select
        allowClear
        placeholder="Tous les statuts"
        value={statusFilter}
        onChange={setStatusFilter}
        options={statusOptions}
        className="h-10 w-full"
      />
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Typography.Text strong className="!text-black">{resultCount} magasin{resultCount !== 1 ? 's' : ''}</Typography.Text>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip title={showArchived ? 'Afficher les magasins non archivés' : 'Afficher uniquement les magasins archivés'}>
            <Button
              icon={<InboxOutlined />}
              onClick={onToggleArchived}
              aria-label={showArchived ? 'Afficher les magasins non archivés' : 'Afficher les magasins archivés'}
              className={`h-10 border-purple-200 text-purple-900 hover:!border-purple-900 hover:!text-purple-900 ${showArchived ? '!border-purple-900 !bg-purple-900 !text-white hover:!bg-purple-800 hover:!text-white' : ''}`}
            >
              <span className="hidden sm:inline">{showArchived ? 'Magasins actifs' : 'Archivés'}</span>
            </Button>
          </Tooltip>
          <Popover content={filterPopup} title="Filtrer les magasins" trigger="click" placement="bottomRight">
            <Button
              icon={<FilterOutlined />}
              aria-label="Ouvrir les filtres"
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
            aria-label="Réinitialiser les filtres"
            className="h-10 !px-2 text-purple-900 hover:!bg-purple-50 hover:!text-purple-900"
          >
            <span className="hidden sm:inline">Réinitialiser</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreFilters;
