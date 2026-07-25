const test = require('node:test');
const assert = require('node:assert/strict');

const { createPlayerReport, transitionModerationCase, applyModerationSanction } = require('../services/admin/moderationService');

test('rejects self-reporting before creating a moderation case', async () => {
  await assert.rejects(
    createPlayerReport({ reporterId: 'user-1', input: { targetPlayerId: 'user-1', category: 'spam', description: 'self' } }),
    (error) => error.code === 'VALIDATION_ERROR',
  );
});

test('creates a report and an OPEN case linked to the target player', async () => {
  const report = { _id: 'report-1' };
  let casePayload;
  const result = await createPlayerReport({
    UserModel: { exists: async () => true },
    ReportModel: { countDocuments: async () => 0, create: async () => report },
    ModerationCaseModel: { create: async (value) => { casePayload = value; return { _id: 'case-1', ...value }; } },
    reporterId: 'user-1',
    input: { targetPlayerId: 'user-2', category: 'spam', description: 'Repeated spam' },
  });
  assert.equal(result.report, report);
  assert.equal(result.moderationCase.status, 'OPEN');
  assert.deepEqual(casePayload.reportIds, ['report-1']);
});

test('enforces the moderation case state machine', async () => {
  const before = { _id: 'case-1', status: 'OPEN', __v: 1 };
  await assert.rejects(
    transitionModerationCase({ ModerationCaseModel: { findById: async () => before }, audit: async () => {}, actor: { id: 'admin-1' }, caseId: 'case-1', input: { status: 'RESOLVED' }, mutation: { requestId: 'r1', reason: 'skip' } }),
    (error) => error.code === 'STATE_CONFLICT',
  );
});

test('applies a temporary suspension without permanently banning the player', async () => {
  const before = { _id: 'user-2', isBanned: false, suspendedUntil: null, warningCount: 0, __v: 3 };
  let update;
  const UserModel = { findById: async () => before, findOneAndUpdate: async (_filter, value) => { update = value; return { ...before, ...value.$set, __v: 4 }; } };
  const result = await applyModerationSanction({
    UserModel,
    ModerationCaseModel: { findById: async () => ({ _id: 'case-1', targetPlayerId: 'user-2' }), findByIdAndUpdate: async () => {} },
    audit: async () => {},
    actor: { id: 'admin-1', username: 'mod', role: 'moderator' },
    caseId: 'case-1',
    input: { type: 'suspension', expiresAt: '2027-02-10T00:00:00Z' },
    mutation: { requestId: 'sanction-1', reason: 'Repeated abuse' },
    now: new Date('2027-02-01T00:00:00Z'),
  });
  assert.equal(update.$set.isBanned, false);
  assert.equal(update.$set.suspendedUntil.toISOString(), '2027-02-10T00:00:00.000Z');
  assert.equal(result.suspendedUntil.toISOString(), '2027-02-10T00:00:00.000Z');
});
