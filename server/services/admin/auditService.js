const AuditLog = require('../../models/AuditLog');

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY = /(password|token|authorization|cookie|secret|(^|_)(hand|deck|drawpile|draw_pile|private_state)($|_))/i;

function toPlainValue(value) {
  if (value && typeof value.toObject === 'function') return value.toObject();
  return value;
}

function redactAuditValue(value, seen = new WeakSet()) {
  const plainValue = toPlainValue(value);
  if (plainValue === null || plainValue === undefined) return plainValue;
  if (plainValue instanceof Date) return plainValue;
  if (Array.isArray(plainValue)) return plainValue.map((item) => redactAuditValue(item, seen));
  if (typeof plainValue !== 'object') return plainValue;
  if (seen.has(plainValue)) return '[CIRCULAR]';

  seen.add(plainValue);
  const result = {};
  for (const [key, item] of Object.entries(plainValue)) {
    result[key] = SENSITIVE_KEY.test(key) ? REDACTED : redactAuditValue(item, seen);
  }
  seen.delete(plainValue);
  return result;
}

async function createAdminAudit({
  AuditLogModel = AuditLog,
  actor,
  action,
  target,
  before,
  after,
  reason,
  request = {},
}) {
  return AuditLogModel.create({
    adminId: actor.id,
    actorUsername: actor.username,
    actorRole: actor.role,
    action,
    targetType: target.type,
    targetId: target.id,
    before: redactAuditValue(before),
    after: redactAuditValue(after),
    reason: reason.trim(),
    requestId: request.operationRequestId,
    transportRequestId: request.requestId,
    ip: request.ip,
    userAgent: request.userAgent,
  });
}

module.exports = {
  REDACTED,
  createAdminAudit,
  redactAuditValue,
};
