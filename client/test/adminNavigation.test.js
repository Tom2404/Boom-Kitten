import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getVisibleAdminNavigation,
  resolveAdminTab,
} from '../src/pages/admin/adminNavigation.js';

test('exposes only overview, users, resources, and tournaments', () => {
  const groups = getVisibleAdminNavigation([
    'dashboard.read',
    'players.read',
    'catalog.read',
    'quests.read',
    'tournaments.read',
    'jobs.read',
    'moderation.read',
    'incidents.read',
  ]);

  assert.deepEqual(groups.map((group) => group.id), ['manage', 'resources', 'competition']);
  assert.deepEqual(
    groups.flatMap((group) => group.items.map((item) => item.id)),
    ['overview', 'players', 'catalog', 'quests', 'tournaments'],
  );
});

test('does not expose destinations without the server capability', () => {
  const groups = getVisibleAdminNavigation(['dashboard.read', 'players.read', 'seasons.read']);
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
