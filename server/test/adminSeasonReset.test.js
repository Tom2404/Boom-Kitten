const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateResetElo,
  getSeasonEndReward,
  performSeasonReset,
} = require('../services/admin/seasonResetService');

test('calculates rank rewards and each supported reset strategy deterministically', () => {
  assert.equal(getSeasonEndReward('Legend'), 100);
  assert.equal(getSeasonEndReward('Diamond II'), 60);
  assert.equal(getSeasonEndReward('Bronze II'), 10);
  assert.equal(calculateResetElo({ strategy: 'soft_reset_ratio', elo: 2200, rank: 'Diamond II', baseElo: 1000, ratio: 0.5 }), 1600);
  assert.equal(calculateResetElo({ strategy: 'soft_reset_tiered', elo: 2200, rank: 'Diamond II', baseElo: 1000, ratio: 0.5 }), 1500);
  assert.equal(calculateResetElo({ strategy: 'hard_reset', elo: 2200, rank: 'Diamond II', baseElo: 1000, ratio: 0.5 }), 1000);
});

test('refuses to reset when no eligible season can be atomically claimed', async () => {
  const SeasonModel = { findOneAndUpdate: async () => null };

  await assert.rejects(
    performSeasonReset({ SeasonModel, UserModel: {}, TransactionModel: {}, actor: { id: 'admin-1' }, mutation: { requestId: 'reset-1', reason: 'Season complete' } }),
    (error) => error.code === 'STATE_CONFLICT' && error.statusCode === 409,
  );
});

test('claims the season before payouts and records a summarized audit', async () => {
  const season = {
    _id: 'season-4',
    seasonNumber: 4,
    name: 'Feral Summer',
    settings: { resetStrategy: 'soft_reset_ratio', softResetRatio: 0.5, resetEloValue: 1000 },
  };
  const users = [
    { _id: 'u1', rank: 'Gold I', eloPoints: 1800, gems: 20, save: async () => {} },
    { _id: 'u2', rank: 'Legend', eloPoints: 2600, gems: 5, save: async () => {} },
  ];
  let claimUpdate;
  let completionUpdate;
  const SeasonModel = {
    findOneAndUpdate: async (_filter, update) => { claimUpdate = update; return season; },
    findByIdAndUpdate: async (_id, update) => { completionUpdate = update; },
  };
  const UserModel = { find: async () => users };
  const transactions = [];
  const TransactionModel = { create: async (entry) => { transactions.push(entry); } };
  let auditInput;
  const audit = async (input) => { auditInput = input; };
  const emitted = [];
  const io = { emit: (event, payload) => emitted.push({ event, payload }) };

  const result = await performSeasonReset({
    SeasonModel,
    UserModel,
    TransactionModel,
    audit,
    io,
    actor: { id: 'admin-1', username: 'root-cat', role: 'super_admin' },
    mutation: { requestId: 'reset-4', reason: 'Season 4 complete' },
    request: { requestId: 'transport-4', ip: '127.0.0.1', userAgent: 'Admin Browser' },
  });

  assert.equal(claimUpdate.$set.resetState, 'processing');
  assert.equal(claimUpdate.$set.resetRequestId, 'reset-4');
  assert.equal(completionUpdate.$set.resetState, 'completed');
  assert.equal(users[0].eloPoints, 1400);
  assert.equal(users[0].gems, 50);
  assert.equal(users[1].eloPoints, 1800);
  assert.equal(users[1].gems, 105);
  assert.equal(transactions.length, 2);
  assert.equal(auditInput.action, 'SEASON_RESET_COMPLETED');
  assert.deepEqual(auditInput.after, { affectedUsers: 2, failedUsers: 0, totalGemsAwarded: 130, strategy: 'soft_reset_ratio', seasonNumber: 4 });
  assert.equal(emitted.length, 2);
  assert.deepEqual(result, { affectedUsers: 2, failedUsers: 0, strategy: 'soft_reset_ratio', totalGemsAwarded: 130 });
});

test('marks the season failed and does not broadcast when any player payout fails', async () => {
  const season = { _id: 'season-5', seasonNumber: 5, name: 'Risky', settings: {} };
  const users = [{ _id: 'u1', rank: 'Bronze II', eloPoints: 1000, gems: 0, save: async () => { throw new Error('write failed'); } }];
  let completionUpdate;
  const SeasonModel = {
    findOneAndUpdate: async () => season,
    findByIdAndUpdate: async (_id, update) => { completionUpdate = update; },
  };
  const emitted = [];

  await assert.rejects(
    performSeasonReset({
      SeasonModel,
      UserModel: { find: async () => users },
      TransactionModel: { create: async () => {} },
      audit: async () => {},
      io: { emit: (...args) => emitted.push(args) },
      actor: { id: 'admin-1', username: 'root-cat', role: 'super_admin' },
      mutation: { requestId: 'reset-5', reason: 'Season 5 complete' },
    }),
    (error) => error.code === 'PARTIAL_FAILURE' && error.statusCode === 409,
  );

  assert.equal(completionUpdate.$set.resetState, 'failed');
  assert.equal(emitted.length, 0);
});
