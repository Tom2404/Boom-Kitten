const User = require('../../models/User');
const GameHistory = require('../../models/GameHistory');
const Transaction = require('../../models/Transaction');
const UserQuestProgress = require('../../models/UserQuestProgress');
const ShopItem = require('../../models/ShopItem');
const Quest = require('../../models/Quest');
const { ApiError } = require('../../utils/apiResponse');
const { normalizeLegacyRank } = require('../../utils/rankNormalization');

const DAY_MS = 86400000;

function utcDay(value) { return new Date(value).toISOString().slice(0, 10); }
function startOfUtcDay(value) { const date = new Date(value); return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }

function resolveAnalyticsRange({ from, to, days = 30 } = {}, now = new Date()) {
  const end = to ? new Date(to) : now;
  const start = from ? new Date(from) : new Date(end.getTime() - (Math.min(90, Math.max(1, Number(days) || 30)) - 1) * DAY_MS);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) throw new ApiError(422, 'VALIDATION_ERROR', 'Khoảng thời gian analytics không hợp lệ.');
  if (end - start > 90 * DAY_MS) throw new ApiError(422, 'VALIDATION_ERROR', 'Khoảng analytics tối đa 90 ngày.');
  return { from: startOfUtcDay(start), to: new Date(startOfUtcDay(end).getTime() + DAY_MS), timezone: 'UTC' };
}

function buildFunnel(users, games) {
  const registeredIds = new Set(users.map((user) => String(user._id)));
  const played = new Set();
  const completed = new Set();
  for (const game of games) for (const player of game.players || []) {
    const id = String(player.userId?._id || player.userId);
    if (!registeredIds.has(id)) continue;
    played.add(id);
    if (game.status === 'completed') completed.add(id);
  }
  const stages = [
    { id: 'registered', label: 'Đăng ký', users: registeredIds.size },
    { id: 'first_match', label: 'Chơi trận đầu', users: played.size },
    { id: 'completed_match', label: 'Hoàn tất trận', users: completed.size },
  ];
  return stages.map((stage, index) => ({ ...stage, conversionFromPrevious: index === 0 ? 100 : (stages[index - 1].users ? Number((stage.users * 100 / stages[index - 1].users).toFixed(1)) : 0), conversionFromRegistration: registeredIds.size ? Number((stage.users * 100 / registeredIds.size).toFixed(1)) : 0 }));
}

function buildRetentionCohorts(users, games) {
  const activity = new Map();
  for (const game of games) for (const player of game.players || []) {
    const id = String(player.userId?._id || player.userId);
    if (!activity.has(id)) activity.set(id, new Set());
    activity.get(id).add(utcDay(game.playedAt || game.startedAt));
  }
  const cohorts = new Map();
  for (const user of users) {
    const cohort = utcDay(user.createdAt);
    if (!cohorts.has(cohort)) cohorts.set(cohort, { cohort, users: 0, d1Users: 0, d7Users: 0 });
    const row = cohorts.get(cohort); row.users += 1;
    const registeredDay = startOfUtcDay(user.createdAt).getTime();
    const days = activity.get(String(user._id)) || new Set();
    if ([...days].some((day) => (startOfUtcDay(day).getTime() - registeredDay) / DAY_MS === 1)) row.d1Users += 1;
    if ([...days].some((day) => (startOfUtcDay(day).getTime() - registeredDay) / DAY_MS === 7)) row.d7Users += 1;
  }
  return [...cohorts.values()].sort((a, b) => b.cohort.localeCompare(a.cohort)).map((row) => ({ ...row, d1Rate: row.users ? Number((row.d1Users * 100 / row.users).toFixed(1)) : 0, d7Rate: row.users ? Number((row.d7Users * 100 / row.users).toFixed(1)) : 0 }));
}

function classifyEconomy(rows) {
  const output = { coin: { source: 0, sink: 0, net: 0 }, gem: { source: 0, sink: 0, net: 0 } };
  for (const row of rows) {
    if (!output[row.currency]) continue;
    const signed = ['spend', 'purchase', 'tournament_entry'].includes(row.type) ? -Math.abs(row.amount) : Number(row.amount);
    if (signed >= 0) output[row.currency].source += signed; else output[row.currency].sink += Math.abs(signed);
    output[row.currency].net += signed;
  }
  return output;
}

function normalizeRankDistribution(rows) {
  const totals = new Map();
  for (const row of rows) {
    const rank = normalizeLegacyRank(row._id);
    totals.set(rank, (totals.get(rank) || 0) + Number(row.users || 0));
  }
  return [...totals.entries()]
    .map(([rank, users]) => ({ rank, users }))
    .sort((a, b) => b.users - a.users || a.rank.localeCompare(b.rank));
}

async function getProductAnalytics({ UserModel = User, GameHistoryModel = GameHistory, TransactionModel = Transaction, ProgressModel = UserQuestProgress, ShopItemModel = ShopItem, QuestModel = Quest, query = {}, now = new Date() } = {}) {
  const range = resolveAnalyticsRange(query, now);
  const users = await UserModel.find({ createdAt: { $gte: range.from, $lt: range.to } }).select('_id createdAt').lean();
  const userIds = users.map((user) => user._id);
  const activityTo = new Date(range.to.getTime() + 7 * DAY_MS);
  const games = userIds.length ? await GameHistoryModel.find({ 'players.userId': { $in: userIds }, playedAt: { $gte: range.from, $lt: activityTo } }).select('players.userId status playedAt startedAt').lean() : [];
  const [rankRows, transactionRows, shopRows, questRows] = await Promise.all([
    UserModel.aggregate([{ $group: { _id: '$rank', users: { $sum: 1 } } }, { $sort: { users: -1, _id: 1 } }]),
    TransactionModel.find({ createdAt: { $gte: range.from, $lt: range.to }, currency: { $in: ['coin', 'gem'] } }).select('type amount currency source description').lean(),
    TransactionModel.aggregate([{ $match: { type: 'purchase', createdAt: { $gte: range.from, $lt: range.to } } }, { $group: { _id: '$source', purchases: { $sum: 1 }, spent: { $sum: '$amount' } } }, { $sort: { purchases: -1, _id: 1 } }, { $limit: 10 }]),
    ProgressModel.aggregate([{ $match: { status: 'claimed', updatedAt: { $gte: range.from, $lt: range.to } } }, { $group: { _id: '$questId', claims: { $sum: 1 } } }, { $sort: { claims: -1, _id: 1 } }, { $limit: 10 }]),
  ]);
  const shopIds = shopRows.map((row) => String(row._id || '').replace(/^shop:/, '')).filter((id) => /^[a-f\d]{24}$/i.test(id));
  const questIds = questRows.map((row) => row._id).filter(Boolean);
  const [shopItems, quests] = await Promise.all([ShopItemModel.find({ _id: { $in: shopIds } }).select('name type').lean(), QuestModel.find({ _id: { $in: questIds } }).select('title actionType').lean()]);
  const shopById = new Map(shopItems.map((item) => [String(item._id), item]));
  const questById = new Map(quests.map((item) => [String(item._id), item]));
  return {
    range: { from: range.from, to: new Date(range.to.getTime() - 1), timezone: range.timezone },
    definitions: {
      funnel: 'Cohort tài khoản tạo trong khoảng; first match là có mặt trong một game lifecycle; completed là có mặt trong game status=completed.',
      retention: 'D1/D7 là có trận đấu vào đúng ngày UTC thứ 1/thứ 7 sau ngày đăng ký.',
      economy: 'Source tăng số dư; sink gồm spend, purchase và tournament entry; admin adjustment dùng dấu amount.',
    },
    funnel: buildFunnel(users, games.filter((game) => new Date(game.playedAt || game.startedAt) < range.to)),
    retention: buildRetentionCohorts(users, games),
    rankDistribution: normalizeRankDistribution(rankRows),
    economy: classifyEconomy(transactionRows),
    topContent: {
      shop: shopRows.map((row) => { const id = String(row._id || '').replace(/^shop:/, ''); const item = shopById.get(id); return { id: id || null, name: item?.name || String(row._id || 'Legacy purchase'), type: item?.type, purchases: row.purchases, spent: row.spent }; }),
      quests: questRows.map((row) => { const quest = questById.get(String(row._id)); return { id: String(row._id), name: quest?.title || 'Deleted quest', actionType: quest?.actionType, claims: row.claims }; }),
    },
  };
}

module.exports = { buildFunnel, buildRetentionCohorts, classifyEconomy, getProductAnalytics, normalizeRankDistribution, resolveAnalyticsRange };
