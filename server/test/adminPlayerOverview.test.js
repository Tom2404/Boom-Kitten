const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPlayerTimeline, normalizePlayerGame } = require('../services/admin/playerOverviewService');

test('normalizes a player match without exposing other players private data', () => {
  const game = {
    _id: 'game-1', roomId: 'ABC123', status: 'completed', playedAt: new Date('2027-01-02T10:00:00Z'), duration: 90,
    players: [
      { userId: { toString: () => 'user-1' }, result: 'win', rank: 1, eloBefore: 1000, eloAfter: 1020, eloChange: 20 },
      { userId: { toString: () => 'user-2' }, result: 'lose', rank: 2, eloBefore: 1000, eloAfter: 980, eloChange: -20 },
    ],
  };
  const normalized = normalizePlayerGame(game, 'user-1');
  assert.equal(normalized.result, 'win');
  assert.equal(normalized.eloChange, 20);
  assert.equal(normalized.playerCount, 2);
  assert.equal(normalized.players, undefined);
});

test('merges login, matches, economy, and admin actions into a newest-first timeline', () => {
  const timeline = buildPlayerTimeline({
    user: { lastLoginDate: new Date('2027-01-04T10:00:00Z') },
    games: [{ _id: 'g1', roomId: 'ABC123', playedAt: new Date('2027-01-03T10:00:00Z'), result: 'win' }],
    transactions: [{ _id: 't1', createdAt: new Date('2027-01-02T10:00:00Z'), type: 'earn', currency: 'coin', amount: 20 }],
    audits: [{ _id: 'a1', createdAt: new Date('2027-01-01T10:00:00Z'), action: 'PLAYER_STATUS_CHANGED', reason: 'Case review', actorUsername: 'mod' }],
  });
  assert.deepEqual(timeline.map((item) => item.kind), ['login', 'game', 'economy', 'admin']);
  assert.equal(timeline[3].actor, 'mod');
});
