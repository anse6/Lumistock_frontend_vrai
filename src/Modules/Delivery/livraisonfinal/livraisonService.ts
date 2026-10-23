// Modules/Livraisons/livraisonService.ts
import axios from 'axios';
import { Order } from './types';
import { getUrlServer } from '../../../configServer';

// URL de l'API
const API_URL = `${getUrlServer()}/livraisons`;

export const fetchLivraisons = async (): Promise<Order[]> => {
  try {
    const token = localStorage.getItem('access_token');

    const response = await axios.get(API_URL, {
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