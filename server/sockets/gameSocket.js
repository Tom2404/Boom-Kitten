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

function sanitizePublicGameState(gameState) {
  if (!gameState) return null;
  return {
    ...gameState,
    deckCount: gameState.deck.length,
    deck: undefined,
    players: gameState.players.map((player) => ({
      userId: player.userId,
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
    const userId = socket.user?.id ?? socket.id;
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

    socket.on('room:create', ({ maxPlayers, isPublic }) => {
      try {
        const room = createRoom(userId, { maxPlayers, isPublic });
        socket.join(room.code);
        io.to(room.code).emit('room:updated', { room });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:join', ({ roomCode }) => {
      try {
        const room = joinRoom(roomCode, userId);
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

    socket.on('game:start', () => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;

      try {
        const room = startGame(roomCode);
        io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
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

      playCard(room.gameState, userId, cardType, targetPlayerId, options);
      io.to(roomCode).emit('game:cardPlayed', { playerId: userId, cardType, targetPlayerId });

      // Run checkStreakingKittenEffect whenever cards change hands or are played
      checkStreakingKittenEffect(room.gameState, userId);
      if (targetPlayerId) {
        checkStreakingKittenEffect(room.gameState, targetPlayerId);
      }

      const eventId = `${Date.now()}-${Math.random()}`;
      room.gameState.pendingNope = { eventId, resolved: false };
      io.to(roomCode).emit('game:nopeWindow', { eventId, timeoutMs: 3000 });

      setTimeout(async () => {
        if (room.gameState.pendingNope?.eventId !== eventId || room.gameState.pendingNope.resolved) return;

        let actualCardType = cardType;
        if (cardType === 'godcat' && options?.asCardType) {
          actualCardType = options.asCardType;
        }

        if (actualCardType.startsWith('see_the_future')) {
          const count = actualCardType === 'see_the_future_1' ? 1 : actualCardType === 'see_the_future_5' ? 5 : 3;
          const player = room.gameState.players.find((p) => p.userId === userId);
          io.to(`user:${userId}`).emit('game:seeTheFuture', {
            cards: room.gameState.deck.slice(-count).reverse(),
          });
          if (player) io.to(`user:${userId}`).emit('game:privateHand', { cards: player.hand });
        }

        if (actualCardType.startsWith('alter_the_future')) {
          const count = actualCardType === 'alter_the_future_5' ? 5 : 3;
          const topCards = room.gameState.deck.slice(-count).reverse();
          io.to(`user:${userId}`).emit('game:alterFuture:request', {
            cards: topCards,
            count,
            timeoutMs: 15000,
          });

          setTimeout(() => {
            const pending = room.gameState.pendingAlter;
            if (!pending || pending.playerId !== userId) return;
            resolveAlterTheFuture(room.gameState, []);
            io.to(roomCode).emit('game:stateUpdate', {
              publicGameState: sanitizePublicGameState(room.gameState),
            });
            sendHands(io, room);
          }, 15000);
        }

        if (actualCardType === 'favor' && targetPlayerId) {
          room.gameState.pendingFavor = { fromPlayerId: userId, targetPlayerId };
          io.to(`user:${targetPlayerId}`).emit('game:favor:request', { fromPlayerId: userId, timeoutMs: 15000 });

          setTimeout(() => {
            const pending = room.gameState.pendingFavor;
            if (!pending || pending.targetPlayerId !== targetPlayerId) return;
            const giver = room.gameState.players.find((p) => p.userId === targetPlayerId);
            const receiver = room.gameState.players.find((p) => p.userId === userId);
            if (giver?.hand?.length && receiver) {
              const idx = Math.floor(Math.random() * giver.hand.length);
              const [gift] = giver.hand.splice(idx, 1);
              receiver.hand.push(gift);
              checkStreakingKittenEffect(room.gameState, giver.userId);
              checkStreakingKittenEffect(room.gameState, receiver.userId);
            }
            room.gameState.pendingFavor = null;
            io.to(roomCode).emit('game:stateUpdate', {
              publicGameState: sanitizePublicGameState(room.gameState),
            });
            sendHands(io, room);
          }, 15000);
        }

        if (actualCardType === 'bury') {
          io.to(`user:${userId}`).emit('game:bury:request', { timeoutMs: 15000 });

          setTimeout(() => {
            const pending = room.gameState.pendingBury;
            if (!pending || pending.playerId !== userId) return;
            const player = room.gameState.players.find((p) => p.userId === userId);
            if (player?.hand?.length) {
              resolveBury(room.gameState, player.hand[0].id, 0);
            } else {
              room.gameState.pendingBury = null;
            }
            io.to(roomCode).emit('game:stateUpdate', {
              publicGameState: sanitizePublicGameState(room.gameState),
            });
            sendHands(io, room);
          }, 15000);
        }

        if (actualCardType === 'garbage_collection') {
          const activePlayers = room.gameState.players.filter((p) => p.alive && p.hand.length > 0);
          activePlayers.forEach((p) => {
            io.to(`user:${p.userId}`).emit('game:garbage:request', { timeoutMs: 15000 });
          });

          setTimeout(() => {
            const pending = room.gameState.pendingGarbage;
            if (!pending) return;
            room.gameState.players.forEach((p) => {
              if (p.alive && p.hand.length > 0 && !pending.responses[p.userId]) {
                resolveGarbageCollection(room.gameState, p.userId, p.hand[0].id);
              }
            });
            io.to(roomCode).emit('game:stateUpdate', {
              publicGameState: sanitizePublicGameState(room.gameState),
            });
            sendHands(io, room);
          }, 15000);
        }

        if (actualCardType === 'pot_luck') {
          const activePlayers = room.gameState.players.filter((p) => p.alive && p.hand.length > 0);
          activePlayers.forEach((p) => {
            io.to(`user:${p.userId}`).emit('game:potLuck:request', { timeoutMs: 15000 });
          });

          setTimeout(() => {
            const pending = room.gameState.pendingPotLuck;
            if (!pending) return;
            room.gameState.players.forEach((p) => {
              if (p.alive && p.hand.length > 0 && !pending.responses[p.userId]) {
                resolvePotLuck(room.gameState, p.userId, p.hand[0].id);
              }
            });
            io.to(roomCode).emit('game:stateUpdate', {
              publicGameState: sanitizePublicGameState(room.gameState),
            });
            sendHands(io, room);
          }, 15000);
        }

        io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
        sendHands(io, room);
        await finalizeGame(io, room);
      }, 3000);
    });

    socket.on('game:drawCard', async () => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const beforeAlive = room.gameState.players.find((p) => p.userId === userId)?.alive;
      drawCard(room.gameState, userId);
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

    socket.on('game:nope', ({ originalEventId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState?.pendingNope) return;
      if (room.gameState.pendingNope.eventId !== originalEventId) return;

      room.gameState.pendingNope.resolved = true;
      handleNope(room.gameState, userId);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
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
      handleCombo(room.gameState, userId, cards ?? [], targetPlayerId);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
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
