const test = require('node:test');
const assert = require('node:assert/strict');

const {
  STAKE_TIERS,
  allocateWagerPot,
  assertWagerTransition,
  buildLockedParticipants,
  validateStake,
} = require('../services/wagerService');

test('accepts only the fixed non-negative stake tiers', () => {
  assert.deepEqual(STAKE_TIERS, [0, 10, 25, 50, 100]);
  for (const amount of STAKE_TIERS) assert.equal(validateStake(amount), amount);
  for (const amount of [-1, 1, 15, 100.5, 10000000, '50']) {
    assert.throws(() => validateStake(amount), /stake/i);
  }
});

test('allows only safe forward wager state transitions and terminal retries', () => {
  assert.equal(assertWagerTransition('created', 'locked'), 'locked');
  assert.equal(assertWagerTransition('locked', 'settled'), 'settled');
  assert.equal(assertWagerTransition('locked', 'refunded'), 'refunded');
  assert.equal(assertWagerTransition('settled', 'settled'), 'settled');
  assert.throws(() => assertWagerTransition('created', 'settled'), /transition/i);
  assert.throws(() => assertWagerTransition('settled', 'refunded'), /transition/i);
});

test('builds a unique authenticated lock set and rejects guests or duplicate users', () => {
  assert.deepEqual(buildLockedParticipants([{ userId: 'a' }, { userId: 'b' }], 25), [
    { userId: 'a', lockedCoins: 25, payoutCoins: 0 },
    { userId: 'b', lockedCoins: 25, payoutCoins: 0 },
  ]);
  assert.throws(() => buildLockedParticipants([{ userId: 'guest-a' }, { userId: 'b' }], 25), /authenticated/i);
  assert.throws(() => buildLockedParticipants([{ userId: 'a' }, { userId: 'a' }], 25), /duplicate/i);
});

test('awards the complete pot to first place in two and three player games', () => {
  assert.deepEqual(allocateWagerPot([
    { userId: 'winner', placement: 1 },
    { userId: 'loser', placement: 2 },
  ], 25), [
    { userId: 'winner', placement: 1, payout: 50 },
    { userId: 'loser', placement: 2, payout: 0 },
  ]);

  assert.equal(
    allocateWagerPot([
      { userId: 'one', placement: 1 },
      { userId: 'two', placement: 2 },
      { userId: 'three', placement: 3 },
    ], 10).reduce((sum, row) => sum + row.payout, 0),
    30,
  );
});

test('splits four and five player pots without rounding loss', () => {
  const four = allocateWagerPot([
    { userId: 'one', placement: 1 },
    { userId: 'two', placement: 2 },
    { userId: 'three', placement: 3 },
    { userId: 'four', placement: 4 },
  ], 25);
  assert.deepEqual(four.map((row) => row.payout), [70, 30, 0, 0]);

  const five = allocateWagerPot([
    { userId: 'one', placement: 1 },
    { userId: 'two', placement: 2 },
    { userId: 'three', placement: 3 },
    { userId: 'four', placement: 4 },
    { userId: 'five', placement: 5 },
  ], 10);
  assert.deepEqual(five.map((row) => row.payout), [31, 12, 7, 0, 0]);
  assert.equal(five.reduce((sum, row) => sum + row.payout, 0), 50);
});

test('rejects duplicate players, duplicate placements, and unsupported table sizes', () => {
  assert.throws(() => allocateWagerPot([{ userId: 'one', placement: 1 }], 10), /2 to 5/);
  assert.throws(() => allocateWagerPot([
    { userId: 'one', placement: 1 },
    { userId: 'one', placement: 2 },
  ], 10), /duplicate user/i);
  assert.throws(() => allocateWagerPot([
    { userId: 'one', placement: 1 },
    { userId: 'two', placement: 1 },
  ], 10), /duplicate placement/i);
});
