const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { createAdminAudit } = require('../services/admin/auditService');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { enqueuePlayersExport } = require('../services/admin/playerBulkJobService');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

router.post('/', requireAdminPermission('players.export'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    const filters = Object.fromEntries(['search', 'role', 'status', 'rank', 'isOnline', 'createdFrom', 'createdTo'].filter((key) => req.body?.[key] !== undefined && req.body[key] !== '').map((key) => [key, req.body[key]]));
    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: 'players.export',
      requestId: req.adminMutation.requestId,
      payload: filters,
      execute: async () => {
        const mutation = { ...req.adminMutation, reason: req.adminMutation.reason || 'Export player query' };
        const job = await enqueuePlayersExport({ actor: req.admin, filters, mutation });
        await createAdminAudit({
          actor: req.admin,
          action: 'PLAYER_EXPORT_QUEUED',
          target: { type: 'admin_job', id: String(job._id) },
          before: null,
          after: { filters, targetCount: job.targetCount, status: job.status },
          reason: mutation.reason,
          request: { operationRequestId: mutation.requestId, requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') },
        });
        return { statusCode: 202, body: { success: true, data: { jobId: String(job._id), status: job.status, targetCount: job.targetCount } } };
      },
    });
    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) { return next(error); }
});

module.exports = router;
