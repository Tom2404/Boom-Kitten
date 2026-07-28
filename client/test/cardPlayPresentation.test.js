import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  CARD_PLAY_STATES,
  deferNopeUntilPending,
  deferResultUntilPending,
  getDiscardMaskCount,
} from '../src/vfx/cardPlayPresentationState.js';

test('defers an authoritative result that arrives while the card is flying to center', () => {
  const action = {
    state: CARD_PLAY_STATES.FLYING_UP,
    deferredNopes: [],
    pendingResult: null,
  };

  const deferred = deferResultUntilPending(action, 'RESOLVED');

  assert.equal(deferred, true);
  assert.equal(action.pendingResult, 'RESOLVED');
});

test('queues Nope cards that arrive before the original card reaches center', () => {
  const nope = { playerId: 'player-2', cardType: 'nope' };
  const action = {
    state: CARD_PLAY_STATES.FLYING_UP,
    deferredNopes: [],
    pendingResult: null,
  };

  const deferred = deferNopeUntilPending(action, nope);

  assert.equal(deferred, true);
  assert.deepEqual(action.deferredNopes, [nope]);
});

test('masks the original card and every queued or displayed Nope on the discard pile', () => {
  assert.equal(getDiscardMaskCount({
    nopeStack: [{}, {}],
    deferredNopes: [{}],
  }), 4);
});

test('presentation events preserve the exact source card id for duplicate card types', () => {
  const gameSource = fs.readFileSync(new URL('../src/pages/Game.jsx', import.meta.url), 'utf8');
  const handSource = fs.readFileSync(new URL('../src/components/PlayerHand.jsx', import.meta.url), 'utf8');

  assert.match(gameSource, /getElementById\(`hand-card-\$\{sourceCardId\}`\)/);
  assert.match(gameSource, /getPresentationSourceId\(playerId, sourceCardType \|\| cardType, sourceCardId\)/);
  assert.match(handSource, /\{ asCardType, cardId: godcatPending\.id \}/);
});

test('card presentation copy stays compact enough to avoid covering the hand', () => {
  const source = fs.readFileSync(
    new URL('../src/vfx/CardPlayPresentationController.js', import.meta.url),
    'utf8',
  );

  assert.match(source, /font-size: clamp\(15px, 3vw, 22px\)/);
  assert.match(source, /font-size: clamp\(11px, 2vw, 14px\)/);
  assert.match(source, /font-size: clamp\(16px, 3vw, 24px\)/);
});

test('Nope response panel is a compact non-blocking panel anchored to the right', () => {
  const source = fs.readFileSync(
    new URL('../src/components/ActionModals.jsx', import.meta.url),
    'utf8',
  );
  const nopeCountdown = source.slice(
    source.indexOf('export function NopeCountdown'),
    source.indexOf('// ==========================================', source.indexOf('export function NopeCountdown')),
  );

  assert.match(nopeCountdown, /fixed top-24 right-4/);
  assert.match(nopeCountdown, /pointer-events-none/);
  assert.match(nopeCountdown, /max-w-\[360px\]/);
  assert.doesNotMatch(nopeCountdown, /fixed inset-0/);
  assert.doesNotMatch(nopeCountdown, /backdrop-blur/);
});
