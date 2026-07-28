const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getSavedViewScopePermission,
  normalizeSavedViewFilters,
  sanitizeSavedViewName,
} = require('../services/admin/savedViewService');

test('player saved views keep only approved filters and normalize legacy search keys', () => {
  assert.deepEqual(
    normalizeSavedViewFilters('players', { q: 'cat', role: 'user', page: 99 }, 0),
    { search: 'cat', role: 'user' },
  );
});

test('saved view rejects object injection and removed scopes', () => {
  assert.throws(
    () => normalizeSavedViewFilters('players', { role: { $ne: 'user' } }),
    (error) => error.code === 'VALIDATION_ERROR',
  );
  assert.throws(
    () => normalizeSavedViewFilters('reports', { priority: 'urgent' }),
    (error) => error.code === 'VALIDATION_ERROR',
  );
});

test('only player saved views remain and names are bounded', () => {
  assert.equal(getSavedViewScopePermission('players'), 'players.read');
  assert.throws(() => getSavedViewScopePermission('logs'), (error) => error.code === 'VALIDATION_ERROR');
  assert.equal(sanitizeSavedViewName('  VIP support queue  '), 'VIP support queue');
  assert.throws(() => sanitizeSavedViewName(''), (error) => error.code === 'VALIDATION_ERROR');
});
