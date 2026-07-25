import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getVisibleAdminNavigation,
  resolveAdminTab,
} from '../src/pages/admin/adminNavigation.js';

test('groups visible admin destinations by operational purpose', () => {
  const groups = getVisibleAdminNavigation([
    'dashboard.read',
    'players.read',
    'catalog.read',
    'audit.read',
  ]);

  assert.deepEqual(groups.map((group) => group.id), ['observe', 'operate']);
  assert.deepEqual(groups[0].items.map((item) => item.id), ['overview', 'logs']);
  assert.deepEqual(groups[1].items.map((item) => item.id), ['players', 'catalog']);
});

test('does not expose destinations without the server capability', () => {
  const groups = getVisibleAdminNavigation(['dashboard.read', 'players.read']);
  const itemIds = groups.flatMap((group) => group.items.map((item) => item.id));

  assert.deepEqual(itemIds, ['overview', 'players']);
  assert.equal(itemIds.includes('seasons'), false);
  assert.equal(itemIds.includes('announcements'), false);
});

test('keeps a permitted requested tab and falls back to the first visible tab', () => {
  const groups = getVisibleAdminNavigation(['dashboard.read', 'players.read']);

  assert.equal(resolveAdminTab('players', groups), 'players');
  assert.equal(resolveAdminTab('seasons', groups), 'overview');
  assert.equal(resolveAdminTab('anything', []), null);
});
