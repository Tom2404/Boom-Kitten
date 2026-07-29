const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDailySeries,
  calculatePeriodChange,
  getAdminOverview,
  normalizeRangeDays,
} = require('../services/admin/overviewService');

test('normalizes the overview range to the supported 7 or 30 day windows', () => {
  assert.equal(normalizeRangeDays('7'), 7);
  assert.equal(normalizeRangeDays(7), 7);
  assert.equal(normalizeRangeDays('30'), 30);
  assert.equal(normalizeRangeDays('90'), 30);
  assert.equal(normalizeRangeDays(undefined), 30);
});

test('zero-fills the UTC daily game series in chronological order', () => {
  const series = buildDailySeries(
    [
      { _id: '2026-07-27', count: 4 },
      { _id: '2026-07-29', count: 2 },
    ],
    3,
    new Date('2026-07-29T12:00:00.000Z'),
  );

  assert.deepEqual(series, [
    { date: '2026-07-27', count: 4 },
    { date: '2026-07-28', count: 0 },
    { date: '2026-07-29', count: 2 },
  ]);
});

test('reports a period comparison without inventing a percentage from zero', () => {
  assert.deepEqual(calculatePeriodChange(15, 10), { current: 15, previous: 10, changePercent: 50 });
  assert.deepEqual(calculatePeriodChange(3, 0), { current: 3, previous: 0, changePercent: null });
});

test('builds the overview contract from existing model data', async () => {
  const now = new Date('2026-07-29T12:00:00.000Z');
  const counts = {
    users: [120, 18, 5, 7, 12, 8],
    shop: [20, 16, 4],
    quests: [10, 7, 3],
    games: [42, 30],
    tournaments: [2, 1, 8, 1, 2, 1],
  };
  const take = (key) => async () => counts[key].shift();
  const UserModel = { countDocuments: take('users') };
  const ShopItemModel = { countDocuments: take('shop') };
  const QuestModel = { countDocuments: take('quests') };
  const GameHistoryModel = {
    countDocuments: take('games'),
    aggregate: async () => [{ _id: '2026-07-29', count: 2 }],
  };
  const TournamentModel = { countDocuments: take('tournaments') };

  const result = await getAdminOverview({
    UserModel,
    ShopItemModel,
    QuestModel,
    GameHistoryModel,
    TournamentModel,
    rangeDays: 7,
    now,
  });

  assert.equal(result.generatedAt, now.toISOString());
  assert.equal(result.totalUsers, 120);
  assert.equal(result.bannedUsers, 5);
  assert.equal(result.onlineRate, 15);
  assert.deepEqual(result.newUsers, { current: 12, previous: 8, changePercent: 50 });
  assert.deepEqual(result.gamesPlayed, { current: 42, previous: 30, changePercent: 40 });
  assert.deepEqual(result.resources.shop, { total: 20, active: 16, inactive: 4 });
  assert.deepEqual(result.resources.quests, { total: 10, active: 7, inactive: 3 });
  assert.deepEqual(result.resources.tournaments, {
    registration: 2,
    active: 1,
    completed: 8,
    cancelled: 1,
  });
  assert.deepEqual(result.attention, {
    restrictedUsers: 7,
    inactiveShopItems: 4,
    inactiveMissions: 3,
    tournamentsStartingSoon: 2,
    pendingPayouts: 1,
  });
  assert.equal(result.gamesByDay.length, 7);
  assert.deepEqual(result.gamesByDay.at(-1), { date: '2026-07-29', count: 2 });
});
