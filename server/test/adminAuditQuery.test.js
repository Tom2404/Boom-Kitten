const test = require('node:test');
const assert = require('node:assert/strict');

const { buildAuditFilter, queryAuditLogs, sanitizeAuditRowsForRole, serializeAuditCsv } = require('../services/admin/auditQueryService');

test('builds the approved actor, target, action and time audit filter', () => {
  assert.deepEqual(buildAuditFilter({ actorId: '507f1f77bcf86cd799439011', targetType: 'user', targetId: 'u-1', action: 'PLAYER_BANNED', from: '2026-07-01', to: '2026-07-31T23:59:59Z' }), {
    adminId: '507f1f77bcf86cd799439011', targetType: 'user', targetId: 'u-1', action: 'PLAYER_BANNED',
    createdAt: { $gte: new Date('2026-07-01'), $lte: new Date('2026-07-31T23:59:59Z') },
  });
  assert.throws(() => buildAuditFilter({ from: 'not-a-date' }), (error) => error.code === 'VALIDATION_ERROR');
});

test('serializes redacted audit rows as injection-safe and correctly escaped CSV', () => {
  const csv = serializeAuditCsv([{ createdAt: '2026-07-22T10:00:00Z', actorUsername: '=root', actorRole: 'super_admin', action: 'TEST', targetType: 'user', targetId: 'u-1', reason: 'said "hello", then left', requestId: 'r1', before: { token: '[REDACTED]' }, after: { ok: true } }]);
  assert.match(csv, /^createdAt,actorUsername/);
  assert.match(csv, /"'=root"/);
  assert.match(csv, /"said ""hello"", then left"/);
  assert.equal(csv.includes('[REDACTED]'), true);
});

test('analyst audit rows omit network-identifying fields', () => {
  const [row] = sanitizeAuditRowsForRole([{ action: 'TEST', ip: '127.0.0.1', userAgent: 'private agent' }], 'analyst');
  assert.equal(row.action, 'TEST');
  assert.equal(row.ip, undefined);
  assert.equal(row.userAgent, undefined);
});

test('audit pagination uses a deterministic createdAt and id order', async () => {
  let sortValue;
  const chain = {
    populate() { return this; },
    sort(value) { sortValue = value; return this; },
    skip() { return this; },
    limit() { return this; },
    lean: async () => [],
  };
  await queryAuditLogs({ AuditLogModel: { find: () => chain, countDocuments: async () => 0 } });
  assert.deepEqual(sortValue, { createdAt: -1, _id: -1 });
});
