const Tournament = require('../../models/Tournament');
const TournamentParticipant = require('../../models/TournamentParticipant');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const crypto = require('crypto');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');

const TOURNAMENT_TRANSITIONS = Object.freeze({
  registration: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
});

function invalid(message, fields) { return new ApiError(422, 'VALIDATION_ERROR', message, { fields }); }

function integer(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw invalid(`${field} không hợp lệ.`, { [field]: `Số nguyên từ ${min} đến ${max} bắt buộc` });
  return number;
}

function dateValue(value, field) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw invalid(`${field} không hợp lệ.`, { [field]: 'ISO date bắt buộc' });
  return date;
}

function validateTournamentInput(input, now = new Date()) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > 120) throw invalid('Tên giải đấu không hợp lệ.', { name: 'Bắt buộc, tối đa 120 ký tự' });
  const startTime = dateValue(input.startTime, 'startTime');
  if (startTime <= now) throw invalid('Thời gian bắt đầu phải ở tương lai.', { startTime: 'Phải ở tương lai' });
  const registrationClosesAt = input.registrationClosesAt ? dateValue(input.registrationClosesAt, 'registrationClosesAt') : startTime;
  if (registrationClosesAt > startTime) throw invalid('Đóng đăng ký phải trước hoặc bằng thời gian bắt đầu.', { registrationClosesAt: 'Không được sau startTime' });
  return {
    name,
    description: typeof input.description === 'string' ? input.description.trim().slice(0, 2000) : '',
    entryFee: integer(input.entryFee ?? 0, 'entryFee', { max: 1000000 }),
    minEloRequired: integer(input.minEloRequired ?? 0, 'minEloRequired', { max: 100000 }),
    maxParticipants: integer(input.maxParticipants ?? 16, 'maxParticipants', { min: 2, max: 128 }),
    prizePool: {
      coins: integer(input.prizePool?.coins ?? 0, 'prizePool.coins', { max: 100000000 }),
      gems: integer(input.prizePool?.gems ?? 0, 'prizePool.gems', { max: 1000000 }),
    },
    startTime,
    registrationClosesAt,
  };
}

function getNextTournamentStatus(current, next) {
  if (!TOURNAMENT_TRANSITIONS[current]?.includes(next)) throw new ApiError(409, 'STATE_CONFLICT', `Không thể chuyển giải đấu từ ${current} sang ${next}.`);
  return next;
}

function participantIdentity(participant) {
  const user = participant.userId || {};
  return { participantId: String(participant._id), userId: String(user._id || user), username: user.username || 'Unknown' };
}

function buildInitialBracket(participants) {
  const seeded = [...participants].sort((left, right) => (Number(right.score) || 0) - (Number(left.score) || 0) || new Date(left.registrationDate || 0) - new Date(right.registrationDate || 0) || String(left._id).localeCompare(String(right._id)));
  const size = 2 ** Math.ceil(Math.log2(Math.max(2, seeded.length)));
  const slots = [...seeded, ...Array(size - seeded.length).fill(null)];
  const matches = [];
  for (let index = 0; index < size / 2; index += 1) {
    const left = slots[index];
    const right = slots[size - 1 - index];
    const identities = [left, right].filter(Boolean).map(participantIdentity);
    matches.push({ id: `r1-m${index + 1}`, participantIds: identities.map((item) => item.participantId), participants: identities, bye: identities.length === 1, winnerParticipantId: identities.length === 1 ? identities[0].participantId : null, status: identities.length === 1 ? 'completed' : 'pending' });
  }
  return { size, rounds: [{ round: 1, name: 'Opening round', matches }] };
}

function allocatePool(total, weights) {
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  let allocated = 0;
  return weights.map((weight, index) => {
    const value = index === weights.length - 1 ? total - allocated : Math.floor(total * weight / weightTotal);
    allocated += value;
    return value;
  });
}

function buildTournamentPayoutPreview(tournament, participants) {
  const ranked = participants.filter((item) => Number.isInteger(item.finalRank) && item.finalRank > 0).sort((left, right) => left.finalRank - right.finalRank).slice(0, 3);
  if (!ranked.length) throw invalid('Chưa có xếp hạng cuối để preview payout.', { participants: 'Cần ít nhất một finalRank' });
  const baseWeights = [60, 30, 10].slice(0, ranked.length);
  const coinAmounts = allocatePool(integer(tournament.prizePool?.coins ?? 0, 'prizePool.coins'), baseWeights);
  const gemAmounts = allocatePool(integer(tournament.prizePool?.gems ?? 0, 'prizePool.gems'), baseWeights);
  const rows = ranked.map((participant, index) => ({ ...participantIdentity(participant), rank: participant.finalRank, coins: coinAmounts[index], gems: gemAmounts[index] }));
  return { tournamentId: String(tournament._id), rows, totals: { coins: coinAmounts.reduce((sum, value) => sum + value, 0), gems: gemAmounts.reduce((sum, value) => sum + value, 0) } };
}

async function createTournamentPayoutPreview({
  TournamentModel = Tournament,
  ParticipantModel = TournamentParticipant,
  audit = createAdminAudit,
  actor,
  tournamentId,
  expectedVersion,
  mutation,
  request = {},
  now = new Date(),
  tokenFactory = () => crypto.randomUUID(),
}) {
  const tournament = await TournamentModel.findById(tournamentId);
  if (!tournament) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy giải đấu.');
  if (tournament.status !== 'completed') throw new ApiError(409, 'STATE_CONFLICT', 'Chỉ có thể preview payout sau khi giải đấu hoàn tất.');
  if (tournament.payoutState === 'completed') throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu đã payout hoàn tất.');
  if (tournament.payoutState === 'processing') throw new ApiError(409, 'STATE_CONFLICT', 'Payout đang được xử lý.');

  const participants = await ParticipantModel.find({
    tournamentId,
    finalRank: { $exists: true },
    $or: [{ paymentStatus: 'paid' }, { paymentStatus: { $exists: false } }],
  }).populate('userId', 'username').sort({ finalRank: 1, _id: 1 }).lean();
  const preview = buildTournamentPayoutPreview(tournament, participants);
  const previewToken = tokenFactory();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  const updated = await TournamentModel.findOneAndUpdate(
    { _id: tournamentId, status: 'completed', stateVersion: Number(expectedVersion), payoutState: { $in: ['pending', 'previewed', 'failed'] } },
    { $set: { payoutState: 'previewed', payoutPreview: preview, payoutPreviewToken: previewToken, payoutPreviewExpiresAt: expiresAt }, $inc: { stateVersion: 1 } },
    { new: true, runValidators: true },
  );
  if (!updated) throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu đã thay đổi. Hãy tải lại trước khi preview.');
  await audit({ actor, action: 'TOURNAMENT_PAYOUT_PREVIEWED', target: { type: 'tournament', id: String(tournamentId) }, before: { payoutState: tournament.payoutState, stateVersion: tournament.stateVersion }, after: { payoutState: 'previewed', stateVersion: updated.stateVersion, totals: preview.totals, recipients: preview.rows.length, expiresAt }, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return { ...preview, previewToken, expiresAt, stateVersion: updated.stateVersion };
}

async function executeTournamentPayout({
  TournamentModel = Tournament,
  ParticipantModel = TournamentParticipant,
  UserModel = User,
  TransactionModel = Transaction,
  audit = createAdminAudit,
  actor,
  tournamentId,
  expectedVersion,
  previewToken,
  mutation,
  request = {},
  now = new Date(),
}) {
  const tournament = await TournamentModel.findOneAndUpdate(
    {
      _id: tournamentId,
      status: 'completed',
      stateVersion: Number(expectedVersion),
      payoutState: 'previewed',
      payoutPreviewToken: previewToken,
      payoutPreviewExpiresAt: { $gt: now },
    },
    { $set: { payoutState: 'processing', payoutRequestId: mutation.requestId }, $inc: { stateVersion: 1 } },
    { new: true },
  );
  if (!tournament) {
    const current = await TournamentModel.findById(tournamentId);
    if (current?.payoutState === 'completed' && current?.payoutRequestId === mutation.requestId) {
      return { ...(current.payoutPreview || {}), completed: true, replayed: true, failures: [] };
    }
    throw new ApiError(409, 'STATE_CONFLICT', 'Payout preview đã hết hạn, đã dùng hoặc giải đấu vừa thay đổi.');
  }

  const rows = tournament.payoutPreview?.rows || [];
  const successes = [];
  const failures = [];
  for (const row of rows) {
    let participant;
    try {
      participant = await ParticipantModel.findOneAndUpdate(
        { _id: row.participantId, tournamentId, userId: row.userId, payoutStatus: 'pending' },
        { $set: { payoutStatus: 'processing', payoutRequestId: mutation.requestId, payoutCoins: row.coins, payoutGems: row.gems } },
        { new: true },
      );
      if (!participant) throw new Error('Recipient payout is already claimed or unavailable.');
      const user = await UserModel.findById(row.userId);
      if (!user) throw new Error('Player account no longer exists.');
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: row.userId, __v: user.__v },
        { $inc: { coins: row.coins, gems: row.gems, __v: 1 } },
        { new: true, runValidators: true },
      );
      if (!updatedUser) throw new Error('Player balance changed concurrently.');
      const transactions = [];
      if (row.coins > 0) transactions.push({ userId: row.userId, type: 'tournament_prize', amount: row.coins, currency: 'coin', balanceBefore: user.coins, balanceAfter: updatedUser.coins, source: `tournament:${tournamentId}`, createdBy: actor.username, description: `Tournament prize: ${tournament.name}` });
      if (row.gems > 0) transactions.push({ userId: row.userId, type: 'tournament_prize', amount: row.gems, currency: 'gem', balanceBefore: user.gems, balanceAfter: updatedUser.gems, source: `tournament:${tournamentId}`, createdBy: actor.username, description: `Tournament prize: ${tournament.name}` });
      if (transactions.length) await TransactionModel.insertMany(transactions);
      await ParticipantModel.findByIdAndUpdate(row.participantId, { $set: { payoutStatus: 'completed', payoutAt: now } });
      successes.push(row);
    } catch (error) {
      if (participant?._id) await ParticipantModel.findByIdAndUpdate(participant._id, { $set: { payoutStatus: 'failed' } });
      failures.push({ participantId: row.participantId, userId: row.userId, message: error.message });
    }
  }

  const completed = failures.length === 0;
  const finalized = await TournamentModel.findOneAndUpdate(
    { _id: tournamentId, payoutState: 'processing', payoutRequestId: mutation.requestId },
    { $set: { payoutState: completed ? 'completed' : 'failed', payoutAt: completed ? now : undefined }, $inc: { stateVersion: 1 } },
    { new: true },
  );
  const result = { tournamentId: String(tournamentId), totals: tournament.payoutPreview?.totals || { coins: 0, gems: 0 }, recipients: rows.length, succeeded: successes.length, failed: failures.length, failures, completed, stateVersion: finalized?.stateVersion };
  await audit({ actor, action: completed ? 'TOURNAMENT_PAYOUT_COMPLETED' : 'TOURNAMENT_PAYOUT_PARTIAL_FAILURE', target: { type: 'tournament', id: String(tournamentId) }, before: { payoutState: 'previewed' }, after: result, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return result;
}

async function registerTournamentParticipant({
  TournamentModel = Tournament,
  ParticipantModel = TournamentParticipant,
  UserModel = User,
  TransactionModel = Transaction,
  audit = createAdminAudit,
  actor,
  tournamentId,
  userId,
  mutation,
  request = {},
  now = new Date(),
}) {
  const tournament = await TournamentModel.findById(tournamentId);
  if (!tournament) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy giải đấu.');
  if (tournament.status !== 'registration' || new Date(tournament.registrationClosesAt || tournament.startTime) <= now) throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu không còn nhận đăng ký.');
  const user = await UserModel.findById(userId);
  if (!user) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');
  if ((user.eloPoints || 0) < tournament.minEloRequired) throw invalid('Người chơi chưa đủ ELO tham gia.', { userId: `Yêu cầu tối thiểu ${tournament.minEloRequired} ELO` });

  const slot = await TournamentModel.findOneAndUpdate(
    { _id: tournamentId, status: 'registration', registeredCount: { $lt: tournament.maxParticipants }, registrationClosesAt: { $gt: now } },
    { $inc: { registeredCount: 1, stateVersion: 1 } },
    { new: true },
  );
  if (!slot) throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu đã đầy hoặc trạng thái vừa thay đổi.');

  let participant;
  try {
    participant = await ParticipantModel.create({
      tournamentId, userId, status: 'registered', entryFeePaid: tournament.entryFee,
      paymentStatus: 'processing', paymentRequestId: mutation.requestId, registeredBy: actor.id,
    });
  } catch (error) {
    await TournamentModel.findByIdAndUpdate?.(tournamentId, { $inc: { registeredCount: -1, stateVersion: 1 } });
    if (error?.code === 11000) throw new ApiError(409, 'STATE_CONFLICT', 'Người chơi đã đăng ký giải đấu này.');
    throw error;
  }

  const paidUser = await UserModel.findOneAndUpdate(
    { _id: userId, __v: user.__v, coins: { $gte: tournament.entryFee } },
    { $inc: { coins: -tournament.entryFee, __v: 1 } },
    { new: true, runValidators: true },
  );
  if (!paidUser) {
    await ParticipantModel.findByIdAndUpdate(participant._id, { $set: { paymentStatus: 'failed' } });
    await TournamentModel.findByIdAndUpdate?.(tournamentId, { $inc: { registeredCount: -1, stateVersion: 1 } });
    throw new ApiError(409, 'STATE_CONFLICT', 'Số dư người chơi không đủ hoặc vừa thay đổi.');
  }
  await TransactionModel.create({
    userId, type: 'tournament_entry', amount: tournament.entryFee, currency: 'coin',
    balanceBefore: user.coins, balanceAfter: paidUser.coins, source: `tournament:${tournamentId}`,
    createdBy: actor.username, description: `Tournament entry fee: ${tournament.name}`,
  });
  participant = await ParticipantModel.findByIdAndUpdate(participant._id, { $set: { paymentStatus: 'paid', paidAt: now } }, { new: true });
  await audit({ actor, action: 'TOURNAMENT_PARTICIPANT_REGISTERED', target: { type: 'tournament_participant', id: String(participant._id) }, before: { userCoins: user.coins, registeredCount: tournament.registeredCount || 0 }, after: { userCoins: paidUser.coins, registeredCount: slot.registeredCount, entryFeePaid: tournament.entryFee }, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return participant;
}

async function transitionTournament({
  TournamentModel = Tournament,
  ParticipantModel = TournamentParticipant,
  audit = createAdminAudit,
  actor,
  tournamentId,
  nextStatus,
  expectedVersion,
  mutation,
  request = {},
  now = new Date(),
}) {
  const before = await TournamentModel.findById(tournamentId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy giải đấu.');
  getNextTournamentStatus(before.status, nextStatus);
  const participants = await ParticipantModel.find({ tournamentId, paymentStatus: 'paid' }).populate('userId', 'username').sort({ score: -1, registrationDate: 1, _id: 1 }).lean();
  if (nextStatus === 'active' && participants.length < 2) throw new ApiError(409, 'STATE_CONFLICT', 'Cần ít nhất hai người chơi đã thanh toán để bắt đầu.');
  const set = { status: nextStatus };
  if (nextStatus === 'active') {
    set.bracket = buildInitialBracket(participants);
    set.startedAt = now;
  }
  if (nextStatus === 'completed') {
    set.completedAt = now;
    if (participants.length) {
      await ParticipantModel.bulkWrite?.(participants.map((participant, index) => ({ updateOne: { filter: { _id: participant._id }, update: { $set: { finalRank: index + 1, status: index === 0 ? 'winner' : 'eliminated' } } } })));
    }
  }
  if (nextStatus === 'cancelled') set.cancelledAt = now;
  const tournament = await TournamentModel.findOneAndUpdate(
    { _id: tournamentId, status: before.status, stateVersion: Number(expectedVersion) },
    { $set: set, $inc: { stateVersion: 1 } },
    { new: true, runValidators: true },
  );
  if (!tournament) throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu đã thay đổi. Hãy tải lại.');
  await audit({ actor, action: 'TOURNAMENT_STATUS_CHANGED', target: { type: 'tournament', id: String(tournamentId) }, before: { status: before.status, stateVersion: before.stateVersion }, after: { status: tournament.status, stateVersion: tournament.stateVersion, bracket: nextStatus === 'active' ? tournament.bracket : undefined }, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return tournament;
}

module.exports = {
  TOURNAMENT_TRANSITIONS,
  buildInitialBracket,
  buildTournamentPayoutPreview,
  createTournamentPayoutPreview,
  executeTournamentPayout,
  getNextTournamentStatus,
  registerTournamentParticipant,
  transitionTournament,
  validateTournamentInput,
};
