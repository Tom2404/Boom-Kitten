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
  if (gameState.edition !== 'zombie') {
    player.hand = [];
  }
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
      gameState.pendingDefuse = { playerId, card, startedAt: Date.now() };
    }
    return gameState;
  }

  // 4. No defuse, explode
  gameState.discardPile.push(card);
  eliminatePlayer(gameState, playerId);
  return gameState;
}

function handleAttack(gameState, targetPlayerId) {
  // Attack stacks! Adds 2 draws to next player
  gameState.drawsRequired = (gameState.drawsRequired ?? 1) > 1 ? gameState.drawsRequired + 2 : 2;
  if (targetPlayerId) {
    const targetIdx = gameState.players.findIndex((p) => p.userId === targetPlayerId);
    if (targetIdx >= 0 && gameState.players[targetIdx].alive) {
      gameState.currentPlayerIndex = targetIdx;
      return gameState;
    }
  }
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

function resolveZombieRevive(gameState, targetPlayerId, insertPosition = 0) {
  if (!gameState.pendingZombie) return gameState;
  const target = targetPlayerId ? getPlayer(gameState, targetPlayerId) : null;
  const activator = getPlayer(gameState, gameState.pendingZombie.playerId);

  if (target && !target.alive && activator && activator.alive) {
    target.alive = true;
    gameState.activePlayerIds = gameState.players.filter((p) => p.alive).map((p) => p.userId);
    
    // Transfer 1 card from activator to target as per Zombie Kittens rules
    if (activator.hand.length > 0) {
      const randomIndex = Math.floor(Math.random() * activator.hand.length);
      const [gift] = activator.hand.splice(randomIndex, 1);
      target.hand.push(gift);
      checkStreakingKittenEffect(gameState, activator.userId);
      checkStreakingKittenEffect(gameState, target.userId);
    }
  }

  // Always put the causing exploding/imploding kitten back in the deck at specified position
  const kitten = gameState.pendingZombie.card;
  const pos = Math.max(0, Math.min(insertPosition, gameState.deck.length));
  if (kitten.type === 'imploding_kitten') {
    kitten.faceUp = true; // Flips face up for next draw
  }
  gameState.deck.splice(pos, 0, kitten);

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

  const n = cardsToPlay.length;
  if (n < 2 || (n !== 2 && n !== 3 && n !== 5)) return null;

  // All cards must be cat cards, feral_cat, or godcat, unless in 2_player edition for 2-card or 3-card combos
  const isTwoPlayer = gameState.edition === '2_player';
  const isAllowedCombo = isTwoPlayer && (n === 2 || n === 3);
  if (!isAllowedCombo) {
    if (!cardsToPlay.every((c) => c.type.startsWith('cat_') || c.type === 'feral_cat' || c.type === 'godcat')) return null;
  }

  const cardTypes = cardsToPlay.map((c) => c.type);
  const wildCount = cardTypes.filter((t) => t === 'feral_cat' || t === 'godcat').length;
  const nonWild = cardTypes.filter((t) => t !== 'feral_cat' && t !== 'godcat');

  if (n === 2) {
    // 2-card combo: both must be the same type, OR one wild + one cat
    const valid = wildCount === 2 // 2 wild cards
      || (wildCount === 1 && nonWild.length === 1) // 1 wild + 1 cat
      || (nonWild.length === 2 && nonWild[0] === nonWild[1]); // 2 same cats
    if (!valid) return null;
  } else if (n === 3) {
    // 3-card combo: 2+ same type + wild, or all same type
    const valid = wildCount === 3 // 3 wilds
      || (wildCount === 2 && nonWild.length === 1) // 2 wild + 1 cat
      || (wildCount === 1 && nonWild.length === 2 && nonWild[0] === nonWild[1]) // 1 wild + 2 same
      || (nonWild.length === 3 && nonWild[0] === nonWild[1] && nonWild[1] === nonWild[2]); // 3 same
    if (!valid) return null;
  } else if (n === 5) {
    // 5-card combo: 5 different cat types (wilds count as any)
    const uniqueNonWild = new Set(nonWild);
    if (uniqueNonWild.size + wildCount < 5) return null; // Not enough distinct types
  }

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
        // Since thief drew it, decrement drawsRequired for player
        gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);
        if (card.type === 'exploding_kitten' || card.type === 'imploding_kitten' || card.type === 'devilcat') {
          resolveExplosion(gameState, thiefId, card, onDefuse);
        } else {
          thief.hand.push(card);
          checkStreakingKittenEffect(gameState, thiefId);
        }
        // If thief survived and has no pending zombie or pending defuse, check if turn changes for player
        const t = getPlayer(gameState, thiefId);
        if (t && t.alive && !gameState.pendingZombie && !gameState.pendingDefuse) {
          if (gameState.drawsRequired === 0) {
            gameState.drawsRequired = 1;
            passTurn(gameState);
          }
        }
      }
      return gameState;
    }
  }

  const card = fromBottom ? gameState.deck.shift() : gameState.deck.pop();
  if (!card) return gameState;

  // Decrement drawsRequired since a card was drawn!
  gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);

  if (card.type === 'exploding_kitten' || card.type === 'imploding_kitten' || card.type === 'devilcat') {
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

  // Nope cannot be played manually — only via the Nope chain (game:nope event)
  if (cardType === 'nope') return null;
  // Defuse cannot be played manually — auto-played when drawing Exploding Kitten
  if (cardType === 'defuse') return null;

  let actualCardType = cardType;
  if (cardType === 'godcat' && options.asCardType) {
    actualCardType = options.asCardType;
  }

  const card = removeCardFromHand(player, cardType);
  if (!card) return null;

  // Clone handles duplication of the previous action
  const prevAction = gameState.lastAction;
  let clonedCardType = null;
  if (actualCardType === 'clone' && prevAction && !prevAction.canceled) {
    clonedCardType = prevAction.cardType;
  }

  // Godcat goes to playmat instead of discard pile when played as a single card
  if (cardType === 'godcat') {
    if (!gameState.playmat) gameState.playmat = { godcat: false, devilcat: true };
    gameState.playmat.godcat = true;
  } else {
    gameState.discardPile.push(card);
  }

  const recordedType = clonedCardType || actualCardType;
  gameState.lastAction = { playerId, cardType: recordedType, targetPlayerId, timestamp: Date.now(), canceled: false };

  return recordedType;
}

function executeActionEffect(gameState, cardType, playerId, targetPlayerId, options = {}, onDefuse) {
  switch (cardType) {
    case 'attack':
    case 'attack_2x':
    case 'target_attack_2x':
      return handleAttack(gameState, targetPlayerId);
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
    case 'share_the_future_3':
      // Handled by returning deck slice in seeTheFuture listener
      return gameState;
    case 'see_the_future_1':
      return gameState;
    case 'see_the_future_5':
      return gameState;
    case 'alter_the_future_3':
    case 'alter_the_future_3_now':
      return handleAlterTheFuture(gameState, playerId, 3);
    case 'alter_the_future_5':
      return handleAlterTheFuture(gameState, playerId, 5);
    case 'shuffle':
    case 'shuffle_now':
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
    case 'attack_of_the_dead': {
      const deadCount = gameState.players.filter((p) => !p.alive).length;
      const extraDraws = 3 * deadCount;
      gameState.drawsRequired = (gameState.drawsRequired ?? 1) > 1 ? gameState.drawsRequired + extraDraws : (extraDraws > 0 ? extraDraws : 1);
      passTurn(gameState);
      return gameState;
    }
    case 'feed_the_dead': {
      gameState.pendingFeedTheDead = { playerId, targetPlayerId, responses: {}, startedAt: Date.now() };
      return gameState;
    }
    case 'grave_robber': {
      gameState.pendingGraveRobber = { playerId, responses: {}, startedAt: Date.now() };
      return gameState;
    }
    case 'clairvoyance':
    case 'clairvoyance_now':
      return gameState;
    case 'dig_deeper': {
      if (gameState.deck.length > 0) {
        const firstCard = gameState.deck.pop();
        gameState.pendingDigDeeper = { playerId, firstCard, startedAt: Date.now() };
      }
      return gameState;
    }
    case 'armageddon': {
      if (gameState.playmat && gameState.playmat.godcat && gameState.playmat.devilcat) {
        gameState.playmat.godcat = false;
        gameState.playmat.devilcat = false;
        gameState.pendingArmageddon = {
          playerId,
          targetPlayerId,
          activatorCard: null,
          targetCard: null,
          stage: 'distribute',
          startedAt: Date.now(),
        };
      }
      return gameState;
    }
    case 'barking_kitten': {
      const player = getPlayer(gameState, playerId);
      if (!player) return gameState;
      const otherPlayer = gameState.players.find(
        (p) => p.userId !== playerId && p.alive && 
        (p.hand.some((c) => c.type === 'barking_kitten') || p.barkingKittenPlayed)
      );
      if (otherPlayer) {
        if (otherPlayer.barkingKittenPlayed) {
          otherPlayer.barkingKittenPlayed = false;
        } else {
          removeCardFromHand(otherPlayer, 'barking_kitten');
        }
        const otherCard = { id: `bk-${Date.now()}`, type: 'barking_kitten' };
        gameState.discardPile.push(otherCard);
        const ekCard = { id: `ek-bk-${Date.now()}`, type: 'exploding_kitten' };
        resolveExplosion(gameState, otherPlayer.userId, ekCard);
      } else {
        player.barkingKittenPlayed = true;
        const playedCardIdx = gameState.discardPile.findLastIndex((c) => c.type === 'barking_kitten');
        if (playedCardIdx >= 0) {
          gameState.discardPile.splice(playedCardIdx, 1);
        }
      }
      return gameState;
    }
    case 'reveal_the_future_3x':
      return gameState;

    // Combo effects executed after Nope window:
    case 'combo_2': {
      // 2-card combo: steal a random card from target
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
    case 'combo_3': {
      // 3-card combo: steal a specific card type from target (options.stealCardType)
      const target = getPlayer(gameState, targetPlayerId);
      const player = getPlayer(gameState, playerId);
      if (!target || !target.alive || !player || !player.alive) return gameState;
      const stealType = options.stealCardType;
      if (stealType) {
        // Steal a card of the requested type
        const idx = target.hand.findIndex((c) => c.type === stealType);
        if (idx >= 0) {
          const [stolen] = target.hand.splice(idx, 1);
          player.hand.push(stolen);
          checkStreakingKittenEffect(gameState, player.userId);
          checkStreakingKittenEffect(gameState, target.userId);
        }
      } else if (target.hand.length > 0) {
        // Fallback: steal random if no type specified
        const randomIndex = Math.floor(Math.random() * target.hand.length);
        const [stolen] = target.hand.splice(randomIndex, 1);
        player.hand.push(stolen);
        checkStreakingKittenEffect(gameState, player.userId);
        checkStreakingKittenEffect(gameState, target.userId);
      }
      return gameState;
    }
    case 'combo_5': {
      return handleCombo5(gameState, playerId);
    }
    default:
      return gameState;
  }
}

function resolveDefusePutBack(gameState, insertPosition) {
  if (!gameState.pendingDefuse) return gameState;
  const card = gameState.pendingDefuse.card;
  const pos = Math.max(0, Math.min(insertPosition, gameState.deck.length));
  if (card.type === 'imploding_kitten') {
    card.faceUp = true;
  }
  gameState.deck.splice(pos, 0, card);
  gameState.pendingDefuse = null;

  if (gameState.drawsRequired === 0) {
    gameState.drawsRequired = 1;
    passTurn(gameState);
  }
  return gameState;
}

function resolveFeedTheDead(gameState, giverId, cardId) {
  if (!gameState.pendingFeedTheDead) return gameState;
  const giver = getPlayer(gameState, giverId);
  if (!giver) return gameState;

  const idx = giver.hand.findIndex((c) => c.id === cardId);
  if (idx >= 0) {
    const [card] = giver.hand.splice(idx, 1);
    gameState.pendingFeedTheDead.responses[giverId] = card;
  }

  const activatorId = gameState.pendingFeedTheDead.playerId;
  const targetPlayerId = gameState.pendingFeedTheDead.targetPlayerId;
  const livingNeedToRespond = gameState.players.filter((p) => p.alive && p.userId !== activatorId);
  const allDone = livingNeedToRespond.every((p) => gameState.pendingFeedTheDead.responses[p.userId]);

  if (allDone) {
    const target = getPlayer(gameState, targetPlayerId);
    if (target) {
      Object.values(gameState.pendingFeedTheDead.responses).forEach((card) => {
        target.hand.push(card);
      });
      checkStreakingKittenEffect(gameState, target.userId);
    }
    livingNeedToRespond.forEach((p) => {
      checkStreakingKittenEffect(gameState, p.userId);
    });
    gameState.pendingFeedTheDead = null;
  }
  return gameState;
}

function resolveGraveRobber(gameState, deadPlayerId, cardId) {
  if (!gameState.pendingGraveRobber) return gameState;
  const player = getPlayer(gameState, deadPlayerId);
  if (!player) return gameState;

  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx >= 0) {
    const [card] = player.hand.splice(idx, 1);
    gameState.pendingGraveRobber.responses[deadPlayerId] = card;
  }

  const deadWithCards = gameState.players.filter((p) => !p.alive && p.hand.length > 0);
  const allDone = deadWithCards.every((p) => gameState.pendingGraveRobber.responses[p.userId]);

  if (allDone) {
    Object.values(gameState.pendingGraveRobber.responses).forEach((card) => {
      gameState.deck.push(card);
    });
    gameState.deck = shuffleDeck(gameState.deck);
    gameState.pendingGraveRobber = null;
  }
  return gameState;
}

function resolveDigDeeper(gameState, decision) {
  if (!gameState.pendingDigDeeper) return gameState;
  const { playerId, firstCard } = gameState.pendingDigDeeper;
  const player = getPlayer(gameState, playerId);
  
  if (player && player.alive) {
    if (decision === 'keep') {
      if (firstCard.type === 'exploding_kitten' || firstCard.type === 'imploding_kitten' || firstCard.type === 'devilcat') {
        resolveExplosion(gameState, playerId, firstCard);
      } else {
        player.hand.push(firstCard);
        checkStreakingKittenEffect(gameState, playerId);
      }
      gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);
      if (gameState.drawsRequired === 0 && !gameState.pendingZombie && !gameState.pendingDefuse) {
        gameState.drawsRequired = 1;
        passTurn(gameState);
      }
    } else {
      gameState.deck.push(firstCard);
      drawCard(gameState, playerId);
    }
  }
  gameState.pendingDigDeeper = null;
  return gameState;
}

function resolveArmageddonDistribute(gameState, choice) {
  if (!gameState.pendingArmageddon) return gameState;
  
  const godcatCard = { id: `gc-${Date.now()}`, type: 'godcat' };
  const devilcatCard = { id: `dc-${Date.now()}`, type: 'devilcat' };

  if (choice === 'godcat') {
    gameState.pendingArmageddon.activatorCard = godcatCard;
    gameState.pendingArmageddon.targetCard = devilcatCard;
  } else {
    gameState.pendingArmageddon.activatorCard = devilcatCard;
    gameState.pendingArmageddon.targetCard = godcatCard;
  }
  gameState.pendingArmageddon.stage = 'decision';
  return gameState;
}

function resolveArmageddonDecision(gameState, decision) {
  if (!gameState.pendingArmageddon) return gameState;
  const { playerId, targetPlayerId, activatorCard, targetCard } = gameState.pendingArmageddon;
  
  let finalActivatorCard = activatorCard;
  let finalTargetCard = targetCard;

  if (decision === 'swap') {
    finalActivatorCard = targetCard;
    finalTargetCard = activatorCard;
  }

  const activator = getPlayer(gameState, playerId);
  const target = getPlayer(gameState, targetPlayerId);

  // Process Activator card
  if (activator && activator.alive) {
    if (finalActivatorCard.type === 'godcat') {
      activator.hand.push(finalActivatorCard);
      checkStreakingKittenEffect(gameState, activator.userId);
    } else {
      resolveExplosion(gameState, activator.userId, finalActivatorCard);
    }
  }

  // Process Target card
  if (target && target.alive) {
    if (finalTargetCard.type === 'godcat') {
      target.hand.push(finalTargetCard);
      checkStreakingKittenEffect(gameState, target.userId);
    } else {
      resolveExplosion(gameState, target.userId, finalTargetCard);
    }
  }

  if (!gameState.playmat) gameState.playmat = { godcat: false, devilcat: false };
  gameState.playmat.devilcat = true;

  gameState.pendingArmageddon = null;
  return gameState;
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
  resolveDefusePutBack,
  resolveFeedTheDead,
  resolveGraveRobber,
  resolveDigDeeper,
  resolveArmageddonDistribute,
  resolveArmageddonDecision,
  checkStreakingKittenEffect,
};
