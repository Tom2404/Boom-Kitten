import test from 'node:test';
import assert from 'node:assert/strict';

import { calculatePlayerAdjustmentPreview } from '../src/pages/admin/playerAdjustment.js';

test('single-player Coin adjustment exposes impact and the admin threshold', () => {
  assert.deepEqual(
    calculatePlayerAdjustmentPreview(
      { coins: 100 },
      { type: 'currency', currency: 'coin', operation: 'add', amount: 25 },
      { maxCurrencyAdjustment: { coin: 20 } },
    ),
    { before: 100, after: 125, delta: 25, threshold: 20, exceedsThreshold: true, valid: true },
  );
});
