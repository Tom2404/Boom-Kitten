const test = require('node:test');
const assert = require('node:assert/strict');
const { RANK_ORDER, applyTierProtection, getRankFromElo, getTierFloor } = require('../utils/rankSystem');

test('rank order uses 2/3/3/4/4 subdivisions and Legend', () => {
  assert.deepEqual(RANK_ORDER, [
    'Bronze II', 'Bronze I',
    'Silver III', 'Silver II', 'Silver I',
    'Gold III', 'Gold II', 'Gold I',
    'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I',
    'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I',
    'Legend',
  ]);
});

test('getRankFromElo follows the approved tier thresholds', () => {
  assert.equal(getRankFromElo(1000), 'Bronze II');
  assert.equal(getRankFromElo(1100), 'Bronze I');
  assert.equal(getRankFromElo(1200), 'Silver III');
  assert.equal(getRankFromElo(1300), 'Silver II');
  assert.equal(getRankFromElo(1400), 'Silver I');
  assert.equal(getRankFromElo(1500), 'Gold III');
  assert.equal(getRankFromElo(1600), 'Gold II');
  assert.equal(getRankFromElo(1700), 'Gold I');
  assert.equal(getRankFromElo(1800), 'Platinum IV');
  assert.equal(getRankFromElo(2100), 'Platinum I');
  assert.equal(getRankFromElo(2200), 'Diamond IV');
  assert.equal(getRankFromElo(2500), 'Diamond I');
  assert.equal(getRankFromElo(2600), 'Legend');
});

test('getTierFloor returns the entry ELO for tier protection', () => {
  assert.equal(getTierFloor('Silver II'), 1200);
  assert.equal(getTierFloor('Platinum IV'), 1800);
  assert.equal(getTierFloor('Legend'), 2600);
});

test('promotion grants a three-game floor at the new tier', () => {
  assert.deepEqual(applyTierProtection({ eloBefore: 1190, eloAfter: 1210, protectionGames: 0, protectedFloor: 0 }), {
    eloAfter: 1210,
    protectionGames: 3,
    protectedFloor: 1200,
  });
});

test('active tier protection clamps losses and consumes one protected game', () => {
  assert.deepEqual(applyTierProtection({ eloBefore: 1220, eloAfter: 1185, protectionGames: 3, protectedFloor: 1200 }), {
    eloAfter: 1200,
    protectionGames: 2,
    protectedFloor: 1200,
  });
});
