// Core server-side game logic to keep the backend as single source of truth.
const { shuffleDeck } = require('./deck');

function getPlayer(gameState, playerId) {
  return gameState.players.find((p) => p.userId === playerId);
}

function removeCardFromHand(player, cardType) {
  const index = player.hand.findIndex((card) => card.type === cardType);
  if (index < 0) return null;
  const [card] = player.hand.splice(index, 1);
  return card;
}

function passTurn(gameState) {
  const dir = gameState.playDirection ?? 1;
  const len = gameState.players.length;
  let nextIndex = gameState.currentPlayerIndex;
  
  // Find the next alive player
  for (let i = 0; i < len; i += 1) {
    nextIndex = (nextIndex + dir + len) % len;
    if (gameState.players[nextIndex].alive) {
      gameState.currentPlayerIndex = nextIndex;
      return;
    }
  }
}

function eliminatePlayer(gameState, playerId) {
  const player = getPlayer(gameState, playerId);
  if (!player) return gameState;
  player.alive = false;
  player.hand = [];
  gameState.activePlayerIds = gameState.players.filter((p) => p.alive).map((p) => p.userId);
  
  // If the current player died, pass the turn
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer && currentPlayer.userId === playerId) {
    gameState.drawsRequired = 1;
    passTurn(gameState);
  }
  return gameState;
}

function checkWinCondition(gameState) {
  const alive = gameState.players.filter((p) => p.alive);
  return alive.length === 1 ? alive[0].userId : null;
}

// Check if a player's Exploding Kittens exceed their Streaking Kittens, and explode them if so.
function checkStreakingKittenEffect(gameState, playerId) {
  const player = getPlayer(gameState, playerId);
  if (!player || !player.alive) return gameState;

  const streakingCount = player.hand.filter((c) => c.type === 'streaking_kitten').length;
  const explodingKittens = player.hand.filter((c) => c.type === 'exploding_kitten');

  if (explodingKittens.length > streakingCount) {
    const excessCount = explodingKittens.length - streakingCount;
    for (let i = 0; i < excessCount; i += 1) {
      const idx = player.hand.findIndex((c) => c.type === 'exploding_kitten');
      if (idx >= 0) {
        const [ekCard] = player.hand.splice(idx, 1);
        resolveExplosion(gameState, playerId, ekCard);
      }
    }
  }
  return gameState;
}

function resolveExplosion(gameState, playerId, card, onDefuse) {
  const player = getPlayer(gameState, playerId);
  if (!player) return gameState;

  // 1. Streaking Kitten allows holding 1 Exploding Kitten
  const streakingCount = player.hand.filter((c) => c.type === 'streaking_kitten').length;
  const explodingCount = player.hand.filter((c) => c.type === 'exploding_kitten').length;
  if (card.type === 'exploding_kitten' && explodingCount < streakingCount) {
    player.hand.push(card);
    return gameState;
  }

  // 2. Imploding Kitten face up cannot be defused
  if (card.type === 'imploding_kitten' && card.faceUp) {
    gameState.discardPile.push(card);
    eliminatePlayer(gameState, playerId);
    return gameState;
  }

  // 3. Check for Defuse or Zombie Kitten
  const defuseIdx = player.hand.findIndex((c) => c.type === 'defuse' || c.type === 'zombie_kitten');
  if (defuseIdx >= 0) {
    const defuseCard = player.hand.splice(defuseIdx, 1)[0];
    gameState.discardPile.push(defuseCard);

    if (onDefuse) onDefuse(playerId, defuseCard.type);

    if (defuseCard.type === 'zombie_kitten') {
      gameState.pendingZombie = { playerId, card, startedAt: Date.now() };
    } else {
      // Put back in deck at random position
      const pos = Math.floor(Math.random() * (gameState.deck.length + 1));
      if (card.type === 'imploding_kitten') {
        card.faceUp = true; // Flips face up for next draw
      }
      gameState.deck.splice(pos, 0, card);
    }
    return gameState;
  }

  // 4. No defuse, explode
  gameState.discardPile.push(card);
  eliminatePlayer(gameState, playerId);
  return gameState;
}

function handleAttack(gameState) {
  // Attack stacks! Adds 2 draws to next player
  gameState.drawsRequired = (gameState.drawsRequired ?? 1) > 1 ? gameState.drawsRequired + 2 : 2;
  passTurn(gameState);
  return gameState;
}

function handlePersonalAttack(gameState) {
  // Add 3 draws to current player
  gameState.drawsRequired = (gameState.drawsRequired ?? 1) > 1 ? gameState.drawsRequired + 3 : 3;
  return gameState;
}

function handleSkip(gameState) {
  if (gameState.drawsRequired && gameState.drawsRequired > 1) {
    gameState.drawsRequired -= 1;
  } else {
    gameState.drawsRequired = 1;
    passTurn(gameState);
  }
  return gameState;
}

function handleSuperSkip(gameState) {
  gameState.drawsRequired = 1;
  passTurn(gameState);
  return gameState;
}

function handleReverse(gameState) {
  gameState.playDirection = -(gameState.playDirection ?? 1);
  return handleSkip(gameState);
}

function handleSeeTheFuture(gameState, count = 3) {
  return gameState.deck.slice(-count).reverse();
}

function handleShuffle(gameState) {
  gameState.deck = shuffleDeck(gameState.deck);
  return gameState;
}

function handleAlterTheFuture(gameState, playerId, count = 3) {
  gameState.pendingAlter = { playerId, count, startedAt: Date.now() };
  return gameState;
}

function resolveAlterTheFuture(gameState, rearrangedCards) {
  if (!gameState.pendingAlter) return gameState;
  const count = Math.min(gameState.pendingAlter.count || 3, gameState.deck.length);
  if (count > 0) {
    const topCards = gameState.deck.splice(-count);
    const reordered = [];
    const orderIds = [...rearrangedCards].reverse();
    orderIds.forEach((id) => {
      const card = topCards.find((c) => c.id === id);
      if (card) reordered.push(card);
    });
    topCards.forEach((card) => {
      if (!reordered.includes(card)) reordered.unshift(card);
    });
    gameState.deck.push(...reordered);
  }
  gameState.pendingAlter = null;
  return gameState;
}

function handleFavor(gameState, fromPlayerId, targetPlayerId) {
  gameState.pendingFavor = { fromPlayerId, targetPlayerId, startedAt: Date.now() };
  return gameState;
}

function handleSwapTopAndBottom(gameState) {
  if (gameState.deck.length >= 2) {
    const top = gameState.deck.pop();
    const bottom = gameState.deck.shift();
    gameState.deck.push(bottom);
    gameState.deck.unshift(top);
  }
  return gameState;
}

function handleCatomicBomb(gameState) {
  const kittens = [];
  const normal = [];
  gameState.deck.forEach((c) => {
    if (c.type === 'exploding_kitten' || c.type === 'imploding_kitten') {
      kittens.push(c);
    } else {
      normal.push(c);
    }
  });
  const shuffledNormal = shuffleDeck(normal);
  gameState.deck = [...shuffledNormal, ...kittens];
  return handleSkip(gameState);
}

function handleBury(gameState, playerId) {
  gameState.pendingBury = { playerId, startedAt: Date.now() };
  return gameState;
}

function resolveBury(gameState, cardId, insertPosition) {
  if (!gameState.pendingBury) return gameState;
  const player = getPlayer(gameState, gameState.pendingBury.playerId);
  if (!player) {
    gameState.pendingBury = null;
    return gameState;
  }
  const index = player.hand.findIndex((c) => c.id === cardId);
  if (index >= 0) {
    const [card] = player.hand.splice(index, 1);
    const pos = Math.max(0, Math.min(insertPosition, gameState.deck.length));
    gameState.deck.splice(pos, 0, card);
  }
  gameState.pendingBury = null;
  return handleSkip(gameState);
}

function handleMark(gameState, targetPlayerId) {
  const target = getPlayer(gameState, targetPlayerId);
  if (target && target.alive && target.hand.length > 0) {
    const randIdx = Math.floor(Math.random() * target.hand.length);
    target.hand[randIdx].marked = true;
  }
  return gameState;
}

function handleGarbageCollection(gameState) {
  gameState.pendingGarbage = { responses: {}, startedAt: Date.now() };
  return gameState;
}

function resolveGarbageCollection(gameState, playerId, cardId) {
  if (!gameState.pendingGarbage) return gameState;
  const player = getPlayer(gameState, playerId);
  if (!player) return gameState;

  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx >= 0) {
    const [card] = player.hand.splice(idx, 1);
    gameState.deck.push(card);
    gameState.pendingGarbage.responses[playerId] = cardId;
  }

  const activeWithCards = gameState.players.filter((p) => p.alive && p.hand.length > 0);
  const allDone = activeWithCards.every((p) => gameState.pendingGarbage.responses[p.userId]);

  if (allDone) {
    gameState.deck = shuffleDeck(gameState.deck);
    gameState.pendingGarbage = null;
  }
  return gameState;
}

function handlePotLuck(gameState) {
  gameState.pendingPotLuck = { responses: {}, startedAt: Date.now() };
  return gameState;
}

function resolvePotLuck(gameState, playerId, cardId) {
  if (!gameState.pendingPotLuck) return gameState;
  const player = getPlayer(gameState, playerId);
  if (!player) return gameState;

  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx >= 0) {
    const [card] = player.hand.splice(idx, 1);
    gameState.pendingPotLuck.responses[playerId] = card;
  }

  const activeWithCards = gameState.players.filter((p) => p.alive && p.hand.length > 0);
  const allDone = activeWithCards.every((p) => gameState.pendingPotLuck.responses[p.userId]);

  if (allDone) {
    const len = gameState.players.length;
    let idxCur = gameState.currentPlayerIndex;
    for (let i = 0; i < len; i += 1) {
      const p = gameState.players[idxCur];
      const card = gameState.pendingPotLuck.responses[p.userId];
      if (card) {
        gameState.deck.push(card);
      }
      idxCur = (idxCur + 1) % len;
    }
    gameState.pendingPotLuck = null;
  }
  return gameState;
}

function handleRaisingHeck(gameState, playerId) {
  if (gameState.deck.length > 0) {
    const bottomCard = gameState.deck.shift(); // take from bottom
    const player = getPlayer(gameState, playerId);
    if (player && player.alive) {
      player.hand.push(bottomCard);
    }
  }
  return gameState;
}

function resolveZombieRevive(gameState, targetPlayerId) {
  if (!gameState.pendingZombie) return gameState;
  const target = getPlayer(gameState, targetPlayerId);
  const activator = getPlayer(gameState, gameState.pendingZombie.playerId);

  if (target && !target.alive && activator && activator.alive) {
    target.alive = true;
    target.hand = [];

    // Put the causing exploding/imploding kitten back randomly
    const kitten = gameState.pendingZombie.card;
    const pos = Math.floor(Math.random() * (gameState.deck.length + 1));
    gameState.deck.splice(pos, 0, kitten);

    gameState.activePlayerIds = gameState.players.filter((p) => p.alive).map((p) => p.userId);
  }

  gameState.pendingZombie = null;
  if (gameState.drawsRequired === 0) {
    gameState.drawsRequired = 1;
    passTurn(gameState);
  }
  return gameState;
}

function handleCombo5(gameState, playerId) {
  gameState.pendingCombo5 = { playerId, startedAt: Date.now() };
  return gameState;
}

function resolveCombo5(gameState, cardId) {
  if (!gameState.pendingCombo5) return gameState;
  const player = getPlayer(gameState, gameState.pendingCombo5.playerId);
  if (!player) {
    gameState.pendingCombo5 = null;
    return gameState;
  }
  const index = gameState.discardPile.findIndex((c) => c.id === cardId);
  if (index >= 0) {
    const [card] = gameState.discardPile.splice(index, 1);
    player.hand.push(card);
  }
  gameState.pendingCombo5 = null;
  return gameState;
}

function handleCombo(gameState, playerId, cardIds, targetPlayerId) {
  const player = getPlayer(gameState, playerId);
  if (!player || !player.alive) return null;

  const cardsToPlay = [];
  cardIds.forEach((id) => {
    const card = player.hand.find((c) => c.id === id);
    if (card) cardsToPlay.push(card);
  });

  if (cardsToPlay.length !== cardIds.length) return null;
  if (!cardsToPlay.every((c) => c.type.startsWith('cat_') || c.type === 'feral_cat')) return null;

  const cardTypes = cardsToPlay.map((c) => c.type);

  cardsToPlay.forEach((c) => {
    const index = player.hand.findIndex((handCard) => handCard.id === c.id);
    if (index >= 0) player.hand.splice(index, 1);
    gameState.discardPile.push(c);
  });

  gameState.lastAction = {
    playerId,
    cardType: `combo_${cardIds.length}`,
    targetPlayerId,
    timestamp: Date.now(),
    canceled: false,
  };

  return { cardTypes };
}

function handleDefuse(gameState, playerId, insertPosition = 0) {
  const player = getPlayer(gameState, playerId);
  if (!player) return gameState;
  const defuse = removeCardFromHand(player, 'defuse');
  if (!defuse) return eliminatePlayer(gameState, playerId);
  gameState.discardPile.push(defuse);
  const safePosition = Math.max(0, Math.min(insertPosition, gameState.deck.length));
  gameState.deck.splice(safePosition, 0, { id: `ek-${Date.now()}`, type: 'exploding_kitten' });
  return gameState;
}

function drawCard(gameState, playerId, fromBottom = false, onDefuse) {
  const player = getPlayer(gameState, playerId);
  if (!player || !player.alive) return gameState;

  // Handle ill_take_that redirection
  if (player.pendingTakeFrom) {
    const thiefId = player.pendingTakeFrom;
    player.pendingTakeFrom = null; // Clear redirection
    
    const thief = getPlayer(gameState, thiefId);
    if (thief && thief.alive) {
      const card = fromBottom ? gameState.deck.shift() : gameState.deck.pop();
      if (card) {
        // Since thief drew it, decrement drawsRequired for player, but resolve explosion for thief!
        gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);
        resolveExplosion(gameState, thiefId, card, onDefuse);
        // If thief survived and has no pending zombie, check if turn changes for player
        if (gameState.drawsRequired === 0) {
          gameState.drawsRequired = 1;
          passTurn(gameState);
        }
      }
      return gameState;
    }
  }

  const card = fromBottom ? gameState.deck.shift() : gameState.deck.pop();
  if (!card) return gameState;

  // Decrement drawsRequired since a card was drawn!
  gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);

  if (card.type === 'exploding_kitten' || card.type === 'imploding_kitten') {
    resolveExplosion(gameState, playerId, card, onDefuse);
    // If player survived (defused it and didn't die) and no pending zombie (Zombie Kitten has its own async flow)
    const p = getPlayer(gameState, playerId);
    if (p && p.alive && !gameState.pendingZombie) {
      if (gameState.drawsRequired === 0) {
        gameState.drawsRequired = 1;
        passTurn(gameState);
      }
    }
    return gameState;
  }

  player.hand.push(card);
  if (gameState.drawsRequired === 0) {
    gameState.drawsRequired = 1;
    passTurn(gameState);
  }
  return gameState;
}

function handleNope(gameState, nopingPlayerId) {
  gameState.lastAction = { ...(gameState.lastAction ?? {}), canceledBy: nopingPlayerId, canceled: true };
  return gameState;
}

function playCard(gameState, playerId, cardType, targetPlayerId, options = {}) {
  const player = getPlayer(gameState, playerId);
  if (!player || !player.alive) return null;

  let actualCardType = cardType;
  if (cardType === 'godcat' && options.asCardType) {
    actualCardType = options.asCardType;
  }

  const card = removeCardFromHand(player, cardType);
  if (!card) return null;

  gameState.discardPile.push(card);
  gameState.lastAction = { playerId, cardType: actualCardType, targetPlayerId, timestamp: Date.now(), canceled: false };

  // Clone handles duplication of the previous action
  if (actualCardType === 'clone' && gameState.lastAction && !gameState.lastAction.canceled) {
    actualCardType = gameState.lastAction.cardType;
  }

  return actualCardType;
}

function executeActionEffect(gameState, cardType, playerId, targetPlayerId, options = {}, onDefuse) {
  switch (cardType) {
    case 'attack':
    case 'attack_2x':
      return handleAttack(gameState);
    case 'personal_attack':
      return handlePersonalAttack(gameState);
    case 'skip':
      return handleSkip(gameState);
    case 'super_skip':
    case 'superskip':
      return handleSuperSkip(gameState);
    case 'reverse':
      return handleReverse(gameState);
    case 'see_the_future':
    case 'see_the_future_3':
      // Handled by returning deck slice in seeTheFuture listener
      return gameState;
    case 'see_the_future_1':
      return gameState;
    case 'see_the_future_5':
      return gameState;
    case 'alter_the_future_3':
      return handleAlterTheFuture(gameState, playerId, 3);
    case 'alter_the_future_5':
      return handleAlterTheFuture(gameState, playerId, 5);
    case 'shuffle':
      return handleShuffle(gameState);
    case 'draw_from_bottom':
    case 'draw_from_the_bottom':
      return drawCard(gameState, playerId, true, onDefuse);
    case 'favor':
      return handleFavor(gameState, playerId, targetPlayerId);
    case 'swap_top_and_bottom':
      return handleSwapTopAndBottom(gameState);
    case 'catomic_bomb':
      return handleCatomicBomb(gameState);
    case 'bury':
      return handleBury(gameState, playerId);
    case 'mark':
      return handleMark(gameState, targetPlayerId);
    case 'ill_take_that': {
      const target = getPlayer(gameState, targetPlayerId);
      if (target && target.alive) {
        target.pendingTakeFrom = playerId;
      }
      return gameState;
    }
    case 'garbage_collection':
      return handleGarbageCollection(gameState);
    case 'pot_luck':
      return handlePotLuck(gameState);
    case 'raising_heck':
      return handleRaisingHeck(gameState, playerId);

    // Combo effects executed after Nope window:
    case 'combo_2': {
      const target = getPlayer(gameState, targetPlayerId);
      const player = getPlayer(gameState, playerId);
      if (!target || !target.alive || target.hand.length === 0 || !player || !player.alive) return gameState;
      const randomIndex = Math.floor(Math.random() * target.hand.length);
      const [stolen] = target.hand.splice(randomIndex, 1);
      player.hand.push(stolen);
      checkStreakingKittenEffect(gameState, player.userId);
      checkStreakingKittenEffect(gameState, target.userId);
      return gameState;
    }
    case 'combo_5': {
      return handleCombo5(gameState, playerId);
    }
    default:
      return gameState;
  }
}

module.exports = {
  playCard,
  executeActionEffect,
  drawCard,
  handleNope,
  handleDefuse,
  handleAttack,
  handleSkip,
  handleSuperSkip,
  handleSeeTheFuture,
  handleShuffle,
  handleFavor,
  handleCombo,
  handleCombo5,
  resolveCombo5,
  resolveAlterTheFuture,
  checkWinCondition,
  eliminatePlayer,
  resolveBury,
  resolveGarbageCollection,
  resolvePotLuck,
  resolveZombieRevive,
  checkStreakingKittenEffect,
};
