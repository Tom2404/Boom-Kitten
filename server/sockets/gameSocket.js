// Socket handlers for realtime room/game/chat/emote interactions.
const jwt = require('jsonwebtoken');
const {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  getRoomState,
} = require('../game/roomManager');
const {
  playCard,
  drawCard,
  handleNope,
  handleCombo,
  checkWinCondition,
} = require('../game/gameLogic');
const User = require('../models/User');
const GameHistory = require('../models/GameHistory');
const Transaction = require('../models/Transaction');

function sanitizePublicGameState(gameState) {
  if (!gameState) return null;
  return {
    ...gameState,
    players: gameState.players.map((player) => ({
      userId: player.userId,
      alive: player.alive,
      handCount: player.hand.length,
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

    socket.on('game:playCard', ({ cardType, targetPlayerId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      playCard(room.gameState, userId, cardType, targetPlayerId);
      io.to(roomCode).emit('game:cardPlayed', { playerId: userId, cardType, targetPlayerId });

      const eventId = `${Date.now()}-${Math.random()}`;
      room.gameState.pendingNope = { eventId, resolved: false };
      io.to(roomCode).emit('game:nopeWindow', { eventId, timeoutMs: 3000 });

      setTimeout(async () => {
        if (room.gameState.pendingNope?.eventId !== eventId || room.gameState.pendingNope.resolved) return;

        if (cardType === 'see_the_future') {
          const player = room.gameState.players.find((p) => p.userId === userId);
          io.to(`user:${userId}`).emit('game:seeTheFuture', {
            cards: room.gameState.deck.slice(-3).reverse(),
          });
          if (player) io.to(`user:${userId}`).emit('game:privateHand', { cards: player.hand });
        }

        if (cardType === 'favor' && targetPlayerId) {
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
            }
            room.gameState.pendingFavor = null;
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
      if (beforeAlive && !afterAlive) io.to(roomCode).emit('game:exploded', { playerId: userId });

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
  });
};
