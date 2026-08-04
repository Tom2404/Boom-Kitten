const test = require('node:test');
const assert = require('node:assert/strict');

const { getTopLeaderboard, toLeaderboardRows } = require('../services/leaderboardService');

test('leaderboard rows expose only public ranking fields and calculate win rate', () => {
  const rows = toLeaderboardRows([
    { _id: 'user-1', username: 'Top Cat', avatar: 'crown_kitten', matchmakingRating: 1342, stats: { wins: 8, losses: 2, totalGames: 10 } },
  ]);
  assert.deepEqual(rows, [{ rank: 1, userId: 'user-1', username: 'Top Cat', avatar: 'crown_kitten', rating: 1342, wins: 8, losses: 2, totalGames: 10, winRate: 80 }]);
});

test('leaderboard queries active players with games and limits the result to twenty', async () => {
  const observed = {};
  const now = new Date('2030-01-01T00:00:00.000Z');
  const UserModel = {
    find(filter) {
      observed.filter = filter;
      return {
        select(value) { observed.select = value; return this; },
        sort(value) { observed.sort = value; return this; },
        limit(value) { observed.limit = value; return this; },
        async lean() { return []; },
      };
    },
  };
  assert.deepEqual(await getTopLeaderboard({ UserModel, now }), []);
  assert.deepEqual(observed.filter, {
    role: 'user', deletedAt: null, isBanned: false, 'stats.totalGames': { $gt: 0 },
    $or: [{ suspendedUntil: { $exists: false } }, { suspendedUntil: null }, { suspendedUntil: { $lte: now } }],
  });
  assert.deepEqual(observed.sort, { matchmakingRating: -1, 'stats.wins': -1, _id: 1 });
  assert.equal(observed.limit, 20);
});
