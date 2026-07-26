const { randomUUID } = require('node:crypto');
const AdminJob = require('../../models/AdminJob');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const { ApiError } = require('../../utils/apiResponse');
const { getAdminPolicy } = require('../../utils/adminPermissions');
const { createAdminAudit } = require('./auditService');
const { csvCell } = require('./auditQueryService');
const { previewCurrencyAdjustment } = require('./economyAdjustmentService');
const { executeIdempotentAdminOperation } = require('./idempotencyService');

const PLAYER_ROLES = new Set(['user', 'admin', 'super_admin', 'operator', 'moderator', 'analyst']);
const PLAYER_STATUSES = new Set(['active', 'banned']);
const PREVIEW_TTL_MS = 15 * 60 * 1000;
const MAX_PLAYER_EXPORT_TARGETS = 50000;
const MAX_INLINE_EXPORT_BYTES = 14 * 1024 * 1024;

function validation(message, fields) {
  return new ApiError(422, 'VALIDATION_ERROR', message, { fields });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseBoolean(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw validation(`${field} không hợp lệ.`, { [field]: 'Chỉ chấp nhận true hoặc false' });
}

function parseDate(value, field) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw validation('Khoảng ngày người chơi không hợp lệ.', { [field]: 'ISO date bắt buộc' });
  return date;
}

function buildPlayerBulkQuery(filters = {}) {
  const query = {};
  const search = typeof filters.search === 'string' ? filters.search.trim() : '';
  if (search) {
    if (search.length > 100) throw validation('Từ khóa quá dài.', { search: 'Tối đa 100 ký tự' });
    const escaped = escapeRegExp(search);
    query.$or = [{ username: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
  }
  if (filters.role !== undefined && filters.role !== '') {
    if (typeof filters.role !== 'string' || !PLAYER_ROLES.has(filters.role)) throw validation('Role không hợp lệ.', { role: 'Role không nằm trong allowlist' });
    query.role = filters.role;
  }
  if (filters.status !== undefined && filters.status !== '') {
    if (typeof filters.status !== 'string' || !PLAYER_STATUSES.has(filters.status)) throw validation('Trạng thái không hợp lệ.', { status: 'Chỉ hỗ trợ active hoặc banned' });
    query.isBanned = filters.status === 'banned';
  }
  const isOnline = parseBoolean(filters.isOnline, 'isOnline');
  if (isOnline !== undefined) query.isOnline = isOnline;
  const createdFrom = parseDate(filters.createdFrom, 'createdFrom');
  const createdTo = parseDate(filters.createdTo, 'createdTo');
  if (createdFrom && createdTo && createdFrom > createdTo) throw validation('Ngày bắt đầu phải trước ngày kết thúc.');
  if (createdFrom || createdTo) query.createdAt = { ...(createdFrom && { $gte: createdFrom }), ...(createdTo && { $lte: createdTo }) };
  return query;
}

function previewPlayerOperation(player, operation, policy) {
  if (!operation || typeof operation !== 'object') throw validation('Bulk operation là bắt buộc.', { operation: 'Payload operation không hợp lệ' });
  if (operation.type === 'currency') return previewCurrencyAdjustment({ ...operation, balances: player, policy });
  throw validation('Loại bulk operation không hợp lệ.', { type: 'Chỉ hỗ trợ currency' });
}

function getBulkOperationPermission(operation) {
  if (operation?.type === 'currency') return 'economy.adjust';
  throw validation('Loại bulk operation không hợp lệ.', { type: 'Chỉ hỗ trợ currency' });
}

async function createPlayerBulkPreview({
  UserModel = User,
  AdminJobModel = AdminJob,
  actor,
  filters = {},
  operation,
  mutation,
  policy = getAdminPolicy(actor.role),
  tokenFactory = randomUUID,
  now = () => new Date(),
}) {
  const query = buildPlayerBulkQuery(filters);
  const targetCount = await UserModel.countDocuments(query);
  const maxTargets = policy.maxBulkTargets ?? 1000;
  if (targetCount > maxTargets) {
    throw new ApiError(422, 'POLICY_LIMIT_EXCEEDED', `Query ảnh hưởng ${targetCount} người chơi, vượt giới hạn ${maxTargets}.`, { targetCount, maxTargets });
  }
  const players = targetCount
    ? await UserModel.find(query).select('_id username coins').sort({ _id: 1 }).lean()
    : [];
  let totalAbsoluteDelta = 0;
  let validTargets = 0;
  let invalidTargets = 0;
  const targetSample = [];
  for (const player of players) {
    try {
      const preview = previewPlayerOperation(player, operation, policy);
      validTargets += 1;
      totalAbsoluteDelta += Math.abs((preview.after ?? 0) - (preview.before ?? 0));
      if (targetSample.length < 10) targetSample.push({ id: String(player._id), username: player.username, before: preview.before, after: preview.after, valid: true });
    } catch (error) {
      invalidTargets += 1;
      if (targetSample.length < 10) targetSample.push({ id: String(player._id), username: player.username, valid: false, error: error.message });
    }
  }
  const createdAt = now();
  return AdminJobModel.create({
    type: 'player_bulk_adjust',
    status: 'preview',
    actorId: actor.id,
    actorUsername: actor.username,
    actorRole: actor.role,
    query: { filters, targetIds: players.map((player) => String(player._id)) },
    operation,
    reason: mutation.reason,
    requestId: mutation.requestId,
    previewToken: tokenFactory(),
    previewExpiresAt: new Date(createdAt.getTime() + PREVIEW_TTL_MS),
    targetCount,
    targetSample,
    progress: { total: targetCount, processed: 0, succeeded: 0, failed: 0 },
    resultSummary: { targetCount, validTargets, invalidTargets, totalAbsoluteDelta },
  });
}

async function enqueuePlayerBulkExecution({
  AdminJobModel = AdminJob,
  actor,
  previewToken,
  mutation,
  now = () => new Date(),
}) {
  if (typeof previewToken !== 'string' || !previewToken.trim()) throw validation('Preview token là bắt buộc.', { previewToken: 'Token không hợp lệ' });
  const consumedAt = now();
  const preview = await AdminJobModel.findOneAndUpdate(
    {
      actorId: actor.id,
      type: 'player_bulk_adjust',
      status: 'preview',
      previewToken: previewToken.trim(),
      previewExpiresAt: { $gt: consumedAt },
      previewConsumedAt: null,
    },
    { $set: { previewConsumedAt: consumedAt } },
    { new: false },
  );
  if (!preview) throw new ApiError(409, 'STATE_CONFLICT', 'Preview không tồn tại, đã hết hạn hoặc đã được sử dụng.');
  return AdminJobModel.create({
    type: 'player_bulk_adjust',
    status: 'queued',
    actorId: actor.id,
    actorUsername: actor.username,
    actorRole: actor.role,
    query: preview.query,
    operation: preview.operation,
    reason: mutation.reason,
    requestId: mutation.requestId,
    sourcePreviewId: preview._id,
    targetCount: preview.targetCount,
    targetSample: preview.targetSample,
    progress: { total: preview.targetCount, processed: 0, succeeded: 0, failed: 0 },
    resultSummary: preview.resultSummary,
  });
}

function serializeBulkRows(rows) {
  const columns = ['targetId', 'username', 'status', 'before', 'after', 'errorCode', 'errorMessage'];
  return [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\r\n');
}

async function enqueuePlayersExport({ UserModel = User, AdminJobModel = AdminJob, actor, filters = {}, mutation }) {
  const query = buildPlayerBulkQuery(filters);
  const targetCount = await UserModel.countDocuments(query);
  if (targetCount > MAX_PLAYER_EXPORT_TARGETS) throw new ApiError(422, 'POLICY_LIMIT_EXCEEDED', `Export ảnh hưởng ${targetCount} người chơi, vượt giới hạn hệ thống ${MAX_PLAYER_EXPORT_TARGETS}.`, { targetCount, maxTargets: MAX_PLAYER_EXPORT_TARGETS });
  return AdminJobModel.create({
    type: 'players_export', status: 'queued', actorId: actor.id, actorUsername: actor.username, actorRole: actor.role,
    query: { filters }, reason: mutation.reason || 'Export player query', requestId: mutation.requestId,
    targetCount, progress: { total: targetCount, processed: 0, succeeded: 0, failed: 0 },
  });
}

async function handlePlayersExport(job, { UserModel = User } = {}) {
  const query = buildPlayerBulkQuery(job.query?.filters || {});
  const players = await UserModel.find(query).select('_id username email role isBanned coins createdAt').sort({ _id: 1 }).lean();
  const columns = ['id', 'username', 'email', 'role', 'status', 'coins', 'createdAt'];
  const rows = players.map((player) => ({
    id: String(player._id), username: player.username, email: player.email, role: player.role,
    status: player.isBanned ? 'banned' : 'active', coins: player.coins, createdAt: player.createdAt,
  }));
  const content = `\uFEFF${[columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\r\n')}`;
  if (Buffer.byteLength(content, 'utf8') > MAX_INLINE_EXPORT_BYTES) throw new ApiError(422, 'EXPORT_TOO_LARGE', 'File export vượt giới hạn lưu trữ. Hãy thu hẹp bộ lọc.');
  return {
    output: { filename: `boom-kitten-players-${job._id}.csv`, contentType: 'text/csv; charset=utf-8', content },
    resultSummary: { exported: rows.length },
    progress: { total: rows.length, processed: rows.length, succeeded: rows.length, failed: 0 },
  };
}

async function handlePlayerBulkAdjust(job, {
  UserModel = User,
  TransactionModel = Transaction,
  audit = createAdminAudit,
  executeIdempotent = executeIdempotentAdminOperation,
  isCancellationRequested = async () => Boolean(await AdminJob.exists({ _id: job._id, cancelRequestedAt: { $ne: null } })),
} = {}) {
  const targetIds = Array.isArray(job.query?.targetIds)
    ? job.query.targetIds
    : (await UserModel.find(buildPlayerBulkQuery(job.query?.filters || job.query || {})).select('_id').sort({ _id: 1 }).lean()).map((item) => String(item._id));
  const rows = [];
  const progress = { total: targetIds.length, processed: 0, succeeded: 0, failed: 0 };
  job.progress = progress;
  const actor = { id: job.actorId, username: job.actorUsername, role: job.actorRole };
  const policy = getAdminPolicy(job.actorRole);

  for (const targetId of targetIds) {
    if (await isCancellationRequested(job)) {
      return {
        status: 'cancelled',
        progress,
        resultSummary: { ...progress, cancelled: true },
        output: { filename: `boom-kitten-bulk-${job._id}.csv`, contentType: 'text/csv; charset=utf-8', content: `\uFEFF${serializeBulkRows(rows)}` },
        errorOutput: progress.failed ? { filename: `boom-kitten-bulk-${job._id}-errors.csv`, contentType: 'text/csv; charset=utf-8', content: `\uFEFF${serializeBulkRows(rows.filter((row) => row.status === 'failed'))}` } : undefined,
      };
    }
    try {
      const outcome = await executeIdempotent({
        actorId: job.actorId,
        operation: `job.player_bulk_adjust.${job.operation.type}`,
        requestId: `${job.requestId}:${targetId}`,
        payload: { targetId, operation: job.operation, reason: job.reason },
        execute: async () => {
          const beforeUser = await UserModel.findById(targetId);
          if (!beforeUser) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');
          const preview = previewPlayerOperation(beforeUser, job.operation, policy);
          const field = preview.field;
          const setFields = { [field]: preview.after };
          const updated = await UserModel.findOneAndUpdate(
            { _id: targetId, __v: beforeUser.__v },
            { $set: setFields, $inc: { __v: 1 } },
            { new: true, runValidators: true },
          );
          if (!updated) throw new ApiError(409, 'STATE_CONFLICT', 'Dữ liệu người chơi đã thay đổi trong lúc xử lý.');
          const currency = job.operation.currency;
          await TransactionModel.create({
            userId: updated._id,
            type: 'admin_adjust',
            amount: Math.abs(preview.after - preview.before),
            currency,
            balanceBefore: preview.before,
            balanceAfter: preview.after,
            source: `admin_job:${job._id}`,
            createdBy: job.actorUsername,
            description: `Admin bulk ${job.operation.type} adjustment (${job.reason})`,
          });
          await audit({
            actor,
            action: 'PLAYER_CURRENCY_ADJUSTED',
            target: { type: 'user', id: String(updated._id) },
            before: { [field]: preview.before, jobId: String(job._id) },
            after: { [field]: preview.after, jobId: String(job._id) },
            reason: job.reason,
            request: { operationRequestId: `${job.requestId}:${targetId}` },
          });
          return { statusCode: 200, body: { success: true, data: { targetId: String(updated._id), username: updated.username || beforeUser.username, before: preview.before, after: preview.after } } };
        },
      });
      const data = outcome.body.data;
      rows.push({ targetId, username: data.username, status: 'completed', before: data.before, after: data.after });
      progress.succeeded += 1;
    } catch (error) {
      rows.push({ targetId, status: 'failed', errorCode: error.code || 'JOB_ROW_FAILED', errorMessage: error.message });
      progress.failed += 1;
    }
    progress.processed += 1;
    job.progress = { ...progress };
    await job.save();
  }

  return {
    progress,
    resultSummary: { ...progress, partialFailure: progress.failed > 0 },
    output: { filename: `boom-kitten-bulk-${job._id}.csv`, contentType: 'text/csv; charset=utf-8', content: `\uFEFF${serializeBulkRows(rows)}` },
    errorOutput: progress.failed ? { filename: `boom-kitten-bulk-${job._id}-errors.csv`, contentType: 'text/csv; charset=utf-8', content: `\uFEFF${serializeBulkRows(rows.filter((row) => row.status === 'failed'))}` } : undefined,
  };
}

module.exports = {
  PREVIEW_TTL_MS,
  MAX_PLAYER_EXPORT_TARGETS,
  buildPlayerBulkQuery,
  createPlayerBulkPreview,
  enqueuePlayerBulkExecution,
  enqueuePlayersExport,
  getBulkOperationPermission,
  handlePlayerBulkAdjust,
  handlePlayersExport,
  previewPlayerOperation,
  serializeBulkRows,
};
