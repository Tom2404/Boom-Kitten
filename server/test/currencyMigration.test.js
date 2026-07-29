const test = require('node:test');
const assert = require('node:assert/strict');

const {
  GEM_CONVERSION_VERSION,
  summarizeGemConversions,
  planGemConversion,
} = require('../services/admin/currencyMigrationService');

test('plans a one-time 1:50 gem conversion without mutating the player', () => {
  const player = { _id: 'p1', coins: 125, gems: 7 };

  assert.deepEqual(planGemConversion(player), {
    userId: 'p1',
    version: GEM_CONVERSION_VERSION,
    gemsBefore: 7,
    coinsBefore: 125,
    coinsIssued: 350,
    coinsAfter: 475,
    shouldConvert: true,
  });
  assert.deepEqual(player, { _id: 'p1', coins: 125, gems: 7 });
});

test('dry-run summary reconciles affected users, retired gems, and issued Coin', () => {
  assert.deepEqual(summarizeGemConversions([
    { _id: 'a', coins: 10, gems: 2 },
    { _id: 'b', coins: 20, gems: 3 },
    { _id: 'c', coins: 30, gems: 0, currencyMigrationVersion: GEM_CONVERSION_VERSION },
  ]), {
    version: GEM_CONVERSION_VERSION,
    scannedUsers: 3,
    affectedUsers: 2,
    gemsRetired: 5,
    coinsIssued: 250,
    invalidUsers: [],
  });
});

test('dry-run reports invalid users without hiding valid reconciliation totals', () => {
  const summary = summarizeGemConversions([
    { _id: 'good', coins: 0, gems: 1 },
    { _id: 'bad', coins: 0, gems: -1 },
  ]);
  assert.equal(summary.affectedUsers, 1);
  assert.equal(summary.coinsIssued, 50);
  assert.deepEqual(summary.invalidUsers.map((row) => row.userId), ['bad']);
});

test('does not plan another conversion after the migration version was applied', () => {
  assert.deepEqual(planGemConversion({
    _id: 'p1',
    coins: 475,
    gems: 0,
    currencyMigrationVersion: GEM_CONVERSION_VERSION,
  }), {
    userId: 'p1',
    version: GEM_CONVERSION_VERSION,
    gemsBefore: 0,
    coinsBefore: 475,
    coinsIssued: 0,
    coinsAfter: 475,
    shouldConvert: false,
  });
});

test('rejects unsafe or negative balances instead of rounding migration money', () => {
  assert.throws(() => planGemConversion({ _id: 'p1', coins: 0, gems: -1 }), /gems/);
  assert.throws(() => planGemConversion({ _id: 'p1', coins: 0, gems: 1.5 }), /gems/);
  assert.throws(
    () => planGemConversion({ _id: 'p1', coins: Number.MAX_SAFE_INTEGER, gems: 1 }),
    /safe integer/,
  );
});
