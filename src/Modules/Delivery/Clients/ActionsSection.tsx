import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDeliveryStore } from './composantclient/deliveryStore';
import { useProductStore } from '../../../Components/componentproduitselection/stores/useProductStore';
import { useQueryClient } from '@tanstack/react-query';
import { getUrlServer } from '../../../configServer';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

const API_URL = getUrlServer()

export const ActionsSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { editDeliveryId, clientId, statut_paiement, paiements, montant_paye, relicat, ristourne, dette_ancienne, is_dette_ancienne_active, clearDelivery } = useDeliveryStore()
  const { selectedProducts, clearProducts, refreshProductsFromServer, totalAmount } = useProductStore()

  const handleSaveDelivery = async () => {
    if (selectedProducts.length === 0) {
      message.error(t('delivery.deliveryConfig.actionErrorNoProduct'))
      return
    }
    if (selectedProducts.every(p => p.quantity === 0 && p.conditionconfig.length === 0)) {
      message.error(t('delivery.deliveryConfig.actionErrorNoQuantity'))
      return
    }

    const totalAPayer = totalAmount + (is_dette_ancienne_active ? dette_ancienne : 0);
    if (statut_paiement !== 'non payé' && montant_paye > totalAPayer) {
      message.error(`Le montant payé (${montant_paye.toLocaleString()} CFA) ne peut pas être supérieur au total à payer (${totalAPayer.toLocaleString()} CFA).`);
      return;
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        navigate('/')
        return
      }

      const produitsPayload = selectedProducts.flatMap((p) => {
        const items = []
        if (p.quantity > 0) {
          items.push({
            produit_id: p.id,
            quantite: p.quantity,
            prix: p.price,
          })
        }
        p.conditionconfig.forEach((config) => {
          if (config.conditionedQuantity > 0) {
            items.push({
              produit_id: p.id,
              conditionnement_id: config.selectedConditioning._id['$oid'],
              quantite_conditionnement: config.conditionedQuantity,
            })
          }
        })
        return items
      })

      const basePayload = {
        produits: produitsPayload,
        statut_paiement,
        // Inclure la liste des paiements si ce n'est pas "Non payé"
        ...(statut_paiement !== 'non payé' && { paiements }),
        // Rétrocompatibilité : inclure aussi le premier mode de paiement et le montant total payé
        ...(statut_paiement !== 'non payé' && paiements.length > 0 && { methode_paiement: paiements[0].methode }),
        montant_paye,
        ristourne,
        dette_ancienne: is_dette_ancienne_active ? dette_ancienne : 0,
        relicat: statut_paiement === 'payé' ? relicat : 0,
      }

      const payload = { 
        ...basePayload,
        ...(clientId && { client_id: clientId })
      }

      console.log('>>> Payload envoyé :', payload)

      let response;
      if (editDeliveryId) {
        // Modification (PUT)
        response = await axios.put(`${API_URL}/livraisons/${editDeliveryId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      } else {
        // Création (POST)
        response = await axios.post(`${API_URL}/livraisons`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }

      if (response.status === 201 || response.status === 200) {
        const successText = response.data?.message || (editDeliveryId ? t('delivery.deliveryConfig.actionSuccessEdit') : t('delivery.deliveryConfig.actionSuccessNew'));
        message.success(successText);
        clearDelivery()
        clearProducts()
        await refreshProductsFromServer()
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        setTimeout(() => {
         navigate('/dashboard/delivery');
        }, 2000)
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement :', error)
      const errorMsg = error.response?.data?.error ? JSON.stringify(error.response.data.error) : t('delivery.deliveryConfig.actionErrorSave');
      message.error(errorMsg);
    }
  }

  const totalAPayer = totalAmount + (is_dette_ancienne_active ? dette_ancienne : 0);
  const isOverpaid = statut_paiement !== 'non payé' && montant_paye > totalAPayer;

  return (
    <>
      <button
        onClick={handleSaveDelivery}
        className={`w-full text-white py-3 rounded-md mb-4 ${
          selectedProducts.length === 0 || isOverpaid
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#0F172A] hover:bg-[#1e293b]'
        }`}
        disabled={selectedProducts.length === 0 || isOverpaid}
      >
        {editDeliveryId ? t('delivery.deliveryConfig.actionBtnEdit') : t('delivery.deliveryConfig.actionBtnNew')}
      </button>
      <Link to="/dashboard/delivery/new-delivery">
        <button className="flex items-center justify-center w-full text-[#0F172A] hover:text-[#0F172A]">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          {t('delivery.deliveryConfig.actionAddItems')}
        </button>
      </Link>
    </>
  )
}
