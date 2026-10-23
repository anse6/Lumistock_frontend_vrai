import axios from "axios";
import { getUrlServer } from "../../../../configServer";
import { Client } from './types';

const API_URL = `${getUrlServer()}/clients/livreur/`;

export const fetchClientsByLivreur = async (): Promise<Client[]> => {
  try {
    const token = localStorage.getItem('access_token');

    const response = await axios.get(`${API_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const clients = response.data.map((client: any) => ({
      id: client.client_id,
      initials: client.nom?.charAt(0).toUpperCase() ?? 'C',
      backgroundColor: 'bg-green-100', // tu peux personnaliser ça
      textColor: 'text-green-600',
      name: client.nom,
      phone: client.telephone,
      location: `${client.quartier}, ${client.ville}`,
      command: client.nombre_livraisons,
      amount: `${client.montant_total.toLocaleString()} cfa`,
    }));

    return clients;
  } catch (error) {
    console.error('Erreur lors du chargement des clients :', error);
    return [];
  }
};
