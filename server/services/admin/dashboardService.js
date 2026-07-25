const User = require('../../models/User');
const GameHistory = require('../../models/GameHistory');
const Transaction = require('../../models/Transaction');
const { getOperationalRooms } = require('../../game/roomManager');

const RANGE_DAYS = { '7d': 7, '30d': 30 };

function startOfUtcDay(value) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(value, days) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function resolveDashboardWindow(range = '7d', now = new Date()) {
  const normalizedRange = RANGE_DAYS[range] ? range : '7d';
  const days = RANGE_DAYS[normalizedRange];
  const today = startOfUtcDay(now);
  const start = addUtcDays(today, -(days - 1));
  const end = addUtcDays(today, 1);
  return {
    range: normalizedRange,
    days,
    start,
    end,
    previousStart: addUtcDays(start, -days),
    previousEnd: start,
  };
}

function calculatePercentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function buildDailyTrend(records, window, dateField) {
  const counts = new Map();
  for (const record of records) {
    const value = new Date(record[dateField]);
    if (value >= window.start && value < window.end) {
      const key = value.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return Array.from({ length: window.days }, (_, index) => {
    const date = addUtcDays(window.start, index).toISOString().slice(0, 10);
    return { date, value: counts.get(date) || 0 };
  });
}

function summarizeEconomy(transactions) {
  const result = { coin: { generated: 0, consumed: 0 }, gem: { generated: 0, consumed: 0 } };
  for (const transaction of transactions) {
    if (!result[transaction.currency]) continue;
    const amount = Math.abs(Number(transaction.amount) || 0);
    if (['earn', 'season_reward'].includes(transaction.type)) result[transaction.currency].generated += amount;
    if (['spend', 'purchase'].includes(transaction.type)) result[transaction.currency].consumed += amount;
    if (transaction.type === 'admin_adjust') {
      const delta = Number(transaction.balanceAfter) - Number(transaction.balanceBefore);
      if (Number.isFinite(delta) && delta > 0) result[transaction.currency].generated += delta;
      if (Number.isFinite(delta) && delta < 0) result[transaction.currency].consumed += Math.abs(delta);
    }
  }
  return result;
}

function calculateCompletionRate(records, window) {
  const instrumented = records.filter((record) => record.startedAt && new Date(record.startedAt) >= window.start && new Date(record.startedAt) < window.end);
  const completed = instrumented.filter((record) => record.status === 'completed').length;
  return {
    value: instrumented.length ? Math.round((completed / instrumented.length) * 1000) / 10 : null,
    completed,
    started: instrumented.length,
  };
}

function within(records, start, end, dateField) {
  return records.filter((record) => {
    const date = new Date(record[dateField]);
    return date >= start && date < end;
  });
}

function metric(value, previous) {
  return { value, previous, changePercent: calculatePercentChange(value, previous) };
}

async function getOperationalDashboard({
  UserModel = User,
  GameHistoryModel = GameHistory,
  TransactionModel = Transaction,
  roomsProvider = getOperationalRooms,
  range = '7d',
  now = new Date(),
} = {}) {
  const window = resolveDashboardWindow(range, now);
  const today = startOfUtcDay(now);
  const tomorrow = addUtcDays(today, 1);
  const weekStart = addUtcDays(today, -6);
  const previousDayStart = addUtcDays(today, -1);
  const previousWeekStart = addUtcDays(weekStart, -7);

  const [dau, previousDau, wau, previousWau, online, loginRecords, gameRecords, transactions] = await Promise.all([
    UserModel.countDocuments({ lastLoginDate: { $gte: today, $lt: tomorrow } }),
    UserModel.countDocuments({ lastLoginDate: { $gte: previousDayStart, $lt: today } }),
    UserModel.countDocuments({ lastLoginDate: { $gte: weekStart, $lt: tomorrow } }),
    UserModel.countDocuments({ lastLoginDate: { $gte: previousWeekStart, $lt: weekStart } }),
    UserModel.countDocuments({ isOnline: true }),
    UserModel.find({ lastLoginDate: { $gte: window.previousStart, $lt: window.end } }).select('lastLoginDate').lean(),
    GameHistoryModel.find({ playedAt: { $gte: window.previousStart, $lt: window.end } }).select('playedAt duration status startedAt').lean(),
    TransactionModel.find({ createdAt: { $gte: window.previousStart, $lt: window.end }, currency: { $in: ['coin', 'gem'] } }).select('createdAt type currency amount balanceBefore balanceAfter').lean(),
  ]);

  const rooms = roomsProvider();
  const currentGames = within(gameRecords, window.start, window.end, 'playedAt');
  const previousGames = within(gameRecords, window.previousStart, window.previousEnd, 'playedAt');
  const currentTransactions = within(transactions, window.start, window.end, 'createdAt');
  const previousTransactions = within(transactions, window.previousStart, window.previousEnd, 'createdAt');
  const currentEconomy = summarizeEconomy(currentTransactions);
  const previousEconomy = summarizeEconomy(previousTransactions);
  const currentDurations = currentGames.map((game) => Number(game.duration)).filter((duration) => duration > 0);
  const previousDurations = previousGames.map((game) => Number(game.duration)).filter((duration) => duration > 0);
  const durationCoverage = currentGames.length ? currentDurations.length / currentGames.length : 1;
  const completion = calculateCompletionRate(gameRecords, window);
  const previousCompletion = calculateCompletionRate(gameRecords, { start: window.previousStart, end: window.previousEnd });
  const warnings = [];
  if (!currentGames.length) warnings.push('Không có GameHistory trong khoảng đã chọn.');
  if (durationCoverage < 0.8) warnings.push(`Chỉ ${Math.round(durationCoverage * 100)}% trận có thời lượng hợp lệ.`);
  if (!completion.started) warnings.push('Chưa có trận nào sử dụng lifecycle instrumentation trong khoảng đã chọn.');

  return {
    generatedAt: now,
    range: {
      key: window.range,
      start: window.start,
      end: window.end,
      previousStart: window.previousStart,
      previousEnd: window.previousEnd,
    },
    kpis: {
      dau: metric(dau, previousDau),
      wau: metric(wau, previousWau),
      online: { value: online },
      rooms: {
        waiting: rooms.filter((room) => room.status === 'waiting').length,
        playing: rooms.filter((room) => room.status === 'playing').length,
      },
      gamesCompleted: metric(currentGames.length, previousGames.length),
      completionRate: { ...completion, previous: previousCompletion.value, changePercent: calculatePercentChange(completion.value, previousCompletion.value) },
      medianDurationSeconds: metric(median(currentDurations), median(previousDurations)),
      economy: {
        coin: {
          generated: metric(currentEconomy.coin.generated, previousEconomy.coin.generated),
          consumed: metric(currentEconomy.coin.consumed, previousEconomy.coin.consumed),
        },
        gem: {
          generated: metric(currentEconomy.gem.generated, previousEconomy.gem.generated),
          consumed: metric(currentEconomy.gem.consumed, previousEconomy.gem.consumed),
        },
      },
    },
    trends: {
      gamesCompleted: buildDailyTrend(gameRecords, window, 'playedAt'),
      logins: buildDailyTrend(loginRecords, window, 'lastLoginDate'),
    },
    dataQuality: { status: warnings.length ? 'partial' : 'complete', durationCoverage, warnings },
  };
}

module.exports = {
  buildDailyTrend,
  calculateCompletionRate,
  calculatePercentChange,
  getOperationalDashboard,
  median,
  resolveDashboardWindow,
  summarizeEconomy,
};
