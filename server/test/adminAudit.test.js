const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createAdminAudit,
  redactAuditValue,
} = require('../services/admin/auditService');

test('redacts authentication and hidden game-state fields recursively', () => {
  const value = redactAuditValue({
    username: 'player-one',
    passwordHash: 'hash',
    nested: {
      accessToken: 'token',
      deck: ['exploding-kitten'],
      profile: { eloPoints: 1200 },
    },
  });

  assert.deepEqual(value, {
    username: 'player-one',
    passwordHash: '[REDACTED]',
    nested: {
      accessToken: '[REDACTED]',
      deck: '[REDACTED]',
      profile: { eloPoints: 1200 },
    },
  });
});

test('creates a normalized audit record with actor and request context', async () => {
  let stored;
  const AuditLogModel = {
    create: async (entry) => {
      stored = entry;
      return entry;
    },
  };

  await createAdminAudit({
    AuditLogModel,
    actor: { id: 'admin-1', username: 'root-cat', role: 'super_admin' },
    action: 'PLAYER_ROLE_CHANGED',
    target: { type: 'user', id: 'player-1' },
    before: { role: 'user', refreshToken: 'secret' },
    after: { role: 'operator' },
    reason: 'Approved operations access',
    request: {
      requestId: 'transport-1',
      operationRequestId: 'operation-1',
      ip: '127.0.0.1',
      userAgent: 'Admin Browser',
    },
  });

  assert.deepEqual(stored, {
    adminId: 'admin-1',
    actorUsername: 'root-cat',
    actorRole: 'super_admin',
    action: 'PLAYER_ROLE_CHANGED',
    targetType: 'user',
    targetId: 'player-1',
    before: { role: 'user', refreshToken: '[REDACTED]' },
    after: { role: 'operator' },
    reason: 'Approved operations access',
    requestId: 'operation-1',
    transportRequestId: 'transport-1',
    ip: '127.0.0.1',
    userAgent: 'Admin Browser',
  });
});
