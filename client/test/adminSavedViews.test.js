import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSavedViewMutation, materializeSavedViewFilters } from '../src/pages/admin/adminSavedViews.js';

test('applying a saved view resets omitted filters to panel defaults', () => {
  assert.deepEqual(
    materializeSavedViewFilters({ search: '', role: '', status: '', page: 1 }, { search: 'cat', role: 'user' }),
    { search: 'cat', role: 'user', status: '', page: 1 },
  );
});

test('saved view mutation strips blank filters and includes an operation request id', () => {
  assert.deepEqual(
    buildSavedViewMutation({ scope: 'players', name: ' Active users ', filters: { search: '', status: 'active' }, requestId: 'view-1' }),
    { scope: 'players', name: 'Active users', filters: { status: 'active' }, schemaVersion: 1, requestId: 'view-1' },
  );
});
