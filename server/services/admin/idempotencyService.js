const { createHash } = require('node:crypto');
const AdminOperation = require('../../models/AdminOperation');
const { ApiError } = require('../../utils/apiResponse');

const OPERATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.keys(value).sort().reduce((result, key) => {
      if (value[key] !== undefined) result[key] = stableValue(value[key]);
      return result;
    }, {});
  }
  return value;
}

function hashOperationPayload(payload) {
  return createHash('sha256').update(JSON.stringify(stableValue(payload))).digest('hex');
}

async function beginAdminOperation({
  OperationModel = AdminOperation,
  actorId,
  operation,
  requestId,
  payload,
}) {
  const payloadHash = hashOperationPayload(payload);
  try {
    const record = await OperationModel.create({ actorId, operation, requestId, payloadHash, status: 'pending' });
    return { replayed: false, record };
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }

  const existing = await OperationModel.findOne({ actorId, operation, requestId });
  if (!existing || existing.payloadHash !== payloadHash) {
    throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'requestId đã được dùng cho payload khác.');
  }
  if (existing.status !== 'completed') {
    throw new ApiError(409, 'IDEMPOTENCY_IN_PROGRESS', 'Thao tác có requestId này đang được xử lý.');
  }
  return {
    replayed: true,
    statusCode: existing.responseStatus,
    body: existing.responseBody,
  };
}

async function executeIdempotentAdminOperation({
  OperationModel = AdminOperation,
  actorId,
  operation,
  requestId,
  payload,
  execute,
  now = () => new Date(),
}) {
  const claim = await beginAdminOperation({ OperationModel, actorId, operation, requestId, payload });
  if (claim.replayed) return claim;

  let result;
  try {
    result = await execute();
  } catch (error) {
    if (!error?.isOperational) throw error;
    const errorBody = { error: { code: error.code, message: error.message } };
    if (error.details !== undefined) errorBody.error.details = error.details;
    claim.record.status = 'completed';
    claim.record.responseStatus = error.statusCode;
    claim.record.responseBody = errorBody;
    claim.record.completedAt = now();
    claim.record.expiresAt = new Date(claim.record.completedAt.getTime() + OPERATION_RETENTION_MS);
    await claim.record.save();
    throw error;
  }
  claim.record.status = 'completed';
  claim.record.responseStatus = result.statusCode;
  claim.record.responseBody = result.body;
  claim.record.completedAt = now();
  claim.record.expiresAt = new Date(claim.record.completedAt.getTime() + OPERATION_RETENTION_MS);
  await claim.record.save();

  return { replayed: false, statusCode: result.statusCode, body: result.body };
}

module.exports = {
  OPERATION_RETENTION_MS,
  beginAdminOperation,
  executeIdempotentAdminOperation,
  hashOperationPayload,
};
