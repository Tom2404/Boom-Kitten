import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  CARD_PLAY_STATES,
  deferNopeUntilPending,
  deferResultUntilPending,
  getCardFanLayout,
  getCardResolutionMotion,
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
  assert.equal(getDiscardMaskCount({
    cardCount: 5,
    nopeStack: [{}],
    deferredNopes: [],
  }), 6);
});

test('lays out two, three, and five combo cards as centered symmetrical fans', () => {
  for (const count of [2, 3, 5]) {
    const fan = getCardFanLayout(count);
    assert.equal(fan.length, count);
    assert.equal(fan[0].x, -fan.at(-1).x);
    assert.equal(fan[0].rotation, -fan.at(-1).rotation);
    assert.equal(fan[0].y, fan.at(-1).y);
    if (count % 2 === 1) assert.equal(fan[Math.floor(count / 2)].y, 0);
  }

  assert.ok(getCardFanLayout(5).at(-1).x > getCardFanLayout(3).at(-1).x);
});

test('resolved cards get a readable activation beat before flying to discard', () => {
  const resolved = getCardResolutionMotion({
    cardType: 'attack',
    isResolved: true,
    nopeCount: 0,
    reducedMotion: false,
  });
  const cancelled = getCardResolutionMotion({
    cardType: 'attack',
    isResolved: false,
    nopeCount: 1,
    reducedMotion: false,
  });

  assert.equal(resolved.label, 'ĐÃ KÍCH HOẠT!');
  assert.equal(cancelled.label, 'ĐÃ BỊ VÔ HIỆU HÓA!');
  assert.ok(resolved.scale > 1);
  assert.ok(resolved.holdSeconds > 0.25);
});

test('reduced motion keeps the resolution badge readable without spatial movement', () => {
  const reduced = getCardResolutionMotion({
    cardType: 'skip',
    isResolved: true,
    nopeCount: 0,
    reducedMotion: true,
  });

  assert.equal(reduced.scale, 1);
  assert.equal(reduced.rotation, 0);
  assert.ok(reduced.holdSeconds >= 0.6);
});

test('presentation events preserve the exact source card id for duplicate card types', () => {
  const gameSource = fs.readFileSync(new URL('../src/pages/Game.jsx', import.meta.url), 'utf8');
  const handSource = fs.readFileSync(new URL('../src/components/PlayerHand.jsx', import.meta.url), 'utf8');

  assert.match(gameSource, /getElementById\(`hand-card-\$\{sourceCardId\}`\)/);
  assert.match(gameSource, /getPresentationSourceId\(playerId, sourceCardType \|\| cardType, sourceCardId\)/);
  assert.match(handSource, /\{ asCardType, cardId: godcatPending\.id \}/);
});

test('combo presentation preserves every played card image instead of one display type', () => {
  const gameSource = fs.readFileSync(new URL('../src/pages/Game.jsx', import.meta.url), 'utf8');
  const controllerSource = fs.readFileSync(
    new URL('../src/vfx/CardPlayPresentationController.js', import.meta.url),
    'utf8',
  );

  assert.match(gameSource, /displayCards: comboCards/);
  assert.match(controllerSource, /cardsToDisplay\.map/);
  assert.match(controllerSource, /getCardFanLayout\(baseCards\.length\)/);
  assert.match(controllerSource, /nopeCard\.style\.zIndex = String\(10100 \+ nopeIndex\)/);
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
  assert.match(nopeCountdown, /'reverse'/);
  assert.match(nopeCountdown, /expiresAt \|\| Date\.now\(\) \+ timeoutMs/);
});

test('card flights animate compositor-friendly transforms instead of layout properties', () => {
  const source = fs.readFileSync(
    new URL('../src/vfx/CardPlayPresentationController.js', import.meta.url),
    'utf8',
  );
  const gsapLayoutTween = /^\s+(?:left|top|width|height):\s*(?:\(index\)|target|mainRect|arc|discard)/m;

  assert.doesNotMatch(source, gsapLayoutTween);
  assert.match(source, /\bx:/);
  assert.match(source, /\by:/);
  assert.match(source, /\bscale:/);
});
