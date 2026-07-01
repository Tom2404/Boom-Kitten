// Socket handlers for realtime room/game/chat/emote interactions.
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { dispatcher } = require('../game/actions');
const GameContext = require('../game/state/GameContext');
const EffectQueue = require('../game/effects/EffectQueue');
const {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  getPublicRooms,
  getRoomState,
  findRoomByUser,
  kickPlayer,
  toggleReady,
  updateRoomSettings,
} = require('../game/roomManager');
const {
  playCard,
  resolveBarkingKittenAction,
  drawCard,
  handleCombo,
  checkStreakingKittenEffect,
  passTurn,
  resolveExplosion,
  removeCardFromHand,
  eliminatePlayer,
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

function getPrivateHandCards(player) {
  return player.blinded
    ? player.hand.map((c) => ({ id: c.id, skinIndex: c.skinIndex, type: 'hidden', marked: c.marked }))
    : player.hand;
}

function sendHands(io, room) {
  room.gameState.players.forEach((player) => {
    io.to(`user:${player.userId}`).emit('game:privateHand', { cards: getPrivateHandCards(player) });
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
        
        const betAmount = room.betAmount || 50;
        let reward = 0;
        let isLossDeduction = false;
        
        if (isWin) {
          // Winner gets the pot minus 10% tax
          reward = Math.floor(betAmount * (room.gameState.players.length - 1) * 0.9);
          user.coins += reward + streakBonus;
        } else {
          // Loser gets deducted bet amount
          isLossDeduction = true;
          reward = -betAmount;
          user.coins = Math.max(0, user.coins + reward);
        }

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

        if (reward !== 0) {
          await Transaction.create({
            userId: user._id,
            type: isLossDeduction ? 'spend' : 'earn',
            amount: Math.abs(reward),
            currency: 'coin',
            description: isLossDeduction ? 'Loss bet deduction' : 'Win bet reward (taxed)',
          });
        }

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

function penalizeEarlyLeave(userId, betAmount) {
  if (userId && !userId.startsWith('guest-') && mongoose.Types.ObjectId.isValid(userId)) {
    User.findById(userId).then(dbUser => {
      if (dbUser) {
        dbUser.coins = Math.max(0, dbUser.coins - betAmount);
        dbUser.save().catch(err => console.error(err));
        Transaction.create({
          userId: dbUser._id,
          type: 'spend',
          amount: betAmount,
          currency: 'coin',
          description: 'Phạt rời trận đấu giữa chừng'
        }).catch(err => console.error(err));
      }
    }).catch(err => console.error('Error penalizing early leave:', err));
  }
}

module.exports = function registerGameSocket(io) {
  const NOPE_WINDOW_MS = 3000;

  const NOPEABLE_ACTIONS = [
    'attack_2x', 'personal_attack_2x', 'target_attack_2x', 'attack_of_the_dead',
    'skip', 'super_skip',
    'see_the_future_1', 'see_the_future_3', 'see_the_future_5', 'see_the_future_3_now', 'reveal_the_future',
    'alter_the_future_3', 'alter_the_future_5', 'alter_the_future_3_now',
    'favor', 'garbage', 'pot_luck',
    'shuffle', 'shuffle_now',
    'swap_top_and_bottom_now',
    'feed_the_dead',
    'grave_robber',
    'dig_deeper',
    'armageddon',
    'nope'
  ];

  function isNopeableAction(cardType) {
    if (!cardType) return false;
    if (NOPEABLE_ACTIONS.includes(cardType)) return true;
    if (cardType.startsWith('combo_')) return true;
    return false;
  }

  function getNowWindowTimeout() {
    return 3000;
  }

  function startNopeWindow(room, action) {
    const timeoutMs = getNowWindowTimeout();
    action.timeoutMs = timeoutMs;
    action.passedPlayers = [];
    room.gameState.pendingAction = action;

    io.to(room.code).emit('game:nopeWindow', {
      eventId: action.eventId,
      timeoutMs,
      cardType: action.cardType,
      actingPlayerId: action.playerId,
      targetPlayerId: action.targetPlayerId,
      nopeCount: action.nopeCount || 0,
    });
    io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(room.gameState) });
    sendHands(io, room);

    setupNopeTimeout(room, action.eventId);
  }

  async function resolvePendingActionEarly(room, eventId) {
    const gameState = room.gameState;
    if (!gameState || !gameState.pendingAction || gameState.pendingAction.eventId !== eventId) return;

    const action = gameState.pendingAction;
    gameState.pendingAction = null;

    if (action.nopeCount && action.nopeCount % 2 === 1) {
      gameState.lastAction = { ...gameState.lastAction, canceled: true };
      io.to(room.code).emit('game:nopeResult', {
        canceled: true,
        cardType: action.cardType,
        actingPlayerId: action.playerId,
        nopeCount: action.nopeCount,
      });

      if (action.parentAction) {
        startNopeWindow(room, action.parentAction);
      } else {
        io.to(room.code).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(gameState) });
      }
      return;
    }

    if (action.type === 'defuse_completed') {
      io.to(room.code).emit('game:turnChanged', {
        currentPlayerId: gameState.players[gameState.currentPlayerIndex]?.userId,
        drawsRequired: gameState.drawsRequired,
      });
      await finalizeGame(io, room);
    } else {
      if (action.cardType) {
        io.to(room.code).emit('game:nopeResult', {
          canceled: false,
          cardType: action.cardType,
          actingPlayerId: action.playerId,
          nopeCount: action.nopeCount,
        });

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
    action.timerId = setTimeout(async () => {
      if (!room.gameState || !room.gameState.pendingAction || room.gameState.pendingAction.eventId !== eventId) return;
      await resolvePendingActionEarly(room, eventId);
    }, action.timeoutMs || 3000);
  }

  function startNowOnlyWindow(room, resolvedAction) {
    const timeoutMs = 3000;
    const eventId = `${Date.now()}-${Math.random()}`;
    const pendingNow = {
      eventId,
      timeoutMs,
      startedAt: Date.now(),
      resolvedAction,
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

  // Cards that require a target selection after being played
  const CARDS_REQUIRING_TARGET = ['favor', 'mark', 'ill_take_that', 'target_attack_2x', 'feed_the_dead'];

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

    if (cardType === 'barking_kitten') {
      resolveBarkingKittenSocket(room, playerId, targetPlayerId);
      return;
    }

    // Create pendingAction and start Nope timer
    const actualCardType = comboSize ? `combo_${comboSize}` : cardType;
    const eventId = `${Date.now()}-${Math.random()}`;
    const action = {
      eventId,
      playerId,
      cardType: actualCardType,
      targetPlayerId,
      options: options || {},
      nopeCount: 0,
    };

    startNopeWindow(room, action);
  }

  async function handlePlayerDisconnectFallback(room, userId) {
    const gameState = room.gameState;
    if (!gameState) return;

    const innerPlayersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
    const innerTurnBefore = gameState.currentPlayerIndex;

    const p = gameState.players.find(p => p.userId === userId);
    if (!p || !p.alive) return;

    eliminatePlayer(gameState, userId);

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
          const firstDead = room.gameState.players.find((p) => !p.alive);
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
    
    // Check if player exploded immediately (no defuse, no zombie revival)
    const pAfter = gameState.players.find((p) => p.userId === playerId);
    if (pAfter && !pAfter.alive) {
      await afterGameStateChanged(room, playersBefore, turnBefore);
      return;
    }

    // If player needs to defuse/revive
    if (gameState.pendingDefuse || gameState.pendingZombie) {
      await afterGameStateChanged(room, [{ userId: playerId, alive: true }], gameState.currentPlayerIndex);
      return;
    }

    // Normal draw: immediately transition turn
    await afterGameStateChanged(room, playersBefore, turnBefore);
  }

  async function runActionEffect(room, action) {
    const gameState = room.gameState;
    const { playerId, cardType, targetPlayerId, options } = action;

    const playersBefore = gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
    const turnBefore = gameState.currentPlayerIndex;

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
        // Emit specific event name depending on type to maintain backward compatibility with client
        const typeCamelCase = interaction.type.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
        let requestPayload = { timeoutMs: interaction.timeout };
        
        if (interaction.type === 'alter') {
          requestPayload.cards = gameState.deck.slice(-interaction.metadata.count).reverse();
          requestPayload.count = interaction.metadata.count;
        } else if (interaction.type === 'favor') {
          requestPayload.fromPlayerId = interaction.owner;
        } else if (interaction.type === 'feed_the_dead') {
          requestPayload.targetPlayerId = interaction.metadata.targetPlayerId;
        } else if (interaction.type === 'dig_deeper') {
          requestPayload.firstCard = interaction.metadata.firstCard;
        }

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
            socket.emit('game:privateHand', { cards: getPrivateHandCards(player) });
          }
        }
      }, 200);
    }

    socket.on('room:create', async ({ password, edition, maxPlayers, betAmount, customDefuses, customExplodingKittens }) => {
      try {
        let username = socket.user?.username ?? `Guest-${guestId.slice(6, 11)}`;
        if (socket.user?.id) {
          const dbUser = await User.findById(socket.user.id);
          if (dbUser) {
            username = dbUser.username;
            const requestedBet = parseInt(betAmount, 10);
            const actualBet = !isNaN(requestedBet) && requestedBet >= 0 ? requestedBet : 50;
            if (dbUser.coins < actualBet) {
               throw new Error('Không đủ GoldCoin để tạo phòng cược này');
            }
          }
        }
        const room = createRoom(userId, { password, edition, maxPlayers, betAmount, customDefuses, customExplodingKittens }, username);
        socket.join(room.code);
        io.to(room.code).emit('room:updated', { room });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:join', async ({ roomCode, password }) => {
      try {
        let username = socket.user?.username ?? `Guest-${guestId.slice(6, 11)}`;
        const roomBefore = getRoomState(roomCode);
        if (socket.user?.id) {
          const dbUser = await User.findById(socket.user.id);
          if (dbUser) {
            username = dbUser.username;
            if (roomBefore && dbUser.coins < roomBefore.betAmount) {
              throw new Error('Không đủ GoldCoin để vào phòng');
            }
          }
        }
        const room = joinRoom(roomCode, userId, username, password);
        socket.join(room.code);
        io.to(room.code).emit('room:updated', { room });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:toggleReady', ({ roomCode, isReady }) => {
      try {
        const room = toggleReady(roomCode, userId, isReady);
        io.to(roomCode).emit('room:updated', { room });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('room:updateSettings', ({ roomCode, settings }) => {
      try {
        const room = updateRoomSettings(roomCode, userId, settings);
        io.to(roomCode).emit('room:updated', { room });
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
          targetSocket.emit('room:updated', { room: null });
        } else {
          // Fallback if target socket cannot be found via io.sockets
          io.to(roomCode).emit('room:kicked_target', { targetUserId });
        }

        io.to(roomCode).emit('room:updated', { room });
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
        const betAmount = roomBefore?.betAmount || 50;
        
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
          
          if (wasPlaying && room.status === 'playing') {
            penalizeEarlyLeave(userId, betAmount);
            await handlePlayerDisconnectFallback(room, userId);
          }
        }
      }
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
      setTimeout(async () => {
        const activeSockets = io.sockets.adapter.rooms.get(`user:${userId}`);
        if (!activeSockets || activeSockets.size === 0) {
          const activeRoom = findRoomByUser(userId);
          if (activeRoom) {
            const player = activeRoom.players.find((p) => p.userId === userId);
            const pName = player ? player.username : userId;
            const wasPlaying = activeRoom.status === 'playing';
            const betAmount = activeRoom.betAmount || 50;
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
                
                if (wasPlaying && room.status === 'playing') {
                  penalizeEarlyLeave(userId, betAmount);
                  await handlePlayerDisconnectFallback(room, userId);
                }
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

    socket.on('game:playCard', async ({ cardType, targetPlayerId, options }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const queue = new EffectQueue();
      const context = new GameContext(state, queue);
      const payload = { userId, cardType, targetPlayerId, options };

      const result = dispatcher.dispatch('playCard', context, payload);
      
      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      const finalTargetPlayerId = payload.finalTargetPlayerId;
      const actualCardType = payload.actualCardType;

      if (!actualCardType) return; // Invalid play

      // Clairvoyance special short-circuit (still emitting here because it bypasses the Nope window in old logic)
      if (cardType === 'clairvoyance' || cardType === 'clairvoyance_now') {
        const targetPending = state.pendingZombie || state.pendingDefuse;
        if (targetPending) {
          targetPending.clairvoyancePlayerId = userId;
          io.to(roomCode).emit('game:cardPlayed', { playerId: userId, cardType: actualCardType, targetPlayerId });
          io.to(roomCode).emit('game:stateUpdate', { publicGameState: sanitizePublicGameState(state) });
          sendHands(io, room);
          return;
        }
      }

      io.to(roomCode).emit('game:cardPlayed', { playerId: userId, cardType: actualCardType, targetPlayerId: finalTargetPlayerId });

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
            const isFeed = actualCardType === 'feed_the_dead';
            const possibleOpponents = room.gameState.players.filter(p => (isFeed ? !p.alive : p.alive) && p.userId !== userId);
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

        const eventId = `${Date.now()}-${Math.random()}`;
        const action = {
          eventId,
          playerId: userId,
          cardType: actualCardType,
          targetPlayerId: finalTargetPlayerId,
          options,
          nopeCount: 0,
          parentAction: oldPending || undefined,
        };

        startNopeWindow(room, action);
      }
    });

    socket.on('game:drawCard', async () => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState) return;

      const state = room.gameState;
      const queue = new EffectQueue();
      const context = new GameContext(state, queue);
      const payload = { userId };

      const result = dispatcher.dispatch('drawCard', context, payload);

      if (!result.success) {
        socket.emit('error', { message: result.error });
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

      if (!isNopeableAction(pending.cardType)) {
        socket.emit('error', { message: 'Không thể Nope hành động này!' });
        return;
      }

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
      startNopeWindow(room, pending);
    });

    socket.on('game:nopeWindow:pass', ({ eventId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      const pending = room?.gameState?.pendingAction;
      if (!pending || pending.eventId !== eventId) return;

      if (!pending.passedPlayers) {
        pending.passedPlayers = [];
      }

      if (!pending.passedPlayers.includes(userId)) {
        pending.passedPlayers.push(userId);
      }

      const activePlayers = room.gameState.players.filter(
        (p) => p.alive && p.userId !== pending.playerId
      );

      if (pending.passedPlayers.length >= activePlayers.length) {
        resolvePendingActionEarly(room, eventId);
      }
    });

    socket.on('game:favor:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
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

    socket.on('game:combo', ({ cards, targetPlayerId, options: clientOptions }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      const room = roomCode ? getRoomState(roomCode) : null;
      if (!room?.gameState) return;

      const state = room.gameState;
      if (state.pendingAction || state.pendingNowOnlyWindow || state.pendingFavor || state.pendingAlter || state.pendingBury || state.pendingGarbage || state.pendingPotLuck || state.pendingZombie || state.pendingTargetSelect) {
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
        cardType: `combo_${cards.length}`,
        displayCardType: comboResult.cardTypes[0] || 'cat_taco',
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

      // Validate target (must be dead for feed_the_dead, alive for others)
      const isFeed = pending.cardType === 'feed_the_dead';
      const target = room.gameState.players.find(p => p.userId === targetPlayerId && (isFeed ? !p.alive : p.alive) && p.userId !== userId);
      if (!target) return;

      resolveTargetSelect(room, targetPlayerId);
    });

    socket.on('game:alterFuture:respond', async ({ rearrangedCards }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
        responseData: rearrangedCards ?? []
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:combo5:respond', async ({ cardId }) => {
      // Ignored for now. PlayComboAction handles it.
    });

    socket.on('game:bury:respond', async ({ cardId, insertPosition }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
        responseData: { cardId, insertPosition }
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:garbage:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
        responseData: cardId
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:potLuck:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
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
      const eventId = `${Date.now()}-${Math.random()}`;
      const action = {
        eventId,
        playerId: userId,
        cardType: 'zombie_resolved',
        type: 'defuse_completed',
        nopeCount: 0,
      };
      startNopeWindow(room, action);
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
      const eventId = `${Date.now()}-${Math.random()}`;
      const action = {
        eventId,
        playerId: userId,
        cardType: 'defuse_resolved',
        type: 'defuse_completed',
        nopeCount: 0,
      };
      startNopeWindow(room, action);
    });

    socket.on('game:feedTheDead:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
        responseData: cardId
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:graveRobber:respond', async ({ cardId }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
        responseData: cardId
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:digDeeper:respond', async ({ decision }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
        responseData: decision
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:armageddon:distribute', async ({ choice }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
        responseData: { stage: 'distribute', choice }
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });

    socket.on('game:armageddon:decision', async ({ decision }) => {
      const roomCode = [...socket.rooms].find((room) => room.length === 6);
      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room?.gameState || !room.gameState.activeInteraction) return;

      const playersBefore = room.gameState.players.map(p => ({ userId: p.userId, alive: p.alive }));
      const turnBefore = room.gameState.currentPlayerIndex;

      const context = new GameContext(room.gameState, new EffectQueue());
      dispatcher.dispatch('SUBMIT_INTERACTION', context, {
        userId,
        interactionId: room.gameState.activeInteraction.id,
        responseData: { stage: 'decision', decision }
      });

      await afterGameStateChanged(room, playersBefore, turnBefore);
    });
  });
};
