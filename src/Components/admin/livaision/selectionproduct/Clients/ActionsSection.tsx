import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useDeliveryStore } from "../../newdelivery/deliveryStore";
import { useProductStore } from "./api/useProductStore";
import { useQueryClient } from "@tanstack/react-query";
import { getUrlServer } from "../../../../../configServer";
import { message } from "antd";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getConditioningId } from "../../../approvisonnement/conditioning";
import { useMontantsVente } from "./reductions";
import { apiVente, cheminsVente, estCaissier } from "../../venteRole";

const API_URL = getUrlServer();

export const ActionsSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    editDeliveryId: editionEnMemoire,
    clientId,
    statut_paiement,
    paiements,
    montant_paye,
    relicat,
    ristourne,
    reductions,
    dette_ancienne,
    is_dette_ancienne_active,
    aCouche,
    clearDelivery,
  } = useDeliveryStore();
  const { selectedProducts, clearProducts } = useProductStore();
  // Un caissier ne modifie jamais une vente existante : il crée toujours une nouvelle vente.
  const editDeliveryId = estCaissier() ? null : editionEnMemoire;
  const { totalAPayer, detail: reductionsCalculees, appliquerTva } = useMontantsVente();
  const [enregistrement, setEnregistrement] = React.useState(false);

  const handleSaveDelivery = async () => {
    if (selectedProducts.length === 0) {
      message.error(t("admin.deliveries.actions.validation.selectProduct"));
      return;
    }
    // Un article à 0 serait silencieusement ignoré : on le signale.
    const sansQuantite = selectedProducts.filter(
      (p) => (Number(p.quantity) || 0) === 0 && !p.conditionconfig.some((c) => c.conditionedQuantity > 0),
    );
    if (sansQuantite.length > 0) {
      message.error(
        `Quantité à 0 pour : ${sansQuantite.map((p) => p.name).join(", ")}. Indiquez une quantité ou retirez l'article.`,
      );
      return;
    }

    if (statut_paiement !== "non payé" && montant_paye > totalAPayer) {
      message.error(
        `Le montant payé (${montant_paye.toLocaleString()} CFA) ne peut pas être supérieur au total à payer (${totalAPayer.toLocaleString()} CFA).`,
      );
      return;
    }

    setEnregistrement(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/");
        return;
      }

      const produitsPayload = selectedProducts.flatMap((p) => {
        const items = [];
        if (p.quantity > 0) {
          items.push({
            produit_id: p.id,
            quantite: p.quantity,
            prix: p.price,
          });
        }
        p.conditionconfig.forEach((config) => {
          if (config.conditionedQuantity > 0) {
            items.push({
              produit_id: p.id,
              conditionnement_id: getConditioningId(config.selectedConditioning._id),
              quantite_conditionnement: config.conditionedQuantity,
            });
          }
        });
        return items;
      });

      const basePayload = {
        produits: produitsPayload,
        statut_paiement,
        // Inclure la liste des paiements si ce n'est pas "Non payé"
        ...(statut_paiement !== "non payé" && { paiements }),
        // Rétrocompatibilité : inclure aussi le premier mode de paiement et le montant total payé
        ...(statut_paiement !== "non payé" &&
          paiements.length > 0 && { methode_paiement: paiements[0].methode }),
        montant_paye,
        ristourne,
        // Seules les réductions réellement appliquées (valeur > 0) sont envoyées.
        reductions: reductions.filter((r) => reductionsCalculees.some((d) => d.type === r.type)),
        dette_ancienne: is_dette_ancienne_active ? dette_ancienne : 0,
        // TVA du pays du magasin : le serveur fixe le taux et la recalcule.
        appliquer_tva: appliquerTva,
        relicat: statut_paiement === "payé" ? relicat : 0,
        // Ajouter a_couche seulement si la case est cochée et le statut est "partiellement payé"
        ...(statut_paiement === "partiellement payé" &&
          aCouche && { action_manager: true }),
      };

      const payload = {
        ...basePayload,
        ...(clientId && { client_id: clientId }),
      };

      let response;
      if (editDeliveryId) {
        // Modification (PUT)
        response = await axios.put(
          `${API_URL}/admin_or_manager/livraisons/${editDeliveryId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      } else {
        // Création (POST)
        response = await axios.post(
          apiVente().creer,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (response.status === 201 || response.status === 200) {
        const successText =
          response.data?.message ||
          (editDeliveryId
            ? t("admin.deliveries.actions.messages.updateSuccess")
            : t("admin.deliveries.actions.messages.createSuccess"));
        message.success(successText);
        clearDelivery();
        clearProducts();
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        if (estCaissier()) {
          // Caissier : retour à ses ventes, avec le ticket prêt à imprimer.
          queryClient.invalidateQueries({ queryKey: ["caisse"] });
          navigate(`${cheminsVente().liste}?ticket=${response.data?.id ?? ""}`);
        } else {
          navigate("/admin/dashboard/deliverys");
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement :", error);
      // Le serveur renvoie { error: "texte" } ou { error: { champ: [messages] } }.
      const detail = error.response?.data?.error ?? error.response?.data?.message;
      const texte =
        typeof detail === "string"
          ? detail
          : detail
            ? Object.values(detail).flat().join(" ")
            : t("admin.deliveries.actions.messages.error");
      message.error(texte);
    } finally {
      setEnregistrement(false);
    }
  };

  const isOverpaid = statut_paiement !== "non payé" && montant_paye > totalAPayer;

  const desactive = selectedProducts.length === 0 || isOverpaid || enregistrement;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSaveDelivery}
        disabled={desactive}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-950 py-3 text-sm font-bold text-white shadow-md shadow-purple-950/20 transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        {enregistrement ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <CheckCircle2 size={18} />
        )}
        {editDeliveryId ? t("admin.deliveries.actions.update") : "Valider la vente"}
      </button>
      {isOverpaid && (
        <p className="text-center text-xs text-red-600">Le montant encaissé dépasse le total à payer.</p>
      )}
      {/* En modification, repartir vers la sélection créerait une nouvelle
          livraison au lieu de modifier celle-ci : le lien n'est proposé
          que pour une nouvelle vente. */}
      {!editDeliveryId && (
        <Link
          to={cheminsVente().selection}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-200 py-2.5 text-sm font-semibold !text-purple-950 transition hover:bg-purple-50"
        >
          <ArrowLeft size={16} />
          {t("admin.deliveries.actions.addItems")}
        </Link>
      )}
    </div>
  );
};
