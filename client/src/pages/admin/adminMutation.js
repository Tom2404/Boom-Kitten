export function createAdminOperationRequestId(generateId = () => globalThis.crypto.randomUUID()) {
  return `adm_${generateId()}`;
}

export function buildRoleChangePayload({ role, reason, confirmationUsername, requestId }) {
  return {
    role,
    reason: reason.trim(),
    requestId,
    confirmation: { username: confirmationUsername.trim() },
  };
}

export function buildRoutineAdminPayload(payload, requestId) {
  return { ...payload, requestId };
}

export function buildDeleteAdminPayload(reason, requestId) {
  return { reason: reason.trim(), requestId };
}

export function buildCriticalAdminPayload({ reason, confirmationUsername, requestId }) {
  return {
    reason: reason.trim(),
    requestId,
    confirmation: { username: confirmationUsername.trim() },
  };
}
