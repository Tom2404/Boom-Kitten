const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDailyTrend,
  calculatePercentChange,
  calculateCompletionRate,
  median,
  resolveDashboardWindow,
  summarizeEconomy,
} = require('../services/admin/dashboardService');

test('resolves shareable 7-day and 30-day dashboard windows with a previous comparison period', () => {
  const now = new Date('2027-02-01T12:00:00.000Z');
  const seven = resolveDashboardWindow('7d', now);
  const thirty = resolveDashboardWindow('30d', now);

  assert.equal(seven.days, 7);
  assert.equal(seven.start.toISOString(), '2027-01-26T00:00:00.000Z');
  assert.equal(seven.previousStart.toISOString(), '2027-01-19T00:00:00.000Z');
  assert.equal(thirty.days, 30);
  assert.equal(thirty.start.toISOString(), '2027-01-03T00:00:00.000Z');
});

test('builds a gap-free daily trend and keeps dates in UTC', () => {
  const window = resolveDashboardWindow('7d', new Date('2027-02-01T12:00:00.000Z'));
  const trend = buildDailyTrend([
    { playedAt: new Date('2027-01-26T09:00:00.000Z') },
    { playedAt: new Date('2027-01-26T10:00:00.000Z') },
    { playedAt: new Date('2027-02-01T01:00:00.000Z') },
  ], window, 'playedAt');

  assert.equal(trend.length, 7);
  assert.deepEqual(trend[0], { date: '2027-01-26', value: 2 });
  assert.deepEqual(trend[6], { date: '2027-02-01', value: 1 });
});

test('summarizes generated and consumed currencies without treating ELO as currency', () => {
  const summary = summarizeEconomy([
    { type: 'earn', currency: 'coin', amount: 100 },
    { type: 'purchase', currency: 'coin', amount: 25 },
    { type: 'season_reward', currency: 'gem', amount: 7 },
    { type: 'admin_adjust', currency: 'gem', amount: 5, balanceBefore: 20, balanceAfter: 15 },
    { type: 'elo_adjust', currency: 'elo', amount: 50 },
  ]);

  assert.deepEqual(summary, {
    coin: { generated: 100, consumed: 25 },
    gem: { generated: 7, consumed: 5 },
  });
});

test('computes comparison percentages and a deterministic median', () => {
  assert.equal(calculatePercentChange(15, 10), 50);
  assert.equal(calculatePercentChange(0, 0), 0);
  assert.equal(calculatePercentChange(5, 0), null);
  assert.equal(median([12, 4, 8, 6]), 7);
  assert.equal(median([]), null);
});

test('calculates completion rate only from instrumented match starts', () => {
  const records = [
    { status: 'completed', startedAt: new Date('2027-01-28T10:00:00Z') },
    { status: 'completed', startedAt: new Date('2027-01-29T10:00:00Z') },
    { status: 'started', startedAt: new Date('2027-01-30T10:00:00Z') },
    { status: undefined, playedAt: new Date('2027-01-30T11:00:00Z') },
  ];
  const window = resolveDashboardWindow('7d', new Date('2027-02-01T12:00:00Z'));
  assert.deepEqual(calculateCompletionRate(records, window), { value: 66.7, completed: 2, started: 3 });
});
