// Socket handlers for realtime room/game/chat/emote interactions.
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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
  resolveFeedTheDead,
  resolveGraveRobber,
  resolveDigDeeper,
  resolveArmageddonDistribute,
  resolveArmageddonDecision,
  checkStreakingKittenEffect,
  passTurn,
} = require('../game/gameLogic');
const User = require('../models/User');
const GameHistory = require('../models/GameHistory');
const Transaction = require('../models/Transaction');
const Quest = require('../models/Quest');
const UserQuestProgress = require('../models/UserQuestProgress');

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

  const eloChanges = {};
  const pinkCoinChanges = {};

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

    if (playersInGame.length >= 2) {
      const winnerPlayer = playersInGame.find(p => p.userId === winnerId);
      const loserPlayers = playersInGame.filter(p => p.userId !== winnerId);

      if (winnerPlayer) {
        const winnerUser = dbUsers[winnerPlayer.userId];
        const wElo = winnerUser.eloPoints || 1000;

        // Opponents' average ELO
        let oppEloSum = 0;
        loserPlayers.forEach(lp => {
          oppEloSum += dbUsers[lp.userId].eloPoints || 1000;
        });
        const oppEloAvg = loserPlayers.length > 0 ? (oppEloSum / loserPlayers.length) : 1000;

        // Expected score for winner
        const wExpected = 1 / (1 + Math.pow(10, (oppEloAvg - wElo) / 400));

        // Winner Elo change: K=32, minimum +15
        let wDelta = Math.round(32 * (1 - wExpected));
        if (wDelta < 15) wDelta = 15;

        // Streak bonus
        const currentStreak = winnerUser.stats.currentStreak || 0;
        if (currentStreak + 1 >= 3) {
          wDelta += 10;
        }

        eloChanges[winnerPlayer.userId] = wDelta;

        // Losers Elo changes: K=16, against winner
        loserPlayers.forEach(lp => {
          const lUser = dbUsers[lp.userId];
          const lElo = lUser.eloPoints || 1000;

          // Expected score for loser vs winner
          const lExpected = 1 / (1 + Math.pow(10, (wElo - lElo) / 400));

          // Loser Elo change: maximum loss -30, minimum loss -5
          let lDelta = Math.round(-16 * lExpected);
          if (lDelta < -30) lDelta = -30;
          if (lDelta > -5) lDelta = -5;

          eloChanges[lp.userId] = lDelta;
        });
      }
    } else {
      // Fallback
      playersInGame.forEach(p => {
        eloChanges[p.userId] = p.userId === winnerId ? 25 : -15;
      });
    }

    await Promise.all(
      rankings.map(async (entry) => {
        const user = dbUsers[entry.userId];
        if (!user) return;
        
        const gemsBefore = user.gems || 0;
        
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

        // Apply Elo Points change
        const eloChange = eloChanges[entry.userId] || 0;
        user.eloPoints = Math.max(1000, (user.eloPoints || 1000) + eloChange);

        await user.save();
        
        const gemsAfter = user.gems || 0;
        pinkCoinChanges[entry.userId] = gemsAfter - gemsBefore;

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

    // Save GameHistory only if winner and players have valid MongoDB ObjectIds (guests won't be saved to GameHistory, which is correct)
    const validWinner = mongoose.Types.ObjectId.isValid(winnerId);
    const validPlayers = rankings
      .filter((entry) => mongoose.Types.ObjectId.isValid(entry.userId))
      .map((entry, index) => ({
        userId: entry.userId,
        rank: index + 1,
        result: entry.result,
        eloChange: eloChanges[entry.userId] || 0,
      }));

    if (validWinner && validPlayers.length > 0) {
      await GameHistory.create({
        roomId: room.code,
        players: validPlayers,
        winner: winnerId,
        duration: 0,
        cardsPlayed: room.gameState.discardPile.length,
        playedAt: new Date(),
      });
    }
  } catch (err) {
    console.error('Critical database write error in finalizeGame:', err);
  }

  // Ensure game:ended is ALWAYS sent to the room, even if db writes failed or players are guests
  io.to(room.code).emit('game:ended', { winnerId, rankings, eloChanges, pinkCoinChanges });
}

module.exports = function registerGameSocket(io) {
  const NOPE_WINDOW_MS = 3000;

  function setupNopeTimeout(room, eventId) {
    setTimeout(async () => {
      const gameState = room.gameState;
      if (!gameState || !gameState.pendingAction || gameState.pendingAction.eventId !== eventId) return;

      const action = gameState.pendingAction;
      gameState.pendingAction = null;

      if (action.nopeCount % 2 === 1) {
        // Canceled by Nope!
        gameState.lastAction = { ...gameState.lastAction, canceled: true };
        io.to(room.code).emit('game:nopeResult', {
          canceled: true,
          cardType: action.cardType,
          actingPlayerId: action.playerId,
          nopeCount: action.nopeCount,
        });
        io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
        return;
      }

      // Card takes effect
      io.to(room.code).emit('game:nopeResult', {
        canceled: false,
        cardType: action.cardType,
        actingPlayerId: action.playerId,
        nopeCount: action.nopeCount,
      });

      await runActionEffect(room, action);
    }, NOPE_WINDOW_MS);
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

    io.to(room.code).emit('game:nopeWindow', {
      eventId,
      timeoutMs: NOPE_WINDOW_MS,
      cardType: gameState.pendingAction?.cardType,
      actingPlayerId: gameState.pendingAction?.playerId,
      targetPlayerId: gameState.pendingAction?.targetPlayerId,
      nopeCount: gameState.pendingAction?.nopeCount ?? 0,
    });
    io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
    sendHands(io, room);

    setupNopeTimeout(room, eventId);
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
          const firstDead = room.gameState.players.find((p) => !p.alive);
          const randomPos = Math.floor(Math.random() * (room.gameState.deck.length + 1));
          const clairvoyancePlayerId = room.gameState.pendingZombie.clairvoyancePlayerId;
          resolveZombieRevive(room.gameState, firstDead ? firstDead.userId : null, randomPos);
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

  async function afterGameStateChanged(room, playersBefore, turnBefore) {
    const gameState = room.gameState;
    if (!gameState) return;

    // Check if anyone died
    playersBefore.forEach((pBefore) => {
      const pAfter = gameState.players.find((p) => p.userId === pBefore.userId);
      if (pBefore.alive && pAfter && !pAfter.alive) {
        io.to(room.code).emit('game:exploded', { playerId: pBefore.userId });
      }
    });

    // Check and handle pending defuse or zombie
    const pendingHandled = checkAndHandlePendingDefuseOrZombie(room);

    // If turn index changed and no pending defuse/zombie block, notify client
    const turnAfter = gameState.currentPlayerIndex;
    if (turnBefore !== turnAfter && !pendingHandled) {
      io.to(room.code).emit('game:turnChanged', {
        currentPlayerId: gameState.players[gameState.currentPlayerIndex]?.userId,
        drawsRequired: gameState.drawsRequired,
      });
    }

    io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
    sendHands(io, room);
    await finalizeGame(io, room);
  }

  async function executeDraw(room, playerId) {
    const gameState = room.gameState;
    const beforeAlive = gameState.players.find((p) => p.userId === playerId)?.alive;
    const turnBefore = gameState.currentPlayerIndex;
    io.to(room.code).emit('game:cardDrawn', { playerId });

    const topCard = gameState.deck[gameState.deck.length - 1];
    let drewKitten = (topCard?.type === 'exploding_kitten' || topCard?.type === 'imploding_kitten' || topCard?.type === 'devilcat') ? topCard.type : null;
    
    // Suppress drawing alert if protected by Streaking Kitten
    if (drewKitten === 'exploding_kitten') {
      const pObj = gameState.players.find((p) => p.userId === playerId);
      if (pObj) {
        const streakingCount = pObj.hand.filter((c) => c.type === 'streaking_kitten').length;
        const explodingCount = pObj.hand.filter((c) => c.type === 'exploding_kitten').length;
        if (explodingCount < streakingCount) {
          drewKitten = null; // Do not alert room
        }
      }
    }

    if (drewKitten) {
      const pObj = gameState.players.find((p) => p.userId === playerId);
      const username = pObj ? pObj.username : playerId;
      io.to(room.code).emit('game:drewKitten', { playerId, username, cardType: drewKitten });
    }

    drawCard(gameState, playerId, false, (pId) => {
      updateQuestProgress(pId, 'defuse_kitten', 1);
    });

    const playersBefore = [{ userId: playerId, alive: beforeAlive }];
    await afterGameStateChanged(room, playersBefore, turnBefore);
  }

  async function runActionEffect(room, action) {
    const gameState = room.gameState;
    const { playerId, cardType, targetPlayerId, options } = action;

    const playersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
    const turnBefore = gameState.currentPlayerIndex;

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

      setTimeout(async () => {
        const pending = gameState.pendingAlter;
        if (!pending || pending.playerId !== playerId) return;
        
        const innerPlayersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
        const innerTurnBefore = gameState.currentPlayerIndex;

        resolveAlterTheFuture(gameState, []);
        
        await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
      }, 15000);
    }

    if (cardType === 'favor' && targetPlayerId) {
      io.to(`user:${targetPlayerId}`).emit('game:favor:request', { fromPlayerId: playerId, timeoutMs: 15000 });

      setTimeout(async () => {
        const pending = gameState.pendingFavor;
        if (!pending || pending.targetPlayerId !== targetPlayerId) return;
        const giver = gameState.players.find((p) => p.userId === targetPlayerId);
        const receiver = gameState.players.find((p) => p.userId === playerId);
        
        const innerPlayersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
        const innerTurnBefore = gameState.currentPlayerIndex;

        if (giver?.hand?.length && receiver) {
          const idx = Math.floor(Math.random() * giver.hand.length);
          const [gift] = giver.hand.splice(idx, 1);
          receiver.hand.push(gift);
          checkStreakingKittenEffect(gameState, giver.userId);
          checkStreakingKittenEffect(gameState, receiver.userId);
        }
        gameState.pendingFavor = null;
        
        await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
      }, 15000);
    }

    if (cardType === 'bury') {
      io.to(`user:${playerId}`).emit('game:bury:request', { timeoutMs: 15000 });

      setTimeout(async () => {
        const pending = gameState.pendingBury;
        if (!pending || pending.playerId !== playerId) return;
        const player = gameState.players.find((p) => p.userId === playerId);
        
        const innerPlayersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
        const innerTurnBefore = gameState.currentPlayerIndex;

        if (player?.hand?.length) {
          resolveBury(gameState, player.hand[0].id, 0);
        } else {
          gameState.pendingBury = null;
        }
        
        await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
      }, 15000);
    }

    if (cardType === 'garbage_collection') {
      const activePlayers = gameState.players.filter((p) => p.alive && p.hand.length > 0);
      activePlayers.forEach((p) => {
        io.to(`user:${p.userId}`).emit('game:garbage:request', { timeoutMs: 15000 });
      });

      setTimeout(async () => {
        const pending = gameState.pendingGarbage;
        if (!pending) return;
        
        const innerPlayersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
        const innerTurnBefore = gameState.currentPlayerIndex;

        gameState.players.forEach((p) => {
          if (p.alive && p.hand.length > 0 && !pending.responses[p.userId]) {
            resolveGarbageCollection(gameState, p.userId, p.hand[0].id);
          }
        });
        
        await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
      }, 15000);
    }

    if (cardType === 'pot_luck') {
      const activePlayers = gameState.players.filter((p) => p.alive && p.hand.length > 0);
      activePlayers.forEach((p) => {
        io.to(`user:${p.userId}`).emit('game:potLuck:request', { timeoutMs: 15000 });
      });

      setTimeout(async () => {
        const pending = gameState.pendingPotLuck;
        if (!pending) return;
        
        const innerPlayersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
        const innerTurnBefore = gameState.currentPlayerIndex;

        gameState.players.forEach((p) => {
          if (p.alive && p.hand.length > 0 && !pending.responses[p.userId]) {
            resolvePotLuck(gameState, p.userId, p.hand[0].id);
          }
        });
        
        await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
      }, 15000);
    }

    if (cardType === 'combo_5') {
      io.to(`user:${playerId}`).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
    }

    if (cardType === 'feed_the_dead') {
      const pending = gameState.pendingFeedTheDead;
      if (pending) {
        const livingPlayers = gameState.players.filter((p) => p.alive && p.userId !== playerId);
        livingPlayers.forEach((p) => {
          io.to(`user:${p.userId}`).emit('game:feedTheDead:request', { targetPlayerId, timeoutMs: 15000 });
        });

        const currentPending = pending;
        setTimeout(async () => {
          const state = room.gameState;
          if (state.pendingFeedTheDead && state.pendingFeedTheDead === currentPending) {
            const innerPlayersBefore = state.players.map(p => ({ userId: p.userId, alive: p.alive }));
            const innerTurnBefore = state.currentPlayerIndex;

            state.players.forEach((p) => {
              if (p.alive && p.userId !== playerId && !state.pendingFeedTheDead.responses[p.userId]) {
                if (p.hand.length > 0) {
                  resolveFeedTheDead(state, p.userId, p.hand[0].id);
                }
              }
            });
            
            await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
          }
        }, 15000);
      }
    }

    if (cardType === 'grave_robber') {
      const pending = gameState.pendingGraveRobber;
      if (pending) {
        const deadPlayersWithCards = gameState.players.filter((p) => !p.alive && p.hand.length > 0);
        deadPlayersWithCards.forEach((p) => {
          io.to(`user:${p.userId}`).emit('game:graveRobber:request', { timeoutMs: 15000 });
        });

        const currentPending = pending;
        setTimeout(async () => {
          const state = room.gameState;
          if (state.pendingGraveRobber && state.pendingGraveRobber === currentPending) {
            const innerPlayersBefore = state.players.map(p => ({ userId: p.userId, alive: p.alive }));
            const innerTurnBefore = state.currentPlayerIndex;

            state.players.forEach((p) => {
              if (!p.alive && p.hand.length > 0 && !state.pendingGraveRobber.responses[p.userId]) {
                resolveGraveRobber(state, p.userId, p.hand[0].id);
              }
            });
            
            await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
          }
        }, 15000);
      }
    }

    if (cardType === 'dig_deeper') {
      const pending = gameState.pendingDigDeeper;
      if (pending) {
        io.to(`user:${playerId}`).emit('game:digDeeper:request', {
          firstCard: pending.firstCard,
          timeoutMs: 15000,
        });

        const currentPending = pending;
        setTimeout(async () => {
          const state = room.gameState;
          if (state.pendingDigDeeper && state.pendingDigDeeper === currentPending) {
            const innerPlayersBefore = state.players.map(p => ({ userId: p.userId, alive: p.alive }));
            const innerTurnBefore = state.currentPlayerIndex;

            resolveDigDeeper(state, 'keep');
            
            await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
          }
        }, 15000);
      }
    }

    if (cardType === 'armageddon') {
      const pending = gameState.pendingArmageddon;
      if (pending) {
        io.to(`user:${playerId}`).emit('game:armageddon:distributeRequest', { timeoutMs: 15000 });

        const currentPending = pending;
        setTimeout(() => {
          const state = room.gameState;
          if (state.pendingArmageddon && state.pendingArmageddon === currentPending && state.pendingArmageddon.stage === 'distribute') {
            resolveArmageddonDistribute(state, 'godcat');
            io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(state) });

            const nextPending = state.pendingArmageddon;
            if (nextPending && nextPending.stage === 'decision') {
              io.to(`user:${nextPending.targetPlayerId}`).emit('game:armageddon:decisionRequest', { timeoutMs: 15000 });
              
              setTimeout(async () => {
                if (state.pendingArmageddon && state.pendingArmageddon === nextPending) {
                  const innerPlayersBefore = state.players.map(p => ({ userId: p.userId, alive: p.alive }));
                  const innerTurnBefore = state.currentPlayerIndex;

                  resolveArmageddonDecision(state, 'keep');
                  
                  await afterGameStateChanged(room, innerPlayersBefore, innerTurnBefore);
                }
              }, 15000);
            }
          }
        }, 15000);
      }
    }

    if (cardType === 'reveal_the_future_3x') {
      const cards = gameState.deck.slice(-3).reverse();
      io.to(room.code).emit('game:revealTheFuture', { cards });
    }

    await afterGameStateChanged(room, playersBefore, turnBefore);
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

    socket.on('room:create', async ({ password, isPublic, edition, maxPlayers }) => {
      try {
        let username = socket.user?.username ?? `Guest-${guestId.slice(6, 11)}`;
        if (socket.user?.id) {
          const dbUser = await User.findById(socket.user.id);
          if (dbUser) username = dbUser.username;
        }
        const room = createRoom(userId, { password, isPublic, edition, maxPlayers }, username);
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

    socket.on('room:playAgain', () => {
      const activeRoom = findRoomByUser(userId);
      if (activeRoom && activeRoom.status === 'finished') {
        activeRoom.status = 'waiting';
        activeRoom.gameState = null;
        activeRoom.players.forEach((p) => {
          p.hand = [];
          p.alive = true;
        });
        io.to(activeRoom.code).emit('room:updated', { room: activeRoom });
        io.to(activeRoom.code).emit('chat:message', {
          userId: 'system',
          username: 'Hệ Thống',
          text: `Một trận đấu mới chuẩn bị bắt đầu! Hãy sẵn sàng!`,
          timestamp: new Date().toISOString(),
        });
      }
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

      // Clairvoyance can be played out of turn during defuse or zombie revive phase
      if (cardType === 'clairvoyance' || cardType === 'clairvoyance_now') {
        const targetPending = state.pendingZombie || state.pendingDefuse;
        if (targetPending) {
          const actualCard = playCard(state, userId, cardType, targetPlayerId, options);
          if (actualCard) {
            targetPending.clairvoyancePlayerId = userId;
            io.to(roomCode).emit('game:cardPlayed', { playerId: userId, cardType: actualCard, targetPlayerId });
            io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(state) });
            sendHands(io, room);
            return;
          }
        } else {
          socket.emit('error', { message: 'Chỉ có thể chơi Thiên Nhãn khi có người đang gỡ mìn hoặc hồi sinh!' });
          return;
        }
      }
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

      io.to(roomCode).emit('game:nopeWindow', {
        eventId,
        timeoutMs: NOPE_WINDOW_MS,
        cardType: actualCardType,
        actingPlayerId: userId,
        targetPlayerId,
        nopeCount: 0,
      });
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

      const player = room.gameState.players.find((p) => p.userId === userId);
      const nopeIdx = player?.hand.findIndex((c) => c.type === 'nope');
      if (nopeIdx === undefined || nopeIdx < 0) return;

      const [nopeCard] = player.hand.splice(nopeIdx, 1);
      room.gameState.discardPile.push(nopeCard);
      io.to(roomCode).emit('game:cardPlayed', { 
        playerId: userId, 
        cardType: 'nope',
        targetPlayerId: pending.playerId,
        nopedCardType: pending.cardType
      });

      pending.nopeCount += 1;
      updateQuestProgress(userId, 'nope_card', 1);

      const newEventId = `${Date.now()}-${Math.random()}`;
      pending.eventId = newEventId;

      io.to(roomCode).emit('game:nopeWindow', {
        eventId: newEventId,
        timeoutMs: NOPE_WINDOW_MS,
        cardType: pending.cardType,
        actingPlayerId: pending.playerId,
        targetPlayerId: pending.targetPlayerId,
        nopeCount: pending.nopeCount,
      });
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);

      setupNopeTimeout(room, newEventId);
    });

    socket.on('game:favor:respond', async ({ cardId }) => {
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

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

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

      io.to(roomCode).emit('game:nopeWindow', { eventId, timeoutMs: NOPE_WINDOW_MS });
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

    socket.on('game:combo5:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      resolveCombo5(room.gameState, cardId);

      await afterGameStateChanged(room, playersBefore, turnBefore);
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

    socket.on('game:garbage:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      resolveGarbageCollection(room.gameState, userId, cardId);

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:potLuck:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      resolvePotLuck(room.gameState, userId, cardId);

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:zombie:respond', async ({ targetPlayerId, insertPosition }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const clairvoyancePlayerId = room.gameState.pendingZombie?.clairvoyancePlayerId;
      resolveZombieRevive(room.gameState, targetPlayerId, insertPosition);
      if (clairvoyancePlayerId) {
        io.to(`user:${clairvoyancePlayerId}`).emit('game:clairvoyance:reveal', { position: insertPosition });
      }
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

      const clairvoyancePlayerId = room.gameState.pendingDefuse?.clairvoyancePlayerId;
      resolveDefusePutBack(room.gameState, insertPosition);
      if (clairvoyancePlayerId) {
        io.to(`user:${clairvoyancePlayerId}`).emit('game:clairvoyance:reveal', { position: insertPosition });
      }
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
      // Emit turnChanged so client unlocks after defuse
      io.to(roomCode).emit('game:turnChanged', {
        currentPlayerId: room.gameState.players[room.gameState.currentPlayerIndex]?.userId,
        drawsRequired: room.gameState.drawsRequired,
      });
      await finalizeGame(io, room);
    });

    socket.on('game:feedTheDead:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      resolveFeedTheDead(room.gameState, userId, cardId);

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:graveRobber:respond', ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveGraveRobber(room.gameState, userId, cardId);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
    });

    socket.on('game:digDeeper:respond', async ({ decision }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveDigDeeper(room.gameState, decision);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
      io.to(roomCode).emit('game:turnChanged', {
        currentPlayerId: room.gameState.players[room.gameState.currentPlayerIndex]?.userId,
        drawsRequired: room.gameState.drawsRequired,
      });
      await finalizeGame(io, room);
    });

    socket.on('game:armageddon:distribute', ({ choice }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveArmageddonDistribute(room.gameState, choice);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });

      const pending = room.gameState.pendingArmageddon;
      if (pending && pending.stage === 'decision') {
        io.to(`user:${pending.targetPlayerId}`).emit('game:armageddon:decisionRequest', { timeoutMs: 15000 });
        
        const currentPending = pending;
        setTimeout(async () => {
          if (room.gameState.pendingArmageddon && room.gameState.pendingArmageddon === currentPending) {
            resolveArmageddonDecision(room.gameState, 'keep');
            io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
            sendHands(io, room);
            await finalizeGame(io, room);
          }
        }, 15000);
      }
    });

    socket.on('game:armageddon:decision', async ({ decision }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      resolveArmageddonDecision(room.gameState, decision);
      io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
      sendHands(io, room);
      await finalizeGame(io, room);
    });
  });
};
