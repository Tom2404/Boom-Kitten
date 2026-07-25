import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLiveOpsCriticalPayload, buildLiveOpsDraftPayload, fetchPublicLiveOpsConfig } from '../src/pages/admin/adminLiveOps.js';

test('live ops draft payload normalizes schema values and audit context', () => {
  const payload = buildLiveOpsDraftPayload({ maintenanceMode: 1, maxActiveRooms: '25', rewardMultiplier: '1.5', features: { shop: true, missions: false, tournaments: true } }, ' Draft ', 'req-1');
  assert.equal(payload.config.maxActiveRooms, 25);
  assert.equal(payload.config.rewardMultiplier, 1.5);
  assert.equal(payload.reason, 'Draft');
  assert.equal(payload.requestId, 'req-1');
});

test('critical live ops payload includes optimistic state and current-admin confirmation', () => {
  const payload = buildLiveOpsCriticalPayload({ expectedVersion: 2, expectedStateVersion: 4, reason: ' Publish ', confirmationUsername: 'root', requestId: 'req-2' });
  assert.equal(payload.expectedStateVersion, 4);
  assert.equal(payload.confirmation.username, 'root');
});

test('public live ops reader falls back safely when network or schema is unavailable', async () => {
  const fallback = await fetchPublicLiveOpsConfig(async () => { throw new Error('offline'); }, 'http://test');
  assert.equal(fallback.fallback, true);
  assert.equal(fallback.config.maintenanceMode, false);
  assert.equal(fallback.config.features.shop, true);
});
