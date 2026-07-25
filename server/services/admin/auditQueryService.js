const AuditLog = require('../../models/AuditLog');
const { ApiError } = require('../../utils/apiResponse');

const FILTER_FIELDS = ['actorId', 'targetType', 'targetId', 'action'];

function buildAuditFilter(input = {}) {
  const filter = {};
  for (const field of FILTER_FIELDS) {
    const value = typeof input[field] === 'string' ? input[field].trim() : '';
    if (!value) continue;
    filter[field === 'actorId' ? 'adminId' : field] = value;
  }
  if (input.from || input.to) {
    const from = input.from ? new Date(input.from) : null;
    const to = input.to ? new Date(input.to) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) throw new ApiError(422, 'VALIDATION_ERROR', 'Khoảng thời gian audit không hợp lệ.', { fields: { from: 'ISO date bắt buộc', to: 'ISO date bắt buộc' } });
    if (from && to && from > to) throw new ApiError(422, 'VALIDATION_ERROR', 'Thời gian bắt đầu phải trước thời gian kết thúc.');
    filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  }
  return filter;
}

async function queryAuditLogs({ AuditLogModel = AuditLog, filters = {}, page = 1, limit = 20 } = {}) {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const query = buildAuditFilter(filters);
  const [items, total] = await Promise.all([
    AuditLogModel.find(query).populate('adminId', 'username email').sort({ createdAt: -1, _id: -1 }).skip((normalizedPage - 1) * normalizedLimit).limit(normalizedLimit).lean(),
    AuditLogModel.countDocuments(query),
  ]);
  return { items, pagination: { page: normalizedPage, limit: normalizedLimit, total, totalPages: Math.ceil(total / normalizedLimit) } };
}

function csvCell(value) {
  let text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function sanitizeAuditRowsForRole(rows, role) {
  return rows.map((item) => {
    const row = item?.toObject ? item.toObject() : { ...item };
    if (role === 'analyst') {
      delete row.ip;
      delete row.userAgent;
    }
    return row;
  });
}

function serializeAuditCsv(rows) {
  const columns = ['createdAt', 'actorUsername', 'actorRole', 'action', 'targetType', 'targetId', 'reason', 'requestId', 'transportRequestId', 'ip', 'before', 'after'];
  return [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\r\n');
}

module.exports = { buildAuditFilter, csvCell, queryAuditLogs, sanitizeAuditRowsForRole, serializeAuditCsv };
