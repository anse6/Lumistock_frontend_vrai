import { useState, useEffect } from 'react';
import { Package, User, MapPin, Phone, Mail, Calendar, DollarSign, ArrowLeft, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getUrlServer } from '../../../../configServer';
import AbandonReste from '../../../Client/AbandonReste';
import { AbandonReste as Abandon, etatVente } from '../../../../services/ventes';
import useCompteConnecte from "../../../../hooks/useCompteConnecte";

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
    etat?: string;
    abandon_reste?: Abandon | null;
    abandon_en_attente?: boolean;
    deleted_at?: string | null;
    relicat: number;
    ristourne: number;
    have_ristourne: boolean;
    montant_brut?: number;
    reductions?: { type: string; libelle: string; mode: string; valeur: number; motif?: string; montant: number }[];
    total_reductions?: number;
    montant_produits?: number;
    appliquer_tva?: boolean;
    taux_tva?: number;
    montant_tva?: number;
    date_commande: string;
    created_at: string;
    updated_at: string;
    retours: Retour[];
}

export default function LivraisonDetailsPage() {
    const { peut } = useCompteConnecte();
    const [livraison, setLivraison] = useState<LivraisonDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Incrémenté pour relire la vente après une action (abandon du reste…).
    const [version, setVersion] = useState(0);

    // ID de la livraison depuis l'URL (si absent on utilise un fallback pour éviter d'échouer)
    const { id } = useParams<{ id: string }>();
    const livraisonId = id || "687768f5dc09359d9f11097a";

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
    }, [livraisonId, version]);

    const getStatutBadge = (statut: string, type: 'livraison' | 'paiement') => {
        const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1";

        if (type === 'livraison') {
            switch (statut.toLowerCase()) {
                case 'livrée':
                    return `${baseClasses} bg-green-100 text-green-800`;
                case 'en cours':
                    return `${baseClasses} bg-slate-100 text-slate-800`; // Couleur purple pour 'en cours'
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
                    return `${baseClasses} bg-slate-100 text-slate-800`; // Couleur purple pour 'partiellement payé'
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F172A] mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des détails de la livraison...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-[#0F172A] text-white rounded-lg hover:bg-[#1E293B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:ring-opacity-50"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    if (!livraison) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Livraison non trouvée</h2>
                    <p className="text-gray-600">Les détails de cette livraison ne sont pas disponibles.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {/* Header */}
            <div className="bg-white shadow-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <Link to='/admin/dashboard/deliverys' className="p-2 text-gray-600 hover:text-[#0F172A] hover:bg-gray-100 rounded-full transition-all duration-200">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Détails de la vente</h1>
                                <p className="text-gray-600 text-sm mt-1">Commande ID: <span className="font-mono text-gray-700">{livraison.id}</span></p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {/* État de la vente (validée, retour, annulée), indépendant du paiement. */}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                livraison.etat === 'annulee' ? 'bg-red-100 text-red-800'
                                    : livraison.etat === 'validee' || !livraison.etat ? 'bg-blue-100 text-blue-800'
                                        : 'bg-orange-100 text-orange-800'}`}>
                                {etatVente(livraison.etat).libelle}
                            </span>
                            <span className={getStatutBadge(livraison.statut_paiement, 'paiement')}>
                                {getStatutIcon(livraison.statut_paiement, 'paiement')}
                                <span className="capitalize">{livraison.statut_paiement}</span>
                            </span>
                            {peut("ventes.modifier") && (
                            <Link
                                to={`/admin/dashboard/deliverys/update/${livraisonId}`}
                                className="ml-2 flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] transition-colors shadow-sm"
                            >
                                <Edit className="w-4 h-4" />
                                Modifier
                            </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Informations Client & Résumé Financier */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Informations Client */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-7">
                            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                                <User className="w-6 h-6 text-[#0F172A]" />
                                Informations Client
                            </h3>
                            <div className="space-y-4 text-gray-700">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500"><User className="w-5 h-5" /></span>
                                    <div>
                                        <p className="text-sm text-gray-500">Nom</p>
                                        <p className="font-semibold">{livraison.client.nom}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500"><Phone className="w-5 h-5" /></span>
                                    <div>
                                        <p className="text-sm text-gray-500">Téléphone</p>
                                        <p className="font-semibold">{livraison.client.telephone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500"><Mail className="w-5 h-5" /></span>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-semibold">{livraison.client.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-gray-500 mt-1"><MapPin className="w-5 h-5" /></span>
                                    <div>
                                        <p className="text-sm text-gray-500">Adresse</p>
                                        <p className="font-semibold">{livraison.client.quartier}, {livraison.client.ville}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Résumé Financier */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-7">
                            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                                <DollarSign className="w-6 h-6 text-green-600" />
                                Résumé Financier
                            </h3>
                            <div className="space-y-4">
                                {(livraison.reductions?.length ?? 0) > 0 && (
                                    <div className="space-y-2 py-2 border-b border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 font-medium">Montant brut</span>
                                            <span className="font-semibold text-gray-900">{formatPrice(livraison.montant_brut ?? 0)}</span>
                                        </div>
                                        {livraison.reductions!.map((r) => (
                                            <div key={r.type} className="flex justify-between items-start gap-3 text-sm">
                                                <span className="text-gray-600">
                                                    {r.libelle}{r.mode === "pourcentage" ? ` (${r.valeur} %)` : ""}
                                                    {r.motif && <span className="block text-xs text-gray-400">{r.motif}</span>}
                                                </span>
                                                <span className="shrink-0 font-semibold text-emerald-600">− {formatPrice(r.montant)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {livraison.appliquer_tva && (livraison.montant_tva ?? 0) > 0 && (
                                    <div className="space-y-2 py-2 border-b border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 font-medium">Total HT</span>
                                            <span className="font-semibold text-gray-900">{formatPrice(livraison.montant_produits ?? 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">TVA ({(livraison.taux_tva ?? 0).toLocaleString("fr-FR")} %)</span>
                                            <span className="font-semibold text-gray-900">+ {formatPrice(livraison.montant_tva ?? 0)}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600 font-medium">
                                        {livraison.appliquer_tva && (livraison.montant_tva ?? 0) > 0 ? "Montant total TTC" : "Montant total"}
                                    </span>
                                    <span className="text-xl font-bold text-gray-900">{formatPrice(livraison.montant_total)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600 font-medium">Montant payé</span>
                                    <span className="text-lg font-semibold text-green-600">{formatPrice(livraison.montant_paye)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600 font-medium">Montant restant</span>
                                    <span className="text-lg font-semibold text-red-600">{formatPrice(livraison.montant_restant)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600 font-medium">Relicat</span>
                                    <span className="text-lg font-semibold">{formatPrice(livraison.relicat ?? 0)}</span>
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <AbandonReste
                                        livraisonId={livraison.id}
                                        reste={livraison.montant_restant}
                                        abandon={livraison.abandon_reste}
                                        enAttente={livraison.abandon_en_attente}
                                        annulee={!!livraison.deleted_at}
                                        profil="responsable"
                                        onDone={() => setVersion((v) => v + 1)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Produits et Retours */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Produits */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-7">
                            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                                <Package className="w-6 h-6 text-[#0F172A]" />
                                Produits Commandés ({livraison.produits.length})
                            </h3>
                            <div className="space-y-5">
                                {livraison.produits.map((produit, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-5 bg-gray-50 hover:shadow-sm transition-shadow duration-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold text-lg text-gray-900">{produit.nom}</h4>
                                            <span className="text-xl font-bold text-gray-900">{formatPrice(produit.prix)}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
                                            <div>
                                                <p className="text-gray-500">Quantité</p>
                                                <p className="font-medium">{produit.quantite} {produit.unite}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Conditionnement</p>
                                                <p className="font-medium">{produit.conditionnement_nom || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Facteur</p>
                                                <p className="font-medium">{produit.facteur || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Conditionné</p>
                                                <p className="font-medium">{produit.is_conditionne ? 'Oui' : 'Non'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Retours */}
                        {livraison.retours && livraison.retours.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg border border-red-200 p-7">
                                <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                    Retours ({livraison.retours.length})
                                </h3>
                                <div className="space-y-5">
                                    {livraison.retours.map((retour, index) => (
                                        <div key={retour.id} className="border border-red-300 rounded-lg p-5 bg-red-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-semibold text-lg text-gray-900">Retour #{index + 1}</h4>
                                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(retour.created_at.$date)}
                                                </span>
                                            </div>
                                            <div className="mb-4">
                                                <p className="text-sm text-gray-600 mb-1">Motif du retour</p>
                                                <p className="text-base text-gray-800 italic">"{retour.motif}"</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2">Produits retournés ({retour.produits.length})</p>
                                                <div className="space-y-2">
                                                    {retour.produits.map((produitRetour, produitIndex) => (
                                                        <div key={produitIndex} className="flex items-center justify-between text-sm text-gray-700 bg-red-100 p-3 rounded">
                                                            <span className="font-medium">
                                                                Produit ID: <span className="font-mono text-gray-800">{produitRetour.produit_id.substring(0, 10)}...</span>
                                                            </span>
                                                            <span className="font-semibold text-red-700">Quantité: {produitRetour.quantite}</span>
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
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-7">
                            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-[#0F172A]" />
                                Historique de la Commande
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
                                <div>
                                    <p className="text-sm text-gray-500">Date de commande</p>
                                    <p className="font-semibold">{formatDate(livraison.date_commande)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Créée le</p>
                                    <p className="font-semibold">{formatDate(livraison.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Dernière modification</p>
                                    <p className="font-semibold">{formatDate(livraison.updated_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Quantité totale d'articles</p>
                                    <p className="font-semibold">{livraison.quantite} articles</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


