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

function removeCardFromHandById(player, cardId) {
  const index = player.hand.findIndex((card) => card.id === cardId);
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

function tryPassTurn(gameState, playerId) {
  const player = getPlayer(gameState, playerId);
  if (player && player.alive && player.hand.length > 10) {
    // Do not pass turn yet, player must discard
  } else {
    gameState.drawsRequired = 1;
    passTurn(gameState);
  }
}

function eliminatePlayer(gameState, playerId) {
  const player = getPlayer(gameState, playerId);
  if (!player) return gameState;
  player.alive = false;
  if (gameState.edition !== 'zombie') {
    if (player.hand && player.hand.length > 0) {
      if (!gameState.discardPile) {
        gameState.discardPile = [];
      }
      gameState.discardPile.push(...player.hand);
    }
    player.hand = [];
  }
  gameState.activePlayerIds = gameState.players.filter((p) => p.alive).map((p) => p.userId);
  
  // EC-1: If waitingHolder is eliminated
  if (gameState.barkingKittenState && gameState.barkingKittenState.waitingHolder === playerId) {
    gameState.barkingKittenState.waitingHolder = null;
    gameState.discardPile.push({ id: `bk-invalidated-${Date.now()}`, type: 'barking_kitten' });
    gameState.barkingKittenInvalidated = player.username;
  }

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

/**
 * resolveExplosion handles the complex flow when a player draws a fatal card.
 * Flowchart:
 * 1. Streaking Kitten Check:
 *    - If card is Exploding Kitten AND player holds Streaking Kitten:
 *      -> Add EK to hand silently, return.
 * 2. Imploding Kitten Check:
 *    - If card is Imploding Kitten:
 *      -> If face up: Explode immediately (no defuse possible).
 *      -> If face down: Trigger pendingDefuse to put it back face up.
 * 3. Defuse / Zombie Kitten Check:
 *    - Find Defuse or Zombie Kitten in hand.
 *    - If found, remove from hand, discard, and trigger pendingDefuse/pendingZombie.
 * 4. Elimination:
 *    - If no protection, player explodes and is eliminated.
 */
function resolveExplosion(gameState, playerId, card, onDefuse) {
  const ExplosionEngine = require('./effects/ExplosionEngine');
  const engine = new ExplosionEngine(null); // No async queue needed here yet

  const context = {
    gameState,
    playerId,
    drawnCard: card,
    onDefuseCallback: onDefuse
  };

  engine.resolve(context);
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
}function handleRaisingHeck(gameState, playerId) {
  if (gameState.deck.length > 0) {
    const bottomCard = gameState.deck.pop(); // take from bottom
    const player = getPlayer(gameState, playerId);
    if (player && player.alive) {
      if (bottomCard.type === 'exploding_kitten' || bottomCard.type === 'imploding_kitten' || bottomCard.type === 'devilcat') {
        resolveExplosion(gameState, playerId, bottomCard);
      } else {
        player.hand.push(bottomCard);
      }
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
  delete kitten.marked;
  gameState.deck.splice(pos, 0, kitten);

  gameState.pendingZombie = null;
  if (activator) {
    activator.blinded = false; // Lift the curse!
  }
  if (gameState.drawsRequired === 0) {
    tryPassTurn(gameState, activator?.userId);
  }
  return gameState;
}



function validateCombo(gameState, playerId, cardIds) {
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

  return { cardsToPlay, cardTypes };
}

function handleCombo(gameState, playerId, cardIds, targetPlayerId) {
  const player = getPlayer(gameState, playerId);
  const combo = validateCombo(gameState, playerId, cardIds);
  if (!player || !combo) return null;

  const { cardsToPlay, cardTypes } = combo;

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

function drawFromDeck(gameState, fromBottom = false) {
  let card = fromBottom ? gameState.deck.shift() : gameState.deck.pop();
  if (!card) {
    // Recycle Discard Pile, filtering out Exploding and Imploding Kittens
    const recycledCards = (gameState.discardPile || []).filter(
      (c) => c.type !== 'exploding_kitten' && c.type !== 'imploding_kitten'
    );
    if (recycledCards.length > 0) {
      gameState.deck = shuffleDeck(recycledCards);
      gameState.discardPile = [];
      card = fromBottom ? gameState.deck.shift() : gameState.deck.pop();
    }
  }
  return card;
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
      const card = drawFromDeck(gameState, fromBottom);
      if (card) {
        // Since thief drew it, decrement drawsRequired for player
        gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);
        if (card.type === 'exploding_kitten' || card.type === 'imploding_kitten' || card.type === 'devilcat') {
          resolveExplosion(gameState, thiefId, card, onDefuse);
        } else {
          thief.hand.push(card);
          thief.blinded = false; // Lift the curse!
          checkStreakingKittenEffect(gameState, thiefId);
        }
        // If thief survived and has no pending zombie or pending defuse, check if turn changes for player
        const t = getPlayer(gameState, thiefId);
        if (t && t.alive && !gameState.pendingZombie && !gameState.pendingDefuse) {
          if (gameState.drawsRequired === 0) {
            tryPassTurn(gameState, playerId);
          }
        }
      } else {
        // Deck and discard pile empty: decrement drawsRequired for player to avoid softlock
        gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);
        if (gameState.drawsRequired === 0) {
          tryPassTurn(gameState, playerId);
        }
      }
      return gameState;
    }
  }

  const card = drawFromDeck(gameState, fromBottom);
  if (!card) {
    // Deck and discard pile empty: decrement drawsRequired and pass turn to avoid softlock
    gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);
    if (gameState.drawsRequired === 0) {
      tryPassTurn(gameState, playerId);
    }
    return gameState;
  }

  // Decrement drawsRequired since a card was drawn!
  gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);

  if (card.type === 'exploding_kitten' || card.type === 'imploding_kitten' || card.type === 'devilcat') {
    resolveExplosion(gameState, playerId, card, onDefuse);
    // If player survived (defused it and didn't die) and no pending zombie (Zombie Kitten has its own async flow)
    const p = getPlayer(gameState, playerId);
    if (p && p.alive && !gameState.pendingZombie && !gameState.pendingDefuse) {
      if (gameState.drawsRequired === 0) {
        tryPassTurn(gameState, playerId);
      }
    }
    return gameState;
  }

  player.hand.push(card);
  player.blinded = false; // Lift the curse!
  if (gameState.drawsRequired === 0) {
    tryPassTurn(gameState, playerId);
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

  let checkType = options.cardId ? (player.hand.find(c => c.id === options.cardId)?.type || cardType) : cardType;
  if (checkType === 'godcat' && options.asCardType) {
    checkType = options.asCardType;
  }
  if (checkType === 'clone' && gameState.lastAction && !gameState.lastAction.canceled) {
    checkType = gameState.lastAction.cardType;
  }

  if (checkType === 'feed_the_dead' || checkType === 'grave_robber') {
    const deadPlayers = gameState.players.filter(p => !p.alive);
    if (deadPlayers.length === 0) return null;
  }

  let card;
  let actualCardType = cardType;

  if (options.cardId) {
    card = removeCardFromHandById(player, options.cardId);
    if (!card) return null;
    actualCardType = card.type;
  } else {
    // Nope cannot be played manually — only via the Nope chain (game:nope event)
    if (cardType === 'nope') return null;
    // Defuse cannot be played manually — auto-played when drawing Exploding Kitten
    if (cardType === 'defuse') return null;

    card = removeCardFromHand(player, cardType);
    if (!card) return null;
  }

  if (actualCardType === 'godcat' && options.asCardType) {
    actualCardType = options.asCardType;
  }

  // Clone handles duplication of the previous action
  const prevAction = gameState.lastAction;
  let clonedCardType = null;
  if (actualCardType === 'clone' && prevAction && !prevAction.canceled) {
    clonedCardType = prevAction.cardType;
  }

  // Godcat goes to playmat instead of discard pile when played as a single card
  if (actualCardType === 'godcat') {
    if (!gameState.playmat) gameState.playmat = { godcat: false, devilcat: true };
    gameState.playmat.godcat = true;
  } else {
    delete card.marked;
    gameState.discardPile.push(card);
  }

  let recordedType = clonedCardType || actualCardType;
  if (options.cardId && (recordedType === 'nope' || recordedType === 'defuse')) {
    recordedType = `discard_${recordedType}`;
  }

  gameState.lastAction = { playerId, cardType: recordedType, targetPlayerId, timestamp: Date.now(), canceled: false };

  return recordedType;
}

function resolveDefusePutBack(gameState, insertPosition) {
  if (!gameState.pendingDefuse) return gameState;
  const card = gameState.pendingDefuse.card;
  const playerId = gameState.pendingDefuse.playerId;
  let pos = parseInt(insertPosition, 10);
  if (Number.isNaN(pos)) pos = 0;
  pos = Math.max(0, Math.min(pos, gameState.deck.length));
  if (card.type === 'imploding_kitten') {
    card.faceUp = true;
  }
  delete card.marked;
  gameState.deck.splice(pos, 0, card);
  gameState.pendingDefuse = null;

  const player = getPlayer(gameState, playerId);
  if (player) {
    player.blinded = false; // Lift the curse!
  }

  if (gameState.drawsRequired === 0) {
    tryPassTurn(gameState, playerId);
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
        tryPassTurn(gameState, playerId);
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

function resolveBarkingKittenAction(gameState, playerId, targetPlayerId) {
  const player = getPlayer(gameState, playerId);
  if (!player) return null;

  const waitingHolder = gameState.barkingKittenState?.waitingHolder;
  let flow = 1;
  let targetId = null;

  if (waitingHolder && waitingHolder !== playerId) {
    // Flow 4: target is waitingHolder (B)
    flow = 4;
    targetId = waitingHolder;
    gameState.barkingKittenState.waitingHolder = null;

    // B's face-up BK goes to discard pile
    gameState.discardPile.push({ id: `bk-faceup-${Date.now()}`, type: 'barking_kitten' });

    // Explode B (waitingHolder)
    const ekCard = { id: `ek-bk-${Date.now()}`, type: 'exploding_kitten' };
    resolveExplosion(gameState, waitingHolder, ekCard);

  } else if (waitingHolder === playerId) {
    // Flow 3: A is waitingHolder and plays 2nd BK. Target is targetPlayerId
    flow = 3;
    targetId = targetPlayerId;
    gameState.barkingKittenState.waitingHolder = null;

    // A's 1st BK (face-up) goes to discard pile
    gameState.discardPile.push({ id: `bk-faceup-${Date.now()}`, type: 'barking_kitten' });

    // Explode target
    if (targetPlayerId) {
      const ekCard = { id: `ek-bk-${Date.now()}`, type: 'exploding_kitten' };
      resolveExplosion(gameState, targetPlayerId, ekCard);
    }

  } else {
    // Flow 1 or 2 (waitingHolder is null)
    const targetWithBK = gameState.players.find(
      (p) => p.userId !== playerId && p.alive && p.hand.some((c) => c.type === 'barking_kitten')
    );

    if (targetWithBK) {
      // Flow 2: Target B has BK in hand
      flow = 2;
      targetId = targetWithBK.userId;
      removeCardFromHand(targetWithBK, 'barking_kitten');
      gameState.discardPile.push({ id: `bk-hand-${Date.now()}`, type: 'barking_kitten' });

      // Explode B
      const ekCard = { id: `ek-bk-${Date.now()}`, type: 'exploding_kitten' };
      resolveExplosion(gameState, targetWithBK.userId, ekCard);

    } else {
      // Flow 1: No one has BK in hand. A becomes waitingHolder
      flow = 1;
      targetId = null;
      const playedCardIdx = gameState.discardPile.findLastIndex((c) => c.type === 'barking_kitten');
      if (playedCardIdx >= 0) {
        gameState.discardPile.splice(playedCardIdx, 1);
      }

      if (!gameState.barkingKittenState) {
        gameState.barkingKittenState = { waitingHolder: null };
      }
      gameState.barkingKittenState.waitingHolder = playerId;
    }
  }

  return { flow, targetId };
}

module.exports = {
  playCard,
  resolveBarkingKittenAction,
  drawCard,
  handleCombo,
  validateCombo,
  checkWinCondition,
  eliminatePlayer,
  resolveZombieRevive,
  resolveDefusePutBack,
  resolveDigDeeper,
  resolveArmageddonDistribute,
  resolveArmageddonDecision,
  checkStreakingKittenEffect,
  passTurn,
  resolveExplosion,
  removeCardFromHand,
};
