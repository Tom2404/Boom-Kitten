import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateRelativeOpponents,
  getOpponentSeatClass,
} from '../src/utils/seatAllocation.js';

test('opponents keep room order relative to the local player', () => {
  const players = ['a', 'b', 'me', 'c', 'd'].map((userId) => ({ userId }));

  assert.deepEqual(
    calculateRelativeOpponents(players, 'me').map(({ userId }) => userId),
    ['c', 'd', 'a', 'b'],
  );
});

test('horseshoe presets stay balanced for one through five opponents', () => {
  const expected = {
    1: ['top-center'],
    2: ['top-left', 'top-right'],
    3: ['left-middle', 'top-center', 'right-middle'],
    4: ['left-middle', 'top-left', 'top-right', 'right-middle'],
    5: ['left-lower', 'left-upper', 'top-center', 'right-upper', 'right-lower'],
  };

  Object.entries(expected).forEach(([count, seats]) => {
    assert.deepEqual(
      seats.map((_, index) => getOpponentSeatClass(index, Number(count))),
      seats,
    );
  });
});

test('missing local player still removes nobody and keeps input order', () => {
  const players = ['a', 'b'].map((userId) => ({ userId }));

  assert.deepEqual(
    calculateRelativeOpponents(players, 'missing').map(({ userId }) => userId),
    ['a', 'b'],
  );
});
