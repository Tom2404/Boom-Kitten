const test = require('node:test');
const assert = require('node:assert/strict');

const EffectQueue = require('../game/effects/EffectQueue');
const ResolveComboEffect = require('../game/effects/primitives/ResolveComboEffect');
const CollectCombo3ResponseEffect = require('../game/effects/primitives/CollectCombo3ResponseEffect');
const { validateInteractionResponse } = require('../game/interactions/interactionGuards');
const InteractionManager = require('../game/interactions/InteractionManager');

function createState() {
  return {
    edition: 'all',
    discardPile: [],
    players: [
      {
        userId: 'owner',
        alive: true,
        hand: [
          { id: 'cat-1', type: 'cat_taco' },
          { id: 'cat-2', type: 'cat_taco' },
          { id: 'cat-3', type: 'cat_taco' },
        ],
      },
      {
        userId: 'target',
        alive: true,
        hand: [
          { id: 'skip-1', type: 'skip' },
          { id: 'nope-1', type: 'nope' },
        ],
      },
    ],
  };
}

test('resolved combo 3 asks its owner for a card name after the Nope window', () => {
  const state = createState();
  const result = new ResolveComboEffect().execute(
    { state, effectQueue: new EffectQueue() },
    {
      userId: 'owner',
      targetPlayerId: 'target',
      options: { cardIds: ['cat-1', 'cat-2', 'cat-3'] },
    },
  );

  assert.equal(result.status, 'WAIT_INPUT');
  assert.equal(state.activeInteraction.type, 'combo_3');
  assert.equal(state.activeInteraction.owner, 'owner');
  assert.deepEqual(state.activeInteraction.participants, ['owner']);
  assert.equal(state.activeInteraction.metadata.targetPlayerId, 'target');
  assert.equal(state.players[0].hand.length, 0);
  assert.equal(state.discardPile.length, 3);
});

test('combo 3 transfers one matching named card from target to owner', () => {
  const state = createState();
  const result = new CollectCombo3ResponseEffect().execute(
    { state },
    {
      owner: 'owner',
      metadata: { targetPlayerId: 'target' },
      responses: { owner: { cardType: 'skip' } },
    },
  );

  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(state.players[0].hand.map((card) => card.id), ['cat-1', 'cat-2', 'cat-3', 'skip-1']);
  assert.deepEqual(state.players[1].hand.map((card) => card.id), ['nope-1']);
});

test('combo 3 completion runs the registered transfer effect', () => {
  const state = createState();
  const context = { state, effectQueue: new EffectQueue() };
  new ResolveComboEffect().execute(context, {
    userId: 'owner',
    targetPlayerId: 'target',
    options: { cardIds: ['cat-1', 'cat-2', 'cat-3'] },
  });

  assert.equal(InteractionManager.recordResponse(context, 'owner', { cardType: 'skip' }), 'COMPLETED');
  assert.equal(state.activeInteraction, null);
  assert.deepEqual(state.players[0].hand.map((card) => card.id), ['skip-1']);
  assert.deepEqual(state.players[1].hand.map((card) => card.id), ['nope-1']);
});

test('combo 3 has no effect when the target does not own the named card', () => {
  const state = createState();
  const result = new CollectCombo3ResponseEffect().execute(
    { state },
    {
      owner: 'owner',
      metadata: { targetPlayerId: 'target' },
      responses: { owner: { cardType: 'defuse' } },
    },
  );

  assert.equal(result.status, 'NO_EFFECT');
  assert.equal(state.players[0].hand.length, 3);
  assert.equal(state.players[1].hand.length, 2);
});

test('combo 3 accepts only a bounded card type at the socket trust boundary', () => {
  const state = createState();
  state.activeInteraction = { type: 'combo_3' };

  assert.equal(validateInteractionResponse(state, 'owner', { cardType: 'skip' }).valid, true);
  assert.equal(validateInteractionResponse(state, 'owner', { cardType: '../skip' }).valid, false);
  assert.equal(validateInteractionResponse(state, 'owner', { cardType: 'x'.repeat(65) }).valid, false);
});
