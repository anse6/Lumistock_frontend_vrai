// src/utils/mapOrder.ts

import { Order, Produit } from './types';

export function mapOrderFromAPI(data: any): Order {
  return {
    id: data.id,
    livraison_id: data.id,
    clientInitials: data.client?.nom?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '',
    clientName: data.client?.nom || 'Client inconnu',
    telephone: data.client?.telephone || '',
    email: data.client?.email || '',
    ville: data.client?.ville || '',
    quartier: data.client?.quartier || '',
    produits: (data.produits || []).map((p: any): Produit => ({
      produit_id: p.produit_id,
      nom: p.nom,
      quantite: p.quantite,
      prix: p.prix,
      image: p.image,
      unite: p.unite,
      categorie: p.categorie || null,
      is_conditionne: p.is_conditionne,
      conditionnement_id: p.conditionnement_id,
      conditionnement_nom: p.conditionnement_nom, // ✅ ce champ est bien pris
      facteur: p.facteur,
      description: p.description,
    })),
    date: new Date(data.date_commande || data.created_at).toLocaleDateString(),
    montant_total: data.montant_total || 0,
    montant_paye: data.montant_paye || 0,
    montant_restant: data.montant_restant || 0,
    amount: data.montant_total || 0,
    quantity: data.quantite || 0,
    ristourne: data.ristourne || 0,
    relicat: data.relicat || 0,
    paymentStatus: data.statut_paiement || 'en attente',
    status: data.etat || 'validee',
    etat: data.etat || 'validee',
    livreur_id: data.livreur_id,
    client_id: data.client?.id || data.client_id || '',
    nom_livreur: data.nom_livreur || '',
    retour: data.retour || 0,
    notes: data.notes || '',
  };
}
