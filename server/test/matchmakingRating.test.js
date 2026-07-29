const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyMatchmakingRating,
  shouldUpdateMatchmakingRating,
} = require('../utils/matchmakingRating');
const User = require('../models/User');

test('updates hidden rating only for completed authenticated matchmaking games', () => {
  const room = { gameMode: 'matchmaking', status: 'finished' };
  const players = [{ userId: 'u1' }, { userId: 'u2' }];

  assert.equal(shouldUpdateMatchmakingRating({ room, players }), true);
});

test('does not update hidden rating for private, custom, incomplete, guest, or bot games', () => {
  const players = [{ userId: 'u1' }, { userId: 'u2' }];

  assert.equal(shouldUpdateMatchmakingRating({
    room: { gameMode: 'custom', status: 'finished' },
    players,
  }), false);
  assert.equal(shouldUpdateMatchmakingRating({
    room: { gameMode: 'matchmaking', status: 'playing' },
    players,
  }), false);
  assert.equal(shouldUpdateMatchmakingRating({
    room: { gameMode: 'matchmaking', status: 'finished' },
    players: [{ userId: 'u1' }, { userId: 'guest-abc' }],
  }), false);
  assert.equal(shouldUpdateMatchmakingRating({
    room: { gameMode: 'matchmaking', status: 'finished' },
    players: [{ userId: 'u1' }, { userId: 'bot-1', isBot: true }],
  }), false);
});

test('applies a hidden rating result without changing legacy rank, Elo, or gems', () => {
  const player = {
    matchmakingRating: 1000,
    eloPoints: 1800,
    rank: 'Platinum IV',
    gems: 25,
  };

  applyMatchmakingRating(player, 1032);

  assert.deepEqual(player, {
    matchmakingRating: 1032,
    eloPoints: 1800,
    rank: 'Platinum IV',
    gems: 25,
  });
});

test('stores matchmaking rating as a private server-side user field', () => {
  assert.ok(User.schema.path('matchmakingRating'));
  assert.equal(User.schema.path('matchmakingRating').options.default, 1000);
});
