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
  resolveDefusePutBack,
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
    pendingTargetSelect: gameState.pendingTargetSelect || null,
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

  // Cards that require a target selection after being played
  const CARDS_REQUIRING_TARGET = ['favor', 'mark', 'ill_take_that', 'target_attack_2x'];

  function resolveTargetSelect(room, targetPlayerId) {
    const gameState = room.gameState;
    const pending = gameState.pendingTargetSelect;
    if (!pending) return;

    const { playerId, cardType, options, comboSize } = pending;
    gameState.pendingTargetSelect = null;

    // Update lastAction with target
    if (gameState.lastAction) {
      gameState.lastAction.targetPlayerId = targetPlayerId;
    }

    // Create pendingAction and start Nope timer
    const actualCardType = comboSize ? `combo_${comboSize}` : cardType;
    const eventId = `${Date.now()}-${Math.random()}`;
    gameState.pendingAction = {
      eventId,
      playerId,
      cardType: actualCardType,
      targetPlayerId,
      options: options || {},
      nopeCount: 0,
    };

    io.to(room.code).emit('game:nopeWindow', { eventId, timeoutMs: 3000 });
    io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
    sendHands(io, room);

    setupNopeTimeout(room, eventId);
  }

  async function executeDraw(room, playerId) {
    const gameState = room.gameState;
    const beforeAlive = gameState.players.find((p) => p.userId === playerId)?.alive;
    io.to(room.code).emit('game:cardDrawn', { playerId });

    drawCard(gameState, playerId, false, (pId) => {
      updateQuestProgress(pId, 'defuse_kitten', 1);
    });
    const afterAlive = gameState.players.find((p) => p.userId === playerId)?.alive;

    if (beforeAlive && !afterAlive) {
      io.to(room.code).emit('game:exploded', { playerId });
    }

    // Check if zombie kitten is pending
    if (gameState.pendingZombie) {
      const activatorId = gameState.pendingZombie.playerId;
      io.to(`user:${activatorId}`).emit('game:zombie:request', { timeoutMs: 15000 });
      
      const currentPendingZombie = gameState.pendingZombie;
      setTimeout(async () => {
        if (gameState.pendingZombie && gameState.pendingZombie === currentPendingZombie) {
          const firstDead = gameState.players.find((p) => !p.alive);
          const randomPos = Math.floor(Math.random() * (gameState.deck.length + 1));
          resolveZombieRevive(gameState, firstDead ? firstDead.userId : null, randomPos);
          io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
          sendHands(io, room);
          await finalizeGame(io, room);
        }
      }, 15000);
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
        if (gameState.pendingDefuse && gameState.pendingDefuse === currentPendingDefuse) {
          const randomPos = Math.floor(Math.random() * (gameState.deck.length + 1));
          resolveDefusePutBack(gameState, randomPos);
          io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
          sendHands(io, room);
          await finalizeGame(io, room);
        }
      }, 15000);
    }

    // If neither zombie nor defuse is pending, change the turn
    if (!gameState.pendingZombie && !gameState.pendingDefuse) {
      io.to(room.code).emit('game:turnChanged', {
        currentPlayerId: gameState.players[gameState.currentPlayerIndex]?.userId,
        drawsRequired: gameState.drawsRequired,
      });
    }

    io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
    sendHands(io, room);
    await finalizeGame(io, room);
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

    socket.on('room:create', async ({ password, isPublic }) => {
      try {
        let username = socket.user?.username ?? `Guest-${guestId.slice(6, 11)}`;
        if (socket.user?.id) {
          const dbUser = await User.findById(socket.user.id);
          if (dbUser) username = dbUser.username;
        }
        const room = createRoom(userId, { password, isPublic }, username);
        socket.join(room.code);
        io.to(room.code).emit('room:updated', { room });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:join', async ({ roomCode, password }) => {
      try {
        let username = socket.user?.username ?? `Guest-${guestId.slice(6, 11)}`;
        if (socket.user?.id) {
          const dbUser = await User.findById(socket.user.id);
          if (dbUser) username = dbUser.username;
        }
        const room = joinRoom(roomCode, userId, username, password);
        socket.join(room.code);
        io.to(room.code).emit('room:updated', { room });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:leave', () => {
      const activeRooms = [...socket.rooms].filter((room) => room.length === 6);
      activeRooms.forEach((roomCode) => {
        const roomBefore = getRoomState(roomCode);
        const player = roomBefore?.players.find((p) => p.userId === userId);
        const pName = player ? player.username : userId;
        const room = leaveRoom(roomCode, userId);
        socket.leave(roomCode);
        socket.emit('room:updated', { room: null });
        if (room) {
          io.to(roomCode).emit('room:updated', { room });
          io.to(roomCode).emit('chat:message', {
            userId: 'system',
            username: 'Hệ Thống',
            text: `Người chơi ${pName} đã rời phòng.`,
            timestamp: new Date().toISOString(),
          });
        }
      });
    });

    socket.on('disconnect', () => {
      setTimeout(() => {
        const activeSockets = io.sockets.adapter.rooms.get(`user:${userId}`);
        if (!activeSockets || activeSockets.size === 0) {
          const activeRoom = findRoomByUser(userId);
          if (activeRoom) {
            const player = activeRoom.players.find((p) => p.userId === userId);
            const pName = player ? player.username : userId;
            const wasPlaying = activeRoom.status === 'playing';
            const room = leaveRoom(activeRoom.code, userId);
            if (room) {
              io.to(activeRoom.code).emit('room:updated', { room });
              if (wasPlaying && room.status === 'waiting') {
                io.to(activeRoom.code).emit('chat:message', {
                  userId: 'system',
                  username: 'Hệ Thống',
                  text: `Trận đấu bị hủy do người chơi ${pName} đã thoát hoặc mất kết nối.`,
                  timestamp: new Date().toISOString(),
                });
              } else {
                io.to(activeRoom.code).emit('chat:message', {
                  userId: 'system',
                  username: 'Hệ Thống',
                  text: `Người chơi ${pName} đã rời phòng hoặc mất kết nối.`,
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
      const isNowCard = cardType.endsWith('_now');

      if (!isNowCard) {
        if (state.pendingAction || state.pendingFavor || state.pendingAlter || state.pendingBury || state.pendingGarbage || state.pendingPotLuck || state.pendingZombie || state.pendingDefuse || state.pendingTargetSelect) {
          socket.emit('error', { message: 'Không thể đánh bài vào lúc này!' });
          return;
        }

        const activePlayer = state.players[state.currentPlayerIndex];
        if (!activePlayer || activePlayer.userId !== userId) {
          socket.emit('error', { message: 'Không phải lượt của bạn!' });
          return;
        }
      } else {
        if (state.pendingFavor || state.pendingAlter || state.pendingBury || state.pendingGarbage || state.pendingPotLuck || state.pendingZombie || state.pendingDefuse || state.pendingTargetSelect) {
          socket.emit('error', { message: 'Không thể đánh bài vào lúc này!' });
          return;
        }
      }

      const player = state.players.find((p) => p.userId === userId);
      const maxHandSize = state.maxHandSize ?? 10;
      if (player && player.hand.length > maxHandSize) {
        socket.emit('error', { message: `Bạn phải hủy bớt bài xuống ${maxHandSize} lá trước!` });
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

      // If this card requires a target and none was provided, prompt player to select
      if (CARDS_REQUIRING_TARGET.includes(actualCardType) && !targetPlayerId) {
        room.gameState.pendingTargetSelect = {
          playerId: userId,
          cardType: actualCardType,
          options,
          startedAt: Date.now(),
        };

        io.to(`user:${userId}`).emit('game:selectTarget:request', {
          cardType: actualCardType,
          timeoutMs: 15000,
        });

        // Timeout: auto-select random alive opponent
        const currentPending = room.gameState.pendingTargetSelect;
        setTimeout(() => {
          if (room.gameState.pendingTargetSelect && room.gameState.pendingTargetSelect === currentPending) {
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
      if (state.pendingAction || state.pendingFavor || state.pendingAlter || state.pendingBury || state.pendingGarbage || state.pendingPotLuck || state.pendingZombie || state.pendingDefuse || state.pendingTargetSelect) {
        socket.emit('error', { message: 'Không thể bốc bài vào lúc này!' });
        return;
      }

      // Enforce turn check
      const activePlayer = state.players[state.currentPlayerIndex];
      if (!activePlayer || activePlayer.userId !== userId) {
        socket.emit('error', { message: 'Không phải lượt của bạn!' });
        return;
      }

      const player = state.players.find((p) => p.userId === userId);
      if (player && player.hand.length > 10) {
        socket.emit('error', { message: 'Bạn phải hủy bớt bài xuống 10 lá trước!' });
        return;
      }

      // Execute the draw immediately — no pre-draw intervention window
      await executeDraw(room, userId);
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
      console.log('game:favor:respond received cardId:', cardId, 'from userId:', userId);
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) {
        console.log('game:favor:respond - Room code not found in socket.rooms:', [...socket.rooms]);
        return;
      }
      const room = getRoomState(roomCode);
      const pending = room?.gameState?.pendingFavor;
      console.log('game:favor:respond - pending:', pending);
      if (!pending || pending.targetPlayerId !== userId) {
        console.log('game:favor:respond - pending targetPlayerId mismatch or pending is null. pending.targetPlayerId:', pending?.targetPlayerId, 'userId:', userId);
        return;
      }

      const giver = room.gameState.players.find((p) => p.userId === userId);
      const receiver = room.gameState.players.find((p) => p.userId === pending.fromPlayerId);
      if (!giver || !receiver) {
        console.log('game:favor:respond - giver or receiver not found. giver:', !!giver, 'receiver:', !!receiver);
        return;
      }

      console.log('giver hand before splice:', giver.hand.map(c => ({ id: c.id, type: c.type })));
      const idx = giver.hand.findIndex((card) => card.id === cardId);
      console.log('giver hand findIndex:', idx);
      if (idx >= 0) {
        const [gift] = giver.hand.splice(idx, 1);
        receiver.hand.push(gift);
        console.log('Card transferred successfully. Card type:', gift.type);
        
        // Run checkStreakingKittenEffect whenever cards change hands
        checkStreakingKittenEffect(room.gameState, giver.userId);
        checkStreakingKittenEffect(room.gameState, receiver.userId);
      } else {
        console.log('Card not found in giver hand! cardId:', cardId);
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

    socket.on('game:combo', ({ cards, targetPlayerId, options: clientOptions }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      const room = roomCode ? getRoomState(roomCode) : null;
      if (!room?.gameState) return;

      const state = room.gameState;
      if (state.pendingAction || state.pendingFavor || state.pendingAlter || state.pendingBury || state.pendingGarbage || state.pendingPotLuck || state.pendingZombie || state.pendingTargetSelect) {
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

      if (cards && (cards.length === 2 || cards.length === 3)) {
        updateQuestProgress(userId, 'steal_card', 1);
      }

      const comboSize = cards.length;

      // Combo 2/3 needs a target — use select-target-after-play flow
      if ((comboSize === 2 || comboSize === 3) && !targetPlayerId) {
        room.gameState.pendingTargetSelect = {
          playerId: userId,
          cardType: `combo_${comboSize}`,
          comboSize,
          options: { cardTypes: comboResult.cardTypes, ...(clientOptions || {}) },
          startedAt: Date.now(),
        };

        io.to(`user:${userId}`).emit('game:selectTarget:request', {
          cardType: `combo_${comboSize}`,
          timeoutMs: 15000,
        });

        // Timeout: auto-select random alive opponent
        const currentPending = room.gameState.pendingTargetSelect;
        setTimeout(() => {
          if (room.gameState.pendingTargetSelect && room.gameState.pendingTargetSelect === currentPending) {
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

      // Queue action — include stealCardType from client if present (for combo_3)
      const eventId = `${Date.now()}-${Math.random()}`;
      room.gameState.pendingAction = {
        eventId,
        playerId: userId,
        cardType: `combo_${cards.length}`,
        targetPlayerId,
        options: { cardTypes: comboResult.cardTypes, ...(clientOptions || {}) },
        nopeCount: 0,
      };

      io.to(roomCode).emit('game:nopeWindow', { eventId, timeoutMs: 3000 });
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);

      setupNopeTimeout(room, eventId);
    });

    socket.on('game:selectTarget:respond', ({ targetPlayerId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const pending = room.gameState.pendingTargetSelect;
      if (!pending || pending.playerId !== userId) return;

      // Validate target is alive opponent
      const target = room.gameState.players.find(p => p.userId === targetPlayerId && p.alive && p.userId !== userId);
      if (!target) return;

      resolveTargetSelect(room, targetPlayerId);
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

    socket.on('game:zombie:respond', async ({ targetPlayerId, insertPosition }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveZombieRevive(room.gameState, targetPlayerId, insertPosition);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
      // Emit turnChanged so client unlocks after zombie revive
      io.to(roomCode).emit('game:turnChanged', {
        currentPlayerId: room.gameState.players[room.gameState.currentPlayerIndex]?.userId,
        drawsRequired: room.gameState.drawsRequired,
      });
      await finalizeGame(io, room);
    });

    socket.on('game:defuse:respond', async ({ insertPosition }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveDefusePutBack(room.gameState, insertPosition);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
      // Emit turnChanged so client unlocks after defuse
      io.to(roomCode).emit('game:turnChanged', {
        currentPlayerId: room.gameState.players[room.gameState.currentPlayerIndex]?.userId,
        drawsRequired: room.gameState.drawsRequired,
      });
      await finalizeGame(io, room);
    });
  });
};
