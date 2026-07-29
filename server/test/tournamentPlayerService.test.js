const test = require('node:test');
const assert = require('node:assert/strict');

const { publicTournament, refundCancelledTournamentEntries, validatePlayerRegistration } = require('../services/tournamentPlayerService');

test('player tournament projection exposes Coin and cosmetics without Elo, gems, or payout internals', () => {
  const projected = publicTournament({
    _id: 't1', name: 'Cup', status: 'registration', entryFee: 25,
    minEloRequired: 2000, prizePool: { coins: 500, gems: 10 },
    cosmeticRewards: [{ rank: 1, type: 'skin', itemId: 'champion' }],
    payoutPreviewToken: 'secret', registeredCount: 2, maxParticipants: 8,
  });
  assert.deepEqual(projected.prizePool, { coins: 500 });
  assert.equal(projected.minEloRequired, undefined);
  assert.equal(projected.payoutPreviewToken, undefined);
  assert.deepEqual(projected.cosmeticRewards, [{ rank: 1, type: 'skin', itemId: 'champion' }]);
});

test('registration checks state, capacity, close time, and Coin only', () => {
  const tournament = { status: 'registration', registeredCount: 2, maxParticipants: 8, entryFee: 25, registrationClosesAt: new Date('2030-01-02') };
  assert.equal(validatePlayerRegistration(tournament, { coins: 25 }, new Date('2030-01-01')), true);
  assert.throws(() => validatePlayerRegistration(tournament, { coins: 24 }, new Date('2030-01-01')), /Coin/i);
  assert.throws(() => validatePlayerRegistration({ ...tournament, registeredCount: 8 }, { coins: 100 }, new Date('2030-01-01')), /đầy/i);
  assert.throws(() => validatePlayerRegistration(tournament, { coins: 100 }, new Date('2030-01-03')), /đăng ký/i);
});

test('cancellation refunds each paid entry atomically and records Coin transactions', async () => {
  const transactions = [];
  const session = {
    withTransaction: async (work) => work(),
    endSession: async () => {},
  };
  const result = await refundCancelledTournamentEntries({
    tournamentId: 't1',
    requestId: 'cancel-1',
    TournamentModel: { findById: async () => ({ _id: 't1', name: 'Cup', status: 'cancelled' }) },
    ParticipantModel: {
      find: () => ({ select() { return this; }, lean: async () => [{ _id: 'p1' }] }),
      findOneAndUpdate: async () => ({ _id: 'p1', userId: 'u1', entryFeePaid: 75 }),
    },
    UserModel: { findByIdAndUpdate: async () => ({ _id: 'u1', coins: 125 }) },
    TransactionModel: { create: async (rows) => transactions.push(...rows) },
    startSession: async () => session,
  });
  assert.deepEqual(result, { refunded: 1 });
  assert.equal(transactions[0].type, 'tournament_refund');
  assert.equal(transactions[0].balanceAfter, 200);
});
