import { useCallback, useMemo } from 'react';
import { getAdminToken } from './utils.js';

export function useAdminApi() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
  const token = getAdminToken();

  const request = useCallback(
    async (endpoint, options = {}) => {
      if (!token) return { ok: false, error: 'No admin token' };

      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
          },
        });
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        return { ok: response.ok, status: response.status, data };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
    [apiUrl, token],
  );

  return useMemo(() => ({ request, token }), [request, token]);
}
