const express = require('express');
const ModerationCase = require('../models/ModerationCase');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { addModerationNote, applyModerationSanction, transitionModerationCase } = require('../services/admin/moderationService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

function requestContext(req) { return { requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') }; }
function requireAny(req, permissions) {
  if (!permissions.some((permission) => req.admin.permissions.includes(permission))) throw new ApiError(403, 'ADMIN_PERMISSION_DENIED', 'Bạn không có quyền thực hiện thao tác moderation này.');
}
async function sendMutation(req, res, operation, payload, execute) {
  const outcome = await executeIdempotentAdminOperation({ actorId: req.admin.id, operation, requestId: req.adminMutation.requestId, payload, execute });
  if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
  return res.status(outcome.statusCode).json(outcome.body);
}

router.get('/cases', requireAdminPermission('moderation.read'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const query = {};
    for (const field of ['status', 'category', 'priority']) if (req.query[field]) query[field] = req.query[field];
    if (req.query.assigneeId === 'unassigned') query.assigneeId = null;
    else if (req.query.assigneeId) query.assigneeId = req.query.assigneeId;
    if (req.query.targetPlayerId) query.targetPlayerId = req.query.targetPlayerId;
    if (req.query.from || req.query.to) query.createdAt = { ...(req.query.from && { $gte: new Date(req.query.from) }), ...(req.query.to && { $lte: new Date(req.query.to) }) };
    const [items, total] = await Promise.all([
      ModerationCase.find(query).populate('targetPlayerId', 'username email isBanned suspendedUntil warningCount').populate('assigneeId', 'username').sort({ priority: -1, createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ModerationCase.countDocuments(query),
    ]);
    const safeItems = req.admin.role === 'analyst' ? items.map(({ notes, ...item }) => item) : items;
    return res.json({ success: true, data: { items: safeItems, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { return next(error); }
});

router.get('/cases/:caseId', requireAdminPermission('moderation.read'), async (req, res, next) => {
  try {
    const item = await ModerationCase.findById(req.params.caseId).populate('targetPlayerId', 'username email isBanned suspendedUntil warningCount').populate('assigneeId', 'username').populate('reportIds').lean();
    if (!item) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy moderation case.');
    if (req.admin.role === 'analyst') { delete item.notes; item.timeline = item.timeline?.filter((event) => event.type !== 'NOTE_ADDED'); }
    return res.json({ success: true, data: item });
  } catch (error) { return next(error); }
});

router.patch('/cases/:caseId', requireAdminPermission('moderation.read'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    const needed = [];
    if (req.body.assigneeId !== undefined || req.body.priority !== undefined) needed.push('moderation.assign');
    if (req.body.status !== undefined) needed.push('moderation.resolve');
    requireAny(req, needed.length ? needed : ['moderation.assign']);
    return await sendMutation(req, res, 'moderation.case.update', { caseId: req.params.caseId, ...req.body }, async () => {
      const item = await transitionModerationCase({ actor: req.admin, caseId: req.params.caseId, input: req.body, mutation: req.adminMutation, request: requestContext(req) });
      return { statusCode: 200, body: { success: true, data: item } };
    });
  } catch (error) { return next(error); }
});

router.post('/cases/:caseId/notes', requireAdminPermission('moderation.assign'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    return await sendMutation(req, res, 'moderation.case.note', { caseId: req.params.caseId, content: req.body.content }, async () => {
      const item = await addModerationNote({ actor: req.admin, caseId: req.params.caseId, content: req.body.content, mutation: req.adminMutation, request: requestContext(req) });
      return { statusCode: 201, body: { success: true, data: item } };
    });
  } catch (error) { return next(error); }
});

router.post('/cases/:caseId/sanctions', requireAdminPermission('moderation.read'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    const permission = req.body.type === 'warning' ? 'moderation.sanction.warning' : req.body.type === 'suspension' ? 'moderation.sanction.suspend' : 'moderation.sanction.ban';
    requireAny(req, [permission]);
    return await sendMutation(req, res, 'moderation.case.sanction', { caseId: req.params.caseId, type: req.body.type, expiresAt: req.body.expiresAt, reason: req.adminMutation.reason }, async () => {
      const user = await applyModerationSanction({ actor: req.admin, caseId: req.params.caseId, input: req.body, mutation: req.adminMutation, request: requestContext(req) });
      return { statusCode: 200, body: { success: true, data: user } };
    });
  } catch (error) { return next(error); }
});

module.exports = router;
