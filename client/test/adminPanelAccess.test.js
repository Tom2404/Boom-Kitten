import test from 'node:test';
import assert from 'node:assert/strict';

import { getAdminPanelAccess } from '../src/pages/admin/adminPanelAccess.js';

test('maps write capabilities to their matching operational panels', () => {
  const access = getAdminPanelAccess(['catalog.write', 'announcements.write']);

  assert.deepEqual(access, {
    canWriteCatalog: true,
    canWriteQuests: false,
    canWriteAnnouncements: true,
  });
});
