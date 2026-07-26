const mongoose = require('mongoose');
const User = require('../../models/User');
const GameHistory = require('../../models/GameHistory');
const Transaction = require('../../models/Transaction');
const AuditLog = require('../../models/AuditLog');
const { ApiError } = require('../../utils/apiResponse');

function normalizePlayerGame(game, playerId) {
  const plain = game?.toObject ? game.toObject() : game;
  const player = plain.players?.find((entry) => String(entry.userId) === String(playerId));
  return {
    id: String(plain._id),
    roomId: plain.roomId,
    gameMode: plain.gameMode,
    edition: plain.edition,
    status: plain.status || 'completed',
    playedAt: plain.playedAt,
    duration: plain.duration,
    playerCount: plain.participantIds?.length || plain.players?.length || 0,
    result: player?.result,
  };
}

function buildPlayerTimeline({ user, games, transactions, audits }) {
  const events = [];
  if (user.lastLoginDate) events.push({ id: 'last-login', kind: 'login', at: user.lastLoginDate, title: 'Đăng nhập gần nhất' });
  for (const game of games) events.push({ id: `game-${game.id || game._id}`, kind: 'game', at: game.playedAt, title: game.result === 'win' ? 'Thắng trận' : game.result === 'lose' ? 'Thua trận' : 'Trận đấu', detail: game.roomId, result: game.result });
  for (const transaction of transactions) events.push({ id: `transaction-${transaction._id}`, kind: 'economy', at: transaction.createdAt, title: `${transaction.type} ${transaction.currency}`, amount: transaction.amount, currency: transaction.currency, detail: transaction.description });
  for (const audit of audits) events.push({ id: `audit-${audit._id}`, kind: 'admin', at: audit.createdAt, title: audit.action, detail: audit.reason, actor: audit.actorUsername || audit.adminId?.username });
  return events.filter((event) => event.at).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 60);
}

async function getPlayerOverview({
  UserModel = User,
  GameHistoryModel = GameHistory,
  TransactionModel = Transaction,
  AuditLogModel = AuditLog,
  playerId,
} = {}) {
  if (!mongoose.Types.ObjectId.isValid(playerId)) throw new ApiError(422, 'VALIDATION_ERROR', 'Player ID không hợp lệ.');
  const user = await UserModel.findById(playerId).select('-passwordHash -gems -rank -eloPoints -matchmakingRating -highestEloReached -seasonHighestElo -allTimeHighestElo -rankProtectionGames -rankProtectedFloor').lean();
  if (!user) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');
  const [gameDocuments, transactions, audits] = await Promise.all([
    GameHistoryModel.find({ 'players.userId': playerId }).sort({ playedAt: -1 }).limit(20).lean(),
    TransactionModel.find({ userId: playerId }).sort({ createdAt: -1, _id: -1 }).limit(20).lean(),
    AuditLogModel.find({ targetId: String(playerId) }).sort({ createdAt: -1, _id: -1 }).limit(20).populate('adminId', 'username').lean(),
  ]);
  const games = gameDocuments.map((game) => normalizePlayerGame(game, playerId));
  return {
    user,
    recentGames: games,
    transactions,
    audits,
    timeline: buildPlayerTimeline({ user, games, transactions, audits }),
  };
}

module.exports = { buildPlayerTimeline, getPlayerOverview, normalizePlayerGame };
