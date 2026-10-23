// services/orders.ts ou dans ton composant
import axios from 'axios';
import { Order } from './types';

// Cette fonction mappe les données du backend au format attendu par le frontend
export function mapBackendOrderToFrontend(data: any): Order {
  return {
    id: data.id,
    livraison_id: data.livraison_id,
    livreur_id: data.livreur_id,
    montant_total: data.montant_total,
    montant_produits: data.montant_produits ?? 0,
    montant_paye: data.montant_paye,
    montant_restant: data.montant_restant,
    ristourne: data.ristourne,
    relicat: data.relicat,
    status: data.etat || 'validee',
    etat: data.etat || 'validee',
    paymentStatus: data.statut_paiement,
    amount: data.montant_total,
    date: data.date_commande,
    quantity: data.quantite,
    notes: data.notes,
    email: data.client?.email,
    telephone: data.client?.telephone,
    clientName: data.client?.nom,
    clientInitials: data.client?.nom?.substring(0, 2).toUpperCase() || '',
    nom_livreur: data.nom_livreur ?? '',
    retour: data.retour ?? 0,
    client: {
      nom: data.client?.nom ?? '',
      email: data.client?.email,
      telephone: data.client?.telephone,
      quartier: data.client?.quartier,
      ville: data.client?.ville,
    },
    produits: data.produits.map((prod: any) => ({
      produit_id: prod.produit_id,
      nom: prod.nom,
      quantite: prod.quantite,
      prix: prod.prix,
      categorie: prod.categorie,
      unite: prod.unite,
      image: prod.image,
      is_conditionne: prod.is_conditionne,
      conditionnement_id: prod.conditionnement_id,
      conditionnement_nom: prod.conditionnement_nom,
      facteur: prod.facteur,
    })),
  };
}

// Exemple d'utilisation avec useQuery
import { useQuery } from '@tanstack/react-query';

export function useOrder(orderId: string) {
  return useQuery({ queryKey: ['order', orderId], queryFn: async () => {
    const res = await axios.get(`/api/commande/${orderId}`);
    return mapBackendOrderToFrontend(res.data);
  } });
}
