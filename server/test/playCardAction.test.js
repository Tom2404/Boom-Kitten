const test = require('node:test');
const assert = require('node:assert/strict');
const { dispatcher } = require('../game/actions');
const GameContext = require('../game/state/GameContext');
const EffectQueue = require('../game/effects/EffectQueue');

function createContext() {
  const state = {
    players: [
      { userId: 'p1', username: 'P1', alive: true, hand: [{ id: 'skip-1', type: 'skip' }] },
      { userId: 'p2', username: 'P2', alive: true, hand: [] },
    ],
    currentPlayerIndex: 0,
    playDirection: 1,
    drawsRequired: 1,
    deck: [],
    discardPile: [],
    maxHandSize: 10,
  };

  return {
    state,
    context: new GameContext(state, new EffectQueue()),
  };
}

function createFavorContext() {
  const state = {
    players: [
      { userId: 'p1', username: 'P1', alive: true, hand: [{ id: 'favor-1', type: 'favor' }] },
      { userId: 'p2', username: 'P2', alive: true, hand: [{ id: 'cat-1', type: 'cat_taco' }] },
    ],
    currentPlayerIndex: 0,
    playDirection: 1,
    drawsRequired: 1,
    deck: [],
    discardPile: [],
    maxHandSize: 10,
  };

  return {
    state,
    context: new GameContext(state, new EffectQueue()),
  };
}

function createCombo2Context() {
  const state = {
    players: [
      {
        userId: 'p1',
        username: 'P1',
        alive: true,
        hand: [
          { id: 'cat-a', type: 'cat_taco' },
          { id: 'cat-b', type: 'cat_taco' },
        ],
      },
      {
        userId: 'p2',
        username: 'P2',
        alive: true,
        hand: [{ id: 'gift-1', type: 'skip' }],
      },
    ],
    currentPlayerIndex: 0,
    playDirection: 1,
    drawsRequired: 1,
    deck: [],
    discardPile: [],
    maxHandSize: 10,
  };

  return {
    state,
    context: new GameContext(state, new EffectQueue()),
  };
}

function createCombo5Context() {
  const comboCards = ['taco', 'watermelon', 'beard', 'rainbow', 'potato'].map((type) => ({
    id: `cat-${type}`,
    type: `cat_${type}`,
  }));
  const state = {
    players: [
      { userId: 'p1', username: 'P1', alive: true, hand: comboCards },
      { userId: 'p2', username: 'P2', alive: true, hand: [] },
    ],
    currentPlayerIndex: 0,
    playDirection: 1,
    drawsRequired: 1,
    deck: [],
    discardPile: [{ id: 'skip-discarded', type: 'skip' }],
    maxHandSize: 10,
  };

  return {
    state,
    comboCardIds: comboCards.map((card) => card.id),
    context: new GameContext(state, new EffectQueue()),
  };
}

function playCard(context, state, userId, cardType, targetPlayerId = null, options = {}) {
  const initPayload = { userId, cardType, targetPlayerId, options };
  const initResult = dispatcher.dispatch('PLAY_CARD_INIT', context, initPayload);
  assert.equal(initResult.success, true);

  const result = dispatcher.dispatch('PLAY_CARD', context, {
    userId,
    cardType: initPayload.actualCardType,
    targetPlayerId: initPayload.finalTargetPlayerId,
    options,
  });

  assert.equal(result.success, true);
  return state.activeInteraction;
}

test('PLAY_CARD_INIT removes and discards card without resolving its effect', () => {
  const { state, context } = createContext();
  const payload = { userId: 'p1', cardType: 'skip', targetPlayerId: null, options: {} };

  const result = dispatcher.dispatch('PLAY_CARD_INIT', context, payload);

  assert.equal(result.success, true);
  assert.equal(payload.actualCardType, 'skip');
  assert.equal(state.players[0].hand.length, 0);
  assert.equal(state.discardPile.length, 1);
  assert.equal(state.discardPile[0].type, 'skip');
  assert.equal(state.currentPlayerIndex, 0);
});

test('PLAY_CARD resolves effect after init when the action is not canceled', () => {
  const { state, context } = createContext();
  const initPayload = { userId: 'p1', cardType: 'skip', targetPlayerId: null, options: {} };
  dispatcher.dispatch('PLAY_CARD_INIT', context, initPayload);

  const resolvePayload = { userId: 'p1', cardType: initPayload.actualCardType, targetPlayerId: null, options: {} };
  const result = dispatcher.dispatch('PLAY_CARD', context, resolvePayload);

  assert.equal(result.success, true);
  assert.equal(state.currentPlayerIndex, 1);
  assert.equal(state.discardPile.length, 1);
});

test('combo 5 waits for its owner to select a card from the discard pile', () => {
  const { state, context, comboCardIds } = createCombo5Context();

  const result = dispatcher.dispatch('PLAY_CARD', context, {
    userId: 'p1',
    cardType: 'combo_5',
    options: { cardIds: comboCardIds },
  });

  assert.equal(result.success, true);
  assert.equal(state.pendingCombo5.playerId, 'p1');
  assert.equal(state.activeInteraction.type, 'combo_5');
  assert.deepEqual(state.activeInteraction.participants, ['p1']);
});

test('combo 5 response moves the selected discard card to the owner hand', () => {
  const { state, context, comboCardIds } = createCombo5Context();
  dispatcher.dispatch('PLAY_CARD', context, {
    userId: 'p1',
    cardType: 'combo_5',
    options: { cardIds: comboCardIds },
  });

  const result = dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p1',
    interactionId: state.activeInteraction.id,
    responseData: { cardId: 'skip-discarded' },
  });

  assert.equal(result.success, true);
  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingCombo5, null);
  assert.equal(state.discardPile.some((card) => card.id === 'skip-discarded'), false);
  assert.equal(state.players[0].hand.some((card) => card.id === 'skip-discarded'), true);
});

test('PLAY_CARD resolve creates a socket-compatible active interaction', () => {
  const { state, context } = createFavorContext();
  const initPayload = { userId: 'p1', cardType: 'favor', targetPlayerId: 'p2', options: {} };
  dispatcher.dispatch('PLAY_CARD_INIT', context, initPayload);

  const resolvePayload = {
    userId: 'p1',
    cardType: initPayload.actualCardType,
    targetPlayerId: initPayload.finalTargetPlayerId,
    options: {},
  };
  const result = dispatcher.dispatch('PLAY_CARD', context, resolvePayload);

  assert.equal(result.success, true);
  assert.equal(state.activeInteraction.type, 'favor');
  assert.equal(state.activeInteraction.owner, 'p1');
  assert.deepEqual(state.activeInteraction.participants, ['p2']);
  assert.equal(typeof state.activeInteraction.id, 'string');
  assert.equal(state.activeInteraction.timeout, 15000);
  assert.equal(state.pendingFavor.fromPlayerId, 'p1');
  assert.equal(state.pendingFavor.targetPlayerId, 'p2');
});

test('favor response transfers selected card and clears pending interaction blockers', () => {
  const { state, context } = createFavorContext();
  const initPayload = { userId: 'p1', cardType: 'favor', targetPlayerId: 'p2', options: {} };
  dispatcher.dispatch('PLAY_CARD_INIT', context, initPayload);

  dispatcher.dispatch('PLAY_CARD', context, {
    userId: 'p1',
    cardType: initPayload.actualCardType,
    targetPlayerId: initPayload.finalTargetPlayerId,
    options: {},
  });

  const result = dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p2',
    interactionId: state.activeInteraction.id,
    responseData: 'cat-1',
  });

  assert.equal(result.success, true);
  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingFavor, null);
  assert.deepEqual(state.players[0].hand.map((card) => card.id), ['cat-1']);
  assert.deepEqual(state.players[1].hand, []);
});

test('invalid favor response is rejected without consuming the interaction', () => {
  const { state, context } = createFavorContext();
  const interaction = playCard(context, state, 'p1', 'favor', 'p2');

  const result = dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p2',
    interactionId: interaction.id,
    responseData: 'missing-card',
  });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Lá bài đã chọn không còn trên tay bạn!');
  assert.equal(state.activeInteraction.id, interaction.id);
  assert.equal(state.activeInteraction.responses.p2, undefined);
  assert.equal(state.pendingFavor.targetPlayerId, 'p2');
  assert.deepEqual(state.players[0].hand, []);
  assert.deepEqual(state.players[1].hand.map((card) => card.id), ['cat-1']);
});

test('combo 2 opens favor-style card choice for target and transfers selected card', () => {
  const { state, context } = createCombo2Context();

  const result = dispatcher.dispatch('PLAY_CARD', context, {
    userId: 'p1',
    cardType: 'combo_2',
    targetPlayerId: 'p2',
    options: { cardIds: ['cat-a', 'cat-b'] },
  });

  assert.equal(result.success, true);
  assert.equal(state.discardPile.length, 2);
  assert.equal(state.activeInteraction.type, 'favor');
  assert.equal(state.activeInteraction.owner, 'p1');
  assert.deepEqual(state.activeInteraction.participants, ['p2']);
  assert.equal(state.pendingFavor.fromPlayerId, 'p1');
  assert.equal(state.pendingFavor.targetPlayerId, 'p2');

  const responseResult = dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p2',
    interactionId: state.activeInteraction.id,
    responseData: 'gift-1',
  });

  assert.equal(responseResult.success, true);
  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingFavor, null);
  assert.deepEqual(state.players[0].hand.map((card) => card.id), ['gift-1']);
  assert.deepEqual(state.players[1].hand, []);
});

test('invalid combo 2 response is rejected without stealing a card', () => {
  const { state, context } = createCombo2Context();

  const result = dispatcher.dispatch('PLAY_CARD', context, {
    userId: 'p1',
    cardType: 'combo_2',
    targetPlayerId: 'p2',
    options: { cardIds: ['cat-a', 'cat-b'] },
  });

  assert.equal(result.success, true);
  const interactionId = state.activeInteraction.id;

  const responseResult = dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p2',
    interactionId,
    responseData: 'not-in-hand',
  });

  assert.equal(responseResult.success, false);
  assert.equal(state.activeInteraction.id, interactionId);
  assert.equal(state.activeInteraction.responses.p2, undefined);
  assert.deepEqual(state.players[0].hand, []);
  assert.deepEqual(state.players[1].hand.map((card) => card.id), ['gift-1']);
});

test('interaction timeout clears favor blockers', () => {
  const { state, context } = createFavorContext();
  playCard(context, state, 'p1', 'favor', 'p2');

  const result = dispatcher.dispatch('INTERACTION_TIMEOUT', context, {
    interactionId: state.activeInteraction.id,
  });

  assert.equal(result.success, true);
  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingFavor, null);
});

test('alter the future response reorders top deck and clears blockers', () => {
  const state = {
    players: [
      { userId: 'p1', username: 'P1', alive: true, hand: [{ id: 'alter-1', type: 'alter_the_future_3' }] },
      { userId: 'p2', username: 'P2', alive: true, hand: [] },
    ],
    currentPlayerIndex: 0,
    playDirection: 1,
    drawsRequired: 1,
    deck: [
      { id: 'bottom', type: 'cat_taco' },
      { id: 'a', type: 'skip' },
      { id: 'b', type: 'attack' },
      { id: 'c', type: 'shuffle' },
    ],
    discardPile: [],
    maxHandSize: 10,
  };
  const context = new GameContext(state, new EffectQueue());
  const interaction = playCard(context, state, 'p1', 'alter_the_future_3');

  const response = [
    { id: 'b', type: 'attack' },
    { id: 'c', type: 'shuffle' },
    { id: 'a', type: 'skip' },
  ];
  const result = dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p1',
    interactionId: interaction.id,
    responseData: response,
  });

  assert.equal(result.success, true);
  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingAlter, null);
  assert.deepEqual(state.deck.map((card) => card.id), ['bottom', 'a', 'c', 'b']);
});

test('invalid alter the future response is rejected before changing deck order', () => {
  const state = {
    players: [
      { userId: 'p1', username: 'P1', alive: true, hand: [{ id: 'alter-1', type: 'alter_the_future_3' }] },
      { userId: 'p2', username: 'P2', alive: true, hand: [] },
    ],
    currentPlayerIndex: 0,
    playDirection: 1,
    drawsRequired: 1,
    deck: [
      { id: 'bottom', type: 'cat_taco' },
      { id: 'a', type: 'skip' },
      { id: 'b', type: 'attack' },
      { id: 'c', type: 'shuffle' },
    ],
    discardPile: [],
    maxHandSize: 10,
  };
  const context = new GameContext(state, new EffectQueue());
  const interaction = playCard(context, state, 'p1', 'alter_the_future_3');

  const result = dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p1',
    interactionId: interaction.id,
    responseData: [
      { id: 'a', type: 'skip' },
      { id: 'b', type: 'attack' },
      { id: 'missing', type: 'shuffle' },
    ],
  });

  assert.equal(result.success, false);
  assert.equal(state.activeInteraction.id, interaction.id);
  assert.equal(state.activeInteraction.responses.p1, undefined);
  assert.deepEqual(state.deck.map((card) => card.id), ['bottom', 'a', 'b', 'c']);
});

test('pot luck and garbage collection accept raw card id responses', () => {
  const state = {
    players: [
      { userId: 'p1', username: 'P1', alive: true, hand: [{ id: 'pot-1', type: 'pot_luck' }, { id: 'p1-cat', type: 'cat_taco' }] },
      { userId: 'p2', username: 'P2', alive: true, hand: [{ id: 'p2-cat', type: 'cat_beard' }, { id: 'garbage-1', type: 'garbage_collection' }] },
    ],
    currentPlayerIndex: 0,
    playDirection: 1,
    drawsRequired: 1,
    deck: [],
    discardPile: [],
    maxHandSize: 10,
  };
  const context = new GameContext(state, new EffectQueue());
  const potInteraction = playCard(context, state, 'p1', 'pot_luck');

  assert.equal(state.pendingPotLuck.playerId, 'p1');
  dispatcher.dispatch('SUBMIT_INTERACTION', context, { userId: 'p1', interactionId: potInteraction.id, responseData: 'p1-cat' });
  dispatcher.dispatch('SUBMIT_INTERACTION', context, { userId: 'p2', interactionId: potInteraction.id, responseData: 'p2-cat' });

  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingPotLuck, null);
  assert.deepEqual(state.deck.map((card) => card.id).sort(), ['p1-cat', 'p2-cat']);

  state.currentPlayerIndex = 1;
  const garbageInteraction = playCard(context, state, 'p2', 'garbage_collection');
  dispatcher.dispatch('SUBMIT_INTERACTION', context, { userId: 'p1', interactionId: garbageInteraction.id, responseData: null });
  dispatcher.dispatch('SUBMIT_INTERACTION', context, { userId: 'p2', interactionId: garbageInteraction.id, responseData: null });

  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingGarbage, null);
});

test('feed the dead and grave robber complete with raw card id responses', () => {
  const state = {
    edition: 'zombie',
    players: [
      { userId: 'p1', username: 'P1', alive: true, hand: [{ id: 'feed-1', type: 'feed_the_dead' }, { id: 'grave-1', type: 'grave_robber' }] },
      { userId: 'p2', username: 'P2', alive: true, hand: [{ id: 'gift-1', type: 'cat_taco' }] },
      { userId: 'p3', username: 'P3', alive: false, hand: [{ id: 'dead-1', type: 'cat_beard' }] },
    ],
    currentPlayerIndex: 0,
    playDirection: 1,
    drawsRequired: 1,
    deck: [],
    discardPile: [],
    maxHandSize: 10,
  };
  const context = new GameContext(state, new EffectQueue());
  const feedInteraction = playCard(context, state, 'p1', 'feed_the_dead', 'p3');

  dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p2',
    interactionId: feedInteraction.id,
    responseData: 'gift-1',
  });

  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingFeedTheDead, null);
  assert.deepEqual(state.players[2].hand.map((card) => card.id), ['dead-1', 'gift-1']);

  const graveInteraction = playCard(context, state, 'p1', 'grave_robber');
  dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p3',
    interactionId: graveInteraction.id,
    responseData: 'dead-1',
  });

  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingGraveRobber, null);
  assert.equal(state.players[2].hand.some((card) => card.id === 'dead-1'), false);
  assert.equal(state.deck.some((card) => card.id === 'dead-1'), true);
});

test('dig deeper resolves decision and draw from bottom advances turn', () => {
  const state = {
    players: [
      { userId: 'p1', username: 'P1', alive: true, hand: [{ id: 'dig-1', type: 'dig_deeper' }, { id: 'bottom-1', type: 'draw_from_bottom' }] },
      { userId: 'p2', username: 'P2', alive: true, hand: [] },
    ],
    currentPlayerIndex: 0,
    playDirection: 1,
    drawsRequired: 1,
    deck: [
      { id: 'deck-bottom', type: 'cat_taco' },
      { id: 'deck-top', type: 'cat_beard' },
    ],
    discardPile: [],
    maxHandSize: 10,
  };
  const context = new GameContext(state, new EffectQueue());
  const digInteraction = playCard(context, state, 'p1', 'dig_deeper');

  assert.equal(state.pendingDigDeeper.firstCard.id, 'deck-top');
  dispatcher.dispatch('SUBMIT_INTERACTION', context, {
    userId: 'p1',
    interactionId: digInteraction.id,
    responseData: 'keep',
  });

  assert.equal(state.activeInteraction, null);
  assert.equal(state.pendingDigDeeper, null);
  assert.equal(state.currentPlayerIndex, 1);
  assert.equal(state.players[0].hand.some((card) => card.id === 'deck-top'), true);

  state.currentPlayerIndex = 0;
  state.drawsRequired = 1;
  playCard(context, state, 'p1', 'draw_from_bottom');

  assert.equal(state.players[0].hand.some((card) => card.id === 'deck-bottom'), true);
  assert.equal(state.currentPlayerIndex, 1);
});
