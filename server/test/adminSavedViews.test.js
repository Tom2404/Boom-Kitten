const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getSavedViewScopePermission,
  normalizeSavedViewFilters,
  sanitizeSavedViewName,
} = require('../services/admin/savedViewService');

test('saved view filters keep only each scope allowlist and normalize legacy search keys', () => {
  assert.deepEqual(
    normalizeSavedViewFilters('players', { q: 'cat', role: 'user', page: 99 }, 0),
    { search: 'cat', role: 'user' },
  );
  assert.deepEqual(
    normalizeSavedViewFilters('rooms', { status: 'stale', search: 'ABC', secret: 'drop-me' }),
    { status: 'stale', search: 'ABC' },
  );
});

test('saved view rejects operators and invalid enum values instead of serializing them', () => {
  assert.throws(
    () => normalizeSavedViewFilters('players', { role: { $ne: 'user' } }),
    (error) => error.code === 'VALIDATION_ERROR',
  );
  assert.throws(
    () => normalizeSavedViewFilters('reports', { priority: 'urgent' }),
    (error) => error.code === 'VALIDATION_ERROR',
  );
});

test('saved view scopes map to their read capability and names are bounded', () => {
  assert.equal(getSavedViewScopePermission('logs'), 'audit.read');
  assert.equal(getSavedViewScopePermission('reports'), 'moderation.read');
  assert.equal(sanitizeSavedViewName('  VIP support queue  '), 'VIP support queue');
  assert.throws(() => sanitizeSavedViewName(''), (error) => error.code === 'VALIDATION_ERROR');
});
