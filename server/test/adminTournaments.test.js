const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildTournamentPayoutPreview,
  createTournamentPayoutPreview,
  executeTournamentPayout,
  getNextTournamentStatus,
  registerTournamentParticipant,
  transitionTournament,
  validateTournamentInput,
} = require('../services/admin/tournamentService');

function queryResult(rows) {
  return { populate() { return this; }, sort() { return this; }, lean: async () => rows };
}

test('tournament input validates times, fees, capacity, and prize values at the boundary', () => {
  const input = validateTournamentInput({
    name: 'July Cup', entryFee: 100, maxParticipants: 8,
    prizePool: { coins: 1000 }, cosmeticRewards: [{ rank: 1, type: 'skin', itemId: 'champion' }], startTime: '2026-07-25T12:00:00Z', registrationClosesAt: '2026-07-25T11:00:00Z',
  }, new Date('2026-07-22T00:00:00Z'));
  assert.equal(input.maxParticipants, 8);
  assert.equal(input.startTime.toISOString(), '2026-07-25T12:00:00.000Z');
  assert.throws(() => validateTournamentInput({ name: 'Bad', entryFee: -1, startTime: 'invalid' }), (error) => error.code === 'VALIDATION_ERROR');
});

test('tournament state machine allows only approved forward transitions', () => {
  assert.equal(getNextTournamentStatus('registration', 'active'), 'active');
  assert.throws(() => getNextTournamentStatus('active', 'completed'), (error) => error.code === 'STATE_CONFLICT');
  assert.equal(getNextTournamentStatus('registration', 'cancelled'), 'cancelled');
  assert.throws(() => getNextTournamentStatus('completed', 'active'), (error) => error.code === 'STATE_CONFLICT');
});

test('payout preview allocates the complete pool by final rank with no rounding loss', () => {
  const preview = buildTournamentPayoutPreview(
    { _id: 't1', prizePool: { coins: 101 }, cosmeticRewards: [{ rank: 1, type: 'skin', itemId: 'champion' }] },
    [{ _id: 'p1', userId: { _id: 'u1', username: 'one' }, finalRank: 1 }, { _id: 'p2', userId: { _id: 'u2', username: 'two' }, finalRank: 2 }, { _id: 'p3', userId: { _id: 'u3', username: 'three' }, finalRank: 3 }],
  );
  assert.equal(preview.rows.reduce((sum, row) => sum + row.coins, 0), 101);
  assert.deepEqual(preview.rows[0].cosmetics, [{ type: 'skin', itemId: 'champion' }]);
  assert.deepEqual(preview.rows.map((row) => row.rank), [1, 2, 3]);
});

test('registration claims capacity, charges the configured fee, and records payment', async () => {
  const tournament = { _id: 't1', status: 'registration', entryFee: 75, maxParticipants: 8, registeredCount: 0, registrationClosesAt: new Date('2026-07-30T00:00:00Z') };
  const user = { _id: 'u1', username: 'cat', coins: 200, __v: 0 };
  let userUpdate;
  let transaction;
  let participantUpdate;
  const participant = await registerTournamentParticipant({
    TournamentModel: { findById: async () => tournament, findOneAndUpdate: async () => ({ ...tournament, registeredCount: 1 }) },
    ParticipantModel: { create: async (value) => ({ _id: 'p1', ...value }), findByIdAndUpdate: async (_id, update) => { participantUpdate = update; return { _id: 'p1', ...update.$set }; } },
    UserModel: { findById: async () => user, findOneAndUpdate: async (_filter, update) => { userUpdate = update; return { ...user, coins: 125 }; } },
    TransactionModel: { create: async (value) => { transaction = value; } },
    audit: async () => ({}),
    actor: { id: 'admin-1', username: 'ops', role: 'operator' }, tournamentId: 't1', userId: 'u1',
    mutation: { reason: 'Approved registration', requestId: 'register-1' }, now: new Date('2026-07-22T00:00:00Z'),
  });
  assert.equal(userUpdate.$inc.coins, -75);
  assert.equal(transaction.amount, 75);
  assert.equal(transaction.type, 'tournament_entry');
  assert.equal(participantUpdate.$set.paymentStatus, 'paid');
  assert.equal(participant.paymentStatus, 'paid');
});

test('starting a tournament creates a bracket and uses optimistic state versioning', async () => {
  const tournament = { _id: 't1', status: 'registration', stateVersion: 2, toObject() { return { _id: this._id, status: this.status, stateVersion: this.stateVersion }; } };
  let updateFilter;
  const participants = Array.from({ length: 8 }, (_, index) => ({
    _id: `p${index + 1}`,
    userId: { _id: `u${index + 1}`, username: `player-${index + 1}` },
    registrationDate: new Date(`2026-07-22T00:00:0${index}Z`),
  }));
  const updated = await transitionTournament({
    TournamentModel: { findById: async () => tournament, findOneAndUpdate: async (filter, update) => { updateFilter = filter; return { ...tournament, ...update.$set, stateVersion: 3 }; } },
    ParticipantModel: { find: () => queryResult(participants) }, audit: async () => ({}),
    actor: { id: 'admin-1', username: 'ops', role: 'operator' }, tournamentId: 't1', nextStatus: 'active', expectedVersion: 2,
    mutation: { reason: 'Start approved', requestId: 'transition-1' },
  });
  assert.equal(updateFilter.stateVersion, 2);
  assert.equal(updated.status, 'active');
  assert.deepEqual(updated.bracket.rounds.map((round) => round.matches.length), [3, 3, 5]);
});

test('payout preview freezes recipients behind an expiring token and optimistic version', async () => {
  const tournament = { _id: 't1', name: 'Cup', status: 'completed', stateVersion: 4, payoutState: 'pending', prizePool: { coins: 100 } };
  const participants = [{ _id: 'p1', userId: { _id: 'u1', username: 'one' }, finalRank: 1 }];
  let updateFilter;
  const preview = await createTournamentPayoutPreview({
    TournamentModel: {
      findById: async () => tournament,
      findOneAndUpdate: async (filter, update) => { updateFilter = filter; return { ...tournament, ...update.$set, stateVersion: 5 }; },
    },
    ParticipantModel: { find: () => queryResult(participants) },
    audit: async () => ({}), tokenFactory: () => 'preview-token',
    actor: { id: 'admin-1', username: 'root' }, tournamentId: 't1', expectedVersion: 4,
    mutation: { reason: 'Approve payout preview', requestId: 'preview-1' }, now: new Date('2026-07-22T00:00:00Z'),
  });
  assert.equal(updateFilter.stateVersion, 4);
  assert.equal(preview.previewToken, 'preview-token');
  assert.equal(preview.totals.coins, 100);
  assert.equal(preview.stateVersion, 5);
});

test('payout execution credits every recipient once and finalizes the tournament', async () => {
  const rows = [
    { participantId: 'p1', userId: 'u1', username: 'one', rank: 1, coins: 60, cosmetics: [{ type: 'skin', itemId: 'champion' }] },
    { participantId: 'p2', userId: 'u2', username: 'two', rank: 2, coins: 40, cosmetics: [] },
  ];
  const claimed = { _id: 't1', name: 'Cup', status: 'completed', stateVersion: 6, payoutState: 'processing', payoutRequestId: 'pay-1', payoutPreview: { rows, totals: { coins: 100 } } };
  const users = { u1: { _id: 'u1', coins: 10, __v: 0 }, u2: { _id: 'u2', coins: 20, __v: 0 } };
  const participantClaims = new Set();
  const balanceUpdates = [];
  const transactions = [];
  let finalized;
  const result = await executeTournamentPayout({
    TournamentModel: {
      findOneAndUpdate: async (filter, update) => {
        if (filter.payoutState === 'previewed') return claimed;
        finalized = { ...claimed, ...update.$set, stateVersion: 7 };
        return finalized;
      },
      findById: async () => claimed,
    },
    ParticipantModel: {
      findOneAndUpdate: async (filter) => {
        if (participantClaims.has(filter._id)) return null;
        participantClaims.add(filter._id);
        return { _id: filter._id };
      },
      findByIdAndUpdate: async () => ({}),
    },
    UserModel: {
      findById: async (id) => users[id],
      findOneAndUpdate: async (filter, update) => {
        balanceUpdates.push({ filter, update });
        const user = users[filter._id];
        return { ...user, coins: user.coins + update.$inc.coins, __v: 1 };
      },
    },
    TransactionModel: { insertMany: async (values) => { transactions.push(...values); } },
    audit: async () => ({}), actor: { id: 'admin-1', username: 'root' }, tournamentId: 't1',
    expectedVersion: 5, previewToken: 'preview-token', mutation: { reason: 'Approved payout', requestId: 'pay-1' },
  });
  assert.equal(result.completed, true);
  assert.equal(result.succeeded, 2);
  assert.equal(balanceUpdates.length, 2);
  assert.equal(transactions.reduce((sum, item) => sum + item.amount, 0), 100);
  assert.deepEqual(balanceUpdates[0].update.$addToSet.ownedSkins, { $each: ['champion'] });
  assert.equal(finalized.payoutState, 'completed');
});

test('replaying a completed payout request does not credit balances again', async () => {
  let balanceUpdates = 0;
  const completed = { _id: 't1', payoutState: 'completed', payoutRequestId: 'pay-1', payoutPreview: { totals: { coins: 50 }, rows: [] } };
  const result = await executeTournamentPayout({
    TournamentModel: { findOneAndUpdate: async () => null, findById: async () => completed },
    ParticipantModel: {}, UserModel: { findOneAndUpdate: async () => { balanceUpdates += 1; } }, TransactionModel: {}, audit: async () => ({}),
    actor: { id: 'admin-1', username: 'root' }, tournamentId: 't1', expectedVersion: 2, previewToken: 'used', mutation: { reason: 'Retry', requestId: 'pay-1' },
  });
  assert.equal(result.replayed, true);
  assert.equal(balanceUpdates, 0);
});
