const test = require('node:test');
const assert = require('node:assert/strict');
const { createRoom } = require('../game/roomManager');

test('createRoom defaults to the original edition', () => {
  const room = createRoom('host-default', { isPublic: true }, 'Host');

  assert.equal(room.edition, 'original');
  assert.equal(room.maxPlayers, 5);
});

test('createRoom rejects the removed all edition by falling back to original', () => {
  const room = createRoom('host-all', { isPublic: true, edition: 'all' }, 'Host');

  assert.equal(room.edition, 'original');
  assert.equal(room.maxPlayers, 5);
});

test('createRoom keeps supported edition-specific settings', () => {
  const room = createRoom('host-two-player', { isPublic: true, edition: '2_player' }, 'Host');

  assert.equal(room.edition, '2_player');
  assert.equal(room.maxPlayers, 2);
});

test('createRoom sets correct maxPlayers and edition for imploding', () => {
  const room = createRoom('host-id', { edition: 'imploding' }, 'Host');
  assert.equal(room.edition, 'imploding');
  assert.equal(room.maxPlayers, 6);
});
