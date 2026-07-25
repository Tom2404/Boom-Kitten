const AdminJob = require('../../models/AdminJob');
const AuditLog = require('../../models/AuditLog');
const { buildAuditFilter, sanitizeAuditRowsForRole, serializeAuditCsv } = require('./auditQueryService');
const { createAdminAudit, redactAuditValue } = require('./auditService');
const { ApiError } = require('../../utils/apiResponse');
const { handlePlayerBulkAdjust, handlePlayersExport } = require('./playerBulkJobService');

const LEASE_MS = 60 * 1000;

function plainJob(job) {
  return job?.toObject ? job.toObject() : { ...job };
}

function sanitizeJobForRole(job, role) {
  const safe = redactAuditValue(plainJob(job));
  if (role === 'analyst') {
    delete safe.query;
    delete safe.operation;
    delete safe.errorOutput;
    if (safe.output && ['audit_export', 'players_export'].includes(safe.type)) safe.output = { filename: safe.output.filename, contentType: safe.output.contentType, available: Boolean(safe.output.content) };
    else delete safe.output;
  } else {
    if (safe.output) safe.output = { filename: safe.output.filename, contentType: safe.output.contentType, available: Boolean(safe.output.content) };
    if (safe.errorOutput) safe.errorOutput = { filename: safe.errorOutput.filename, contentType: safe.errorOutput.contentType, available: Boolean(safe.errorOutput.content) };
  }
  return safe;
}

function getJobArtifactPermission(type) {
  if (type === 'audit_export') return 'audit.export';
  if (type === 'players_export') return 'players.export';
  return 'jobs.create';
}

async function handleAuditExport(job, { AuditLogModel = AuditLog } = {}) {
  const query = buildAuditFilter(job.query || {});
  const rawRows = await AuditLogModel.find(query).sort({ createdAt: -1, _id: -1 }).lean();
  const rows = sanitizeAuditRowsForRole(rawRows, job.actorRole);
  return {
    output: { filename: `boom-kitten-audit-${job._id}.csv`, contentType: 'text/csv; charset=utf-8', content: `\uFEFF${serializeAuditCsv(rows)}` },
    resultSummary: { exported: rows.length },
    progress: { total: rows.length, processed: rows.length, succeeded: rows.length, failed: 0 },
  };
}

async function cancelAdminJob({
  AdminJobModel = AdminJob,
  actor,
  jobId,
  mutation,
  request = {},
  audit = createAdminAudit,
  now = () => new Date(),
}) {
  const before = await AdminJobModel.findById(jobId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy Admin job.');
  if (!['queued', 'running'].includes(before.status)) throw new ApiError(409, 'STATE_CONFLICT', 'Chỉ có thể hủy job đang queued hoặc running.');
  const cancelledAt = now();
  const update = before.status === 'queued'
    ? { $set: { cancelRequestedAt: cancelledAt, status: 'cancelled', completedAt: cancelledAt } }
    : { $set: { cancelRequestedAt: cancelledAt } };
  const job = await AdminJobModel.findOneAndUpdate(
    { _id: jobId, status: { $in: ['queued', 'running'] } },
    update,
    { new: true },
  );
  if (!job) throw new ApiError(409, 'STATE_CONFLICT', 'Trạng thái job đã thay đổi. Hãy tải lại.');
  await audit({
    actor,
    action: 'ADMIN_JOB_CANCEL_REQUESTED',
    target: { type: 'admin_job', id: String(job._id) },
    before: { status: before.status, cancelRequestedAt: before.cancelRequestedAt },
    after: { status: job.status, cancelRequestedAt: job.cancelRequestedAt },
    reason: mutation.reason,
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return job;
}

const DEFAULT_HANDLERS = { audit_export: handleAuditExport, player_bulk_adjust: handlePlayerBulkAdjust, players_export: handlePlayersExport };

async function processNextAdminJob({ AdminJobModel = AdminJob, handlers = DEFAULT_HANDLERS, now = () => new Date() } = {}) {
  const claimedAt = now();
  const job = await AdminJobModel.findOneAndUpdate(
    { $or: [{ status: 'queued' }, { status: 'running', leaseExpiresAt: { $lt: claimedAt } }] },
    { $set: { status: 'running', startedAt: claimedAt, leaseExpiresAt: new Date(claimedAt.getTime() + LEASE_MS) } },
    { new: true, sort: { createdAt: 1 } },
  );
  if (!job) return null;
  try {
    const handler = handlers[job.type];
    if (!handler) throw new Error(`Unsupported admin job type: ${job.type}`);
    const result = await handler(job);
    job.status = result.status === 'cancelled' ? 'cancelled' : 'completed';
    job.output = result.output;
    job.errorOutput = result.errorOutput;
    job.resultSummary = result.resultSummary;
    job.progress = result.progress || job.progress;
    job.completedAt = now();
    job.leaseExpiresAt = undefined;
  } catch (error) {
    job.status = 'failed';
    job.error = { code: error.code || 'JOB_EXECUTION_FAILED', message: error.message || 'Admin job failed' };
    job.completedAt = now();
    job.leaseExpiresAt = undefined;
  }
  await job.save();
  return job;
}

function startAdminJobWorker({ intervalMs = 2000 } = {}) {
  let active = false;
  const tick = async () => {
    if (active) return;
    active = true;
    try { while (await processNextAdminJob()) { /* drain durable queue */ } } catch (error) { console.error('Admin job worker failed:', error); }
    finally { active = false; }
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

async function enqueueAuditExport({ actor, filters, mutation }) {
  return AdminJob.create({
    type: 'audit_export', status: 'queued', actorId: actor.id, actorUsername: actor.username, actorRole: actor.role,
    query: filters, reason: mutation.reason || 'Export audit logs', requestId: mutation.requestId,
  });
}

module.exports = { DEFAULT_HANDLERS, cancelAdminJob, enqueueAuditExport, getJobArtifactPermission, handleAuditExport, processNextAdminJob, sanitizeJobForRole, startAdminJobWorker };
