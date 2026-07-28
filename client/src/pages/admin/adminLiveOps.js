export const SAFE_LIVE_OPS_FALLBACK = Object.freeze({
  maintenanceMode: false,
  maxActiveRooms: 500,
  rewardMultiplier: 1,
  features: Object.freeze({ shop: true, missions: true, tournaments: true }),
});

export async function fetchPublicLiveOpsConfig(fetcher = fetch, apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000') {
  try {
    const response = await fetcher(`${apiUrl}/api/live-ops/config`);
    if (!response.ok) throw new Error('Live Ops unavailable');
    const runtime = (await response.json())?.data;
    if (!runtime?.config || runtime.schemaVersion !== 1) throw new Error('Incompatible Live Ops schema');
    return runtime;
  } catch {
    return {
      schemaVersion: 1,
      version: 0,
      stateVersion: 0,
      config: { ...SAFE_LIVE_OPS_FALLBACK, features: { ...SAFE_LIVE_OPS_FALLBACK.features } },
      fallback: true,
    };
  }
}
