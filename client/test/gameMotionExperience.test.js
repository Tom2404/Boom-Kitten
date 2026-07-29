import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTimeoutGroup,
  getDrawRevealMotion,
  getDefusePositionProgress,
  getEndgameSequence,
  getGameMotionTransition,
} from '../src/pages/Game/gameMotion.js';

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
