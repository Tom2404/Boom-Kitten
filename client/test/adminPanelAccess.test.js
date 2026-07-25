import test from 'node:test';
import assert from 'node:assert/strict';

import { getAdminPanelAccess, getSeasonPanelAccess } from '../src/pages/admin/adminPanelAccess.js';

test('maps write capabilities to their matching operational panels', () => {
  const access = getAdminPanelAccess(['catalog.write', 'announcements.write']);

  assert.deepEqual(access, {
    canWriteCatalog: true,
    canWriteQuests: false,
    canWriteAnnouncements: true,
  });
});

test('keeps the season panel read-only without write capabilities', () => {
  assert.deepEqual(getSeasonPanelAccess(['seasons.read']), {
    canCreate: false,
    canDelete: false,
    canReset: false,
  });
});

test('separates routine season writes from destructive resets', () => {
  assert.deepEqual(getSeasonPanelAccess(['seasons.read', 'seasons.write']), {
    canCreate: true,
    canDelete: true,
    canReset: false,
  });

  assert.deepEqual(getSeasonPanelAccess(['seasons.read', 'seasons.write', 'seasons.reset']), {
    canCreate: true,
    canDelete: true,
    canReset: true,
  });
});
