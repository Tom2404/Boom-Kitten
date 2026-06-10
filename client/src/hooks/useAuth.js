// Authentication hook for reading/storing current token locally.
import { useMemo, useState } from 'react';

export function useAuth() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') ?? '');

  const api = useMemo(
    () => ({
      accessToken,
      setToken: (token) => {
        localStorage.setItem('accessToken', token);
        setAccessToken(token);
      },
      clearToken: () => {
        localStorage.removeItem('accessToken');
        setAccessToken('');
      },
    }),
    [accessToken],
  );

  return api;
}
