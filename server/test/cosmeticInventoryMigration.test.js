const test = require('node:test');
const assert = require('node:assert/strict');

const {
  COSMETIC_INVENTORY_MIGRATION_VERSION,
  planCosmeticInventoryMigration,
  summarizeCosmeticInventoryMigration,
} = require('../services/cosmeticInventoryMigrationService');

test('maps legacy avatar frame names to stable item ids and active equipment', () => {
  const plan = planCosmeticInventoryMigration({
    _id: 'user-1',
    ownedAvatarFrames: ['Gold Frame'],
    activeAvatarFrame: 'Gold Frame',
    ownedItemIds: [],
    equippedCosmetics: {},
  }, [
    { _id: 'frame-1', type: 'avatar_frame', name: 'Gold Frame' },
  ]);

  assert.deepEqual(plan.ownedItemIds, ['frame-1']);
  assert.equal(plan.avatarFrameId, 'frame-1');
  assert.equal(plan.shouldUpdate, true);
  assert.deepEqual(plan.issues, []);
  assert.equal(plan.version, COSMETIC_INVENTORY_MIGRATION_VERSION);
});

test('migration is idempotent and never guesses duplicate catalog names', () => {
  const items = [
    { _id: 'frame-1', type: 'avatar_frame', name: 'Gold Frame' },
    { _id: 'frame-2', type: 'avatar_frame', name: 'Gold Frame' },
  ];
  const ambiguous = planCosmeticInventoryMigration({
    _id: 'user-1',
    ownedAvatarFrames: ['Gold Frame'],
    activeAvatarFrame: 'Gold Frame',
    ownedItemIds: [],
    equippedCosmetics: {},
  }, items);
  assert.deepEqual(ambiguous.ownedItemIds, []);
  assert.equal(ambiguous.avatarFrameId, null);
  assert.equal(ambiguous.shouldUpdate, false);
  assert.deepEqual(ambiguous.issues.map((issue) => issue.reason), ['ambiguous']);

  const migrated = planCosmeticInventoryMigration({
    _id: 'user-2',
    ownedAvatarFrames: ['Blue Frame'],
    activeAvatarFrame: 'Blue Frame',
    ownedItemIds: ['frame-3'],
    equippedCosmetics: { avatarFrame: 'frame-3' },
    cosmeticInventoryMigrationVersion: COSMETIC_INVENTORY_MIGRATION_VERSION,
  }, [{ _id: 'frame-3', type: 'avatar_frame', name: 'Blue Frame' }]);
  assert.equal(migrated.shouldUpdate, false);
});

test('an active legacy frame also becomes owned when its legacy ownership list is incomplete', () => {
  const plan = planCosmeticInventoryMigration({
    _id: 'user-1',
    ownedAvatarFrames: [],
    activeAvatarFrame: 'Gold Frame',
    ownedItemIds: [],
    equippedCosmetics: {},
  }, [{ _id: 'frame-1', type: 'avatar_frame', name: 'Gold Frame' }]);

  assert.deepEqual(plan.ownedItemIds, ['frame-1']);
  assert.equal(plan.avatarFrameId, 'frame-1');
});

test('summary reports updates and unresolved legacy ownership', () => {
  const summary = summarizeCosmeticInventoryMigration([
    {
      _id: 'user-1',
      ownedAvatarFrames: ['Missing Frame'],
      activeAvatarFrame: '',
      ownedItemIds: [],
      equippedCosmetics: {},
    },
    {
      _id: 'user-2',
      ownedAvatarFrames: ['Blue Frame'],
      activeAvatarFrame: '',
      ownedItemIds: [],
      equippedCosmetics: {},
    },
  ], [{ _id: 'frame-3', type: 'avatar_frame', name: 'Blue Frame' }]);

  assert.equal(summary.totalUsers, 2);
  assert.equal(summary.usersToUpdate, 1);
  assert.equal(summary.ownershipLinksToAdd, 1);
  assert.deepEqual(summary.equipmentChanges, []);
  assert.equal(summary.issues.length, 1);
  assert.equal(summary.issues[0].reason, 'missing');
});
