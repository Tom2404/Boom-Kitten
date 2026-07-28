const { ApiError } = require('../../utils/apiResponse');

const SCOPE_PERMISSIONS = Object.freeze({ players: 'players.read' });
const ALLOWED_FILTERS = ['search', 'role', 'status', 'sortBy', 'sortOrder'];
const ROLES = new Set(['user', 'admin', 'super_admin']);
const STATUSES = new Set(['active', 'banned', 'deleted']);
const SORT_FIELDS = new Set(['createdAt', 'username', 'coins']);
const SORT_ORDERS = new Set(['asc', 'desc']);

function invalid(message, fields) {
  return new ApiError(422, 'VALIDATION_ERROR', message, { fields });
}

function getSavedViewScopePermission(scope) {
  if (scope !== 'players') throw invalid('Saved view scope không hợp lệ.', { scope: 'Chỉ hỗ trợ players' });
  return SCOPE_PERMISSIONS.players;
}

function sanitizeSavedViewName(name) {
  const value = typeof name === 'string' ? name.trim() : '';
  if (!value || value.length > 80) throw invalid('Tên saved view không hợp lệ.', { name: 'Bắt buộc, tối đa 80 ký tự' });
  return value;
}

function normalizeSavedViewFilters(scope, input = {}, schemaVersion = 1) {
  getSavedViewScopePermission(scope);
  if (![0, 1].includes(Number(schemaVersion))) throw invalid('Saved view schema version không được hỗ trợ.', { schemaVersion: 'Chỉ hỗ trợ version 0 hoặc 1' });
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) {
    throw invalid('Bộ lọc saved view không hợp lệ.', { filters: 'Object bắt buộc' });
  }
  for (const [key, value] of Object.entries(input)) {
    if (!['string', 'number', 'boolean'].includes(typeof value) && value !== null && value !== undefined) {
      throw invalid('Bộ lọc saved view chứa giá trị không hợp lệ.', { [key]: 'Chỉ hỗ trợ scalar value' });
    }
  }
  const source = { ...input };
  if (Number(schemaVersion) === 0 && source.q && !source.search) source.search = source.q;
  const normalized = Object.fromEntries(ALLOWED_FILTERS.flatMap((key) => source[key] === '' || source[key] === null || source[key] === undefined ? [] : [[key, source[key]]]));
  if (normalized.search && (typeof normalized.search !== 'string' || normalized.search.length > 100)) throw invalid('Search không hợp lệ.', { search: 'Tối đa 100 ký tự' });
  if (normalized.role && !ROLES.has(normalized.role)) throw invalid('Role không hợp lệ.', { role: 'Ngoài allowlist' });
  if (normalized.status && !STATUSES.has(normalized.status)) throw invalid('Status không hợp lệ.', { status: 'Ngoài allowlist' });
  if (normalized.sortBy && !SORT_FIELDS.has(normalized.sortBy)) throw invalid('Sort field không hợp lệ.', { sortBy: 'Ngoài allowlist' });
  if (normalized.sortOrder && !SORT_ORDERS.has(normalized.sortOrder)) throw invalid('Sort order không hợp lệ.', { sortOrder: 'Ngoài allowlist' });
  return normalized;
}

module.exports = { SCOPE_PERMISSIONS, getSavedViewScopePermission, normalizeSavedViewFilters, sanitizeSavedViewName };
