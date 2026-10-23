import { useState, useEffect } from 'react';
import { Package, User, MapPin, Phone, Mail, Calendar, DollarSign, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getUrlServer } from '../../../configServer';

interface Client {
  nom: string;
  created_by: string;
  telephone: string;
  email: string;
  ville: string;
  quartier: string;
  photo_profil: string | null;
  magasin_id: { $oid: string };
  created_at: { $date: string };
}

interface Produit {
  produit_id: string;
  quantite: number;
  prix: number;
  nom: string;
  categorie: string | null;
  unite: string;
  image: string;
  is_conditionne: boolean;
  conditionnement_id: string;
  conditionnement_nom: string;
  facteur: number;
}

interface ProduitRetour {
  produit_id: string;
  is_conditionne: boolean;
  conditionnement_id: string;
  quantite: number;
}

interface Retour {
  id: string;
  produits: ProduitRetour[];
  motif: string;
  manager_id: string;
  livreur_id: string;
  created_at: { $date: string };
}

interface LivraisonDetails {
  id: string;
  livreur_id: string;
  magasin_id: string;
  client_id: string;
  client: Client;
  produits: Produit[];
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  quantite: number;
  statut_paiement: string;
  statut_livraison: string;
  relicat: number;
  ristourne: number;
  have_ristourne: boolean;
  date_commande: string;
  created_at: string;
  updated_at: string;
  retours: Retour[];
}

export default function LivraisonDetailsPagelivreur() {
  const { t } = useTranslation();
  const [livraison, setLivraison] = useState<LivraisonDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ID de la livraison (vous pouvez le passer en props ou utiliser useParams si vous utilisez React Router)
  const livraisonId = "687768f5dc09359d9f11097a";

  useEffect(() => {
    const fetchLivraisonDetails = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          throw new Error('Token d\'accès non trouvé');
        }

        const response = await fetch(`${getUrlServer()}/livraisons/${livraisonId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        setLivraison(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchLivraisonDetails();
  }, [livraisonId]);

  const getStatutBadge = (statut: string, type: 'livraison' | 'paiement') => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1";
    
    if (type === 'livraison') {
      switch (statut.toLowerCase()) {
        case 'livrée':
          return `${baseClasses} bg-green-100 text-green-800`;
        case 'en cours':
          return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'annulée':
          return `${baseClasses} bg-red-100 text-red-800`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`;
      }
    } else {
      switch (statut.toLowerCase()) {
        case 'payé':
          return `${baseClasses} bg-green-100 text-green-800`;
        case 'non payé':
          return `${baseClasses} bg-red-100 text-red-800`;
        case 'partiellement payé':
          return `${baseClasses} bg-yellow-100 text-yellow-800`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`;
      }
    }
  };

  const getStatutIcon = (statut: string, type: 'livraison' | 'paiement') => {
    if (type === 'livraison') {
      switch (statut.toLowerCase()) {
        case 'livrée':
          return <CheckCircle className="w-4 h-4" />;
        case 'en cours':
          return <AlertCircle className="w-4 h-4" />;
        case 'annulée':
          return <XCircle className="w-4 h-4" />;
        default:
          return <Package className="w-4 h-4" />;
      }
    } else {
      switch (statut.toLowerCase()) {
        case 'payé':
          return <CheckCircle className="w-4 h-4" />;
        case 'non payé':
          return <XCircle className="w-4 h-4" />;
        case 'partiellement payé':
          return <AlertCircle className="w-4 h-4" />;
        default:
          return <DollarSign className="w-4 h-4" />;
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('delivery.admindetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('delivery.admindetail.error')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('delivery.admindetail.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!livraison) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('delivery.admindetail.notFoundTitle')}</h2>
          <p className="text-gray-600">{t('delivery.admindetail.notFoundDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to='/admin/dashboard/deliverys' className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('delivery.admindetail.pageTitle')}</h1>
                <p className="text-gray-600">{t('delivery.admindetail.idLabel')} {livraison.id}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className={getStatutBadge(livraison.statut_livraison, 'livraison')}>
                {getStatutIcon(livraison.statut_livraison, 'livraison')}
                {livraison.statut_livraison}
              </span>
              <span className={getStatutBadge(livraison.statut_paiement, 'paiement')}>
                {getStatutIcon(livraison.statut_paiement, 'paiement')}
                {livraison.statut_paiement}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations Client */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                {t('delivery.admindetail.clientInfo')}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">{t('delivery.admindetail.clientName')}</p>
                  <p className="font-medium text-gray-900">{livraison.client.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('delivery.admindetail.clientPhone')}</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {livraison.client.telephone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('delivery.admindetail.clientEmail')}</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {livraison.client.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('delivery.admindetail.clientAddress')}</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {livraison.client.quartier}, {livraison.client.ville}
                  </p>
                </div>
              </div>
            </div>

            {/* Résumé Financier */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                {t('delivery.admindetail.financialSummary')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('delivery.admindetail.totalAmount')}</span>
                  <span className="font-medium">{formatPrice(livraison.montant_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('delivery.admindetail.paidAmount')}</span>
                  <span className="font-medium text-green-600">{formatPrice(livraison.montant_paye)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('delivery.admindetail.remainingAmount')}</span>
                  <span className="font-medium text-red-600">{formatPrice(livraison.montant_restant)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('delivery.admindetail.balance')}</span>
                  <span className="font-medium">{formatPrice(livraison.relicat)}</span>
                </div>
                {livraison.have_ristourne && (
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">{t('delivery.admindetail.discount')}</span>
                    <span className="font-medium text-blue-600">{formatPrice(livraison.ristourne)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Produits et Retours */}
          <div className="lg:col-span-2">
            {/* Produits */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                {t('delivery.admindetail.productsTitle')} ({livraison.produits.length})
              </h3>
              <div className="space-y-4">
                {livraison.produits.map((produit, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{produit.nom}</h4>
                      <span className="text-lg font-semibold text-gray-900">{formatPrice(produit.prix)}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">{t('delivery.admindetail.productQty')}</p>
                        <p className="font-medium">{produit.quantite} {produit.unite}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('delivery.admindetail.productConditioning')}</p>
                        <p className="font-medium">{produit.conditionnement_nom}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('delivery.admindetail.productFactor')}</p>
                        <p className="font-medium">{produit.facteur}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('delivery.admindetail.productConditioned')}</p>
                        <p className="font-medium">{produit.is_conditionne ? t('delivery.admindetail.yes') : t('delivery.admindetail.no')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Retours */}
            {livraison.retours && livraison.retours.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  {t('delivery.admindetail.returnsTitle')} ({livraison.retours.length})
                </h3>
                <div className="space-y-4">
                  {livraison.retours.map((retour, index) => (
                    <div key={retour.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{t('delivery.admindetail.returnLabel')} {index + 1}</h4>
                        <span className="text-sm text-gray-600">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {formatDate(retour.created_at.$date)}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">{t('delivery.admindetail.returnReason')}</p>
                        <p className="text-sm text-gray-900">{retour.motif}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">{t('delivery.admindetail.returnedProducts')}</p>
                        <div className="space-y-2">
                          {retour.produits.map((produitRetour, produitIndex) => (
                            <div key={produitIndex} className="flex items-center justify-between text-sm">
                              <span className="text-gray-900">
                                {t('delivery.admindetail.productId')} {produitRetour.produit_id.substring(0, 8)}...
                              </span>
                              <span className="font-medium">{t('delivery.admindetail.productQty')}: {produitRetour.quantite}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informations de la commande */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {t('delivery.admindetail.orderInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('delivery.admindetail.orderDate')}</p>
                  <p className="font-medium text-gray-900">{formatDate(livraison.date_commande)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('delivery.admindetail.createdAt')}</p>
                  <p className="font-medium text-gray-900">{formatDate(livraison.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('delivery.admindetail.lastModified')}</p>
                  <p className="font-medium text-gray-900">{formatDate(livraison.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('delivery.admindetail.totalQty')}</p>
                  <p className="font-medium text-gray-900">{livraison.quantite}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


