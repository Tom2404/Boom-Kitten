const Season = require('../../models/Season');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');

const RESET_STRATEGIES = ['soft_reset_ratio', 'soft_reset_tiered', 'hard_reset'];
const SEASON_STATUSES = ['scheduled', 'active', 'ended'];

function toPlain(value) {
  return value?.toObject ? value.toObject() : value;
}

function validateSeason(input, { creating = false } = {}) {
  const fields = {};
  if (creating && (!Number.isInteger(Number(input.seasonNumber)) || Number(input.seasonNumber) < 1)) fields.seasonNumber = 'Phải là số nguyên dương';
  if (creating && !input.name?.trim()) fields.name = 'Bắt buộc';
  if (creating && !input.startDate) fields.startDate = 'Bắt buộc';
  if (creating && !input.endDate) fields.endDate = 'Bắt buộc';
  if (input.startDate && Number.isNaN(new Date(input.startDate).getTime())) fields.startDate = 'Ngày không hợp lệ';
  if (input.endDate && Number.isNaN(new Date(input.endDate).getTime())) fields.endDate = 'Ngày không hợp lệ';
  if (input.startDate && input.endDate && new Date(input.endDate) <= new Date(input.startDate)) fields.endDate = 'Phải sau ngày bắt đầu';
  if (input.resetStrategy && !RESET_STRATEGIES.includes(input.resetStrategy)) fields.resetStrategy = 'Không hợp lệ';
  if (input.status && !SEASON_STATUSES.includes(input.status)) fields.status = 'Không hợp lệ';
  if (input.softResetRatio !== undefined && (Number(input.softResetRatio) < 0 || Number(input.softResetRatio) > 1)) fields.softResetRatio = 'Phải từ 0 đến 1';
  if (input.resetEloValue !== undefined && Number(input.resetEloValue) < 1000) fields.resetEloValue = 'Tối thiểu 1000';
  if (Object.keys(fields).length) throw new ApiError(422, 'VALIDATION_ERROR', 'Thông tin mùa giải không hợp lệ.', { fields });
}

function createPayload(input, actor) {
  return {
    seasonNumber: Number(input.seasonNumber),
    name: input.name.trim(),
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    settings: {
      resetStrategy: input.resetStrategy || 'soft_reset_ratio',
      softResetRatio: input.softResetRatio !== undefined ? Number(input.softResetRatio) : 0.5,
      resetEloValue: input.resetEloValue !== undefined ? Number(input.resetEloValue) : 1000,
    },
    createdBy: actor.id,
  };
}

function updatePayload(input) {
  const payload = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.startDate !== undefined) payload.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) payload.endDate = new Date(input.endDate);
  if (input.status !== undefined) payload.status = input.status;
  if (input.resetStrategy !== undefined) payload['settings.resetStrategy'] = input.resetStrategy;
  if (input.softResetRatio !== undefined) payload['settings.softResetRatio'] = Number(input.softResetRatio);
  if (input.resetEloValue !== undefined) payload['settings.resetEloValue'] = Number(input.resetEloValue);
  return payload;
}

async function createSeason({ SeasonModel = Season, audit = createAdminAudit, actor, input, mutation, request = {} }) {
  validateSeason(input, { creating: true });
  if (await SeasonModel.findOne({ seasonNumber: Number(input.seasonNumber) })) throw new ApiError(409, 'RESOURCE_CONFLICT', `Mùa giải số ${input.seasonNumber} đã tồn tại.`);
  const season = await SeasonModel.create(createPayload(input, actor));
  await audit({ actor, action: 'SEASON_CREATED', target: { type: 'season', id: String(season._id) }, after: toPlain(season), reason: mutation.reason || `Scheduled season ${input.seasonNumber}`, request: { ...request, operationRequestId: mutation.requestId } });
  return season;
}

async function updateSeason({ SeasonModel = Season, audit = createAdminAudit, actor, seasonId, input, mutation, request = {} }) {
  const before = await SeasonModel.findById(seasonId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy mùa giải.');
  if (before.isResetExecuted && input.status === 'active') throw new ApiError(409, 'STATE_CONFLICT', 'Không thể kích hoạt lại mùa giải đã chạy reset.');
  validateSeason({
    ...input,
    startDate: input.startDate ?? before.startDate,
    endDate: input.endDate ?? before.endDate,
  });
  const season = await SeasonModel.findOneAndUpdate(
    { _id: seasonId, __v: before.__v },
    { $set: updatePayload(input), $inc: { __v: 1 } },
    { new: true, runValidators: true },
  );
  if (!season) throw new ApiError(409, 'STATE_CONFLICT', 'Mùa giải đã thay đổi. Hãy tải lại.');
  await audit({ actor, action: 'SEASON_UPDATED', target: { type: 'season', id: String(season._id) }, before: toPlain(before), after: toPlain(season), reason: mutation.reason || 'Updated season details', request: { ...request, operationRequestId: mutation.requestId } });
  return season;
}

async function deleteSeason({ SeasonModel = Season, audit = createAdminAudit, actor, seasonId, mutation, request = {} }) {
  const before = await SeasonModel.findById(seasonId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy mùa giải.');
  if (before.status !== 'scheduled' || before.isResetExecuted) throw new ApiError(409, 'STATE_CONFLICT', 'Chỉ có thể xóa mùa giải chưa bắt đầu và chưa kết toán.');
  const filter = { _id: seasonId, __v: before.__v, status: 'scheduled', isResetExecuted: false };
  const result = await SeasonModel.deleteOne(filter);
  if (result.deletedCount !== 1) throw new ApiError(409, 'STATE_CONFLICT', 'Mùa giải đã thay đổi. Hãy tải lại.');
  await audit({ actor, action: 'SEASON_DELETED', target: { type: 'season', id: String(before._id) }, before: toPlain(before), reason: mutation.reason, request: { ...request, operationRequestId: mutation.requestId } });
}

module.exports = { createSeason, deleteSeason, updateSeason, validateSeason };
