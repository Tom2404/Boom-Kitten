// Socket handlers for realtime room/game/chat/emote interactions.
const jwt = require('jsonwebtoken');
const {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  getRoomState,
  findRoomByUser,
} = require('../game/roomManager');
const {
  playCard,
  executeActionEffect,
  drawCard,
  handleNope,
  handleCombo,
  resolveCombo5,
  resolveAlterTheFuture,
  checkWinCondition,
  resolveBury,
  resolveGarbageCollection,
  resolvePotLuck,
  resolveZombieRevive,
  checkStreakingKittenEffect,
} = require('../game/gameLogic');
const User = require('../models/User');
const GameHistory = require('../models/GameHistory');
const Transaction = require('../models/Transaction');
const Quest = require('../models/Quest');
const UserQuestProgress = require('../models/UserQuestProgress');

async function updateQuestProgress(userId, actionType, count = 1) {
  try {
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

function sanitizePublicGameState(gameState) {
  if (!gameState) return null;
  return {
    ...gameState,
    deckCount: gameState.deck.length,
    deck: undefined,
    players: gameState.players.map((player) => ({
      userId: player.userId,
      username: player.username,
      alive: player.alive,
      handCount: player.hand.length,
      markedCards: player.hand
        .filter((c) => c.marked)
        .map((c) => ({ id: c.id, type: c.type })),
    })),
  };
}

function sendHands(io, room) {
  room.gameState.players.forEach((player) => {
    io.to(`user:${player.userId}`).emit('game:privateHand', { cards: player.hand });
  });
}

async function finalizeGame(io, room) {
  const winnerId = checkWinCondition(room.gameState);
  if (!winnerId) return;

  room.status = 'finished';
  io.to(room.code).emit('room:updated', { room });
  const rankings = room.gameState.players
    .map((player) => ({ userId: player.userId, result: player.userId === winnerId ? 'win' : 'lose' }))
    .sort((a, b) => (a.result === 'win' ? -1 : 1));

  await Promise.all(
    rankings.map(async (entry) => {
      const user = await User.findById(entry.userId);
      if (!user) return;
      const isWin = entry.result === 'win';
      const streakBonus = isWin && user.stats.currentStreak + 1 >= 3 ? 30 : 0;
      const reward = isWin ? 50 : 10;

      user.coins += reward + streakBonus;
      user.stats.totalGames += 1;
      if (isWin) {
        user.stats.wins += 1;
        user.stats.currentStreak += 1;
        user.stats.longestStreak = Math.max(user.stats.longestStreak, user.stats.currentStreak);
      } else {
        user.stats.losses += 1;
        user.stats.currentStreak = 0;
      }
      await user.save();

      await Transaction.create({
        userId: user._id,
        type: 'earn',
        amount: reward,
        currency: 'coin',
        description: isWin ? 'Win reward' : 'Loss participation reward',
      });

      if (streakBonus > 0) {
        await Transaction.create({
          userId: user._id,
          type: 'earn',
          amount: streakBonus,
          currency: 'coin',
          description: 'Win streak bonus',
        });
      }

      // Update quests progress
      await updateQuestProgress(entry.userId, 'play_game', 1);
      if (isWin) {
        await updateQuestProgress(entry.userId, 'win_game', 1);
      }
    }),
  );

  await GameHistory.create({
    roomId: room.code,
    players: rankings.map((entry, index) => ({ userId: entry.userId, rank: index + 1, result: entry.result })),
    winner: winnerId,
    duration: 0,
    cardsPlayed: room.gameState.discardPile.length,
    playedAt: new Date(),
  });

  io.to(room.code).emit('game:ended', { winnerId, rankings });
}

module.exports = function registerGameSocket(io) {
  function setupNopeTimeout(room, eventId) {
    setTimeout(async () => {
      const gameState = room.gameState;
      if (!gameState || !gameState.pendingAction || gameState.pendingAction.eventId !== eventId) return;

      const action = gameState.pendingAction;
      gameState.pendingAction = null;

      if (action.nopeCount % 2 === 1) {
        // Canceled by Nope!
        gameState.lastAction = { ...gameState.lastAction, canceled: true };
        io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
        return;
      }

      await runActionEffect(room, action);
    }, 3000);
  }

  async function runActionEffect(room, action) {
    const gameState = room.gameState;
    const { playerId, cardType, targetPlayerId, options } = action;

    executeActionEffect(gameState, cardType, playerId, targetPlayerId, options, (pId, defuseType) => {
      updateQuestProgress(pId, 'defuse_kitten', 1);
    });

    if (cardType.startsWith('see_the_future')) {
      const count = cardType === 'see_the_future_1' ? 1 : cardType === 'see_the_future_5' ? 5 : 3;
      const player = gameState.players.find((p) => p.userId === playerId);
      io.to(`user:${playerId}`).emit('game:seeTheFuture', {
        cards: gameState.deck.slice(-count).reverse(),
      });
      if (player) io.to(`user:${playerId}`).emit('game:privateHand', { cards: player.hand });
    }

    if (cardType.startsWith('alter_the_future')) {
      const count = cardType === 'alter_the_future_5' ? 5 : 3;
      const topCards = gameState.deck.slice(-count).reverse();
      io.to(`user:${playerId}`).emit('game:alterFuture:request', {
        cards: topCards,
        count,
        timeoutMs: 15000,
      });

      setTimeout(() => {
        const pending = gameState.pendingAlter;
        if (!pending || pending.playerId !== playerId) return;
        resolveAlterTheFuture(gameState, []);
        io.to(room.code).emit('game:stateUpdate', {
          publicGameState: sanitizePublicGameState(gameState),
        });
        sendHands(io, room);
      }, 15000);
    }

    if (cardType === 'favor' && targetPlayerId) {
      io.to(`user:${targetPlayerId}`).emit('game:favor:request', { fromPlayerId: playerId, timeoutMs: 15000 });

      setTimeout(() => {
        const pending = gameState.pendingFavor;
        if (!pending || pending.targetPlayerId !== targetPlayerId) return;
        const giver = gameState.players.find((p) => p.userId === targetPlayerId);
        const receiver = gameState.players.find((p) => p.userId === playerId);
        if (giver?.hand?.length && receiver) {
          const idx = Math.floor(Math.random() * giver.hand.length);
          const [gift] = giver.hand.splice(idx, 1);
          receiver.hand.push(gift);
          checkStreakingKittenEffect(gameState, giver.userId);
          checkStreakingKittenEffect(gameState, receiver.userId);
        }
        gameState.pendingFavor = null;
        io.to(room.code).emit('game:stateUpdate', {
          publicGameState: sanitizePublicGameState(gameState),
        });
        sendHands(io, room);
      }, 15000);
    }

    if (cardType === 'bury') {
      io.to(`user:${playerId}`).emit('game:bury:request', { timeoutMs: 15000 });

      setTimeout(() => {
        const pending = gameState.pendingBury;
        if (!pending || pending.playerId !== playerId) return;
        const player = gameState.players.find((p) => p.userId === playerId);
        if (player?.hand?.length) {
          resolveBury(gameState, player.hand[0].id, 0);
        } else {
          gameState.pendingBury = null;
        }
        io.to(room.code).emit('game:stateUpdate', {
          publicGameState: sanitizePublicGameState(gameState),
        });
        sendHands(io, room);
      }, 15000);
    }

    if (cardType === 'garbage_collection') {
      const activePlayers = gameState.players.filter((p) => p.alive && p.hand.length > 0);
      activePlayers.forEach((p) => {
        io.to(`user:${p.userId}`).emit('game:garbage:request', { timeoutMs: 15000 });
      });

      setTimeout(() => {
        const pending = gameState.pendingGarbage;
        if (!pending) return;
        gameState.players.forEach((p) => {
          if (p.alive && p.hand.length > 0 && !pending.responses[p.userId]) {
            resolveGarbageCollection(gameState, p.userId, p.hand[0].id);
          }
        });
        io.to(room.code).emit('game:stateUpdate', {
          publicGameState: sanitizePublicGameState(gameState),
        });
        sendHands(io, room);
      }, 15000);
    }

    if (cardType === 'pot_luck') {
      const activePlayers = gameState.players.filter((p) => p.alive && p.hand.length > 0);
      activePlayers.forEach((p) => {
        io.to(`user:${p.userId}`).emit('game:potLuck:request', { timeoutMs: 15000 });
      });

      setTimeout(() => {
        const pending = gameState.pendingPotLuck;
        if (!pending) return;
        gameState.players.forEach((p) => {
          if (p.alive && p.hand.length > 0 && !pending.responses[p.userId]) {
            resolvePotLuck(gameState, p.userId, p.hand[0].id);
          }
        });
        io.to(room.code).emit('game:stateUpdate', {
          publicGameState: sanitizePublicGameState(gameState),
        });
        sendHands(io, room);
      }, 15000);
    }

    if (cardType === 'combo_5') {
      io.to(`user:${playerId}`).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
    }

    io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
    sendHands(io, room);
    await finalizeGame(io, room);
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
      socket.join(activeRoom.code);
      setTimeout(() => {
        io.to(activeRoom.code).emit('room:updated', { room: activeRoom });
        if (activeRoom.gameState) {
          socket.emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(activeRoom.gameState) });
          const player = activeRoom.gameState.players.find((p) => p.userId === userId);
          if (player) {
            socket.emit('game:privateHand', { cards: player.hand });
          }
        }
      }, 200);
    }

    socket.on('room:create', async ({ maxPlayers, isPublic }) => {
      try {
        let username = socket.user?.username ?? `Guest-${guestId.slice(6, 11)}`;
        if (socket.user?.id) {
          const dbUser = await User.findById(socket.user.id);
          if (dbUser) username = dbUser.username;
        }
        const room = createRoom(userId, { maxPlayers, isPublic }, username);
        socket.join(room.code);
        io.to(room.code).emit('room:updated', { room });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:join', async ({ roomCode }) => {
      try {
        let username = socket.user?.username ?? `Guest-${guestId.slice(6, 11)}`;
        if (socket.user?.id) {
          const dbUser = await User.findById(socket.user.id);
          if (dbUser) username = dbUser.username;
        }
        const room = joinRoom(roomCode, userId, username);
        socket.join(room.code);
        io.to(room.code).emit('room:updated', { room });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:leave', () => {
      const activeRooms = [...socket.rooms].filter((room) => room.length === 6);
      activeRooms.forEach((roomCode) => {
        const room = leaveRoom(roomCode, userId);
        socket.leave(roomCode);
        if (room) io.to(roomCode).emit('room:updated', { room });
      });
    });

    socket.on('disconnect', () => {
      setTimeout(() => {
        const activeSockets = io.sockets.adapter.rooms.get(`user:${userId}`);
        if (!activeSockets || activeSockets.size === 0) {
          const activeRoom = findRoomByUser(userId);
          if (activeRoom) {
            const wasPlaying = activeRoom.status === 'playing';
            const room = leaveRoom(activeRoom.code, userId);
            if (room) {
              io.to(activeRoom.code).emit('room:updated', { room });
              if (wasPlaying && room.status === 'waiting') {
                io.to(activeRoom.code).emit('chat:message', {
                  userId: 'system',
                  username: 'Hệ Thống',
                  text: `Trận đấu bị hủy do người chơi đã thoát hoặc mất kết nối.`,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
        }
      }, 5000);
    });

    socket.on('game:start', ({ roomCode } = {}) => {
      const targetRoomCode = roomCode || [...socket.rooms].find((room) => room.length === 6);
      if (!targetRoomCode) return;

      try {
        const room = startGame(targetRoomCode);
        io.to(targetRoomCode).emit('room:updated', { room });
        io.to(targetRoomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
        sendHands(io, room);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('game:playCard', ({ cardType, targetPlayerId, options }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const state = room.gameState;
      if (state.pendingAction || state.pendingFavor || state.pendingAlter || state.pendingBury || state.pendingGarbage || state.pendingPotLuck || state.pendingZombie) {
        socket.emit('error', { message: 'Không thể đánh bài vào lúc này!' });
        return;
      }

      const player = state.players.find((p) => p.userId === userId);
      if (player && player.hand.length > 10) {
        socket.emit('error', { message: 'Bạn phải hủy bớt bài xuống 10 lá trước!' });
        return;
      }

      const actualCardType = playCard(room.gameState, userId, cardType, targetPlayerId, options);
      if (!actualCardType) return; // Invalid play

      io.to(roomCode).emit('game:cardPlayed', { playerId: userId, cardType, targetPlayerId });

      // Run checkStreakingKittenEffect whenever cards change hands or are played
      checkStreakingKittenEffect(room.gameState, userId);
      if (targetPlayerId) {
        checkStreakingKittenEffect(room.gameState, targetPlayerId);
      }

      const eventId = `${Date.now()}-${Math.random()}`;
      room.gameState.pendingAction = {
        eventId,
        playerId: userId,
        cardType: actualCardType,
        targetPlayerId,
        options,
        nopeCount: 0,
      };

      io.to(roomCode).emit('game:nopeWindow', { eventId, timeoutMs: 3000 });
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);

      setupNopeTimeout(room, eventId);
    });

    socket.on('game:drawCard', async () => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const state = room.gameState;
      if (state.pendingAction || state.pendingFavor || state.pendingAlter || state.pendingBury || state.pendingGarbage || state.pendingPotLuck || state.pendingZombie) {
        socket.emit('error', { message: 'Không thể bốc bài vào lúc này!' });
        return;
      }

      const player = state.players.find((p) => p.userId === userId);
      if (player && player.hand.length > 10) {
        socket.emit('error', { message: 'Bạn phải hủy bớt bài xuống 10 lá trước!' });
        return;
      }

      const beforeAlive = room.gameState.players.find((p) => p.userId === userId)?.alive;
      io.to(roomCode).emit('game:cardDrawn', { playerId: userId });
      drawCard(room.gameState, userId, false, (pId, defuseType) => {
        updateQuestProgress(pId, 'defuse_kitten', 1);
      });
      const afterAlive = room.gameState.players.find((p) => p.userId === userId)?.alive;
      
      if (beforeAlive && !afterAlive) {
        io.to(roomCode).emit('game:exploded', { playerId: userId });
      }

      // Check if zombie kitten is pending
      if (room.gameState.pendingZombie) {
        const activatorId = room.gameState.pendingZombie.playerId;
        io.to(`user:${activatorId}`).emit('game:zombie:request', { timeoutMs: 15000 });
        
        const currentPendingZombie = room.gameState.pendingZombie;
        setTimeout(async () => {
          if (room.gameState.pendingZombie && room.gameState.pendingZombie === currentPendingZombie) {
            const firstDead = room.gameState.players.find((p) => !p.alive);
            if (firstDead) {
              resolveZombieRevive(room.gameState, firstDead.userId);
            } else {
              room.gameState.pendingZombie = null;
            }
            io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
            sendHands(io, room);
            await finalizeGame(io, room);
          }
        }, 15000);
      }

      io.to(roomCode).emit('game:turnChanged', {
        currentPlayerId: room.gameState.players[room.gameState.currentPlayerIndex]?.userId,
        drawsRequired: room.gameState.drawsRequired,
      });
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
      await finalizeGame(io, room);
    });

    socket.on('game:discard', ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const player = room.gameState.players.find((p) => p.userId === userId);
      if (!player || !player.alive) return;
      if (player.hand.length <= 10) return;

      const idx = player.hand.findIndex((c) => c.id === cardId);
      if (idx >= 0) {
        const [card] = player.hand.splice(idx, 1);
        room.gameState.discardPile.push(card);
        io.to(roomCode).emit('game:cardPlayed', { playerId: userId, cardType: `discard_${card.type}` });
        io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
        sendHands(io, room);
      }
    });

    socket.on('game:nope', ({ originalEventId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      const pending = room?.gameState?.pendingAction;
      if (!pending || pending.eventId !== originalEventId) return;

      const player = room.gameState.players.find((p) => p.userId === userId);
      const nopeIdx = player?.hand.findIndex((c) => c.type === 'nope');
      if (nopeIdx === undefined || nopeIdx < 0) return;

      const [nopeCard] = player.hand.splice(nopeIdx, 1);
      room.gameState.discardPile.push(nopeCard);
      io.to(roomCode).emit('game:cardPlayed', { playerId: userId, cardType: 'nope' });

      pending.nopeCount += 1;
      updateQuestProgress(userId, 'nope_card', 1);

      const newEventId = `${Date.now()}-${Math.random()}`;
      pending.eventId = newEventId;

      io.to(roomCode).emit('game:nopeWindow', { eventId: newEventId, timeoutMs: 3000 });
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);

      setupNopeTimeout(room, newEventId);
    });

    socket.on('game:favor:respond', ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      const pending = room?.gameState?.pendingFavor;
      if (!pending || pending.targetPlayerId !== userId) return;

      const giver = room.gameState.players.find((p) => p.userId === userId);
      const receiver = room.gameState.players.find((p) => p.userId === pending.fromPlayerId);
      if (!giver || !receiver) return;

      const idx = giver.hand.findIndex((card) => card.id === cardId);
      if (idx >= 0) {
        const [gift] = giver.hand.splice(idx, 1);
        receiver.hand.push(gift);
      }

      room.gameState.pendingFavor = null;
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
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
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      const room = roomCode ? getRoomState(roomCode) : null;
      if (!room?.gameState) return;

      const state = room.gameState;
      if (state.pendingAction || state.pendingFavor || state.pendingAlter || state.pendingBury || state.pendingGarbage || state.pendingPotLuck || state.pendingZombie) {
        socket.emit('error', { message: 'Không thể đánh bài vào lúc này!' });
        return;
      }

      const player = state.players.find((p) => p.userId === userId);
      if (player && player.hand.length > 10) {
        socket.emit('error', { message: 'Bạn phải hủy bớt bài xuống 10 lá trước!' });
        return;
      }

      const comboResult = handleCombo(room.gameState, userId, cards ?? [], targetPlayerId);
      if (!comboResult) return; // Invalid combo

      io.to(roomCode).emit('game:cardPlayed', {
        playerId: userId,
        cardType: comboResult.cardTypes[0] || 'cat_taco',
        targetPlayerId,
      });

      // Run checkStreakingKittenEffect
      checkStreakingKittenEffect(room.gameState, userId);
      if (targetPlayerId) {
        checkStreakingKittenEffect(room.gameState, targetPlayerId);
      }

      if (cards && cards.length === 2) {
        updateQuestProgress(userId, 'steal_card', 1);
      }

      // Queue action
      const eventId = `${Date.now()}-${Math.random()}`;
      room.gameState.pendingAction = {
        eventId,
        playerId: userId,
        cardType: `combo_${cards.length}`,
        targetPlayerId,
        options: { cardTypes: comboResult.cardTypes },
        nopeCount: 0,
      };

      io.to(roomCode).emit('game:nopeWindow', { eventId, timeoutMs: 3000 });
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);

      setupNopeTimeout(room, eventId);
    });

    socket.on('game:alterFuture:respond', ({ rearrangedCards }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveAlterTheFuture(room.gameState, rearrangedCards ?? []);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
    });

    socket.on('game:combo5:respond', ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveCombo5(room.gameState, cardId);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
    });

    socket.on('game:bury:respond', ({ cardId, insertPosition }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveBury(room.gameState, cardId, insertPosition);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
    });

    socket.on('game:garbage:respond', ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveGarbageCollection(room.gameState, userId, cardId);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
    });

    socket.on('game:potLuck:respond', ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolvePotLuck(room.gameState, userId, cardId);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
    });

    socket.on('game:zombie:respond', ({ targetPlayerId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveZombieRevive(room.gameState, targetPlayerId);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
    });
  });
};
