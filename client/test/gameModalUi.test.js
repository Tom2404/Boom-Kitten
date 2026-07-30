import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInteractionExpiry,
  getInteractionClock,
  moveCardByOffset,
} from '../src/utils/gameModalUi.js';

test('interaction expiry and countdown use an absolute wall-clock deadline', () => {
  const expiresAt = createInteractionExpiry(15_000, 1_000);

  assert.equal(expiresAt, 16_000);
  assert.deepEqual(getInteractionClock(expiresAt, 1_001, 15_000), {
    milliseconds: 14_999,
    seconds: 15,
    progress: 99.99333333333334,
  });
  assert.deepEqual(getInteractionClock(expiresAt, 16_001, 15_000), {
    milliseconds: 0,
    seconds: 0,
    progress: 0,
  });
});

test('arrow reordering clamps at both edges and preserves every card', () => {
  const cards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  assert.deepEqual(moveCardByOffset(cards, 0, -1).map((card) => card.id), ['a', 'b', 'c']);
  assert.deepEqual(moveCardByOffset(cards, 2, 1).map((card) => card.id), ['a', 'b', 'c']);
  assert.deepEqual(moveCardByOffset(cards, 1, -1).map((card) => card.id), ['b', 'a', 'c']);
  assert.deepEqual(moveCardByOffset(cards, 1, 1).map((card) => card.id), ['a', 'c', 'b']);
  assert.deepEqual(cards.map((card) => card.id), ['a', 'b', 'c']);
});
