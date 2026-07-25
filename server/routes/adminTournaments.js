const express = require('express');
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const TournamentParticipant = require('../models/TournamentParticipant');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { createAdminAudit } = require('../services/admin/auditService');
const {
  createTournamentPayoutPreview,
  executeTournamentPayout,
  registerTournamentParticipant,
  transitionTournament,
  validateTournamentInput,
} = require('../services/admin/tournamentService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

function requestContext(req) {
  return { requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') };
}

function assertId(value, field = 'id') {
  if (!mongoose.isValidObjectId(value)) throw new ApiError(422, 'VALIDATION_ERROR', `${field} không hợp lệ.`, { fields: { [field]: 'Mongo ObjectId bắt buộc' } });
}

async function sendMutation(req, res, { operation, payload, execute, statusCode = 200 }) {
  const outcome = await executeIdempotentAdminOperation({
    actorId: req.admin.id,
    operation,
    requestId: req.adminMutation.requestId,
    payload,
    execute: async () => ({ statusCode, body: { success: true, data: await execute() } }),
  });
  if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
  return res.status(outcome.statusCode).json(outcome.body);
}

router.get('/', requireAdminPermission('tournaments.read'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = {};
    if (['registration', 'active', 'completed', 'cancelled'].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.search) filter.name = { $regex: String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 120), $options: 'i' };
    const [items, total] = await Promise.all([
      Tournament.find(filter).sort({ startTime: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Tournament.countDocuments(filter),
    ]);
    return res.json({ success: true, data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) { return next(error); }
});

router.get('/:id', requireAdminPermission('tournaments.read'), async (req, res, next) => {
  try {
    assertId(req.params.id, 'tournamentId');
    const [tournament, participants] = await Promise.all([
      Tournament.findById(req.params.id).lean(),
      TournamentParticipant.find({ tournamentId: req.params.id }).populate('userId', 'username email eloPoints coins gems').sort({ finalRank: 1, score: -1, registrationDate: 1, _id: 1 }).lean(),
    ]);
    if (!tournament) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy giải đấu.');
    return res.json({ success: true, data: { tournament, participants } });
  } catch (error) { return next(error); }
});

router.post('/', requireAdminPermission('tournaments.write'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    return await sendMutation(req, res, {
      operation: 'tournament.create', payload: req.body, statusCode: 201,
      execute: async () => {
        const input = validateTournamentInput(req.body);
        const tournament = await Tournament.create({ ...input, status: 'registration', createdBy: req.admin.id });
        await createAdminAudit({ actor: req.admin, action: 'TOURNAMENT_CREATED', target: { type: 'tournament', id: String(tournament._id) }, before: null, after: tournament.toObject(), reason: req.adminMutation.reason, request: { ...requestContext(req), operationRequestId: req.adminMutation.requestId } });
        return tournament;
      },
    });
  } catch (error) { return next(error); }
});

router.patch('/:id', requireAdminPermission('tournaments.write'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    assertId(req.params.id, 'tournamentId');
    return await sendMutation(req, res, {
      operation: 'tournament.update', payload: { tournamentId: req.params.id, ...req.body },
      execute: async () => {
        const before = await Tournament.findById(req.params.id);
        if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy giải đấu.');
        if (before.status !== 'registration') throw new ApiError(409, 'STATE_CONFLICT', 'Chỉ được chỉnh sửa giải đấu đang mở đăng ký.');
        const input = validateTournamentInput({ ...before.toObject(), ...req.body });
        if (input.maxParticipants < before.registeredCount) throw new ApiError(422, 'VALIDATION_ERROR', 'Sức chứa không thể thấp hơn số người đã đăng ký.', { fields: { maxParticipants: `Tối thiểu ${before.registeredCount}` } });
        const tournament = await Tournament.findOneAndUpdate({ _id: before._id, status: 'registration', stateVersion: Number(req.body.expectedVersion) }, { $set: input, $inc: { stateVersion: 1 } }, { new: true, runValidators: true });
        if (!tournament) throw new ApiError(409, 'STATE_CONFLICT', 'Giải đấu đã thay đổi. Hãy tải lại.');
        await createAdminAudit({ actor: req.admin, action: 'TOURNAMENT_UPDATED', target: { type: 'tournament', id: String(tournament._id) }, before: before.toObject(), after: tournament.toObject(), reason: req.adminMutation.reason, request: { ...requestContext(req), operationRequestId: req.adminMutation.requestId } });
        return tournament;
      },
    });
  } catch (error) { return next(error); }
});

router.post('/:id/participants', requireAdminPermission('tournaments.write'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    assertId(req.params.id, 'tournamentId');
    assertId(req.body.userId, 'userId');
    return await sendMutation(req, res, {
      operation: 'tournament.participant.register', payload: { tournamentId: req.params.id, userId: req.body.userId }, statusCode: 201,
      execute: () => registerTournamentParticipant({ actor: req.admin, tournamentId: req.params.id, userId: req.body.userId, mutation: req.adminMutation, request: requestContext(req) }),
    });
  } catch (error) { return next(error); }
});

router.patch('/:id/participants/:participantId', requireAdminPermission('tournaments.write'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    assertId(req.params.id, 'tournamentId');
    assertId(req.params.participantId, 'participantId');
    const score = Number(req.body.score);
    if (!Number.isSafeInteger(score) || score < 0 || score > 1000000) throw new ApiError(422, 'VALIDATION_ERROR', 'Điểm không hợp lệ.', { fields: { score: 'Số nguyên từ 0 đến 1000000' } });
    return await sendMutation(req, res, {
      operation: 'tournament.participant.score', payload: { tournamentId: req.params.id, participantId: req.params.participantId, score, expectedVersion: req.body.expectedVersion },
      execute: async () => {
        const tournament = await Tournament.findById(req.params.id).select('status');
        if (!tournament) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy giải đấu.');
        if (tournament.status !== 'active') throw new ApiError(409, 'STATE_CONFLICT', 'Chỉ cập nhật điểm khi giải đấu đang active.');
        const before = await TournamentParticipant.findOne({ _id: req.params.participantId, tournamentId: req.params.id });
        if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người tham gia.');
        const participant = await TournamentParticipant.findOneAndUpdate({ _id: before._id, tournamentId: req.params.id, __v: Number(req.body.expectedVersion) }, { $set: { score }, $inc: { __v: 1 } }, { new: true, runValidators: true });
        if (!participant) throw new ApiError(409, 'STATE_CONFLICT', 'Điểm vừa thay đổi. Hãy tải lại.');
        await createAdminAudit({ actor: req.admin, action: 'TOURNAMENT_PARTICIPANT_SCORE_UPDATED', target: { type: 'tournament_participant', id: String(participant._id) }, before: { score: before.score, version: before.__v }, after: { score: participant.score, version: participant.__v }, reason: req.adminMutation.reason, request: { ...requestContext(req), operationRequestId: req.adminMutation.requestId } });
        return participant;
      },
    });
  } catch (error) { return next(error); }
});

router.post('/:id/transitions', requireAdminPermission('tournaments.write'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    assertId(req.params.id, 'tournamentId');
    return await sendMutation(req, res, {
      operation: 'tournament.transition', payload: { tournamentId: req.params.id, nextStatus: req.body.nextStatus, expectedVersion: req.body.expectedVersion },
      execute: () => transitionTournament({ actor: req.admin, tournamentId: req.params.id, nextStatus: req.body.nextStatus, expectedVersion: req.body.expectedVersion, mutation: req.adminMutation, request: requestContext(req) }),
    });
  } catch (error) { return next(error); }
});

router.post('/:id/payouts/preview', requireAdminPermission('tournaments.payout'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    assertId(req.params.id, 'tournamentId');
    return await sendMutation(req, res, {
      operation: 'tournament.payout.preview', payload: { tournamentId: req.params.id, expectedVersion: req.body.expectedVersion },
      execute: () => createTournamentPayoutPreview({ actor: req.admin, tournamentId: req.params.id, expectedVersion: req.body.expectedVersion, mutation: req.adminMutation, request: requestContext(req) }),
    });
  } catch (error) { return next(error); }
});

router.post('/:id/payouts', requireAdminPermission('tournaments.payout'), requireAdminMutationContext({ critical: true }), async (req, res, next) => {
  try {
    assertId(req.params.id, 'tournamentId');
    return await sendMutation(req, res, {
      operation: 'tournament.payout.execute', payload: { tournamentId: req.params.id, expectedVersion: req.body.expectedVersion, previewToken: req.body.previewToken },
      execute: () => executeTournamentPayout({ actor: req.admin, tournamentId: req.params.id, expectedVersion: req.body.expectedVersion, previewToken: req.body.previewToken, mutation: req.adminMutation, request: requestContext(req) }),
    });
  } catch (error) { return next(error); }
});

module.exports = router;
