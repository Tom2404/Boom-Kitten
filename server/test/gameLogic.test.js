const test = require('node:test');
const assert = require('node:assert/strict');
const {
  eliminatePlayer,
  resolveZombieRevive,
  handleCombo,
  drawCard,
  checkStreakingKittenEffect,
  checkWinCondition,
} = require('../game/gameLogic');

test('eliminatePlayer does not clear hand in zombie edition', () => {
  const gameState = {
    edition: 'zombie',
    players: [
      { userId: 'p1', username: 'P1', hand: [{ id: 'c1', type: 'nope' }], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    activePlayerIds: ['p1', 'p2'],
    currentPlayerIndex: 0,
    drawsRequired: 1,
  };

  const newState = eliminatePlayer(gameState, 'p1');
  assert.equal(newState.players[0].alive, false);
  assert.deepEqual(newState.players[0].hand, [{ id: 'c1', type: 'nope' }]);
});

test('eliminatePlayer clears hand in original edition', () => {
  const gameState = {
    edition: 'original',
    players: [
      { userId: 'p1', username: 'P1', hand: [{ id: 'c1', type: 'nope' }], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    activePlayerIds: ['p1', 'p2'],
    currentPlayerIndex: 0,
    drawsRequired: 1,
  };

  const newState = eliminatePlayer(gameState, 'p1');
  assert.equal(newState.players[0].alive, false);
  assert.deepEqual(newState.players[0].hand, []);
});

test('resolveZombieRevive does not clear revived player hand and transfers 1 card from activator', () => {
  const gameState = {
    edition: 'zombie',
    players: [
      { userId: 'p1', username: 'P1', hand: [{ id: 'c1', type: 'nope' }, { id: 'c2', type: 'skip' }], alive: true },
      { userId: 'p2', username: 'P2', hand: [{ id: 'c3', type: 'favor' }], alive: false },
    ],
    activePlayerIds: ['p1'],
    deck: [],
    pendingZombie: {
      playerId: 'p1',
      card: { id: 'ek1', type: 'exploding_kitten' },
      startedAt: Date.now(),
    },
    currentPlayerIndex: 0,
    drawsRequired: 0,
  };

  const newState = resolveZombieRevive(gameState, 'p2', 0);
  assert.equal(newState.players[1].alive, true);
  assert.equal(newState.players[0].hand.length, 1); // activator lost 1 card
  assert.equal(newState.players[1].hand.length, 2); // target has their original card + 1 card from activator
  assert.equal(newState.deck[0].type, 'exploding_kitten'); // EK put back in deck
  assert.equal(newState.pendingZombie, null);
});

test('handleCombo in 2_player edition allows action card combos', () => {
  const gameState = {
    edition: '2_player',
    players: [
      {
        userId: 'p1',
        username: 'P1',
        hand: [
          { id: 'c1', type: 'nope' },
          { id: 'c2', type: 'nope' },
        ],
        alive: true,
      },
    ],
    discardPile: [],
    lastAction: null,
  };

  const result = handleCombo(gameState, 'p1', ['c1', 'c2'], 'p2');
  assert.ok(result);
  assert.deepEqual(result.cardTypes, ['nope', 'nope']);
  assert.equal(gameState.players[0].hand.length, 0);
  assert.equal(gameState.discardPile.length, 2);
});

test('handleCombo in original edition rejects action card combos', () => {
  const gameState = {
    edition: 'original',
    players: [
      {
        userId: 'p1',
        username: 'P1',
        hand: [
          { id: 'c1', type: 'nope' },
          { id: 'c2', type: 'nope' },
        ],
        alive: true,
      },
    ],
    discardPile: [],
    lastAction: null,
  };

  const result = handleCombo(gameState, 'p1', ['c1', 'c2'], 'p2');
  assert.equal(result, null);
  assert.equal(gameState.players[0].hand.length, 2);
  assert.equal(gameState.discardPile.length, 0);
});

test('drawCard triggers explosion when devilcat is drawn', () => {
  let defusedTriggered = false;
  const onDefuse = () => {
    defusedTriggered = true;
  };

  const gameState = {
    edition: 'good_vs_evil',
    players: [
      { userId: 'p1', username: 'P1', hand: [], alive: true },
    ],
    deck: [{ id: 'd1', type: 'devilcat' }],
    discardPile: [],
    drawsRequired: 1,
  };

  // Activator draws devilcat, has no defuse -> eliminated
  const newState = drawCard(gameState, 'p1', false, onDefuse);
  assert.equal(newState.players[0].alive, false);
  assert.equal(newState.discardPile[0].type, 'devilcat');
});

test('drawCard triggers pendingDefuse without discarding Defuse card when face-down imploding_kitten is drawn', () => {
  const gameState = {
    edition: 'imploding',
    players: [
      { userId: 'p1', username: 'P1', hand: [{ id: 'df1', type: 'defuse' }], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    currentPlayerIndex: 0,
    deck: [{ id: 'ik1', type: 'imploding_kitten', faceUp: false }],
    discardPile: [],
    drawsRequired: 1,
  };

  const newState = drawCard(gameState, 'p1', false, null);
  // Hand should still have the Defuse card (not consumed)
  assert.equal(newState.players[0].hand.length, 1);
  assert.equal(newState.players[0].hand[0].type, 'defuse');
  // Player is still alive
  assert.equal(newState.players[0].alive, true);
  // pendingDefuse is active, holding the imploding kitten
  assert.ok(newState.pendingDefuse);
  assert.equal(newState.pendingDefuse.card.type, 'imploding_kitten');
});

test('drawCard triggers immediate elimination when face-up imploding_kitten is drawn', () => {
  const gameState = {
    edition: 'imploding',
    players: [
      { userId: 'p1', username: 'P1', hand: [{ id: 'df1', type: 'defuse' }], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    currentPlayerIndex: 0,
    deck: [{ id: 'ik1', type: 'imploding_kitten', faceUp: true }],
    discardPile: [],
    drawsRequired: 1,
  };

  const newState = drawCard(gameState, 'p1', false, null);
  // Player is dead despite having a Defuse card
  assert.equal(newState.players[0].alive, false);
  assert.equal(newState.discardPile[0].type, 'imploding_kitten');
  assert.equal(newState.pendingDefuse ?? null, null);
});

test('drawCard with exploding_kitten and no defuse passes turn and updates player status in imploding edition', () => {
  const gameState = {
    edition: 'imploding',
    players: [
      { userId: 'p1', username: 'P1', hand: [], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
      { userId: 'p3', username: 'P3', hand: [], alive: true },
    ],
    currentPlayerIndex: 0,
    deck: [{ id: 'ek1', type: 'exploding_kitten' }],
    discardPile: [],
    drawsRequired: 1,
  };

  const newState = drawCard(gameState, 'p1', false, null);
  // P1 is eliminated
  assert.equal(newState.players[0].alive, false);
  assert.deepEqual(newState.players[0].hand, []);
  
  // Turn should pass to P2 (index 1)
  assert.equal(newState.currentPlayerIndex, 1);
  assert.equal(newState.drawsRequired, 1);

  // Match should not end since 2 players are alive
  const winner = checkWinCondition(newState);
  assert.equal(winner, null);
});

