const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

test('server exposes only the approved admin route surface', async () => {
  const source = await readFile(path.join(__dirname, '..', 'index.js'), 'utf8');

  for (const route of ['rooms', 'audit-logs', 'jobs', 'player-exports', 'wagers', 'live-ops', 'analytics', 'incidents']) {
    assert.equal(source.includes(`/api/admin/${route}`), false, route);
  }
  assert.equal(source.includes('/api/admin/moderation'), true);
  assert.equal(source.includes('/api/admin/tournaments'), true);
});
