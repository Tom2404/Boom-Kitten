import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchPublicLiveOpsConfig } from '../src/pages/admin/adminLiveOps.js';

test('public live ops reader keeps a safe fallback after admin controls are removed', async () => {
  const runtime = await fetchPublicLiveOpsConfig(async () => ({ ok: false }), 'http://test');

  assert.equal(runtime.fallback, true);
  assert.equal(runtime.config.maintenanceMode, false);
  assert.equal(runtime.config.features.tournaments, true);
});
