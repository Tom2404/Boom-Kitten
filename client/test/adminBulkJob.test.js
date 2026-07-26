import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBulkExecutionPayload,
  buildBulkPreviewPayload,
  calculatePlayerAdjustmentPreview,
} from '../src/pages/admin/adminBulkJob.js';

test('builds a dry-run payload from the complete player filter query', () => {
  const payload = buildBulkPreviewPayload({
    filters: { search: 'cat', role: 'user', status: 'active' },
    form: { type: 'currency', currency: 'coin', operation: 'add', amount: '250', reason: 'Campaign repair' },
    requestId: 'preview-1',
  });
  assert.deepEqual(payload.query, { search: 'cat', role: 'user', status: 'active' });
  assert.deepEqual(payload.operation, { type: 'currency', currency: 'coin', operation: 'add', amount: 250 });
  assert.equal(payload.dryRun, true);
  assert.equal(payload.requestId, 'preview-1');
});

test('execution payload references only the approved preview token', () => {
  assert.deepEqual(buildBulkExecutionPayload({ previewToken: 'token-1', reason: 'Approved', requestId: 'run-1' }), {
    type: 'player_bulk_adjust', dryRun: false, previewToken: 'token-1', reason: 'Approved', requestId: 'run-1',
  });
});

test('single-player adjustment preview exposes before, after, delta, and threshold warning', () => {
  const preview = calculatePlayerAdjustmentPreview(
    { coins: 100, gems: 2, eloPoints: 1200 },
    { type: 'currency', currency: 'coin', operation: 'add', amount: 12000 },
    { maxCurrencyAdjustment: { coin: 10000, gem: 500 }, maxEloDelta: 500 },
  );
  assert.deepEqual(preview, { before: 100, after: 12100, delta: 12000, threshold: 10000, exceedsThreshold: true, valid: true });
});

test('bulk adjustment accepts only the Coin wallet', () => {
  assert.throws(() => buildBulkPreviewPayload({
    filters: {}, form: { type: 'currency', currency: 'gem', operation: 'add', amount: 1, reason: 'legacy' }, requestId: 'x',
  }), /Coin/);
  assert.equal(calculatePlayerAdjustmentPreview({ coins: 1 }, { type: 'elo', elo: 2 }).valid, false);
});
