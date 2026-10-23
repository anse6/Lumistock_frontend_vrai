import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
}

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => {
      const token = localStorage.getItem('access_token');
      return axios.post(`${API_URL}/clients/create`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};



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