const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFunnel, buildRetentionCohorts, classifyEconomy, normalizeRankDistribution, resolveAnalyticsRange } = require('../services/admin/productAnalyticsService');

test('analytics range is UTC, inclusive by day, and capped at 90 days', () => {
  const range = resolveAnalyticsRange({ from: '2026-07-01', to: '2026-07-07' });
  assert.equal(range.from.toISOString(), '2026-07-01T00:00:00.000Z');
  assert.equal(range.to.toISOString(), '2026-07-08T00:00:00.000Z');
  assert.throws(() => resolveAnalyticsRange({ from: '2026-01-01', to: '2026-07-01' }), (error) => error.code === 'VALIDATION_ERROR');
});

test('funnel uses one registration cohort and cannot double count repeated games', () => {
  const users = [{ _id: 'u1' }, { _id: 'u2' }, { _id: 'u3' }];
  const games = [{ status: 'started', players: [{ userId: 'u1' }] }, { status: 'completed', players: [{ userId: 'u1' }, { userId: 'u2' }] }];
  const funnel = buildFunnel(users, games);
  assert.deepEqual(funnel.map((row) => row.users), [3, 2, 2]);
  assert.equal(funnel[1].conversionFromRegistration, 66.7);
});

test('retention cohorts measure exact UTC D1 and D7 activity', () => {
  const users = [{ _id: 'u1', createdAt: '2026-07-01T20:00:00Z' }, { _id: 'u2', createdAt: '2026-07-01T01:00:00Z' }];
  const games = [{ playedAt: '2026-07-02T03:00:00Z', players: [{ userId: 'u1' }] }, { playedAt: '2026-07-08T12:00:00Z', players: [{ userId: 'u1' }, { userId: 'u2' }] }];
  const cohort = buildRetentionCohorts(users, games)[0];
  assert.equal(cohort.users, 2);
  assert.equal(cohort.d1Rate, 50);
  assert.equal(cohort.d7Rate, 100);
});

test('economy separates sources and sinks while preserving signed admin adjustments', () => {
  const economy = classifyEconomy([{ type: 'earn', currency: 'coin', amount: 100 }, { type: 'purchase', currency: 'coin', amount: 25 }, { type: 'admin_adjust', currency: 'coin', amount: -10 }, { type: 'tournament_prize', currency: 'gem', amount: 5 }]);
  assert.deepEqual(economy.coin, { source: 100, sink: 35, net: 65 });
  assert.equal(economy.gem.net, 5);
});

test('rank distribution merges legacy rank labels into canonical ranks', () => {
  const distribution = normalizeRankDistribution([
    { _id: 'Bronze', users: 2 },
    { _id: 'Bronze IV', users: 3 },
    { _id: 'Bronze II', users: 4 },
    { _id: 'Silver', users: 1 },
  ]);

  assert.deepEqual(distribution, [
    { rank: 'Bronze II', users: 9 },
    { rank: 'Silver III', users: 1 },
  ]);
});
