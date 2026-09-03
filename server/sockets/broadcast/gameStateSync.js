const { sanitizeActiveInteractionForPublic } = require('../../game/interactions/interactionPolicy');
const { RECONNECT_GRACE_MS } = require('../../game/roomManager');

function stripActionTimers(action) {
  if (!action) return null;
  const { timerId, parentAction, ...safeAction } = action;
  if (parentAction) {
    safeAction.parentAction = stripActionTimers(parentAction);
  }
  return safeAction;
}

function sanitizePublicGameState(gameState) {
  if (!gameState) return null;
  const copy = {
    ...gameState,
    deckCount: gameState.deck.length,
    deck: undefined,
    topCard: gameState.deck.length > 0 ? {
      id: gameState.deck[gameState.deck.length - 1].id,
      type: gameState.deck[gameState.deck.length - 1].type,
      faceUp: !!gameState.deck[gameState.deck.length - 1].faceUp,
    } : null,
    pendingAction: stripActionTimers(gameState.pendingAction),
    pendingNowOnlyWindow: gameState.pendingNowOnlyWindow
      ? {
          ...gameState.pendingNowOnlyWindow,
          timerId: undefined,
          resolvedAction: stripActionTimers(gameState.pendingNowOnlyWindow.resolvedAction),
        }
      : null,
    pendingTargetSelect: gameState.pendingTargetSelect || null,
    activeInteraction: sanitizeActiveInteractionForPublic(gameState.activeInteraction),
    players: gameState.players.map((player) => ({
      userId: player.userId,
      username: player.username,
      avatar: player.avatar || '',
      avatarFrame: player.avatarFrame || null,
      protector: player.protector || null,
      alive: player.alive,
      connectionStatus: player.connectionStatus || 'connected',
      reconnectDeadline: player.reconnectDeadline ?? null,
      forfeited: !!player.forfeited,
      handCount: player.hand.length,
      markedCards: player.hand
        .filter((c) => c.marked)
        .map((c) => ({ id: c.id, type: c.type })),
    })),
  };

  if (copy.pendingDigDeeper) {
    copy.pendingDigDeeper = {
      ...copy.pendingDigDeeper,
      firstCard: undefined,
    };
  }

  if (copy.pendingArmageddon) {
    copy.pendingArmageddon = {
      ...copy.pendingArmageddon,
      activatorCard: undefined,
      targetCard: undefined,
    };
  }

  return copy;
}

function sanitizeRoom(room) {
  if (!room) return null;
  return {
    ...room,
    reconnectGraceMs: room.reconnectGraceMs || RECONNECT_GRACE_MS,
    gameState: room.gameState ? sanitizePublicGameState(room.gameState) : room.gameState,
    password: undefined,
  };
}

function emitRoomUpdated(target, room) {
  target.emit('room:updated', { room: sanitizeRoom(room) });
}

function getPrivateHandCards(player) {
  return player.blinded
    ? player.hand.map((c) => ({ id: c.id, skinIndex: c.skinIndex, type: 'hidden', marked: c.marked }))
    : player.hand;
}

function sendHands(io, room, { sourceEventId, recipientId } = {}) {
  if (!room?.gameState) return;
  room.gameState.players.forEach((player) => {
    io.to(`user:${player.userId}`).emit('game:privateHand', {
      cards: getPrivateHandCards(player),
      ...(sourceEventId && player.userId === recipientId ? { sourceEventId } : {}),
    });
  });
}

function sendPlayerSnapshot(socket, room, userId) {
  if (!room?.gameState) return;
  socket.emit('game:stateUpdate', {
    publicGameState: sanitizePublicGameState(room.gameState),
  });
  const player = room.gameState.players.find((candidate) => candidate.userId === userId);
  if (player) socket.emit('game:privateHand', { cards: getPrivateHandCards(player) });
  const { buildReconnectInteractionRequest } = require('../interactionEvents');
  const resumedRequest = buildReconnectInteractionRequest(room.gameState, userId);
  if (resumedRequest) socket.emit('interaction:request', resumedRequest);
}

module.exports = {
  stripActionTimers,
  sanitizePublicGameState,
  sanitizeRoom,
  emitRoomUpdated,
  getPrivateHandCards,
  sendHands,
  sendPlayerSnapshot,
};
