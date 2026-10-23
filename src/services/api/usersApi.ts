import { useCallback, useState } from 'react';
import { getUrlServer } from '../../configServer';

type MutationResult = { isLoading: boolean };
type ApiResponse = { message?: string };
type Trigger = (userId: string) => { unwrap: () => Promise<ApiResponse> };

const useUserStatusMutation = (endpoint: 'activate-user' | 'deactivate-user'): readonly [Trigger, MutationResult] => {
  const [isLoading, setIsLoading] = useState(false);

  const trigger = useCallback((userId: string) => ({
    unwrap: async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${getUrlServer()}/users/${endpoint}/${userId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || 'Impossible de modifier le statut');
        return data || {};
      } finally {
        setIsLoading(false);
      }
    },
  }), [endpoint]);

  return [trigger, { isLoading }] as const;
};

export const useActivateUserMutation = () => useUserStatusMutation('activate-user');
export const useDeactivateUserMutation = () => useUserStatusMutation('deactivate-user');
