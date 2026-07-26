const test = require('node:test');
const assert = require('node:assert/strict');

const { previewCurrencyAdjustment } = require('../services/admin/economyAdjustmentService');

test('currency preview enforces allowlists, integers, non-negative balance and role threshold', () => {
  assert.deepEqual(previewCurrencyAdjustment({ currency: 'coin', operation: 'subtract', amount: 250, balances: { coins: 1000, gems: 20 }, policy: { maxCurrencyAdjustment: { coin: 10000, gem: 500 } } }), {
    currency: 'coin', field: 'coins', operation: 'subtract', amount: 250, before: 1000, after: 750, exceedsThreshold: false,
  });
  assert.throws(() => previewCurrencyAdjustment({ currency: 'elo', operation: 'add', amount: 1, balances: {}, policy: {} }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => previewCurrencyAdjustment({ currency: 'coin', operation: 'add', amount: 1.5, balances: {}, policy: {} }), (error) => error.code === 'VALIDATION_ERROR');
  assert.throws(() => previewCurrencyAdjustment({ currency: 'gem', operation: 'add', amount: 1, balances: {}, policy: {} }), (error) => error.code === 'VALIDATION_ERROR');
});
