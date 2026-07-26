const express = require('express');
const Wager = require('../models/Wager');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { refundWager } = require('../services/wagerLedgerService');
const { createAdminAudit } = require('../services/admin/auditService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get('/', requireAdminPermission('wagers.read'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const query = ['created', 'locked', 'settled', 'refunded', 'review_required'].includes(req.query.state) ? { state: req.query.state } : {};
    const [items, total] = await Promise.all([
      Wager.find(query).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Wager.countDocuments(query),
    ]);
    return res.json({ success: true, data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) { return next(error); }
});

router.get('/:id', requireAdminPermission('wagers.read'), async (req, res, next) => {
  try {
    const wager = await Wager.findById(req.params.id).populate('participants.userId', 'username email coins').lean();
    if (!wager) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy wager.');
    return res.json({ success: true, data: wager });
  } catch (error) { return next(error); }
});

router.post('/:id/refund', requireAdminPermission('wagers.resolve'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    const wager = await Wager.findById(req.params.id);
    if (!wager) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy wager.');
    const before = wager.toObject();
    const refunded = await refundWager({
      roomCode: wager.roomCode,
      reference: wager.reference,
      requestId: req.adminMutation.requestId,
      reason: req.adminMutation.reason,
    });
    await createAdminAudit({
      actor: req.admin, action: 'WAGER_REFUNDED', target: { type: 'wager', id: String(wager._id) },
      before, after: refunded.toObject(), reason: req.adminMutation.reason,
      request: { operationRequestId: req.adminMutation.requestId, requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') },
    });
    return res.json({ success: true, data: refunded });
  } catch (error) { return next(error); }
});

module.exports = router;
