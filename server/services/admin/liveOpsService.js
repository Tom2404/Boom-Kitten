const LiveOpsConfig = require('../../models/LiveOpsConfig');
const LiveOpsState = require('../../models/LiveOpsState');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');

const LIVE_OPS_SCHEMA_VERSION = 1;
const DEFAULT_LIVE_OPS_CONFIG = Object.freeze({
  maintenanceMode: false,
  maxActiveRooms: 500,
  rewardMultiplier: 1,
  features: Object.freeze({ shop: true, missions: true, tournaments: true }),
});

let runtimeCache = null;
let runtimeCacheAt = 0;

function validateLiveOpsConfig(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { valid: false, errors: ['config phải là object.'] };
  if (typeof value.maintenanceMode !== 'boolean') errors.push('maintenanceMode phải là boolean.');
  if (!Number.isSafeInteger(value.maxActiveRooms) || value.maxActiveRooms < 1 || value.maxActiveRooms > 10000) errors.push('maxActiveRooms phải là số nguyên từ 1 đến 10000.');
  if (typeof value.rewardMultiplier !== 'number' || !Number.isFinite(value.rewardMultiplier) || value.rewardMultiplier < 0 || value.rewardMultiplier > 10) errors.push('rewardMultiplier phải từ 0 đến 10.');
  if (!value.features || typeof value.features !== 'object' || Array.isArray(value.features)) errors.push('features phải là object.');
  for (const key of ['shop', 'missions', 'tournaments']) if (typeof value.features?.[key] !== 'boolean') errors.push(`features.${key} phải là boolean.`);
  const allowed = new Set(['maintenanceMode', 'maxActiveRooms', 'rewardMultiplier', 'features']);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`Trường config không được hỗ trợ: ${key}.`);
  const featureAllowed = new Set(['shop', 'missions', 'tournaments']);
  for (const key of Object.keys(value.features || {})) if (!featureAllowed.has(key)) errors.push(`Feature flag không được hỗ trợ: ${key}.`);
  return { valid: errors.length === 0, errors };
}

function normalizeLiveOpsConfig(value) {
  const inputValidation = validateLiveOpsConfig(value);
  if (!inputValidation.valid) throw new ApiError(422, 'VALIDATION_ERROR', 'Cấu hình Live Ops không hợp lệ.', { fields: inputValidation.errors });
  const normalized = {
    maintenanceMode: value.maintenanceMode,
    maxActiveRooms: Number(value.maxActiveRooms),
    rewardMultiplier: Number(value.rewardMultiplier),
    features: { shop: value.features.shop, missions: value.features.missions, tournaments: value.features.tournaments },
  };
  return normalized;
}

async function nextVersion(ConfigModel) {
  const latest = await ConfigModel.findOne().sort({ version: -1 }).select('version').lean();
  return (latest?.version || 0) + 1;
}

async function createLiveOpsDraft({ ConfigModel = LiveOpsConfig, StateModel = LiveOpsState, audit = createAdminAudit, actor, config, mutation, request = {} }) {
  const normalized = normalizeLiveOpsConfig(config);
  const version = await nextVersion(ConfigModel);
  let draft;
  try { draft = await ConfigModel.create({ version, schemaVersion: LIVE_OPS_SCHEMA_VERSION, status: 'draft', config: normalized, createdBy: actor.id }); }
  catch (error) { if (error?.code === 11000) throw new ApiError(409, 'STATE_CONFLICT', 'Version Live Ops vừa thay đổi. Hãy thử lại.'); throw error; }
  const state = await StateModel.findOne({ key: 'global' }).lean();
  await audit({ actor, action: 'LIVE_OPS_DRAFT_CREATED', target: { type: 'live_ops_config', id: String(draft._id) }, before: { activeVersion: state?.activeVersion || 0 }, after: { version, config: normalized }, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return draft;
}

async function validateLiveOpsDraft({ ConfigModel = LiveOpsConfig, audit = createAdminAudit, actor, configId, expectedVersion, mutation, request = {}, now = new Date() }) {
  const draft = await ConfigModel.findById(configId);
  if (!draft) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy Live Ops config.');
  if (draft.status === 'published') throw new ApiError(409, 'STATE_CONFLICT', 'Config đã publish là immutable.');
  const validation = validateLiveOpsConfig(draft.config);
  const updated = await ConfigModel.findOneAndUpdate({ _id: configId, __v: Number(expectedVersion), status: { $in: ['draft', 'validated'] } }, { $set: { status: validation.valid ? 'validated' : 'draft', validation: { ...validation, validatedAt: now } }, $inc: { __v: 1 } }, { new: true });
  if (!updated) throw new ApiError(409, 'STATE_CONFLICT', 'Config vừa thay đổi. Hãy tải lại.');
  await audit({ actor, action: 'LIVE_OPS_CONFIG_VALIDATED', target: { type: 'live_ops_config', id: String(configId) }, before: { status: draft.status }, after: { status: updated.status, validation }, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return updated;
}

function invalidateLiveOpsCache() { runtimeCache = null; runtimeCacheAt = 0; }

async function publishLiveOpsConfig({ ConfigModel = LiveOpsConfig, StateModel = LiveOpsState, audit = createAdminAudit, actor, configId, expectedVersion, expectedStateVersion, mutation, request = {}, now = new Date() }) {
  const candidate = await ConfigModel.findOne({ _id: configId, __v: Number(expectedVersion), status: 'validated', 'validation.valid': true });
  if (!candidate) throw new ApiError(409, 'STATE_CONFLICT', 'Config chưa validated hoặc vừa thay đổi.');
  const stateFilter = Number(expectedStateVersion) === 0
    ? { key: 'global', $or: [{ stateVersion: 0 }, { stateVersion: { $exists: false } }] }
    : { key: 'global', stateVersion: Number(expectedStateVersion) };
  let state;
  try { state = await StateModel.findOneAndUpdate(stateFilter, { $set: { activeConfigId: candidate._id, activeVersion: candidate.version, publishedAt: now }, $inc: { stateVersion: 1 } }, { new: true, upsert: Number(expectedStateVersion) === 0, setDefaultsOnInsert: true }); }
  catch (error) { if (error?.code === 11000) throw new ApiError(409, 'STATE_CONFLICT', 'Active config vừa thay đổi. Hãy tải lại.'); throw error; }
  if (!state) throw new ApiError(409, 'STATE_CONFLICT', 'Active config vừa thay đổi. Draft vẫn được giữ nguyên để thử lại.');
  const config = await ConfigModel.findOneAndUpdate({ _id: candidate._id, __v: Number(expectedVersion), status: 'validated' }, { $set: { status: 'published', publishedBy: actor.id, publishedAt: now }, $inc: { __v: 1 } }, { new: true });
  if (!config) throw new ApiError(409, 'STATE_CONFLICT', 'Config đã active nhưng metadata publish chưa cập nhật; cần kiểm tra vận hành.');
  invalidateLiveOpsCache();
  await audit({ actor, action: 'LIVE_OPS_CONFIG_PUBLISHED', target: { type: 'live_ops_config', id: String(config._id) }, before: { stateVersion: Number(expectedStateVersion) }, after: { activeVersion: config.version, stateVersion: state.stateVersion, config: config.config }, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return { config, state };
}

async function rollbackLiveOpsConfig({ ConfigModel = LiveOpsConfig, StateModel = LiveOpsState, audit = createAdminAudit, actor, targetVersion, expectedStateVersion, mutation, request = {}, now = new Date() }) {
  const target = await ConfigModel.findOne({ version: Number(targetVersion), status: 'published' }).lean();
  if (!target) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy version đã publish để rollback.');
  const version = await nextVersion(ConfigModel);
  const rollback = await ConfigModel.create({ version, schemaVersion: LIVE_OPS_SCHEMA_VERSION, status: 'published', config: normalizeLiveOpsConfig(target.config), validation: { valid: true, errors: [], validatedAt: now }, createdBy: actor.id, publishedBy: actor.id, publishedAt: now, rollbackOf: target.version });
  const state = await StateModel.findOneAndUpdate({ key: 'global', stateVersion: Number(expectedStateVersion) }, { $set: { activeConfigId: rollback._id, activeVersion: version, publishedAt: now }, $inc: { stateVersion: 1 } }, { new: true });
  if (!state) throw new ApiError(409, 'STATE_CONFLICT', 'Active config vừa thay đổi. Rollback copy đã được giữ lại nhưng chưa áp dụng.');
  invalidateLiveOpsCache();
  await audit({ actor, action: 'LIVE_OPS_CONFIG_ROLLED_BACK', target: { type: 'live_ops_config', id: String(rollback._id) }, before: { stateVersion: Number(expectedStateVersion) }, after: { activeVersion: version, rollbackOf: target.version, stateVersion: state.stateVersion, config: rollback.config }, reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
  return { config: rollback, state };
}

async function getRuntimeLiveOpsConfig({ ConfigModel = LiveOpsConfig, StateModel = LiveOpsState, now = Date.now(), cacheMs = 10000 } = {}) {
  if (runtimeCache && now - runtimeCacheAt < cacheMs) return runtimeCache;
  try {
    const state = await StateModel.findOne({ key: 'global' }).lean();
    const config = state?.activeConfigId ? await ConfigModel.findById(state.activeConfigId).lean() : null;
    if (!config || config.schemaVersion !== LIVE_OPS_SCHEMA_VERSION) throw new Error('No compatible published config');
    const validation = validateLiveOpsConfig(config.config);
    if (!validation.valid) throw new Error('Published config is invalid');
    runtimeCache = { schemaVersion: LIVE_OPS_SCHEMA_VERSION, version: config.version, stateVersion: state.stateVersion, config: normalizeLiveOpsConfig(config.config), fallback: false };
  } catch {
    runtimeCache = { schemaVersion: LIVE_OPS_SCHEMA_VERSION, version: 0, stateVersion: 0, config: { ...DEFAULT_LIVE_OPS_CONFIG, features: { ...DEFAULT_LIVE_OPS_CONFIG.features } }, fallback: true };
  }
  runtimeCacheAt = now;
  return runtimeCache;
}

module.exports = { DEFAULT_LIVE_OPS_CONFIG, LIVE_OPS_SCHEMA_VERSION, createLiveOpsDraft, getRuntimeLiveOpsConfig, invalidateLiveOpsCache, normalizeLiveOpsConfig, publishLiveOpsConfig, rollbackLiveOpsConfig, validateLiveOpsConfig, validateLiveOpsDraft };
