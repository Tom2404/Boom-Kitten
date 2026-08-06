const { getRoomState, leaveRoom, markPlayerDisconnected } = require('../../game/roomManager');
const { emitRoomUpdated, sanitizePublicGameState } = require('../broadcast/gameStateSync');
const { clearReconnectTimer, reconnectTimerKey, reconnectTimers } = require('../helpers/reconnectHelpers');
const { RECONNECT_GRACE_MS } = require('../../game/roomManager');
const { dispatcher } = require('../../game/actions');
const GameContext = require('../../game/state/GameContext');
const EffectQueue = require('../../game/effects/EffectQueue');
const { eliminatePlayer } = require('../../game/gameLogic');

async function forfeitPlayer(room, userId, io, afterGameStateChanged) {
  const gameState = room.gameState;
  if (!gameState) return;

  const innerPlayersBefore = gameState.players.map((p) => ({ userId: p.userId, alive: p.alive }));
  const innerTurnBefore = gameState.currentPlayerIndex;

  const p = gameState.players.find((player) => player.userId === userId);
  if (!p || !p.alive) return;

  p.forfeited = true;
  p.connectionStatus = 'connected';
  p.reconnectDeadline = null;
  eliminatePlayer(gameState, userId);
  if (p.hand.length > 0) {
    gameState.discardPile.push(...p.hand);
    p.hand = [];
  }

  if (gameState.activeInteraction) {
    const interaction = gameState.activeInteraction;
    const isOwner = interaction.owner === userId;
    const isParticipant = interaction.participants.includes(userId);

    if (isOwner || isParticipant) {
      const toContext = new GameContext(gameState, new EffectQueue());
      dispatcher.dispatch('INTERACTION_TIMEOUT', toContext, { interactionId: interaction.id });
    }
  }

  if (afterGameStateChanged) {
    await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
  }
}

async function forfeitAndLeave(roomCode, userId, socketToLeave = null, io, afterGameStateChanged) {
  const roomBefore = getRoomState(roomCode);
  if (!roomBefore) return null;
  clearReconnectTimer(roomCode, userId);

  const gamePlayer = roomBefore.gameState?.players.find((player) => player.userId === userId);
  if (roomBefore.status === 'playing' && gamePlayer?.alive) {
    await forfeitPlayer(roomBefore, userId, io, afterGameStateChanged);
  }

  const room = leaveRoom(roomCode, userId);
  socketToLeave?.leave(roomCode);
  if (room && io) emitRoomUpdated(io.to(roomCode), room);
  return room;
}

function scheduleReconnectForfeit(room, userId, io, afterGameStateChanged) {
  const graceMs = room.reconnectGraceMs || RECONNECT_GRACE_MS;
  const deadline = Date.now() + graceMs;
  const player = markPlayerDisconnected(room.code, userId, deadline);
  if (!player) return;

  clearReconnectTimer(room.code, userId);
  const key = reconnectTimerKey(room.code, userId);
  const run = async () => {
    const currentRoom = getRoomState(room.code);
    const currentPlayer = currentRoom?.players.find((candidate) => candidate.userId === userId);
    const gamePlayer = currentRoom?.gameState?.players.find((candidate) => candidate.userId === userId);
    const activeSockets = io.sockets.adapter.rooms.get(`user:${userId}`);

    if (
      !currentRoom
      || currentRoom.status !== 'playing'
      || !currentPlayer
      || !gamePlayer?.alive
      || currentPlayer.connectionStatus !== 'reconnecting'
      || currentPlayer.reconnectDeadline !== deadline
      || currentPlayer.forfeited
      || activeSockets?.size > 0
    ) {
      clearReconnectTimer(room.code, userId);
      return;
    }
    if (Date.now() <= deadline) {
      reconnectTimers.set(key, setTimeout(run, deadline - Date.now() + 1));
      return;
    }

    reconnectTimers.delete(key);
    const username = currentPlayer.username || userId;
    await forfeitAndLeave(room.code, userId, null, io, afterGameStateChanged);

    io.to(room.code).emit('chat:message', {
      userId: 'system',
      username: 'Hệ Thống',
      text: `${username} đã bị xử thua do quá thời gian kết nối lại.`,
      timestamp: new Date().toISOString(),
    });
  };

  reconnectTimers.set(key, setTimeout(run, graceMs + 1));
  emitRoomUpdated(io.to(room.code), room);
  io.to(room.code).emit('game:stateUpdate', {
    publicGameState: sanitizePublicGameState(room.gameState),
  });
  io.to(room.code).emit('chat:message', {
    userId: 'system',
    username: 'Hệ Thống',
    text: `${player.username || userId} mất kết nối và có 60 giây để quay lại.`,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  forfeitPlayer,
  forfeitAndLeave,
  scheduleReconnectForfeit,
};
