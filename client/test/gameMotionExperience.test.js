import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GAME_RESULT_DURATION_MS,
  createGameResultState,
  createBoundedEventGate,
  createTimeoutGroup,
  findCorrelatedDrawCard,
  getDrawRevealMotion,
  getDefusePositionProgress,
  getEndgameSequence,
  getGameMotionTransition,
  getGameResultRemainingSeconds,
} from '../src/pages/Game/gameMotion.js';

test('event gate keeps a bounded ledger and rejects duplicate ids', () => {
  const gate = createBoundedEventGate(3);

  assert.equal(gate.accept('one'), true);
  assert.equal(gate.accept('one'), false);
  assert.equal(gate.accept('two'), true);
  assert.equal(gate.accept('three'), true);
  assert.equal(gate.accept('four'), true);
  assert.equal(gate.accept('one'), true);
  assert.equal(gate.size, 3);
});

test('draw reveal requires matching public and private draw event ids', () => {
  const before = [{ id: 'old', type: 'skip' }];
  const after = [...before, { id: 'new', type: 'reverse', skinIndex: 2 }];

  assert.equal(findCorrelatedDrawCard(before, after, undefined, 'draw-1'), null);
  assert.equal(findCorrelatedDrawCard(before, after, 'favor-1', 'draw-1'), null);
  assert.deepEqual(findCorrelatedDrawCard(before, after, 'draw-1', 'draw-1'), after[1]);
});

test('draw reveal keeps a readable hold before exiting toward the hand', () => {
  const motion = getDrawRevealMotion(false);

  assert.equal(motion.holdMs, 1200);
  assert.ok(motion.card.initial.y < 0);
  assert.ok(motion.card.exit.y > 0);
  assert.ok(motion.card.animate.scale > motion.card.initial.scale);
});

test('reduced motion removes spatial travel but keeps the reveal readable', () => {
  const motion = getDrawRevealMotion(true);

  assert.ok(motion.holdMs >= 1000);
  assert.equal(motion.card.initial.y, 0);
  assert.equal(motion.card.exit.y, 0);
  assert.deepEqual(getGameMotionTransition(true), { duration: 0.01 });
});

test('victory and defeat use distinct staged endgame sequences', () => {
  const victory = getEndgameSequence(true, false);
  const defeat = getEndgameSequence(false, false);

  assert.equal(victory.tone, 'victory');
  assert.equal(defeat.tone, 'defeat');
  assert.ok(victory.title.scale > defeat.title.scale);
  assert.ok(victory.contentDelay < defeat.contentDelay);
});

test('game results use a wall-clock ten second deadline that clamps at zero', () => {
  assert.equal(GAME_RESULT_DURATION_MS, 10_000);
  assert.equal(getGameResultRemainingSeconds(11_000, 1_000), 10);
  assert.equal(getGameResultRemainingSeconds(10_001, 1_000), 10);
  assert.equal(getGameResultRemainingSeconds(10_000, 1_000), 9);
  assert.equal(getGameResultRemainingSeconds(1_000, 1_000), 0);
  assert.equal(getGameResultRemainingSeconds(999, 1_000), 0);
  assert.equal(getGameResultRemainingSeconds(null, 1_000), 0);
});

test('game result state keeps the final snapshot while the room resets underneath it', () => {
  const snapshot = { players: [{ userId: 'winner' }], discardPile: [{ type: 'defuse' }] };
  const result = createGameResultState({
    winnerId: 'winner',
    rankings: undefined,
    wager: null,
    snapshot,
    now: 5_000,
  });

  assert.deepEqual(result, {
    winnerId: 'winner',
    rankings: [],
    wager: null,
    snapshot,
    dismissAt: 15_000,
    dismissed: false,
  });
});

test('Defuse deck marker clamps the selected reinsertion position', () => {
  assert.equal(getDefusePositionProgress(0, 10), 0);
  assert.equal(getDefusePositionProgress(5, 10), 0.5);
  assert.equal(getDefusePositionProgress(20, 10), 1);
  assert.equal(getDefusePositionProgress(3, 0), 0);
});

test('timeout groups clear every pending presentation timer on teardown', () => {
  const cleared = [];
  let nextId = 0;
  const timers = createTimeoutGroup(
    () => ++nextId,
    (id) => cleared.push(id),
  );

  timers.schedule(() => {}, 100);
  timers.schedule(() => {}, 200);
  timers.clearAll();

  assert.deepEqual(cleared, [1, 2]);
  assert.equal(timers.size, 0);
});
