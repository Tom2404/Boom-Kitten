const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createRoom,
  forceCloseRoom,
  joinRoom,
  resetRoomForRematch,
  startGame,
  toggleReady,
} = require('../game/roomManager');

test('rematch reset preserves the room while requiring non-host players to ready again', () => {
  const room = createRoom('host', { edition: 'original' }, 'Host');

  try {
    joinRoom(room.code, 'player-2', 'Player Two');
    toggleReady(room.code, 'player-2', true);
    startGame(room.code);
    room.status = 'finished';
    room.players.forEach((player) => {
      player.forfeited = true;
      player.connectionStatus = 'reconnecting';
      player.reconnectDeadline = Date.now() + 60_000;
    });

    const reset = resetRoomForRematch(room);

    assert.equal(reset, room);
    assert.equal(room.status, 'waiting');
    assert.equal(room.gameState, null);
    assert.deepEqual(
      room.players.map(({ userId, isReady, hand, alive, forfeited, connectionStatus, reconnectDeadline }) => ({
        userId,
        isReady,
        hand,
        alive,
        forfeited,
        connectionStatus,
        reconnectDeadline,
      })),
      [
        {
          userId: 'host',
          isReady: true,
          hand: [],
          alive: true,
          forfeited: false,
          connectionStatus: 'connected',
          reconnectDeadline: null,
        },
        {
          userId: 'player-2',
          isReady: false,
          hand: [],
          alive: true,
          forfeited: false,
          connectionStatus: 'connected',
          reconnectDeadline: null,
        },
      ],
    );
  } finally {
    forceCloseRoom(room.code);
  }
});

