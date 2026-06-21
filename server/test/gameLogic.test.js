const test = require('node:test');
const assert = require('node:assert/strict');
const {
  eliminatePlayer,
  resolveZombieRevive,
  handleCombo,
  drawCard,
  checkStreakingKittenEffect,
  checkWinCondition,
  resolveDefusePutBack,
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

test('drawCard drawing 11th card does not pass turn when drawsRequired becomes 0', () => {
  const gameState = {
    edition: 'original',
    players: [
      { userId: 'p1', username: 'P1', hand: Array(10).fill({ id: 'c', type: 'nope' }), alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    currentPlayerIndex: 0,
    deck: [{ id: 'c11', type: 'nope' }],
    discardPile: [],
    drawsRequired: 1,
  };

  const newState = drawCard(gameState, 'p1', false, null);
  // Hand should have 11 cards
  assert.equal(newState.players[0].hand.length, 11);
  // drawsRequired is 0 (completed)
  assert.equal(newState.drawsRequired, 0);
  // Turn should NOT have passed to p2 (still 0)
  assert.equal(newState.currentPlayerIndex, 0);
});

test('resolveDefusePutBack with hand size > 10 does not pass turn when drawsRequired is 0', () => {
  const gameState = {
    edition: 'original',
    players: [
      { userId: 'p1', username: 'P1', hand: Array(11).fill({ id: 'c', type: 'nope' }), alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    currentPlayerIndex: 0,
    deck: [],
    discardPile: [],
    drawsRequired: 0,
    pendingDefuse: {
      playerId: 'p1',
      card: { id: 'ek1', type: 'exploding_kitten' },
      startedAt: Date.now(),
    },
  };

  const newState = resolveDefusePutBack(gameState, 0);
  // pendingDefuse should be cleared
  assert.equal(newState.pendingDefuse, null);
  // Exploding kitten is put back in deck
  assert.equal(newState.deck[0].type, 'exploding_kitten');
  // drawsRequired is still 0
  assert.equal(newState.drawsRequired, 0);
  // Turn should NOT have passed to p2 (still 0)
  assert.equal(newState.currentPlayerIndex, 0);
});

test('eliminatePlayer discards player hand cards to discardPile', () => {
  const gameState = {
    edition: 'original',
    players: [
      { userId: 'p1', username: 'P1', hand: [{ id: 'c1', type: 'nope' }, { id: 'c2', type: 'skip' }], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    activePlayerIds: ['p1', 'p2'],
    currentPlayerIndex: 0,
    drawsRequired: 1,
    discardPile: [],
  };

  const newState = eliminatePlayer(gameState, 'p1');
  assert.equal(newState.players[0].alive, false);
  assert.deepEqual(newState.players[0].hand, []);
  assert.equal(newState.discardPile.length, 2);
  assert.equal(newState.discardPile[0].type, 'nope');
  assert.equal(newState.discardPile[1].type, 'skip');
});

test('drawCard recycles discardPile (filtering out kittens) when deck is empty', () => {
  const gameState = {
    edition: 'original',
    players: [
      { userId: 'p1', username: 'P1', hand: [], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    activePlayerIds: ['p1', 'p2'],
    currentPlayerIndex: 0,
    drawsRequired: 1,
    deck: [],
    discardPile: [
      { id: 'c1', type: 'skip' },
      { id: 'c2', type: 'exploding_kitten' },
      { id: 'c3', type: 'nope' },
      { id: 'c4', type: 'imploding_kitten' },
    ],
  };

  const newState = drawCard(gameState, 'p1');
  // Check that the skipped and nope cards were recycled (2 cards total in the deck/drawn)
  // One card was drawn to p1's hand
  assert.equal(newState.players[0].hand.length, 1);
  const drawnCardType = newState.players[0].hand[0].type;
  assert.ok(drawnCardType === 'skip' || drawnCardType === 'nope');
  // The deck should contain the other recycled card
  assert.equal(newState.deck.length, 1);
  assert.ok(newState.deck[0].type === 'skip' || newState.deck[0].type === 'nope');
  // Exploding and Imploding Kittens must NOT be in the deck or player's hand
  assert.ok(newState.players[0].hand[0].type !== 'exploding_kitten');
  assert.ok(newState.players[0].hand[0].type !== 'imploding_kitten');
  assert.ok(newState.deck[0].type !== 'exploding_kitten');
  assert.ok(newState.deck[0].type !== 'imploding_kitten');
  // Discard pile should be empty after recycling
  assert.deepEqual(newState.discardPile, []);
});

test('drawCard with empty deck and empty discardPile gracefully passes turn (no soft-lock)', () => {
  const gameState = {
    edition: 'original',
    players: [
      { userId: 'p1', username: 'P1', hand: [], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    activePlayerIds: ['p1', 'p2'],
    currentPlayerIndex: 0,
    drawsRequired: 1,
    deck: [],
    discardPile: [
      { id: 'c1', type: 'exploding_kitten' } // only exploding kitten, will be filtered out
    ],
  };

  const newState = drawCard(gameState, 'p1');
  // Should not throw, should just pass turn
  assert.equal(newState.currentPlayerIndex, 1);
  assert.equal(newState.drawsRequired, 1);
});

test('curse_of_the_cat_butt sets blinded state, allows play by ID, and is resolved on draw or defuse', () => {
  const { playCard, executeActionEffect } = require('../game/gameLogic');

  // Test 1: playing curse_of_the_cat_butt sets blinded state
  let state = {
    players: [
      { userId: 'p1', username: 'P1', hand: [{ id: 'c1', type: 'curse_of_the_cat_butt' }, { id: 'c2', type: 'skip' }, { id: 'c3', type: 'nope' }], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true },
    ],
    currentPlayerIndex: 0,
    deck: [{ id: 'normal', type: 'skip' }],
    discardPile: [],
  };

  state = executeActionEffect(state, 'curse_of_the_cat_butt', 'p1', 'p2');
  assert.equal(state.players[1].blinded, true);

  // Test 2: playing card blindly by ID resolves correct card type
  // Play 'c2' (skip) from p1 blindly
  const playedType = playCard(state, 'p1', 'hidden', null, { cardId: 'c2' });
  assert.equal(playedType, 'skip');
  assert.equal(state.players[0].hand.length, 2); // 'c2' removed, remaining: 'c1', 'c3'
  assert.equal(state.discardPile.some(c => c.id === 'c2'), true);

  // Play 'c3' (nope) from p1 blindly -> resolved as 'discard_nope'
  const playedNopeType = playCard(state, 'p1', 'hidden', null, { cardId: 'c3' });
  assert.equal(playedNopeType, 'discard_nope');

  // Test 3: Drawing a normal card successfully lifts the blinded state for p2
  let p2State = {
    players: [
      { userId: 'p1', username: 'P1', hand: [], alive: true },
      { userId: 'p2', username: 'P2', hand: [], alive: true, blinded: true },
    ],
    currentPlayerIndex: 1,
    deck: [{ id: 'normal', type: 'skip' }],
    discardPile: [],
    drawsRequired: 1,
  };

  p2State = drawCard(p2State, 'p2');
  assert.equal(p2State.players[1].blinded, false); // Lifted!

  // Test 4: Defusing an exploding kitten lifts the blinded state
  let defuseState = {
    players: [
      { userId: 'p1', username: 'P1', hand: [], alive: true },
      { userId: 'p2', username: 'P2', hand: [{ id: 'd1', type: 'defuse' }], alive: true, blinded: true },
    ],
    currentPlayerIndex: 1,
    deck: [{ id: 'ek', type: 'exploding_kitten' }],
    discardPile: [],
    drawsRequired: 1,
  };

  defuseState = drawCard(defuseState, 'p2');
  // Since they had defuse, it's auto-played, entering pendingDefuse
  assert.ok(defuseState.pendingDefuse);
  assert.equal(defuseState.players[1].blinded, true); // Still blinded during defusal

  defuseState = resolveDefusePutBack(defuseState, 0);
  assert.equal(defuseState.players[1].blinded, false); // Lifted after defuse put back!
});



