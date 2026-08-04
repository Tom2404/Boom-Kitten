const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:5000';

export async function refreshAccessToken(fetcher = fetch, apiUrl = API_URL) {
  try {
    const response = await fetcher(`${apiUrl}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.accessToken === 'string' && data.accessToken ? data.accessToken : null;
  } catch (_error) {
    return null;
  }
}

export async function endAuthSession(fetcher = fetch, apiUrl = API_URL) {
  try {
    await fetcher(`${apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch (_error) {
    // Local logout must still complete when the network is unavailable.
  }
}
