// Authentication hook for reading/storing current token locally.
import { useMemo, useState } from 'react';

export function useAuth() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') ?? '');

  const api = useMemo(
    () => ({
      accessToken,
      setToken: (token) => {
        localStorage.setItem('accessToken', token);
        window.dispatchEvent(new Event('auth:changed'));
        setAccessToken(token);
      },
      clearToken: () => {
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('auth:changed'));
        setAccessToken('');
      },
    }),
    [accessToken],
  );

  return api;
}
