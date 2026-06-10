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
  gameState.drawsRequired = 2;
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  return gameState;
}

function handleSkip(gameState) {
  gameState.drawsRequired = 1;
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  return gameState;
}

function handleSeeTheFuture(gameState) {
  return gameState.deck.slice(-3).reverse();
}

function handleShuffle(gameState) {
  gameState.deck = shuffleDeck(gameState.deck);
  return gameState;
}

function handleFavor(gameState, fromPlayerId, targetPlayerId) {
  gameState.pendingFavor = { fromPlayerId, targetPlayerId, startedAt: Date.now() };
  return gameState;
}

function handleCombo(gameState, playerId, cards, targetPlayerId) {
  if (cards.length < 2 || !cards.every((c) => c.startsWith('cat_'))) return gameState;
  const target = getPlayer(gameState, targetPlayerId);
  const player = getPlayer(gameState, playerId);
  if (!target || !player || target.hand.length === 0) return gameState;
  const randomIndex = Math.floor(Math.random() * target.hand.length);
  const [stolen] = target.hand.splice(randomIndex, 1);
  player.hand.push(stolen);
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

function drawCard(gameState, playerId) {
  const player = getPlayer(gameState, playerId);
  if (!player || !player.alive) return gameState;
  const card = gameState.deck.pop();
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
    case 'see_the_future':
      gameState.lastSeeFuture = { playerId, cards: handleSeeTheFuture(gameState) };
      return gameState;
    case 'shuffle':
      return handleShuffle(gameState);
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
  handleSeeTheFuture,
  handleShuffle,
  handleFavor,
  handleCombo,
  checkWinCondition,
  eliminatePlayer,
};
