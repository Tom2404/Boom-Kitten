const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RECONNECT_GRACE_MS,
  createRoom,
  forceCloseRoom,
  joinRoom,
  kickPlayer,
  markPlayerConnected,
  markPlayerDisconnected,
  startGame,
} = require('../game/roomManager');
const { resolveZombieRevive } = require('../game/gameLogic');

test('keeps a disconnected player in the active room until the reconnect deadline', () => {
  const room = createRoom('host', { maxPlayers: 2 }, 'Host');
  joinRoom(room.code, 'guest', 'Guest');
  room.players[1].isReady = true;
  startGame(room.code);

  try {
    const deadline = 1_000 + RECONNECT_GRACE_MS;
    const player = markPlayerDisconnected(room.code, 'host', deadline);

    assert.equal(player.connectionStatus, 'reconnecting');
    assert.equal(player.reconnectDeadline, deadline);
    assert.equal(room.players.length, 2);
    assert.ok(room.gameState);
    assert.equal(room.gameState.players[0], player);
  } finally {
    forceCloseRoom(room.code);
  }
});

test('Tournament rooms use the five-minute reconnect grace policy', () => {
  const room = createRoom('tournament-host', { gameMode: 'tournament', reconnectGraceMs: 5 * 60 * 1000 }, 'Host');
  try {
    assert.equal(room.reconnectGraceMs, 5 * 60 * 1000);
    const player = markPlayerDisconnected(room.code, 'tournament-host', 123);
    assert.equal(player.reconnectDeadline, 123);
  } finally {
    forceCloseRoom(room.code);
  }
});

test('restores a player at the deadline but rejects a reconnect after it', () => {
  const room = createRoom('host', {}, 'Host');

  try {
    markPlayerDisconnected(room.code, 'host', 5_000);
    assert.ok(markPlayerConnected(room.code, 'host', 5_000));
    assert.equal(room.players[0].connectionStatus, 'connected');
    assert.equal(room.players[0].reconnectDeadline, null);

    markPlayerDisconnected(room.code, 'host', 8_000);
    assert.equal(markPlayerConnected(room.code, 'host', 8_001), null);
    assert.equal(room.players[0].connectionStatus, 'reconnecting');
  } finally {
    forceCloseRoom(room.code);
  }
});

test('does not allow the host to kick a player after the match starts', () => {
  const room = createRoom('host', { maxPlayers: 2 }, 'Host');
  joinRoom(room.code, 'guest', 'Guest');
  room.players[1].isReady = true;
  startGame(room.code);

  try {
    assert.throws(
      () => kickPlayer(room.code, 'host', 'guest'),
      /Không thể kick người chơi sau khi trận đấu đã bắt đầu/,
    );
  } finally {
    forceCloseRoom(room.code);
  }
});

test('never revives a player who already forfeited', () => {
  const state = {
    players: [
      { userId: 'alive', alive: true, hand: [] },
      { userId: 'forfeit', alive: false, forfeited: true, hand: [] },
    ],
    activePlayerIds: ['alive'],
    pendingZombie: {
      playerId: 'alive',
      card: { id: 'kitten', type: 'exploding_kitten' },
    },
    deck: [],
    drawsRequired: 1,
  };

  resolveZombieRevive(state, 'forfeit', 0);

  assert.equal(state.players[1].alive, false);
  assert.deepEqual(state.activePlayerIds, ['alive']);
});
