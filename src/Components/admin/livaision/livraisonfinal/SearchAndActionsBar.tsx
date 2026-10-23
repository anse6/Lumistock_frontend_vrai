import { useDeliveryStore } from "../newdelivery/deliveryStore";
import { ETATS_VENTE } from '../../../../services/ventes';
import { useProductStore } from "../selectionproduct/Clients/api/useProductStore";
import React, { useState } from 'react';
import { Search, Filter, X, Trash2, Plus, FileDown, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfigProvider, DatePicker, Spin, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { cheminsVente, estCaissier } from '../venteRole';

const { RangePicker } = DatePicker;
const PURPLE_950 = '#3b0764';

export interface DeliveryFilters {
    status: string;
    paymentStatus: string;
    livreur: string;
    /** Rôle du vendeur (caissier, gerant, manager, admin). */
    roleVendeur: string;
    minAmount: string;
    maxAmount: string;
    retours: string;
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
}

/** Nombre de filtres actifs (recherche comprise). */
export const nombreFiltresActifs = (filters: DeliveryFilters, searchTerm = '') =>
    [
        searchTerm.trim(),
        filters.status,
        filters.paymentStatus,
        filters.livreur,
        filters.roleVendeur,
        filters.minAmount,
        filters.maxAmount,
        filters.retours,
        filters.dateRange?.[0] && filters.dateRange?.[1] ? 'periode' : '',
    ].filter(Boolean).length;

interface SearchAndActionsBarProps {
    searchTerm: string;
    onSearch: (term: string) => void;
    onFilterChange: (filterName: keyof DeliveryFilters, value: any) => void;
    onResetFilters: () => void;
    onStatsPeriodChange?: (period: any) => void;
    onOpenCorbeille?: () => void;
    onExportPdf?: () => void;
    exportingPdf?: boolean;
    /** Vendeurs présents dans la liste (filtre « Vendeur ») : identifiant et libellé. */
    vendeurs?: { value: string; label: string }[];
    filters: DeliveryFilters;
}

const champ =
    'w-full h-10 px-3 border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-purple-950/20 focus:border-purple-950 outline-none text-sm font-medium text-gray-700';
const libelle = 'block text-xs font-semibold text-purple-950 mb-1.5 uppercase tracking-wider';

const SearchAndActionsBar: React.FC<SearchAndActionsBarProps> = ({
    searchTerm,
    onSearch,
    onFilterChange,
    onResetFilters,
    onStatsPeriodChange,
    onOpenCorbeille,
    onExportPdf,
    exportingPdf,
    vendeurs = [],
    filters
}) => {
    const { t } = useTranslation();
    const [showFilters, setShowFilters] = useState(false);
    const actifs = nombreFiltresActifs(filters, searchTerm);

    return (
        <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="relative w-full sm:w-72 lg:w-60 xl:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        placeholder={t('admin.deliveries.search.placeholder')}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full h-11 pl-10 pr-9 border border-purple-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-950/20 focus:border-purple-950"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => onSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-purple-50 hover:text-purple-950"
                            aria-label="Effacer la recherche"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm shadow-sm border ${
                            showFilters
                                ? 'text-white border-purple-950 shadow-md shadow-purple-950/20'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                        style={showFilters ? { backgroundColor: PURPLE_950 } : undefined}
                    >
                        <Filter className={`w-4 h-4 ${showFilters ? 'text-white' : 'text-gray-500'}`} />
                        <span>{t('admin.deliveries.filters.btn')}</span>
                        {actifs > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                                {actifs}
                            </span>
                        )}
                    </button>

                    <Tooltip title="Exporter en PDF les ventes affichées (filtres compris)">
                        <button
                            onClick={onExportPdf}
                            disabled={exportingPdf}
                            className="group flex items-center gap-2 px-4 py-2.5 text-purple-950 bg-white hover:bg-purple-50 rounded-xl transition-all duration-200 shadow-sm border border-purple-200 font-semibold text-sm disabled:opacity-60 disabled:cursor-wait"
                        >
                            {exportingPdf ? <Spin size="small" /> : <FileDown className="w-4 h-4" />}
                            <span className="hidden sm:inline">Exporter PDF</span>
                        </button>
                    </Tooltip>

                    {onOpenCorbeille && <Tooltip title="Voir les ventes annulées (restaurables)">
                        <button
                            onClick={onOpenCorbeille}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200 group font-medium text-sm"
                        >
                            <span className="hidden 2xl:inline">Ventes annulées</span>
                            <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </Tooltip>}

                    <Link
                        to={cheminsVente().selection}
                        onClick={() => {
                            // Une nouvelle vente part d'un panier vide (et jamais d'une
                            // modification de livraison restée en mémoire).
                            useDeliveryStore.getState().clearDelivery();
                            useProductStore.getState().clearProducts();
                        }}
                        // Couleur en style direct : le style global d'antd sur les liens <a>
                        // écrase la classe bg-* et rendait le bouton blanc sur blanc.
                        style={{ backgroundColor: PURPLE_950, color: '#fff' }}
                        className="flex items-center gap-2 px-5 py-2.5 hover:opacity-90 !text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-950/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="hidden sm:inline">{estCaissier() ? 'Nouvelle vente' : t('admin.deliveries.actions.start')}</span>
                    </Link>
                </div>
            </div>

            {showFilters && (
                <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950 } }}>
                    <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 shadow-inner">
                        <div className="flex justify-between items-center mb-4 gap-3">
                            <h3 className="font-semibold text-purple-950 flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                {t('admin.deliveries.filters.title')}
                                {actifs > 0 && (
                                    <span className="text-xs font-normal text-purple-700">
                                        · {actifs} filtre{actifs > 1 ? 's' : ''} actif{actifs > 1 ? 's' : ''}
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onResetFilters}
                                    disabled={actifs === 0}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-purple-950 bg-white px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    {t('admin.deliveries.filters.reset')}
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="text-gray-400 hover:text-rose-500 bg-white p-1 rounded-full border border-gray-200 transition-colors"
                                    aria-label="Fermer les filtres"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="sm:col-span-2">
                                <label className={libelle}>{t('admin.deliveries.filters.period')}</label>
                                <RangePicker
                                    value={filters.dateRange}
                                    onChange={(dates) => {
                                        onFilterChange('dateRange', dates);
                                        // Une période personnalisée remplace jour / semaine / mois.
                                        if (dates) onStatsPeriodChange?.('all');
                                    }}
                                    format="DD/MM/YYYY"
                                    className="w-full h-10 rounded-lg border-purple-200"
                                    placeholder={[t('admin.deliveries.filters.start'), t('admin.deliveries.filters.end')]}
                                />
                            </div>
                            <div>
                                <label className={libelle}>{t('admin.deliveries.filters.payment')}</label>
                                <select
                                    value={filters.paymentStatus}
                                    onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
                                    className={champ}
                                >
                                    <option value="">{t('admin.deliveries.filters.allPayments')}</option>
                                    <option value="payé">{t('admin.deliveries.filters.paid')}</option>
                                    <option value="partiel">{t('admin.deliveries.filters.partial')}</option>
                                    <option value="non payé">{t('admin.deliveries.filters.unpaid')}</option>
                                </select>
                            </div>
                            <div>
                                <label className={libelle}>{t('admin.deliveries.filters.status')}</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => onFilterChange('status', e.target.value)}
                                    className={champ}
                                >
                                    <option value="">{t('admin.deliveries.filters.allStatus')}</option>
                                    {Object.entries(ETATS_VENTE).map(([valeur, { libelle }]) => (
                                        <option key={valeur} value={valeur}>{libelle}</option>
                                    ))}
                                </select>
                            </div>
                            {!estCaissier() && <>
                            <div>
                                <label className={libelle}>{t('admin.deliveries.filters.driver')}</label>
                                <select
                                    value={filters.livreur}
                                    onChange={(e) => onFilterChange('livreur', e.target.value)}
                                    className={champ}
                                >
                                    <option value="">Tous les vendeurs</option>
                                    {vendeurs.map((v) => (
                                        <option key={v.value} value={v.value}>{v.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={libelle}>Rôle du vendeur</label>
                                <select
                                    value={filters.roleVendeur}
                                    onChange={(e) => onFilterChange('roleVendeur', e.target.value)}
                                    className={champ}
                                >
                                    <option value="">Tous les rôles</option>
                                    <option value="caissier">Caissiers</option>
                                    <option value="gerant">Gérants</option>
                                    <option value="manager">Managers</option>
                                    <option value="admin">Administrateurs</option>
                                </select>
                            </div>
                            </>}
                            <div>
                                <label className={libelle}>Retours</label>
                                <select
                                    value={filters.retours}
                                    onChange={(e) => onFilterChange('retours', e.target.value)}
                                    className={champ}
                                >
                                    <option value="">Toutes les ventes</option>
                                    <option value="avec_retour">Avec retour</option>
                                    <option value="a_rembourser">Client à rembourser</option>
                                    <option value="rembourse">Déjà remboursées</option>
                                </select>
                            </div>
                            <div>
                                <label className={libelle}>{t('admin.deliveries.filters.minAmount')}</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={filters.minAmount}
                                    onChange={(e) => onFilterChange('minAmount', e.target.value)}
                                    className={champ}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className={libelle}>{t('admin.deliveries.filters.maxAmount')}</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={filters.maxAmount}
                                    onChange={(e) => onFilterChange('maxAmount', e.target.value)}
                                    className={champ}
                                    placeholder="∞"
                                />
                            </div>
                        </div>
                    </div>
                </ConfigProvider>
            )}
        </div>
    );
};

export default SearchAndActionsBar;
