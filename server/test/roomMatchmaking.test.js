const test = require('node:test');
const assert = require('node:assert/strict');

const roomManager = require('../game/roomManager');

test('creates public queue rooms with matchmaking mode and never creates new ranked rooms', () => {
  const room = roomManager.createRoom('u1', { gameMode: 'matchmaking', betAmount: 0 }, 'One');
  assert.equal(room.gameMode, 'matchmaking');

  const legacyRequest = roomManager.createRoom('u2', { gameMode: 'ranked', betAmount: 0 }, 'Two');
  assert.equal(legacyRequest.gameMode, 'custom');

  roomManager.forceCloseRoom(room.code);
  roomManager.forceCloseRoom(legacyRequest.code);
});
