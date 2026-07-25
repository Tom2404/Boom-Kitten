const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_LIVE_OPS_CONFIG,
  getRuntimeLiveOpsConfig,
  invalidateLiveOpsCache,
  publishLiveOpsConfig,
  rollbackLiveOpsConfig,
  normalizeLiveOpsConfig,
  validateLiveOpsConfig,
} = require('../services/admin/liveOpsService');

test('live ops schema validates supported controls and rejects unknown or unsafe values', () => {
  assert.equal(validateLiveOpsConfig({ maintenanceMode: false, maxActiveRooms: 100, rewardMultiplier: 1.5, features: { shop: true, missions: true, tournaments: false } }).valid, true);
  const invalid = validateLiveOpsConfig({ maintenanceMode: 'no', maxActiveRooms: 0, rewardMultiplier: 12, features: { shop: true, missions: true, tournaments: true, surprise: true }, unknown: true });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 4);
  assert.throws(() => normalizeLiveOpsConfig({}), (error) => error.code === 'VALIDATION_ERROR' && error.statusCode === 422);
});

test('runtime config uses the published compatible version and safe fallback otherwise', async () => {
  invalidateLiveOpsCache();
  const runtime = await getRuntimeLiveOpsConfig({
    StateModel: { findOne: () => ({ lean: async () => ({ activeConfigId: 'c1', activeVersion: 3, stateVersion: 2 }) }) },
    ConfigModel: { findById: () => ({ lean: async () => ({ _id: 'c1', version: 3, schemaVersion: 1, config: { maintenanceMode: true, maxActiveRooms: 20, rewardMultiplier: 2, features: { shop: false, missions: true, tournaments: true } } }) }) },
    now: 100, cacheMs: 0,
  });
  assert.equal(runtime.version, 3);
  assert.equal(runtime.config.maintenanceMode, true);
  assert.equal(runtime.fallback, false);

  invalidateLiveOpsCache();
  const fallback = await getRuntimeLiveOpsConfig({ StateModel: { findOne: () => ({ lean: async () => null }) }, ConfigModel: {}, now: 200, cacheMs: 0 });
  assert.equal(fallback.fallback, true);
  assert.deepEqual(fallback.config.features, DEFAULT_LIVE_OPS_CONFIG.features);
});

test('publish requires a validated immutable config and atomically advances the active pointer', async () => {
  let stateFilter;
  const config = { _id: 'c2', version: 2, config: { maintenanceMode: false, maxActiveRooms: 50, rewardMultiplier: 1, features: { shop: true, missions: true, tournaments: true } } };
  const result = await publishLiveOpsConfig({
    ConfigModel: { findOne: async (filter) => { assert.equal(filter.status, 'validated'); return config; }, findOneAndUpdate: async () => config },
    StateModel: { findOneAndUpdate: async (filter) => { stateFilter = filter; return { activeVersion: 2, stateVersion: 4 }; } },
    audit: async () => ({}), actor: { id: 'a1', username: 'root' }, configId: 'c2', expectedVersion: 0, expectedStateVersion: 3,
    mutation: { reason: 'Publish approved', requestId: 'pub-1' },
  });
  assert.equal(stateFilter.stateVersion, 3);
  assert.equal(result.state.activeVersion, 2);
});

test('publish state conflict leaves the validated draft retryable', async () => {
  let configUpdates = 0;
  await assert.rejects(() => publishLiveOpsConfig({
    ConfigModel: { findOne: async () => ({ _id: 'c2', version: 2 }), findOneAndUpdate: async () => { configUpdates += 1; } },
    StateModel: { findOneAndUpdate: async () => null }, audit: async () => ({}), actor: { id: 'a1' }, configId: 'c2', expectedVersion: 0, expectedStateVersion: 4,
    mutation: { reason: 'Publish', requestId: 'pub-conflict' },
  }), (error) => error.code === 'STATE_CONFLICT');
  assert.equal(configUpdates, 0);
});

test('rollback creates a new monotonic published version from a historical version', async () => {
  let created;
  const query = (value) => ({ lean: async () => value });
  const configModel = {
    findOne: (filter = {}) => filter.version ? query({ _id: 'old', version: 2, status: 'published', config: { maintenanceMode: false, maxActiveRooms: 10, rewardMultiplier: 1, features: { shop: true, missions: true, tournaments: false } } }) : ({ sort: () => ({ select: () => query({ version: 5 }) }) }),
    create: async (value) => { created = { _id: 'rollback', ...value }; return created; },
  };
  const result = await rollbackLiveOpsConfig({ ConfigModel: configModel, StateModel: { findOneAndUpdate: async () => ({ activeVersion: 6, stateVersion: 8 }) }, audit: async () => ({}), actor: { id: 'a1', username: 'root' }, targetVersion: 2, expectedStateVersion: 7, mutation: { reason: 'Rollback incident', requestId: 'rb-1' } });
  assert.equal(created.version, 6);
  assert.equal(created.rollbackOf, 2);
  assert.equal(result.state.stateVersion, 8);
});
