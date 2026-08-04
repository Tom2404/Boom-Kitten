// Socket handlers for realtime room/game/chat/emote interactions.
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { dispatcher } = require('../game/actions');
const GameContext = require('../game/state/GameContext');
const EffectQueue = require('../game/effects/EffectQueue');
const { hasBlockingInteraction } = require('../game/interactions/interactionGuards');
const {
  getNopeResponseOwnerId,
  isNopeResponderEligible,
  sanitizeActiveInteractionForPublic,
} = require('../game/interactions/interactionPolicy');
const {
  createEventId,
  createPresentationId,
  ensurePresentationId,
  isNopeableAction,
} = require('../game/interactions/cardPresentationContract');
const {
  buildInteractionRequestPayload,
  buildNormalizedInteractionRequest,
  buildReconnectInteractionRequest,
  getInteractionEventName,
} = require('./interactionEvents');
const {
  RECONNECT_GRACE_MS,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  resetRoomForRematch,
  getPublicRooms,
  getRoomState,
  findRoomByUser,
  kickPlayer,
  toggleReady,
  updateRoomSettings,
  touchRoom,
  markPlayerConnected,
  markPlayerDisconnected,
} = require('../game/roomManager');
const { getRuntimeLiveOpsConfig } = require('../services/admin/liveOpsService');
const {
  playCard,
  resolveBarkingKittenAction,
  drawCard,
  validateCombo,
  checkWinCondition,
  checkStreakingKittenEffect,
  passTurn,
  resolveExplosion,
  resolveDefusePutBack,
  resolveZombieRevive,
  resolveArmageddonDistribute,
  resolveArmageddonDecision,
  removeCardFromHand,
  eliminatePlayer,
} = require('../game/gameLogic');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const { toPlayerPresentation } = require('../services/shopEquipmentService');
const { assertCanInviteFriend } = require('../services/friendshipService');
const findUserByIdSafe = async (id) => {
  if (mongoose.connection.readyState !== 1) return null;
  return await User.findById(id).populate('equippedCosmetics.avatarFrame equippedCosmetics.protector');
};
const Transaction = require('../models/Transaction');
const Quest = require('../models/Quest');
const UserQuestProgress = require('../models/UserQuestProgress');
const { calculateMatchmakingChanges } = require('../utils/matchmakingCalculator');
const { applyMatchmakingRating, shouldUpdateMatchmakingRating } = require('../utils/matchmakingRating');
const { completeMatchHistory, startMatchHistory } = require('../services/matchLifecycleService');
const { lockWager, markWagerReview, settleWager } = require('../services/wagerLedgerService');

const reconnectTimers = new Map();
const roomInviteGrants = new Map();

function roomInviteKey(roomCode, userId) {
  return `${roomCode}:${userId}`;
}

function consumeRoomInviteGrant(roomCode, userId, now = Date.now()) {
  const key = roomInviteKey(roomCode, userId);
  const expiresAt = roomInviteGrants.get(key) || 0;
  roomInviteGrants.delete(key);
  return expiresAt > now;
}

function reconnectTimerKey(roomCode, userId) {
  return `${roomCode}:${userId}`;
}

function clearReconnectTimer(roomCode, userId) {
  const key = reconnectTimerKey(roomCode, userId);
  const timer = reconnectTimers.get(key);
  if (timer) clearTimeout(timer);
  reconnectTimers.delete(key);
}

function clearRoomReconnectTimers(roomCode) {
  const prefix = `${roomCode}:`;
  for (const [key, timer] of reconnectTimers) {
    if (!key.startsWith(prefix)) continue;
    clearTimeout(timer);
    reconnectTimers.delete(key);
  }
}

async function updateQuestProgress(userId, actionType, count = 1) {
  try {
    if (!userId || userId.startsWith('guest-') || !mongoose.Types.ObjectId.isValid(userId)) return;
    const activeQuests = await Quest.find({ actionType, isActive: true });
    if (!activeQuests || activeQuests.length === 0) return;

    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    await Promise.all(
      activeQuests.map(async (quest) => {
        let progress = await UserQuestProgress.findOne({ userId, questId: quest._id });
        if (!progress) {
          progress = await UserQuestProgress.create({
            userId,
            questId: quest._id,
            currentCount: 0,
            status: 'in_progress',
            expiresAt: endOfDay,
          });
        } else if (progress.expiresAt < now) {
          progress.currentCount = 0;
          progress.status = 'in_progress';
          progress.expiresAt = endOfDay;
        }

        if (progress.status === 'in_progress') {
          progress.currentCount += count;
          if (progress.currentCount >= quest.targetCount) {
            progress.status = 'completed';
          }
          await progress.save();
        }
      })
    );
  } catch (err) {
    console.error('Error updating quest progress:', err);
  }
}

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
  room.gameState.players.forEach((player) => {
    io.to(`user:${player.userId}`).emit('game:privateHand', {
      cards: getPrivateHandCards(player),
      ...(sourceEventId && player.userId === recipientId ? { sourceEventId } : {}),
    });
  });
}

function sendPlayerSnapshot(socket, room, userId) {
  if (!room.gameState) return;
  socket.emit('game:stateUpdate', {
    publicGameState: sanitizePublicGameState(room.gameState),
  });
  const player = room.gameState.players.find((candidate) => candidate.userId === userId);
  if (player) socket.emit('game:privateHand', { cards: getPrivateHandCards(player) });
  const resumedRequest = buildReconnectInteractionRequest(room.gameState, userId);
  if (resumedRequest) socket.emit('interaction:request', resumedRequest);
}

async function finalizeGame(io, room) {
  if (!room?.gameState || room.status === 'finished') return;
  const winnerId = checkWinCondition(room.gameState);
  if (!winnerId) return;

  room.status = 'finished';
  clearRoomReconnectTimers(room.code);
  emitRoomUpdated(io.to(room.code), room);

  const rankings = room.gameState.players.map((player) => {
    const isWinner = player.userId === winnerId;
    const elimIndex = room.gameState.eliminatedPlayers ? room.gameState.eliminatedPlayers.indexOf(player.userId) : -1;
    const placement = isWinner 
      ? 1 
      : (elimIndex >= 0 
          ? room.gameState.players.length - elimIndex 
          : room.gameState.players.length);
    return { userId: player.userId, placement, result: isWinner ? 'win' : 'lose', forfeit: Boolean(player.forfeited) };
  }).sort((a, b) => a.placement - b.placement);

  const matchmakingRatingChanges = {};
  let wager = null;

  try {
    // Load all user objects from database first
    const dbUsers = {};
    await Promise.all(
      room.gameState.players.map(async (p) => {
        if (p.userId && !p.userId.startsWith('guest-') && mongoose.Types.ObjectId.isValid(p.userId)) {
          try {
            const dbUser = await User.findById(p.userId);
            if (dbUser) {
              dbUsers[p.userId] = dbUser;
            }
          } catch (err) {
            console.error(`Error loading database user ${p.userId}:`, err);
          }
        }
      })
    );

    const playersInGame = room.gameState.players.filter(p => dbUsers[p.userId]);

    if (room.betAmount > 0) {
      try {
        const settledWager = await settleWager({
          roomCode: room.code,
          reference: room.wagerReference,
          placements: rankings.map(({ userId, placement }) => ({ userId, placement })),
          requestId: `settle:${room.wagerReference}`,
        });
        wager = {
          stake: settledWager.stake,
          payouts: settledWager.participants.map((participant) => ({
            userId: String(participant.userId),
            payoutCoins: participant.payoutCoins,
          })),
        };
      } catch (settlementError) {
        await markWagerReview({ reference: room.wagerReference, reason: settlementError.message });
        throw settlementError;
      }
    }

    const updatesMatchmakingRating = shouldUpdateMatchmakingRating({ room, players: room.gameState.players })
      && playersInGame.length === room.gameState.players.length;

    if (updatesMatchmakingRating) {
      const calculatorInput = playersInGame.map(p => {
        const dbUser = dbUsers[p.userId];
        const rankEntry = rankings.find(r => r.userId === p.userId);
        return {
          userId: p.userId,
          ratingBefore: dbUser.matchmakingRating || 1000,
          gamesPlayed: dbUser.stats?.totalGames || 0,
          winStreak: rankEntry?.placement === 1 ? (dbUser.stats?.currentStreak || 0) + 1 : 0,
          placement: rankEntry ? rankEntry.placement : playersInGame.length
        };
      });

      const calculatedRatingList = calculateMatchmakingChanges(calculatorInput);

      calculatedRatingList.forEach((result) => {
        matchmakingRatingChanges[result.userId] = result.ratingDelta;
      });
    } else {
      playersInGame.forEach(p => {
        matchmakingRatingChanges[p.userId] = 0;
      });
    }

    await Promise.all(
      rankings.map(async (entry) => {
        const user = dbUsers[entry.userId];
        if (!user) return;

        const isWin = entry.result === 'win';
        user.stats.totalGames += 1;
        if (isWin) {
          user.stats.wins += 1;
          user.stats.currentStreak += 1;
          user.stats.longestStreak = Math.max(user.stats.longestStreak, user.stats.currentStreak);
        } else {
          user.stats.losses += 1;
          user.stats.currentStreak = 0;
        }

        const ratingBefore = user.matchmakingRating || 1000;
        const requestedRatingChange = matchmakingRatingChanges[entry.userId] || 0;
        applyMatchmakingRating(user, Math.max(1000, ratingBefore + requestedRatingChange));
        matchmakingRatingChanges[entry.userId] = user.matchmakingRating - ratingBefore;

        await user.save();

        // Update quests progress
        await updateQuestProgress(entry.userId, 'play_game', 1);
        if (isWin) {
          await updateQuestProgress(entry.userId, 'win_game', 1);
        }
      }),
    );

    // Complete the durable lifecycle record. Guest ids remain in participantIds,
    // while player result rows retain only valid User references.
    const validWinner = mongoose.Types.ObjectId.isValid(winnerId);
    const validPlayers = rankings
      .filter((entry) => mongoose.Types.ObjectId.isValid(entry.userId))
      .map((entry) => {
        const dbUser = dbUsers[entry.userId];
        const matchmakingRatingAfter = dbUser ? dbUser.matchmakingRating : 1000;
        const matchmakingRatingChange = matchmakingRatingChanges[entry.userId] || 0;
        const matchmakingRatingBefore = matchmakingRatingAfter - matchmakingRatingChange;
        return {
          userId: entry.userId,
          rank: entry.placement,
          result: entry.result,
          matchmakingRatingBefore,
          matchmakingRatingAfter,
          matchmakingRatingChange,
          forfeit: Boolean(entry.forfeit),
        };
      });

    if (validPlayers.length > 0) {
      await completeMatchHistory({
        room,
        validPlayers,
        winnerId: validWinner ? winnerId : undefined,
      });
    }
  } catch (err) {
    console.error('Critical database write error in finalizeGame:', err);
  }

  // Ensure game:ended is ALWAYS sent to the room, even if db writes failed or players are guests
  io.to(room.code).emit('game:ended', { winnerId, rankings, wager });
}

module.exports = function registerGameSocket(io) {
  function mapCardTypeToVfxType(cardType) {
    if (!cardType) return 'GENERIC';
    if (cardType.startsWith('combo_')) return cardType.toUpperCase();
    if (cardType === 'zombie_resolved' || cardType === 'defuse_resolved') return cardType.toUpperCase();
    return cardType.toUpperCase();
  }

  function emitTurnChanged(room, previousPlayerId) {
    const gameState = room.gameState;
    io.to(room.code).emit('game:turnChanged', {
      eventId: createEventId('turn'),
      previousPlayerId,
      currentPlayerId: gameState.players[gameState.currentPlayerIndex]?.userId,
      drawsRequired: gameState.drawsRequired,
      playDirection: gameState.playDirection ?? 1,
    });
  }

  function broadcastActionResolved(room, action, result) {
    const isCancelled = result === 'CANCELLED';
    const vfxType = isCancelled ? 'NOPE' : mapCardTypeToVfxType(action.cardType);
    const presentationId = ensurePresentationId(action);

    io.to(room.code).emit('game:actionResolved', {
      actionId: action.eventId,
      presentationId,
      actionKind: action.cardType?.startsWith('combo_') ? 'combo' : 'card',
      cardType: action.cardType,
      comboType: action.cardType?.startsWith('combo_') ? action.cardType : undefined,
      displayCardType: action.displayCardType,
      playedBy: action.playerId,
      targetPlayerId: action.targetPlayerId,
      result,
      vfxType,
      nopeCount: action.nopeCount || 0,
      metadata: {
        source: 'resolvePendingAction',
        screenCoverage: 0.5,
        scale: 'large',
        cancelledCardType: isCancelled ? action.cardType : undefined,
      },
    });
  }

  function getNowWindowTimeout() {
    return 3000;
  }

  function startNopeWindow(room, action) {
    const timeoutMs = getNowWindowTimeout();
    const presentationId = ensurePresentationId(action);
    action.timeoutMs = timeoutMs;
    action.expiresAt = Date.now() + timeoutMs;
    action.passedPlayers = [];
    action.responseOwnerId = getNopeResponseOwnerId(action);
    room.gameState.pendingAction = action;

    io.to(room.code).emit('game:nopeWindow', {
      eventId: action.eventId,
      presentationId,
      timeoutMs,
      expiresAt: action.expiresAt,
      cardType: action.cardType,
      actingPlayerId: action.playerId,
      responseOwnerId: action.responseOwnerId,
      targetPlayerId: action.targetPlayerId,
      nopeCount: action.nopeCount || 0,
    });
    io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
    sendHands(io, room);

    setupNopeTimeout(room, action.eventId);
  }

  function startActionWindow(room, action) {
    ensurePresentationId(action);
    if (isNopeableAction(action.cardType)) {
      startNopeWindow(room, action);
      return;
    }

    room.gameState.pendingAction = action;
    void resolvePendingActionEarly(room, action.eventId).catch((error) => {
      console.error('Failed to resolve non-Nopeable action:', error);
    });
  }

  async function resolvePendingActionEarly(room, eventId) {
    const gameState = room.gameState;
    if (!gameState || !gameState.pendingAction || gameState.pendingAction.eventId !== eventId) return;

    const action = gameState.pendingAction;

    // Guard against double-resolve (race conditions between timeout / pass / disconnect)
    if (action.status === 'RESOLVED') return;
    action.status = 'RESOLVED';

    // Clear timer
    if (action.timerId) {
      clearTimeout(action.timerId);
      action.timerId = null;
    }

    gameState.pendingAction = null;

    if (action.nopeCount && action.nopeCount % 2 === 1) {
      gameState.lastAction = { ...gameState.lastAction, canceled: true };
      io.to(room.code).emit('game:nopeResult', {
        canceled: true,
        cardType: action.cardType,
        actingPlayerId: action.playerId,
        nopeCount: action.nopeCount,
      });

      // Broadcast Cancelled VFX
      broadcastActionResolved(room, action, 'CANCELLED');

      if (action.parentAction) {
        startNopeWindow(room, action.parentAction);
      } else {
        io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
      }
      return;
    }

    if (action.type === 'defuse_completed') {
      broadcastActionResolved(room, action, 'RESOLVED');
      emitTurnChanged(room, action.playerId);
      io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
      sendHands(io, room);
      await finalizeGame(io, room);
    } else {
      if (action.cardType) {
        io.to(room.code).emit('game:nopeResult', {
          canceled: false,
          cardType: action.cardType,
          actingPlayerId: action.playerId,
          nopeCount: action.nopeCount,
        });

        // Broadcast Resolved VFX
        broadcastActionResolved(room, action, 'RESOLVED');

        await runActionEffect(room, action);
        startNowOnlyWindow(room, action);
      } else {
        if (action.parentAction) {
          startNopeWindow(room, action.parentAction);
        }
      }
    }
  }

  function setupNopeTimeout(room, eventId) {
    const gameState = room.gameState;
    if (!gameState || !gameState.pendingAction || gameState.pendingAction.eventId !== eventId) return;
    const action = gameState.pendingAction;

    if (action.timerId) {
      clearTimeout(action.timerId);
    }
    const remainingMs = Math.max(0, (action.expiresAt || (Date.now() + (action.timeoutMs || 3000))) - Date.now());
    action.timerId = setTimeout(async () => {
      if (!room.gameState || !room.gameState.pendingAction || room.gameState.pendingAction.eventId !== eventId) return;
      await resolvePendingActionEarly(room, eventId);
    }, remainingMs);
  }

  function startNowOnlyWindow(room, resolvedAction) {
    const timeoutMs = 3000;
    const eventId = createEventId('now-window');
    const pendingNow = {
      eventId,
      timeoutMs,
      startedAt: Date.now(),
      resolvedAction: stripActionTimers(resolvedAction),
    };
    room.gameState.pendingNowOnlyWindow = pendingNow;

    io.to(room.code).emit('game:nowOnlyWindow', {
      eventId,
      timeoutMs,
      resolvedCardType: resolvedAction.cardType,
      actingPlayerId: resolvedAction.playerId,
    });
    io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
    sendHands(io, room);

    setupNowOnlyTimeout(room, eventId);
  }

  function setupNowOnlyTimeout(room, eventId) {
    const gameState = room.gameState;
    if (!gameState || !gameState.pendingNowOnlyWindow || gameState.pendingNowOnlyWindow.eventId !== eventId) return;

    const pendingNow = gameState.pendingNowOnlyWindow;
    if (pendingNow.timerId) {
      clearTimeout(pendingNow.timerId);
    }

    pendingNow.timerId = setTimeout(async () => {
      if (!room.gameState || !room.gameState.pendingNowOnlyWindow || room.gameState.pendingNowOnlyWindow.eventId !== eventId) return;

      const pendingNow = room.gameState.pendingNowOnlyWindow;
      room.gameState.pendingNowOnlyWindow = null;
      io.to(room.code).emit('game:nowOnlyWindow:end', { eventId });

      const action = pendingNow.resolvedAction;
      if (action && action.parentAction) {
        startNopeWindow(room, action.parentAction);
      } else {
        io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
      }
    }, 3000);
  }

  function clearNowOnlyWindow(room, eventId) {
    if (!room.gameState?.pendingNowOnlyWindow) return;
    const pendingNow = room.gameState.pendingNowOnlyWindow;
    if (eventId && pendingNow.eventId !== eventId) return;
    if (pendingNow.timerId) {
      clearTimeout(pendingNow.timerId);
    }
    room.gameState.pendingNowOnlyWindow = null;
    io.to(room.code).emit('game:nowOnlyWindow:end', { eventId: pendingNow.eventId });
  }

  // Cards that require a target selection after being played
  const CARDS_REQUIRING_TARGET = ['favor', 'mark', 'ill_take_that', 'target_attack_2x', 'feed_the_dead', 'armageddon'];

  function getValidTargetsForAction(gameState, playerId, cardType) {
    const needsDeadTarget = cardType === 'feed_the_dead';
    return gameState.players.filter((player) => (
      player.userId !== playerId
      && !player.forfeited
      && (needsDeadTarget ? !player.alive : player.alive)
    ));
  }

  function getAutoTargetForTwoPlayerGame(gameState, playerId, cardType) {
    if (!gameState || gameState.players.length !== 2) return null;
    const targets = getValidTargetsForAction(gameState, playerId, cardType);
    return targets.length === 1 ? targets[0].userId : null;
  }

  function resolveTargetSelect(room, targetPlayerId) {
    const gameState = room.gameState;
    const pending = gameState.pendingTargetSelect;
    if (!pending) return;

    const { playerId, cardType, options, comboSize, presentationId, displayCardType, comboCards } = pending;
    gameState.pendingTargetSelect = null;

    // Update lastAction with target
    if (gameState.lastAction) {
      gameState.lastAction.targetPlayerId = targetPlayerId;
    }

    if (cardType === 'barking_kitten') {
      resolveBarkingKittenSocket(room, playerId, targetPlayerId);
      return;
    }

    // Create pendingAction and start Nope timer
    const actualCardType = comboSize ? `combo_${comboSize}` : cardType;
    const eventId = createEventId('action');
    const action = {
      eventId,
      presentationId,
      playerId,
      cardType: actualCardType,
      displayCardType,
      comboCards,
      targetPlayerId,
      options: options || {},
      nopeCount: 0,
    };

    startActionWindow(room, action);
  }

  async function forfeitPlayer(room, userId) {
    const gameState = room.gameState;
    if (!gameState) return;

    const innerPlayersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
    const innerTurnBefore = gameState.currentPlayerIndex;

    const p = gameState.players.find(p => p.userId === userId);
    if (!p || !p.alive) return;

    p.forfeited = true;
    p.connectionStatus = 'connected';
    p.reconnectDeadline = null;
    eliminatePlayer(gameState, userId);
    if (p.hand.length > 0) {
      gameState.discardPile.push(...p.hand);
      p.hand = [];
    }

    // If there is an active interaction, trigger an interaction timeout
    // to auto-resolve or cancel it based on the interaction rules.
    if (gameState.activeInteraction) {
      const interaction = gameState.activeInteraction;

      // Only timeout if the disconnected user is involved
      const isOwner = interaction.owner === userId;
      const isParticipant = interaction.participants.includes(userId);

      if (isOwner || isParticipant) {
        const toContext = new GameContext(gameState, new EffectQueue());
        dispatcher.dispatch('INTERACTION_TIMEOUT', toContext, { interactionId: interaction.id });
      }
    }

    // Resolve target select if the user was doing it (this is handled in PlayComboAction)
    if (gameState.pendingTargetSelect && gameState.pendingTargetSelect.playerId === userId) {
      const aliveOpponents = gameState.players.filter(pl => pl.alive && pl.userId !== userId);
      if (aliveOpponents.length > 0) {
        resolveTargetSelect(room, aliveOpponents[0].userId);
      } else {
        gameState.pendingTargetSelect = null;
      }
    }

    // Pending zombie / defuse
    if (gameState.pendingZombie && gameState.pendingZombie.playerId === userId) {
      resolveZombieRevive(gameState, null, 0);
    }
    if (gameState.pendingDefuse && gameState.pendingDefuse.playerId === userId) {
      resolveDefusePutBack(gameState, 0);
    }

    await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
  }

  async function forfeitAndLeave(roomCode, userId, socketToLeave = null) {
    const roomBefore = getRoomState(roomCode);
    if (!roomBefore) return null;
    clearReconnectTimer(roomCode, userId);

    const gamePlayer = roomBefore.gameState?.players.find((player) => player.userId === userId);
    if (roomBefore.status === 'playing' && gamePlayer?.alive) {
      await forfeitPlayer(roomBefore, userId);
    }

    const room = leaveRoom(roomCode, userId);
    socketToLeave?.leave(roomCode);
    if (room) emitRoomUpdated(io.to(roomCode), room);
    return room;
  }

  function scheduleReconnectForfeit(room, userId) {
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
      await forfeitAndLeave(room.code, userId);
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

  async function resolveBarkingKittenSocket(room, playerId, targetPlayerId) {
    const gameState = room.gameState;
    const playersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
    const turnBefore = gameState.currentPlayerIndex;

    const result = resolveBarkingKittenAction(gameState, playerId, targetPlayerId);
    if (!result) return;

    io.to(room.code).emit('game:barkingKitten:resolved', {
      attackerId: playerId,
      targetId: result.targetId,
      flow: result.flow
    });

    await afterGameStateChanged(room, playersBefore, turnBefore);
  }

  function checkAndHandlePendingDefuseOrZombie(room) {
    const gameState = room.gameState;
    if (!gameState) return false;

    // Check if zombie kitten is pending
    if (gameState.pendingZombie) {
      const activatorId = gameState.pendingZombie.playerId;
      io.to(`user:${activatorId}`).emit('game:zombie:request', { timeoutMs: 15000 });

      const currentPendingZombie = gameState.pendingZombie;
      setTimeout(async () => {
        if (room.gameState && room.gameState.pendingZombie && room.gameState.pendingZombie === currentPendingZombie) {
          const firstDead = room.gameState.players.find((p) => !p.alive && !p.forfeited);
          const revivedPlayerId = firstDead ? firstDead.userId : null;
          const randomPos = Math.floor(Math.random() * (room.gameState.deck.length + 1));
          const clairvoyancePlayerId = room.gameState.pendingZombie.clairvoyancePlayerId;
          resolveZombieRevive(room.gameState, revivedPlayerId, randomPos);
          if (revivedPlayerId) {
            io.to(room.code).emit('game:zombieRevived', { revivedPlayerId, activatorPlayerId: activatorId });
          }
          if (clairvoyancePlayerId) {
            io.to(`user:${clairvoyancePlayerId}`).emit('game:clairvoyance:reveal', { position: randomPos });
          }
          io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
          sendHands(io, room);
          await finalizeGame(io, room);
        }
      }, 15000);
      return true;
    }

    // Check if standard defuse is pending
    if (gameState.pendingDefuse) {
      const activatorId = gameState.pendingDefuse.playerId;
      io.to(`user:${activatorId}`).emit('game:defuse:request', {
        timeoutMs: 15000,
        cardType: gameState.pendingDefuse.card.type
      });

      const currentPendingDefuse = gameState.pendingDefuse;
      setTimeout(async () => {
        if (room.gameState && room.gameState.pendingDefuse && room.gameState.pendingDefuse === currentPendingDefuse) {
          const randomPos = Math.floor(Math.random() * (room.gameState.deck.length + 1));
          const clairvoyancePlayerId = room.gameState.pendingDefuse.clairvoyancePlayerId;
          resolveDefusePutBack(room.gameState, randomPos);
          if (clairvoyancePlayerId) {
            io.to(`user:${clairvoyancePlayerId}`).emit('game:clairvoyance:reveal', { position: randomPos });
          }
          io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
          sendHands(io, room);
          await finalizeGame(io, room);
        }
      }, 15000);
      return true;
    }

    return false;
  }

  async function afterGameStateChanged(room, playersBefore, turnBefore, drawContext = {}) {
    const gameState = room.gameState;
    if (!gameState) return;
    touchRoom(room);

    // Check if anyone died
    playersBefore.forEach((pBefore) => {
      const pAfter = gameState.players.find((p) => p.userId === pBefore.userId);
      if (pBefore.alive && pAfter && !pAfter.alive) {
        io.to(room.code).emit('game:exploded', {
          eventId: createEventId('explosion'),
          drawEventId: drawContext.drawEventId,
          playerId: pBefore.userId,
        });
      }
    });

    // Check and handle pending defuse or zombie
    const pendingHandled = checkAndHandlePendingDefuseOrZombie(room);

    // If turn index changed and no pending defuse/zombie block, notify client
    const turnAfter = gameState.currentPlayerIndex;
    const directionChanged = drawContext.playDirectionBefore !== undefined
      && drawContext.playDirectionBefore !== (gameState.playDirection ?? 1);
    if ((turnBefore !== turnAfter || directionChanged) && !pendingHandled) {
      emitTurnChanged(room, gameState.players[turnBefore]?.userId);
    }

    io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
    sendHands(io, room, {
      sourceEventId: drawContext.drawEventId,
      recipientId: drawContext.recipientId,
    });
    await finalizeGame(io, room);
  }

  async function executeDraw(room, playerId) {
    const gameState = room.gameState;
    const drawEventId = createEventId('draw');
    const playersBefore = gameState.players.map((player) => ({
      userId: player.userId,
      alive: player.alive,
    }));
    const handIdsBefore = new Map(gameState.players.map((player) => [
      player.userId,
      new Set(player.hand.map((card) => card.id)),
    ]));
    const turnBefore = gameState.currentPlayerIndex;
    const playDirectionBefore = gameState.playDirection ?? 1;
    const topCard = gameState.deck[gameState.deck.length - 1];

    drawCard(gameState, playerId, false, (pId) => {
      updateQuestProgress(pId, 'defuse_kitten', 1);
    });

    let drawnCard = null;
    let recipientId = null;
    for (const player of gameState.players) {
      drawnCard = player.hand.find((card) => !handIdsBefore.get(player.userId)?.has(card.id));
      if (drawnCard) {
        recipientId = player.userId;
        break;
      }
    }

    const explodedPlayer = playersBefore.find((before) => {
      const after = gameState.players.find((player) => player.userId === before.userId);
      return before.alive && after && !after.alive;
    });
    const pendingPlayerId = gameState.pendingDefuse?.playerId || gameState.pendingZombie?.playerId;
    if (gameState.pendingDefuse) gameState.pendingDefuse.drawEventId = drawEventId;
    if (gameState.pendingZombie) gameState.pendingZombie.drawEventId = drawEventId;
    recipientId ||= pendingPlayerId || explodedPlayer?.userId || playerId;

    io.to(room.code).emit('game:cardDrawn', {
      eventId: drawEventId,
      playerId,
      recipientId,
    });

    const pendingCard = gameState.pendingDefuse?.card || gameState.pendingZombie?.card;
    const dangerousCardType = pendingCard?.type || (explodedPlayer ? topCard?.type : null);
    if (dangerousCardType) {
      const recipient = gameState.players.find((player) => player.userId === recipientId);
      io.to(room.code).emit('game:drewKitten', {
        eventId: createEventId('kitten'),
        drawEventId,
        playerId: recipientId,
        username: recipient?.username || recipientId,
        cardType: dangerousCardType,
      });
    }

    await afterGameStateChanged(room, playersBefore, turnBefore, {
      drawEventId,
      recipientId,
      playDirectionBefore,
    });
    return drawEventId;
  }

  async function runActionEffect(room, action) {
    const gameState = room.gameState;
    const { playerId, cardType, targetPlayerId, options } = action;

    const playersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
    const turnBefore = gameState.currentPlayerIndex;
    const playDirectionBefore = gameState.playDirection ?? 1;

    const queue = new EffectQueue();
    const context = new GameContext(gameState, queue);
    const payload = {
      cardType,
      userId: playerId,
      targetPlayerId,
      actualCard: action.actualCard,
      options
    };

    dispatcher.dispatch('PLAY_CARD', context, payload);

    // Call quest progress manually since we removed the callback
    updateQuestProgress(playerId, 'defuse_kitten', 1);

    // Some simple card-specific UI events can stay here
    if (cardType.startsWith('see_the_future')) {
      const count = cardType === 'see_the_future_1' ? 1 : cardType === 'see_the_future_5' ? 5 : 3;
      const player = gameState.players.find((p) => p.userId === playerId);
      io.to(`user:${playerId}`).emit('game:seeTheFuture', {
        cards: gameState.deck.slice(-count).reverse(),
      });
      if (player) io.to(`user:${playerId}`).emit('game:privateHand', { cards: getPrivateHandCards(player) });
    }

    if (cardType === 'combo_5') {
      io.to(`user:${playerId}`).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
    }

    if (cardType === 'reveal_the_future_3x') {
      const cards = gameState.deck.slice(-3).reverse();
      io.to(room.code).emit('game:revealTheFuture', { cards });
    }

    // Interaction Management
    if (gameState.activeInteraction) {
      const interaction = gameState.activeInteraction;

      // 1. Broadcast interaction request to participants
      interaction.participants.forEach(pId => {
        const typeCamelCase = getInteractionEventName(interaction.type);
        const requestPayload = buildInteractionRequestPayload(interaction, gameState);

        io.to(`user:${pId}`).emit('interaction:request', buildNormalizedInteractionRequest(interaction, pId, requestPayload));
        io.to(`user:${pId}`).emit(`game:${typeCamelCase}:request`, requestPayload);
      });

      // 2. Set timeout to auto-resolve/cancel
      setTimeout(async () => {
        const state = room.gameState;
        if (state.activeInteraction && state.activeInteraction.id === interaction.id) {
          const innerPlayersBefore = state.players.map(p => ({ userId: p.userId, alive: p.alive }));
          const innerTurnBefore = state.currentPlayerIndex;

          const toContext = new GameContext(state, new EffectQueue());
          dispatcher.dispatch('INTERACTION_TIMEOUT', toContext, { interactionId: interaction.id });

          await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
        }
      }, interaction.timeout);
    }

    await afterGameStateChanged(room, playersBefore, turnBefore, { playDirectionBefore });
  }
  io.use((socket, next) => {
    const rawToken = socket.handshake.auth?.token;
    if (!rawToken) return next();

    try {
      const payload = jwt.verify(rawToken, process.env.JWT_SECRET);
      socket.user = { id: payload.sub, username: payload.username };
      return next();
    } catch (_error) {
      return next();
    }
  });

  io.on('connection', (socket) => {
    const guestId = socket.handshake.auth?.guestId || `guest-${socket.id}`;
    const userId = socket.user?.id ?? guestId;
    socket.join(`user:${userId}`);

    // Auto re-join room if the user was already in one (supports tab switching and reconnection)
    const activeRoom = findRoomByUser(userId);
    if (activeRoom) {
      const roomPlayer = markPlayerConnected(activeRoom.code, userId);
      if (!roomPlayer) {
        void forfeitAndLeave(activeRoom.code, userId);
      } else {
        clearReconnectTimer(activeRoom.code, userId);
        socket.join(activeRoom.code);
        setTimeout(() => {
          if (getRoomState(activeRoom.code) !== activeRoom) return;
          emitRoomUpdated(io.to(activeRoom.code), activeRoom);
          sendPlayerSnapshot(socket, activeRoom, userId);
        }, 200);
      }
    }
    const ensureLeaveOtherRooms = async (targetRoomCode) => {
      const activeRooms = [...socket.rooms].filter((r) => r.length === 6 && r !== targetRoomCode);
      const activeRoom = findRoomByUser(userId);
      if (activeRoom && activeRoom.code !== targetRoomCode && !activeRooms.includes(activeRoom.code)) {
        activeRooms.push(activeRoom.code);
      }

      for (const rCode of activeRooms) {
        const roomBefore = getRoomState(rCode);
        const player = roomBefore?.players.find((p) => p.userId === userId);
        const pName = player ? player.username : userId;
        const wasPlaying = roomBefore?.status === 'playing';

        const room = wasPlaying
          ? await forfeitAndLeave(rCode, userId, socket)
          : leaveRoom(rCode, userId);
        if (!wasPlaying) socket.leave(rCode);
        if (room) {
          emitRoomUpdated(io.to(rCode), room);
          io.to(rCode).emit('chat:message', {
            userId: 'system',
            username: 'Hệ Thống',
            text: `Người chơi ${pName} đã rời phòng.`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    };

    socket.on('room:create', async ({ password, edition, maxPlayers, betAmount, gameMode, customDefuses, customExplodingKittens }) => {
      if (!socket.user) {
        socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Bạn cần đăng nhập để tạo phòng.' });
        return;
      }
      try {
        const liveOps = await getRuntimeLiveOpsConfig();
        if (liveOps.config.maintenanceMode) throw new Error('Hệ thống đang bảo trì. Tạm thời không thể tạo phòng mới.');
        if (getPublicRooms().length >= liveOps.config.maxActiveRooms) throw new Error('Hệ thống đã đạt giới hạn phòng đang hoạt động. Vui lòng thử lại sau.');
        await ensureLeaveOtherRooms(null);
        let playerProfile = { username: socket.user?.username ?? `Guest-${guestId.slice(6, 11)}` };
        if (socket.user?.id) {
          const dbUser = await findUserByIdSafe(socket.user.id);
          if (dbUser) {
            playerProfile = toPlayerPresentation(dbUser, playerProfile.username);
            const requestedBet = parseInt(betAmount, 10);
            const actualBet = !isNaN(requestedBet) && requestedBet >= 0 ? requestedBet : 50;
            if (dbUser.coins < actualBet) {
               throw new Error('Không đủ GoldCoin để tạo phòng cược này');
            }
          }
        } else {
          const requestedBet = parseInt(betAmount, 10);
          const actualBet = !isNaN(requestedBet) && requestedBet >= 0 ? requestedBet : 50;
          if (actualBet > 0) {
            throw new Error('Tài khoản Khách chỉ có thể tạo phòng chơi miễn phí (Cược = 0)');
          }
        }
        const room = createRoom(userId, { password, edition, maxPlayers, betAmount, gameMode, customDefuses, customExplodingKittens }, playerProfile);
        socket.join(room.code);
        emitRoomUpdated(io.to(room.code), room);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:join', async ({ roomCode, password }) => {
      try {
        const roomBefore = getRoomState(roomCode);
        if (roomBefore?.players.some((player) => player.userId === userId)) {
          const player = markPlayerConnected(roomCode, userId);
          if (!player) {
            await forfeitAndLeave(roomCode, userId, socket);
            throw new Error('Đã quá thời gian kết nối lại trận đấu');
          }
          clearReconnectTimer(roomCode, userId);
          socket.join(roomCode);
          emitRoomUpdated(io.to(roomCode), roomBefore);
          sendPlayerSnapshot(socket, roomBefore, userId);
          return;
        }

        if (!socket.user) {
          socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Bạn cần đăng nhập để tham gia phòng.' });
          return;
        }

        await ensureLeaveOtherRooms(roomCode);
        let playerProfile = { username: socket.user?.username ?? `Guest-${guestId.slice(6, 11)}` };
        if (socket.user?.id) {
          const dbUser = await findUserByIdSafe(socket.user.id);
          if (dbUser) {
            playerProfile = toPlayerPresentation(dbUser, playerProfile.username);
            if (roomBefore && dbUser.coins < roomBefore.betAmount) {
              throw new Error('Không đủ GoldCoin để vào phòng');
            }
          }
        } else {
          if (roomBefore && roomBefore.betAmount > 0) {
            throw new Error('Tài khoản Khách chỉ có thể tham gia phòng chơi miễn phí (Cược = 0)');
          }
        }
        const invited = consumeRoomInviteGrant(roomCode, userId);
        const room = joinRoom(roomCode, userId, playerProfile, invited ? roomBefore?.password : password);
        socket.join(room.code);
        emitRoomUpdated(io.to(room.code), room);
        sendPlayerSnapshot(socket, room, userId);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:invite', async ({ roomCode, friendId } = {}) => {
      try {
        if (!socket.user || !mongoose.Types.ObjectId.isValid(friendId)) throw new Error('Lời mời không hợp lệ.');
        const room = getRoomState(roomCode);
        await assertCanInviteFriend({ inviterId: userId, friendId, room, FriendshipModel: Friendship });
        const expiresAt = Date.now() + 2 * 60 * 1000;
        roomInviteGrants.set(roomInviteKey(roomCode, friendId), expiresAt);
        io.to(`user:${friendId}`).emit('room:invitation', {
          roomCode,
          inviterId: userId,
          inviterUsername: socket.user.username,
          expiresAt,
        });
        socket.emit('room:inviteSent', { friendId, roomCode });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:toggleReady', async ({ roomCode, isReady }) => {
      console.log(`[Socket] User ${userId} toggled ready in room ${roomCode}. isReady: ${isReady}`);
      try {
        if (isReady && socket.user?.id) {
          const roomBefore = getRoomState(roomCode);
          if (roomBefore && roomBefore.betAmount > 0) {
            const dbUser = await findUserByIdSafe(socket.user.id);
            if (dbUser && dbUser.coins < roomBefore.betAmount) {
              throw new Error('Không đủ GoldCoin để sẵn sàng');
            }
          }
        }
        const room = toggleReady(roomCode, userId, isReady);
        emitRoomUpdated(io.to(roomCode), room);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:updateSettings', async ({ roomCode, settings }) => {
      console.log(`[Socket] User ${userId} requested to update settings in room ${roomCode}:`, settings);
      try {
        const roomBefore = getRoomState(roomCode);
        const newBet = parseInt(settings.betAmount, 10);
        if (roomBefore && !isNaN(newBet) && newBet > 0) {
          if (socket.user?.id) {
            const dbUser = await findUserByIdSafe(socket.user.id);
            if (dbUser && dbUser.coins < newBet) {
              throw new Error('Bạn không đủ GoldCoin để đặt mức cược này');
            }
          } else {
            throw new Error('Tài khoản Khách không thể đặt cược');
          }
        }
        const room = updateRoomSettings(roomCode, userId, settings);
        emitRoomUpdated(io.to(roomCode), room);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:kickPlayer', ({ roomCode, targetUserId }) => {
      try {
        const roomBefore = getRoomState(roomCode);
        const player = roomBefore?.players.find((p) => p.userId === targetUserId);
        const pName = player ? player.username : targetUserId;

        const room = kickPlayer(roomCode, userId, targetUserId);

        // Notify the kicked player directly
        const targetSocket = [...io.sockets.sockets.values()].find(s => s.user?.id === targetUserId || s.guestId === targetUserId);
        if (targetSocket) {
          targetSocket.leave(roomCode);
          targetSocket.emit('room:kicked', { message: 'Bạn đã bị chủ phòng mời ra ngoài.' });
          emitRoomUpdated(targetSocket, null);
        } else {
          // Fallback if target socket cannot be found via io.sockets
          io.to(roomCode).emit('room:kicked_target', { targetUserId });
        }

        emitRoomUpdated(io.to(roomCode), room);
        io.to(roomCode).emit('chat:message', {
          userId: 'system',
          username: 'Hệ Thống',
          text: `${pName} đã bị chủ phòng mời ra khỏi phòng.`,
          timestamp: new Date().toISOString(),
          type: 'info'
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:leave', async () => {
      const activeRooms = [...socket.rooms].filter((room) => room.length === 6);
      for (const roomCode of activeRooms) {
        const roomBefore = getRoomState(roomCode);
        const player = roomBefore?.players.find((p) => p.userId === userId);
        const pName = player ? player.username : userId;
        const wasPlaying = roomBefore?.status === 'playing';

        const room = wasPlaying
          ? await forfeitAndLeave(roomCode, userId, socket)
          : leaveRoom(roomCode, userId);
        if (!wasPlaying) socket.leave(roomCode);
        emitRoomUpdated(socket, null);
        if (room) {
          emitRoomUpdated(io.to(roomCode), room);
          io.to(roomCode).emit('chat:message', {
            userId: 'system',
            username: 'Hệ Thống',
            text: `Người chơi ${pName} đã rời phòng.`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    socket.on('room:playAgain', () => {
      const activeRoom = findRoomByUser(userId);
      if (activeRoom && activeRoom.status === 'finished') {
        resetRoomForRematch(activeRoom);
        emitRoomUpdated(io.to(activeRoom.code), activeRoom);
        io.to(activeRoom.code).emit('chat:message', {
          userId: 'system',
          username: 'Hệ Thống',
          text: `Một trận đấu mới chuẩn bị bắt đầu! Hãy sẵn sàng!`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('disconnect', () => {
      setTimeout(async () => {
        const activeSockets = io.sockets.adapter.rooms.get(`user:${userId}`);
        if (!activeSockets || activeSockets.size === 0) {
          const activeRoom = findRoomByUser(userId);
          if (activeRoom) {
            const player = activeRoom.players.find((p) => p.userId === userId);
            const gamePlayer = activeRoom.gameState?.players.find((p) => p.userId === userId);
            if (activeRoom.status === 'playing' && gamePlayer?.alive) {
              scheduleReconnectForfeit(activeRoom, userId);
            } else {
              const room = leaveRoom(activeRoom.code, userId);
              if (room) emitRoomUpdated(io.to(activeRoom.code), room);
              io.to(activeRoom.code).emit('chat:message', {
                userId: 'system',
                username: 'Hệ Thống',
                text: `Người chơi ${player?.username || userId} đã rời phòng hoặc mất kết nối.`,
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }, 0);
    });

    socket.on('game:start', async ({ roomCode } = {}) => {
      const targetRoomCode = roomCode || [...socket.rooms].find((room) => room.length === 6);
      if (!targetRoomCode) return;

      try {
        const roomBefore = getRoomState(targetRoomCode);
        if (roomBefore && roomBefore.betAmount > 0) {
          let hasInsufficient = false;
          for (const p of roomBefore.players) {
            if (p.userId === roomBefore.host) continue; // host balance was checked when they created/updated the room

            if (p.userId.startsWith('guest-') || p.userId.length < 24) {
               p.isReady = false;
               hasInsufficient = true;
               continue;
            }
            try {
              const dbUser = await User.findById(p.userId);
              if (!dbUser || dbUser.coins < roomBefore.betAmount) {
                p.isReady = false;
                hasInsufficient = true;
              }
            } catch (err) {
              p.isReady = false;
              hasInsufficient = true;
            }
          }
          if (hasInsufficient) {
             emitRoomUpdated(io.to(targetRoomCode), roomBefore);
             throw new Error('Một số người chơi không đủ GoldCoin hoặc là tài khoản Khách, đã bị huỷ Sẵn sàng');
          }
        }

        if (roomBefore.betAmount > 0) {
          roomBefore.wagerReference = `${roomBefore.code}:${Date.now()}`;
          await lockWager({
            roomCode: roomBefore.code,
            reference: roomBefore.wagerReference,
            players: roomBefore.players,
            stake: roomBefore.betAmount,
            requestId: `lock:${roomBefore.wagerReference}`,
          });
        }
        const room = startGame(targetRoomCode);
        try {
          room.analyticsHistoryId = await startMatchHistory({ room });
        } catch (historyError) {
          console.error('Unable to start match lifecycle history:', historyError);
        }
        emitRoomUpdated(io.to(targetRoomCode), room);
        io.to(targetRoomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
        sendHands(io, room);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('game:playCard', async (request = {}, acknowledge) => {
      const { cardType, targetPlayerId, options } = request || {};
      let acknowledged = false;
      const respond = (payload) => {
        if (acknowledged || typeof acknowledge !== 'function') return;
        acknowledged = true;
        acknowledge(payload);
      };
      try {
        const roomCode = [...socket.rooms].find((room) => room.length === 6);
        if (!roomCode) {
          respond({ ok: false, error: 'Room not found' });
          return;
        }
        const room = getRoomState(roomCode);
        if (!room?.gameState) {
          respond({ ok: false, error: 'Game not found' });
          return;
        }

        const state = room.gameState;
        const queue = new EffectQueue();
        const context = new GameContext(state, queue);
        const payload = { userId, cardType, targetPlayerId, options };

        const result = dispatcher.dispatch('PLAY_CARD_INIT', context, payload);

        if (!result.success) {
          socket.emit('error', { message: result.error });
          respond({ ok: false, error: result.error });
          return;
        }

        let finalTargetPlayerId = payload.finalTargetPlayerId;
        const actualCardType = payload.actualCardType;

        if (!actualCardType) {
          respond({ ok: false, error: 'Invalid card play' });
          return;
        }
        const presentationId = createPresentationId();
        respond({ ok: true, presentationId });

        if (state.pendingNowOnlyWindow && actualCardType.endsWith('_now')) {
          clearNowOnlyWindow(room, state.pendingNowOnlyWindow.eventId);
        }

        const cardSkinIndex = payload.playedCardSkinIndex ?? 0;

        if (!finalTargetPlayerId) {
          finalTargetPlayerId = getAutoTargetForTwoPlayerGame(state, userId, actualCardType);
          payload.finalTargetPlayerId = finalTargetPlayerId;
          if (finalTargetPlayerId && state.lastAction) {
            state.lastAction.targetPlayerId = finalTargetPlayerId;
          }
        }

        // Clairvoyance special short-circuit (still emitting here because it bypasses the Nope window in old logic)
        if (cardType === 'clairvoyance' || cardType === 'clairvoyance_now') {
          const targetPending = state.pendingZombie || state.pendingDefuse;
          if (targetPending) {
            targetPending.clairvoyancePlayerId = userId;
            io.to(roomCode).emit('game:cardPlayedPending', {
              actionId: presentationId,
              presentationId,
              playerId: userId,
              cardType: actualCardType,
              sourceCardType: cardType,
              sourceCardId: options?.cardId,
              skinIndex: cardSkinIndex,
              targetPlayerId,
              canBeNoped: false,
            });
            io.to(roomCode).emit('game:actionResolved', {
              actionId: presentationId,
              presentationId,
              actionKind: 'card',
              cardType: actualCardType,
              playedBy: userId,
              targetPlayerId,
              result: 'RESOLVED',
              vfxType: mapCardTypeToVfxType(actualCardType),
              nopeCount: 0,
              metadata: { source: 'clairvoyance', screenCoverage: 0.5, scale: 'large' },
            });
            io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(state) });
            sendHands(io, room);
            return;
          }
        }

        io.to(roomCode).emit('game:cardPlayedPending', {
          actionId: presentationId,
          presentationId,
          playerId: userId,
          cardType: actualCardType,
          sourceCardType: cardType,
          sourceCardId: options?.cardId,
          skinIndex: cardSkinIndex,
          targetPlayerId: finalTargetPlayerId,
          canBeNoped: isNopeableAction(actualCardType),
          responseWindowMs: getNowWindowTimeout(),
        });

        // Run checkStreakingKittenEffect whenever cards change hands or are played
        checkStreakingKittenEffect(room.gameState, userId);
        if (finalTargetPlayerId) {
          checkStreakingKittenEffect(room.gameState, finalTargetPlayerId);
        }

        const isBKTargetRequired = (actualCardType === 'barking_kitten' && room.gameState.barkingKittenState?.waitingHolder === userId);

        // If this card requires a target and none was provided, prompt player to select
        if ((CARDS_REQUIRING_TARGET.includes(actualCardType) || isBKTargetRequired) && !finalTargetPlayerId) {
          room.gameState.pendingTargetSelect = {
            playerId: userId,
            cardType: actualCardType,
            options,
            presentationId,
            startedAt: Date.now(),
          };

          io.to(`user:${userId}`).emit('game:selectTarget:request', {
            cardType: actualCardType,
            timeoutMs: 15000,
          });

          // Timeout: auto-select random target opponent
          const currentPending = room.gameState.pendingTargetSelect;
          setTimeout(() => {
            if (room.gameState && room.gameState.pendingTargetSelect && room.gameState.pendingTargetSelect === currentPending) {
              const possibleOpponents = getValidTargetsForAction(room.gameState, userId, actualCardType);
              if (possibleOpponents.length > 0) {
                const randomTarget = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
                resolveTargetSelect(room, randomTarget.userId);
              } else {
                room.gameState.pendingTargetSelect = null;
              }
            }
          }, 15000);

          io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
          sendHands(io, room);
          return;
        }

        if (actualCardType === 'barking_kitten') {
          await resolveBarkingKittenSocket(room, userId, finalTargetPlayerId);
        } else {
          const isNowCardActual = actualCardType.endsWith('_now');
          const oldPending = isNowCardActual ? room.gameState.pendingAction : null;

          const eventId = createEventId('action');
          const action = {
            eventId,
            presentationId,
            playerId: userId,
            cardType: actualCardType,
            targetPlayerId: finalTargetPlayerId,
            options,
            nopeCount: 0,
            parentAction: oldPending || undefined,
          };

          startActionWindow(room, action);
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
        respond({ ok: false, error: error.message });
      }
    });


    socket.on('game:drawCard', async (request, acknowledge) => {
      const respond = typeof request === 'function' ? request : acknowledge;
      try {
        const roomCode = [...socket.rooms].find((room) => room.length === 6);
        if (!roomCode) {
          respond?.({ ok: false, error: 'Room not found' });
          return;
        }
        const room = getRoomState(roomCode);
        if (!room?.gameState) {
          respond?.({ ok: false, error: 'Game not found' });
          return;
        }

        const state = room.gameState;
        const queue = new EffectQueue();
        const context = new GameContext(state, queue);
        const payload = { userId };

        const result = dispatcher.dispatch('drawCard', context, payload);

        if (!result.success) {
          socket.emit('error', { message: result.error });
          respond?.({ ok: false, error: result.error });
          return;
        }

        // Execute the draw immediately — no pre-draw intervention window
        const eventId = await executeDraw(room, userId);
        respond?.({ ok: true, eventId });
      } catch (error) {
        socket.emit('error', { message: error.message });
        respond?.({ ok: false, error: error.message });
      }
    });

    socket.on('game:discard', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const player = room.gameState.players.find((p) => p.userId === userId);
      if (!player || !player.alive) return;
      if (player.hand.length <= 10) return;

      const idx = player.hand.findIndex((c) => c.id === cardId);
      if (idx >= 0) {
        const turnBefore = room.gameState.currentPlayerIndex;
        const [card] = player.hand.splice(idx, 1);
        room.gameState.discardPile.push(card);
        io.to(roomCode).emit('game:cardPlayed', { playerId: userId, cardType: `discard_${card.type}` });

        // If the player has finished drawing for their turn and discarded back down to 10 cards, pass the turn.
        const isCurrentPlayer = room.gameState.currentPlayerIndex === room.gameState.players.indexOf(player);
        if (isCurrentPlayer && room.gameState.drawsRequired === 0 && player.hand.length <= 10) {
          if (!room.gameState.pendingDefuse && !room.gameState.pendingZombie) {
            room.gameState.drawsRequired = 1;
            passTurn(room.gameState);
          }
        }

        await afterGameStateChanged(room, [{ userId, alive: player.alive }], turnBefore);
      }
    });

    socket.on('game:nope', ({ originalEventId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      const pending = room?.gameState?.pendingAction;
      if (!pending || pending.eventId !== originalEventId) return;
      if (!isNopeResponderEligible(room.gameState, pending, userId)) return;

      if (!isNopeableAction(pending.cardType)) {
        socket.emit('error', { message: 'Không thể Nope hành động này!' });
        return;
      }

      const player = room.gameState.players.find((p) => p.userId === userId);
      const nopeIdx = player?.hand.findIndex((c) => c.type === 'nope');
      if (nopeIdx === undefined || nopeIdx < 0) return;

      const [nopeCard] = player.hand.splice(nopeIdx, 1);
      room.gameState.discardPile.push(nopeCard);
      const nopeCardActionId = createEventId(`nope-${userId}`);
      io.to(roomCode).emit('game:cardPlayed', {
        playerId: userId,
        cardType: 'nope',
        cardActionId: nopeCardActionId,
        sourceCardId: nopeCard.id,
        skinIndex: nopeCard.skinIndex ?? 0,
        targetPlayerId: pending.playerId,
        nopedCardType: pending.cardType,
        actionId: pending.eventId,
        presentationId: ensurePresentationId(pending),
        nopeIndex: (pending.nopeCount || 0) + 1,
      });

      pending.nopeCount += 1;
      pending.responseOwnerId = userId;
      updateQuestProgress(userId, 'nope_card', 1);

      const newEventId = createEventId('nope-window');
      pending.eventId = newEventId;
      startNopeWindow(room, pending);
    });

    socket.on('game:nopeWindow:pass', ({ eventId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      const pending = room?.gameState?.pendingAction;
      if (!pending || pending.eventId !== eventId) return;
      if (!isNopeResponderEligible(room.gameState, pending, userId)) return;

      if (!pending.passedPlayers) {
        pending.passedPlayers = [];
      }

      if (!pending.passedPlayers.includes(userId)) {
        pending.passedPlayers.push(userId);
      }

      const activePlayers = room.gameState.players.filter(
        (p) => p.alive && p.userId !== getNopeResponseOwnerId(pending)
      );

      if (pending.passedPlayers.length >= activePlayers.length) {
        resolvePendingActionEarly(room, eventId);
      }
    });

    socket.on('game:favor:respond', async ({ cardId, interactionId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: interactionId ?? room.gameState.activeInteraction.id,
        responseData: cardId
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:emote', ({ emoteId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      io.to(roomCode).emit('game:emote', { playerId: userId, emoteId });
    });

    socket.on('chat:message', ({ text }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode || typeof text !== 'string' || text.trim().length === 0) return;
      io.to(roomCode).emit('chat:message', {
        userId,
        username: socket.user?.username ?? 'Guest',
        text: text.slice(0, 500),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('game:combo', ({ cards, targetPlayerId }) => {
      try {
        const roomCode = [...socket.rooms].find((room) => room.length === 6);
        const room = roomCode ? getRoomState(roomCode) : null;
        if (!room?.gameState) return;

        const state = room.gameState;
        if (hasBlockingInteraction(state, { includePendingAction: true, includeNowWindow: true })) {
          socket.emit('error', { message: 'Không thể đánh bài vào lúc này!' });
          return;
        }

        const player = state.players.find((p) => p.userId === userId);
        if (!player || !player.alive) {
          socket.emit('error', { message: 'Không có thể đánh bài!' });
          return;
        }
        if (player.hand.length > 10) {
          socket.emit('error', { message: 'Bạn phải hủy bớt bài xuống 10 lá trước!' });
          return;
        }
        // Turn check for combos
        const activePlayer = state.players[state.currentPlayerIndex];
        if (!activePlayer || activePlayer.userId !== userId) {
          socket.emit('error', { message: 'Không phải lượt của bạn!' });
          return;
        }

        const comboResult = validateCombo(room.gameState, userId, cards ?? []);
        if (!comboResult) return; // Invalid combo
        const comboSize = cards.length;
        const comboCardType = `combo_${comboSize}`;
        const comboCards = comboResult.cardsToPlay.map((card) => ({
          id: card.id,
          type: card.type,
          skinIndex: card.skinIndex ?? 0,
        }));
        let finalTargetPlayerId = targetPlayerId;

        if (!finalTargetPlayerId && (comboSize === 2 || comboSize === 3)) {
          finalTargetPlayerId = getAutoTargetForTwoPlayerGame(state, userId, comboCardType);
        }

        const presentationId = createPresentationId();

        io.to(roomCode).emit('game:cardPlayedPending', {
          actionId: presentationId,
          presentationId,
          playerId: userId,
          cardType: comboCardType,
          comboCards,
          targetPlayerId: finalTargetPlayerId,
          canBeNoped: true,
          responseWindowMs: getNowWindowTimeout(),
        });

        // Run checkStreakingKittenEffect
        checkStreakingKittenEffect(room.gameState, userId);
        if (finalTargetPlayerId) {
          checkStreakingKittenEffect(room.gameState, finalTargetPlayerId);
        }

        if (cards && (cards.length === 2 || cards.length === 3)) {
          updateQuestProgress(userId, 'steal_card', 1);
        }

        // Combo 2/3 needs a target — use select-target-after-play flow
        if ((comboSize === 2 || comboSize === 3) && !finalTargetPlayerId) {
          room.gameState.pendingTargetSelect = {
            playerId: userId,
            cardType: comboCardType,
            comboCards,
            presentationId,
            comboSize,
            options: { cardIds: cards ?? [], cardTypes: comboResult.cardTypes },
            startedAt: Date.now(),
          };

          io.to(`user:${userId}`).emit('game:selectTarget:request', {
            cardType: comboCardType,
            timeoutMs: 15000,
          });

          // Timeout: auto-select random alive opponent
          const currentPending = room.gameState.pendingTargetSelect;
          setTimeout(() => {
            if (room.gameState && room.gameState.pendingTargetSelect && room.gameState.pendingTargetSelect === currentPending) {
              const aliveOpponents = room.gameState.players.filter(p => p.alive && p.userId !== userId);
              if (aliveOpponents.length > 0) {
                const randomTarget = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
                resolveTargetSelect(room, randomTarget.userId);
              } else {
                room.gameState.pendingTargetSelect = null;
              }
            }
          }, 15000);

          io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
          sendHands(io, room);
          return;
        }

        // Queue the combo for Nope resolution before running its effect.
        const eventId = createEventId('action');
        const action = {
          eventId,
          presentationId,
          playerId: userId,
          cardType: comboCardType,
          comboCards,
          targetPlayerId: finalTargetPlayerId,
          options: { cardIds: cards ?? [], cardTypes: comboResult.cardTypes },
          nopeCount: 0,
        };

        startActionWindow(room, action);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('game:selectTarget:respond', ({ targetPlayerId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const pending = room.gameState.pendingTargetSelect;
      if (!pending || pending.playerId !== userId) return;

      // Validate target (must be dead for feed_the_dead, alive for others)
      const isFeed = pending.cardType === 'feed_the_dead';
      const target = room.gameState.players.find(p => (
        p.userId === targetPlayerId
        && !p.forfeited
        && (isFeed ? !p.alive : p.alive)
        && p.userId !== userId
      ));
      if (!target) return;

      resolveTargetSelect(room, targetPlayerId);
    });

    socket.on('game:alterFuture:respond', async ({ rearrangedCards, interactionId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: interactionId ?? room.gameState.activeInteraction.id,
        responseData: rearrangedCards ?? []
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:combo5:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState?.activeInteraction || room.gameState.activeInteraction.type !== 'combo_5') return;

      const playersBefore = room.gameState.players.map((p) => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;
      const context = new GameContext(room.gameState, new EffectQueue());
      const result = dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
        responseData: { cardId },
      });

      if (!result.success) {
        socket.emit('error', { message: result.error || result.reason || 'Không thể lấy lá bài đã chọn!' });
        return;
      }

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:combo3:respond', async ({ cardType, interactionId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState?.activeInteraction || room.gameState.activeInteraction.type !== 'combo_3') return;

      const playersBefore = room.gameState.players.map((player) => ({ userId: player.userId, alive: player.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;
      const context = new GameContext(room.gameState, new EffectQueue());
      const result = dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: interactionId ?? room.gameState.activeInteraction.id,
        responseData: { cardType },
      });

      if (!result.success) {
        socket.emit('error', { message: result.error || result.reason || 'Không thể chọn tên lá bài!' });
        return;
      }

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:bury:respond', async ({ cardId, insertPosition, interactionId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: interactionId ?? room.gameState.activeInteraction.id,
        responseData: { cardId, insertPosition }
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:garbage:respond', async ({ cardId, interactionId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: interactionId ?? room.gameState.activeInteraction.id,
        responseData: cardId
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:potLuck:respond', async ({ cardId, interactionId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: interactionId ?? room.gameState.activeInteraction.id,
        responseData: cardId
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:zombie:respond', async ({ targetPlayerId, insertPosition }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;
      if (!room.gameState.pendingZombie || room.gameState.pendingZombie.playerId !== userId) return;

      const clairvoyancePlayerId = room.gameState.pendingZombie?.clairvoyancePlayerId;
      resolveZombieRevive(room.gameState, targetPlayerId, insertPosition);
      if (targetPlayerId) {
        io.to(roomCode).emit('game:zombieRevived', { revivedPlayerId: targetPlayerId, activatorPlayerId: userId });
      }
      if (clairvoyancePlayerId) {
        io.to(`user:${clairvoyancePlayerId}`).emit('game:clairvoyance:reveal', { position: insertPosition });
      }
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
      // Open a reaction window after zombie revive completed
      const eventId = createEventId('action');
      const presentationId = createPresentationId();
      io.to(roomCode).emit('game:cardPlayedPending', {
        actionId: presentationId,
        playerId: userId,
        cardType: 'zombie_kitten',
        presentationId,
        canBeNoped: false,
      });
      const action = {
        eventId,
        presentationId,
        playerId: userId,
        cardType: 'zombie_resolved',
        type: 'defuse_completed',
        nopeCount: 0,
      };
      startActionWindow(room, action);
    });

    socket.on('game:defuse:respond', async ({ insertPosition }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;
      if (!room.gameState.pendingDefuse || room.gameState.pendingDefuse.playerId !== userId) return;

      const clairvoyancePlayerId = room.gameState.pendingDefuse?.clairvoyancePlayerId;
      resolveDefusePutBack(room.gameState, insertPosition);
      if (clairvoyancePlayerId) {
        io.to(`user:${clairvoyancePlayerId}`).emit('game:clairvoyance:reveal', { position: insertPosition });
      }
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
      // Open a reaction window after defuse completed
      const eventId = createEventId('action');
      const presentationId = createPresentationId();
      io.to(roomCode).emit('game:cardPlayedPending', {
        actionId: presentationId,
        playerId: userId,
        cardType: 'defuse',
        presentationId,
        canBeNoped: false,
      });
      const action = {
        eventId,
        presentationId,
        playerId: userId,
        cardType: 'defuse_resolved',
        type: 'defuse_completed',
        nopeCount: 0,
      };
      startActionWindow(room, action);
    });

    socket.on('game:feedTheDead:respond', async ({ cardId, interactionId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: interactionId ?? room.gameState.activeInteraction.id,
        responseData: cardId
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:graveRobber:respond', async ({ cardId, interactionId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: interactionId ?? room.gameState.activeInteraction.id,
        responseData: cardId
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:digDeeper:respond', async ({ decision, interactionId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: interactionId ?? room.gameState.activeInteraction.id,
        responseData: decision
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:armageddon:distribute', async ({ choice }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;
      if (room.gameState.activeInteraction.type !== 'armageddon') return;
      if (room.gameState.activeInteraction.owner !== userId) return;
      if (room.gameState.pendingArmageddon?.stage !== 'distribute') return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      resolveArmageddonDistribute(room.gameState, choice);

      const targetPlayerId = room.gameState.pendingArmageddon?.targetPlayerId;
      room.gameState.activeInteraction.participants = targetPlayerId ? [targetPlayerId] : [];
      room.gameState.activeInteraction.responses = {};
      room.gameState.activeInteraction.status = 'WAITING';

      if (targetPlayerId) {
        io.to(`user:${targetPlayerId}`).emit('game:armageddon:request', {
          timeoutMs: room.gameState.activeInteraction.timeout,
          stage: 'decision',
        });

        const interactionId = room.gameState.activeInteraction.id;
        setTimeout(async () => {
          if (
            room.gameState?.activeInteraction?.id === interactionId &&
            room.gameState?.pendingArmageddon?.stage === 'decision'
          ) {
            const timeoutPlayersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
            const timeoutTurnBefore = room.gameState.currentPlayerIndex;
            resolveArmageddonDecision(room.gameState, 'keep');
            room.gameState.activeInteraction = null;
            await afterGameStateChanged(room, timeoutPlayersBefore, timeoutTurnBefore);
          }
        }, room.gameState.activeInteraction.timeout);
      } else {
        room.gameState.activeInteraction = null;
        room.gameState.pendingArmageddon = null;
      }

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:armageddon:decision', async ({ decision }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;
      if (room.gameState.activeInteraction.type !== 'armageddon') return;
      if (room.gameState.pendingArmageddon?.stage !== 'decision') return;
      if (room.gameState.pendingArmageddon.targetPlayerId !== userId) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      resolveArmageddonDecision(room.gameState, decision);
      room.gameState.activeInteraction = null;

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });
  });
};

module.exports.sanitizePublicGameState = sanitizePublicGameState;
