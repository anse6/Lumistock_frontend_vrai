// Modules/Produits/productService.ts
import axios from 'axios';
import { Product } from './types';
import { getUrlServer } from '../../configServer';
// 

// URL de l'API
//const API_URL = getUrlServer() + "/produits/magasin/"
const API_URL = `${getUrlServer()}/produits/magasin/`;
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const token = localStorage.getItem('access_token');

    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });


    return response.data.map((item: {
      _id: string;
      image?: string | null;
      nom: string;
      description: string;
      categorie_nom: string;
      quantite_initiale: number;
      quantite: number;
      prix: number;
      etat: string;
    }) => ({
      id: item._id,
      image: item.image ?? '',
      name: item.nom,
      description: item.description,
      category: item.categorie_nom,
      quantity: item.quantite_initiale,
      quantityRemaining: item.quantite,
      price: `${item.prix} CFA`,
      status: item.etat === 'en stock' ? 'En stock' : 'En rupture'
    }));
  } catch (error) {
    console.error('Erreur lors du chargement des produits :', error);
    return [];
  }
};
export const retourStockMagasin = async (produits: { produit_id: string; quantite: number }[]): Promise<boolean> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    const response = await axios.post(`${getUrlServer()}/stock-livreur/retour-magasin`, { produits }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error('Erreur lors du retour de stock au magasin :', error);
    return false;
  }
};
