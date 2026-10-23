import React, { useState, useEffect, useCallback } from 'react';
import PageTitle from '../../Components/PageTitle';
import SearchAndActionsBar from './livraisonfinal/SearchAndActionsBar';
import OrdersTable from './livraisonfinal/OrdersTable';
import Pagination from './livraisonfinal/Pagination';
import DeleteModal from './livraisonfinal/DeleteModal';
import DeliveryDetailsModal from './livraisonfinal/DeliveryDetailsModal';
import CorbeilleModal from './livraisonfinal/CorbeilleModal';
import { Order } from './livraisonfinal/types';
import { fetchLivraisons } from './livraisonfinal/livraisonService';
import { Spin, Segmented, Typography, DatePicker } from 'antd';
import { Package, Banknote } from 'lucide-react';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/fr';
import images from '@/assets/no_data.png';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.locale('fr');

const { Text } = Typography;

const ITEMS_PER_PAGE = 10;

import { useTranslation } from 'react-i18next';

const OrderTable: React.FC = () => {
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCorbeilleModal, setShowCorbeilleModal] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<'jour' | 'semaine' | 'mois' | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());

  // New state for success and error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Functions to show and hide messages
  const showSuccessMessage = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const showErrorMessage = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  }, []);

  // Function to re-fetch data from the server
  const reloadOrders = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const data = await fetchLivraisons();
      console.log('Données brutes du backend dans reloadOrders:', data); // Ajout du console.log pour les données brutes
      const transformedOrders: Order[] = data.map((livraison: any) => {
        const nom = livraison?.client?.nom || '';
        const prenom = livraison?.client?.prenom || '';
        const initials = (nom[0]?.toUpperCase() || '') + (prenom[0]?.toUpperCase() || '');

        return {
          id: livraison.id,
          livraison_id: livraison.livraison_id ?? livraison.id ?? '',
          clientInitials: initials || '??',
          clientName: `${nom} ${prenom}`.trim(),
          quantity: livraison.produits?.reduce((total: number, p: { quantite?: number }) => total + (p.quantite || 0), 0) || 0,
          paymentStatus: livraison.statut_paiement || '',
          amount: livraison.montant_total || 0,
          montant_total: livraison.montant_total || 0,
          montant_restant: livraison.montant_restant ?? 0,
          montant_paye: livraison.montant_paye ?? 0,
          montant_produits: livraison.montant_produits ?? 0,
          dette_ancienne: livraison.dette_ancienne ?? 0,
          date: livraison.date_commande
            ? new Date(livraison.date_commande).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
            : '',
          status: livraison.etat || 'validee',
          etat: livraison.etat || 'validee',
          abandon_reste: livraison.abandon_reste ?? null,
          abandon_en_attente: !!livraison.abandon_en_attente,
          produits: livraison.produits?.map((p: any) => ({
            produit_id: p.produit_id?.$oid || p.produit_id || '',
            quantite: p.quantite || 0,
            prix: p.prix || 0,
            nom: p.nom || '',
            categorie: p.categorie || null,
            unite: p.unite || null,
            image: p.image || null,
            is_conditionne: p.is_conditionne || false,
            conditionnement_id: p.conditionnement_id?.$oid || p.conditionnement_id || '',
            conditionnement_nom: p.conditionnement_nom || '', // Inclure conditionnement_nom
            facteur: p.facteur || 0,
          })) || [],
          adresse: livraison.adresse_livraison || '',
          telephone: livraison.client?.telephone || '',
          notes: livraison.notes || '',
          ristourne: livraison.ristourne ?? 0,
          relicat: livraison.relicat ?? 0,
          livreur_id: livraison.livreur_id ?? '',
          email: livraison.client?.email || '',
          // Added missing properties for Order type
          client_id: livraison.client_id ?? livraison.client?.id ?? '',
          nom_livreur: livraison.nom_livreur ?? '',
          retour: livraison.retour ?? false,
          date_livraison: livraison.date_livraison,
          raw_date: livraison.date_commande ? new Date(livraison.date_commande) : null,
        };
      });
      console.log('Commandes transformées:', transformedOrders); // Ajout du console.log pour les données transformées
      setOrders(transformedOrders);
      setFilteredOrders(transformedOrders);
    } catch (err) {
      console.error('Erreur de chargement des livraisons:', err);
      setError(t('delivery.messages.errorFetchCommand'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleOrderUpdate = useCallback(async () => {
    await reloadOrders();
    setActiveMenu(null);
  }, [reloadOrders]);

  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    minAmount: '',
    maxAmount: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, orders, statsPeriod, selectedDate]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedOrders(filteredOrders.slice(startIndex, endIndex));
  }, [currentPage, filteredOrders]);

  const applyFilters = () => {
    let result = [...orders];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(lowerTerm) ||
        order.clientName.toLowerCase().includes(lowerTerm) ||
        (order.telephone?.includes(searchTerm) ?? false)
      );
    }

    if (filters.status) {
      result = result.filter(order => order.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.paymentStatus) {
      result = result.filter(order => order.paymentStatus.toLowerCase() === filters.paymentStatus.toLowerCase());
    }
    if (filters.minAmount) {
      result = result.filter(order => order.amount >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      result = result.filter(order => order.amount <= Number(filters.maxAmount));
    }

    // Filtrage par période
    if (statsPeriod !== 'all' && selectedDate) {
      const start = selectedDate.startOf(statsPeriod === 'jour' ? 'day' : statsPeriod === 'semaine' ? 'week' : 'month');
      const end = selectedDate.endOf(statsPeriod === 'jour' ? 'day' : statsPeriod === 'semaine' ? 'week' : 'month');
      result = result.filter(order => {
        if (!order.raw_date) return false;
        const orderDate = dayjs(order.raw_date);
        return orderDate.isSame(start, 'day') || (orderDate.isAfter(start) && orderDate.isBefore(end));
      });
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      paymentStatus: '',
      minAmount: '',
      maxAmount: '',
    });
    setSearchTerm('');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStats = useCallback(() => {
    const totalProducts = filteredOrders.reduce((sum, order) => sum + order.quantity, 0);
    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.montant_total, 0);
    return { totalProducts, totalAmount };
  }, [filteredOrders]);

  const stats = getStats();

  const handleMenuToggle = (index: number) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  const handleDelete = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const handleShowDetails = (order: Order) => {
    console.log('Order passed to DeliveryDetailsModal:', order); // Ajout du console.log pour vérifier les données passées
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const removeOrderFromState = (orderId: string) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    setFilteredOrders(prevFiltered => prevFiltered.filter(order => order.id !== orderId));
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    setSelectedOrderId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedOrderId(null);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <Spin />
      </div>
    );
  }

  // Display general error message if fetching orders failed
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Messages de succès/erreur */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
            {successMessage}
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
            {errorMessage}
          </div>
        </div>
      )}

      <PageTitle> {t('delivery.title')}</PageTitle>
      <div
        className="w-full h-screen p-6 bg-white overflow-y-auto font-['Laura'] hide-scroll"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
        {/* Stats Section */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">

            {/* 🔵 GAUCHE : TITRE + INFOS */}
            <div className="flex flex-col gap-2">
              <Text strong className="text-xl text-slate-800 tracking-tight">
                {t('admin.deliveries.stats.title')}
              </Text>

              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <Text className="text-[12px] font-bold text-blue-600">
                  {t('admin.deliveries.stats.showAllHistory')}
                </Text>
              </div>
            </div>

            {/* 🟢 DROITE : FILTRES */}
            <div className="flex flex-col items-end gap-3">

              <Segmented
                options={[
                  { label: t('delivery.periods.day'), value: 'jour' },
                  { label: t('delivery.periods.week'), value: 'semaine' },
                  { label: t('delivery.periods.month'), value: 'mois' },
                  { label: t('delivery.periods.all'), value: 'all' },
                ]}
                value={statsPeriod}
                onChange={(value) => setStatsPeriod(value as any)}
                className="bg-slate-100 p-1 rounded-xl"
              />

              {statsPeriod !== 'all' && (
                <div className="flex items-center gap-3">
                  <DatePicker
                    picker={
                      statsPeriod === 'semaine'
                        ? 'week'
                        : statsPeriod === 'mois'
                          ? 'month'
                          : undefined
                    }
                    className="h-11 rounded-xl bg-white border-slate-200 shadow-sm hover:border-blue-400 w-64"
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    format={
                      statsPeriod === 'semaine'
                        ? 'Week WW - YYYY'
                        : statsPeriod === 'mois'
                          ? 'MMMM YYYY'
                          : 'DD MMMM YYYY'
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <p className="text-base text-blue-600 font-medium mb-1">{t('delivery.stats.articlesDelivered')}</p>
                <h4 className="text-2xl font-bold text-blue-900">{stats.totalProducts.toLocaleString('fr-FR')}</h4>
                <p className="text-xs text-blue-500 mt-1">{t('delivery.stats.articlesSubtext')}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <p className="text-base text-emerald-600 font-medium mb-1">{t('delivery.stats.totalAmount')}</p>
                <h4 className="text-2xl font-bold text-emerald-900">{stats.totalAmount.toLocaleString('fr-FR')} FCFA</h4>
                <p className="text-xs text-emerald-500 mt-1">{t('delivery.stats.amountSubtext')}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <Banknote className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div >

        <div className="w-full h-full bg-red rounded-lg relative flex flex-col">
          <SearchAndActionsBar
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onResetFilters={resetFilters}
            onOpenCorbeille={() => setShowCorbeilleModal(true)}
            filters={filters}
          />
          <div className="flex-1 overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-16">
                <img
                  src={images}
                  alt="No Data"
                  className="h-32 w-32 object-contain mb-3 opacity-80"
                />
                <span className="text-gray-400 text-sm">
                  {t('delivery.noOrders')}
                </span>
              </div>
            ) : (
              <OrdersTable
                orders={displayedOrders}
                activeMenu={activeMenu}
                onMenuToggle={handleMenuToggle}
                onDelete={handleDelete}
                onShowDetails={handleShowDetails}
                onCompletePayment={handleOrderUpdate}
                onReturnSuccess={handleOrderUpdate}
                onOrderUpdated={handleOrderUpdate}
              />
            )}
          </div>
          {filteredOrders.length > 0 && (
            <Pagination
              totalItems={filteredOrders.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div >

      {showDeleteModal && (
        <DeleteModal
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          orderId={selectedOrderId || ''}
          onDeleteSuccess={(deletedOrderId) => {
            removeOrderFromState(deletedOrderId); // Optimistic UI update
            handleOrderUpdate(); // Full reload for robustness
            showSuccessMessage(t('delivery.messages.successCancel')); // Display success message
            setShowDeleteModal(false);
            setSelectedOrderId(null);
          }}
          onDeleteError={(error) => {
            console.error('Erreur lors de l\' annulation:', error);
            showErrorMessage(t('delivery.messages.errorCancel')); // Display error message
          }}
        />
      )}

      {
        showDetailsModal && (
          <DeliveryDetailsModal
            order={selectedOrder}
            onClose={() => setShowDetailsModal(false)}
            onChanged={handleOrderUpdate}
          />
        )
      }

      {
        showCorbeilleModal && (
          <CorbeilleModal
            onClose={() => setShowCorbeilleModal(false)}
            onRestoreSuccess={() => {
              reloadOrders();
            }}
          />
        )
      }
    </>
  );
};

export default OrderTable;


