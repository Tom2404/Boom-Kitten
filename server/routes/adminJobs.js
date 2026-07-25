const express = require('express');
const AdminJob = require('../models/AdminJob');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission } = require('../middleware/adminMiddleware');
const { requireAdminMutationContext } = require('../middleware/adminMutationContext');
const { cancelAdminJob, getJobArtifactPermission, sanitizeJobForRole } = require('../services/admin/jobService');
const { createAdminAudit } = require('../services/admin/auditService');
const { executeIdempotentAdminOperation } = require('../services/admin/idempotencyService');
const { createPlayerBulkPreview, enqueuePlayerBulkExecution, getBulkOperationPermission } = require('../services/admin/playerBulkJobService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

function ensurePermission(req, permission) {
  if (!req.admin.permissions.includes(permission)) throw new ApiError(403, 'ADMIN_PERMISSION_DENIED', 'Bạn không có quyền thực hiện bulk operation này.', { permission });
}

async function loadJob(jobId) {
  const job = await AdminJob.findById(jobId);
  if (!job) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy Admin job.');
  return job;
}

router.get('/', requireAdminPermission('jobs.read'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const query = req.query.status ? { status: req.query.status } : {};
    const [jobs, total] = await Promise.all([AdminJob.find(query).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), AdminJob.countDocuments(query)]);
    return res.json({ success: true, data: { items: jobs.map((job) => sanitizeJobForRole(job, req.admin.role)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { return next(error); }
});

router.post('/', requireAdminPermission('jobs.create'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    const { type, dryRun, query = {}, operation = {}, previewToken } = req.body;
    if (type !== 'player_bulk_adjust') throw new ApiError(422, 'VALIDATION_ERROR', 'Job type không được hỗ trợ.', { fields: { type: 'Chỉ hỗ trợ player_bulk_adjust' } });

    let nestedPermission;
    if (dryRun === true) {
      nestedPermission = getBulkOperationPermission(operation);
    } else if (dryRun === false) {
      const preview = await AdminJob.findOne({ actorId: req.admin.id, previewToken, status: 'preview' }).select('operation').lean();
      if (!preview) throw new ApiError(409, 'STATE_CONFLICT', 'Preview không tồn tại hoặc không thuộc tài khoản hiện tại.');
      nestedPermission = getBulkOperationPermission(preview.operation);
    } else {
      throw new ApiError(422, 'VALIDATION_ERROR', 'dryRun phải là boolean.', { fields: { dryRun: 'Bắt buộc true hoặc false' } });
    }
    ensurePermission(req, nestedPermission);

    const operationName = dryRun ? 'admin_job.player_bulk.preview' : 'admin_job.player_bulk.execute';
    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: operationName,
      requestId: req.adminMutation.requestId,
      payload: { type, dryRun, query, operation: dryRun ? operation : undefined, previewToken: dryRun ? undefined : previewToken, reason: req.adminMutation.reason },
      execute: async () => {
        const job = dryRun
          ? await createPlayerBulkPreview({ actor: req.admin, filters: query, operation, mutation: req.adminMutation, policy: req.admin.policy })
          : await enqueuePlayerBulkExecution({ actor: req.admin, previewToken, mutation: req.adminMutation });
        await createAdminAudit({
          actor: req.admin,
          action: dryRun ? 'ADMIN_JOB_PREVIEW_CREATED' : 'ADMIN_JOB_QUEUED',
          target: { type: 'admin_job', id: String(job._id) },
          before: null,
          after: { type: job.type, status: job.status, targetCount: job.targetCount, sourcePreviewId: job.sourcePreviewId },
          reason: req.adminMutation.reason,
          request: { operationRequestId: req.adminMutation.requestId, requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') },
        });
        return { statusCode: 201, body: { success: true, data: sanitizeJobForRole(job, req.admin.role) } };
      },
    });
    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) { return next(error); }
});

router.get('/:jobId', requireAdminPermission('jobs.read'), async (req, res, next) => {
  try { return res.json({ success: true, data: sanitizeJobForRole(await loadJob(req.params.jobId), req.admin.role) }); }
  catch (error) { return next(error); }
});

router.post('/:jobId/cancel', requireAdminPermission('jobs.cancel'), requireAdminMutationContext(), async (req, res, next) => {
  try {
    const outcome = await executeIdempotentAdminOperation({
      actorId: req.admin.id,
      operation: 'admin_job.cancel',
      requestId: req.adminMutation.requestId,
      payload: { jobId: req.params.jobId, reason: req.adminMutation.reason },
      execute: async () => {
        const job = await cancelAdminJob({
          actor: req.admin,
          jobId: req.params.jobId,
          mutation: req.adminMutation,
          request: { requestId: req.requestId, ip: req.ip, userAgent: req.get('user-agent') },
        });
        return { statusCode: 200, body: { success: true, data: sanitizeJobForRole(job, req.admin.role), warning: 'Hủy job không rollback các dòng đã hoàn tất.' } };
      },
    });
    if (outcome.replayed) res.setHeader('Idempotency-Replayed', 'true');
    return res.status(outcome.statusCode).json(outcome.body);
  } catch (error) { return next(error); }
});

router.get('/:jobId/output', requireAdminPermission('jobs.read'), async (req, res, next) => {
  try {
    const job = await loadJob(req.params.jobId);
    const artifactPermission = getJobArtifactPermission(job.type);
    if (!req.admin.permissions.includes(artifactPermission)) throw new ApiError(403, 'ADMIN_PERMISSION_DENIED', 'Bạn không có quyền tải file kết quả của job này.', { permission: artifactPermission });
    if (!job.output?.content) throw new ApiError(409, 'STATE_CONFLICT', 'Job chưa có file kết quả.');
    res.setHeader('Content-Type', job.output.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(job.output.filename || 'admin-job-output.csv').replaceAll('"', '')}"`);
    return res.send(job.output.content);
  } catch (error) { return next(error); }
});

router.get('/:jobId/errors', requireAdminPermission('jobs.read'), async (req, res, next) => {
  try {
    const job = await loadJob(req.params.jobId);
    const artifactPermission = getJobArtifactPermission(job.type);
    if (!req.admin.permissions.includes(artifactPermission)) throw new ApiError(403, 'ADMIN_PERMISSION_DENIED', 'Bạn không có quyền tải file lỗi của job này.', { permission: artifactPermission });
    if (!job.errorOutput?.content) throw new ApiError(409, 'STATE_CONFLICT', 'Job không có file lỗi.');
    res.setHeader('Content-Type', job.errorOutput.contentType || 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${String(job.errorOutput.filename || 'admin-job-errors.csv').replaceAll('"', '')}"`);
    return res.send(job.errorOutput.content);
  } catch (error) { return next(error); }
});

module.exports = router;
