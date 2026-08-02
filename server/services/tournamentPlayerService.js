const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const TournamentParticipant = require('../models/TournamentParticipant');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { ApiError } = require('../utils/apiResponse');
const { TOURNAMENT_RULES } = require('../utils/tournamentRules');

function publicTournament(value) {
  const source = value?.toObject ? value.toObject() : value;
  const {
    minEloRequired, payoutPreview, payoutPreviewToken, payoutPreviewExpiresAt,
    payoutRequestId, prizePool, createdBy, ...safe
  } = source;
  return {
    ...safe,
    format: source.format || TOURNAMENT_RULES.format,
    rulesVersion: source.rulesVersion || TOURNAMENT_RULES.version,
    rules: TOURNAMENT_RULES,
    prizePool: { coins: Number(prizePool?.coins) || 0 },
  };
}

function validatePlayerRegistration(tournament, user, now = new Date()) {
  if (tournament.registrationOpensAt && new Date(tournament.registrationOpensAt) > now) {
    throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu chưa mở đăng ký.');
  }
  if (tournament.status !== 'registration' || new Date(tournament.registrationClosesAt || tournament.startTime) <= now) {
    throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu đã đóng đăng ký.');
  }
  if (tournament.registeredCount >= tournament.maxParticipants) throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu đã đầy.');
  if ((user.coins || 0) < tournament.entryFee) throw new ApiError(409, 'INSUFFICIENT_BALANCE', 'Không đủ Coin để đăng ký.');
  return true;
}

async function withTransaction(work, startSession = () => mongoose.startSession()) {
  const session = await startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally {
    await session.endSession();
  }
}

async function registerPlayer({
  tournamentId, userId, requestId, now = new Date(),
  TournamentModel = Tournament, ParticipantModel = TournamentParticipant,
  UserModel = User, TransactionModel = Transaction, startSession,
}) {
  return withTransaction(async (session) => {
    const replay = await ParticipantModel.findOne({ tournamentId, userId, paymentStatus: 'paid', paymentRequestId: requestId }).session(session);
    if (replay) return replay;
    if (await ParticipantModel.findOne({ tournamentId, userId }).session(session)) throw new ApiError(409, 'STATE_CONFLICT', 'Bạn đã đăng ký giải đấu này.');
    const tournament = await TournamentModel.findById(tournamentId).session(session);
    const user = await UserModel.findById(userId).session(session);
    if (!tournament || !user) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy giải đấu hoặc người chơi.');
    validatePlayerRegistration(tournament, user, now);
    const slot = await TournamentModel.findOneAndUpdate(
      { _id: tournamentId, status: 'registration', registeredCount: { $lt: tournament.maxParticipants }, registrationClosesAt: { $gt: now }, $or: [{ registrationOpensAt: { $exists: false } }, { registrationOpensAt: { $lte: now } }] },
      { $inc: { registeredCount: 1, stateVersion: 1 } },
      { new: true, session },
    );
    if (!slot) throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu vừa đóng hoặc đã đầy.');
    const paid = await UserModel.findOneAndUpdate(
      { _id: userId, coins: { $gte: tournament.entryFee } },
      { $inc: { coins: -tournament.entryFee } },
      { new: true, session },
    );
    if (!paid) throw new ApiError(409, 'INSUFFICIENT_BALANCE', 'Không đủ Coin để đăng ký.');
    const [participant] = await ParticipantModel.create([{
      tournamentId, userId, status: 'registered', entryFeePaid: tournament.entryFee,
      paymentStatus: 'paid', paymentRequestId: requestId, paidAt: now, registeredBy: userId,
    }], { session });
    await TransactionModel.create([{
      userId, type: 'tournament_entry', amount: tournament.entryFee, currency: 'coin',
      balanceBefore: user.coins, balanceAfter: paid.coins, source: `tournament:${tournamentId}`,
      description: `Tournament entry: ${tournament.name}`,
    }], { session });
    return participant;
  }, startSession);
}

async function withdrawPlayer({
  tournamentId, userId, requestId, now = new Date(),
  TournamentModel = Tournament, ParticipantModel = TournamentParticipant,
  UserModel = User, TransactionModel = Transaction, startSession,
}) {
  return withTransaction(async (session) => {
    const replay = await ParticipantModel.findOne({ tournamentId, userId, paymentStatus: 'refunded', refundRequestId: requestId }).session(session);
    if (replay) return replay;
    const tournament = await TournamentModel.findById(tournamentId).session(session);
    if (!tournament || tournament.status !== 'registration' || new Date(tournament.registrationClosesAt || tournament.startTime) <= now) {
      throw new ApiError(409, 'STATE_CONFLICT', 'Không thể rút sau khi đăng ký đóng.');
    }
    const participant = await ParticipantModel.findOneAndUpdate(
      { tournamentId, userId, status: 'registered', paymentStatus: 'paid' },
      { $set: { status: 'refunded', paymentStatus: 'refunded', refundStatus: 'completed', refundRequestId: requestId, refundedAt: now, withdrawnAt: now } },
      { new: true, session },
    );
    if (!participant) throw new ApiError(409, 'STATE_CONFLICT', 'Đăng ký không tồn tại hoặc đã được hoàn tiền.');
    const before = await UserModel.findByIdAndUpdate(userId, { $inc: { coins: participant.entryFeePaid } }, { new: false, session });
    await TournamentModel.findByIdAndUpdate(tournamentId, { $inc: { registeredCount: -1, stateVersion: 1 } }, { session });
    await TransactionModel.create([{
      userId, type: 'tournament_refund', amount: participant.entryFeePaid, currency: 'coin',
      balanceBefore: before.coins, balanceAfter: before.coins + participant.entryFeePaid,
      source: `tournament:${tournamentId}`, description: `Tournament withdrawal: ${tournament.name}`,
    }], { session });
    return participant;
  }, startSession);
}

async function refundCancelledTournamentEntries({
  tournamentId,
  requestId,
  now = new Date(),
  TournamentModel = Tournament,
  ParticipantModel = TournamentParticipant,
  UserModel = User,
  TransactionModel = Transaction,
  startSession,
}) {
  const tournament = await TournamentModel.findById(tournamentId);
  if (!tournament || tournament.status !== 'cancelled') throw new ApiError(409, 'STATE_CONFLICT', 'Tournament phải ở trạng thái cancelled trước khi hoàn phí.');
  await TournamentModel.findByIdAndUpdate?.(tournamentId, { $set: { refundState: 'processing' } });
  const participants = await ParticipantModel.find({ tournamentId, paymentStatus: 'paid' }).select('_id').lean();
  try {
    for (const row of participants) {
      await withTransaction(async (session) => {
        const participant = await ParticipantModel.findOneAndUpdate(
          { _id: row._id, tournamentId, paymentStatus: 'paid' },
          { $set: { status: 'refunded', paymentStatus: 'refunded', refundStatus: 'completed', refundRequestId: requestId, refundedAt: now } },
          { new: true, session },
        );
        if (!participant) return;
        const before = await UserModel.findByIdAndUpdate(
          participant.userId,
          { $inc: { coins: participant.entryFeePaid } },
          { new: false, session },
        );
        if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi để hoàn phí Tournament.');
        await TransactionModel.create([{
          userId: participant.userId,
          type: 'tournament_refund',
          amount: participant.entryFeePaid,
          currency: 'coin',
          balanceBefore: before.coins,
          balanceAfter: before.coins + participant.entryFeePaid,
          source: `tournament:${tournamentId}`,
          description: `Tournament cancellation refund: ${tournament.name}`,
        }], { session });
      }, startSession);
    }
    await TournamentModel.findByIdAndUpdate?.(tournamentId, { $set: { refundState: 'completed' } });
  } catch (error) {
    await TournamentModel.findByIdAndUpdate?.(tournamentId, { $set: { refundState: 'failed' } });
    throw error;
  }
  return { refunded: participants.length };
}

module.exports = {
  publicTournament,
  refundCancelledTournamentEntries,
  registerPlayer,
  validatePlayerRegistration,
  withdrawPlayer,
};
