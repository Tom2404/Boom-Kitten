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

function eliminatePlayer(gameState, playerId) {
  const player = getPlayer(gameState, playerId);
  if (!player) return gameState;
  player.alive = false;
  player.hand = [];
  gameState.activePlayerIds = gameState.players.filter((p) => p.alive).map((p) => p.userId);
  return gameState;
}

function checkWinCondition(gameState) {
  const alive = gameState.players.filter((p) => p.alive);
  return alive.length === 1 ? alive[0].userId : null;
}

function handleAttack(gameState) {
  // Attack forces the next player to draw 2 times
  gameState.drawsRequired = 2;
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  return gameState;
}

function handleSkip(gameState) {
  // Skip only skips 1 draw. If drawsRequired > 1, decrement it.
  if (gameState.drawsRequired && gameState.drawsRequired > 1) {
    gameState.drawsRequired -= 1;
  } else {
    gameState.drawsRequired = 1;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  }
  return gameState;
}

function handleSuperSkip(gameState) {
  // Super Skip cancels all draws required and passes the turn.
  gameState.drawsRequired = 1;
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  return gameState;
}

function handleSeeTheFuture(gameState, count = 3) {
  return gameState.deck.slice(-count).reverse();
}

function handleShuffle(gameState) {
  gameState.deck = shuffleDeck(gameState.deck);
  return gameState;
}

function handleAlterTheFuture(gameState, playerId) {
  gameState.pendingAlter = { playerId, startedAt: Date.now() };
  return gameState;
}

function resolveAlterTheFuture(gameState, rearrangedCards) {
  if (!gameState.pendingAlter) return gameState;
  const count = Math.min(3, gameState.deck.length);
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
  if (!player || !player.alive) return gameState;

  const cardsToPlay = [];
  cardIds.forEach((id) => {
    const card = player.hand.find((c) => c.id === id);
    if (card) cardsToPlay.push(card);
  });

  if (cardsToPlay.length !== cardIds.length) return gameState;
  if (!cardsToPlay.every((c) => c.type.startsWith('cat_'))) return gameState;

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

  if (cardTypes.length === 2 && cardTypes[0] === cardTypes[1]) {
    const target = getPlayer(gameState, targetPlayerId);
    if (!target || !target.alive || target.hand.length === 0) return gameState;
    const randomIndex = Math.floor(Math.random() * target.hand.length);
    const [stolen] = target.hand.splice(randomIndex, 1);
    player.hand.push(stolen);
    return gameState;
  }

  if (cardTypes.length === 5) {
    const uniqueTypes = new Set(cardTypes);
    if (uniqueTypes.size === 5) {
      return handleCombo5(gameState, playerId);
    }
  }

  return gameState;
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

function drawCard(gameState, playerId, fromBottom = false) {
  const player = getPlayer(gameState, playerId);
  if (!player || !player.alive) return gameState;
  const card = fromBottom ? gameState.deck.shift() : gameState.deck.pop();
  if (!card) return gameState;

  if (card.type === 'exploding_kitten') {
    const hasDefuse = player.hand.some((item) => item.type === 'defuse');
    if (hasDefuse) {
      return handleDefuse(gameState, playerId, Math.floor(Math.random() * (gameState.deck.length + 1)));
    }
    gameState.discardPile.push(card);
    eliminatePlayer(gameState, playerId);
    return gameState;
  }

  player.hand.push(card);
  gameState.drawsRequired = Math.max(0, (gameState.drawsRequired ?? 1) - 1);
  if (gameState.drawsRequired === 0) {
    gameState.drawsRequired = 1;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  }
  return gameState;
}

function handleNope(gameState, nopingPlayerId) {
  gameState.lastAction = { ...(gameState.lastAction ?? {}), canceledBy: nopingPlayerId, canceled: true };
  return gameState;
}

function playCard(gameState, playerId, cardType, targetPlayerId) {
  const player = getPlayer(gameState, playerId);
  if (!player || !player.alive) return gameState;
  const card = removeCardFromHand(player, cardType);
  if (!card) return gameState;

  gameState.discardPile.push(card);
  gameState.lastAction = { playerId, cardType, targetPlayerId, timestamp: Date.now(), canceled: false };

  switch (cardType) {
    case 'attack':
      return handleAttack(gameState);
    case 'skip':
      return handleSkip(gameState);
    case 'super_skip':
      return handleSuperSkip(gameState);
    case 'see_the_future':
    case 'see_the_future_3':
      gameState.lastSeeFuture = { playerId, cards: handleSeeTheFuture(gameState, 3) };
      return gameState;
    case 'see_the_future_1':
      gameState.lastSeeFuture = { playerId, cards: handleSeeTheFuture(gameState, 1) };
      return gameState;
    case 'see_the_future_5':
      gameState.lastSeeFuture = { playerId, cards: handleSeeTheFuture(gameState, 5) };
      return gameState;
    case 'alter_the_future_3':
      return handleAlterTheFuture(gameState, playerId);
    case 'shuffle':
      return handleShuffle(gameState);
    case 'draw_from_bottom':
      return drawCard(gameState, playerId, true);
    case 'favor':
      return handleFavor(gameState, playerId, targetPlayerId);
    default:
      return gameState;
  }
}

module.exports = {
  playCard,
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
};
