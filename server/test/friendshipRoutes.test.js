const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

test('legacy friend request route delegates to the validated service', async () => {
  const source = await readFile(path.join(__dirname, '..', 'routes', 'user.js'), 'utf8');
  const legacyRoute = source.match(/router\.post\('\/friends\/:id',[\s\S]+?router\.get\('\/me\/quests'/)?.[0] || '';
  assert.match(legacyRoute, /assertUserId\(req\.params\.id\)/);
  assert.match(legacyRoute, /sendFriendRequest/);
  assert.doesNotMatch(legacyRoute, /Friendship\.create/);
});

test('removing a friend cannot delete pending, declined, or blocked relationships', async () => {
  const source = await readFile(path.join(__dirname, '..', 'routes', 'user.js'), 'utf8');
  const removeRoute = source.match(/router\.delete\('\/friends\/:id',[\s\S]+?router\.get\('\/:id'/)?.[0] || '';
  assert.match(removeRoute, /assertUserId\(targetId\)/);
  assert.match(removeRoute, /status: 'accepted'/);
});
