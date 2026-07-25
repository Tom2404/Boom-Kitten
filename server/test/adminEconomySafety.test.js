const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEloSetFields, previewCurrencyAdjustment, previewEloAdjustment } = require('../services/admin/economyAdjustmentService');

test('currency preview enforces allowlists, integers, non-negative balance and role threshold', () => {
  assert.deepEqual(previewCurrencyAdjustment({ currency: 'coin', operation: 'subtract', amount: 250, balances: { coins: 1000, gems: 20 }, policy: { maxCurrencyAdjustment: { coin: 10000, gem: 500 } } }), {
    currency: 'coin', field: 'coins', operation: 'subtract', amount: 250, before: 1000, after: 750, exceedsThreshold: false,
  });
  assert.throws(() => previewCurrencyAdjustment({ currency: 'elo', operation: 'add', amount: 1, balances: {}, policy: {} }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => previewCurrencyAdjustment({ currency: 'coin', operation: 'add', amount: 1.5, balances: {}, policy: {} }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => previewCurrencyAdjustment({ currency: 'gem', operation: 'add', amount: 501, balances: {}, policy: { maxCurrencyAdjustment: { gem: 500 } } }), (error) => error.code === 'POLICY_LIMIT_EXCEEDED');
});

test('ELO preview enforces integer values and delta threshold', () => {
  assert.deepEqual(previewEloAdjustment({ elo: 1200, currentElo: 1000, policy: { maxEloDelta: 500 } }), { before: 1000, after: 1200, delta: 200, exceedsThreshold: false });
  assert.throws(() => previewEloAdjustment({ elo: 1000.5, currentElo: 1000, policy: {} }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => previewEloAdjustment({ elo: 1600, currentElo: 1000, policy: { maxEloDelta: 500 } }), (error) => error.code === 'POLICY_LIMIT_EXCEEDED');
});

test('ELO persistence fields keep rank and peak values consistent without save hooks', () => {
  const fields = buildEloSetFields({ highestEloReached: 1400, seasonHighestElo: 1500, allTimeHighestElo: 2200 }, 1800);
  assert.equal(fields.rank, 'Platinum IV');
  assert.equal(fields.highestEloReached, 1800);
  assert.equal(fields.seasonHighestElo, 1800);
  assert.equal(fields.allTimeHighestElo, 2200);
});
