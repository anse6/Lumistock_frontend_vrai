import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ClientSection } from "../selectionproduct/Clients/ClientSection";
import { ProductsSection } from "../selectionproduct/Clients/ProductsSection";
import { PaymentStatusSection } from "../selectionproduct/Clients/PaymentStatusSection";
import { TotalSection } from "../selectionproduct/Clients/TotalSection";
import { ReductionsSection } from "../selectionproduct/Clients/ReductionsSection";
import { ActionsSection } from "../selectionproduct/Clients/ActionsSection";
import PageTitle from "../../../PageTitle";
import { Spin, Alert, ConfigProvider } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { User, ShoppingBag, CreditCard, ReceiptText, BadgePercent } from "lucide-react";
import { SaleCard } from "../index/ClientSelectionadmin";
import { getUrlServer } from "../../../../../configServer";
import { useDeliveryStore } from "../newdelivery/deliveryStore";
import {
  useProductStore,
  SelectedProduct,
} from "../selectionproduct/Clients/api/useProductStore";

const API_URL = getUrlServer();

const EditLivraisonFlow: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    setReductions,
    setDetteAncienne,
    setIsDetteAncienneActive,
    clearDelivery,
    setPaiements,
  } = useDeliveryStore();

  const { clearProducts, addProduct } = useProductStore();

  useEffect(() => {
    const fetchAndHydrate = async () => {
      if (!id) {
        setError(t("admin.deliveries.edit.missingId"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Toujours nettoyer les stores existants avant de charger une édition
        clearDelivery();
        clearProducts();

        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/livraisons/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(t("admin.deliveries.edit.loadError"));
        }

        const data = await response.json();

        // 1. Hydrate DeliveryStore
        setEditDeliveryId(id);
        if (data.client_id) setClientId(data.client_id);
        if (data.statut_paiement) setPaymentStatus(data.statut_paiement);
        if (data.methode_paiement) setMethodePaiement(data.methode_paiement);
        if (data.montant_paye !== undefined)
          setAdvanceAmount(data.montant_paye);
        if (data.relicat !== undefined) setRelicat(data.relicat);
        if (data.ristourne !== undefined) setRistourne(data.ristourne);
        if (Array.isArray(data.reductions)) {
          setReductions(
            data.reductions.map((r: any) => ({ type: r.type, mode: r.mode, valeur: Number(r.valeur) || 0, motif: r.motif || "" })),
          );
        }
        if (data.dette_ancienne !== undefined) {
          setDetteAncienne(data.dette_ancienne);
          if (data.dette_ancienne > 0) setIsDetteAncienneActive(true);
        }
        // TVA de la vente d'origine (taux conservé).
        useDeliveryStore.getState().setAppliquerTva(!!data.appliquer_tva);
        useDeliveryStore.getState().setTauxTvaVente(data.appliquer_tva ? Number(data.taux_tva) || null : null);

        // Hydrate multiple payments
        if (
          data.paiements &&
          Array.isArray(data.paiements) &&
          data.paiements.length > 0
        ) {
          // Anciennes ventes : un seul paiement enregistré à 0 alors que le
          // montant payé est connu. On reprend le montant payé.
          const paiementsCharges =
            data.paiements.length === 1 && !Number(data.paiements[0].montant) && Number(data.montant_paye) > 0
              ? [{ methode: data.paiements[0].methode, montant: Number(data.montant_paye) }]
              : data.paiements;
          setPaiements(paiementsCharges);
        } else if (data.methode_paiement) {
          // Fallback for older records with single payment
          setPaiements([
            { methode: data.methode_paiement, montant: data.montant_paye || 0 },
          ]);
        }

        // 2. Hydrate ProductStore
        if (data.produits && Array.isArray(data.produits)) {
          data.produits.forEach((prod: any) => {
            const productToAdd: Omit<
              SelectedProduct,
              "quantity" | "total" | "conditionconfig"
            > & {
              quantite_magasin_initiale: number;
              conditionnements?: any[];
            } = {
              id: prod.produit_id,
              name:
                prod.nom || t("admin.deliveries.config.client.product.unknown"),
              price: prod.prix || 0,
              size:
                prod.unite || t("admin.deliveries.config.client.product.unit"),
              image: prod.image || null,
              quantite_magasin_initiale: prod.quantite_magasin ?? 9999, // Fallback safely
              conditionnements: prod.conditionnements || [],
            };

            addProduct(productToAdd);

            // Accessing the Zustand store manually for direct quantity updates using existing actions
            const store = useProductStore.getState();

            if (prod.is_conditionne && prod.conditionnement_id) {
              store.addConditioning(
                prod.produit_id,
                prod.conditionnement_id,
                prod.quantite,
                true,
              );
            } else {
              store.updateUnitQuantity(
                prod.produit_id,
                prod.quantite,
                undefined,
                true,
              );
            }
          });
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || t("admin.deliveries.actions.messages.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchAndHydrate();

    // Cleanup when leaving form
    return () => {
      setEditDeliveryId(null);
    };
  }, [
    id,
    setEditDeliveryId,
    setClientId,
    setPaymentStatus,
    setMethodePaiement,
    setAdvanceAmount,
    setRelicat,
    setRistourne,
    setReductions,
    setDetteAncienne,
    setIsDetteAncienneActive,
    clearDelivery,
    clearProducts,
    addProduct,
    t,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">
          {t("admin.deliveries.edit.loading")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Alert
          message={t("admin.deliveries.detail.errorTitle")}
          description={error}
          type="error"
          showIcon
        />
        <button
          className="mt-4 px-4 py-2 bg-[#0F172A] text-white rounded"
          onClick={() => navigate(-1)}
        >
          {t("admin.deliveries.edit.backToList")}
        </button>
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#3b0764", borderRadius: 10 } }}>
      <PageTitle>{t("admin.deliveries.edit.title")}</PageTitle>
      <div className="min-h-screen bg-white pb-16">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 text-sm font-medium sm:px-6">
          <Link
            to="/admin/dashboard/deliverys"
            style={{ backgroundColor: "#3b0764" }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold !text-white shadow-sm hover:opacity-90"
          >
            <ArrowLeftOutlined className="text-xs" />
            {t("sidebar.delivery")}
          </Link>
          <span className="font-bold text-gray-300">›</span>
          <span className="rounded-xl bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-950">
            {t("admin.deliveries.edit.titleWithId", { id: id?.substring(0, 8) })}
          </span>
        </div>

        <div className="mx-4 mb-5 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm sm:mx-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900/70">Modification</div>
          <h1 className="text-lg font-bold text-purple-950">{t("admin.deliveries.edit.title")}</h1>
          <p className="text-xs text-slate-500">Ajustez le client, les quantités et le paiement de cette vente.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 px-4 sm:px-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <SaleCard numero={1} icone={<User size={18} />} titre="Client">
              <ClientSection />
            </SaleCard>
            <SaleCard numero={2} icone={<ShoppingBag size={18} />} titre={t("admin.deliveries.detail.orderedProducts")}>
              <ProductsSection />
            </SaleCard>
            <SaleCard
              numero={3}
              icone={<BadgePercent size={18} />}
              titre="Réductions"
              sousTitre="Facultatif : rabais, remise ou ristourne accordés au client"
            >
              <ReductionsSection />
            </SaleCard>
            <SaleCard numero={4} icone={<CreditCard size={18} />} titre={t("admin.deliveries.table.payment")}>
              <PaymentStatusSection />
            </SaleCard>
          </div>
          <aside className="lg:col-span-1">
            <div className="sticky top-4">
              <SaleCard icone={<ReceiptText size={18} />} titre="Récapitulatif">
                <TotalSection />
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <ActionsSection />
                </div>
              </SaleCard>
            </div>
          </aside>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default EditLivraisonFlow;
