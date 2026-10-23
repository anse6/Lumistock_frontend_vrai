// src/api/livraisonApi.ts
import { getUrlServer } from '../../../configServer';
import { useLivraisonStore } from "../stores/livraisonstore";

interface LivraisonPayload {
  client_id: string;
  produits: {
    produit_id: string;
    nom: string;
    quantite: number;
    prix: number;
  }[];
  statut_paiement: string;
}

export const postLivraison = async (token: string): Promise<string> => {
  const { clientId, produits, statutPaiement } = useLivraisonStore.getState();

  const payload: LivraisonPayload = {
    client_id: clientId,
    produits: produits.map(p => ({
      produit_id: p.id,
      nom: p.nom,   
      quantite: p.quantite,
      prix: p.prix
    })),
    statut_paiement: statutPaiement === 'total' ? 'payé' : 'non payé'
  };
  console.log("payload", payload)
  const response = await fetch(`${getUrlServer()}/livraisons`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    
    body: JSON.stringify(payload)
  });

  if (response.status === 401) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  return 'Livraison enregistrée avec succès.';
};
