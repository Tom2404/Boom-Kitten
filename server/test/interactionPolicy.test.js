const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getInteractionParticipants,
  isNopeResponderEligible,
  sanitizeActiveInteractionForPublic,
} = require('../game/interactions/interactionPolicy');
const { buildReconnectInteractionRequest } = require('../sockets/interactionEvents');

const players = [
  { userId: 'owner', alive: true, hand: [{ id: 'a' }] },
  { userId: 'alive-2', alive: true, hand: [{ id: 'b' }] },
  { userId: 'dead-card', alive: false, hand: [{ id: 'c' }] },
  { userId: 'dead-empty', alive: false, hand: [] },
];

test('routes multiplayer card forms only to their configured participants', () => {
  const state = { players };

  assert.deepEqual(getInteractionParticipants(state, {
    type: 'favor', owner: 'owner', targetPlayerId: 'alive-2',
  }), ['alive-2']);
  assert.deepEqual(getInteractionParticipants(state, {
    type: 'garbage_collection', owner: 'owner',
  }), ['owner', 'alive-2']);
  assert.deepEqual(getInteractionParticipants(state, {
    type: 'pot_luck', owner: 'owner',
  }), ['owner', 'alive-2']);
  assert.deepEqual(getInteractionParticipants(state, {
    type: 'feed_the_dead', owner: 'owner', targetPlayerId: 'dead-card',
  }), ['alive-2']);
  assert.deepEqual(getInteractionParticipants(state, {
    type: 'grave_robber', owner: 'owner',
  }), ['dead-card']);
  assert.deepEqual(getInteractionParticipants(state, {
    type: 'dig_deeper', owner: 'owner',
  }), ['owner']);
});

test('prevents the response owner and eliminated players from answering the current Nope window', () => {
  const state = { players };
  const pendingAction = { playerId: 'owner' };

  assert.equal(isNopeResponderEligible(state, pendingAction, 'owner'), false);
  assert.equal(isNopeResponderEligible(state, pendingAction, 'alive-2'), true);
  assert.equal(isNopeResponderEligible(state, pendingAction, 'dead-card'), false);
  assert.equal(isNopeResponderEligible(state, pendingAction, 'missing'), false);
});

test('rebuilds a pending request with remaining time only for an unanswered participant', () => {
  const gameState = {
    activeInteraction: {
      id: 'interaction-1',
      type: 'favor',
      owner: 'owner',
      participants: ['alive-2'],
      responses: {},
      status: 'WAITING',
      startedAt: 1_000,
      timeout: 15_000,
      metadata: { targetPlayerId: 'alive-2', hiddenCard: 'secret' },
    },
  };

  assert.deepEqual(buildReconnectInteractionRequest(gameState, 'alive-2', 6_000), {
    interactionId: 'interaction-1',
    type: 'favor',
    owner: 'owner',
    participantId: 'alive-2',
    timeoutMs: 10_000,
    metadata: { targetPlayerId: 'alive-2', hiddenCard: 'secret' },
    fromPlayerId: 'owner',
    resumed: true,
    responded: false,
  });
  assert.equal(buildReconnectInteractionRequest(gameState, 'owner', 6_000), null);

  gameState.activeInteraction.responses['alive-2'] = 'card-1';
  assert.deepEqual(buildReconnectInteractionRequest(gameState, 'alive-2', 6_000), {
    interactionId: 'interaction-1',
    type: 'favor',
    owner: 'owner',
    participantId: 'alive-2',
    timeoutMs: 10_000,
    metadata: { targetPlayerId: 'alive-2', hiddenCard: 'secret' },
    fromPlayerId: 'owner',
    resumed: true,
    responded: true,
  });
});

test('removes participant identities, responses, effects and private metadata from public interaction state', () => {
  const interaction = {
    id: 'interaction-1',
    type: 'dig_deeper',
    owner: 'owner',
    participants: ['owner'],
    responses: { owner: { decision: 'keep' } },
    status: 'PARTIAL',
    startedAt: 1_000,
    timeout: 15_000,
    metadata: { firstCard: { id: 'secret-card', type: 'exploding_kitten' } },
    onCompleteEffects: [{ type: 'ApplyDigDeeperResponse' }],
  };

  assert.deepEqual(sanitizeActiveInteractionForPublic(interaction), {
    id: 'interaction-1',
    type: 'dig_deeper',
    owner: 'owner',
    status: 'PARTIAL',
    startedAt: 1_000,
    timeout: 15_000,
    respondedCount: 1,
    participantCount: 1,
  });
});
