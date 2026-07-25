const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { queryAuditLogs, sanitizeAuditRowsForRole } = require('../services/admin/auditQueryService');
const { enqueueAuditExport } = require('../services/admin/jobService');
const { createAdminAudit } = require('../services/admin/auditService');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

function filtersFrom(source) {
  return Object.fromEntries(['actorId', 'targetType', 'targetId', 'action', 'from', 'to'].filter((key) => source[key]).map((key) => [key, source[key]]));
}

router.get('/', requireAdminPermission('audit.read'), async (req, res, next) => {
  try {
    const data = await queryAuditLogs({ filters: filtersFrom(req.query), page: req.query.page, limit: req.query.limit });
    return res.json({ success: true, data: { ...data, items: sanitizeAuditRowsForRole(data.items, req.admin.role) } });
  } catch (error) { return next(error); }
});

router.post('/exports', requireAdminPermission('audit.export'), requireAdminMutationContext({ reasonRequired: false }), async (req, res, next) => {
  try {
    const filters = filtersFrom(req.body || {});
    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: 'audit.export',
      requestId: req.adminMutation.requestId,
      payload: filters,
      execute: async () => {
        const mutation = { ...req.adminMutation, reason: req.adminMutation.reason || 'Export audit logs' };
        const job = await enqueueAuditExport({ actor: req.admin, filters, mutation });
        await createAdminAudit({ actor: req.admin, action: 'AUDIT_EXPORT_QUEUED', target: { type: 'admin_job', id: String(job._id) }, before: null, after: { filters, status: job.status }, reason: mutation.reason, request: { operationRequestId: mutation.requestId, requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') } });
        return { statusCode: 202, body: { success: true, data: { jobId: String(job._id), status: job.status } } };
      },
    });
    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) { return next(error); }
});

module.exports = router;
