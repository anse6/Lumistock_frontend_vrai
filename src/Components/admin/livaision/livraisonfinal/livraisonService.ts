// Modules/Livraisons/livraisonService.ts
import axios from 'axios';
import { Order } from './types';
import { getUrlServer } from '../../../../configServer';
import { apiVente } from '../venteRole';

// URL de l'API
export const fetchLivraisons = async (): Promise<Order[]> => {
  try {
    const token = localStorage.getItem('access_token');

    // Admin / manager : ventes du magasin ; caissier : ses propres ventes.
    const response = await axios.get(apiVente().liste, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(response.data)
    return response.data; // Ensure a value is returned on success
  } catch (error) {
    console.error('Error fetching livraisons:', error);
    return []; // Return an empty array or handle the error appropriately
  }
};

export const fetchLivraisonsByPaymentMethod = async (method: string, periode = ""): Promise<{ total_general: number, livraisons: any[] }> => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${getUrlServer()}/livraisons/par-methode-paiement/${method}`, {
      params: periode ? { periode } : undefined,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching livraisons for method ${method}:`, error);
    return { total_general: 0, livraisons: [] };
  }
};