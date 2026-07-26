const { ApiError } = require('../../utils/apiResponse');
const { buildAuditFilter } = require('./auditQueryService');
const { buildPlayerBulkQuery } = require('./playerBulkJobService');

const SCOPE_PERMISSIONS = Object.freeze({
  players: 'players.read',
  reports: 'moderation.read',
  logs: 'audit.read',
  rooms: 'rooms.read',
});

const ALLOWED_FILTERS = Object.freeze({
  players: ['search', 'role', 'status', 'isOnline', 'createdFrom', 'createdTo', 'sortBy', 'sortOrder'],
  reports: ['status', 'category', 'priority', 'assigneeId', 'targetPlayerId', 'from', 'to'],
  logs: ['logType', 'actorId', 'targetType', 'targetId', 'action', 'from', 'to', 'userId', 'type', 'transactionType', 'currency'],
  rooms: ['status', 'search', 'minAgeSeconds'],
});

const REPORT_STATUSES = new Set(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']);
const REPORT_CATEGORIES = new Set(['harassment', 'cheating', 'inappropriate_name', 'spam', 'other']);
const REPORT_PRIORITIES = new Set(['low', 'normal', 'high', 'critical']);
const ROOM_STATUSES = new Set(['waiting', 'playing', 'stale']);

function invalid(message, fields) {
  return new ApiError(422, 'VALIDATION_ERROR', message, { fields });
}

function getSavedViewScopePermission(scope) {
  const permission = SCOPE_PERMISSIONS[scope];
  if (!permission) throw invalid('Saved view scope không hợp lệ.', { scope: 'Chỉ hỗ trợ players, reports, logs hoặc rooms' });
  return permission;
}

function sanitizeSavedViewName(name) {
  const value = typeof name === 'string' ? name.trim() : '';
  if (!value || value.length > 80) throw invalid('Tên saved view không hợp lệ.', { name: 'Bắt buộc, tối đa 80 ký tự' });
  return value;
}

function primitiveFilters(filters) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters) || Object.getPrototypeOf(filters) !== Object.prototype) {
    throw invalid('Bộ lọc saved view không hợp lệ.', { filters: 'Object bắt buộc' });
  }
  for (const [key, value] of Object.entries(filters)) {
    if (!['string', 'number', 'boolean'].includes(typeof value) && value !== null && value !== undefined) {
      throw invalid('Bộ lọc saved view chứa giá trị không hợp lệ.', { [key]: 'Chỉ hỗ trợ scalar value' });
    }
  }
  return filters;
}

function validateReportFilters(filters) {
  if (filters.status && !REPORT_STATUSES.has(filters.status)) throw invalid('Report status không hợp lệ.', { status: 'Ngoài allowlist' });
  if (filters.category && !REPORT_CATEGORIES.has(filters.category)) throw invalid('Report category không hợp lệ.', { category: 'Ngoài allowlist' });
  if (filters.priority && !REPORT_PRIORITIES.has(filters.priority)) throw invalid('Report priority không hợp lệ.', { priority: 'Ngoài allowlist' });
  for (const field of ['from', 'to']) {
    if (filters[field] && Number.isNaN(new Date(filters[field]).getTime())) throw invalid('Khoảng ngày report không hợp lệ.', { [field]: 'ISO date bắt buộc' });
  }
}

function validateRoomFilters(filters) {
  if (filters.status && !ROOM_STATUSES.has(filters.status)) throw invalid('Room status không hợp lệ.', { status: 'Ngoài allowlist' });
  if (filters.search && (typeof filters.search !== 'string' || filters.search.length > 100)) throw invalid('Room search không hợp lệ.', { search: 'Tối đa 100 ký tự' });
  if (filters.minAgeSeconds !== undefined && (!Number.isSafeInteger(Number(filters.minAgeSeconds)) || Number(filters.minAgeSeconds) < 0)) throw invalid('Tuổi phòng không hợp lệ.', { minAgeSeconds: 'Số nguyên không âm bắt buộc' });
}

function normalizeSavedViewFilters(scope, input = {}, schemaVersion = 1) {
  getSavedViewScopePermission(scope);
  if (![0, 1].includes(Number(schemaVersion))) throw invalid('Saved view schema version không được hỗ trợ.', { schemaVersion: 'Chỉ hỗ trợ version 0 hoặc 1' });
  const source = { ...primitiveFilters(input) };
  if (Number(schemaVersion) === 0 && source.q && !source.search) source.search = source.q;
  const normalized = {};
  for (const key of ALLOWED_FILTERS[scope]) {
    const value = source[key];
    if (value !== '' && value !== null && value !== undefined) normalized[key] = value;
  }
  if (scope === 'players') buildPlayerBulkQuery(normalized);
  if (scope === 'logs') buildAuditFilter(normalized);
  if (scope === 'reports') validateReportFilters(normalized);
  if (scope === 'rooms') validateRoomFilters(normalized);
  return normalized;
}

module.exports = {
  SCOPE_PERMISSIONS,
  getSavedViewScopePermission,
  normalizeSavedViewFilters,
  sanitizeSavedViewName,
};
