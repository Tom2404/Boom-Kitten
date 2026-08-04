const express = require('express');
const mongoose = require('mongoose');
const ModerationCase = require('../models/ModerationCase');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { createAdminAudit } = require('../services/admin/auditService');
const { CASE_PRIORITIES, CASE_STATUSES, updateModerationCase } = require('../services/moderationService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

const casePopulation = [
  { path: 'targetPlayerId', select: 'username avatar isBanned suspendedUntil' },
  { path: 'assigneeId', select: 'username' },
  { path: 'reportIds', populate: [{ path: 'reporterId', select: 'username avatar' }] },
];

router.get('/cases', requireAdminPermission('moderation.read'), async (req, res, next) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? Math.min(50, requestedLimit) : 20;
    const filter = {};
    if (req.query.status) {
      if (!CASE_STATUSES.has(req.query.status)) throw new ApiError(422, 'VALIDATION_ERROR', 'Trạng thái không hợp lệ.');
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      if (!CASE_PRIORITIES.has(req.query.priority)) throw new ApiError(422, 'VALIDATION_ERROR', 'Mức ưu tiên không hợp lệ.');
      filter.priority = req.query.priority;
    }
    const [cases, total] = await Promise.all([
      ModerationCase.find(filter).populate(casePopulation).sort({ updatedAt: -1, _id: 1 }).skip((page - 1) * limit).limit(limit),
      ModerationCase.countDocuments(filter),
    ]);
    return res.json({ success: true, data: { cases, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (error) {
    return next(error);
  }
});

router.get('/cases/:id', requireAdminPermission('moderation.read'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy moderation case.');
    const moderationCase = await ModerationCase.findById(req.params.id).populate(casePopulation);
    if (!moderationCase) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy moderation case.');
    return res.json({ success: true, data: moderationCase });
  } catch (error) {
    return next(error);
  }
});

router.patch('/cases/:id', requireAdminPermission('moderation.write'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy moderation case.');
    const moderationCase = await ModerationCase.findById(req.params.id);
    const updated = await updateModerationCase({
      moderationCase,
      actor: req.admin,
      input: req.body,
      createAudit: createAdminAudit,
      request: { requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') },
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
