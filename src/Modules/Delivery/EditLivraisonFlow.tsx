import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BreadcrumbNavigation } from './Clients/BreadcrumbNavigation';
import { ClientSection } from './Clients/ClientSection';
import { ProductsSection } from './Clients/ProductsSection';
import { PaymentStatusSection } from './Clients/PaymentStatusSection';
import { TotalSection } from './Clients/TotalSection';
import { ActionsSection } from './Clients/ActionsSection';
import PageTitle from '../../Components/PageTitle';
import { Spin, Alert } from 'antd';
import { getUrlServer } from '../../configServer';
import { useDeliveryStore } from './Clients/composantclient/deliveryStore';
import { useProductStore, SelectedProduct } from '../../Components/componentproduitselection/stores/useProductStore';
import { useTranslation } from 'react-i18next';

import { lignesFigees, regrouperLignesVente } from '../../Components/admin/livaision/livraisonfinal/editionVente';
import ArticlesFiges from '../../Components/admin/livaision/livraisonfinal/ArticlesFiges';

const API_URL = getUrlServer();

const EditLivraisonFlow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    setEditDeliveryId,
    setClientId,
    setPaymentStatus,
    setMethodePaiement,
    setAdvanceAmount,
    setRelicat,
    setRistourne,
    setDetteAncienne,
    setIsDetteAncienneActive,
    clearDelivery,
    setPaiements,
  } = useDeliveryStore();

  const { clearProducts, addProduct } = useProductStore();
  const lignesFigeesVente = useDeliveryStore((s) => s.lignesFigees);

  useEffect(() => {
    // En développement, React lance cet effet deux fois : seul le dernier chargement compte.
    let annule = false;
    const fetchAndHydrate = async () => {
      if (!id) {
        setError(t('delivery.deliveryConfig.errorMissingId'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Toujours nettoyer les stores existants avant de charger une édition
        clearDelivery();
        clearProducts();

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/livraisons/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(t('delivery.deliveryConfig.errorLoad'));
        }

        const data = await response.json();

        // 1. Hydrate DeliveryStore
        setEditDeliveryId(id);
        if (data.client_id) setClientId(data.client_id);
        if (data.statut_paiement) setPaymentStatus(data.statut_paiement);
        if (data.methode_paiement) setMethodePaiement(data.methode_paiement);
        if (data.montant_paye !== undefined) setAdvanceAmount(data.montant_paye);
        if (data.relicat !== undefined) setRelicat(data.relicat);
        if (data.ristourne !== undefined) setRistourne(data.ristourne);
        if (data.dette_ancienne !== undefined) {
          setDetteAncienne(data.dette_ancienne);
          if (data.dette_ancienne > 0) setIsDetteAncienneActive(true);
        }

        // Hydrate multiple payments
        if (data.paiements && Array.isArray(data.paiements) && data.paiements.length > 0) {
          setPaiements(data.paiements);
        } else if (data.methode_paiement) {
          // Fallback for older records with single payment
          setPaiements([{ methode: data.methode_paiement, montant: data.montant_paye || 0 }]);
        }

        // 2. Articles : une ligne par article, unités et cartons regroupés.
        if (annule) return;
        const articles = Array.isArray(data.produits) ? regrouperLignesVente(data.produits) : [];
        if (articles.some((a) => a.cartonEntame)) {
          // Carton entamé par un retour : articles figés, seuls client et paiement changent.
          useDeliveryStore.getState().setLignesFigees(lignesFigees(data.produits));
          useProductStore.setState({ totalAmount: Number(data.montant_brut ?? data.montant_produits) || 0 });
        } else {
          const store = useProductStore.getState();
          for (const article of articles) {
            const l = article.ligne;
            addProduct({
              id: article.produit_id,
              name: l.nom || 'Article inconnu',
              price: article.prixUnitaire,
              size: l.unite || 'Unité',
              image: l.image || null,
              // Stock du gérant + ce que la vente a déjà pris (rendu si on le retire).
              quantite_livreur_initiale: (Number(l.quantite_livreur) || 0) + article.unitesDansLaVente,
              conditionnements: article.conditionnements,
            } as Omit<SelectedProduct, 'quantity' | 'total' | 'conditionconfig'> & { quantite_livreur_initiale: number });
            if (article.unites > 0) store.updateUnitQuantity(article.produit_id, article.unites);
            for (const carton of article.cartons) store.addConditioning(article.produit_id, carton.id, carton.nombre);
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || t('delivery.deliveryConfig.errorFallback'));
      } finally {
        setLoading(false);
      }
    };

    fetchAndHydrate();

    // Cleanup when leaving form
    return () => {
      annule = true;
      setEditDeliveryId(null);
    };
  }, [id, setEditDeliveryId, setClientId, setPaymentStatus, setMethodePaiement, setAdvanceAmount, setRelicat, setRistourne, setDetteAncienne, setIsDetteAncienneActive, clearDelivery, clearProducts, addProduct]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">{t('delivery.deliveryConfig.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Alert message={t('delivery.deliveryConfig.error')} description={error} type="error" showIcon />
        <button
          className="mt-4 px-4 py-2 bg-[#0F172A] text-white rounded"
          onClick={() => navigate(-1)}
        >
          {t('delivery.deliveryConfig.btnBack')}
        </button>
      </div>
    );
  }

  return (
    <>
      <PageTitle>{t('delivery.deliveryConfig.pageTitleEdit')}</PageTitle>

      <div className="p-6 bg-gray-50 min-h-screen">
        <BreadcrumbNavigation paths={[t('delivery.deliveryConfig.breadcrumbDelivery'), t('delivery.deliveryConfig.breadcrumbEdit'), t('delivery.deliveryConfig.breadcrumbConfig')]} />

        <div className="flex justify-between items-center mb-6">
          <PageTitle>{t('delivery.deliveryConfig.titleEdit', { id: id?.substring(0, 8) })}</PageTitle>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2 spans) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <ClientSection />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-[#0F172A]">{t('delivery.deliveryConfig.sectionProducts')}</h3>
              {lignesFigeesVente ? <ArticlesFiges lignes={lignesFigeesVente} /> : <ProductsSection />}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-[#0F172A]">{t('delivery.deliveryConfig.sectionPayment')}</h3>
              <PaymentStatusSection />
            </div>
          </div>

          {/* Sidebar - Right Column (1 span) - Sticky */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg sticky top-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-[#0F172A]">{t('delivery.deliveryConfig.sectionSummary')}</h3>
              <div className="mb-6">
                <TotalSection />
              </div>
              <div className="pt-4 border-t border-gray-100">
                <ActionsSection />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditLivraisonFlow;
