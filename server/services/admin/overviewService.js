const User = require('../../models/User');
const ShopItem = require('../../models/ShopItem');
const Quest = require('../../models/Quest');
const GameHistory = require('../../models/GameHistory');
const Tournament = require('../../models/Tournament');

function normalizeRangeDays(value) {
  return Number(value) === 7 ? 7 : 30;
}

function utcDay(value) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dateKey(value) {
  return value.toISOString().slice(0, 10);
}

function buildDailySeries(rows, rangeDays, now = new Date()) {
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  const firstDay = utcDay(now);
  firstDay.setUTCDate(firstDay.getUTCDate() - rangeDays + 1);
  return Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(firstDay);
    date.setUTCDate(date.getUTCDate() + index);
    const key = dateKey(date);
    return { date: key, count: counts.get(key) || 0 };
  });
}

function calculatePeriodChange(current, previous) {
  return {
    current,
    previous,
    changePercent: previous === 0 ? null : Math.round(((current - previous) / previous) * 100),
  };
}

async function getAdminOverview({
  UserModel = User,
  ShopItemModel = ShopItem,
  QuestModel = Quest,
  GameHistoryModel = GameHistory,
  TournamentModel = Tournament,
  rangeDays: requestedRange = 30,
  now = new Date(),
} = {}) {
  const rangeDays = normalizeRangeDays(requestedRange);
  const currentStart = utcDay(now);
  currentStart.setUTCDate(currentStart.getUTCDate() - rangeDays + 1);
  const currentEnd = utcDay(now);
  currentEnd.setUTCDate(currentEnd.getUTCDate() + 1);
  const previousStart = new Date(currentStart);
  previousStart.setUTCDate(previousStart.getUTCDate() - rangeDays);
  const soon = new Date(now);
  soon.setUTCDate(soon.getUTCDate() + 7);

  const [
    totalUsers, activeUsers, bannedUsers, restrictedUsers, newUsersCurrent, newUsersPrevious,
    totalShopItems, activeShopItems, inactiveShopItems,
    totalMissions, activeMissions, inactiveMissions,
    gamesCurrent, gamesPrevious, gameRows,
    registrationTournaments, activeTournaments, completedTournaments, cancelledTournaments,
    tournamentsStartingSoon, pendingPayouts,
  ] = await Promise.all([
    UserModel.countDocuments({ deletedAt: null }),
    UserModel.countDocuments({ deletedAt: null, isOnline: true }),
    UserModel.countDocuments({ deletedAt: null, isBanned: true }),
    UserModel.countDocuments({ deletedAt: null, $or: [{ isBanned: true }, { suspendedUntil: { $gt: now } }] }),
    UserModel.countDocuments({ deletedAt: null, createdAt: { $gte: currentStart, $lt: currentEnd } }),
    UserModel.countDocuments({ deletedAt: null, createdAt: { $gte: previousStart, $lt: currentStart } }),
    ShopItemModel.countDocuments(),
    ShopItemModel.countDocuments({ isActive: { $ne: false } }),
    ShopItemModel.countDocuments({ isActive: false }),
    QuestModel.countDocuments(),
    QuestModel.countDocuments({ isActive: true }),
    QuestModel.countDocuments({ isActive: false }),
    GameHistoryModel.countDocuments({ status: 'completed', playedAt: { $gte: currentStart, $lt: currentEnd } }),
    GameHistoryModel.countDocuments({ status: 'completed', playedAt: { $gte: previousStart, $lt: currentStart } }),
    GameHistoryModel.aggregate([
      { $match: { status: 'completed', playedAt: { $gte: currentStart, $lt: currentEnd } } },
      { $group: { _id: { $dateToString: { date: '$playedAt', format: '%Y-%m-%d', timezone: 'UTC' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    TournamentModel.countDocuments({ status: 'registration' }),
    TournamentModel.countDocuments({ status: 'active' }),
    TournamentModel.countDocuments({ status: 'completed' }),
    TournamentModel.countDocuments({ status: 'cancelled' }),
    TournamentModel.countDocuments({ status: 'registration', startTime: { $gte: now, $lte: soon } }),
    TournamentModel.countDocuments({ status: 'completed', payoutState: { $ne: 'completed' } }),
  ]);

  return {
    generatedAt: now.toISOString(),
    rangeDays,
    totalUsers,
    activeUsers,
    bannedUsers,
    totalShopItems,
    activeShopItems,
    totalMissions,
    activeMissions,
    onlineRate: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0,
    newUsers: calculatePeriodChange(newUsersCurrent, newUsersPrevious),
    gamesPlayed: calculatePeriodChange(gamesCurrent, gamesPrevious),
    gamesByDay: buildDailySeries(gameRows, rangeDays, now),
    resources: {
      shop: { total: totalShopItems, active: activeShopItems, inactive: inactiveShopItems },
      quests: { total: totalMissions, active: activeMissions, inactive: inactiveMissions },
      tournaments: {
        registration: registrationTournaments,
        active: activeTournaments,
        completed: completedTournaments,
        cancelled: cancelledTournaments,
      },
    },
    attention: {
      restrictedUsers,
      inactiveShopItems,
      inactiveMissions,
      tournamentsStartingSoon,
      pendingPayouts,
    },
  };
}

module.exports = {
  buildDailySeries,
  calculatePeriodChange,
  getAdminOverview,
  normalizeRangeDays,
};
