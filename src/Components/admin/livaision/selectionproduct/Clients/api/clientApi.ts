import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getUrlServer } from '../../../../../../configServer';

const API_URL = getUrlServer () 

export interface Client {
  _id?: string;
  nom: string;
  telephone: string;
  email: string;
  ville: string;
  quartier: string;
  photo_profil?: string | null;
  montant_en_caisse?: number;
}

/** Client par défaut « Autres » du magasin : le client de passage, inconnu. */
export const estClientDePassage = (client?: Pick<Client, "nom" | "telephone" | "email"> | null) =>
  !!client && client.nom === "Autres" && (client.telephone === "00000000" || client.email === "autres@lumistock.com");

export const useGetClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }
      
      const response = await axios.get(`${API_URL}/clients/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,// Réessaye une fois en cas d'échec
    //refetchOnWindowFocus: true, 
    refetchOnMount: true 
  });
};